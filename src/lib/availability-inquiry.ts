import type { ProductoCard, ProductoTalla } from './storefront-types'

const DEFAULT_WHATSAPP_NUMBER = '51979705255'

const formatInquiryMoney = (value: number, symbol: string) => {
  const parsed = Number.isFinite(value) ? value : Number(value || 0)
  const amount = Number.isFinite(parsed) ? parsed : 0
  return `${symbol} ${amount.toFixed(2)}`
}

export type AvailabilityInquiryInput = {
  nombre: string
  sku?: string | null
  precio: number
  productUrl: string
  talla?: string | null
  currencySymbol?: string
  whatsappNumber?: string | null
}

export const normalizeWhatsappNumber = (value?: string | null) => {
  const digits = String(value || '').replace(/\D/g, '')
  if (!digits) return DEFAULT_WHATSAPP_NUMBER
  if (digits.length === 9) return `51${digits}`
  return digits
}

export const getProductoCardStock = (producto: Pick<ProductoCard, 'stock' | 'tallas'>) => {
  if (typeof producto.stock === 'number') return producto.stock
  return Array.isArray(producto.tallas) && producto.tallas.length > 0 ? 0 : 0
}

export const getProductoDetalleStock = (stock: number, tallas: ProductoTalla[] = []) => {
  return tallas.length > 0
    ? tallas.reduce((total, item) => total + (Number(item.stock) || 0), 0)
    : Number(stock || 0)
}

export const buildAvailabilityInquiryMessage = ({
  nombre,
  sku,
  precio,
  productUrl,
  talla,
  currencySymbol = 'S/',
}: AvailabilityInquiryInput) => {
  const lines = [
    'Hola, deseo consultar la disponibilidad de:',
    `Producto: ${nombre}`,
  ]

  if (sku?.trim()) {
    lines.push(`Codigo: ${sku.trim()}`)
  }

  lines.push(`Precio mostrado: ${formatInquiryMoney(precio, currencySymbol)}`)
  lines.push(`Enlace: ${productUrl}`)

  if (talla?.trim()) {
    lines.push(`Talla consultada: ${talla.trim()}`)
  }

  return lines.join('\n')
}

export const buildAvailabilityInquiryUrl = (input: AvailabilityInquiryInput) => {
  const number = normalizeWhatsappNumber(input.whatsappNumber)
  const text = encodeURIComponent(buildAvailabilityInquiryMessage(input))
  return `https://wa.me/${number}?text=${text}`
}
