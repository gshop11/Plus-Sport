import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import {
  buildKrEventKey,
  mapOrderStatus,
  mergePaymentPayload,
  pickFirstString,
  safeArray,
  safeJsonParse,
  safeObject,
  verifyKrHash,
} from '@/lib/izipay'
import { isIzipayCardEnabled } from '@/lib/payment-methods'

type ParsedWebhookBody = Record<string, unknown>
type WebhookOutcome = 'paid' | 'failed' | 'canceled' | 'pending'

type CorrelationInput = {
  orderId: string
  transactionUuid: string
}

function asCleanString(value: unknown) {
  if (typeof value !== 'string') return ''
  return value.trim()
}

/**
 * La IPN de Micuentaweb/Krypton llega normalmente como application/x-www-form-urlencoded
 * con los campos "kr-answer" y "kr-hash". Se soporta tambien JSON por robustez defensiva
 * (algunos proxies/reenvios re-serializan el body), sin asumir un formato unico.
 */
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

function getHmacKey() {
  return pickFirstString(process.env.IZIPAY_HMAC_SHA256_KEY)
}

function extractCorrelation(krAnswerObj: Record<string, unknown>): CorrelationInput {
  const orderDetails = safeObject(krAnswerObj.orderDetails)
  const transactions = safeArray(krAnswerObj.transactions)
  const firstTransaction = safeObject(transactions[0])

  return {
    orderId: pickFirstString(orderDetails.orderId, krAnswerObj.orderId),
    transactionUuid: pickFirstString(firstTransaction.uuid, krAnswerObj.transactionUuid),
  }
}

async function findOrder(payloadClient: any, correlation: CorrelationInput) {
  const values = Array.from(new Set([correlation.orderId, correlation.transactionUuid].filter(Boolean)))
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

  const exactTx = found.docs.find(
    (doc: any) => correlation.transactionUuid && doc.transactionId === correlation.transactionUuid,
  )
  if (exactTx) return exactTx

  const exactRef = found.docs.find(
    (doc: any) =>
      (correlation.orderId && doc.paymentReference === correlation.orderId) ||
      (correlation.orderId && doc.codigoCorrelacion === correlation.orderId),
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
  const events = source.map((value) => asCleanString(value)).filter(Boolean)
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

/**
 * Efectos de negocio finales, independientes del gateway (solo dependen de order.items/cupon/cliente).
 * Se mantiene identico al comportamiento previo para no duplicar descuento de stock, cupon ni metricas.
 */
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
  // Con el flag apagado no deben existir transacciones en curso; se responde
  // de forma controlada (503) para que el proveedor reintente si el flag se
  // activa. No se procesa ni se toca ninguna orden.
  if (!isIzipayCardEnabled()) {
    console.warn('Webhook Izipay recibido con IZIPAY_CARD_ENABLED=false. No se procesa.')
    return NextResponse.json(
      { error: 'El pago con tarjeta esta deshabilitado.', code: 'IZIPAY_CARD_DISABLED' },
      { status: 503 },
    )
  }

  const hmacKey = getHmacKey()
  if (!hmacKey) {
    return NextResponse.json(
      { error: 'Falta IZIPAY_HMAC_SHA256_KEY para validar kr-hash del webhook.' },
      { status: 500 },
    )
  }

  const rawBody = await request.text()
  const body = parseWebhookBody(rawBody)

  const krAnswer = asCleanString(body['kr-answer'] ?? body.krAnswer)
  const krHash = pickFirstString(
    body['kr-hash'],
    body.krHash,
    request.headers.get('x-kr-hash'),
  )

  const signatureValid = verifyKrHash({ krAnswer, krHash, hmacKey })
  const krAnswerObj = safeObject(safeJsonParse(krAnswer))

  // orderStatus es el campo autoritativo: solo se confirma pago si es exactamente 'PAID'.
  const outcome: WebhookOutcome = (() => {
    const status = mapOrderStatus(krAnswerObj.orderStatus)
    if (status === 'PAID') return 'paid'
    if (status === 'UNPAID') return 'failed'
    if (status === 'CANCELLED') return 'canceled'
    return 'pending'
  })()

  const correlation = extractCorrelation(krAnswerObj)
  const eventKey = buildKrEventKey({
    transactionUuid: correlation.transactionUuid,
    krHash,
    krAnswer,
  })

  const firstTransaction = safeObject(safeArray(krAnswerObj.transactions)[0])
  const authorizationCode = pickFirstString(
    firstTransaction.authorizationNumber,
    firstTransaction.authorizationCode,
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
      order.paymentSignatureValid && orderState.izipay.finalValidationPending === false,
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
            lastWebhookOrderStatus: krAnswerObj.orderStatus || null,
            lastWebhookSignatureValid: false,
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
      paymentProvider: 'izipay_krypton',
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
      transactionId: correlation.transactionUuid || order.transactionId,
      externalOrderId: correlation.orderId || order.externalOrderId,
      paymentReference: correlation.orderId || order.paymentReference || order.codigoCorrelacion,
      authorizationCode: authorizationCode || order.authorizationCode,
      paymentErrorCode: effectiveOutcome === 'paid' ? '' : String(krAnswerObj.orderStatus || order.paymentErrorCode || ''),
      paymentErrorMessage:
        effectiveOutcome === 'paid'
          ? ''
          : effectiveOutcome === 'failed'
            ? 'Pago rechazado por webhook Izipay Krypton (orderStatus=UNPAID).'
            : effectiveOutcome === 'canceled'
              ? 'Pago cancelado por webhook Izipay Krypton (orderStatus=CANCELLED).'
              : order.paymentErrorMessage,
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
          lastWebhookOrderStatus: krAnswerObj.orderStatus || null,
          lastWebhookSignatureValid: true,
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
