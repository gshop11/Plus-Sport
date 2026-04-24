'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import AgregarAlCarrito from './AgregarAlCarrito'
import { useCurrencySymbol } from '@/hooks/useCurrencySymbol'
import { formatMoney } from '@/lib/money'

export type ProductoCard = {
  id: string
  slug?: string
  nombre: string
  marca: string
  precio: number
  precioAnterior?: number
  imagenUrl?: string | null
  tallas?: string[]
  etiqueta?: 'nuevo' | 'hot' | 'top' | 'oferta' | ''
}

type DrawerItem = {
  id: string
  nombre: string
  precio: number
  talla: string
  cantidad: number
  imagenUrl?: string | null
}

const etiquetaConfig = {
  nuevo: { texto: 'Nuevo', className: 'bg-blue-600 text-white' },
  hot: { texto: 'Hot', className: 'bg-red-500 text-white' },
  top: { texto: 'Top', className: 'bg-accent text-white' },
  oferta: { texto: 'Oferta', className: 'bg-green-600 text-white' },
  '': null,
}

const PLACEHOLDER_IMAGE = '/placeholder-product.svg'

export default function TarjetaProducto({ producto, index = 0 }: { producto: ProductoCard; index?: number }) {
  const router = useRouter()
  const currencySymbol = useCurrencySymbol()
  const [modalOpen, setModalOpen] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [carritoItems, setCarritoItems] = useState<DrawerItem[]>([])

  const tallas = producto.tallas ?? []
  const descuento = producto.precioAnterior
    ? Math.round(((producto.precioAnterior - producto.precio) / producto.precioAnterior) * 100)
    : null

  const etiqueta = producto.etiqueta ? etiquetaConfig[producto.etiqueta] : null
  const imageSrc = producto.imagenUrl || PLACEHOLDER_IMAGE
  const isAboveFold = index < 4
  const subtotal = carritoItems.reduce((acc, item) => acc + item.precio * item.cantidad, 0)
  const ahorro = producto.precioAnterior ? Math.max(0, producto.precioAnterior - producto.precio) : 0
  const productHref = producto.slug ? `/productos?search=${encodeURIComponent(producto.slug)}` : '/productos'

  const persistCarrito = (nextItems: DrawerItem[]) => {
    setCarritoItems(nextItems)
    localStorage.setItem('carrito', JSON.stringify(nextItems))
    window.dispatchEvent(new Event('carrito:update'))
  }

  const handleIncrement = (targetIndex: number) => {
    const next = carritoItems.map((item, i) => (i === targetIndex ? { ...item, cantidad: item.cantidad + 1 } : item))
    persistCarrito(next)
  }

  const handleRemove = (targetIndex: number) => {
    const next = carritoItems.filter((_, i) => i !== targetIndex)
    persistCarrito(next)
  }

  const handleDecrement = (targetIndex: number) => {
    const current = carritoItems[targetIndex]
    if (!current) return
    if (current.cantidad <= 1) {
      handleRemove(targetIndex)
      return
    }
    const next = carritoItems.map((item, i) => (i === targetIndex ? { ...item, cantidad: item.cantidad - 1 } : item))
    persistCarrito(next)
  }

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
      <div className="absolute left-3 top-3 z-20 flex items-center gap-2">
        <span className="rounded-full border border-white/25 bg-black/45 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white backdrop-blur-sm">
          {producto.marca || 'Marca'}
        </span>
      </div>
      <div className="absolute right-3 top-3 z-20 flex flex-wrap items-center justify-end gap-2">
        {etiqueta ? (
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${etiqueta.className}`}>
            {etiqueta.texto}
          </span>
        ) : null}
        {descuento ? (
          <span className="rounded-full bg-red-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
            -{descuento}%
          </span>
        ) : null}
      </div>

      <Link href={productHref} className="relative block overflow-hidden bg-gray-100 pt-[116%]">
        <Image
          src={imageSrc}
          alt={producto.nombre}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 48vw, (max-width: 1200px) 33vw, 25vw"
          priority={isAboveFold}
          loading={isAboveFold ? 'eager' : 'lazy'}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent opacity-90" />
        <span className="absolute bottom-3 left-3 rounded-full border border-white/30 bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.11em] text-white backdrop-blur-sm">
          Sneaker / Sport
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link href={productHref} className="line-clamp-2 min-h-[2.8rem] text-[15px] font-bold leading-5 text-gray-900 transition-colors hover:text-primary">
          {producto.nombre}
        </Link>

        {tallas.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tallas.slice(0, 5).map((talla) => (
              <span key={talla} className="rounded-full border border-gray-200 bg-[var(--surface-soft)] px-2 py-0.5 text-[11px] font-semibold text-gray-600">
                {talla}
              </span>
            ))}
            {tallas.length > 5 ? <span className="rounded-full border border-gray-200 px-2 py-0.5 text-[11px] text-gray-500">+{tallas.length - 5}</span> : null}
          </div>
        ) : null}

        <div className="mt-4 rounded-xl border border-gray-200 bg-[var(--surface-soft)] px-3 py-2">
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-xl font-black text-primary">{formatMoney(producto.precio, currencySymbol)}</p>
              {producto.precioAnterior ? <p className="text-xs text-gray-400 line-through">{formatMoney(producto.precioAnterior, currencySymbol)}</p> : <p className="text-xs text-gray-400">Precio regular</p>}
            </div>
            {ahorro > 0 ? (
              <p className="text-right text-[11px] font-semibold uppercase tracking-[0.1em] text-green-700">
                Ahorras
                <br />
                {formatMoney(ahorro, currencySymbol)}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <Link href={productHref} className="store-button-secondary w-full px-3 py-2 text-xs uppercase tracking-[0.08em]">
            Ver
          </Link>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="store-button-primary w-full px-3 py-2 text-xs uppercase tracking-[0.08em]"
          >
            Agregar
          </button>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">
          <div className="store-panel max-h-[92vh] w-full max-w-sm overflow-y-auto p-6">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">{producto.marca}</p>
                <h3 className="text-lg font-bold text-gray-900">{producto.nombre}</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-full border border-gray-300 px-2.5 py-1 text-sm font-bold text-gray-500 transition-colors hover:border-gray-500 hover:text-gray-800"
                aria-label="Cerrar"
              >
                X
              </button>
            </div>
            <AgregarAlCarrito
              producto={{ ...producto, tallas }}
              onAdded={(carrito) => {
                setCarritoItems(carrito)
                setModalOpen(false)
                setPanelOpen(true)
              }}
            />
          </div>
        </div>
      )}

      {panelOpen && (
        <>
          <button className="fixed inset-0 z-50 bg-black/45" onClick={() => setPanelOpen(false)} aria-label="Cerrar panel de carrito" />
          <aside className="fixed right-0 top-0 z-[60] h-full w-full border-l border-gray-200 bg-white shadow-2xl sm:max-w-md">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h3 className="text-lg font-black text-primary">Tu carrito</h3>
              <button onClick={() => setPanelOpen(false)} className="rounded-full border border-gray-300 px-2.5 py-1 text-sm font-bold text-gray-500 hover:border-gray-500 hover:text-gray-800" aria-label="Cerrar">
                X
              </button>
            </div>

            <div className="h-[calc(100%-168px)] overflow-y-auto p-5">
              {carritoItems.length === 0 ? (
                <p className="text-sm text-gray-500">No hay productos en el carrito.</p>
              ) : (
                <div className="space-y-3">
                  {carritoItems.map((item, i) => (
                    <div key={`${item.id}-${item.talla}-${i}`} className="rounded-xl border border-gray-200 p-3">
                      <div className="flex items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-sm font-semibold text-gray-900">{item.nombre}</p>
                          <p className="mt-1 text-xs text-gray-500">Talla: {item.talla || '-'}</p>
                          <p className="mt-1 text-sm font-bold text-primary">{formatMoney(item.precio * item.cantidad, currencySymbol)}</p>
                          <div className="mt-2 flex items-center gap-2">
                            <button
                              type="button"
                              className="h-7 w-7 rounded border border-gray-300 text-sm font-bold text-gray-700 hover:border-accent hover:text-accent"
                              onClick={() => handleDecrement(i)}
                              aria-label="Disminuir cantidad"
                            >
                              -
                            </button>
                            <span className="min-w-5 text-center text-sm font-semibold text-gray-800">{item.cantidad}</span>
                            <button
                              type="button"
                              className="h-7 w-7 rounded border border-gray-300 text-sm font-bold text-gray-700 hover:border-accent hover:text-accent"
                              onClick={() => handleIncrement(i)}
                              aria-label="Aumentar cantidad"
                            >
                              +
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemove(i)}
                              className="ml-auto text-xs font-semibold text-red-500 hover:text-red-700"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-50">
                          <Image src={item.imagenUrl || PLACEHOLDER_IMAGE} alt={item.nombre} fill sizes="64px" className="object-cover" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t bg-white px-5 py-4">
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="font-semibold text-gray-700">Subtotal</span>
                <span className="text-lg font-black text-primary">{formatMoney(subtotal, currencySymbol)}</span>
              </div>
              <button
                type="button"
                className="store-button-primary w-full"
                onClick={() => {
                  setPanelOpen(false)
                  setModalOpen(false)
                  router.push('/carrito')
                }}
              >
                Ir al carrito
              </button>
            </div>
          </aside>
        </>
      )}
    </article>
  )
}
