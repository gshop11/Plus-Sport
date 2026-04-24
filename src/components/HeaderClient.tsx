'use client'

import type { StorefrontConfig } from '@/lib/storefront-types'
import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import CartDrawer from './CartDrawer'
import CartCountBadge from './CartCountBadge'

type HeaderClientProps = {
  initialConfig?: StorefrontConfig
}

const fallbackConfig: StorefrontConfig = {
  identity: {
    name: 'PlusSport',
    tagline: 'Performance Athletic Wear',
    logoUrl: null,
    logoAlt: 'PlusSport logo',
  },
  header: {
    anuncioBarra: 'ENVIO GRATIS POR COMPRAS MAYORES A S/299',
    mostrarAnuncio: true,
    menuPrincipal: [
      { etiqueta: 'Catalogo', url: '/productos' },
      { etiqueta: 'Mujer', url: '/productos?segmento=mujer' },
      { etiqueta: 'Hombre', url: '/productos?segmento=hombre' },
      { etiqueta: 'Ninos', url: '/productos?segmento=ninos' },
      { etiqueta: 'Marcas', url: '/marcas' },
      { etiqueta: 'Ofertas', url: '/ofertas', esDestacado: true },
    ],
  },
  footer: {
    descripcion: 'Tu tienda deportiva de confianza en Peru.',
    telefono: '',
    email: '',
    direccion: 'Lima, Peru',
    horario: 'Lunes a Sabado 9am-8pm',
    redesSociales: { facebook: '', instagram: '', tiktok: '', youtube: '' },
    linksRapidos: [
      { etiqueta: 'Inicio', url: '/' },
      { etiqueta: 'Todos los productos', url: '/productos' },
      { etiqueta: 'Categorias', url: '/categorias' },
      { etiqueta: 'Ofertas', url: '/ofertas' },
    ],
    textoCopyright: '© 2026 PlusSport. Todos los derechos reservados.',
  },
  colores: {
    primario: '#1a237e',
    acento: '#ff6f00',
    fondo: '#ffffff',
  },
  moneda: {
    simbolo: 'S/',
    codigoISO: 'PEN',
  },
  homeSections: [
    { key: 'categorias', titulo: 'TU DEPORTE, TU ESTILO', subtitulo: '- Explora por deporte', mostrar: true, orden: 1 },
    { key: 'marcas', titulo: 'LAS MEJORES DEL MUNDO', subtitulo: '- Marcas oficiales', mostrar: true, orden: 2 },
    { key: 'destacados', titulo: 'LO MAS VENDIDO', subtitulo: '- Mas comprados', mostrar: true, orden: 3 },
    { key: 'suscripcion', titulo: 'Ofertas exclusivas para ti', subtitulo: 'Dejanos tu WhatsApp y te avisamos primero.', mostrar: true, orden: 4 },
  ],
}

const fallbackSports = [{ etiqueta: 'Ver categorias', url: '/categorias' }]

const itemKey = (url: string, index: number) => `${url}-${index}`

function UserIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6" />
    </svg>
  )
}

function CartIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[19px] w-[19px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
      <path d="M3 5h2l2 10h10l2-7H6" />
    </svg>
  )
}

