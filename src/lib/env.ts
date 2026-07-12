// Prioridad de runtime: primero la variable explicita del proyecto y luego
// las variantes POOLED del proveedor. Los endpoints directos (unpooled) quedan
// como ultimo recurso: en serverless cada lambda abre su propio pool y el
// endpoint directo de Neon se satura ("remaining connection slots are reserved").
const DATABASE_ENV_KEYS = [
  'DATABASE_URI',
  'DATABASE_URL',
  'POSTGRES_URL',
  'DATABASE_URL_UNPOOLED',
  'POSTGRES_URL_NON_POOLING',
] as const

// Para migraciones se prefiere el endpoint DIRECTO (sin PgBouncer): DDL y
// advisory locks de drizzle no deben pasar por el pooler en modo transaccion.
const MIGRATION_DATABASE_ENV_KEYS = [
  'DATABASE_URI_MIGRATIONS',
  'POSTGRES_URL_NON_POOLING',
  'DATABASE_URL_UNPOOLED',
  'DATABASE_URI',
  'DATABASE_URL',
] as const

const PRODUCTION_SECRET_MIN_LENGTH = 32

function getFirstDefinedEnv(keys: readonly string[]) {
  for (const key of keys) {
    const value = process.env[key]?.trim()
    if (value) return value
  }

  return undefined
}

function parseBooleanEnv(value: string | undefined, defaultValue: boolean) {
  if (value === undefined || value === '') return defaultValue

  return value.toLowerCase() === 'true'
}

function isPostgresConnectionString(value: string) {
  return value.startsWith('postgres://') || value.startsWith('postgresql://')
}

function isPlaceholderSecret(value: string) {
  const normalized = value.toLowerCase()

  return (
    normalized.includes('cambia-esto') ||
    normalized.includes('change-this') ||
    normalized.includes('placeholder') ||
    normalized.includes('fallback') ||
    normalized === 'changeme' ||
    normalized === 'change-me'
  )
}

function assertAbsoluteUrl(value: string, variableName: string, errors: string[]) {
  try {
    const parsed = new URL(value)

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      errors.push(`${variableName} must use http:// or https://`)
    }
  } catch {
    errors.push(`${variableName} must be an absolute URL`)
  }
}

function isNeonHost(hostname: string) {
  return hostname.endsWith('.neon.tech')
}

// Reescribe un endpoint directo de Neon a su endpoint pooler (PgBouncer).
// Solo se aplica en runtime de Vercel; las migraciones y el uso local
// conservan el endpoint original. Opt-out: PG_DISABLE_POOLER_REWRITE=true.
function preferNeonPooler(connectionString: string) {
  if (process.env.VERCEL !== '1') return connectionString
  if (process.env.PG_DISABLE_POOLER_REWRITE?.trim().toLowerCase() === 'true') return connectionString

  try {
    const url = new URL(connectionString)
    if (!isNeonHost(url.hostname)) return connectionString

    const [endpoint, ...rest] = url.hostname.split('.')
    if (endpoint.endsWith('-pooler')) return connectionString

    url.hostname = [`${endpoint}-pooler`, ...rest].join('.')
    return url.toString()
  } catch {
    return connectionString
  }
}

// Hace explicito el modo SSL seguro. En pg v8 'require' ya se comporta como
// 'verify-full'; se fija verify-full para no depender de ese alias y para
// cumplir la politica de SSL del proyecto. Nunca degrada un modo existente.
function enforceVerifyFullSsl(connectionString: string) {
  try {
    const url = new URL(connectionString)
    if (!isNeonHost(url.hostname)) return connectionString

    const current = url.searchParams.get('sslmode')
    if (!current || current === 'require' || current === 'prefer' || current === 'verify-ca') {
      url.searchParams.set('sslmode', 'verify-full')
      url.searchParams.delete('channel_binding')
    }
    return url.toString()
  } catch {
    return connectionString
  }
}

function normalizeRuntimeConnectionString(value: string) {
  if (!isPostgresConnectionString(value)) return value
  return enforceVerifyFullSsl(preferNeonPooler(value))
}

export function getDatabaseUri() {
  const value = getFirstDefinedEnv(DATABASE_ENV_KEYS)
  return value ? normalizeRuntimeConnectionString(value) : value
}

export function getMigrationDatabaseUri() {
  const value = getFirstDefinedEnv(MIGRATION_DATABASE_ENV_KEYS)
  if (!value) return value
  return isPostgresConnectionString(value) ? enforceVerifyFullSsl(value) : value
}

export function getPayloadSecret() {
  const secret = process.env.PAYLOAD_SECRET?.trim()

  if (secret) return secret

  if (process.env.NODE_ENV === 'production') {
    throw new Error('Missing required environment variable: PAYLOAD_SECRET')
  }

  return 'development-payload-secret-change-before-production'
}

// Push de esquema (drizzle push) siempre opt-in: puede generar cambios
// destructivos o prompts interactivos. El flujo oficial son migraciones
// versionadas (payload migrate).
export function shouldPushPayloadSchema() {
  return parseBooleanEnv(process.env.PAYLOAD_DB_PUSH, false)
}

const DEFAULT_PG_POOL_MAX = 5

export function getPgPoolOptions() {
  const parsed = Number.parseInt(process.env.PG_POOL_MAX ?? '', 10)
  const max = Number.isInteger(parsed) && parsed > 0 && parsed <= 20 ? parsed : DEFAULT_PG_POOL_MAX

  return {
    max,
    idleTimeoutMillis: 20_000,
    connectionTimeoutMillis: 15_000,
  }
}

export function validateServerEnv() {
  if (process.env.NODE_ENV !== 'production') return

  const errors: string[] = []
  const databaseUri = getDatabaseUri()
  const payloadSecret = process.env.PAYLOAD_SECRET?.trim()
  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL?.trim()

  if (!payloadSecret) {
    errors.push('PAYLOAD_SECRET is required in production')
  } else {
    if (payloadSecret.length < PRODUCTION_SECRET_MIN_LENGTH) {
      errors.push(`PAYLOAD_SECRET must be at least ${PRODUCTION_SECRET_MIN_LENGTH} characters in production`)
    }

    if (isPlaceholderSecret(payloadSecret)) {
      errors.push('PAYLOAD_SECRET cannot be a placeholder value in production')
    }
  }

  if (!serverUrl) {
    errors.push('NEXT_PUBLIC_SERVER_URL is required in production')
  } else {
    assertAbsoluteUrl(serverUrl, 'NEXT_PUBLIC_SERVER_URL', errors)
  }

  if (!databaseUri) {
    errors.push(`One PostgreSQL connection variable is required in production: ${DATABASE_ENV_KEYS.join(', ')}`)
  } else if (!isPostgresConnectionString(databaseUri)) {
    errors.push('DATABASE_URI must be a PostgreSQL connection string in production')
  }

  if (errors.length > 0) {
    throw new Error(`Invalid production environment:\n- ${errors.join('\n- ')}`)
  }
}
