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
  const tallas = producto.tallas ?? []
  const [tallaSeleccionada, setTallaSeleccionada] = useState('')
  const [cantidad, setCantidad] = useState(1)
  const [agregado, setAgregado] = useState(false)

  const handleAgregar = () => {
    if (!tallaSeleccionada && tallas.length > 0) {
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
    <div className="mt-4 space-y-3">
      {tallas.length > 0 && (
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-gray-600">Talla</label>
          <select
            value={tallaSeleccionada}
            onChange={(e) => setTallaSeleccionada(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-accent focus:outline-none"
          >
            <option value="">Seleccionar talla</option>
            {tallas.map((talla) => (
              <option key={talla} value={talla}>
                {talla}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-gray-600">Cantidad</label>
        <input
          type="number"
          min="1"
          max="10"
          value={cantidad}
          onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value)))}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
      </div>

      <button
        onClick={handleAgregar}
        className={`w-full rounded-lg py-2.5 text-sm font-bold text-white transition-all ${
          agregado
            ? 'bg-green-500 text-green-100'
            : 'bg-accent hover:bg-orange-700'
        }`}
      >
        {agregado ? 'Agregado al carrito' : 'Agregar al carrito'}
      </button>
    </div>
  )
}
