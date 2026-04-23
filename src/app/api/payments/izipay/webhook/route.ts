import { createHash } from 'crypto'
import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { mergePaymentPayload, pickFirstString, safeJsonParse, safeObject, verifyIzipaySignature } from '@/lib/izipay'

type ParsedWebhookBody = Record<string, unknown>
type WebhookOutcome = 'paid' | 'failed' | 'canceled' | 'pending'

type CorrelationInput = {
  transactionId: string
  externalOrderId: string
  paymentReference: string
  codigoCorrelacion: string
}

function asCleanString(value: unknown) {
  if (typeof value !== 'string') return ''
  return value.trim()
}

function asLooseString(value: unknown) {
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return ''
}

function toObject(value: unknown) {
  if (typeof value !== 'object' || value === null) return {}
  return value as Record<string, unknown>
}

function parseWebhookBody(rawBody: string): ParsedWebhookBody {
  if (!rawBody.trim()) return {}

  const parsedJson = safeJsonParse(rawBody)
  if (parsedJson && typeof parsedJson === 'object' && !Array.isArray(parsedJson)) {
    return parsedJson as ParsedWebhookBody
  }

  const params = new URLSearchParams(rawBody)
  if (Array.from(params.keys()).length === 0) return {}
  return Object.fromEntries(params.entries())
}

function hashEventSource(input: string) {
  return createHash('sha256').update(input).digest('hex').slice(0, 24)
}

function buildEventKey({
  transactionId,
  signature,
  payloadHttp,
  body,
}: {
  transactionId: string
  signature: string
  payloadHttp: string
  body: ParsedWebhookBody
}) {
  const explicit = pickFirstString(
    body.eventId,
    body.notificationId,
    body.webhookEventId,
    body.id,
  )

  if (explicit) return explicit

  const signaturePart = signature ? hashEventSource(signature) : ''
  const payloadPart = payloadHttp ? hashEventSource(payloadHttp) : ''
  const txPart = transactionId || 'no-tx'
  return `izipay:${txPart}:${signaturePart || payloadPart || 'no-signature'}`
}

function getHashKey() {
  return pickFirstString(process.env.IZIPAY_HASH_KEY, process.env.IZIPAY_HMAC_KEY)
}

function detectOutcome({
  code,
  stateRaw,
}: {
  code: string
  stateRaw: string
}): WebhookOutcome {
  const codeNormalized = code.toLowerCase()
  const state = stateRaw.toLowerCase()
  const source = `${codeNormalized} ${state}`
  const numericCode = Number(codeNormalized)
  const hasNumericCode = Number.isFinite(numericCode) && codeNormalized !== ''

  const isSuccess =
    ['00', '000', '0', 'success', 'ok', 'authorized', 'authorised', 'paid', 'captured', 'aprobado'].includes(codeNormalized) ||
    source.includes('authoriz') ||
    source.includes('captur') ||
    source.includes('paid') ||
    source.includes('operacion exitosa') ||
    source.includes('successful')

  if (isSuccess) return 'paid'

  if (
    source.includes('cancel') ||
    source.includes('anulad') ||
    source.includes('abort') ||
    source.includes('void')
  ) {
    return 'canceled'
  }

  if (
    source.includes('fail') ||
    source.includes('rechaz') ||
    source.includes('deneg') ||
    source.includes('error') ||
    source.includes('refused') ||
    source.includes('declin')
  ) {
    return 'failed'
  }

  if (hasNumericCode && numericCode !== 0) {
    return 'failed'
  }

  return 'pending'
}

function extractCorrelation(body: ParsedWebhookBody, payloadHttpObject: Record<string, unknown>): CorrelationInput {
  const payloadResponse = toObject(payloadHttpObject.response)
  const payloadOrder = Array.isArray(payloadResponse.order) ? toObject(payloadResponse.order[0]) : {}
  const payloadOrderRoot = toObject(payloadHttpObject.order)

  return {
    transactionId: pickFirstString(
      body.transactionId,
      payloadHttpObject.transactionId,
      payloadResponse.transactionId,
      payloadOrder.transactionId,
      payloadOrder.referenceNumber,
    ),
    externalOrderId: pickFirstString(
      body.externalOrderId,
      body.orderNumber,
      payloadOrder.orderNumber,
      payloadOrderRoot.orderNumber,
      payloadOrderRoot.externalOrderId,
      payloadHttpObject.externalOrderId,
    ),
    paymentReference: pickFirstString(
      body.paymentReference,
      body.reference,
      payloadOrder.referenceNumber,
      payloadHttpObject.paymentReference,
      payloadResponse.reference,
    ),
    codigoCorrelacion: pickFirstString(
      body.orderRef,
      body.codigoCorrelacion,
      payloadHttpObject.codigoCorrelacion,
      payloadOrder.codigoCorrelacion,
      payloadResponse.codigoCorrelacion,
    ),
  }
}

