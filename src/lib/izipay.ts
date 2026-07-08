import { createHash, createHmac, timingSafeEqual } from 'crypto'

const DEFAULT_API_BASE_URL = 'https://api.micuentaweb.pe/api-payment'
const DEFAULT_KR_PAYMENT_FORM_JS_URL =
  'https://static.micuentaweb.pe/static/js/krypton-client/V4.0/stable/kr-payment-form.min.js'
const DEFAULT_KR_CLASSIC_CSS_URL =
  'https://static.micuentaweb.pe/static/js/krypton-client/V4.0/ext/classic.css'
const DEFAULT_KR_CLASSIC_JS_URL =
  'https://static.micuentaweb.pe/static/js/krypton-client/V4.0/ext/classic.js'

export type IzipayOrderStatus = 'PAID' | 'UNPAID' | 'RUNNING' | 'CANCELLED' | 'UNKNOWN'

type IzipayKryptonConfig = {
  env: string
  apiBaseUrl: string
  username: string
  password: string
  publicKey: string
  hmacKey: string
  krPaymentFormJsUrl: string
  krClassicCssUrl: string
  krClassicJsUrl: string
  returnUrl: string
  webhookUrl: string
  currency: string
}

type IzipayConfigResult = {
  config: IzipayKryptonConfig | null
  missing: string[]
}

function clean(value?: string | null) {
  if (typeof value !== 'string') return ''
  return value.trim()
}

function firstDefined(...values: Array<string | undefined | null>) {
  for (const value of values) {
    const parsed = clean(value)
    if (parsed) return parsed
  }
  return ''
}

function toIsoCurrency(value: string) {
  const sanitized = clean(value).toUpperCase()
  return sanitized || 'PEN'
}

function getPublicBaseUrl() {
  return firstDefined(process.env.IZIPAY_PUBLIC_BASE_URL, process.env.NEXT_PUBLIC_SERVER_URL)
}

function getDefaultReturnUrl() {
  const baseUrl = getPublicBaseUrl()
  if (!baseUrl) return ''

  try {
    const parsed = new URL(baseUrl)
    parsed.pathname = '/confirmacion'
    parsed.search = ''
    parsed.hash = ''
    return parsed.toString()
  } catch {
    return ''
  }
}

function getDefaultWebhookUrl() {
  const baseUrl = getPublicBaseUrl()
  if (!baseUrl) return ''

  try {
    const parsed = new URL(baseUrl)
    parsed.pathname = '/api/payments/izipay/webhook'
    parsed.search = ''
    parsed.hash = ''
    return parsed.toString()
  } catch {
    return ''
  }
}

/**
 * Lee configuracion Micuentaweb/Krypton REST V4.
 * IZIPAY_PUBLIC_KEY es la clave publica de test/produccion (no secreta, se envia al cliente
 * via respuesta del endpoint de sesion, nunca embebida en el bundle build-time).
 */
export function getIzipayKryptonConfig(): IzipayConfigResult {
  const config: IzipayKryptonConfig = {
    env: firstDefined(process.env.IZIPAY_ENV, 'sandbox'),
    apiBaseUrl: firstDefined(process.env.IZIPAY_API_BASE_URL, DEFAULT_API_BASE_URL),
    username: firstDefined(process.env.IZIPAY_API_USERNAME),
    password: firstDefined(process.env.IZIPAY_API_PASSWORD),
    publicKey: firstDefined(process.env.IZIPAY_PUBLIC_KEY, process.env.NEXT_PUBLIC_IZIPAY_PUBLIC_KEY),
    hmacKey: firstDefined(process.env.IZIPAY_HMAC_SHA256_KEY),
    krPaymentFormJsUrl: firstDefined(process.env.IZIPAY_KR_PAYMENT_FORM_JS_URL, DEFAULT_KR_PAYMENT_FORM_JS_URL),
    krClassicCssUrl: firstDefined(process.env.IZIPAY_KR_CLASSIC_CSS_URL, DEFAULT_KR_CLASSIC_CSS_URL),
    krClassicJsUrl: firstDefined(process.env.IZIPAY_KR_CLASSIC_JS_URL, DEFAULT_KR_CLASSIC_JS_URL),
    returnUrl: firstDefined(process.env.IZIPAY_RETURN_URL, getDefaultReturnUrl()),
    webhookUrl: firstDefined(process.env.IZIPAY_WEBHOOK_URL, getDefaultWebhookUrl()),
    currency: toIsoCurrency(firstDefined(process.env.IZIPAY_CURRENCY, 'PEN')),
  }

  const missing: string[] = []
  if (!config.apiBaseUrl) missing.push('IZIPAY_API_BASE_URL')
  if (!config.username) missing.push('IZIPAY_API_USERNAME')
  if (!config.password) missing.push('IZIPAY_API_PASSWORD')
  if (!config.publicKey) missing.push('IZIPAY_PUBLIC_KEY')
  if (!config.hmacKey) missing.push('IZIPAY_HMAC_SHA256_KEY')
  if (!config.returnUrl) missing.push('IZIPAY_RETURN_URL')
  if (!config.webhookUrl) missing.push('IZIPAY_WEBHOOK_URL')

  return { config: missing.length > 0 ? null : config, missing }
}

