import 'server-only'
import config from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import { resolveMediaURL } from './media'
import type { HeaderMenuItem, HomeSectionConfig, ProductoCard, StoreIdentity, StorefrontConfig } from './storefront-types'
export type { HeaderMenuItem, HomeSectionConfig, ProductoCard, StoreIdentity, StorefrontConfig } from './storefront-types'

export const PRODUCTS_PER_PAGE = 24

const defaultMenu: HeaderMenuItem[] = [
  { etiqueta: 'Catalogo', url: '/productos' },
  { etiqueta: 'Mujer', url: '/productos?segmento=mujer' },
  { etiqueta: 'Hombre', url: '/productos?segmento=hombre' },
  { etiqueta: 'Ninos', url: '/productos?segmento=ninos' },
  { etiqueta: 'Marcas', url: '/marcas' },
  { etiqueta: 'Ofertas', url: '/ofertas', esDestacado: true },
]

const defaultLinksFooter = [
  { etiqueta: 'Inicio', url: '/' },
  { etiqueta: 'Todos los productos', url: '/productos' },
  { etiqueta: 'Categorias', url: '/categorias' },
  { etiqueta: 'Ofertas', url: '/ofertas' },
]

const defaultHomeSections: HomeSectionConfig[] = [
  {
    key: 'categorias',
    titulo: 'TU DEPORTE, TU ESTILO',
    subtitulo: '- Explora por deporte',
    mostrar: true,
    orden: 1,
  },
  {
    key: 'marcas',
    titulo: 'LAS MEJORES DEL MUNDO',
    subtitulo: '- Marcas oficiales',
    mostrar: true,
    orden: 2,
  },
  {
    key: 'destacados',
    titulo: 'LO MAS VENDIDO',
    subtitulo: '- Mas comprados',
    mostrar: true,
    orden: 3,
  },
  {
    key: 'suscripcion',
    titulo: 'Ofertas exclusivas para ti',
    subtitulo: 'Dejanos tu WhatsApp y te avisamos primero.',
    mostrar: true,
    orden: 4,
  },
]

let payloadClientPromise: ReturnType<typeof getPayload> | null = null

const getPayloadClient = async () => {
  if (!payloadClientPromise) {
    payloadClientPromise = getPayload({ config })
  }

  return payloadClientPromise
}

const resolveImagenUrl = (imagenPrincipal: any): string | null => {
  return resolveMediaURL(imagenPrincipal)
}

const isDeportesLabel = (value: string) => value.toLowerCase().includes('deporte')

export const normalizeCategorySlug = (value: string) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

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
    return resolveMediaURL(mediaRef)
  }

  try {
    const media = await payload.findByID({
      collection: 'media',
      id: String(mediaRef),
    })

    return resolveMediaURL(media)
  } catch {
    return null
  }
}

