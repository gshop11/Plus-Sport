import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import {
  getBasicAuthHeader,
  getIzipayKryptonConfig,
  mergePaymentPayload,
  pickFirstString,
  safeObject,
  toIzipayMinorUnits,
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

/**
 * Payload de POST /V4/Charge/CreatePayment.
 * Estructura de customer.billingDetails/shippingDetails basada en documentacion publica
 * Lyra/Micuentaweb REST V4; verificar nombres exactos de sub-campos contra la doc oficial
 * vigente en fase 6C antes de la primera prueba sandbox real.
 */
function buildCreatePaymentPayload({
  orderId,
  amount,
  currency,
  customer,
}: {
  orderId: string
  amount: number
  currency: string
  customer: {
    email: string
    reference: string
    firstName: string
    lastName: string
    phoneNumber: string
    street: string
    city: string
    country: string
    postalCode: string
    documentType: string
    document: string
  }
}) {
  return {
    amount,
    currency,
    orderId,
    formAction: 'PAYMENT',
    customer: {
      email: customer.email,
      reference: customer.reference,
      billingDetails: {
        firstName: customer.firstName,
        lastName: customer.lastName,
        phoneNumber: customer.phoneNumber,
        address: customer.street,
        city: customer.city,
        country: customer.country,
        zipCode: customer.postalCode,
        identityCode: customer.document,
        identityType: customer.documentType,
      },
      shippingDetails: {
        firstName: customer.firstName,
        lastName: customer.lastName,
        address: customer.street,
        city: customer.city,
        country: customer.country,
        zipCode: customer.postalCode,
      },
    },
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
  const { config: izipayConfig, missing } = getIzipayKryptonConfig()

  if (!izipayConfig) {
    return NextResponse.json(
      {
        error: 'Faltan variables de entorno para Izipay Krypton (Micuentaweb REST V4).',
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
    const postalCode = '15000'
    const document = asCleanString(cliente?.documento) || '00000000'

    const amount = toIzipayMinorUnits(total)

    const createPaymentPayload = buildCreatePaymentPayload({
      orderId: paymentReference,
      amount,
      currency: izipayConfig.currency,
      customer: {
        email,
        reference: clienteId || asCleanString(order.id),
        firstName,
        lastName,
        phoneNumber,
        street,
        city,
        country: 'PE',
        postalCode,
        documentType: 'DNI',
        document,
      },
    })

    const authHeader = getBasicAuthHeader(izipayConfig.username, izipayConfig.password)

    const izipayResponse = await fetch(`${izipayConfig.apiBaseUrl}/V4/Charge/CreatePayment`, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(createPaymentPayload),
      cache: 'no-store',
      signal: AbortSignal.timeout(25000),
    })

    const { data: responseBody, rawText } = await parseJsonSafe(izipayResponse)
    const safeResponse = safeObject(responseBody)
    const answer = safeObject(safeResponse.answer)

    const status = pickFirstString(safeResponse.status)
    const formToken = pickFirstString(answer.formToken, safeResponse.formToken)
    const errorCode = pickFirstString(safeResponse.errorCode, answer.errorCode)
    const errorMessage = pickFirstString(
      safeResponse.errorMessage,
      answer.errorMessage,
      safeResponse.errorMessageUser,
      answer.errorMessageUser,
    )

    if (!izipayResponse.ok || status !== 'SUCCESS' || !formToken) {
      await payload.update({
        collection: 'ordenes',
        id: order.id,
        overrideAccess: true,
        data: {
          paymentProvider: 'izipay_krypton',
          paymentMethod: 'tarjeta',
          externalOrderId,
          paymentReference,
          estadoPago: 'pending',
          paymentErrorCode: errorCode || String(izipayResponse.status),
          paymentErrorMessage: errorMessage || 'No se pudo generar formToken Krypton (CreatePayment).',
          paymentPayload: mergePaymentPayload(order.paymentPayload, {
            izipay: {
              lastSessionAttemptAt: new Date().toISOString(),
              sessionHttpStatus: izipayResponse.status,
              sessionResponseStatus: status || null,
              sessionErrorCode: errorCode || null,
              sessionErrorMessage: errorMessage || null,
            },
          }),
        },
      })

      return NextResponse.json(
        {
          error: 'Izipay Krypton (CreatePayment) no devolvio formToken.',
          status: izipayResponse.status,
          details: errorMessage || 'Revisa credenciales y payload de CreatePayment.',
          providerCode: errorCode || null,
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
        paymentProvider: 'izipay_krypton',
        paymentMethod: 'tarjeta',
        externalOrderId,
        paymentReference,
        estadoPago: 'pending',
        paymentErrorCode: '',
        paymentErrorMessage: '',
        paymentPayload: mergePaymentPayload(order.paymentPayload, {
          izipay: {
            lastSessionAttemptAt: new Date().toISOString(),
            sessionHttpStatus: izipayResponse.status,
            sessionResponseStatus: status || null,
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
          formToken,
          publicKey: izipayConfig.publicKey,
          krPaymentFormJsUrl: izipayConfig.krPaymentFormJsUrl,
          krClassicCssUrl: izipayConfig.krClassicCssUrl,
          krClassicJsUrl: izipayConfig.krClassicJsUrl,
          returnUrl: izipayConfig.returnUrl,
          webhookUrl: izipayConfig.webhookUrl,
        },
      },
      { status: 200 },
    )
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Error preparando sesion Izipay Krypton.',
        details: (error as Error).message,
      },
      { status: 500 },
    )
  }
}