async function findOrder(payloadClient: any, correlation: CorrelationInput) {
  const values = Array.from(
    new Set(
      [
        correlation.transactionId,
        correlation.externalOrderId,
        correlation.paymentReference,
        correlation.codigoCorrelacion,
      ].filter(Boolean),
    ),
  )

  if (values.length === 0) return null

  let found: { docs: any[] } = { docs: [] }

  try {
    const conditions: Record<string, unknown>[] = []
    for (const value of values) {
      conditions.push({ transactionId: { equals: value } })
      conditions.push({ externalOrderId: { equals: value } })
      conditions.push({ paymentReference: { equals: value } })
      conditions.push({ codigoCorrelacion: { equals: value } })
      conditions.push({ numeroPedido: { equals: value } })
    }

    found = await payloadClient.find({
      collection: 'ordenes',
      where: { or: conditions },
      limit: 10,
      depth: 1,
      overrideAccess: true,
    })
  } catch {
    // Fallback for local DB schemas not fully updated: use stable refs.
    const fallbackConditions: Record<string, unknown>[] = []
    for (const value of values) {
      fallbackConditions.push({ codigoCorrelacion: { equals: value } })
      fallbackConditions.push({ numeroPedido: { equals: value } })
    }

    try {
      found = await payloadClient.find({
        collection: 'ordenes',
        where: { or: fallbackConditions },
        limit: 10,
        depth: 1,
        overrideAccess: true,
      })
    } catch {
      found = { docs: [] }
    }
  }

  if (!found.docs.length) return null
  if (found.docs.length === 1) return found.docs[0]

  const exactTx = found.docs.find((doc: any) => correlation.transactionId && doc.transactionId === correlation.transactionId)
  if (exactTx) return exactTx

  const exactRef = found.docs.find(
    (doc: any) =>
      (correlation.paymentReference && doc.paymentReference === correlation.paymentReference) ||
      (correlation.codigoCorrelacion && doc.codigoCorrelacion === correlation.codigoCorrelacion),
  )
  if (exactRef) return exactRef

  return found.docs[0]
}

function getClienteId(order: any) {
  if (typeof order?.cliente === 'object' && order.cliente) {
    return asCleanString((order.cliente as any).id)
  }

  return asCleanString(order?.cliente)
}

function getCuponId(order: any) {
  if (typeof order?.cupon === 'object' && order.cupon) {
    return asCleanString((order.cupon as any).id)
  }

  return asCleanString(order?.cupon)
}

function normalizeProcessedEvents(source: unknown) {
  if (!Array.isArray(source)) return []
  const events = source
    .map((value) => asCleanString(value))
    .filter(Boolean)

  return Array.from(new Set(events)).slice(-40)
}

function addProcessedEvent(existing: string[], eventKey: string) {
  const next = [...existing, eventKey]
  return Array.from(new Set(next)).slice(-40)
}

function getIzipayState(order: any) {
  const payloadRoot = safeObject(order?.paymentPayload)
  const izipay = safeObject(payloadRoot.izipay)
  const processedWebhookEvents = normalizeProcessedEvents(izipay.processedWebhookEvents)

  return {
    payloadRoot,
    izipay,
    processedWebhookEvents,
    finalEffectsApplied: Boolean(izipay.finalEffectsApplied),
  }
}

