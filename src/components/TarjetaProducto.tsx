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
  categoria?: string
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

const CartIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-[18px] w-[18px]">
    <circle cx="9" cy="20" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="18" cy="20" r="1.3" fill="currentColor" stroke="none" />
    <path d="M2.5 3h2.4l1.9 11.2a2 2 0 0 0 2 1.7h8.4a2 2 0 0 0 2-1.6l1.5-7.3H6.2" />
  </svg>
)

export default function TarjetaProducto({
  producto,
  index = 0,
  variant = 'default',
}: {
  producto: ProductoCard
  index?: number
  variant?: 'default' | 'homeOffer' | 'homeNewArrival'
}) {
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

  if (variant === 'homeOffer' || variant === 'homeNewArrival') {
    const isNewArrival = variant === 'homeNewArrival'
    const showPreviousPrice = !isNewArrival && Boolean(producto.precioAnterior)
    const showDiscountBadge = !isNewArrival && Boolean(descuento)

    return (
      <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[var(--line-soft)] bg-white shadow-[0_14px_30px_-26px_rgba(13,23,87,0.5)] transition-all duration-200 hover:-translate-y-[3px] hover:border-primary/30 hover:shadow-[0_20px_38px_-26px_rgba(13,23,87,0.62)]">
        <Link href={productHref} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2" aria-label={`Ver detalle de ${producto.nombre}`}>
          <div className="relative overflow-hidden bg-[var(--surface-soft)] pt-[92%]">
            <div className="absolute right-2 top-2 z-10 flex flex-wrap items-center justify-end gap-1">
              {etiqueta ? (
                <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] ${etiqueta.className}`}>{etiqueta.texto}</span>
              ) : null}
              {showDiscountBadge ? <span className="rounded-full bg-accent px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-white">-{descuento}%</span> : null}
            </div>
            <Image
              src={imageSrc}
              alt={producto.nombre}
              fill
              className="object-cover transition-transform duration-200 group-hover:scale-[1.03]"
              sizes="(max-width: 768px) 48vw, (max-width: 1200px) 33vw, 20vw"
              priority={isAboveFold}
              loading={isAboveFold ? 'eager' : 'lazy'}
            />
          </div>
          <div className="px-3 pt-2">
            <h3 className="line-clamp-2 min-h-[2.4rem] text-[13px] font-bold leading-[1.15rem] text-gray-900 transition-colors group-hover:text-primary">{producto.nombre}</h3>
            <p className="mt-0.5 truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-primary-dark/70">{producto.categoria || ' '}</p>
          </div>
        </Link>

        <div className="mt-auto flex items-center justify-between gap-2 px-3 pb-2.5 pt-1.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-black text-primary sm:text-lg">{formatMoney(producto.precio, currencySymbol)}</span>
            {showPreviousPrice ? <span className="text-[11px] text-gray-500 line-through">{formatMoney(producto.precioAnterior!, currencySymbol)}</span> : null}
          </div>
          <Link
            href={productHref}
            aria-label={`Seleccionar talla de ${producto.nombre}`}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-transparent text-primary-dark transition-colors hover:bg-[var(--surface-soft)] hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2"
          >
            <CartIcon />
          </Link>
        </div>
      </article>
    )
  }

  return (
    <Link
      href={productHref}
      className="group block h-full rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2"
      aria-label={`Ver detalle de ${producto.nombre}`}
    >
      <article className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-[var(--line-soft)] bg-white shadow-[0_20px_44px_-34px_rgba(13,23,87,0.55)] transition-[transform,box-shadow,border-color] duration-300 group-hover:-translate-y-1 group-hover:border-primary/35 group-hover:shadow-[0_28px_58px_-34px_rgba(13,23,87,0.7)]">
        <div className="absolute right-3 top-3 z-20 flex flex-wrap items-center justify-end gap-1.5">
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

        <div className="relative block overflow-hidden bg-[var(--surface-soft)] pt-[108%]">
          <Image
            src={imageSrc}
            alt={producto.nombre}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 48vw, (max-width: 1200px) 33vw, 25vw"
            priority={isAboveFold}
            loading={isAboveFold ? 'eager' : 'lazy'}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-85 transition-opacity duration-300 group-hover:opacity-95" />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/18 via-transparent to-accent/14 opacity-70 transition-opacity duration-300 group-hover:opacity-100" />
        </div>

        <div className="flex flex-1 flex-col p-4 sm:p-5">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary-dark/80">{producto.marca || 'Marca'}</p>
          <h3 className="line-clamp-2 min-h-[2.8rem] text-[15px] font-bold leading-5 text-gray-900 transition-colors group-hover:text-primary">
            {producto.nombre}
          </h3>

          {tallas.length > 0 ? (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {tallas.slice(0, 5).map((talla) => (
                <span key={talla} className="rounded-full border border-primary/20 bg-[var(--surface-soft)] px-2 py-0.5 text-[11px] font-semibold text-primary-dark/80">
                  {talla}
                </span>
              ))}
              {tallas.length > 5 ? <span className="rounded-full border border-primary/20 px-2 py-0.5 text-[11px] text-primary-dark/75">+{tallas.length - 5}</span> : null}
            </div>
          ) : null}

          <div className="mt-3.5 rounded-xl border border-[var(--line-soft)] bg-[var(--surface-soft)] px-3 py-2.5">
            <div className="flex items-end justify-between gap-2">
              <div>
                <p className="text-xl font-black text-primary">{formatMoney(producto.precio, currencySymbol)}</p>
                {producto.precioAnterior ? <p className="text-xs text-gray-500 line-through">{formatMoney(producto.precioAnterior, currencySymbol)}</p> : <p className="text-xs text-gray-500">Precio regular</p>}
              </div>
              {ahorro > 0 ? (
                <p className="text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-primary-dark">
                  Ahorras
                  <br />
                  {formatMoney(ahorro, currencySymbol)}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-[var(--line-soft)] pt-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary-dark/75">
              {tallas.length > 0 ? `${tallas.length} tallas` : 'Stock online'}
            </p>
            <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-primary transition-colors group-hover:text-accent">
              Ver detalle
              <span aria-hidden="true">{'>'}</span>
            </span>
          </div>
        </div>
      </article>
    </Link>
  )
}
