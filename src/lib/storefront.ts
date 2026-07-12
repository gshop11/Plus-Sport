import 'server-only'
import config from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import { resolveMediaURL } from './media'
import { isEcommerceEnabled } from './payment-methods'
import type { HeaderMenuItem, HomeBrand, HomeCategory, HomeData, HomeSectionConfig, ProductoCard, ProductoDetalle, StoreIdentity, StorefrontConfig } from './storefront-types'
export type { HeaderMenuItem, HomeBrand, HomeCategory, HomeData, HomeSectionConfig, ProductoCard, ProductoDetalle, StoreIdentity, StorefrontConfig } from './storefront-types'

export const PRODUCTS_PER_PAGE = 24
const HOME_PRODUCT_LIMIT = 8
const HOME_NEW_ARRIVAL_LIMIT = 24
const HOME_MAIN_CATEGORY_LIMIT = 6
const HOME_CATEGORY_LIMIT = 24
const HOME_BRAND_LIMIT = 20
const HOME_BANNER_LIMIT = 10

type HomeBrandDoc = Record<string, unknown> & {
  id?: string | number
  nombre?: string
  slug?: string
  logo?: Record<string, unknown> | null
}

type HomeCategoryDoc = Record<string, unknown> & {
  id?: string | number
  nombre?: string
  slug?: string
  icono?: string
  descripcion?: string
  imagen?: Record<string, unknown> | null
  categoriaPadre?: string | number | { id?: string | number | null } | null
}

const defaultMenu: HeaderMenuItem[] = [
  { etiqueta: 'Hombre', url: '/productos?segmento=hombre' },
  { etiqueta: 'Mujer', url: '/productos?segmento=mujer' },
  { etiqueta: 'Ninos', url: '/productos?segmento=ninos' },
  { etiqueta: 'Colecciones', url: '/categorias' },
  { etiqueta: 'Marcas', url: '/marcas' },
  { etiqueta: 'Ofertas', url: '/ofertas', esDestacado: true },
]

const defaultLinksFooter = [
  { etiqueta: 'Inicio', url: '/' },
  { etiqueta: 'Todos los productos', url: '/productos' },
  { etiqueta: 'Categorias', url: '/categorias' },
  { etiqueta: 'Ofertas', url: '/ofertas' },
  { etiqueta: 'Terminos y condiciones', url: '/terminos' },
  { etiqueta: 'Politica de privacidad', url: '/privacidad' },
  { etiqueta: 'Cambios y devoluciones', url: '/cambios-devoluciones' },
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
  slug: doc.slug ?? '',
  nombre: doc.nombre ?? '',
  sku: doc.sku ?? undefined,
  marca: typeof doc.marca === 'object' && doc.marca ? doc.marca.nombre ?? '' : '',
  categoria: typeof doc.categoria === 'object' && doc.categoria ? doc.categoria.nombre ?? undefined : undefined,
  precio: doc.precio ?? 0,
  precioAnterior: doc.precioAnterior ?? undefined,
  imagenUrl: resolveImagenUrl(doc.imagenPrincipal),
  tallas: Array.isArray(doc.tallas) ? doc.tallas.map((t: any) => t.talla) : [],
  stock: Array.isArray(doc.tallas) && doc.tallas.length > 0
    ? doc.tallas.reduce((total: number, item: any) => total + (Number(item?.stock) || 0), 0)
    : Number(doc.stock || 0),
  etiqueta: (doc.etiqueta as ProductoCard['etiqueta']) ?? '',
})

const uniqueProductsById = (products: ProductoCard[], limit: number): ProductoCard[] => {
  const seen = new Set<string>()
  const unique: ProductoCard[] = []

  for (const product of products) {
    if (seen.has(product.id)) continue
    seen.add(product.id)
    unique.push(product)
    if (unique.length >= limit) break
  }

  return unique
}

const mapBrandToHomeBrand = (brand: HomeBrandDoc): HomeBrand => ({
  id: String(brand.id),
  nombre: brand.nombre ?? '',
  slug: brand.slug ?? '',
  logoUrl: resolveMediaURL(brand.logo),
})

