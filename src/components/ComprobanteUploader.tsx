'use client'

import { useRef, useState } from 'react'

// Carga de comprobante de pago manual desde la pagina de confirmacion.
// El servidor valida MIME real, tamano y estado de la orden.
export default function ComprobanteUploader({ orderRef }: { orderRef: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [estado, setEstado] = useState<'idle' | 'subiendo' | 'ok' | 'error'>('idle')
  const [mensaje, setMensaje] = useState('')
  const [nota, setNota] = useState('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const file = inputRef.current?.files?.[0]
    if (!file) {
      setEstado('error')
      setMensaje('Selecciona el archivo del comprobante (JPG, PNG, WEBP o PDF, max 5 MB).')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setEstado('error')
      setMensaje('El archivo supera los 5 MB.')
      return
    }

    setEstado('subiendo')
    setMensaje('')

    try {
      const form = new FormData()
      form.set('file', file)
      if (nota.trim()) form.set('nota', nota.trim())

      const res = await fetch(`/api/checkout/ordenes/${encodeURIComponent(orderRef)}/comprobante`, {
        method: 'POST',
        body: form,
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setEstado('error')
        setMensaje(data?.error || 'No se pudo subir el comprobante.')
        return
      }

      setEstado('ok')
      setMensaje(data?.mensaje || 'Comprobante recibido. Validaremos tu pago pronto.')
    } catch {
      setEstado('error')
      setMensaje('Error de conexion al subir el comprobante.')
    }
  }

  if (estado === 'ok') {
    return (
      <div role="status" className="rounded-lg border border-primary/25 bg-[var(--surface-soft)] px-4 py-3 text-sm font-semibold text-primary-dark">
        {mensaje}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor="comprobante-file" className="mb-1 block text-sm font-semibold text-primary-dark">
          Comprobante de pago (JPG, PNG, WEBP o PDF, max 5 MB)
        </label>
        <input
          id="comprobante-file"
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="w-full rounded-lg border border-[var(--line-soft)] bg-white px-4 py-3 text-sm text-gray-800 outline-none file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white"
        />
      </div>
      <div>
        <label htmlFor="comprobante-nota" className="mb-1 block text-sm font-semibold text-primary-dark">
          Nota (opcional)
        </label>
        <input
          id="comprobante-nota"
          type="text"
          maxLength={300}
          value={nota}
          onChange={(e) => setNota(e.target.value)}
          placeholder="Ej: pague desde otra cuenta a nombre de..."
          className="w-full rounded-lg border border-[var(--line-soft)] bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-primary"
        />
      </div>
      {estado === 'error' && mensaje ? (
        <p role="alert" className="text-sm font-semibold text-accent-dark">{mensaje}</p>
      ) : null}
      <button
        type="submit"
        disabled={estado === 'subiendo'}
        className="store-button-primary w-full disabled:cursor-not-allowed disabled:opacity-60"
      >
        {estado === 'subiendo' ? 'Subiendo...' : 'Enviar comprobante'}
      </button>
    </form>
  )
}
