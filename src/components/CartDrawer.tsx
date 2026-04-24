'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCurrencySymbol } from '@/hooks/useCurrencySymbol'
import { formatMoney } from '@/lib/money'

type CarritoItem = {
  id: string
  nombre: string
  precio: number
  precioAnterior?: number
  talla: string
  cantidad: number
  imagenUrl?: string | null
  marca: string
}

const PLACEHOLDER_IMAGE = '/placeholder-product.svg'

const readCarrito = (): CarritoItem[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem('carrito') || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export default function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const currencySymbol = useCurrencySymbol()
  const [items, setItems] = useState<CarritoItem[]>([])

  useEffect(() => {
    if (!open) return
    setItems(readCarrito())
  }, [open])

  useEffect(() => {
    const sync = () => setItems(readCarrito())
    window.addEventListener('carrito:update', sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener('carrito:update', sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  const persist = (next: CarritoItem[]) => {
    setItems(next)
    localStorage.setItem('carrito', JSON.stringify(next))
    window.dispatchEvent(new Event('carrito:update'))
  }

  const increment = (index: number) => {
    const next = items.map((item, i) => (i === index ? { ...item, cantidad: item.cantidad + 1 } : item))
    persist(next)
  }

  const decrement = (index: number) => {
    const current = items[index]
    if (!current) return
    if (current.cantidad <= 1) {
      remove(index)
      return
    }
    const next = items.map((item, i) => (i === index ? { ...item, cantidad: item.cantidad - 1 } : item))
    persist(next)
  }

  const remove = (index: number) => {
    const next = items.filter((_, i) => i !== index)
    persist(next)
  }

  const total = items.reduce((acc, item) => acc + item.precio * item.cantidad, 0)

  if (!open) return null

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-[70] bg-black/55"
        onClick={onClose}
        aria-label="Cerrar carrito lateral"
      />
      <aside className="fixed right-0 top-0 z-[80] flex h-full w-full max-w-md flex-col border-l border-primary/15 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--line-soft)] px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.11em] text-gray-500">Resumen rapido</p>
            <h2 className="text-lg font-black text-primary">Tu carrito</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-gray-300 px-2.5 py-1 text-sm font-bold text-gray-500 transition-colors hover:border-accent hover:text-accent"
            aria-label="Cerrar"
          >
            X
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {items.length === 0 ? (
            <div className="rounded-xl border border-dashed border-primary/30 bg-[var(--surface-soft)] p-5 text-center">
              <p className="text-sm font-semibold text-primary-dark">Tu carrito esta vacio.</p>
              <p className="mt-1 text-xs text-gray-500">Agrega productos para continuar con la compra.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={`${item.id}-${item.talla}-${index}`} className="rounded-xl border border-[var(--line-soft)] p-3">
                  <div className="flex items-start gap-3">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-[var(--line-soft)] bg-[var(--surface-soft)]">
                      <Image src={item.imagenUrl || PLACEHOLDER_IMAGE} alt={item.nombre} fill sizes="64px" className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-semibold text-gray-900">{item.nombre}</p>
                      <p className="mt-0.5 text-xs text-gray-500">Talla: {item.talla || '-'}</p>
                      <p className="mt-1 text-xs text-gray-500">Precio unitario: {formatMoney(item.precio, currencySymbol)}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <button
                          type="button"
                          className="h-7 w-7 rounded border border-gray-300 text-sm font-bold text-gray-700 hover:border-accent hover:text-accent"
                          onClick={() => decrement(index)}
                          aria-label="Disminuir"
                        >
                          -
                        </button>
                        <span className="min-w-5 text-center text-sm font-semibold text-gray-800">{item.cantidad}</span>
                        <button
                          type="button"
                          className="h-7 w-7 rounded border border-gray-300 text-sm font-bold text-gray-700 hover:border-accent hover:text-accent"
                          onClick={() => increment(index)}
                          aria-label="Aumentar"
                        >
                          +
                        </button>
                        <button type="button" onClick={() => remove(index)} className="ml-auto text-xs font-semibold text-primary hover:text-accent">
                          Quitar
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 border-t border-[var(--line-soft)] pt-2 text-right text-sm font-bold text-primary">
                    Subtotal: {formatMoney(item.precio * item.cantidad, currencySymbol)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-[var(--line-soft)] bg-white px-5 py-4">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-700">Total general</span>
            <span className="text-xl font-black text-primary">{formatMoney(total, currencySymbol)}</span>
          </div>

          <div className="grid gap-2">
            <button
              type="button"
              onClick={() => {
                onClose()
                router.push('/carrito')
              }}
              className="store-button-secondary w-full"
            >
              Ver carrito
            </button>
            <button
              type="button"
              onClick={() => {
                onClose()
                router.push('/checkout')
              }}
              className="store-button-primary w-full"
            >
              Ir al checkout
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
