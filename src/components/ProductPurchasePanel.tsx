'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { addToCart, MAX_CANTIDAD_POR_ITEM } from '@/lib/cart'
import { formatMoney } from '@/lib/money'
import { getVariantesComprables, isProductoSinTallasComprable, resolvePrecioVariante } from '@/lib/purchase'
import type { ProductoDetalle } from '@/lib/storefront-types'

type ProductPurchasePanelProps = {
  producto: ProductoDetalle
  currencySymbol: string
  tallaSeleccionada: string
  onTallaChange: (talla: string) => void
}

// Panel de compra de la ficha. Solo se monta cuando el producto es comprable
// (activo + ventaOnline + stock real verificado). La validacion definitiva
// de stock y precio ocurre en servidor al validar el carrito y crear el pedido.
export default function ProductPurchasePanel({ producto, currencySymbol, tallaSeleccionada, onTallaChange }: ProductPurchasePanelProps) {
  const [cantidad, setCantidad] = useState(1)
  const [feedback, setFeedback] = useState<'idle' | 'agregado'>('idle')

  const variantesComprables = useMemo(() => getVariantesComprables(producto), [producto])
  const sinTallas = isProductoSinTallasComprable(producto)

  const variante = variantesComprables.find((item) => item.talla === tallaSeleccionada) ?? null
  const stockDisponible = sinTallas ? Number(producto.stock || 0) : Number(variante?.stock || 0)
  const maxCantidad = Math.max(1, Math.min(stockDisponible, MAX_CANTIDAD_POR_ITEM))
  const precioVigente = resolvePrecioVariante(producto.precio, variante)

  const puedeAgregar = (sinTallas || variante !== null) && stockDisponible > 0 && cantidad >= 1 && cantidad <= maxCantidad

  const handleCantidad = (next: number) => {
    if (!Number.isInteger(next)) return
    setCantidad(Math.min(Math.max(1, next), maxCantidad))
  }

  const handleAgregar = () => {
    if (!puedeAgregar) return

    addToCart({
      productoId: producto.id,
      slug: producto.slug,
      nombre: producto.nombre,
      marca: producto.marca.nombre,
      talla: sinTallas ? null : tallaSeleccionada,
      cantidad,
      imagenUrl: variante?.imagenUrl ?? producto.imagenUrl,
      precioRef: precioVigente,
    })

    setFeedback('agregado')
    window.setTimeout(() => setFeedback('idle'), 2500)
  }

  return (
    <div className="mt-5 space-y-4">
      {!sinTallas ? (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-primary-dark/80">Tallas disponibles para compra</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Seleccionar talla">
            {variantesComprables.map((item) => (
              <button
                key={item.talla}
                type="button"
                onClick={() => {
                  onTallaChange(item.talla)
                  setCantidad(1)
                }}
                aria-pressed={tallaSeleccionada === item.talla}
                className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                  tallaSeleccionada === item.talla
                    ? 'border-primary bg-[var(--surface-soft)] text-primary-dark'
                    : 'border-[var(--line-soft)] bg-white text-gray-700 hover:border-primary/50'
                }`}
              >
                {item.talla}
              </button>
            ))}
          </div>
          {variante ? (
            <p className="mt-2 text-xs text-primary-dark/80">
              Stock talla {variante.talla}: {variante.stock}
              {variante.skuVariante ? ` · SKU ${variante.skuVariante}` : ''}
            </p>
          ) : (
            <p className="mt-2 text-xs font-semibold text-accent-dark">Selecciona una talla para continuar.</p>
          )}
        </div>
      ) : (
        <p className="text-xs text-primary-dark/80">Stock disponible: {stockDisponible}</p>
      )}

      <div className="flex items-center justify-between rounded-2xl border border-[var(--line-soft)] bg-white px-4 py-3">
        <label htmlFor="pdp-cantidad" className="text-xs font-bold uppercase tracking-[0.12em] text-primary-dark/80">
          Cantidad
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleCantidad(cantidad - 1)}
            disabled={cantidad <= 1}
            aria-label="Disminuir cantidad"
            className="h-9 w-9 rounded-lg border border-[var(--line-soft)] bg-white text-sm font-bold text-gray-700 transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            -
          </button>
          <input
            id="pdp-cantidad"
            type="number"
            inputMode="numeric"
            min={1}
            max={maxCantidad}
            value={cantidad}
            onChange={(e) => handleCantidad(Number.parseInt(e.target.value || '1', 10))}
            className="w-14 rounded-lg border border-[var(--line-soft)] px-2 py-1.5 text-center text-sm font-semibold text-gray-800 outline-none focus:border-primary"
          />
          <button
            type="button"
            onClick={() => handleCantidad(cantidad + 1)}
            disabled={cantidad >= maxCantidad}
            aria-label="Aumentar cantidad"
            className="h-9 w-9 rounded-lg border border-[var(--line-soft)] bg-white text-sm font-bold text-gray-700 transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40"
          >
            +
          </button>
        </div>
      </div>

      {variante && precioVigente !== producto.precio ? (
        <p className="text-sm font-semibold text-primary-dark">
          Precio talla {variante.talla}: {formatMoney(precioVigente, currencySymbol)}
        </p>
      ) : null}

      <button
        type="button"
        onClick={handleAgregar}
        disabled={!puedeAgregar}
        className="store-button-primary w-full text-center disabled:cursor-not-allowed disabled:opacity-50"
      >
        {feedback === 'agregado' ? 'Agregado al carrito ✓' : 'Añadir al carrito'}
      </button>

      {feedback === 'agregado' ? (
        <p aria-live="polite" className="text-center text-sm font-semibold text-primary-dark">
          Producto agregado.{' '}
          <Link href="/carrito" className="underline">
            Ver carrito
          </Link>
        </p>
      ) : null}
    </div>
  )
}