async function applyFinalBusinessEffects(payloadClient: any, order: any) {
  const warnings: string[] = []

  const items = Array.isArray(order.items) ? order.items : []
  for (const item of items) {
    const productRelation = item?.producto
    const productId =
      typeof productRelation === 'object' && productRelation
        ? asCleanString(productRelation.id)
        : asCleanString(productRelation)

    if (!productId) continue

    const product = await payloadClient.findByID({
      collection: 'productos',
      id: productId,
      depth: 0,
      overrideAccess: true,
    })

    const qty = Number(item?.cantidad || 0)
    if (!Number.isFinite(qty) || qty <= 0) continue

    const tallaSolicitada = asCleanString(item?.talla).toLowerCase()
    const tallasActuales = Array.isArray(product.tallas) ? product.tallas : []

    if (tallaSolicitada && tallasActuales.length > 0) {
      const updatedTallas = tallasActuales.map((tallaItem: any) => ({ ...tallaItem }))
      const index = updatedTallas.findIndex(
        (tallaItem: any) => asCleanString(tallaItem?.talla).toLowerCase() === tallaSolicitada,
      )

      if (index >= 0) {
        const currentStock = Number(updatedTallas[index]?.stock || 0)
        if (currentStock < qty) {
          warnings.push(`Stock en talla menor al esperado para producto ${productId}.`)
        }

        updatedTallas[index].stock = Math.max(0, currentStock - qty)
      } else {
        warnings.push(`No se encontro la talla ${item?.talla || ''} en producto ${productId}.`)
      }

      const stockActual = Number(product.stock || 0)
      const nextStock = Number.isFinite(stockActual) ? Math.max(0, stockActual - qty) : stockActual

      await payloadClient.update({
        collection: 'productos',
        id: productId,
        overrideAccess: true,
        data: {
          tallas: updatedTallas,
          stock: nextStock,
        },
      })

      continue
    }

    const currentStock = Number(product.stock || 0)
    if (!Number.isFinite(currentStock)) continue

    if (currentStock < qty) {
      warnings.push(`Stock total menor al esperado para producto ${productId}.`)
    }

    await payloadClient.update({
      collection: 'productos',
      id: productId,
      overrideAccess: true,
      data: {
        stock: Math.max(0, currentStock - qty),
      },
    })
  }

  const cuponId = getCuponId(order)
  if (cuponId) {
    try {
      const cupon = await payloadClient.findByID({
        collection: 'cupones',
        id: cuponId,
        depth: 0,
        overrideAccess: true,
      })

      const usosActuales = Number(cupon.usosActuales || 0)
      await payloadClient.update({
        collection: 'cupones',
        id: cuponId,
        overrideAccess: true,
        data: {
          usosActuales: usosActuales + 1,
        },
      })
    } catch {
      warnings.push(`No se pudo actualizar usos del cupon ${cuponId}.`)
    }
  }

  const clienteId = getClienteId(order)
  if (clienteId) {
    try {
      const cliente = await payloadClient.findByID({
        collection: 'clientes',
        id: clienteId,
        depth: 0,
        overrideAccess: true,
      })

      const totalComprasActual = Number(cliente.totalCompras || 0)
      const orderTotal = Number(order.total || 0)
      const nextTotalCompras = Number.isFinite(orderTotal)
        ? Number((totalComprasActual + orderTotal).toFixed(2))
        : totalComprasActual

      await payloadClient.update({
        collection: 'clientes',
        id: clienteId,
        overrideAccess: true,
        data: {
          totalCompras: nextTotalCompras,
        },
      })
    } catch {
      warnings.push(`No se pudo actualizar metricas del cliente ${clienteId}.`)
    }
  }

  return warnings
}

