'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import HeaderClient from '@/components/HeaderClient'
import Footer from '@/components/Footer'
import { useCurrencySymbol } from '@/hooks/useCurrencySymbol'
import { formatMoney } from '@/lib/money'

interface CarritoItem {
  id: string
  nombre: string
  precio: number
  precioAnterior?: number
  talla: string
  cantidad: number
  imagenUrl: string | null
  marca: string
}

type CuponAplicado = {
  codigo: string
  tipo: 'porcentaje' | 'monto' | 'envio_gratis'
  valor: number
  descuento: number
  envioFinal: number
  total: number
}

export default function CarritoPage() {
  const currencySymbol = useCurrencySymbol()
  const [items, setItems] = useState<CarritoItem[]>([])
  const [loading, setLoading] = useState(true)
  const [codigoCupon, setCodigoCupon] = useState('')
  const [aplicandoCupon, setAplicandoCupon] = useState(false)
  const [cuponError, setCuponError] = useState('')
  const [cuponAplicado, setCuponAplicado] = useState<CuponAplicado | null>(null)

  useEffect(() => {
    const carrito = JSON.parse(localStorage.getItem('carrito') || '[]')
    const savedCupon = localStorage.getItem('carrito_cupon')
    setItems(carrito)
    if (savedCupon) {
      try {
        const parsed = JSON.parse(savedCupon) as CuponAplicado
        if (parsed?.codigo) {
          setCodigoCupon(parsed.codigo)
          setCuponAplicado(parsed)
        }
      } catch {
        localStorage.removeItem('carrito_cupon')
      }
    }
    setLoading(false)
  }, [])

  const persistItems = (nextItems: CarritoItem[]) => {
    setItems(nextItems)
    localStorage.setItem('carrito', JSON.stringify(nextItems))
    window.dispatchEvent(new Event('carrito:update'))
  }

  const removeItem = (index: number) => {
    persistItems(items.filter((_, i) => i !== index))
  }

  const updateCantidad = (index: number, nuevaCantidad: number) => {
    if (nuevaCantidad < 1) return
    const nextItems = [...items]
    nextItems[index].cantidad = nuevaCantidad
    persistItems(nextItems)
  }

  const subtotal = items.reduce((acc, item) => acc + item.precio * item.cantidad, 0)
  const costoEnvio = subtotal > 299 ? 0 : 15
  const descuento = cuponAplicado?.descuento || 0
  const costoEnvioFinal = cuponAplicado ? cuponAplicado.envioFinal : costoEnvio
  const total = Math.max(0, subtotal - descuento) + costoEnvioFinal

  const validarCupon = async (codigoInput: string, silent = false) => {
    const codigo = codigoInput.trim().toUpperCase()
    if (!codigo) return false

    if (!silent) {
      setAplicandoCupon(true)
      setCuponError('')
    }

    try {
      const res = await fetch('/api/cupones/validar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo, subtotal, costoEnvio }),
      })
      const data = await res.json()
      if (!res.ok || !data?.ok) {
        setCuponAplicado(null)
        localStorage.removeItem('carrito_cupon')
        if (!silent) setCuponError(data?.message || 'No se pudo aplicar el cupon.')
        return false
      }
      setCuponAplicado(data.cupon as CuponAplicado)
      setCodigoCupon(data.cupon.codigo)
      localStorage.setItem('carrito_cupon', JSON.stringify(data.cupon))
      if (!silent) setCuponError('')
      return true
    } catch {
      setCuponAplicado(null)
      localStorage.removeItem('carrito_cupon')
      if (!silent) setCuponError('Error de conexion al validar el cupon.')
      return false
    } finally {
      if (!silent) setAplicandoCupon(false)
    }
  }

  useEffect(() => {
    if (!cuponAplicado?.codigo) return
    void validarCupon(cuponAplicado.codigo, true)
    // Revalida automaticamente el cupon cuando cambia el carrito.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])

  const aplicarCupon = async () => {
    await validarCupon(codigoCupon, false)
  }

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
                  {items.map((item, index) => (
                    <div key={`${item.id}-${item.talla}-${index}`} className="store-panel p-4 sm:p-5">
                      <div className="flex items-start gap-4">
                        {item.imagenUrl ? (
                          <img src={item.imagenUrl} alt={item.nombre} className="h-20 w-20 rounded-xl border border-[var(--line-soft)] object-cover sm:h-24 sm:w-24" />
                        ) : (
                          <div className="h-20 w-20 rounded-xl border border-[var(--line-soft)] bg-[var(--surface-soft)] sm:h-24 sm:w-24" />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.13em] text-primary-dark/80">{item.marca}</p>
                          <h3 className="line-clamp-2 text-base font-bold text-gray-900">{item.nombre}</h3>
                          {item.talla ? <p className="mt-1 text-sm text-gray-600">Talla: {item.talla}</p> : null}
                          <p className="mt-3 text-lg font-black text-primary">{formatMoney(item.precio * item.cantidad, currencySymbol)}</p>
                        </div>
                        <button onClick={() => removeItem(index)} className="rounded-full border border-[var(--line-soft)] px-2.5 py-1 text-xs font-semibold text-primary-dark transition-colors hover:border-accent hover:text-accent">
                          Quitar
                        </button>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-[var(--line-soft)] pt-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary-dark/80">Cantidad</p>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateCantidad(index, item.cantidad - 1)}
                            className="h-8 w-8 rounded-lg border border-[var(--line-soft)] bg-white text-sm font-bold text-gray-700 transition-colors hover:border-primary hover:text-primary"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.cantidad}
                            onChange={(e) => updateCantidad(index, Number.parseInt(e.target.value || '1', 10))}
                            className="w-14 rounded-lg border border-[var(--line-soft)] px-2 py-1 text-center text-sm font-semibold text-gray-800 outline-none focus:border-primary"
                          />
                          <button
                            type="button"
                            onClick={() => updateCantidad(index, item.cantidad + 1)}
                            className="h-8 w-8 rounded-lg border border-[var(--line-soft)] bg-white text-sm font-bold text-gray-700 transition-colors hover:border-primary hover:text-primary"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
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
                        className="w-full rounded-lg border border-[var(--line-soft)] px-3 py-2 text-sm outline-none focus:border-primary"
                      />
                      <button
                        type="button"
                        onClick={aplicarCupon}
                        disabled={aplicandoCupon || !codigoCupon.trim()}
                        className="store-button-primary px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {aplicandoCupon ? '...' : 'Aplicar'}
                      </button>
                    </div>
                    {cuponAplicado ? <p className="mt-2 text-xs font-semibold text-primary">Cupon aplicado: {cuponAplicado.codigo}</p> : null}
                    {cuponError ? <p className="mt-2 text-xs font-semibold text-accent-dark">{cuponError}</p> : null}
                  </div>

                  <h2 className="mb-4 text-lg font-black text-gray-900">Resumen</h2>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-primary-dark/80">
                      <span>Subtotal</span>
                      <span className="font-semibold text-gray-900">{formatMoney(subtotal, currencySymbol)}</span>
                    </div>
                    {descuento > 0 ? (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Descuento</span>
                        <span className="font-semibold text-accent-dark">-{formatMoney(descuento, currencySymbol)}</span>
                      </div>
                    ) : null}
                    <div className="flex justify-between text-primary-dark/80">
                      <span>Envio</span>
                      <span className={costoEnvioFinal === 0 ? 'font-semibold text-primary-dark' : 'font-semibold text-gray-900'}>
                        {costoEnvioFinal === 0 ? 'Gratis' : formatMoney(costoEnvioFinal, currencySymbol)}
                      </span>
                    </div>
                    {costoEnvioFinal > 0 ? <p className="text-xs text-primary-dark/75">Envio gratis desde {formatMoney(299, currencySymbol)}</p> : null}
                  </div>

                  <div className="my-5 border-t border-[var(--line-soft)] pt-4">
                    <div className="flex justify-between text-lg font-black">
                      <span>Total</span>
                      <span className="text-primary">{formatMoney(total, currencySymbol)}</span>
                    </div>
                  </div>

                  <Link href="/checkout" className="store-button-primary w-full">
                    Ir a checkout
                  </Link>
                  <p className="mt-3 text-center text-xs text-primary-dark/75">Pago seguro y confirmacion inmediata de orden.</p>
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