const normalizeStorefrontConfig = (configTienda: any, categorias: any[] = []): StorefrontConfig => {
  const menuPrincipalRaw = Array.isArray(configTienda?.header?.menuPrincipal) ? configTienda.header.menuPrincipal : []
  const menuPrincipalClean =
    menuPrincipalRaw
      .map((item: any) => ({
        etiqueta: String(item?.etiqueta || '').trim(),
        url: String(item?.url || '').trim(),
        esDestacado: Boolean(item?.esDestacado),
        subItems: Array.isArray(item?.subItems)
          ? item.subItems
              .map((sub: any) => ({ etiqueta: String(sub?.etiqueta || '').trim(), url: String(sub?.url || '').trim() }))
              .filter((sub: { etiqueta: string; url: string }) => sub.etiqueta && sub.url)
          : [],
      }))
      .filter((item: HeaderMenuItem) => item.etiqueta && item.url) ?? []

  const deportesDesdeCategorias: { etiqueta: string; url: string }[] =
    categorias
      .map((categoria: any) => {
        const slug = String(categoria?.slug || '').trim()
        const nombre = String(categoria?.nombre || '').trim()
        const icono = String(categoria?.icono || '').trim()
        const normalizedSlug = normalizeCategorySlug(slug || nombre)
        if (!normalizedSlug || !nombre) return null
        return {
          etiqueta: `${icono ? `${icono} ` : ''}${nombre}`.trim(),
          url: `/categoria/${encodeURIComponent(normalizedSlug)}`,
        }
      })
      .filter((item: { etiqueta: string; url: string } | null): item is { etiqueta: string; url: string } => Boolean(item))

  const baseMenu = menuPrincipalClean.length > 0 ? menuPrincipalClean : defaultMenu

  const menuWithDeportesSubitems = baseMenu.map((item) => {
    if (!isDeportesLabel(item.etiqueta)) return item
    if (Array.isArray(item.subItems) && item.subItems.length > 0) return item
    return {
      ...item,
      subItems: deportesDesdeCategorias,
    }
  })

  const hasDeportesItem = menuWithDeportesSubitems.some((item) => isDeportesLabel(item.etiqueta))
  const menuPrincipal =
    !hasDeportesItem && deportesDesdeCategorias.length > 0
      ? [{ etiqueta: 'Deportes', url: '/categorias', subItems: deportesDesdeCategorias }, ...menuWithDeportesSubitems]
      : menuWithDeportesSubitems

  const linksRapidosRaw = Array.isArray(configTienda?.footer?.linksRapidos) ? configTienda.footer.linksRapidos : []
  const linksRapidos =
    linksRapidosRaw
      .map((item: any) => ({ etiqueta: String(item?.etiqueta || '').trim(), url: String(item?.url || '').trim() }))
      .filter((item: { etiqueta: string; url: string }) => item.etiqueta && item.url) ?? []

  const homeRaw = Array.isArray(configTienda?.home?.secciones) ? configTienda.home.secciones : []
  const homeSections =
    homeRaw
      .map((item: any) => ({
        key: item?.key,
        titulo: String(item?.titulo || '').trim(),
        subtitulo: String(item?.subtitulo || '').trim(),
        mostrar: item?.mostrar !== false,
        orden: Number(item?.orden || 999),
      }))
      .filter(
        (item: any) =>
          ['categorias', 'marcas', 'destacados', 'suscripcion'].includes(item.key) &&
          item.titulo,
      )
      .sort((a: HomeSectionConfig, b: HomeSectionConfig) => a.orden - b.orden)

  return {
    identity: {
      name: configTienda?.nombreTienda ?? 'PlusSport',
      tagline: configTienda?.tagline ?? 'Performance Athletic Wear',
      logoUrl: typeof configTienda?.logo === 'object' && configTienda.logo ? resolveMediaURL(configTienda.logo) : null,
      logoAlt: configTienda?.nombreTienda ? `${configTienda.nombreTienda} logo` : 'PlusSport logo',
    },
    header: {
      anuncioBarra: configTienda?.header?.anuncioBarra ?? 'ENVIO GRATIS POR COMPRAS MAYORES A S/299',
      mostrarAnuncio: configTienda?.header?.mostrarAnuncio !== false,
      menuPrincipal,
    },
    footer: {
      descripcion: configTienda?.footer?.descripcion ?? 'Tu tienda deportiva de confianza en Peru.',
      telefono: configTienda?.footer?.telefono ?? '',
      email: configTienda?.footer?.email ?? '',
      direccion: configTienda?.footer?.direccion ?? 'Lima, Peru',
      horario: configTienda?.footer?.horario ?? 'Lunes a Sabado 9am-8pm',
      redesSociales: {
        facebook: configTienda?.footer?.redesSociales?.facebook ?? '',
        instagram: configTienda?.footer?.redesSociales?.instagram ?? '',
        tiktok: configTienda?.footer?.redesSociales?.tiktok ?? '',
        youtube: configTienda?.footer?.redesSociales?.youtube ?? '',
      },
      linksRapidos: linksRapidos.length > 0 ? linksRapidos : defaultLinksFooter,
      textoCopyright:
        configTienda?.footer?.textoCopyright ??
        `© ${new Date().getFullYear()} PlusSport. Todos los derechos reservados.`,
    },
    colores: {
      primario: configTienda?.colores?.primario ?? '#1a237e',
      acento: configTienda?.colores?.acento ?? '#ff6f00',
      fondo: configTienda?.colores?.fondo ?? '#ffffff',
    },
    moneda: {
      simbolo: configTienda?.moneda?.simbolo ?? 'S/',
      codigoISO: configTienda?.moneda?.codigoISO ?? 'PEN',
    },
    homeSections: homeSections.length > 0 ? homeSections : defaultHomeSections,
  }
}

