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

    // Actualizar totalCompras del cliente
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
      // No bloquear la orden si falla
    }

    // Decrementar stock por cada item comprado
    if (Array.isArray(body.items)) {
      for (const item of body.items) {
        if (!item.productoId) continue
        try {
          const producto = await payload.findByID({
            collection: 'productos',
            id: item.productoId,
            overrideAccess: true,
          }) as any

          if (Array.isArray(producto.tallas) && producto.tallas.length > 0 && item.talla) {
            const tallasActualizadas = producto.tallas.map((t: any) =>
              t.talla === item.talla
                ? { ...t, stock: Math.max(0, (t.stock || 0) - (item.cantidad || 1)) }
                : t,
            )
            await payload.update({
              collection: 'productos',
              id: item.productoId,
              overrideAccess: true,
              data: { tallas: tallasActualizadas },
            })
          } else {
            await payload.update({
              collection: 'productos',
              id: item.productoId,
              overrideAccess: true,
              data: { stock: Math.max(0, (producto.stock || 0) - (item.cantidad || 1)) },
            })
          }
        } catch {
          // No bloquear la orden si falla el stock
        }
      }
    }

    // Incrementar uso del cupón aplicado
    if (body.cuponCodigo) {
      try {
        const cuponFound = await payload.find({
          collection: 'cupones',
          where: { codigo: { equals: String(body.cuponCodigo).toUpperCase() } },
          limit: 1,
          depth: 0,
          overrideAccess: true,
        })
        const cupon = cuponFound.docs[0] as any
        if (cupon) {
          await payload.update({
            collection: 'cupones',
            id: cupon.id,
            overrideAccess: true,
            data: { usosActuales: (cupon.usosActuales || 0) + 1 },
          })
        }
      } catch {
        // No bloquear la orden si falla el tracking del cupón
      }
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