function HeaderClientInner({ initialConfig }: HeaderClientProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()

  const [config, setConfig] = useState<StorefrontConfig>(initialConfig ?? fallbackConfig)
  const [menuOpen, setMenuOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [deporteOpen, setDeporteOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const navRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig)
      return
    }

    let cancelled = false

    const loadConfig = async () => {
      try {
        const res = await fetch('/api/storefront-config', { cache: 'no-store' })
        if (!res.ok) return
        const data = (await res.json()) as StorefrontConfig
        if (!cancelled) setConfig(data)
      } catch {
        // keep fallback
      }
    }

    void loadConfig()

    return () => {
      cancelled = true
    }
  }, [initialConfig])

  useEffect(() => {
    setDeporteOpen(false)
    setMenuOpen(false)
  }, [pathname, searchParams])

  useEffect(() => {
    document.body.style.overflow = menuOpen || cartOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen, cartOpen])

  useEffect(() => {
    const onOutsideClick = (event: MouseEvent) => {
      if (!deporteOpen) return
      if (!navRef.current?.contains(event.target as Node)) {
        setDeporteOpen(false)
      }
    }

    document.addEventListener('mousedown', onOutsideClick)
    return () => document.removeEventListener('mousedown', onOutsideClick)
  }, [deporteOpen])

  useEffect(() => {
    const openCart = () => setCartOpen(true)
    window.addEventListener('carrito:open', openCart)
    return () => window.removeEventListener('carrito:open', openCart)
  }, [])

  const menuItems = useMemo(() => config.header.menuPrincipal ?? [], [config])

  const configuredDeportes = useMemo(
    () =>
      menuItems.find(
        (item) => Array.isArray(item.subItems) && item.subItems.length > 0 && item.etiqueta.toLowerCase().includes('deporte'),
      ),
    [menuItems],
  )

  const deportesItems = (configuredDeportes?.subItems && configuredDeportes.subItems.length > 0)
    ? configuredDeportes.subItems
    : fallbackSports

  const navItems = menuItems.filter((item) => item !== configuredDeportes)
  const leftItems = navItems.filter((item) => !item.esDestacado)
  const rightItems = navItems.filter((item) => item.esDestacado)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const term = searchValue.trim()
    if (!term) return
    router.push(`/productos?search=${encodeURIComponent(term)}`)
    setMenuOpen(false)
  }

  const buildNavHref = (url: string) => {
    try {
      const parsed = new URL(url, 'http://localhost')
      const targetPath = parsed.pathname
      const targetQuery = parsed.searchParams

      if (targetPath === '/ofertas') {
        const next = new URLSearchParams()
        const segmento = searchParams.get('segmento')
        const coleccion = searchParams.get('coleccion')
        const marca = searchParams.get('marca')
        const search = searchParams.get('search')
        if (segmento) next.set('segmento', segmento)
        if (coleccion) next.set('coleccion', coleccion)
        if (marca) next.set('marca', marca)
        if (search) next.set('search', search)

        const ofertaActiva = pathname === '/ofertas' || (pathname === '/productos' && searchParams.get('oferta') === '1')
        if (!ofertaActiva) {
          next.set('oferta', '1')
        }

        return next.size > 0 ? `/productos?${next.toString()}` : '/productos'
      }

      if (targetPath === '/productos') {
        const next = new URLSearchParams(targetQuery)
        const keepOferta = searchParams.get('oferta') === '1'
        if (keepOferta) {
          next.set('oferta', '1')
        }
        if (targetQuery.size === 0) {
          return next.size > 0 ? `/productos?${next.toString()}` : '/productos'
        }
        return `/productos?${next.toString()}`
      }

      return url
    } catch {
      return url
    }
  }

  const isItemActive = (url: string) => {
    try {
      const parsed = new URL(url, 'http://localhost')
      const targetPath = parsed.pathname
      const targetQuery = parsed.searchParams
      const currentPath = pathname

      if (targetPath === '/ofertas') {
        return pathname === '/ofertas' || (pathname === '/productos' && searchParams.get('oferta') === '1')
      }

      if (targetPath !== currentPath && !currentPath.startsWith(`${targetPath}/`)) return false

      if (targetPath === '/productos' && [...targetQuery.keys()].length === 0) {
        return currentPath === '/productos'
      }

      for (const [key, value] of targetQuery.entries()) {
        if (searchParams.get(key) !== value) return false
      }

      if ([...targetQuery.keys()].length === 0 && targetPath !== '/') {
        return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`)
      }

      return true
    } catch {
      return false
    }
  }

  const isDeportesActive = pathname === '/categorias' || deportesItems.some((item) => isItemActive(item.url))

  const [firstNamePart, ...restNameParts] = (config.identity.name || 'PlusSport').split(' ')
  const restName = restNameParts.join(' ')

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-black/5 bg-white/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/80">
        {config.header.mostrarAnuncio && (
          <div className="bg-primary px-4 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.13em] text-white/90">{config.header.anuncioBarra}</div>
        )}

        <div className="border-b border-gray-200/80 px-4 py-4 text-gray-900">
          <div className="mx-auto flex max-w-7xl items-center gap-4 lg:grid lg:grid-cols-[220px_minmax(0,1fr)_220px] lg:gap-6">
            <Link href="/" className="min-w-fit flex-shrink-0 lg:w-[220px]">
              <span className="block text-[10px] font-semibold uppercase tracking-[0.28em] text-gray-500">{config.identity.tagline}</span>
              <span className="font-display block text-3xl font-black leading-none">
                <span className="text-accent">{firstNamePart}</span>
                {restName ? <span className="text-primary"> {restName}</span> : null}
              </span>
            </Link>

            <div className="hidden flex-1 items-center justify-center md:flex lg:justify-center">
              <form onSubmit={handleSearch} className="flex w-full max-w-2xl items-center overflow-hidden rounded-xl border border-gray-300 bg-white shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                <input
                  type="text"
                  placeholder="Busca zapatillas, marcas o colecciones..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="flex-1 bg-transparent px-6 py-3 text-sm text-gray-800 outline-none"
                />
                <button type="submit" className="store-button-primary rounded-none px-5 py-3">Buscar</button>
              </form>
            </div>

            <div className="hidden items-center justify-end gap-3 lg:flex lg:w-[220px]">
              <Link href="/checkout" className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-primary hover:text-primary">
                <UserIcon />
                <span>Mi cuenta</span>
              </Link>
              <button
                type="button"
                onClick={() => setCartOpen(true)}
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 text-gray-900 transition-colors hover:border-primary hover:text-primary"
                aria-label="Abrir carrito"
              >
                <CartIcon />
                <span className="sr-only">Carrito</span>
                <CartCountBadge />
              </button>
            </div>

            <div className="ml-auto flex items-center gap-4 md:hidden">
              <button
                type="button"
                onClick={() => setCartOpen(true)}
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 text-gray-900 transition-colors hover:border-primary hover:text-primary"
                aria-label="Abrir carrito"
              >
                <CartIcon />
                <CartCountBadge />
              </button>
              <button className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-bold uppercase tracking-[0.16em] text-gray-900" onClick={() => setMenuOpen((prev) => !prev)} aria-label="Abrir menu">
                {menuOpen ? 'Cerrar' : 'Menu'}
              </button>
            </div>
          </div>

          <div className="mx-auto mt-4 md:hidden">
            <form onSubmit={handleSearch} className="flex items-center overflow-hidden rounded-xl border border-gray-300 bg-white shadow-sm">
              <input
                type="text"
                placeholder="Buscar productos..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="flex-1 bg-transparent px-4 py-3 text-sm text-gray-800 outline-none"
              />
              <button type="submit" className="store-button-primary rounded-none px-4 py-3 text-xs">Buscar</button>
            </form>
          </div>
        </div>

        <nav ref={navRef} className="hidden border-b border-primary/15 bg-primary sm:block">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4">
            <div className="flex min-w-0 items-center">
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => setDeporteOpen((prev) => !prev)}
                  className="flex items-center gap-1 whitespace-nowrap px-5 py-4 text-sm font-medium uppercase tracking-[0.08em] text-white transition-colors hover:bg-white/10"
                  style={{ backgroundColor: isDeportesActive || deporteOpen ? 'var(--color-acento)' : 'transparent' }}
                >
                  DEPORTES
                  <span className={`text-xs opacity-75 transition-transform ${deporteOpen ? 'rotate-180' : ''}`}>v</span>
                </button>
                {deporteOpen && (
                  <div className="absolute left-0 top-full z-50 min-w-[220px] overflow-hidden rounded-b-xl border border-gray-200 bg-white shadow-xl">
                    {deportesItems.map((item) => (
                      <Link key={`deporte-${item.url}`} href={item.url} className="block px-5 py-3 text-sm font-medium text-gray-800 transition-colors hover:bg-orange-50 hover:text-accent">
                        {item.etiqueta}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center overflow-x-auto">
                {leftItems.map((item, index) => {
                  const active = isItemActive(item.url)
                  return (
                    <Link
                      key={itemKey(item.url, index)}
                      href={buildNavHref(item.url)}
                      className="whitespace-nowrap px-5 py-4 text-sm font-medium uppercase tracking-[0.08em] text-white transition-colors hover:bg-white/10"
                      style={{ backgroundColor: active ? 'var(--color-acento)' : 'transparent' }}
                    >
                      {item.etiqueta}
                    </Link>
                  )
                })}
              </div>
            </div>

            <div className="hidden flex-shrink-0 items-center lg:flex">
              {rightItems.map((item, index) => {
                const active = isItemActive(item.url)
                return (
                  <Link
                    key={itemKey(item.url, index)}
                    href={buildNavHref(item.url)}
                    className="whitespace-nowrap px-5 py-4 text-sm font-bold uppercase tracking-[0.08em] text-white transition-colors hover:bg-white/10"
                    style={{ backgroundColor: active ? 'var(--color-acento)' : 'transparent' }}
                  >
                    {item.etiqueta}
                  </Link>
                )
              })}
            </div>
          </div>
        </nav>

        {menuOpen && (
          <div className="animate-slideDown sm:hidden" style={{ background: 'linear-gradient(135deg, var(--color-primario) 0%, var(--color-primario-dark) 100%)' }}>
            <div className="max-h-[65vh] overflow-y-auto px-2 pb-4 pt-2">
              <Link
                href="/categorias"
                className={`mb-1 flex items-center justify-between rounded-lg px-5 py-4 text-sm font-bold uppercase tracking-widest transition-all ${
                  pathname === '/categorias' ? 'bg-accent text-white' : 'text-white/90 hover:bg-white/10 hover:text-white'
                }`}
                onClick={() => setMenuOpen(false)}
              >
                DEPORTES
                <span className="text-xs text-white/40">{'>'}</span>
              </Link>

              {[...leftItems, ...rightItems].map((item, index) => {
                const active = isItemActive(item.url)
                return (
                  <Link
                    key={itemKey(item.url, index)}
                    href={buildNavHref(item.url)}
                    className={`mb-1 flex items-center justify-between rounded-lg px-5 py-4 text-sm font-bold uppercase tracking-widest transition-all ${
                      active ? 'bg-accent text-white' : 'text-white/90 hover:bg-white/10 hover:text-white'
                    }`}
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.etiqueta}
                    <span className="text-xs text-white/40">{'>'}</span>
                  </Link>
                )
              })}

              <div className="mx-5 my-3 border-t border-white/10" />

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  setCartOpen(true)
                }}
                className="mx-3 flex w-[calc(100%-1.5rem)] items-center justify-center gap-3 rounded-xl border border-white/15 bg-accent px-6 py-4 text-sm font-black uppercase tracking-widest text-white shadow-lg transition-all hover:bg-orange-600 active:scale-[0.98]"
              >
                <CartIcon />
                <span>VER CARRITO</span>
                <CartCountBadge />
              </button>
            </div>
          </div>
        )}
      </header>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      {menuOpen && <div className="animate-overlayIn fixed inset-0 z-40 bg-black/60 sm:hidden" onClick={() => setMenuOpen(false)} aria-hidden="true" />}
    </>
  )
}

export default function HeaderClient(props: HeaderClientProps) {
  return (
    <Suspense fallback={null}>
      <HeaderClientInner {...props} />
    </Suspense>
  )
}