export const getStorefrontConfig = unstable_cache(
  async (): Promise<StorefrontConfig> => {
    const payload = await getPayloadClient()

    const [configTienda, categoriasRes] = await Promise.all([
      payload
        .findGlobal({
          slug: 'config-tienda',
          depth: 1,
        })
        .catch(() => null as any),
      payload
        .find({
          collection: 'categorias',
          where: { activa: { equals: true } },
          sort: 'orden',
          limit: 50,
          depth: 0,
        })
        .catch(() => ({ docs: [] as any[] })),
    ])

    return normalizeStorefrontConfig(configTienda, categoriasRes.docs)
  },
  ['storefront-config'],
  { revalidate: 300 },
)

export const getHomeData = unstable_cache(
  async () => {
    const payload = await getPayloadClient()

    const [productosRes, marcasRes, bannersRes, categoriasRes, storefront] = await Promise.all([
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
      getStorefrontConfig(),
    ])

    const slides = await Promise.all(
      bannersRes.docs.map(async (doc: any) => {
        let imagenUrl: string | null = null
        if (doc.imagen) {
          if (typeof doc.imagen === 'object') {
            imagenUrl = doc.imagen.url || (doc.imagen.filename ? `/media/${doc.imagen.filename}` : null)
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
        slug: normalizeCategorySlug(c.slug ?? c.nombre ?? ''),
      })),
      storefront,
    }
  },
  ['store-home-data'],
  { revalidate: 60 },
)

export const getStoreIdentity = unstable_cache(
  async (): Promise<StoreIdentity> => {
    const storefront = await getStorefrontConfig()
    return storefront.identity
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
      slug: normalizeCategorySlug(c.slug ?? c.nombre ?? ''),
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
  search?: string
}

export const getProductList = async ({
  page = 1,
  limit = PRODUCTS_PER_PAGE,
  segmento,
  marcaSlug,
  categoriaId,
  onlyOffers,
  search,
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

  if (search && search.trim()) {
    where.or = [{ nombre: { contains: search.trim() } }, { slug: { contains: search.trim() } }]
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
      const normalizedSlug = normalizeCategorySlug(slug)
      if (!normalizedSlug) return null

      const categoriasRes = await payload
        .find({
          collection: 'categorias',
          where: { slug: { equals: normalizedSlug }, activa: { equals: true } },
          limit: 1,
          depth: 0,
        })
        .catch(() => ({ docs: [] as any[] }))

      if (categoriasRes.docs[0]) {
        return categoriasRes.docs[0]
      }

      const allCategoriasRes = await payload
        .find({
          collection: 'categorias',
          where: { activa: { equals: true } },
          limit: 100,
          depth: 0,
        })
        .catch(() => ({ docs: [] as any[] }))

      return (
        allCategoriasRes.docs.find((categoria: any) => {
          const categoriaSlug = String(categoria?.slug || categoria?.nombre || '')
          return normalizeCategorySlug(categoriaSlug) === normalizedSlug
        }) ?? null
      )
    },
    ['store-categoria-by-slug', slug],
    { revalidate: 120 },
  )

  return getCachedBySlug()
}
