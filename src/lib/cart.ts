'use client'

// Carrito persistente del lado cliente (localStorage).
// IMPORTANTE: lo que se guarda aqui NUNCA es verdad comercial. Los precios,
// descuentos, stock, envio y totales se recalculan SIEMPRE en servidor via
// POST /api/checkout/validar y al crear el pedido. precioRef solo permite un
// primer render instantaneo mientras llega la validacion del servidor.

export type CartItem = {
  productoId: string
  slug: string
  nombre: string
  marca: string
  talla: string | null
  cantidad: number
  imagenUrl?: string | null
  precioRef: number
}

export const CART_EVENT = 'carrito:update'
const STORAGE_KEY = 'carrito_v2'
const LEGACY_KEY = 'carrito'
export const MAX_CANTIDAD_POR_ITEM = 10

function sanitizeItem(raw: unknown): CartItem | null {
  if (typeof raw !== 'object' || raw === null) return null
  const item = raw as Record<string, unknown>
  const productoId = String(item.productoId ?? '').trim()
  if (!productoId) return null

  const cantidad = Math.trunc(Number(item.cantidad))
  if (!Number.isInteger(cantidad) || cantidad <= 0) return null

  return {
    productoId,
    slug: String(item.slug ?? ''),
    nombre: String(item.nombre ?? ''),
    marca: String(item.marca ?? ''),
    talla: item.talla ? String(item.talla) : null,
    cantidad: Math.min(cantidad, MAX_CANTIDAD_POR_ITEM),
    imagenUrl: item.imagenUrl ? String(item.imagenUrl) : null,
    precioRef: Number.isFinite(Number(item.precioRef)) ? Number(item.precioRef) : 0,
  }
}

// Migra el formato legado ({id, talla, cantidad, ...}) una sola vez.
function migrateLegacyCart(): CartItem[] {
  try {
    const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || '[]')
    if (!Array.isArray(legacy) || legacy.length === 0) return []

    const migrated = legacy
      .map((row: Record<string, unknown>) =>
        sanitizeItem({
          productoId: row?.id,
          slug: '',
          nombre: row?.nombre,
          marca: row?.marca,
          talla: row?.talla,
          cantidad: row?.cantidad,
          imagenUrl: row?.imagenUrl,
          precioRef: row?.precio,
        }),
      )
      .filter((item): item is CartItem => item !== null)

    localStorage.removeItem(LEGACY_KEY)
    return migrated
  } catch {
    return []
  }
}

export function getCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === null) {
      const migrated = migrateLegacyCart()
      if (migrated.length > 0) saveCart(migrated)
      return migrated
    }

    const parsed = JSON.parse(stored)
    if (!Array.isArray(parsed)) return []
    return parsed.map(sanitizeItem).filter((item): item is CartItem => item !== null)
  } catch {
    return []
  }
}

export function saveCart(items: CartItem[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  window.dispatchEvent(new Event(CART_EVENT))
}

export function addToCart(nuevo: Omit<CartItem, 'cantidad'> & { cantidad?: number }): CartItem[] {
  const items = getCart()
  const cantidad = Math.min(Math.max(1, Math.trunc(Number(nuevo.cantidad ?? 1))), MAX_CANTIDAD_POR_ITEM)
  const index = items.findIndex(
    (item) => item.productoId === nuevo.productoId && (item.talla ?? null) === (nuevo.talla ?? null),
  )

  if (index >= 0) {
    items[index] = {
      ...items[index],
      cantidad: Math.min(items[index].cantidad + cantidad, MAX_CANTIDAD_POR_ITEM),
    }
  } else {
    items.push({ ...nuevo, cantidad, talla: nuevo.talla ?? null })
  }

  saveCart(items)
  return items
}

export function updateCartItem(productoId: string, talla: string | null, cantidad: number): CartItem[] {
  const items = getCart()
  const next = items
    .map((item) => {
      if (item.productoId !== productoId || (item.talla ?? null) !== (talla ?? null)) return item
      const qty = Math.trunc(Number(cantidad))
      if (!Number.isInteger(qty) || qty <= 0) return null
      return { ...item, cantidad: Math.min(qty, MAX_CANTIDAD_POR_ITEM) }
    })
    .filter((item): item is CartItem => item !== null)

  saveCart(next)
  return next
}

export function removeFromCart(productoId: string, talla: string | null): CartItem[] {
  const next = getCart().filter(
    (item) => !(item.productoId === productoId && (item.talla ?? null) === (talla ?? null)),
  )
  saveCart(next)
  return next
}

export function clearCart(): CartItem[] {
  saveCart([])
  return []
}

export function getCartCount(): number {
  return getCart().reduce((total, item) => total + item.cantidad, 0)
}
