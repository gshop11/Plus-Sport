// Reglas puras de comprabilidad de productos y variantes.
// Compartidas entre servidor (validacion real) y cliente (estado de UI).
// La verdad final SIEMPRE se revalida en servidor contra la base de datos.

export type VariantaComprable = {
  talla: string
  stock: number
  ventaHabilitada?: boolean | null
  skuVariante?: string | null
  precio?: number | null
  imagenUrl?: string | null
}

export type ProductoComprable = {
  activo?: boolean | null
  ventaOnline?: boolean | null
  tallas?: VariantaComprable[] | null
  stock?: number | null
}

export function isVarianteComprable(variante: VariantaComprable | undefined | null): boolean {
  if (!variante) return false
  return Boolean(variante.ventaHabilitada) && Number(variante.stock || 0) > 0
}

export function getVariantesComprables(producto: ProductoComprable): VariantaComprable[] {
  if (!producto.activo || !producto.ventaOnline) return []
  const tallas = Array.isArray(producto.tallas) ? producto.tallas : []
  return tallas.filter(isVarianteComprable)
}

// Un producto sin tallas es comprable solo por su stock general.
export function isProductoSinTallasComprable(producto: ProductoComprable): boolean {
  const tallas = Array.isArray(producto.tallas) ? producto.tallas : []
  return Boolean(producto.activo && producto.ventaOnline) && tallas.length === 0 && Number(producto.stock || 0) > 0
}

export function isProductoComprable(producto: ProductoComprable): boolean {
  return getVariantesComprables(producto).length > 0 || isProductoSinTallasComprable(producto)
}

export function resolvePrecioVariante(precioProducto: number, variante?: VariantaComprable | null): number {
  const especifico = Number(variante?.precio)
  if (Number.isFinite(especifico) && especifico > 0) return especifico
  return precioProducto
}
