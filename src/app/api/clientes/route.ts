import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(request: Request) {
  try {
    const payload = await getPayload({ config })
    const body = await request.json()

    const cliente = await payload.create({
      collection: 'clientes',
      overrideAccess: true,
      data: {
        nombre: body.nombre,
        email: body.email,
        telefono: body.telefono,
        documento: body.documento || '',
        direccion: body.direccion,
        totalCompras: 0,
        etiqueta: 'normal',
      },
    })

    return Response.json(
      { success: true, doc: cliente },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creando cliente:', error)
    return Response.json(
      { error: 'Error creando cliente', details: (error as Error).message },
      { status: 500 }
    )
  }
}