const mapCategoryToHomeCategory = (category: HomeCategoryDoc): HomeCategory => ({
  id: String(category.id),
  nombre: category.nombre ?? '',
  icono: category.icono ?? 'X',
  descripcion: category.descripcion ?? '',
  imagenUrl: resolveMediaURL(category.imagen),
  slug: normalizeCategorySlug(category.slug ?? category.nombre ?? ''),
})

const getCategoryParentId = (category: HomeCategoryDoc): string | null => {
  const parent = category?.categoriaPadre
  if (!parent) return null
  if (typeof parent === 'number' || typeof parent === 'string') return String(parent)
  if (typeof parent === 'object' && parent.id !== undefined && parent.id !== null) return String(parent.id)
  return null
}

const splitHomeCategories = (categories: HomeCategoryDoc[]) => {
  const primaryDocs = categories.filter((category) => !getCategoryParentId(category))
  const primaryPool = primaryDocs.length > 0 ? primaryDocs : categories
  const mainCategoryDocs = primaryPool.slice(0, HOME_MAIN_CATEGORY_LIMIT)
  const mainIds = new Set(mainCategoryDocs.map((category) => String(category.id)))
  const generalCategoryDocs = categories.filter((category) => !mainIds.has(String(category.id)))

  return {
    mainCategories: mainCategoryDocs.map(mapCategoryToHomeCategory),
    generalCategories: generalCategoryDocs.map(mapCategoryToHomeCategory),
  }
}

const getRelationshipId = (value: any) => {
  if (typeof value === 'number' || typeof value === 'string') return String(value)
  if (value && typeof value === 'object' && value.id !== undefined && value.id !== null) {
    return String(value.id)
  }
  return ''
}

const getRelationshipName = (value: any, fallback = '') => {
  if (value && typeof value === 'object' && typeof value.nombre === 'string') {
    return value.nombre
  }
  return fallback
}

const getRelationshipSlug = (value: any, fallback = '') => {
  if (value && typeof value === 'object' && typeof value.slug === 'string') {
    return value.slug
  }
  return fallback
}

const getTextFromNode = (node: any): string => {
  if (!node || typeof node !== 'object') return ''

  if (typeof node.text === 'string') {
    return node.text
  }

  if (!Array.isArray(node.children)) return ''

  return node.children
    .map((child: any) => getTextFromNode(child))
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const extractDescription = (value: any): string => {
  if (typeof value === 'string') {
    return value.trim()
  }
  if (!value || typeof value !== 'object') return ''
  const rootChildren = Array.isArray(value.root?.children) ? value.root.children : []
  if (!rootChildren.length) return ''

  return rootChildren
    .map((node: any) => getTextFromNode(node))
    .filter(Boolean)
    .join('\n\n')
    .trim()
}

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

    return resolveMediaURL(media as unknown as Record<string, unknown>)
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
      anuncioBarra: configTienda?.header?.anuncioBarra ?? 'CATALOGO DEPORTIVO CON ATENCION POR WHATSAPP',
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
    whatsapp: {
      numero: configTienda?.header?.numeroWhatsapp || configTienda?.footer?.telefono || '+51 979 705 255',
      textoBoton: configTienda?.header?.textoBtnWhatsapp || 'Consultar disponibilidad',
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
    ecommerceEnabled: isEcommerceEnabled(),
  }
}

