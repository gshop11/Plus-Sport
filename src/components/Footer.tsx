'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function Footer() {
  const [metodosFooter, setMetodosFooter] = useState<string[]>(['BCP', 'Yape', 'Interbank'])

  useEffect(() => {
    const loadMetodos = async () => {
      try {
        const res = await fetch('/api/metodos-pago', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        const names = Array.isArray(data?.metodos)
          ? data.metodos
              .filter((m: any) => m?.activo && m?.mostrarEnFooter)
              .map((m: any) => String(m.nombre || '').trim())
              .filter(Boolean)
          : []

        if (names.length > 0) setMetodosFooter(names)
      } catch {
        // fallback
      }
    }

    void loadMetodos()
  }, [])

  return (
    <footer className="bg-primary text-white">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <span className="mb-1 block text-2xl font-black">
              <span className="text-accent">Plus</span>Sport
            </span>
            <p className="text-sm text-blue-200">Zapatillas para todos. Envios a todo el Peru.</p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-bold uppercase tracking-widest">Tienda</h4>
            <ul className="space-y-2 text-sm text-blue-200">
              <li><Link href="/">Inicio</Link></li>
              <li><Link href="/productos">Todos los productos</Link></li>
              <li><Link href="/categorias">Categorias</Link></li>
              <li><Link href="/ofertas">Ofertas</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-bold uppercase tracking-widest">Contacto</h4>
            <p className="text-sm text-blue-200">WhatsApp: +51 979 705 255</p>
            <p className="text-sm text-blue-200">Trujillo, Peru</p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-4 sm:flex-row">
          <div className="flex items-center gap-3 text-xs text-blue-300">
            <span className="font-semibold text-blue-200">Metodos de pago:</span>
            {metodosFooter.map((m) => (
              <span key={m} className="rounded-full bg-white/10 px-2.5 py-1">
                {m}
              </span>
            ))}
          </div>
          <span className="text-xs text-blue-300">© 2025 PlusSport. Todos los derechos reservados.</span>
        </div>
      </div>
    </footer>
  )
}
