'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import HeaderClient from '@/components/HeaderClient'
import Footer from '@/components/Footer'
import { useCurrencySymbol } from '@/hooks/useCurrencySymbol'
import { clearCart, getCart, removeFromCart, updateCartItem, type CartItem } from '@/lib/cart'
import { formatMoney } from '@/lib/money'

type ItemResumen = {
  productoId: number
  slug: string
  nombre: string
  marca: string
  sku: string | null
  skuVariante: string | null
  color: string | null
  talla: string | null
  cantidadSolicitada: number
  cantidad: number
  stockDisponible: number
  precioUnitario: number
  precioAnterior: number | null
  imagenUrl: string | null
  subtotal: number
  estado: 'ok' | 'ajustado_stock' | 'sin_stock' | 'no_disponible'
  motivo?: string
}

type Resumen = {
  items: ItemResumen[]
  subtotal: number
  cupon: { codigo: string; descuento: number } | null
  cuponError: string | null
  descuento: number
  envio: { tipo: string; costo: number | null; etiqueta: string }
  costoEnvio: number | null
  total: number | null
  moneda: string
}

const CUPON_KEY = 'carrito_cupon_codigo'

export default function CarritoPage() {
  const currencySymbol = useCurrencySymbol()
  const [items, setItems] = useState<CartItem[]>([])
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [loading, setLoading] = useState(true)
  const [validando, setValidando] = useState(false)
  const [codigoCupon, setCodigoCupon] = useState('')
  const [cuponMensaje, setCuponMensaje] = useState('')
  const validacionSeq = useRef(0)

  const validarEnServidor = useCallback(async (cartItems: CartItem[], cupon: string | null) => {
    const seq = ++validacionSeq.current
    if (cartItems.length === 0) {
      setResumen(null)
      return
    }

    setValidando(true)
    try {
      const res = await fetch('/api/checkout/validar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems.map((item) => ({ productoId: item.productoId, talla: item.talla, cantidad: item.cantidad })),
          cuponCodigo: cupon,
        }),
      })
      const data = await res.json()
      if (seq !== validacionSeq.current) return
      if (!res.ok || !data?.ok) {
        setResumen(null)
        return
      }
      const r = data.resumen as Resumen
      setResumen(r)
      if (cupon && r.cuponError) {
        setCuponMensaje(r.cuponError)
        localStorage.removeItem(CUPON_KEY)
      } else if (cupon && r.cupon) {
        setCuponMensaje('')
        localStorage.setItem(CUPON_KEY, r.cupon.codigo)
      }
    } catch {
      if (seq === validacionSeq.current) setResumen(null)
    } finally {
      if (seq === validacionSeq.current) setValidando(false)
    }
  }, [])

  useEffect(() => {
    const cart = getCart()
    const savedCupon = localStorage.getItem(CUPON_KEY)
    setItems(cart)
    if (savedCupon) setCodigoCupon(savedCupon)
    setLoading(false)
    void validarEnServidor(cart, savedCupon)
  }, [validarEnServidor])

  const refreshCart = (next: CartItem[]) => {
    setItems(next)
    void validarEnServidor(next, localStorage.getItem(CUPON_KEY))
  }

  const handleCantidad = (item: CartItem, cantidad: number) => {
    if (!Number.isInteger(cantidad) || cantidad < 1) return
    refreshCart(updateCartItem(item.productoId, item.talla, cantidad))
  }

  const handleQuitar = (item: CartItem) => {
    refreshCart(removeFromCart(item.productoId, item.talla))
  }

  const handleVaciar = () => {
    localStorage.removeItem(CUPON_KEY)
    setCodigoCupon('')
    setCuponMensaje('')
    refreshCart(clearCart())
  }

  const aplicarCupon = () => {
    const codigo = codigoCupon.trim().toUpperCase()
    if (!codigo) return
    localStorage.setItem(CUPON_KEY, codigo)
    void validarEnServidor(items, codigo)
  }

  const quitarCupon = () => {
    localStorage.removeItem(CUPON_KEY)
    setCodigoCupon('')
    setCuponMensaje('')
    void validarEnServidor(items, null)
  }

  const resumenItem = (item: CartItem): ItemResumen | undefined =>
    resumen?.items.find((r) => String(r.productoId) === item.productoId && (r.talla ?? null) === (item.talla ?? null))

  const hayItemsComprables = (resumen?.items ?? []).some((r) => r.estado === 'ok' || r.estado === 'ajustado_stock')

  if (loading) {
    return (
      <>
        <HeaderClient />
        <div className="flex min-h-screen items-center justify-center bg-[var(--surface-soft)]">
          <div className="rounded-xl border border-[var(--line-soft)] bg-white px-6 py-4 text-primary-dark">Cargando carrito...</div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <HeaderClient />
      <main className="bg-[var(--surface-soft)]">
        <section className="bg-gradient-to-br from-primary to-primary-dark py-9 text-white">
          <div className="section-shell">
            <span className="mb-3 inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-white/85">
              Paso 1 de 2
            </span>
            <h1 className="text-3xl font-black sm:text-4xl">Tu carrito</h1>
            <p className="mt-2 text-sm text-white/80 sm:text-base">Revisa tus productos antes de finalizar la compra.</p>
          </div>
        </section>

        <section className="py-10">
          <div className="section-shell">
            {items.length === 0 ? (
              <div className="store-empty-state">
                <h3>Tu carrito esta vacio</h3>
                <p>Aun no agregaste productos. Explora el catalogo para iniciar tu compra.</p>
                <Link href="/productos" className="store-button-primary">
                  Ver productos
                </Link>
              </div>
            ) : (
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-4 lg:col-span-2">
                  {items.map((item, index) => {
                    const server = resumenItem(item)
                    const noDisponible = server && (server.estado === 'sin_stock' || server.estado === 'no_disponible')
                    const precio = server ? server.precioUnitario : item.precioRef
                    return (
                      <div key={`${item.productoId}-${item.talla ?? 'u'}-${index}`} className={`store-panel p-4 sm:p-5 ${noDisponible ? 'opacity-80' : ''}`}>
                        <div className="flex items-start gap-4">
                          {item.imagenUrl ? (
                            <img src={item.imagenUrl} alt={item.nombre} className="h-20 w-20 rounded-xl border border-[var(--line-soft)] object-cover sm:h-24 sm:w-24" />
                          ) : (
                            <div className="h-20 w-20 rounded-xl border border-[var(--line-soft)] bg-[var(--surface-soft)] sm:h-24 sm:w-24" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.13em] text-primary-dark/80">{item.marca}</p>
                            <h3 className="line-clamp-2 text-base font-bold text-gray-900">{item.nombre}</h3>
                            <p className="mt-1 text-sm text-gray-600">
                              {item.talla ? `Talla: ${item.talla}` : null}
                              {server?.skuVariante ? ` · SKU ${server.skuVariante}` : server?.sku ? ` · SKU ${server.sku}` : ''}
                              {server?.color ? ` · ${server.color}` : ''}
                            </p>
                            {noDisponible ? (
                              <p className="mt-2 text-sm font-semibold text-accent-dark">{server?.motivo ?? 'No disponible.'}</p>
                            ) : server?.estado === 'ajustado_stock' ? (
                              <p className="mt-2 text-sm font-semibold text-accent-dark">{server.motivo}</p>
                            ) : null}
                            <p className="mt-3 text-lg font-black text-primary">
                              {formatMoney(precio * (server ? server.cantidad : item.cantidad), currencySymbol)}
                            </p>
                          </div>
                          <button onClick={() => handleQuitar(item)} className="rounded-full border border-[var(--line-soft)] px-2.5 py-1 text-xs font-semibold text-primary-dark transition-colors hover:border-accent hover:text-accent">
                            Quitar
                          </button>
                        </div>

                        {!noDisponible ? (
                          <div className="mt-4 flex items-center justify-between border-t border-[var(--line-soft)] pt-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary-dark/80">Cantidad</p>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleCantidad(item, item.cantidad - 1)}
                                aria-label="Disminuir cantidad"
                                className="h-8 w-8 rounded-lg border border-[var(--line-soft)] bg-white text-sm font-bold text-gray-700 transition-colors hover:border-primary hover:text-primary"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                min="1"
                                aria-label="Cantidad"
                                value={item.cantidad}
                                onChange={(e) => handleCantidad(item, Number.parseInt(e.target.value || '1', 10))}
                                className="w-14 rounded-lg border border-[var(--line-soft)] px-2 py-1 text-center text-sm font-semibold text-gray-800 outline-none focus:border-primary"
                              />
                              <button
                                type="button"
                                onClick={() => handleCantidad(item, item.cantidad + 1)}
                                aria-label="Aumentar cantidad"
                                className="h-8 w-8 rounded-lg border border-[var(--line-soft)] bg-white text-sm font-bold text-gray-700 transition-colors hover:border-primary hover:text-primary"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )
                  })}

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleVaciar}
                      className="rounded-full border border-[var(--line-soft)] px-4 py-2 text-xs font-semibold text-primary-dark transition-colors hover:border-accent hover:text-accent"
                    >
                      Vaciar carrito
                    </button>
                  </div>
                </div>

                <aside className="store-panel sticky top-24 h-fit p-6">
                  <div className="mb-5 rounded-xl border border-[var(--line-soft)] bg-[var(--surface-soft)] p-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-primary-dark/80">Codigo promocional</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={codigoCupon}
                        onChange={(e) => setCodigoCupon(e.target.value.toUpperCase())}
                        placeholder="Ej: SPORT10"
                        aria-label="Codigo promocional"
                        className="w-full rounded-lg border border-[var(--line-soft)] px-3 py-2 text-sm outline-none focus:border-primary"
                      />
                      <button
                        type="button"
                        onClick={aplicarCupon}
                        disabled={validando || !codigoCupon.trim()}
                        className="store-button-primary px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {validando ? '...' : 'Aplicar'}
                      </button>
                    </div>
                    {resumen?.cupon ? (
                      <p className="mt-2 text-xs font-semibold text-primary">
                        Cupon aplicado: {resumen.cupon.codigo}{' '}
                        <button type="button" onClick={quitarCupon} className="underline">
                          Quitar
                        </button>
                      </p>
                    ) : null}
                    {cuponMensaje ? <p className="mt-2 text-xs font-semibold text-accent-dark">{cuponMensaje}</p> : null}
                  </div>

                  <h2 className="mb-4 text-lg font-black text-gray-900">Resumen</h2>
                  <div className="space-y-2 text-sm" aria-live="polite">
                    <div className="flex justify-between text-primary-dark/80">
                      <span>Subtotal</span>
                      <span className="font-semibold text-gray-900">
                        {resumen ? formatMoney(resumen.subtotal, currencySymbol) : validando ? 'Validando...' : '—'}
                      </span>
                    </div>
                    {resumen && resumen.descuento > 0 ? (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Descuento</span>
                        <span className="font-semibold text-accent-dark">-{formatMoney(resumen.descuento, currencySymbol)}</span>
                      </div>
                    ) : null}
                    <div className="flex justify-between text-primary-dark/80">
                      <span>Envio</span>
                      <span className="font-semibold text-gray-900">Se calcula en el checkout</span>
                    </div>
                  </div>

                  <div className="my-5 border-t border-[var(--line-soft)] pt-4">
                    <div className="flex justify-between text-lg font-black">
                      <span>Total (sin envio)</span>
                      <span className="text-primary">
                        {resumen && resumen.total !== null ? formatMoney(resumen.total, currencySymbol) : validando ? '...' : '—'}
                      </span>
                    </div>
                  </div>

                  {hayItemsComprables ? (
                    <Link href="/checkout" className="store-button-primary w-full text-center">
                      Ir a checkout
                    </Link>
                  ) : (
                    <button type="button" disabled className="store-button-primary w-full cursor-not-allowed opacity-50">
                      Sin productos disponibles
                    </button>
                  )}
                  <p className="mt-3 text-center text-xs text-primary-dark/75">Los precios y el stock se validan en el servidor.</p>
                </aside>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
