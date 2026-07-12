'use client'

import { useEffect, useState } from 'react'
import { CART_EVENT, getCartCount } from '@/lib/cart'

export default function CartCountBadge() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const update = () => setCount(getCartCount())

    update()
    window.addEventListener('storage', update)
    window.addEventListener(CART_EVENT, update)

    return () => {
      window.removeEventListener('storage', update)
      window.removeEventListener(CART_EVENT, update)
    }
  }, [])

  if (count <= 0) return null

  return (
    <span className="absolute -right-3 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-white">
      {count}
    </span>
  )
}
