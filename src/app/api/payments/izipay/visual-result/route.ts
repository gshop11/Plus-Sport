import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { mapVisualStatus, mergePaymentPayload, pickFirstString } from '@/lib/izipay'

type VisualResultRequest = {
  orderRef?: string
  orderId?: string
  visualStatus?: string
  transactionId?: string
  response?: unknown
}

function asCleanString(value: unknown) {
  if (typeof value !== 'string') return ''
  return value.trim()
}

async function findOrder(payload: any, refs: { orderRef?: string; orderId?: string }) {
  const orderRef = asCleanString(refs.orderRef)
  const orderId = asCleanString(refs.orderId)

  if (orderRef) {
    try {
      const byRef = await payload.find({
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

      if (byRef.docs[0]) return byRef.docs[0]
    } catch {
      // Continue with ID fallback when local schema is behind.
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

function toEstadoPago(visualStatus: ReturnType<typeof mapVisualStatus>) {
  if (visualStatus === 'success') return 'authorized'
  if (visualStatus === 'failed') return 'failed'
  if (visualStatus === 'cancelled') return 'canceled'
  return 'pending'
}

function buildErrorMessage(visualStatus: ReturnType<typeof mapVisualStatus>, fallback: string) {
  if (visualStatus === 'failed') {
    return fallback || 'Pago rechazado visualmente en checkout Izipay.'
  }
  if (visualStatus === 'cancelled') {
    return fallback || 'Pago cancelado por el usuario en checkout Izipay.'
  }
  return ''
}

function isFinalServerResolved(order: any) {
  const izipay = order?.paymentPayload?.izipay
  const finalValidationPending = izipay?.finalValidationPending
  const hasServerSignature = Boolean(order?.paymentSignatureValid)

  return hasServerSignature && finalValidationPending === false
}

export async function POST(request: Request) {
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

  const rawResponse = body.response ?? null
  const visualStatus = mapVisualStatus(body.visualStatus || rawResponse)
  const estadoPago = toEstadoPago(visualStatus)

  const transactionId = pickFirstString(
    body.transactionId,
    (rawResponse as any)?.transactionId,
    (rawResponse as any)?.response?.transactionId,
    (rawResponse as any)?.response?.order?.[0]?.referenceNumber,
  )

  const responseCode = pickFirstString(
    (rawResponse as any)?.code,
    (rawResponse as any)?.response?.code,
    (rawResponse as any)?.response?.order?.[0]?.stateMessage,
  )

  const responseMessage = pickFirstString(
    (rawResponse as any)?.message,
    (rawResponse as any)?.messageUser,
    (rawResponse as any)?.response?.message,
    (rawResponse as any)?.response?.order?.[0]?.stateMessage,
  )

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
        paymentProvider: 'izipay_sandbox',
        paymentMethod: 'tarjeta',
        estadoPago: nextEstadoPago,
        transactionId: transactionId || order.transactionId,
        paymentErrorCode:
          finalServerResolved
            ? order.paymentErrorCode
            : visualStatus === 'success'
              ? ''
              : responseCode,
        paymentErrorMessage:
          finalServerResolved
            ? order.paymentErrorMessage
            : buildErrorMessage(visualStatus, responseMessage),
        paymentPayload: mergePaymentPayload(order.paymentPayload, {
          izipay: {
            lastVisualResultAt: new Date().toISOString(),
            visualStatus,
            visualCode: responseCode || null,
            visualMessage: responseMessage || null,
            rawResponse,
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
        error: 'No se pudo registrar resultado visual Izipay.',
        details: (error as Error).message,
      },
      { status: 500 },
    )
  }
}
