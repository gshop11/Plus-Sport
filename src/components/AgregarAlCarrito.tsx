'use client'

import { useState } from 'react'
import type { ProductoCard } from './TarjetaProducto'

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

export default function AgregarAlCarrito({
  producto,
  onAdded,
}: {
  producto: ProductoCard
  onAdded?: (carrito: CarritoItem[]) => void
}) {
  const [tallaSeleccionada, setTallaSeleccionada] = useState('')
  const [cantidad, setCantidad] = useState(1)
  const [agregado, setAgregado] = useState(false)

  const handleAgregar = () => {
    if (!tallaSeleccionada && producto.tallas.length > 0) {
      alert('Por favor selecciona una talla')
      return
    }

    const carrito: CarritoItem[] = JSON.parse(localStorage.getItem('carrito') || '[]')

    const existente = carrito.findIndex(
      (item: { id: string; talla: string }) =>
        item.id === producto.id && item.talla === tallaSeleccionada
    )

    if (existente >= 0) {
      carrito[existente].cantidad += cantidad
    } else {
      carrito.push({
        id: producto.id,
        nombre: producto.nombre,
        precio: producto.precio,
        precioAnterior: producto.precioAnterior,
        talla: tallaSeleccionada,
        cantidad,
        imagenUrl: producto.imagenUrl,
        marca: producto.marca,
      })
    }

    localStorage.setItem('carrito', JSON.stringify(carrito))
    window.dispatchEvent(new Event('carrito:update'))
    onAdded?.(carrito)

    setAgregado(true)
    setTimeout(() => setAgregado(false), 2000)
  }

  return (
    <div className="space-y-3 mt-4">
      {producto.tallas.length > 0 && (
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-2">Talla</label>
          <select
            value={tallaSeleccionada}
            onChange={(e) => setTallaSeleccionada(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-accent"
          >
            <option value="">Seleccionar talla</option>
            {producto.tallas.map((talla) => (
              <option key={talla} value={talla}>
                {talla}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-xs font-bold text-gray-600 mb-2">Cantidad</label>
        <input
          type="number"
          min="1"
          max="10"
          value={cantidad}
          onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value)))}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-accent"
        />
      </div>

      <button
        onClick={handleAgregar}
        className={`w-full py-2 rounded font-bold text-white transition-all ${
          agregado
            ? 'bg-green-500 text-green-100'
            : 'bg-accent hover:bg-orange-700'
        }`}
      >
        {agregado ? '✓ Agregado al carrito' : '🛒 Agregar al carrito'}
      </button>
    </div>
  )
}
