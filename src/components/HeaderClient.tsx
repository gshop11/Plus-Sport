'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import CartCountBadge from './CartCountBadge'
import type { StoreIdentity } from '@/lib/storefront'

const categoryItems = [
  { label: 'TODO', url: '/productos', key: 'todos' },
  { label: 'MUJER', url: '/productos?segmento=mujer', key: 'mujer' },
  { label: 'HOMBRE', url: '/productos?segmento=hombre', key: 'hombre' },
  { label: 'NINOS', url: '/productos?segmento=ninos', key: 'ninos' },
  { label: 'MARCAS', url: '/marcas', key: 'marcas' },
]

const deporteItems = [
  { label: '⚽ Fútbol Sala', url: '/categoria/futbol-sala' },
  { label: '🏟️ Fútbol Césped', url: '/categoria/futbol-cesped' },
  { label: '🏀 Basketball', url: '/categoria/basketball' },
  { label: '👟 Running', url: '/categoria/running' },
  { label: '🎯 Multideporte', url: '/categoria/multideporte' },
]

const utilityItems = [
  { label: 'PRODUCTOS', url: '/productos', key: 'productos' },
  { label: 'OFERTAS', url: '/ofertas', key: 'ofertas' },
]

type HeaderClientProps = {
  brand: StoreIdentity
}

function UserIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c1.5-4 4.5-6 8-6s6.5 2 8 6" />
    </svg>
  )
}

function CartIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-[19px] w-[19px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
      <path d="M3 5h2l2 10h10l2-7H6" />
    </svg>
  )
}