export async function POST(request: Request) {
  const hashKey = getHashKey()
  if (!hashKey) {
    return NextResponse.json(
      { error: 'Falta IZIPAY_HASH_KEY para validar firma de webhook.' },
      { status: 500 },
    )
  }

  const rawBody = await request.text()
  const body = parseWebhookBody(rawBody)
  const payloadHttp = asCleanString(body.payloadHttp)
  const signature = pickFirstString(
    body.signature,
    body.signatureHash,
    request.headers.get('x-signature'),
    request.headers.get('x-izipay-signature'),
  )

  const payloadHttpObject = toObject(safeJsonParse(payloadHttp) ?? body.payload)
  const payloadResponse = toObject(payloadHttpObject.response)
  const payloadOrder = Array.isArray(payloadResponse.order) ? toObject(payloadResponse.order[0]) : {}

  const correlation = extractCorrelation(body, payloadHttpObject)
  const transactionId = correlation.transactionId
  const eventKey = buildEventKey({ transactionId, signature, payloadHttp, body })

  const rawCode = pickFirstString(
    asLooseString(body.code),
    body.code,
    payloadHttpObject.code,
    payloadResponse.code,
    payloadOrder.code,
    payloadOrder.state,
  )
  const rawMessage = pickFirstString(
    body.message,
    body.messageUser,
    payloadHttpObject.message,
    payloadResponse.message,
    payloadOrder.stateMessage,
  )
  const statusRaw = pickFirstString(
    asLooseString(body.status),
    body.status,
    body.transactionStatus,
    payloadHttpObject.status,
    payloadResponse.status,
    payloadOrder.state,
    rawMessage,
  )
  const outcome = detectOutcome({ code: rawCode, stateRaw: statusRaw })

  const signatureValid = verifyIzipaySignature({
    payloadHttp,
    signature,
    hashKey,
  })

  const authorizationCode = pickFirstString(
    body.authorizationCode,
    payloadHttpObject.authorizationCode,
    payloadResponse.authorizationCode,
    payloadOrder.authorizationCode,
    payloadOrder.authCode,
  )

  const payloadClient = await getPayload({ config })
  const order = await findOrder(payloadClient, correlation)

  if (!order) {
    return NextResponse.json(
      {
        accepted: false,
        reason: 'ORDER_NOT_FOUND',
        signatureValid,
        eventKey,
      },
      { status: 202 },
    )
  }

  const orderState = getIzipayState(order)
  const isDuplicateEvent = orderState.processedWebhookEvents.includes(eventKey)

  if (!signatureValid) {
    const keepSignature = Boolean(
      order.paymentSignatureValid &&
      orderState.izipay.finalValidationPending === false,
    )
    await payloadClient.update({
      collection: 'ordenes',
      id: order.id,
      overrideAccess: true,
      data: {
        paymentSignatureValid: keepSignature,
        paymentPayload: mergePaymentPayload(order.paymentPayload, {
          izipay: {
            ...orderState.izipay,
            lastWebhookAt: new Date().toISOString(),
            lastWebhookEventKey: eventKey,
            lastWebhookCode: rawCode || null,
            lastWebhookMessage: rawMessage || null,
            lastWebhookSignatureValid: false,
            lastWebhookPayload: payloadHttpObject,
          },
        }),
      },
    })

    return NextResponse.json(
      {
        accepted: false,
        reason: 'INVALID_SIGNATURE',
        eventKey,
      },
      { status: 200 },
    )
  }

  if (isDuplicateEvent) {
    return NextResponse.json(
      {
        accepted: true,
        duplicate: true,
        eventKey,
      },
      { status: 200 },
    )
  }

  const processedEvents = addProcessedEvent(orderState.processedWebhookEvents, eventKey)
  const nowIso = new Date().toISOString()
  const shouldApplyEffects = outcome === 'paid' && !orderState.finalEffectsApplied
  const keepPaidTerminalState =
    orderState.finalEffectsApplied &&
    order.estadoPago === 'paid' &&
    (outcome === 'failed' || outcome === 'canceled')

  let finalEffectsWarnings: string[] = []
  if (shouldApplyEffects) {
    finalEffectsWarnings = await applyFinalBusinessEffects(payloadClient, order)
  }

  const effectiveOutcome: WebhookOutcome = keepPaidTerminalState ? 'paid' : outcome

  const nextEstadoPago =
    effectiveOutcome === 'paid'
      ? 'paid'
      : effectiveOutcome === 'failed'
        ? 'failed'
        : effectiveOutcome === 'canceled'
          ? 'canceled'
          : 'pending'

  const updated = await payloadClient.update({
    collection: 'ordenes',
    id: order.id,
    overrideAccess: true,
    data: {
      paymentProvider: 'izipay_sandbox',
      paymentMethod: 'tarjeta',
      estadoPago: nextEstadoPago,
      estadoComercial:
        effectiveOutcome === 'paid'
          ? order.estadoComercial === 'pendiente'
            ? 'procesando'
            : order.estadoComercial
          : order.estadoComercial,
      paidAt: effectiveOutcome === 'paid' ? order.paidAt || nowIso : order.paidAt,
      paymentSignatureValid: true,
      transactionId: transactionId || order.transactionId,
      externalOrderId: correlation.externalOrderId || order.externalOrderId,
      paymentReference:
        correlation.paymentReference ||
        correlation.codigoCorrelacion ||
        order.paymentReference ||
        order.codigoCorrelacion,
      authorizationCode: authorizationCode || order.authorizationCode,
      paymentErrorCode: effectiveOutcome === 'paid' ? '' : rawCode || order.paymentErrorCode,
      paymentErrorMessage:
        effectiveOutcome === 'paid'
          ? ''
          : rawMessage || (effectiveOutcome === 'failed' ? 'Pago rechazado por webhook Izipay.' : effectiveOutcome === 'canceled' ? 'Pago cancelado por webhook Izipay.' : order.paymentErrorMessage),
      paymentPayload: mergePaymentPayload(order.paymentPayload, {
        izipay: {
          ...orderState.izipay,
          finalValidationPending: false,
          finalEffectsApplied: orderState.finalEffectsApplied || effectiveOutcome === 'paid',
          finalEffectsAppliedAt:
            orderState.finalEffectsApplied || effectiveOutcome !== 'paid'
              ? orderState.izipay.finalEffectsAppliedAt || null
              : nowIso,
          processedWebhookEvents: processedEvents,
          lastWebhookAt: nowIso,
          lastWebhookEventKey: eventKey,
          lastWebhookCode: rawCode || null,
          lastWebhookMessage: rawMessage || null,
          lastWebhookSignatureValid: true,
          lastWebhookPayload: payloadHttpObject,
          lastWebhookOutcome: effectiveOutcome,
          lastWebhookWarnings: finalEffectsWarnings,
          terminalPaidIgnoredStatus: keepPaidTerminalState ? outcome : null,
        },
      }),
    },
  })

  return NextResponse.json(
    {
      accepted: true,
      eventKey,
      outcome: effectiveOutcome,
      order: {
        id: updated.id,
        numeroPedido: updated.numeroPedido,
        codigoCorrelacion: updated.codigoCorrelacion,
        estadoPago: updated.estadoPago,
        paidAt: updated.paidAt,
      },
      warnings: finalEffectsWarnings,
    },
    { status: 200 },
  )
}
