import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getStorefrontConfig } from '@/lib/storefront'

type ValidarBody = {
  codigo?: string
  subtotal?: number
  costoEnvio?: number
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ValidarBody
    const codigo = (body.codigo || '').trim().toUpperCase()
    const subtotal = Number(body.subtotal || 0)
    const costoEnvio = Number(body.costoEnvio || 0)
    const storeConfig = await getStorefrontConfig()
    const currencySymbol = storeConfig.moneda.simbolo || 'S/'

    if (!codigo) {
      return NextResponse.json({ ok: false, message: 'Ingresa un codigo de cupon.' }, { status: 400 })
    }

    const payload = await getPayload({ config })
    const found = await payload.find({
      collection: 'cupones',
      where: {
        and: [{ codigo: { equals: codigo } }, { activo: { equals: true } }],
      },
      limit: 1,
      depth: 0,
    })

    const cupon = found.docs[0] as any
    if (!cupon) {
      return NextResponse.json({ ok: false, message: 'Cupon no valido o inactivo.' }, { status: 404 })
    }

    if (cupon.vencimiento && new Date(cupon.vencimiento).getTime() < Date.now()) {
      return NextResponse.json({ ok: false, message: 'Este cupon ya vencio.' }, { status: 400 })
    }

    if ((cupon.minimoCompra || 0) > subtotal) {
      return NextResponse.json(
        {
          ok: false,
          message: `Este cupon requiere una compra minima de ${currencySymbol} ${Number(cupon.minimoCompra).toFixed(2)}.`,
        },
        { status: 400 },
      )
    }

    if ((cupon.usoMaximo || 0) > 0 && (cupon.usosActuales || 0) >= cupon.usoMaximo) {
      return NextResponse.json({ ok: false, message: 'Este cupon ya alcanzo su limite de usos.' }, { status: 400 })
    }

    let descuento = 0
    let envioFinal = costoEnvio
    const tipo = String(cupon.tipo || 'porcentaje')
    const valor = Number(cupon.valor || 0)

    if (tipo === 'porcentaje') {
      descuento = Math.max(0, (subtotal * valor) / 100)
    } else if (tipo === 'monto') {
      descuento = Math.max(0, Math.min(valor, subtotal))
    } else if (tipo === 'envio_gratis') {
      envioFinal = 0
    }

    const total = Math.max(0, subtotal - descuento) + envioFinal

    return NextResponse.json({
      ok: true,
      message: 'Cupon aplicado correctamente.',
      cupon: {
        codigo,
        tipo,
        valor,
        descuento: Number(descuento.toFixed(2)),
        envioFinal: Number(envioFinal.toFixed(2)),
        total: Number(total.toFixed(2)),
      },
    })
  } catch {
    return NextResponse.json({ ok: false, message: 'No se pudo validar el cupon.' }, { status: 500 })
  }
}
