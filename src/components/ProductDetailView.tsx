'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useCurrencySymbol } from '@/hooks/useCurrencySymbol'
import { formatMoney } from '@/lib/money'
import type { ProductoDetalle } from '@/lib/storefront-types'

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

const BENEFICIOS = [
  { titulo: 'Envio nacional', copy: 'Despachos con seguimiento a todo Peru.' },
  { titulo: 'Cambios sencillos', copy: 'Gestion de cambios y devoluciones sin friccion.' },
  { titulo: 'Pago seguro', copy: 'Checkout protegido y confirmacion inmediata.' },
]

export default function ProductDetailView({ producto }: { producto: ProductoDetalle }) {
  const currencySymbol = useCurrencySymbol()
  const images = (() => {
    const gallery = producto.galeriaUrls.length > 0 ? producto.galeriaUrls : []
    if (gallery.length > 0) return gallery
    if (producto.imagenUrl) return [producto.imagenUrl]
    return [PLACEHOLDER_IMAGE]
  })()
  const [imagenActiva, setImagenActiva] = useState(images[0] || PLACEHOLDER_IMAGE)
  const [tallaSeleccionada, setTallaSeleccionada] = useState('')
  const [cantidad, setCantidad] = useState(1)
  const [agregado, setAgregado] = useState(false)

  const descuento = producto.precioAnterior
    ? Math.round(((producto.precioAnterior - producto.precio) / producto.precioAnterior) * 100)
    : null

  const descripcionParrafos = producto.descripcion
    .split('\n\n')
    .map((line) => line.trim())
    .filter(Boolean)

  useEffect(() => {
    if (producto.tallas.length === 0) return
    const firstAvailable = producto.tallas.find((item) => Number(item.stock || 0) > 0)
    if (firstAvailable) {
      setTallaSeleccionada(firstAvailable.talla)
      return
    }
    setTallaSeleccionada(producto.tallas[0].talla)
  }, [producto.tallas])

  const stockSeleccionado = tallaSeleccionada
    ? Number(producto.tallas.find((item) => item.talla === tallaSeleccionada)?.stock || 0)
    : 0

  const stockDisponible = producto.tallas.length > 0 ? stockSeleccionado : Number(producto.stock || 0)

  const handleAgregar = () => {
    if (producto.tallas.length > 0 && !tallaSeleccionada) {
      alert('Selecciona una talla antes de agregar al carrito.')
      return
    }

    if (stockDisponible <= 0) {
      alert('Este producto no tiene stock disponible por ahora.')
      return
    }

    const cantidadFinal = Math.min(Math.max(1, cantidad), Math.max(stockDisponible, 1))

    const carrito: CarritoItem[] = JSON.parse(localStorage.getItem('carrito') || '[]')

    const existenteIndex = carrito.findIndex(
      (item) => item.id === producto.id && item.talla === (tallaSeleccionada || ''),
    )

    if (existenteIndex >= 0) {
      carrito[existenteIndex].cantidad += cantidadFinal
    } else {
      carrito.push({
        id: producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
        precioAnterior: producto.precioAnterior,
        talla: tallaSeleccionada || '',
        cantidad: cantidadFinal,
        imagenUrl: imagenActiva || producto.imagenUrl || PLACEHOLDER_IMAGE,
        marca: producto.marca.nombre,
      })
    }

    localStorage.setItem('carrito', JSON.stringify(carrito))
    window.dispatchEvent(new Event('carrito:update'))
    window.dispatchEvent(new Event('carrito:open'))

    setAgregado(true)
    setTimeout(() => setAgregado(false), 1800)
  }

  return (
    <div className="grid gap-7 lg:grid-cols-[1.15fr_1fr] lg:gap-8">
      <section className="space-y-4">
        <div className="relative overflow-hidden rounded-3xl border border-[var(--line-soft)] bg-[var(--surface-soft)] pt-[92%] shadow-[0_24px_48px_-38px_rgba(13,23,87,0.65)]">
          <Image src={imagenActiva || PLACEHOLDER_IMAGE} alt={producto.nombre} fill sizes="(max-width: 1024px) 100vw, 56vw" className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
        </div>
        {images.length > 1 ? (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
            {images.map((url, index) => (
              <button
                key={`${url}-${index}`}
                type="button"
                onClick={() => setImagenActiva(url)}
                className={`relative overflow-hidden rounded-xl border bg-[var(--surface-soft)] pt-[100%] transition-colors ${
                  url === imagenActiva ? 'border-primary ring-2 ring-primary/20' : 'border-[var(--line-soft)] hover:border-primary/40'
                }`}
                aria-label={`Ver imagen ${index + 1}`}
              >
                <Image src={url || PLACEHOLDER_IMAGE} alt={`${producto.nombre} ${index + 1}`} fill sizes="120px" className="object-cover" />
              </button>
            ))}
          </div>
        ) : null}
      </section>

      <section className="store-panel h-fit p-6 sm:p-7 lg:sticky lg:top-24">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-primary/20 bg-[var(--surface-soft)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary-dark">
            {producto.marca.nombre || 'Marca'}
          </span>
          {producto.etiqueta ? (
            <span className="rounded-full bg-accent px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white">
              {producto.etiqueta}
            </span>
          ) : null}
        </div>

        <h1 className="text-3xl font-black leading-tight text-gray-900 sm:text-4xl">{producto.nombre}</h1>

        <div className="mt-4 rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-soft)] p-4 sm:p-5">
          <div className="flex flex-wrap items-end gap-3">
            <p className="text-3xl font-black text-primary">{formatMoney(producto.precio, currencySymbol)}</p>
            {producto.precioAnterior ? (
              <p className="text-sm font-semibold text-gray-500 line-through">{formatMoney(producto.precioAnterior, currencySymbol)}</p>
            ) : null}
            {descuento ? (
              <span className="rounded-full bg-accent-dark px-2 py-0.5 text-xs font-bold text-white">-{descuento}%</span>
            ) : null}
          </div>
          <p className={`mt-2 text-sm font-semibold ${stockDisponible > 0 || producto.stock > 0 ? 'text-primary-dark' : 'text-accent-dark'}`}>
            {stockDisponible > 0 || producto.stock > 0 ? 'Disponible para despacho inmediato' : 'Sin stock por ahora'}
          </p>
        </div>

        {producto.tallas.length > 0 ? (
          <div className="mt-5">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-primary-dark/80">Tallas</p>
            <div className="flex flex-wrap gap-2">
              {producto.tallas.map((item) => {
                const inStock = Number(item.stock || 0) > 0
                return (
                  <button
                    key={item.talla}
                    type="button"
                    onClick={() => setTallaSeleccionada(item.talla)}
                    disabled={!inStock}
                    className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                      tallaSeleccionada === item.talla
                        ? 'border-primary bg-primary text-white'
                      : inStock
                          ? 'border-[var(--line-soft)] bg-white text-gray-700 hover:border-primary/50'
                          : 'cursor-not-allowed border-[var(--line-soft)] bg-[var(--surface-soft)] text-gray-400'
                    }`}
                    title={inStock ? `${item.stock} disponibles` : 'Agotado'}
                  >
                    {item.talla}
                  </button>
                )
              })}
            </div>
            {tallaSeleccionada ? (
              <p className="mt-2 text-xs text-primary-dark/80">
                Stock talla {tallaSeleccionada}: {stockSeleccionado}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-5">
          <label htmlFor="pdp-cantidad" className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-primary-dark/80">
            Cantidad
          </label>
          <input
            id="pdp-cantidad"
            type="number"
            min="1"
            max={Math.max(stockDisponible, 1)}
            value={cantidad}
            onChange={(event) => setCantidad(Math.max(1, Number.parseInt(event.target.value || '1', 10)))}
            className="w-24 rounded-lg border border-[var(--line-soft)] bg-white px-3 py-2 text-sm font-semibold text-gray-800 outline-none focus:border-primary"
          />
        </div>

        <button
          type="button"
          onClick={handleAgregar}
          disabled={stockDisponible <= 0 && producto.stock <= 0}
          className={`mt-5 w-full rounded-xl py-3 text-sm font-bold uppercase tracking-[0.11em] text-white transition-colors ${
            agregado
              ? 'bg-primary'
              : stockDisponible <= 0 && producto.stock <= 0
                ? 'cursor-not-allowed bg-black/35'
                : 'bg-accent hover:bg-accent-dark'
          }`}
        >
          {agregado ? 'Agregado al carrito' : 'Agregar al carrito'}
        </button>

        <div className="mt-3">
          <Link href="/carrito" className="store-button-secondary w-full text-center">
            Ver carrito completo
          </Link>
        </div>

        <div className="mt-6 space-y-3 rounded-2xl border border-[var(--line-soft)] bg-white p-4">
          {BENEFICIOS.map((item) => (
            <div key={item.titulo} className="rounded-xl bg-[var(--surface-soft)] px-3 py-2">
              <p className="text-sm font-bold text-gray-900">{item.titulo}</p>
              <p className="text-xs text-primary-dark/80">{item.copy}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 border-t border-[var(--line-soft)] pt-4">
          <h2 className="mb-2 text-sm font-bold uppercase tracking-[0.11em] text-primary-dark/80">Descripcion</h2>
          {descripcionParrafos.length > 0 ? (
            <div className="space-y-2 text-sm text-gray-700">
              {descripcionParrafos.map((text, index) => (
                <p key={`${producto.id}-desc-${index}`}>{text}</p>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Producto orientado a rendimiento y uso diario en sneaker/sportwear.</p>
          )}
        </div>
      </section>
    </div>
  )
}
