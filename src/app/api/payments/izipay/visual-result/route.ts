import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { mapOrderStatus, mergePaymentPayload, pickFirstString, safeArray, safeJsonParse, safeObject } from '@/lib/izipay'
import { isIzipayCardEnabled } from '@/lib/payment-methods'

type VisualResultRequest = {
  orderRef?: string
  orderId?: string
  krAnswer?: string
  krHash?: string
}

function asCleanString(value: unknown) {
  if (typeof value !== 'string') return ''
  return value.trim()
}

// Solo codigoCorrelacion (no adivinable), sin fallback enumerable.
async function findOrder(payload: any, refs: { orderRef?: string; orderId?: string }) {
  const orderRef = asCleanString(refs.orderRef)
  if (!orderRef || !orderRef.startsWith('ORD-')) return null

  try {
    const byRef = await payload.find({
      collection: 'ordenes',
      where: { codigoCorrelacion: { equals: orderRef } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    return byRef.docs[0] ?? null
  } catch {
    return null
  }
}

function toEstadoPago(orderStatus: ReturnType<typeof mapOrderStatus>) {
  if (orderStatus === 'PAID') return 'authorized'
  if (orderStatus === 'UNPAID') return 'failed'
  if (orderStatus === 'CANCELLED') return 'canceled'
  return 'pending'
}

function buildErrorMessage(orderStatus: ReturnType<typeof mapOrderStatus>) {
  if (orderStatus === 'UNPAID') return 'Pago rechazado visualmente en checkout Krypton.'
  if (orderStatus === 'CANCELLED') return 'Pago cancelado por el usuario en checkout Krypton.'
  return ''
}

function isFinalServerResolved(order: any) {
  const izipay = order?.paymentPayload?.izipay
  const finalValidationPending = izipay?.finalValidationPending
  const hasServerSignature = Boolean(order?.paymentSignatureValid)

  return hasServerSignature && finalValidationPending === false
}

export async function POST(request: Request) {
  if (!isIzipayCardEnabled()) {
    return NextResponse.json(
      { error: 'El pago con tarjeta esta deshabilitado.', code: 'IZIPAY_CARD_DISABLED' },
      { status: 403 },
    )
  }

  let body: VisualResultRequest

  try {
    body = (await request.json()) as VisualResultRequest
  } catch {
    return NextResponse.json({ error: 'Body JSON invalido.' }, { status: 400 })
  }

  const orderRef = asCleanString(body.orderRef)
  const orderId = asCleanString(body.orderId)
  if (!orderRef && !orderId) {
    return NextResponse.json({ error: 'orderRef u orderId es requerido.' }, { status: 400 })
  }

  const krAnswerRaw = asCleanString(body.krAnswer)
  const krAnswerObj = safeObject(safeJsonParse(krAnswerRaw))
  const orderStatus = mapOrderStatus(krAnswerObj.orderStatus)
  const estadoPago = toEstadoPago(orderStatus)

  const firstTransaction = safeObject(safeArray(krAnswerObj.transactions)[0])
  const transactionUuid = pickFirstString(firstTransaction.uuid)

  try {
    const payload = await getPayload({ config })
    const order = await findOrder(payload, { orderRef, orderId })

    if (!order) {
      return NextResponse.json({ error: 'Orden no encontrada.' }, { status: 404 })
    }

    const finalServerResolved = isFinalServerResolved(order)
    const nextEstadoPago = finalServerResolved ? order.estadoPago : estadoPago

    const updated = await payload.update({
      collection: 'ordenes',
      id: order.id,
      overrideAccess: true,
      data: {
        paymentProvider: 'izipay_krypton',
        paymentMethod: 'tarjeta',
        estadoPago: nextEstadoPago,
        transactionId: transactionUuid || order.transactionId,
        paymentErrorCode: finalServerResolved
          ? order.paymentErrorCode
          : orderStatus === 'PAID'
            ? ''
            : orderStatus,
        paymentErrorMessage: finalServerResolved ? order.paymentErrorMessage : buildErrorMessage(orderStatus),
        paymentPayload: mergePaymentPayload(order.paymentPayload, {
          izipay: {
            lastVisualResultAt: new Date().toISOString(),
            visualOrderStatus: orderStatus,
            visualTransactionUuid: transactionUuid || null,
            finalValidationPending: finalServerResolved ? false : true,
            visualIgnoredByFinalWebhook: finalServerResolved,
          },
        }),
      },
    })

    return NextResponse.json({
      success: true,
      order: {
        id: updated.id,
        numeroPedido: updated.numeroPedido,
        codigoCorrelacion: updated.codigoCorrelacion,
        estadoPago: updated.estadoPago,
        transactionId: updated.transactionId,
      },
      provisional: true,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'No se pudo registrar resultado visual Izipay Krypton.',
        details: (error as Error).message,
      },
      { status: 500 },
    )
  }
}
