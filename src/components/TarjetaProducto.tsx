'use client'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import AgregarAlCarrito from './AgregarAlCarrito'
import { useCurrencySymbol } from '@/hooks/useCurrencySymbol'
import { formatMoney } from '@/lib/money'

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

type DrawerItem = {
  id: string
  nombre: string
  precio: number
  talla: string
  cantidad: number
  imagenUrl?: string | null
}

const etiquetaConfig = {
  nuevo: { texto: 'NUEVO', color: 'bg-blue-600' },
  hot: { texto: 'HOT', color: 'bg-red-500' },
  top: { texto: 'TOP', color: 'bg-accent' },
  oferta: { texto: 'OFERTA', color: 'bg-green-600' },
  '': null,
}

const PLACEHOLDER_IMAGE = '/placeholder-product.svg'

export default function TarjetaProducto({ producto, index = 0 }: { producto: ProductoCard; index?: number }) {
  const router = useRouter()
  const currencySymbol = useCurrencySymbol()
  const [modalOpen, setModalOpen] = useState(false)
  const [panelOpen, setPanelOpen] = useState(false)
  const [carritoItems, setCarritoItems] = useState<DrawerItem[]>([])

  const descuento = producto.precioAnterior
    ? Math.round(((producto.precioAnterior - producto.precio) / producto.precioAnterior) * 100)
    : null

  const etiqueta = producto.etiqueta ? etiquetaConfig[producto.etiqueta] : null
  const imageSrc = producto.imagenUrl || PLACEHOLDER_IMAGE
  const isAboveFold = index < 4
  const subtotal = carritoItems.reduce((acc, item) => acc + item.precio * item.cantidad, 0)

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
    <div className="group relative overflow-hidden rounded-xl border border-gray-100 bg-white transition-all hover:border-accent hover:shadow-lg">
      {descuento && (
        <div className="absolute left-3 top-3 z-10">
          <span className="rounded bg-red-500 px-2 py-0.5 text-xs font-bold text-white">-{descuento}%</span>
        </div>
      )}

      <div className="relative h-40 overflow-hidden bg-gray-50 sm:h-52">
        <Image
          src={imageSrc}
          alt={producto.nombre}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, 25vw"
          priority={isAboveFold}
          loading={isAboveFold ? 'eager' : 'lazy'}
        />
      </div>

      <div className="p-4">
        <p className="mb-1 text-xs font-bold uppercase text-accent">{producto.marca}</p>
        <h3 className="mb-2 line-clamp-2 text-sm font-semibold leading-tight text-gray-800">{producto.nombre}</h3>

        {producto.tallas && producto.tallas.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1">
            {producto.tallas.slice(0, 5).map((t) => (
              <span key={t} className="rounded border px-1.5 py-0.5 text-xs text-gray-600">
                {t}
              </span>
            ))}
          </div>
        )}

        <div className="mb-3 flex items-center gap-2">
          <span className="text-xl font-black text-primary">{formatMoney(producto.precio, currencySymbol)}</span>
          {producto.precioAnterior && (
            <>
              <span className="text-sm text-gray-400 line-through">{formatMoney(producto.precioAnterior, currencySymbol)}</span>
              <span className="text-xs font-semibold text-red-500">-{descuento}%</span>
            </>
          )}
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent"
        >
          AGREGAR
        </button>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 max-h-screen w-full max-w-sm overflow-y-auto rounded-lg bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold">{producto.nombre}</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-2xl font-bold text-gray-400 hover:text-gray-600"
                aria-label="Cerrar"
              >
                X
              </button>
            </div>
            <AgregarAlCarrito
              producto={producto}
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
          <button className="fixed inset-0 z-50 bg-black/35" onClick={() => setPanelOpen(false)} aria-label="Cerrar panel de carrito" />
          <aside className="fixed right-0 top-0 z-[60] h-full w-full border-l border-gray-200 bg-white shadow-2xl sm:max-w-md">
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h3 className="text-lg font-black text-primary">Tu carrito</h3>
              <button onClick={() => setPanelOpen(false)} className="text-2xl font-bold text-gray-400 hover:text-gray-700" aria-label="Cerrar">
                X
              </button>
            </div>

            <div className="h-[calc(100%-164px)] overflow-y-auto p-5">
              {carritoItems.length === 0 ? (
                <p className="text-sm text-gray-500">No hay productos en el carrito.</p>
              ) : (
                <div className="space-y-3">
                  {carritoItems.map((item, i) => (
                    <div key={`${item.id}-${item.talla}-${i}`} className="rounded-lg border border-gray-200 p-3">
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
                className="block w-full rounded-lg bg-accent py-3 text-center text-sm font-bold text-white transition-colors hover:bg-accent-dark"
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
    </div>
  )
}
