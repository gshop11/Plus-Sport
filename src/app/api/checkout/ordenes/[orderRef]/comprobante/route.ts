import { NextResponse } from 'next/server'
import { getPayload, type Payload } from 'payload'
import config from '@payload-config'

// Carga de comprobante de pago manual para una orden.
// - La referencia (codigoCorrelacion) es no adivinable y actua como capability.
// - Se valida el MIME REAL por numeros magicos (no el content-type declarado).
// - Tamano maximo 5 MB. Nombre saneado. Sin ejecucion posible (solo
//   imagenes/PDF, servidos desde almacenamiento de objetos).
// - La orden pasa a comprobante_recibido. NUNCA a pagado automaticamente.

const MAX_FILE_BYTES = 5 * 1024 * 1024

const ESTADOS_PERMITIDOS = new Set(['pendiente_pago', 'comprobante_recibido', 'pago_en_revision', 'pendiente'])

function sniffMime(buffer: Buffer): { mime: string; ext: string } | null {
  if (buffer.length < 12) return null
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return { mime: 'image/jpeg', ext: 'jpg' }
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return { mime: 'image/png', ext: 'png' }
  if (buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP') {
    return { mime: 'image/webp', ext: 'webp' }
  }
  if (buffer.subarray(0, 5).toString('ascii') === '%PDF-') return { mime: 'application/pdf', ext: 'pdf' }
  return null
}

async function findOrderByCorrelacion(payload: Payload, orderRef: string) {
  const found = await payload.find({
    collection: 'ordenes',
    where: { codigoCorrelacion: { equals: orderRef } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  return (found.docs[0] as unknown as Record<string, unknown>) ?? null
}

export async function POST(request: Request, { params }: { params: Promise<{ orderRef: string }> }) {
  const { orderRef: rawRef = '' } = await params
  const orderRef = rawRef.trim()

  if (!orderRef || !orderRef.startsWith('ORD-')) {
    return NextResponse.json({ error: 'Referencia de orden invalida.' }, { status: 400 })
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Se espera multipart/form-data con el archivo.' }, { status: 400 })
  }

  const file = form.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Archivo requerido (campo file).' }, { status: 400 })
  }

  if (file.size <= 0 || file.size > MAX_FILE_BYTES) {
    return NextResponse.json({ error: 'El archivo debe pesar entre 1 byte y 5 MB.' }, { status: 413 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const sniffed = sniffMime(buffer)
  if (!sniffed) {
    return NextResponse.json(
      { error: 'Formato no permitido. Solo JPG, PNG, WEBP o PDF (se valida el contenido real).' },
      { status: 415 },
    )
  }

  const notaCliente = String(form.get('nota') ?? '').trim().slice(0, 300)
  const metodoDeclarado = String(form.get('metodoPago') ?? '').trim().slice(0, 30)

  try {
    const payload = await getPayload({ config })
    const orden = await findOrderByCorrelacion(payload, orderRef)

    if (!orden) {
      return NextResponse.json({ error: 'Orden no encontrada.' }, { status: 404 })
    }

    const estadoActual = String(orden.estadoComercial ?? '')
    if (!ESTADOS_PERMITIDOS.has(estadoActual)) {
      return NextResponse.json(
        { error: 'Esta orden ya no acepta comprobantes. Consulta por WhatsApp.' },
        { status: 409 },
      )
    }

    const yaSubidos = Array.isArray(orden.comprobantesPago) ? orden.comprobantesPago.length : 0
    if (yaSubidos >= 5) {
      return NextResponse.json({ error: 'Limite de comprobantes alcanzado para esta orden.' }, { status: 429 })
    }

    const safeName = `comprobante-${orden.numeroPedido ?? orden.id}-${Date.now()}.${sniffed.ext}`

    const comprobante = await payload.create({
      collection: 'comprobantes',
      overrideAccess: true,
      data: {
        orden: Number(orden.id),
        metodoPago: metodoDeclarado || String(orden.metodoPago ?? ''),
        notasCliente: notaCliente || undefined,
        revisado: false,
      },
      file: {
        data: buffer,
        name: safeName,
        mimetype: sniffed.mime,
        size: buffer.length,
      },
    })

    const idsPrevios = Array.isArray(orden.comprobantesPago)
      ? orden.comprobantesPago.map((c) => (typeof c === 'object' && c !== null ? Number((c as { id: number }).id) : Number(c)))
      : []

    await payload.update({
      collection: 'ordenes',
      id: Number(orden.id),
      overrideAccess: true,
      data: {
        comprobantesPago: [...idsPrevios, Number(comprobante.id)],
        estadoComercial: estadoActual === 'pendiente_pago' || estadoActual === 'pendiente' ? 'comprobante_recibido' : (estadoActual as never),
      },
    })

    return NextResponse.json(
      {
        success: true,
        estado: estadoActual === 'pendiente_pago' || estadoActual === 'pendiente' ? 'comprobante_recibido' : estadoActual,
        mensaje: 'Comprobante recibido. Validaremos tu pago y te confirmaremos por WhatsApp o correo.',
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('Error subiendo comprobante:', error)
    return NextResponse.json({ error: 'No se pudo registrar el comprobante.' }, { status: 500 })
  }
}