const getStorefrontConfigCached = unstable_cache(
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

// La configuracion de tienda (menu, footer, colores...) se cachea, pero
// ecommerceEnabled es un interruptor de entorno que NO debe quedar horneado
// en el Data Cache: se recomputa fresco en cada llamada para que activar o
// desactivar la compra se refleje de inmediato tras el cambio de la variable.
export async function getStorefrontConfig(): Promise<StorefrontConfig> {
  const cached = await getStorefrontConfigCached()
  return { ...cached, ecommerceEnabled: isEcommerceEnabled() }
}

export const getHomeData = unstable_cache(
  async (): Promise<HomeData> => {
    const payload = await getPayloadClient()

    const [
      featuredProductsRes,
      promotionalProductsRes,
      newArrivalProductsRes,
      marcasRes,
      bannersRes,
      categoriasRes,
      storefront,
    ] = await Promise.all([
      payload
        .find({
          collection: 'productos',
          where: { activo: { equals: true }, destacado: { equals: true } },
          limit: HOME_PRODUCT_LIMIT,
          depth: 1,
          sort: '-createdAt',
        })
        .catch(() => ({ docs: [] as any[] })),
      payload
        .find({
          collection: 'productos',
          where: { activo: { equals: true }, etiqueta: { equals: 'oferta' } },
          limit: HOME_PRODUCT_LIMIT,
          depth: 1,
          sort: '-createdAt',
        })
        .catch(() => ({ docs: [] as any[] })),
      payload
        .find({
          collection: 'productos',
          where: { activo: { equals: true }, nuevoIngreso: { equals: true } },
          limit: HOME_NEW_ARRIVAL_LIMIT,
          depth: 1,
          sort: '-createdAt',
        })
        .catch(() => ({ docs: [] as any[] })),
      payload
        .find({
          collection: 'marcas',
          where: { activa: { equals: true } },
          limit: HOME_BRAND_LIMIT,
          depth: 0,
          sort: 'nombre',
        })
        .catch(() => ({ docs: [] as any[] })),
      payload
        .find({
          collection: 'banners',
          where: { activo: { equals: true } },
          sort: 'orden',
          limit: HOME_BANNER_LIMIT,
          depth: 1,
        })
        .catch(() => ({ docs: [] as any[] })),
      payload
        .find({
          collection: 'categorias',
          where: { activa: { equals: true } },
          sort: 'orden',
          limit: HOME_CATEGORY_LIMIT,
          depth: 1,
        })
        .catch(() => ({ docs: [] as any[] })),
      getStorefrontConfig(),
    ])

    const featuredProducts = uniqueProductsById(featuredProductsRes.docs.map(mapProductoToCard), HOME_PRODUCT_LIMIT)

    // A product only counts as an offer when it carries the explicit "oferta" tag.
    // precioAnterior alone is not a promotion signal and must never be used to infer one.
    const promotionalProducts = uniqueProductsById(promotionalProductsRes.docs.map(mapProductoToCard), HOME_PRODUCT_LIMIT)

    const newArrivalProducts = uniqueProductsById(newArrivalProductsRes.docs.map(mapProductoToCard), HOME_NEW_ARRIVAL_LIMIT)

    const banners = await Promise.all(
      bannersRes.docs.map(async (doc: any) => {
        let imagenUrl: string | null = null
        if (doc.imagen) {
          if (typeof doc.imagen === 'object') {
            imagenUrl = resolveMediaURL(doc.imagen)
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

    const brands = (marcasRes.docs as HomeBrandDoc[]).map(mapBrandToHomeBrand)
    const { mainCategories, generalCategories } = splitHomeCategories(categoriasRes.docs as HomeCategoryDoc[])
    const categories = [...mainCategories, ...generalCategories]

    return {
      banners,
      featuredProducts,
      promotionalProducts,
      newArrivalProducts,
      mainCategories,
      generalCategories,
      brands,
      config: storefront,
      slides: banners,
      productos: featuredProducts,
      marcas: brands,
      categorias: categories,
      storefront,
    }
  },
  ['store-home-data-v2'],
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
      descripcion: c.descripcion ?? '',
      imagenUrl: resolveMediaURL(c.imagen),
      slug: normalizeCategorySlug(c.slug ?? c.nombre ?? ''),
      id: String(c.id),
    }))
  },
  ['store-categorias-data'],
  { revalidate: 120 },
)

const compareTallas = (a: string, b: string) => {
  const numA = Number(a)
  const numB = Number(b)
  const isNumA = a.trim() !== '' && Number.isFinite(numA)
  const isNumB = b.trim() !== '' && Number.isFinite(numB)

  if (isNumA && isNumB) return numA - numB
  if (isNumA) return -1
  if (isNumB) return 1
  return a.localeCompare(b, 'es', { sensitivity: 'base' })
}

export const getTallasDisponibles = unstable_cache(
  async (): Promise<string[]> => {
    const payload = await getPayloadClient()

    const result = await payload
      .findDistinct({
        collection: 'productos',
        field: 'tallas.talla',
        where: { activo: { equals: true } },
      })
      .catch(() => ({ values: [] as Record<string, unknown>[] }))

    const tallas = result.values
      .map((row) => String((row as Record<string, unknown>)['tallas.talla'] ?? '').trim())
      .filter((talla) => talla.length > 0)

    return [...new Set(tallas)].sort(compareTallas)
  },
  ['store-tallas-data'],
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
      logoUrl: resolveMediaURL(m.logo),
    }))
  },
  ['store-marcas-data'],
  { revalidate: 120 },
)

