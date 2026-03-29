import 'server-only'
import config from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

export type ProductoCard = {
  id: string
  nombre: string
  marca: string
  precio: number
  precioAnterior?: number
  imagenUrl?: string | null
  tallas?: string[]
  etiqueta?: 'nuevo' | 'hot' | 'top' | 'oferta' | ''
}

export type HomeSlide = {
  id: string
  titulo: string
  subtitulo: string
  descripcion: string
  btn1Text: string
  btn1Url: string
  btn2Text?: string
  btn2Url?: string
  colorFondo: string
  imagenUrl?: string | null
}

export type StoreIdentity = {
  name: string
  tagline: string
  logoUrl: string | null
  logoAlt: string
}

export const PRODUCTS_PER_PAGE = 24

let payloadClientPromise: ReturnType<typeof getPayload> | null = null

const getPayloadClient = async () => {
  if (!payloadClientPromise) {
    payloadClientPromise = getPayload({ config })
  }

  return payloadClientPromise
}

const BLOB_BASE = 'https://6nu9xv9pttjecmvj.public.blob.vercel-storage.com'

const resolveImagenUrl = (imagenPrincipal: any): string | null => {
  if (!imagenPrincipal || typeof imagenPrincipal !== 'object') return null
  const { url, filename } = imagenPrincipal
  // Si la URL ya apunta a Vercel Blob, usarla directamente
  if (url && url.includes('blob.vercel-storage.com')) return url
  // Si el filename existe, construir la URL de Blob directamente
  if (filename) return `${BLOB_BASE}/${filename}`
  return null
}

const mapProductoToCard = (doc: any): ProductoCard => ({
  id: String(doc.id),
  nombre: doc.nombre ?? '',
  marca: typeof doc.marca === 'object' && doc.marca ? doc.marca.nombre ?? '' : '',
  precio: doc.precio ?? 0,
  precioAnterior: doc.precioAnterior ?? undefined,
  imagenUrl: resolveImagenUrl(doc.imagenPrincipal),
  tallas: Array.isArray(doc.tallas) ? doc.tallas.map((t: any) => t.talla) : [],
  etiqueta: (doc.etiqueta as ProductoCard['etiqueta']) ?? '',
})

const resolveMediaUrl = async (payload: Awaited<ReturnType<typeof getPayloadClient>>, mediaRef: any) => {
  if (!mediaRef) return null

  if (typeof mediaRef === 'object') {
    return mediaRef.url || (mediaRef.filename ? `/media/${mediaRef.filename}` : null)
  }

  try {
    const media = await payload.findByID({
      collection: 'media',
      id: String(mediaRef),
    })

    return media?.url || (media?.filename ? `/media/${media.filename}` : null)
  } catch {
    return null
  }
}

export const getHomeData = unstable_cache(
  async () => {
    const payload = await getPayloadClient()

    const [productosRes, marcasRes, bannersRes, categoriasRes] = await Promise.all([
      payload
        .find({
          collection: 'productos',
          where: { activo: { equals: true }, destacado: { equals: true } },
          limit: 8,
          depth: 1,
          sort: '-createdAt',
        })
        .catch(() => ({ docs: [] as any[] })),
      payload
        .find({
          collection: 'marcas',
          where: { activa: { equals: true } },
          limit: 20,
          depth: 0,
          sort: 'nombre',
        })
        .catch(() => ({ docs: [] as any[] })),
      payload
        .find({
          collection: 'banners',
          where: { activo: { equals: true } },
          sort: 'orden',
          limit: 10,
          depth: 1,
        })
        .catch(() => ({ docs: [] as any[] })),
      payload
        .find({
          collection: 'categorias',
          where: { activa: { equals: true } },
          sort: 'orden',
          limit: 12,
          depth: 0,
        })
        .catch(() => ({ docs: [] as any[] })),
    ])

    const slides = await Promise.all(
      bannersRes.docs.map(async (doc: any) => {
        // Resolver URL de imagen directamente del objeto poblado (depth:1)
        let imagenUrl: string | null = null
        if (doc.imagen) {
          if (typeof doc.imagen === 'object') {
            imagenUrl =
              doc.imagen.url ||
              (doc.imagen.filename ? `/media/${doc.imagen.filename}` : null)
          } else {
            imagenUrl = await resolveMediaUrl(payload, doc.imagen)
          }
        }
        return {
          id: String(doc.id),
          titulo: doc.titulo ?? 'BIENVENIDO',
          subtitulo: doc.subtitulo ?? '',
          descripcion: doc.descripcion ?? '',
          btn1Text: doc.textBoton1 ?? 'VER OFERTAS ->',
          btn1Url: doc.urlBoton1 ?? '/productos',
          btn2Text: doc.textBoton2 || undefined,
          btn2Url: doc.urlBoton2 || undefined,
          colorFondo: doc.colorFondo ?? '#1a237e',
          imagenUrl,
        }
      }),
    )

    return {
      slides,
      productos: productosRes.docs.map(mapProductoToCard),
      marcas: marcasRes.docs.map((m: any) => ({
        nombre: m.nombre ?? '',
        id: String(m.id),
        slug: m.slug ?? '',
      })),
      categorias: categoriasRes.docs.map((c: any) => ({
        nombre: c.nombre ?? '',
        icono: c.icono ?? 'X',
        slug: c.slug ?? '',
      })),
    }
  },
  ['store-home-data'],
  { revalidate: 60 },
)

