'use client'

import Image from 'next/image'
import Link from 'next/link'
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

const etiquetaConfig = {
  nuevo: { texto: 'Nuevo', className: 'bg-primary text-white' },
  hot: { texto: 'Hot', className: 'bg-black text-white' },
  top: { texto: 'Top', className: 'bg-accent text-white' },
  oferta: { texto: 'Oferta', className: 'bg-accent-dark text-white' },
  '': null,
}

const PLACEHOLDER_IMAGE = '/placeholder-product.svg'

export default function TarjetaProducto({ producto, index = 0 }: { producto: ProductoCard; index?: number }) {
  const currencySymbol = useCurrencySymbol()
  const tallas = producto.tallas ?? []
  const descuento = producto.precioAnterior
    ? Math.round(((producto.precioAnterior - producto.precio) / producto.precioAnterior) * 100)
    : null

  const etiqueta = producto.etiqueta ? etiquetaConfig[producto.etiqueta] : null
  const imageSrc = producto.imagenUrl || PLACEHOLDER_IMAGE
  const isAboveFold = index < 4
  const ahorro = producto.precioAnterior ? Math.max(0, producto.precioAnterior - producto.precio) : 0
  const productHref = producto.slug ? `/producto/${encodeURIComponent(producto.slug)}` : '/productos'

  return (
    <Link
      href={productHref}
      className="group block h-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2"
      aria-label={`Ver detalle de ${producto.nombre}`}
    >
      <article className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--line-soft)] bg-white shadow-[0_16px_34px_-30px_rgba(13,23,87,0.55)] transition-[transform,box-shadow,border-color] duration-300 group-hover:-translate-y-1 group-hover:border-primary/40 group-hover:shadow-[0_28px_55px_-36px_rgba(13,23,87,0.6)]">
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
            <span className="rounded-full bg-accent px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white">
              -{descuento}%
            </span>
          ) : null}
        </div>

        <div className="relative block overflow-hidden bg-[var(--surface-soft)] pt-[116%]">
          <Image
            src={imageSrc}
            alt={producto.nombre}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 48vw, (max-width: 1200px) 33vw, 25vw"
            priority={isAboveFold}
            loading={isAboveFold ? 'eager' : 'lazy'}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/58 via-black/12 to-transparent opacity-90" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/25 via-transparent to-accent/20 opacity-70 transition-opacity duration-300 group-hover:opacity-100" />
          <span className="absolute bottom-3 left-3 rounded-full border border-white/30 bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.11em] text-white backdrop-blur-sm">
            Sneaker / Sport
          </span>
        </div>

        <div className="flex flex-1 flex-col p-4">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">{producto.marca || 'Marca'}</p>
          <h3 className="line-clamp-2 min-h-[2.8rem] text-[15px] font-bold leading-5 text-gray-900 transition-colors group-hover:text-primary">
            {producto.nombre}
          </h3>

          {tallas.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tallas.slice(0, 5).map((talla) => (
                <span key={talla} className="rounded-full border border-[var(--line-soft)] bg-[var(--surface-soft)] px-2 py-0.5 text-[11px] font-semibold text-gray-600">
                  {talla}
                </span>
              ))}
              {tallas.length > 5 ? <span className="rounded-full border border-[var(--line-soft)] px-2 py-0.5 text-[11px] text-gray-500">+{tallas.length - 5}</span> : null}
            </div>
          ) : null}

          <div className="mt-4 rounded-xl border border-[var(--line-soft)] bg-[var(--surface-soft)] px-3 py-2">
            <div className="flex items-end justify-between gap-2">
              <div>
                <p className="text-xl font-black text-primary">{formatMoney(producto.precio, currencySymbol)}</p>
                {producto.precioAnterior ? <p className="text-xs text-gray-400 line-through">{formatMoney(producto.precioAnterior, currencySymbol)}</p> : <p className="text-xs text-gray-400">Precio regular</p>}
              </div>
              {ahorro > 0 ? (
                <p className="text-right text-[11px] font-semibold uppercase tracking-[0.1em] text-primary-dark">
                  Ahorras
                  <br />
                  {formatMoney(ahorro, currencySymbol)}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-[var(--line-soft)] pt-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">
              {tallas.length > 0 ? `${tallas.length} tallas` : 'Stock online'}
            </p>
            <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-primary transition-colors group-hover:text-accent">
              Ver detalle
              <span aria-hidden="true">{'>'}</span>
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}
