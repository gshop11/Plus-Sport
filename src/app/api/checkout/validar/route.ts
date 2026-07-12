import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { construirResumen, getPuntosRecojo, type CheckoutItemInput } from '@/lib/checkout-server'
import { isEcommerceEnabled } from '@/lib/payment-methods'

// Valida y reconstruye el carrito en servidor. El navegador solo envia
// referencias (productoId, talla, cantidad); precios, stock, cupon, envio y
// total salen de la base de datos.

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

const MAX_ITEMS = 50

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON invalido.' }, { status: 400 })
  }

  if (!isRecord(body) || !Array.isArray(body.items)) {
    return NextResponse.json({ error: 'items es requerido.' }, { status: 400 })
  }

  if (body.items.length > MAX_ITEMS) {
    return NextResponse.json({ error: 'Demasiados items en el carrito.' }, { status: 400 })
  }

  const items: CheckoutItemInput[] = body.items
    .filter(isRecord)
    .map((row) => ({
      productoId: String(row.productoId ?? ''),
      talla: row.talla ? String(row.talla) : null,
      cantidad: Math.trunc(Number(row.cantidad)),
    }))

  const cuponCodigo = typeof body.cuponCodigo === 'string' && body.cuponCodigo.trim() ? body.cuponCodigo.trim() : null
  const metodoEntrega =
    body.metodoEntrega === 'delivery' || body.metodoEntrega === 'retiro_tienda' ? body.metodoEntrega : null
  const distrito = typeof body.distrito === 'string' && body.distrito.trim() ? body.distrito.trim() : null

  try {
    const payload = await getPayload({ config })
    const resumen = await construirResumen(payload, { items, cuponCodigo, metodoEntrega, distrito })
    const puntosRecojo = await getPuntosRecojo(payload)

    return NextResponse.json(
      { ok: true, resumen, puntosRecojo, ecommerceEnabled: isEcommerceEnabled() },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    console.error('Error en /api/checkout/validar:', error)
    return NextResponse.json({ error: 'No se pudo validar el carrito.' }, { status: 500 })
  }
}
