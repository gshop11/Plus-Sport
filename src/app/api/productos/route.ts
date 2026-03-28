import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

const segmentOptions = ['hombre', 'mujer', 'ninos', 'unisex'] as const

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config })

    const searchParams = request.nextUrl.searchParams
    const categoria = searchParams.get('categoria')
    const marca = searchParams.get('marca')
    const search = searchParams.get('search')
    const segmento = searchParams.get('segmento')
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const page = parseInt(searchParams.get('page') || '1', 10)

    const where: Record<string, unknown> = {
      activo: { equals: true },
    }

    if (categoria) {
      where.categoria = { slug: { equals: categoria } }
    }

    if (marca) {
      where.marca = { slug: { equals: marca } }
    }

    if (search) {
      where.or = [
        { nombre: { contains: search, case: false } },
        { slug: { contains: search, case: false } },
      ]
    }

    const resultado = await payload.find({
      collection: 'productos',
      where,
      limit: 500,
      page: 1,
      depth: 1,
      sort: '-createdAt',
    })

    const segmentoNormalizado =
      segmento && segmentOptions.includes(segmento as (typeof segmentOptions)[number])
        ? (segmento as (typeof segmentOptions)[number])
        : null

    const docsFiltrados = resultado.docs.filter((p: any) => {
      if (!segmentoNormalizado) return true

      const segmentoProducto = p.segmento ?? 'unisex'

      if (segmentoNormalizado === 'unisex') {
        return segmentoProducto === 'unisex'
      }

      return segmentoProducto === segmentoNormalizado || segmentoProducto === 'unisex'
    })

    const inicio = (page - 1) * limit
    const paginados = docsFiltrados.slice(inicio, inicio + limit)

    const productos = paginados.map((p: any) => ({
      id: String(p.id),
      nombre: p.nombre ?? '',
      marca: typeof p.marca === 'object' && p.marca ? p.marca.nombre ?? '' : '',
      precio: p.precio ?? 0,
      precioAnterior: p.precioAnterior ?? undefined,
      imagenUrl:
        typeof p.imagenPrincipal === 'object' && p.imagenPrincipal?.filename
          ? `/media/${p.imagenPrincipal.filename}`
          : null,
      tallas: Array.isArray(p.tallas) ? p.tallas.map((t: any) => t.talla) : [],
      etiqueta: (p.etiqueta as 'nuevo' | 'hot' | 'top' | 'oferta' | '') ?? '',
      slug: p.slug ?? '',
      segmento: p.segmento ?? 'unisex',
    }))

    return NextResponse.json({
      data: productos,
      pagination: {
        total: docsFiltrados.length,
        page,
        limit,
        pages: Math.max(1, Math.ceil(docsFiltrados.length / limit)),
      },
    })
  } catch (error) {
    console.error('Error en /api/productos:', error)
    return NextResponse.json(
      { error: 'Error al obtener productos' },
      { status: 500 }
    )
  }
}
