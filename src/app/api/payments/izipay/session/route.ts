import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { getPayload } from 'payload'
import config from '@payload-config'
import {
  formatIzipayDateTime,
  getBasicAuthHeader,
  getIzipaySandboxConfig,
  mergePaymentPayload,
  pickFirstString,
  safeObject,
  toIzipayAmount,
} from '@/lib/izipay'

type SessionRequest = {
  orderRef?: string
  orderId?: string
}

function asCleanString(value: unknown) {
  if (typeof value !== 'string') return ''
  return value.trim()
}

function sanitizeOrder(order: any) {
  return {
    id: order.id,
    numeroPedido: order.numeroPedido,
    codigoCorrelacion: order.codigoCorrelacion,
    total: order.total,
    estadoPago: order.estadoPago,
    paymentProvider: order.paymentProvider,
    paymentMethod: order.paymentMethod,
    transactionId: order.transactionId,
    externalOrderId: order.externalOrderId,
    paymentReference: order.paymentReference,
  }
}

async function findOrder(payload: any, input: SessionRequest) {
  const orderRef = asCleanString(input.orderRef)
  const orderId = asCleanString(input.orderId)

  if (orderRef) {
    try {
      const found = await payload.find({
        collection: 'ordenes',
        where: {
          or: [
            { codigoCorrelacion: { equals: orderRef } },
            { numeroPedido: { equals: orderRef } },
          ],
        },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      })

      if (found.docs[0]) return found.docs[0]
    } catch {
      // If local schema is outdated, continue with ID fallback.
    }
  }

  if (orderId) {
    try {
      return await payload.findByID({
        collection: 'ordenes',
        id: orderId,
        depth: 0,
        overrideAccess: true,
      })
    } catch {
      return null
    }
  }

  return null
}

function buildFallbackEmail(order: any) {
  const cleanedName = asCleanString(order?.nombreCliente)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
  const suffix = cleanedName || `cliente${Date.now()}`
  return `${suffix}@local.invalid`
}

function buildCheckoutConfig({
  merchantCode,
  transactionId,
  externalOrderId,
  amount,
  currency,
  buyerId,
  customer,
}: {
  merchantCode: string
  transactionId: string
  externalOrderId: string
  amount: string
  currency: string
  buyerId: string
  customer: {
    firstName: string
    lastName: string
    email: string
    phoneNumber: string
    street: string
    city: string
    state: string
    country: string
    postalCode: string
    documentType: string
    document: string
  }
}) {
  return {
    transactionId,
    action: 'pay',
    merchantCode,
    order: {
      orderNumber: externalOrderId,
      currency,
      amount,
      processType: 'AT',
      merchantBuyerId: buyerId,
      dateTimeTransaction: formatIzipayDateTime(),
    },
    billing: customer,
    shipping: customer,
  }
}

async function parseJsonSafe(response: Response) {
  const rawText = await response.text()
  try {
    return {
      rawText,
      data: JSON.parse(rawText),
    }
  } catch {
    return {
      rawText,
      data: null,
    }
  }
}

