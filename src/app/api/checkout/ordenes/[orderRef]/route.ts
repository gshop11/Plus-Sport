import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

function sanitizeRef(value: string) {
  return value.trim()
}

function maskPhone(phone?: string) {
  if (!phone) return ''
  const onlyDigits = phone.replace(/\D/g, '')
  if (onlyDigits.length < 4) return phone
  return `${onlyDigits.slice(0, 2)}***${onlyDigits.slice(-2)}`
}

function toPublicOrder(order: any) {
  return {
    id: order.id,
    numeroPedido: order.numeroPedido,
    codigoCorrelacion: order.codigoCorrelacion,
    estadoComercial: order.estadoComercial,
    estadoPago: order.estadoPago,
    subtotal: order.subtotal,
    descuento: order.descuento,
    costoEnvio: order.costoEnvio,
    total: order.total,
    metodoEntrega: order.metodoEntrega,
    metodoPago: order.metodoPago,
    paymentProvider: order.paymentProvider,
    paymentMethod: order.paymentMethod,
    transactionId: order.transactionId,
    externalOrderId: order.externalOrderId,
    paymentReference: order.paymentReference,
    authorizationCode: order.authorizationCode,
    paymentSignatureValid: order.paymentSignatureValid,
    paymentErrorCode: order.paymentErrorCode,
    paymentErrorMessage: order.paymentErrorMessage,
    paidAt: order.paidAt,
    createdAt: order.createdAt,
    nombreCliente: order.nombreCliente,
    telefonoMasked: maskPhone(order.telefono),
    items: Array.isArray(order.items)
      ? order.items.map((item: any) => ({
          nombreProducto: item.nombreProducto,
          talla: item.talla,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
          subtotal: item.subtotal,
        }))
      : [],
  }
}

// Solo se acepta el codigoCorrelacion (no adivinable). No hay fallback por
// numeroPedido ni por ID secuencial: ambos son enumerables y expondrian
// datos de pedidos de terceros.
async function findOrderByRef(payload: any, orderRef: string) {
  if (!orderRef.startsWith('ORD-')) return null

  try {
    const byCode = await payload.find({
      collection: 'ordenes',
      where: { codigoCorrelacion: { equals: orderRef } },
      limit: 1,
      depth: 1,
      overrideAccess: true,
    })

    return byCode.docs[0] ?? null
  } catch {
    return null
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderRef: string }> },
) {
  const { orderRef: rawOrderRef = '' } = await params
  const orderRef = sanitizeRef(rawOrderRef)

  if (!orderRef) {
    return NextResponse.json({ error: 'orderRef es requerido.' }, { status: 400 })
  }

  try {
    const payload = await getPayload({ config })
    const order = await findOrderByRef(payload, orderRef)

    if (!order) {
      return NextResponse.json({ error: 'Orden no encontrada.' }, { status: 404 })
    }

    return NextResponse.json(
      { success: true, order: toPublicOrder(order) },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return NextResponse.json(
      { error: 'No se pudo consultar la orden.', details: (error as Error).message },
      { status: 500 },
    )
  }
}
