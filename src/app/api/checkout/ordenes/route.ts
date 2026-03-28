import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(request: Request) {
  try {
    const payload = await getPayload({ config })
    const body = await request.json()

    const orden = await payload.create({
      collection: 'ordenes',
      overrideAccess: true,
      data: {
        cliente: body.cliente,
        nombreCliente: body.nombreCliente,
        telefono: body.telefono,
        items: body.items,
        subtotal: body.subtotal,
        descuento: body.descuento || 0,
        costoEnvio: body.costoEnvio,
        total: body.total,
        direccionEnvio: body.direccionEnvio,
        metodoPago: body.metodoPago,
        estado: body.estado || 'pendiente',
      },
    })

    try {
      const clienteActual = await payload.findByID({
        collection: 'clientes',
        id: body.cliente,
        overrideAccess: true,
      })

      await payload.update({
        collection: 'clientes',
        id: body.cliente,
        overrideAccess: true,
        data: { totalCompras: (clienteActual.totalCompras || 0) + body.total },
      })
    } catch {
      // Ignorar si falla la actualización del cliente
    }

    return Response.json({ success: true, doc: orden }, { status: 201 })
  } catch (error) {
    console.error('Error creando orden:', error)
    return Response.json(
      { error: 'Error creando orden', details: (error as Error).message },
      { status: 500 },
    )
  }
}