export async function POST(request: Request) {
  const { config: izipayConfig, missing } = getIzipaySandboxConfig()

  if (!izipayConfig) {
    return NextResponse.json(
      {
        error: 'Faltan variables de entorno para Izipay sandbox.',
        missing,
      },
      { status: 500 },
    )
  }

  let body: SessionRequest
  try {
    body = (await request.json()) as SessionRequest
  } catch {
    return NextResponse.json({ error: 'Body JSON invalido.' }, { status: 400 })
  }

  try {
    const payload = await getPayload({ config })
    const order = await findOrder(payload, body)

    if (!order) {
      return NextResponse.json({ error: 'Orden no encontrada.' }, { status: 404 })
    }

    if (order.estadoComercial === 'cancelado') {
      return NextResponse.json({ error: 'No se puede iniciar pago para una orden cancelada.' }, { status: 400 })
    }

    const total = Number(order.total || 0)
    if (!Number.isFinite(total) || total <= 0) {
      return NextResponse.json({ error: 'La orden tiene un monto total invalido.' }, { status: 400 })
    }

    const clienteId =
      typeof order.cliente === 'object' && order.cliente
        ? String((order.cliente as any).id || '')
        : asCleanString(order.cliente)

    let cliente: any = null
    if (clienteId) {
      try {
        cliente = await payload.findByID({
          collection: 'clientes',
          id: clienteId,
          depth: 0,
          overrideAccess: true,
        })
      } catch {
        cliente = null
      }
    }

    const transactionId = `IZI-${Date.now()}-${randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase()}`
    const externalOrderId = asCleanString(order.numeroPedido) || asCleanString(order.codigoCorrelacion) || `PS-${order.id}`
    const paymentReference = asCleanString(order.codigoCorrelacion) || externalOrderId

    const fullName = asCleanString(order.nombreCliente) || asCleanString(cliente?.nombre) || 'Cliente PlusSport'
    const [firstNameRaw, ...rest] = fullName.split(' ')
    const firstName = firstNameRaw || 'Cliente'
    const lastName = rest.join(' ') || 'PlusSport'
    const email = asCleanString(cliente?.email) || buildFallbackEmail(order)
    const phoneNumber = asCleanString(order.telefono) || asCleanString(cliente?.telefono) || '999999999'
    const street = asCleanString(order?.direccionEnvio?.calle) || 'Sin direccion'
    const city = asCleanString(order?.direccionEnvio?.ciudad) || 'Lima'
    const state = city
    const postalCode = '15000'
    const document = asCleanString(cliente?.documento) || '00000000'

    const checkoutConfig = buildCheckoutConfig({
      merchantCode: izipayConfig.merchantCode,
      transactionId,
      externalOrderId,
      amount: toIzipayAmount(total),
      currency: izipayConfig.currency,
      buyerId: clienteId || asCleanString(order.id),
      customer: {
        firstName,
        lastName,
        email,
        phoneNumber,
        street,
        city,
        state,
        country: 'PE',
        postalCode,
        documentType: 'DNI',
        document,
      },
    })

    const authHeader = getBasicAuthHeader(izipayConfig.username, izipayConfig.password)

    const izipayResponse = await fetch(izipayConfig.sessionTokenUrl, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(checkoutConfig),
      cache: 'no-store',
      signal: AbortSignal.timeout(25000),
    })

    const { data: responseBody, rawText } = await parseJsonSafe(izipayResponse)
    const safeResponse = safeObject(responseBody)
    const answer = safeObject(safeResponse.answer)
    const nestedResponse = safeObject(safeResponse.response)

    const sessionToken = pickFirstString(
      safeResponse.token,
      safeResponse.authorization,
      safeResponse.sessionToken,
      answer.token,
      answer.authorization,
      answer.sessionToken,
      nestedResponse.token,
      nestedResponse.authorization,
    )

    const visualCode = pickFirstString(
      safeResponse.code,
      answer.code,
      nestedResponse.code,
    )

    const visualMessage = pickFirstString(
      safeResponse.message,
      answer.message,
      nestedResponse.message,
      safeResponse.messageUser,
      answer.messageUser,
    )

    if (!izipayResponse.ok || !sessionToken) {
      await payload.update({
        collection: 'ordenes',
        id: order.id,
        overrideAccess: true,
        data: {
          paymentProvider: 'izipay_sandbox',
          paymentMethod: 'tarjeta',
          transactionId,
          externalOrderId,
          paymentReference,
          estadoPago: 'pending',
          paymentErrorCode: visualCode || String(izipayResponse.status),
          paymentErrorMessage:
            visualMessage ||
            'No se pudo generar token de sesion Izipay.',
          paymentPayload: mergePaymentPayload(order.paymentPayload, {
            izipay: {
              lastSessionAttemptAt: new Date().toISOString(),
              sessionHttpStatus: izipayResponse.status,
              sessionResponseCode: visualCode || null,
              sessionResponseMessage: visualMessage || null,
            },
          }),
        },
      })

      return NextResponse.json(
        {
          error: 'Izipay sandbox no devolvio token de sesion.',
          status: izipayResponse.status,
          details: visualMessage || 'Revisa credenciales y payload de sesion.',
          providerCode: visualCode || null,
          providerResponse: rawText.slice(0, 800),
        },
        { status: 502 },
      )
    }

    const updatedOrder = await payload.update({
      collection: 'ordenes',
      id: order.id,
      overrideAccess: true,
      data: {
        paymentProvider: 'izipay_sandbox',
        paymentMethod: 'tarjeta',
        transactionId,
        externalOrderId,
        paymentReference,
        estadoPago: 'pending',
        paymentErrorCode: '',
        paymentErrorMessage: '',
        paymentPayload: mergePaymentPayload(order.paymentPayload, {
          izipay: {
            lastSessionAttemptAt: new Date().toISOString(),
            sessionHttpStatus: izipayResponse.status,
            sessionResponseCode: visualCode || null,
            sessionResponseMessage: visualMessage || null,
          },
        }),
      },
    })

    return NextResponse.json(
      {
        success: true,
        order: sanitizeOrder(updatedOrder),
        session: {
          env: izipayConfig.env,
          scriptUrl: izipayConfig.scriptUrl,
          authorization: sessionToken,
          keyRSA: izipayConfig.keyRSA,
          returnUrl: izipayConfig.returnUrl,
          webhookUrl: izipayConfig.webhookUrl,
          config: checkoutConfig,
        },
      },
      { status: 200 },
    )
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Error preparando sesion Izipay.',
        details: (error as Error).message,
      },
      { status: 500 },
    )
  }
}