export const getStoreIdentity = unstable_cache(
  async (): Promise<StoreIdentity> => {
    const payload = await getPayloadClient()

    const configTienda = await payload
      .findGlobal({
        slug: 'config-tienda',
        depth: 1,
      })
      .catch(() => null as any)

    const logo = configTienda?.logo
    const logoUrl =
      typeof logo === 'object' && logo
        ? logo.url || (logo.filename ? `/media/${logo.filename}` : null)
        : null

    return {
      name: configTienda?.nombreTienda ?? 'PlusSport',
      tagline: configTienda?.tagline ?? 'Performance Athletic Wear',
      logoUrl,
      logoAlt: configTienda?.nombreTienda ? `${configTienda.nombreTienda} logo` : 'PlusSport logo',
    }
  },
  ['store-identity'],
  { revalidate: 300 },
)

export const getCategoriasData = unstable_cache(
  async () => {
    const payload = await getPayloadClient()

    const categoriasRes = await payload
      .find({
        collection: 'categorias',
        where: { activa: { equals: true } },
        sort: 'orden',
        limit: 50,
        depth: 0,
      })
      .catch(() => ({ docs: [] as any[] }))

    return categoriasRes.docs.map((c: any) => ({
      nombre: c.nombre ?? '',
      icono: c.icono ?? 'X',
      slug: c.slug ?? '',
      id: String(c.id),
    }))
  },
  ['store-categorias-data'],
  { revalidate: 120 },
)

export const getMarcasData = unstable_cache(
  async () => {
    const payload = await getPayloadClient()

    const marcasRes = await payload
      .find({
        collection: 'marcas',
        where: { activa: { equals: true } },
        limit: 100,
        sort: 'nombre',
        depth: 0,
      })
      .catch(() => ({ docs: [] as any[] }))

    return marcasRes.docs.map((m: any) => ({
      id: String(m.id),
      nombre: m.nombre ?? '',
      slug: m.slug ?? '',
    }))
  },
  ['store-marcas-data'],
  { revalidate: 120 },
)

export type ProductListInput = {
  page?: number
  limit?: number
  segmento?: string
  marcaSlug?: string
  categoriaId?: string
  onlyOffers?: boolean
}

export const getProductList = async ({
  page = 1,
  limit = PRODUCTS_PER_PAGE,
  segmento,
  marcaSlug,
  categoriaId,
  onlyOffers,
}: ProductListInput) => {
  const payload = await getPayloadClient()

  const where: any = {
    activo: { equals: true },
  }

  if (segmento) {
    where.segmento = { in: [segmento, 'unisex'] }
  }

  if (categoriaId) {
    where.categoria = { equals: categoriaId }
  }

  if (onlyOffers) {
    where.etiqueta = { equals: 'oferta' }
  }

  if (marcaSlug) {
    const marcas = await getMarcasData()
    const marca = marcas.find((m) => m.slug === marcaSlug)
    if (marca) {
      where.marca = { equals: marca.id }
    }
  }

  const res = await payload
    .find({
      collection: 'productos',
      where,
      page,
      limit,
      depth: 1,
      sort: '-createdAt',
    })
    .catch(() => ({
      docs: [] as any[],
      totalDocs: 0,
      totalPages: 1,
      page,
      hasPrevPage: false,
      hasNextPage: false,
    }))

  return {
    productos: res.docs.map(mapProductoToCard),
    totalDocs: res.totalDocs ?? res.docs.length,
    totalPages: res.totalPages ?? 1,
    page: res.page ?? page,
    hasPrevPage: res.hasPrevPage ?? false,
    hasNextPage: res.hasNextPage ?? false,
  }
}

export const getCategoriaBySlug = async (slug: string) => {
  const getCachedBySlug = unstable_cache(
    async () => {
      const payload = await getPayloadClient()

      const categoriasRes = await payload
        .find({
          collection: 'categorias',
          where: { slug: { equals: slug }, activa: { equals: true } },
          limit: 1,
          depth: 0,
        })
        .catch(() => ({ docs: [] as any[] }))

      return categoriasRes.docs[0] || null
    },
    ['store-categoria-by-slug', slug],
    { revalidate: 120 },
  )

  return getCachedBySlug()
}
