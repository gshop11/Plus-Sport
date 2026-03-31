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