export default function HeaderClient({ brand }: HeaderClientProps) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [deporteOpen, setDeporteOpen] = useState(false)
  const [segmentoActual, setSegmentoActual] = useState<string | null>(null)
  const [coleccionActual, setColeccionActual] = useState<string | null>(null)
  const [marcaActual, setMarcaActual] = useState<string | null>(null)

  useEffect(() => {
    const updateFiltersFromUrl = () => {
      const params = new URLSearchParams(window.location.search)
      setSegmentoActual(params.get('segmento'))
      setColeccionActual(params.get('coleccion'))
      setMarcaActual(params.get('marca'))
    }

    updateFiltersFromUrl()
    window.addEventListener('popstate', updateFiltersFromUrl)

    return () => {
      window.removeEventListener('popstate', updateFiltersFromUrl)
    }
  }, [pathname])

  const isCategoryActive = (key: string) => {
    if (pathname === '/productos') {
      if (key === 'todos') return !segmentoActual && !coleccionActual
      if (key === 'mujer') return segmentoActual === 'mujer'
      if (key === 'hombre') return segmentoActual === 'hombre'
      if (key === 'ninos') return segmentoActual === 'ninos'
    }
    if (key === 'marcas') return pathname === '/marcas'
    return false
  }

  const isDeporteActive = deporteItems.some((d) => pathname === d.url)

  const isUtilityActive = (key: string) => {
    if (key === 'productos') return pathname === '/productos'
    if (key === 'ofertas') return pathname === '/ofertas'
    return false
  }

  return (
    <header className="sticky top-0 z-50 shadow-md">
      <div className="bg-primary px-4 py-2 text-center text-sm font-semibold text-white">ENVIO GRATIS POR COMPRAS MAYORES A S/299</div>

      <div className="border-b border-gray-200 bg-white px-4 py-4 text-gray-900">
        <div className="mx-auto flex max-w-7xl items-center gap-4 lg:grid lg:grid-cols-[220px_minmax(0,1fr)_220px] lg:gap-6">
          <Link href="/" className="min-w-fit flex-shrink-0 lg:w-[220px]">
            <span className="block text-[11px] font-semibold uppercase tracking-[0.35em] text-gray-700">tienda deportiva</span>
            <span className="block text-3xl font-black leading-none">
              <span className="text-accent">Plus</span>
              <span className="text-primary">Sport</span>
            </span>
          </Link>

          <div className="hidden flex-1 items-center justify-center md:flex lg:justify-center">
            <div className="flex w-full max-w-2xl items-center overflow-hidden rounded-full border border-gray-800 bg-white">
              <input
                type="text"
                placeholder="Que estas buscando?"
                className="flex-1 bg-transparent px-6 py-3 text-sm text-gray-800 outline-none"
              />
              <button className="bg-accent px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-orange-700">BUSCAR</button>
            </div>
          </div>

          <div className="hidden items-center justify-start gap-8 lg:flex lg:w-[220px]">
            <Link href="/checkout" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-800 transition-colors hover:text-accent">
              <UserIcon />
              <span>Mi cuenta</span>
            </Link>
            <Link href="/carrito" className="relative inline-flex items-center text-gray-900 transition-colors hover:text-accent" aria-label="Carrito">
              <CartIcon />
              <span className="sr-only">Carrito</span>
              <CartCountBadge />
            </Link>
          </div>

          <button
            className="ml-auto text-sm font-semibold uppercase tracking-[0.2em] text-gray-900 md:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Abrir menu"
          >
            {menuOpen ? 'Cerrar' : 'Menu'}
          </button>
        </div>

        <div className="mx-auto mt-4 md:hidden">
          <div className="flex items-center overflow-hidden rounded-full border border-gray-800 bg-white">
            <input
              type="text"
              placeholder="Que estas buscando?"
              className="flex-1 bg-transparent px-4 py-3 text-sm text-gray-800 outline-none"
            />
            <button className="bg-accent px-4 py-3 text-xs font-bold text-white">BUSCAR</button>
          </div>
        </div>
      </div>

      <nav className="hidden border-b border-primary bg-primary sm:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4">

          {/* Izquierda: DEPORTES (fuera del overflow-x-auto para que el dropdown no se clipee) + resto de links */}
          <div className="flex min-w-0 items-center">

            {/* Dropdown DEPORTES — sibling del contenedor scrollable */}
            <div className="relative flex-shrink-0" onMouseEnter={() => setDeporteOpen(true)} onMouseLeave={() => setDeporteOpen(false)}>
              <button
                className="flex items-center gap-1 whitespace-nowrap px-5 py-4 text-sm font-medium text-white transition-colors hover:bg-white/10"
                style={{ backgroundColor: isDeporteActive ? '#ff6f00' : 'transparent' }}
              >
                DEPORTES <span className="text-xs opacity-75">▾</span>
              </button>
              {deporteOpen && (
                <div className="absolute left-0 top-full z-50 min-w-[210px] overflow-hidden rounded-b-xl bg-white shadow-xl">
                  {deporteItems.map((d) => (
                    <Link
                      key={d.url}
                      href={d.url}
                      onClick={() => setDeporteOpen(false)}
                      className="block px-5 py-3 text-sm font-medium text-gray-800 transition-colors hover:bg-orange-50 hover:text-accent"
                    >
                      {d.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Links restantes con scroll horizontal si la pantalla es pequeña */}
            <div className="flex items-center overflow-x-auto">
              {categoryItems.map((item) => {
                const active = isCategoryActive(item.key)
                return (
                  <Link
                    key={item.label}
                    href={item.url}
                    onClick={() => {
                      if (item.key === 'todos') { setSegmentoActual(null); setColeccionActual(null); setMarcaActual(null) }
                      if (item.key === 'mujer') { setSegmentoActual('mujer'); setColeccionActual(null); setMarcaActual(null) }
                      if (item.key === 'hombre') { setSegmentoActual('hombre'); setColeccionActual(null); setMarcaActual(null) }
                      if (item.key === 'ninos') { setSegmentoActual('ninos'); setColeccionActual(null); setMarcaActual(null) }
                      if (item.key === 'marcas') { setSegmentoActual(null); setColeccionActual(null); setMarcaActual(null) }
                    }}
                    className="whitespace-nowrap px-5 py-4 text-sm font-medium transition-colors hover:bg-white/10"
                    style={{ backgroundColor: active ? '#ff6f00' : 'transparent', color: '#ffffff' }}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Derecha: PRODUCTOS / OFERTAS */}
          <div className="hidden flex-shrink-0 items-center lg:flex">
            {utilityItems.map((item) => {
              const active = isUtilityActive(item.key)
              return (
                <Link
                  key={item.label}
                  href={item.url}
                  onClick={() => { if (item.key === 'productos') { setSegmentoActual(null); setColeccionActual(null); setMarcaActual(null) } }}
                  className="whitespace-nowrap px-5 py-4 text-sm font-bold transition-colors hover:bg-white/10"
                  style={{ backgroundColor: active ? '#ff6f00' : 'transparent', color: '#ffffff' }}
                >
                  {item.label}
                </Link>
              )
            })}
          </div>

        </div>
      </nav>

      {menuOpen && (
        <div className="border-t bg-white sm:hidden">
          <p className="px-4 pt-3 text-xs font-bold uppercase tracking-widest text-gray-400">Deportes</p>
          {deporteItems.map((item) => (
            <Link
              key={item.url}
              href={item.url}
              className="block border-b px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50"
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <p className="px-4 pt-3 text-xs font-bold uppercase tracking-widest text-gray-400">Segmento</p>
          {[...categoryItems, ...utilityItems].map((item) => (
            <Link
              key={`${item.label}-${item.url}`}
              href={item.url}
              className="block border-b px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50"
              onClick={() => setMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}
