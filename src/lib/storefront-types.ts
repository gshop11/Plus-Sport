export type ProductoCard = {
  id: string
  slug?: string
  nombre: string
  sku?: string
  marca: string
  categoria?: string
  precio: number
  precioAnterior?: number
  imagenUrl?: string | null
  tallas?: string[]
  stock?: number
  etiqueta?: 'nuevo' | 'hot' | 'top' | 'oferta' | ''
}

export type ProductoTalla = {
  talla: string
  stock: number
  ventaHabilitada?: boolean
  skuVariante?: string
  precio?: number
  imagenUrl?: string
}

export type ProductoDetalle = {
  id: string
  slug: string
  nombre: string
  sku?: string
  marca: {
    id: string
    nombre: string
    slug: string
  }
  categoria: {
    id: string
    nombre: string
    slug: string
  }
  precio: number
  precioAnterior?: number
  imagenUrl: string | null
  galeriaUrls: string[]
  tallas: ProductoTalla[]
  stock: number
  descripcion: string
  etiqueta?: 'nuevo' | 'hot' | 'top' | 'oferta' | ''
  segmento?: 'hombre' | 'mujer' | 'ninos' | 'unisex'
  color?: string
  activo?: boolean
  ventaOnline?: boolean
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

export type HomeBrand = {
  id: string
  nombre: string
  slug: string
  logoUrl: string | null
}

export type HomeCategory = {
  id: string
  nombre: string
  icono: string
  descripcion: string
  imagenUrl: string | null
  slug: string
}

export type StoreIdentity = {
  name: string
  tagline: string
  logoUrl: string | null
  logoAlt: string
}

export type HeaderMenuItem = {
  etiqueta: string
  url: string
  esDestacado?: boolean
  subItems?: { etiqueta: string; url: string }[]
}

export type HomeSectionConfig = {
  key: 'categorias' | 'marcas' | 'destacados' | 'suscripcion'
  titulo: string
  subtitulo: string
  mostrar: boolean
  orden: number
}

export type StorefrontConfig = {
  identity: StoreIdentity
  header: {
    anuncioBarra: string
    mostrarAnuncio: boolean
    menuPrincipal: HeaderMenuItem[]
  }
  footer: {
    descripcion: string
    telefono: string
    email: string
    direccion: string
    horario: string
    redesSociales: {
      facebook: string
      instagram: string
      tiktok: string
      youtube: string
    }
    linksRapidos: { etiqueta: string; url: string }[]
    textoCopyright: string
  }
  whatsapp: {
    numero: string
    textoBoton: string
  }
  colores: {
    primario: string
    acento: string
    fondo: string
  }
  moneda: {
    simbolo: string
    codigoISO: string
  }
  homeSections: HomeSectionConfig[]
}

export type HomeData = {
  banners: HomeSlide[]
  featuredProducts: ProductoCard[]
  promotionalProducts: ProductoCard[]
  newArrivalProducts: ProductoCard[]
  mainCategories: HomeCategory[]
  generalCategories: HomeCategory[]
  brands: HomeBrand[]
  config: StorefrontConfig
  slides: HomeSlide[]
  productos: ProductoCard[]
  categorias: HomeCategory[]
  marcas: HomeBrand[]
  storefront: StorefrontConfig
}