export type ProductSort = 'newest' | 'price_asc' | 'price_desc' | 'name_asc'

export type ProductListInput = {
  page?: number
  limit?: number
  segmento?: string
  marcaSlug?: string
  categoriaId?: string
  talla?: string
  precioMin?: number
  precioMax?: number
  onlyOffers?: boolean
  onlyAvailable?: boolean
  search?: string
  sort?: ProductSort
}

export const getProductList = async ({
  page = 1,
  limit = PRODUCTS_PER_PAGE,
  segmento,
  marcaSlug,
  categoriaId,
  talla,
  precioMin,
  precioMax,
  onlyOffers,
  onlyAvailable,
  search,
  sort = 'newest',
}: ProductListInput) => {
  const payload = await getPayloadClient()

  // Built as an explicit AND array (Change 13) so independent OR clauses
  // (search, disponibilidad) never overwrite one another.
  const and: any[] = [{ activo: { equals: true } }]

  if (segmento) {
    and.push({ segmento: { in: [segmento, 'unisex'] } })
  }

  if (categoriaId) {
    and.push({ categoria: { equals: categoriaId } })
  }

  if (marcaSlug) {
    const marcas = await getMarcasData()
    const marca = marcas.find((m) => m.slug === marcaSlug)
    if (marca) {
      and.push({ marca: { equals: marca.id } })
    }
  }

  if (typeof precioMin === 'number') {
    and.push({ precio: { greater_than: precioMin } })
  }

  if (typeof precioMax === 'number') {
    and.push({ precio: { less_than_equal: precioMax } })
  }

  if (talla) {
    // Both conditions resolve to the same joined "tallas" row (Postgres relational
    // adapter), so this requires stock > 0 on the specific selected talla, not just
    // anywhere in the array.
    and.push({ 'tallas.talla': { equals: talla } })
    and.push({ 'tallas.stock': { greater_than: 0 } })
  }

  if (onlyOffers) {
    and.push({ etiqueta: { equals: 'oferta' } })
  }

  if (search && search.trim()) {
    and.push({ or: [{ nombre: { contains: search.trim() } }, { slug: { contains: search.trim() } }] })
  }

  if (onlyAvailable) {
    and.push({ or: [{ stock: { greater_than: 0 } }, { 'tallas.stock': { greater_than: 0 } }] })
  }

  const sortMap: Record<ProductSort, string> = {
    newest: '-createdAt',
    price_asc: 'precio',
    price_desc: '-precio',
    name_asc: 'nombre',
  }

  const res = await payload
    .find({
      collection: 'productos',
      where: { and },
      page,
      limit,
      depth: 1,
      sort: sortMap[sort] ?? '-createdAt',
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

export const getProductoDetalleBySlug = async (slug: string): Promise<{ producto: ProductoDetalle; relacionados: ProductoCard[] } | null> => {
  const getCachedBySlug = unstable_cache(
    async () => {
      const payload = await getPayloadClient()
      const slugValue = String(slug || '').trim().toLowerCase()
      if (!slugValue) return null

      const productoRes = await payload
        .find({
          collection: 'productos',
          where: {
            and: [{ slug: { equals: slugValue } }, { activo: { equals: true } }],
          },
          limit: 1,
          depth: 2,
        })
        .catch(() => ({ docs: [] as any[] }))

      const doc = productoRes.docs[0]
      if (!doc) return null

      const marcaId = getRelationshipId(doc.marca)
      const categoriaId = getRelationshipId(doc.categoria)

      const galeriaUrls: string[] = []
      let principal = resolveImagenUrl(doc.imagenPrincipal)
      if (!principal && doc.imagenPrincipal) {
        principal = await resolveMediaUrl(payload, doc.imagenPrincipal)
      }
      if (principal) galeriaUrls.push(principal)

      if (Array.isArray(doc.imagenes)) {
        for (const item of doc.imagenes) {
          let imageURL = resolveImagenUrl(item?.imagen)
          if (!imageURL && item?.imagen) {
            imageURL = await resolveMediaUrl(payload, item.imagen)
          }
          if (imageURL) galeriaUrls.push(imageURL)
        }
      }

      const uniqueGallery = [...new Set(galeriaUrls)]

      const tallas = Array.isArray(doc.tallas)
        ? doc.tallas
            .map((item: any) => ({
              talla: String(item?.talla || '').trim(),
              stock: Number(item?.stock || 0),
              ventaHabilitada: Boolean(item?.ventaHabilitada),
              skuVariante: item?.skuVariante ? String(item.skuVariante) : undefined,
              precio: Number.isFinite(Number(item?.precio)) && Number(item?.precio) > 0 ? Number(item.precio) : undefined,
              imagenUrl: resolveImagenUrl(item?.imagen) ?? undefined,
            }))
            .filter((item: { talla: string }) => item.talla.length > 0)
        : []

      const stock =
        tallas.length > 0
          ? tallas.reduce((acc: number, item: { stock: number }) => acc + (Number(item.stock) || 0), 0)
          : Number(doc.stock || 0)

      const descripcion = extractDescription(doc.descripcion)

      const producto: ProductoDetalle = {
        id: String(doc.id),
        slug: doc.slug ?? slugValue,
        nombre: doc.nombre ?? '',
        sku: doc.sku ?? undefined,
        marca: {
          id: marcaId,
          nombre: getRelationshipName(doc.marca, ''),
          slug: getRelationshipSlug(doc.marca, ''),
        },
        categoria: {
          id: categoriaId,
          nombre: getRelationshipName(doc.categoria, ''),
          slug: normalizeCategorySlug(getRelationshipSlug(doc.categoria, getRelationshipName(doc.categoria, ''))),
        },
        precio: Number(doc.precio || 0),
        precioAnterior: doc.precioAnterior ?? undefined,
        imagenUrl: principal,
        galeriaUrls: uniqueGallery,
        tallas,
        stock,
        descripcion,
        etiqueta: (doc.etiqueta as ProductoDetalle['etiqueta']) ?? '',
        segmento: (doc.segmento as ProductoDetalle['segmento']) ?? 'unisex',
        color: doc.color ? String(doc.color) : undefined,
        activo: doc.activo !== false,
        ventaOnline: Boolean(doc.ventaOnline),
      }

      const relacionados: ProductoCard[] = []
      const seenIds = new Set([producto.id])

      const addRelatedDocs = (docs: any[]) => {
        for (const row of docs) {
          const rowId = String(row.id)
          if (seenIds.has(rowId)) continue
          seenIds.add(rowId)
          relacionados.push(mapProductoToCard(row))
          if (relacionados.length >= 8) break
        }
      }

      if (categoriaId) {
        const byCategory = await payload
          .find({
            collection: 'productos',
            where: {
              and: [{ activo: { equals: true } }, { categoria: { equals: categoriaId } }],
            },
            limit: 10,
            depth: 1,
            sort: '-createdAt',
          })
          .catch(() => ({ docs: [] as any[] }))

        addRelatedDocs(byCategory.docs)
      }

      if (relacionados.length < 4 && marcaId) {
        const byBrand = await payload
          .find({
            collection: 'productos',
            where: {
              and: [{ activo: { equals: true } }, { marca: { equals: marcaId } }],
            },
            limit: 10,
            depth: 1,
            sort: '-createdAt',
          })
          .catch(() => ({ docs: [] as any[] }))

        addRelatedDocs(byBrand.docs)
      }

      return {
        producto,
        relacionados: relacionados.slice(0, 8),
      }
    },
    ['store-producto-detalle', slug],
    { revalidate: 60 },
  )

  return getCachedBySlug()
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
