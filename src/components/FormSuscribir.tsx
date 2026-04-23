'use client'
import { useState } from 'react'

export default function FormSuscribir() {
  const [telefono, setTelefono] = useState('')
  const [estado, setEstado] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const canSubmit = telefono.length >= 7 && estado !== 'loading'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (telefono.trim().length < 7) return
    setEstado('loading')
    try {
      const res = await fetch('/api/suscribir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefono }),
      })
      setEstado(res.ok ? 'ok' : 'error')
    } catch {
      setEstado('error')
    }
  }

  if (estado === 'ok') {
    return (
      <p className="mt-4 rounded-lg border-2 border-primary bg-blue-50 px-6 py-4 text-lg font-semibold text-primary">
        ✅ ¡Listo! Te avisaremos por WhatsApp con las mejores ofertas.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row">
      <div className="flex flex-1 overflow-hidden rounded-lg border-2 border-gray-300 bg-white">
        <span className="flex items-center border-r-2 border-gray-300 bg-gray-100 px-3 text-sm font-bold text-primary">+51</span>
        <input
          type="tel"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value.replace(/\D/g, '').slice(0, 9))}
          placeholder="999 999 999"
          className="flex-1 px-4 py-4 text-base font-medium text-gray-800 outline-none"
          disabled={estado === 'loading'}
        />
      </div>
      <button
        type="submit"
        disabled={!canSubmit}
        className={`whitespace-nowrap rounded-lg px-6 py-4 font-bold transition-all ${
          canSubmit
            ? 'bg-accent text-white shadow-lg shadow-accent/30 hover:bg-accent-dark hover:shadow-xl hover:shadow-accent/40'
            : 'cursor-not-allowed bg-gray-300 text-gray-500'
        }`}
      >
        {estado === 'loading' ? 'ENVIANDO...' : 'ENVIAR'}
      </button>
      {estado === 'error' && (
        <p className="w-full text-center text-sm text-red-400">Hubo un error. Intenta de nuevo.</p>
      )}
    </form>
  )
}