/** Micuentaweb/Krypton espera el monto en la unidad minima de la moneda (centavos para PEN). */
export function toIzipayMinorUnits(value: number) {
  if (!Number.isFinite(value)) return 0
  return Math.round(value * 100)
}

export function pickFirstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }
  return ''
}

export function safeObject(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null) return {}
  return value as Record<string, unknown>
}

export function safeArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

/**
 * orderStatus es el campo autoritativo de Krypton (kr-answer.orderStatus).
 * Confirmar contra documentacion oficial en fase 6C el set completo de valores en vivo;
 * PAID/UNPAID/RUNNING/CANCELLED son los documentados publicamente para la familia Lyra/Micuentaweb V4.
 */
export function mapOrderStatus(raw: unknown): IzipayOrderStatus {
  const value = typeof raw === 'string' ? raw.toUpperCase().trim() : ''
  if (value === 'PAID') return 'PAID'
  if (value === 'UNPAID') return 'UNPAID'
  if (value === 'RUNNING') return 'RUNNING'
  if (value === 'CANCELLED' || value === 'CANCELED' || value === 'ABANDONED') return 'CANCELLED'
  return 'UNKNOWN'
}

export function getBasicAuthHeader(username: string, password: string) {
  const token = Buffer.from(`${username}:${password}`).toString('base64')
  return `Basic ${token}`
}

export function mergePaymentPayload(currentPayload: unknown, patch: Record<string, unknown>) {
  const base = safeObject(currentPayload)
  return {
    ...base,
    ...patch,
  }
}

function safeCompareStrings(left: string, right: string) {
  const leftBuffer = Buffer.from(left, 'utf8')
  const rightBuffer = Buffer.from(right, 'utf8')
  if (leftBuffer.length !== rightBuffer.length) return false
  return timingSafeEqual(leftBuffer, rightBuffer)
}

/**
 * Valida kr-hash: HMAC-SHA256 del texto literal de kr-answer usando la clave HMAC-SHA-256
 * (test o produccion) configurada en el Back Office Vendedor.
 */
export function verifyKrHash({
  krAnswer,
  krHash,
  hmacKey,
}: {
  krAnswer: string
  krHash: string
  hmacKey: string
}) {
  if (!krAnswer || !krHash || !hmacKey) return false

  const expectedHex = createHmac('sha256', hmacKey).update(krAnswer, 'utf8').digest('hex')
  return safeCompareStrings(krHash.trim().toLowerCase(), expectedHex.toLowerCase())
}

/** Idempotencia de IPN: prioriza el uuid de transaccion Krypton; cae a hash del par (kr-hash, kr-answer). */
export function buildKrEventKey({
  transactionUuid,
  krHash,
  krAnswer,
}: {
  transactionUuid: string
  krHash: string
  krAnswer: string
}) {
  const explicit = clean(transactionUuid)
  if (explicit) return `izipay-kr:${explicit}`

  const hashSource = krHash || krAnswer
  if (!hashSource) return `izipay-kr:no-signature`

  return `izipay-kr:${createHash('sha256').update(hashSource).digest('hex').slice(0, 24)}`
}

export function safeJsonParse(value: unknown) {
  if (typeof value !== 'string') return null
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}
