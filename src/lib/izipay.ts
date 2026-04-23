import { createHmac, timingSafeEqual } from 'crypto'

const DEFAULT_IZIPAY_SANDBOX_SCRIPT_URL = 'https://sandbox-checkout.izipay.pe/payments/v1/js/index.js'

export type IzipayVisualStatus = 'success' | 'failed' | 'cancelled' | 'unknown'

type IzipayConfigResult = {
  config: {
    env: string
    sessionTokenUrl: string
    username: string
    password: string
    merchantCode: string
    keyRSA: string
    hashKey: string
    scriptUrl: string
    returnUrl: string
    webhookUrl: string
    currency: string
  } | null
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
  return firstDefined(
    process.env.IZIPAY_PUBLIC_BASE_URL,
    process.env.NEXT_PUBLIC_SERVER_URL,
  )
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

export function getIzipaySandboxConfig(): IzipayConfigResult {
  const sessionTokenUrl = firstDefined(
    process.env.IZIPAY_SESSION_TOKEN_URL,
    process.env.IZIPAY_SESSION_URL,
  )

  const config = {
    env: firstDefined(process.env.IZIPAY_ENV, 'sandbox'),
    sessionTokenUrl,
    username: firstDefined(process.env.IZIPAY_API_USERNAME, process.env.IZIPAY_USERNAME),
    password: firstDefined(process.env.IZIPAY_API_PASSWORD, process.env.IZIPAY_PASSWORD),
    merchantCode: firstDefined(process.env.IZIPAY_MERCHANT_CODE),
    keyRSA: firstDefined(process.env.IZIPAY_KEY_RSA, process.env.IZIPAY_PUBLIC_KEY),
    hashKey: firstDefined(process.env.IZIPAY_HASH_KEY, process.env.IZIPAY_HMAC_KEY),
    scriptUrl: firstDefined(process.env.IZIPAY_CHECKOUT_JS_URL, DEFAULT_IZIPAY_SANDBOX_SCRIPT_URL),
    returnUrl: firstDefined(process.env.IZIPAY_RETURN_URL, getDefaultReturnUrl()),
    webhookUrl: firstDefined(process.env.IZIPAY_WEBHOOK_URL, getDefaultWebhookUrl()),
    currency: toIsoCurrency(firstDefined(process.env.IZIPAY_CURRENCY, 'PEN')),
  }

  const missing: string[] = []

  if (!config.sessionTokenUrl) missing.push('IZIPAY_SESSION_TOKEN_URL')
  if (!config.username) missing.push('IZIPAY_API_USERNAME')
  if (!config.password) missing.push('IZIPAY_API_PASSWORD')
  if (!config.merchantCode) missing.push('IZIPAY_MERCHANT_CODE')
  if (!config.keyRSA) missing.push('IZIPAY_KEY_RSA')
  if (!config.returnUrl) missing.push('IZIPAY_RETURN_URL')
  if (!config.webhookUrl) missing.push('IZIPAY_WEBHOOK_URL')

  return {
    config: missing.length > 0 ? null : config,
    missing,
  }
}

export function formatIzipayDateTime(date = new Date()) {
  const yyyy = date.getFullYear().toString()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const hh = String(date.getHours()).padStart(2, '0')
  const mi = String(date.getMinutes()).padStart(2, '0')
  const ss = String(date.getSeconds()).padStart(2, '0')
  return `${yyyy}${mm}${dd}${hh}${mi}${ss}`
}

export function toIzipayAmount(value: number) {
  if (!Number.isFinite(value)) return '0.00'
  return Number(value).toFixed(2)
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

export function mapVisualStatus(rawStatus: unknown): IzipayVisualStatus {
  const source =
    typeof rawStatus === 'string'
      ? rawStatus.toLowerCase()
      : JSON.stringify(rawStatus || '').toLowerCase()

  if (
    source.includes('authorised') ||
    source.includes('authorized') ||
    source.includes('captured') ||
    source.includes('"00"') ||
    source.includes('operacion exitosa') ||
    source.includes('successful')
  ) {
    return 'success'
  }

  if (
    source.includes('cancel') ||
    source.includes('anulad') ||
    source.includes('abort')
  ) {
    return 'cancelled'
  }

  if (
    source.includes('refused') ||
    source.includes('deneg') ||
    source.includes('rechaz') ||
    source.includes('failed') ||
    source.includes('error')
  ) {
    return 'failed'
  }

  return 'unknown'
}

export function getBasicAuthHeader(username: string, password: string) {
  const token = Buffer.from(`${username}:${password}`).toString('base64')
  return `Basic ${token}`
}

export function mergePaymentPayload(
  currentPayload: unknown,
  patch: Record<string, unknown>,
) {
  const base = safeObject(currentPayload)
  return {
    ...base,
    ...patch,
  }
}

function normalizeSignatureValue(value: string) {
  return value
    .trim()
    .replace(/^sha256=/i, '')
    .replace(/^hmacsha256=/i, '')
    .replace(/\s+/g, '')
}

function normalizeBase64(value: string) {
  return value.replace(/-/g, '+').replace(/_/g, '/')
}

function safeCompareStrings(left: string, right: string) {
  const leftBuffer = Buffer.from(left, 'utf8')
  const rightBuffer = Buffer.from(right, 'utf8')
  if (leftBuffer.length !== rightBuffer.length) return false
  return timingSafeEqual(leftBuffer, rightBuffer)
}

export function verifyIzipaySignature({
  payloadHttp,
  signature,
  hashKey,
}: {
  payloadHttp: string
  signature: string
  hashKey: string
}) {
  const normalizedSignature = normalizeSignatureValue(signature)
  if (!payloadHttp || !normalizedSignature || !hashKey) return false

  const expectedHex = createHmac('sha256', hashKey).update(payloadHttp, 'utf8').digest('hex')
  const expectedHexUpper = expectedHex.toUpperCase()
  const expectedBase64 = createHmac('sha256', hashKey).update(payloadHttp, 'utf8').digest('base64')
  const expectedBase64Url = expectedBase64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')

  const normalizedLower = normalizedSignature.toLowerCase()
  const normalizedUpper = normalizedSignature.toUpperCase()
  const normalizedBase64 = normalizeBase64(normalizedSignature)

  return (
    safeCompareStrings(normalizedLower, expectedHex) ||
    safeCompareStrings(normalizedUpper, expectedHexUpper) ||
    safeCompareStrings(normalizedBase64, expectedBase64) ||
    safeCompareStrings(normalizedSignature, expectedBase64Url)
  )
}

export function safeJsonParse(value: unknown) {
  if (typeof value !== 'string') return null
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}
