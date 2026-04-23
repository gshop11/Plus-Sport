const DATABASE_ENV_KEYS = [
  'DATABASE_URI',
  'DATABASE_URL_UNPOOLED',
  'POSTGRES_URL_NON_POOLING',
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

export function getDatabaseUri() {
  return getFirstDefinedEnv(DATABASE_ENV_KEYS)
}

export function getPayloadSecret() {
  const secret = process.env.PAYLOAD_SECRET?.trim()

  if (secret) return secret

  if (process.env.NODE_ENV === 'production') {
    throw new Error('Missing required environment variable: PAYLOAD_SECRET')
  }

  return 'development-payload-secret-change-before-production'
}

export function shouldPushPayloadSchema() {
  return parseBooleanEnv(process.env.PAYLOAD_DB_PUSH, process.env.NODE_ENV !== 'production')
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
