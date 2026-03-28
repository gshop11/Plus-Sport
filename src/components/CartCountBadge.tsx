'use client'

import { useEffect, useState } from 'react'

const readCartCount = () => {
  if (typeof window === 'undefined') return 0
  try {
    const carrito = JSON.parse(localStorage.getItem('carrito') || '[]')
    return Array.isArray(carrito) ? carrito.length : 0
  } catch {
    return 0
  }
}

export default function CartCountBadge() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const update = () => setCount(readCartCount())

    update()
    window.addEventListener('storage', update)
    window.addEventListener('carrito:update', update)

    return () => {
      window.removeEventListener('storage', update)
      window.removeEventListener('carrito:update', update)
    }
  }, [])

  if (count <= 0) return null

  return (
    <span className="absolute -right-3 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white">
      {count}
    </span>
  )
}
