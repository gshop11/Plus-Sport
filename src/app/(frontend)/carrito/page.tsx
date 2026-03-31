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

  const removeItem = (index: number) => {
    const nuevoCarrito = items.filter((_, i) => i !== index)
    setItems(nuevoCarrito)
    localStorage.setItem('carrito', JSON.stringify(nuevoCarrito))
    window.dispatchEvent(new Event('carrito:update'))
  }

  const updateCantidad = (index: number, nuevaCantidad: number) => {
    if (nuevaCantidad < 1) return
    const nuevoCarrito = [...items]
    nuevoCarrito[index].cantidad = nuevaCantidad
    setItems(nuevoCarrito)
    localStorage.setItem('carrito', JSON.stringify(nuevoCarrito))
    window.dispatchEvent(new Event('carrito:update'))
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
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-gray-500">Cargando carrito...</div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <HeaderClient />
      <main className="bg-gray-50">
        <section className="bg-primary py-8 text-white">
          <div className="mx-auto max-w-7xl px-4">
            <h1 className="text-2xl font-black sm:text-4xl">Tu Carrito</h1>
          </div>
        </section>

        <section className="bg-white py-12">
          <div className="mx-auto max-w-7xl px-4">
            {items.length === 0 ? (
              <div className="py-12 text-center">
                <p className="mb-4 text-lg text-gray-500">Tu carrito esta vacio</p>
                <Link href="/productos" className="inline-block rounded bg-primary px-6 py-2 font-bold text-white hover:bg-blue-900">
                  Seguir comprando
                </Link>
              </div>
            ) : (
              <div className="grid gap-8 lg:grid-cols-3">
                <div className="lg:col-span-2">
                  <div className="space-y-4">
                    {items.map((item, index) => (
                      <div key={index} className="flex gap-3 rounded-lg border border-gray-200 bg-white p-3 sm:gap-4 sm:p-4">
                        {item.imagenUrl && <img src={item.imagenUrl} alt={item.nombre} className="h-16 w-16 rounded object-cover sm:h-24 sm:w-24" />}
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900">{item.nombre}</h3>
                          {item.marca && <p className="text-sm text-gray-500">{item.marca}</p>}
                          {item.talla && <p className="text-sm text-gray-600">Talla: {item.talla}</p>}
                          <p className="mt-2 text-lg font-bold text-primary">{formatMoney(item.precio * item.cantidad, currencySymbol)}</p>
                        </div>
                        <div className="flex flex-col items-end gap-3">
                          <input
                            type="number"
                            min="1"
                            value={item.cantidad}
                            onChange={(e) => updateCantidad(index, parseInt(e.target.value))}
                            className="w-16 rounded border border-gray-300 px-2 py-1 text-sm"
                          />
                          <button onClick={() => removeItem(index)} className="text-sm font-bold text-red-500 hover:text-red-700">
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="sticky top-20 h-fit rounded-lg border border-gray-200 bg-white p-6">
                  <div className="mb-5">
                    <p className="mb-2 text-sm font-semibold text-primary">Tengo un cupon de descuento</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={codigoCupon}
                        onChange={(e) => setCodigoCupon(e.target.value.toUpperCase())}
                        placeholder="Codigo"
                        className="w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-accent"
                      />
                      <button
                        type="button"
                        onClick={aplicarCupon}
                        disabled={aplicandoCupon || !codigoCupon.trim()}
                        className="rounded bg-primary px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {aplicandoCupon ? '...' : 'AGREGAR'}
                      </button>
                    </div>
                    {cuponAplicado && <p className="mt-2 text-xs font-semibold text-green-600">Cupon aplicado: {cuponAplicado.codigo}</p>}
                    {cuponError && <p className="mt-2 text-xs font-semibold text-red-500">{cuponError}</p>}
                  </div>

                  <h3 className="mb-4 text-lg font-bold">Resumen de compra</h3>
                  <div className="mb-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatMoney(subtotal, currencySymbol)}</span>
                    </div>
                    {descuento > 0 && (
                      <div className="flex justify-between">
                        <span>Descuento:</span>
                        <span className="font-semibold text-green-600">-{formatMoney(descuento, currencySymbol)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Envio:</span>
                      <span className={costoEnvioFinal === 0 ? 'font-bold text-green-600' : ''}>
                        {costoEnvioFinal === 0 ? 'Gratis' : formatMoney(costoEnvioFinal, currencySymbol)}
                      </span>
                    </div>
                    {costoEnvioFinal > 0 && <p className="pt-2 text-xs text-gray-500">Envio gratis desde {formatMoney(299, currencySymbol)}</p>}
                  </div>

                  <div className="mb-6 border-t pt-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-primary">{formatMoney(total, currencySymbol)}</span>
                    </div>
                  </div>

                  <Link href="/checkout" className="block w-full rounded bg-accent py-3 text-center font-bold text-white transition-colors hover:bg-orange-700">
                    Proceder al checkout
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
