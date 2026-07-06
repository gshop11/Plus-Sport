import assert from 'node:assert/strict'

const {
  buildAvailabilityInquiryMessage,
  buildAvailabilityInquiryUrl,
  getProductoCardStock,
  getProductoDetalleStock,
  normalizeWhatsappNumber,
} = await import('../src/lib/availability-inquiry.ts')

const baseInput = {
  nombre: 'Zapatilla Joma niño & mujer',
  sku: 'SKU 123/Ñ',
  precio: 129.9,
  productUrl: 'https://preview.example.com/producto/zapatilla-joma',
  currencySymbol: 'S/',
  whatsappNumber: '+51 979 705 255',
}

assert.equal(normalizeWhatsappNumber('+51 979 705 255'), '51979705255')
assert.equal(normalizeWhatsappNumber('979705255'), '51979705255')

assert.equal(getProductoCardStock({ stock: 0, tallas: [] }), 0)
assert.equal(getProductoCardStock({ stock: 4, tallas: [] }), 4)
assert.equal(getProductoDetalleStock(0, [{ talla: '38', stock: 0 }, { talla: '39', stock: 0 }]), 0)
assert.equal(getProductoDetalleStock(0, [{ talla: '38', stock: 0 }, { talla: '39', stock: 1 }]), 1)
assert.equal(getProductoDetalleStock(3, []), 3)

const message = buildAvailabilityInquiryMessage({ ...baseInput, talla: '38-39' })
assert.match(message, /Producto: Zapatilla Joma/)
assert.match(message, /Codigo: SKU 123\/Ñ/)
assert.match(message, /Precio mostrado: S\/ 129.90/)
assert.match(message, /Talla consultada: 38-39/)

const url = buildAvailabilityInquiryUrl({ ...baseInput, talla: '38-39' })
assert.ok(url.startsWith('https://wa.me/51979705255?text='))
assert.ok(url.includes('Zapatilla%20Joma%20ni%C3%B1o%20%26%20mujer'))
assert.ok(url.includes('SKU%20123%2F%C3%91'))
assert.ok(url.includes('S%2F%20129.90'))

const noSkuMessage = buildAvailabilityInquiryMessage({ ...baseInput, sku: '', talla: null })
assert.doesNotMatch(noSkuMessage, /Codigo:/)
assert.doesNotMatch(noSkuMessage, /Talla consultada:/)

console.log('availability inquiry tests passed')
