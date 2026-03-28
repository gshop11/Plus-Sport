'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import HeaderClient from '@/components/HeaderClient'
import Footer from '@/components/Footer'

interface CarritoItem {
  id: string
  nombre: string
  precio: number
  talla: string
  cantidad: number
  imagenUrl?: string
}

type CuponAplicado = {
  codigo: string
  tipo: 'porcentaje' | 'monto' | 'envio_gratis'
  valor: number
  descuento: number
  envioFinal: number
  total: number
}

interface PagosConfig {
  yape:     { activo: boolean; nombre: string; numero: string | null; qr: string | null; instruccion: string | null }
  plin:     { activo: boolean; nombre: string; numero: string | null; qr: string | null; instruccion: string | null }
  bcp:      { activo: boolean; nombre: string; numeroCuenta: string | null; qr: string | null; instruccion: string | null }
  interbank:{ activo: boolean; nombre: string; numeroCuenta: string | null; qr: string | null; instruccion: string | null }
  tarjeta:  { activo: boolean; nombre: string; instruccion: string | null }
  efectivo: { activo: boolean; nombre: string; instruccion: string | null }
}

const PASOS = [
  { n: 1, label: 'Carrito' },
  { n: 2, label: 'Datos personales' },
  { n: 3, label: 'Datos de entrega' },
  { n: 4, label: 'Método de pago' },
]

const inputCls =
  'w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'
const labelCls = 'mb-1 block text-sm font-semibold text-gray-700'

export default function CheckoutPage() {
  const router = useRouter()
  const allowNavigationRef = useRef(false)
  const [paso, setPaso] = useState(2)
  const [items, setItems] = useState<CarritoItem[]>([])
  const [loading, setLoading] = useState(false)
  const [cuponAplicado, setCuponAplicado] = useState<CuponAplicado | null>(null)

  const [datosPersonales, setDatosPersonales] = useState({
    nombre: '',
    email: '',
    telefono: '',
    dni: '',
  })
  const [datosEnvio, setDatosEnvio] = useState({
    calle: '',
    distrito: '',
    ciudad: 'Lima',
    referencias: '',
  })
  const [comprobante, setComprobante] = useState<'boleta' | 'factura'>('boleta')
  const [metodoPago, setMetodoPago] = useState('')
  const [pagosConfig, setPagosConfig] = useState<PagosConfig | null>(null)
  const [yapeData, setYapeData] = useState({ celular: '', codigo: ['', '', '', '', '', ''] })
  const [plinData, setPlinData] = useState({ celular: '' })
  const [tarjetaData, setTarjetaData] = useState({ numero: '', nombre: '', mes: '', anio: '', cvv: '', cuotas: '1' })
  const [tarjetaDireccionIgual, setTarjetaDireccionIgual] = useState(true)

  useEffect(() => {
    const carrito = JSON.parse(localStorage.getItem('carrito') || '[]')
    if (carrito.length === 0) {
      router.push('/carrito')
      return
    }
    setItems(carrito)
  }, [router])

  useEffect(() => {
    const savedCupon = localStorage.getItem('carrito_cupon')
    if (!savedCupon || items.length === 0) {
      setCuponAplicado(null)
      return
    }

    const validarCuponCheckout = async () => {
      try {
        const parsed = JSON.parse(savedCupon) as CuponAplicado
        if (!parsed?.codigo) {
          setCuponAplicado(null)
          localStorage.removeItem('carrito_cupon')
          return
        }

        const subtotalNow = items.reduce((acc, item) => acc + item.precio * item.cantidad, 0)
        const envioBase = subtotalNow > 299 ? 0 : 15
        const res = await fetch('/api/cupones/validar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ codigo: parsed.codigo, subtotal: subtotalNow, costoEnvio: envioBase }),
        })
        const data = await res.json()
        if (!res.ok || !data?.ok) {
          setCuponAplicado(null)
          localStorage.removeItem('carrito_cupon')
          return
        }
        setCuponAplicado(data.cupon as CuponAplicado)
        localStorage.setItem('carrito_cupon', JSON.stringify(data.cupon))
      } catch {
        setCuponAplicado(null)
        localStorage.removeItem('carrito_cupon')
      }
    }

    void validarCuponCheckout()
  }, [items])

  useEffect(() => {
    fetch('/api/metodos-pago')
      .then((r) => r.json())
      .then((data: PagosConfig) => {
        setPagosConfig(data)
        // Seleccionar automáticamente el primer método activo
        const primero = (['yape', 'plin', 'bcp', 'interbank', 'tarjeta', 'efectivo'] as const)
          .find((m) => data[m]?.activo)
        if (primero) setMetodoPago(primero)
      })
      .catch(() => {})
  }, [])

  const subtotal = items.reduce((acc, item) => acc + item.precio * item.cantidad, 0)
  const costoEnvio = subtotal > 299 ? 0 : 15
  const descuento = cuponAplicado?.descuento || 0
  const costoEnvioFinal = cuponAplicado ? cuponAplicado.envioFinal : costoEnvio
  const total = Math.max(0, subtotal - descuento) + costoEnvioFinal

  const hasCheckoutProgress =
    paso > 2 ||
    Boolean(datosPersonales.nombre.trim()) ||
    Boolean(datosPersonales.email.trim()) ||
    Boolean(datosPersonales.telefono.trim()) ||
    Boolean(datosPersonales.dni.trim()) ||
    Boolean(datosEnvio.calle.trim()) ||
    Boolean(datosEnvio.distrito.trim()) ||
    Boolean(datosEnvio.referencias.trim())

  useEffect(() => {
    const warningMessage = 'Si sales del checkout, perderas el avance. ¿Deseas salir?'

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasCheckoutProgress || allowNavigationRef.current) return
      event.preventDefault()
      event.returnValue = warningMessage
    }

    const handleDocumentClick = (event: MouseEvent) => {
      if (!hasCheckoutProgress || allowNavigationRef.current) return

      const target = event.target as HTMLElement | null
      const anchor = target?.closest('a[href]') as HTMLAnchorElement | null
      if (!anchor) return
      if (anchor.target === '_blank' || anchor.hasAttribute('download')) return

      const href = anchor.getAttribute('href') || ''
      if (!href || href.startsWith('#') || href.startsWith('javascript:')) return
      if (href.startsWith('/checkout')) return

      const shouldLeave = window.confirm(warningMessage)
      if (!shouldLeave) {
        event.preventDefault()
        event.stopPropagation()
      } else {
        allowNavigationRef.current = true
      }
    }

    const handlePopState = () => {
      if (!hasCheckoutProgress || allowNavigationRef.current) return
      const shouldLeave = window.confirm(warningMessage)
      if (!shouldLeave) {
        window.history.pushState(null, '', window.location.href)
      } else {
        allowNavigationRef.current = true
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('click', handleDocumentClick, true)
    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('click', handleDocumentClick, true)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [hasCheckoutProgress])

  const handleConfirmar = async () => {
    setLoading(true)
    try {
      const clienteRes = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: datosPersonales.nombre,
          email: datosPersonales.email,
          telefono: datosPersonales.telefono,
          documento: datosPersonales.dni,
          direccion: datosEnvio,
        }),
      })
      if (!clienteRes.ok) {
        const e = await clienteRes.json().catch(() => ({}))
        throw new Error('Error cliente: ' + (e.details || e.error || clienteRes.status))
      }
      const cliente = await clienteRes.json()

      const ordenRes = await fetch('/api/checkout/ordenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente: cliente.doc.id,
          nombreCliente: datosPersonales.nombre,
          telefono: datosPersonales.telefono,
          items: items.map((item) => ({
            nombreProducto: item.nombre,
            talla: item.talla,
            cantidad: item.cantidad,
            precioUnitario: item.precio,
          })),
          subtotal,
          descuento,
          costoEnvio: costoEnvioFinal,
          total,
          direccionEnvio: datosEnvio,
          metodoPago,
          comprobante,
          estado: 'pendiente',
        }),
      })
      if (!ordenRes.ok) {
        const e = await ordenRes.json().catch(() => ({}))
        throw new Error('Error orden: ' + (e.details || e.error || ordenRes.status))
      }
      const orden = await ordenRes.json()

      localStorage.setItem('carrito', '[]')
      localStorage.removeItem('carrito_cupon')
      window.dispatchEvent(new Event('carrito:update'))

      const resumen = items.map((i) => `${i.nombre} T:${i.talla} x${i.cantidad}`).join(', ')
      allowNavigationRef.current = true
      router.push(
        `/confirmacion?ordenId=${orden.doc.id}&numeroPedido=${orden.doc.numeroPedido}&nombre=${encodeURIComponent(datosPersonales.nombre)}&telefono=${encodeURIComponent(datosPersonales.telefono)}&total=${total}&metodo=${metodoPago}&resumen=${encodeURIComponent(resumen)}`,
      )
    } catch (error) {
      alert('Error: ' + (error as Error).message)
      setLoading(false)
    }
  }

  const handleYapeCodigo = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1)
    setYapeData((prev) => {
      const nuevoCodigo = [...prev.codigo]
      nuevoCodigo[index] = digit
      return { ...prev, codigo: nuevoCodigo }
    })
    if (digit && index < 5) {
      const next = document.getElementById(`yape-digit-${index + 1}`)
      if (next) (next as HTMLInputElement).focus()
    }
  }

  return (
    <>
      <HeaderClient brand={{ name: 'PlusSport', tagline: 'Performance Athletic Wear', logoUrl: null, logoAlt: 'PlusSport' }} />
      <main className="min-h-screen bg-gray-50 py-8">
        <div className="mx-auto max-w-6xl px-4">

          {/* Stepper */}
          <div className="mb-8 flex items-center justify-center">
            {PASOS.map((p, i) => (
              <div key={p.n} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-black transition-colors ${
                      p.n < paso
                        ? 'bg-green-500 text-white'
                        : p.n === paso
                          ? 'bg-primary text-white shadow-lg shadow-primary/30'
                          : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {p.n < paso ? '✓' : p.n}
                  </div>
                  <span
                    className={`mt-1 hidden text-xs font-semibold sm:block ${
                      p.n === paso ? 'text-primary' : p.n < paso ? 'text-green-600' : 'text-gray-400'
                    }`}
                  >
                    {p.label}
                  </span>
                </div>
                {i < PASOS.length - 1 && (
                  <div className={`mx-2 h-0.5 w-12 sm:w-20 ${p.n < paso ? 'bg-green-400' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Contenido principal */}
            <div className="space-y-4 lg:col-span-2">

              {/* Paso 2: Datos personales */}
              <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${paso > 2 ? 'bg-green-500 text-white' : 'bg-primary text-white'}`}>
                      {paso > 2 ? '✓' : '1'}
                    </span>
                    <h2 className="font-bold text-gray-900">Datos Personales</h2>
                  </div>
                  {paso > 2 && (
                    <button onClick={() => setPaso(2)} className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                      ✏️ Editar
                    </button>
                  )}
                </div>

                {paso === 2 ? (
                  <div className="p-6">
                    <div className="space-y-4">
                      <div>
                        <label className={labelCls}>Nombre completo *</label>
                        <input className={inputCls} type="text" value={datosPersonales.nombre}
                          onChange={(e) => setDatosPersonales((p) => ({ ...p, nombre: e.target.value }))} required />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className={labelCls}>Correo electrónico *</label>
                          <input className={inputCls} type="email" value={datosPersonales.email}
                            onChange={(e) => setDatosPersonales((p) => ({ ...p, email: e.target.value }))} required />
                        </div>
                        <div>
                          <label className={labelCls}>WhatsApp *</label>
                          <input className={inputCls} type="tel" placeholder="9XXXXXXXXX" value={datosPersonales.telefono}
                            onChange={(e) => setDatosPersonales((p) => ({ ...p, telefono: e.target.value }))} required />
                        </div>
                      </div>
                      <div>
                        <label className={labelCls}>DNI</label>
                        <input className={inputCls} type="text" maxLength={8} value={datosPersonales.dni}
                          onChange={(e) => setDatosPersonales((p) => ({ ...p, dni: e.target.value }))} />
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (!datosPersonales.nombre || !datosPersonales.email || !datosPersonales.telefono) {
                          alert('Completa nombre, email y teléfono')
                          return
                        }
                        setPaso(3)
                      }}
                      className="mt-6 w-full rounded-lg bg-primary py-3 font-bold text-white transition-colors hover:bg-primary-dark"
                    >
                      Continuar →
                    </button>
                  </div>
                ) : paso > 2 ? (
                  <div className="px-6 py-4 text-sm text-gray-600">
                    <p><span className="font-semibold">Nombre:</span> {datosPersonales.nombre}</p>
                    <p><span className="font-semibold">Correo:</span> {datosPersonales.email}</p>
                    <p><span className="font-semibold">Teléfono:</span> {datosPersonales.telefono}</p>
                    {datosPersonales.dni && <p><span className="font-semibold">DNI:</span> {datosPersonales.dni}</p>}
                  </div>
                ) : null}
              </div>

              {/* Paso 3: Datos de entrega */}
              <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${paso > 3 ? 'bg-green-500 text-white' : paso === 3 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'}`}>
                      {paso > 3 ? '✓' : '2'}
                    </span>
                    <h2 className={`font-bold ${paso >= 3 ? 'text-gray-900' : 'text-gray-400'}`}>Datos de entrega</h2>
                  </div>
                  {paso > 3 && (
                    <button onClick={() => setPaso(3)} className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                      ✏️ Editar
                    </button>
                  )}
                </div>

                {paso === 3 ? (
                  <div className="p-6">
                    <div className="space-y-4">
                      <div>
                        <label className={labelCls}>Calle y número *</label>
                        <input className={inputCls} type="text" value={datosEnvio.calle}
                          onChange={(e) => setDatosEnvio((p) => ({ ...p, calle: e.target.value }))} required />
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className={labelCls}>Distrito *</label>
                          <input className={inputCls} type="text" value={datosEnvio.distrito}
                            onChange={(e) => setDatosEnvio((p) => ({ ...p, distrito: e.target.value }))} required />
                        </div>
                        <div>
                          <label className={labelCls}>Ciudad</label>
                          <input className={inputCls} type="text" value={datosEnvio.ciudad}
                            onChange={(e) => setDatosEnvio((p) => ({ ...p, ciudad: e.target.value }))} />
                        </div>
                      </div>
                      <div>
                        <label className={labelCls}>Referencias</label>
                        <textarea className={inputCls} rows={2} placeholder="Ej: Cerca del parque, puerta azul..."
                          value={datosEnvio.referencias}
                          onChange={(e) => setDatosEnvio((p) => ({ ...p, referencias: e.target.value }))} />
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (!datosEnvio.calle || !datosEnvio.distrito) {
                          alert('Completa calle y distrito')
                          return
                        }
                        setPaso(4)
                      }}
                      className="mt-6 w-full rounded-lg bg-primary py-3 font-bold text-white transition-colors hover:bg-primary-dark"
                    >
                      Continuar →
                    </button>
                  </div>
                ) : paso > 3 ? (
                  <div className="px-6 py-4 text-sm text-gray-600">
                    <p>{datosEnvio.calle}</p>
                    <p>{datosEnvio.distrito}, {datosEnvio.ciudad}</p>
                    {datosEnvio.referencias && <p className="text-gray-400">{datosEnvio.referencias}</p>}
                  </div>
                ) : null}
              </div>

              {/* Paso 4: Método de pago */}
              <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
                <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${paso === 4 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'}`}>
                    3
                  </span>
                  <h2 className={`font-bold ${paso === 4 ? 'text-gray-900' : 'text-gray-400'}`}>Método de pago</h2>
                </div>

                {paso === 4 && (
                  <div className="p-6">

                    {/* Boleta / Factura */}
                    <div className="mb-5 flex items-center gap-4">
                      <span className="text-sm font-semibold text-gray-600">Comprobante:</span>
                      <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-gray-700">
                        <input type="radio" name="comprobante" value="boleta" checked={comprobante === 'boleta'}
                          onChange={() => setComprobante('boleta')} className="accent-primary" />
                        Boleta
                      </label>
                      <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-gray-700">
                        <input type="radio" name="comprobante" value="factura" checked={comprobante === 'factura'}
                          onChange={() => setComprobante('factura')} className="accent-primary" />
                        Factura
                      </label>
                    </div>

                    {/* Cargando config */}
                    {!pagosConfig && (
                      <div className="py-8 text-center text-sm text-gray-400">Cargando métodos de pago...</div>
                    )}

                    {pagosConfig && (
                      <>
                        {/* Opciones de pago — solo las activas */}
                        <div className="grid gap-3 sm:grid-cols-2">

                          {pagosConfig.tarjeta.activo && (
                            <label className={`flex cursor-pointer items-center justify-between rounded-lg border-2 px-4 py-3 transition-colors ${metodoPago === 'tarjeta' ? 'border-primary bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                              <span className="flex items-center gap-3">
                                <input type="radio" name="metodoPago" value="tarjeta" checked={metodoPago === 'tarjeta'}
                                  onChange={() => setMetodoPago('tarjeta')} className="accent-primary" />
                                <span className="text-sm font-semibold text-gray-700">{pagosConfig.tarjeta.nombre || 'Visa / Mastercard'}</span>
                              </span>
                              <span className="flex items-center gap-1">
                                <span className="rounded bg-[#1a1f71] px-1.5 py-0.5 text-[9px] font-black text-white">VISA</span>
                                <span className="text-lg font-black text-red-500">◉</span>
                              </span>
                            </label>
                          )}

                          {pagosConfig.yape.activo && (
                            <label className={`flex cursor-pointer items-center justify-between rounded-lg border-2 px-4 py-3 transition-colors ${metodoPago === 'yape' ? 'border-[#6b21a8] bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}>
                              <span className="flex items-center gap-3">
                                <input type="radio" name="metodoPago" value="yape" checked={metodoPago === 'yape'}
                                  onChange={() => setMetodoPago('yape')} className="accent-[#6b21a8]" />
                                <span className="text-sm font-semibold text-gray-700">{pagosConfig.yape.nombre || 'Yape'}</span>
                              </span>
                              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#6b21a8] text-xs font-black text-white">Y</span>
                            </label>
                          )}

                          {pagosConfig.plin.activo && (
                            <label className={`flex cursor-pointer items-center justify-between rounded-lg border-2 px-4 py-3 transition-colors ${metodoPago === 'plin' ? 'border-[#00b4d8] bg-cyan-50' : 'border-gray-200 hover:border-gray-300'}`}>
                              <span className="flex items-center gap-3">
                                <input type="radio" name="metodoPago" value="plin" checked={metodoPago === 'plin'}
                                  onChange={() => setMetodoPago('plin')} className="accent-[#00b4d8]" />
                                <span className="text-sm font-semibold text-gray-700">{pagosConfig.plin.nombre || 'Plin'}</span>
                              </span>
                              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#00b4d8] text-xs font-black text-white">P</span>
                            </label>
                          )}

                          {pagosConfig.bcp.activo && (
                            <label className={`flex cursor-pointer items-center justify-between rounded-lg border-2 px-4 py-3 transition-colors ${metodoPago === 'bcp' ? 'border-[#003087] bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                              <span className="flex items-center gap-3">
                                <input type="radio" name="metodoPago" value="bcp" checked={metodoPago === 'bcp'}
                                  onChange={() => setMetodoPago('bcp')} className="accent-[#003087]" />
                                <span className="text-sm font-semibold text-gray-700">{pagosConfig.bcp.nombre || 'Transferencia BCP'}</span>
                              </span>
                              <span className="rounded bg-[#003087] px-2 py-0.5 text-[10px] font-black text-white">BCP</span>
                            </label>
                          )}

                          {pagosConfig.interbank.activo && (
                            <label className={`flex cursor-pointer items-center justify-between rounded-lg border-2 px-4 py-3 transition-colors ${metodoPago === 'interbank' ? 'border-[#00843d] bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                              <span className="flex items-center gap-3">
                                <input type="radio" name="metodoPago" value="interbank" checked={metodoPago === 'interbank'}
                                  onChange={() => setMetodoPago('interbank')} className="accent-[#00843d]" />
                                <span className="text-sm font-semibold text-gray-700">{pagosConfig.interbank.nombre || 'Transferencia Interbank'}</span>
                              </span>
                              <span className="rounded bg-[#00843d] px-2 py-0.5 text-[10px] font-black text-white">IBK</span>
                            </label>
                          )}

                          {pagosConfig.efectivo.activo && (
                            <label className={`flex cursor-pointer items-center justify-between rounded-lg border-2 px-4 py-3 transition-colors ${metodoPago === 'efectivo' ? 'border-gray-700 bg-gray-50' : 'border-gray-200 hover:border-gray-300'}`}>
                              <span className="flex items-center gap-3">
                                <input type="radio" name="metodoPago" value="efectivo" checked={metodoPago === 'efectivo'}
                                  onChange={() => setMetodoPago('efectivo')} className="accent-gray-700" />
                                <span className="text-sm font-semibold text-gray-700">{pagosConfig.efectivo.nombre || 'Pago en Efectivo'}</span>
                              </span>
                              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-700 text-xs font-black text-white">$</span>
                            </label>
                          )}

                        </div>

                        {/* — Detalle Tarjeta — */}
                        {metodoPago === 'tarjeta' && (
                          <div className="mt-4 space-y-4 rounded-xl border border-gray-200 bg-white p-5">
                            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700">
                              <span className="rounded bg-[#1a1f71] px-1.5 py-0.5 text-[9px] font-black text-white">VISA</span>
                              <span className="rounded bg-[#eb001b] px-1.5 py-0.5 text-[9px] font-black text-white">MC</span>
                              Acepta tarjetas Visa y Mastercard
                            </div>
                            <div>
                              <label className="mb-1 block text-sm font-semibold text-gray-700">Número de Tarjeta</label>
                              <input type="text" inputMode="numeric" maxLength={19} placeholder="0000 0000 0000 0000"
                                value={tarjetaData.numero}
                                onChange={(e) => {
                                  const raw = e.target.value.replace(/\D/g, '').slice(0, 16)
                                  const fmt = raw.match(/.{1,4}/g)?.join(' ') ?? raw
                                  setTarjetaData((p) => ({ ...p, numero: fmt }))
                                }}
                                className={inputCls} />
                            </div>
                            <div>
                              <label className="mb-1 block text-sm font-semibold text-gray-700">Nombre como figura en la tarjeta</label>
                              <input type="text" placeholder="NOMBRE APELLIDO" value={tarjetaData.nombre}
                                onChange={(e) => setTarjetaData((p) => ({ ...p, nombre: e.target.value.toUpperCase() }))}
                                className={inputCls} />
                            </div>
                            <div className="grid gap-4 sm:grid-cols-3">
                              <div>
                                <label className="mb-1 block text-sm font-semibold text-gray-700">Mes</label>
                                <select value={tarjetaData.mes} onChange={(e) => setTarjetaData((p) => ({ ...p, mes: e.target.value }))} className={inputCls}>
                                  <option value="">MM</option>
                                  {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map((m) => (
                                    <option key={m} value={m}>{m}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="mb-1 block text-sm font-semibold text-gray-700">Año</label>
                                <select value={tarjetaData.anio} onChange={(e) => setTarjetaData((p) => ({ ...p, anio: e.target.value }))} className={inputCls}>
                                  <option value="">AA</option>
                                  {Array.from({ length: 10 }, (_, i) => String(new Date().getFullYear() + i).slice(-2)).map((y) => (
                                    <option key={y} value={y}>{y}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="mb-1 block text-sm font-semibold text-gray-700">CVV</label>
                                <input type="password" maxLength={4} placeholder="•••" value={tarjetaData.cvv}
                                  onChange={(e) => setTarjetaData((p) => ({ ...p, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                                  className={inputCls} />
                              </div>
                            </div>
                            <div>
                              <label className="mb-1 block text-sm font-semibold text-gray-700">Cuotas disponibles</label>
                              <select value={tarjetaData.cuotas} onChange={(e) => setTarjetaData((p) => ({ ...p, cuotas: e.target.value }))} className={inputCls}>
                                <option value="1">1 cuota (sin intereses)</option>
                                <option value="3">3 cuotas</option>
                                <option value="6">6 cuotas</option>
                                <option value="12">12 cuotas</option>
                              </select>
                            </div>
                            <label className="flex items-center gap-2 text-sm text-gray-600">
                              <input
                                type="checkbox"
                                checked={tarjetaDireccionIgual}
                                onChange={(e) => setTarjetaDireccionIgual(e.target.checked)}
                                className="h-4 w-4 accent-primary"
                              />
                              La direccion de facturacion de la tarjeta es la misma que la de entrega.
                            </label>
                            {pagosConfig.tarjeta.instruccion && (
                              <p className="text-xs text-gray-500">{pagosConfig.tarjeta.instruccion}</p>
                            )}
                          </div>
                        )}



                        {/* — Detalle Yape — */}
                        {metodoPago === 'yape' && (
                          <div className="mt-4 rounded-xl border border-gray-200 bg-white p-5">
                            <div className="mb-4 rounded-xl border border-[#e8daf7] bg-[#fbf8ff] p-5">
                              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#6b21a8] text-lg font-black text-white">
                                Y
                              </div>
                              <p className="text-center text-2xl font-black text-gray-900">¡Paga con Yape</p>
                              <p className="mb-4 text-center text-2xl font-black text-gray-900">en pocos minutos!</p>
                              <ul className="space-y-3 text-sm text-gray-700">
                                <li className="flex items-start gap-3">
                                  <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#efe4fb] text-xs font-black text-[#6b21a8]">1</span>
                                  <span>Al continuar, te aparecera un formulario para completar tus datos.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                  <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#efe4fb] text-xs font-black text-[#6b21a8]">2</span>
                                  <span>Ingresa el celular asociado a Yape y pega el codigo de aprobacion desde la app.</span>
                                </li>
                                <li className="flex items-start gap-3">
                                  <span className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#efe4fb] text-xs font-black text-[#6b21a8]">3</span>
                                  <span>Confirma tu pago y listo.</span>
                                </li>
                              </ul>
                            </div>
                            {false && pagosConfig.yape.qr && (
                              <div className="mb-4 flex justify-center">
                                <img src={pagosConfig.yape.qr} alt="QR Yape" className="h-40 w-40 rounded-xl object-contain shadow" />
                              </div>
                            )}
                            {false && pagosConfig.yape.numero && (
                              <p className="mb-3 text-center text-sm font-semibold text-gray-700">
                                Número: <span className="font-black text-[#6b21a8]">{pagosConfig.yape.numero}</span>
                              </p>
                            )}
                            {false && <div className="mb-4">
                              <label className="mb-1 block text-sm font-semibold text-gray-700">Celular desde el que yapeas</label>
                              <input type="tel" placeholder="9XXXXXXXX" value={yapeData.celular}
                                onChange={(e) => setYapeData((p) => ({ ...p, celular: e.target.value.replace(/\D/g, '').slice(0, 9) }))}
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#6b21a8] focus:ring-2 focus:ring-[#6b21a8]/20" />
                            </div>}
                            {false && <div className="mb-3">
                              <label className="mb-1 block text-sm font-semibold text-gray-700">Código de aprobación</label>
                              <div className="flex gap-2">
                                {yapeData.codigo.map((d, i) => (
                                  <input key={i} id={`yape-digit-${i}`} type="text" inputMode="numeric" maxLength={1} value={d}
                                    onChange={(e) => handleYapeCodigo(i, e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Backspace' && !d && i > 0) {
                                        const prev = document.getElementById(`yape-digit-${i - 1}`)
                                        if (prev) (prev as HTMLInputElement).focus()
                                      }
                                    }}
                                    className="h-12 w-full rounded-lg border-2 border-gray-300 text-center text-lg font-black outline-none focus:border-[#6b21a8] focus:ring-2 focus:ring-[#6b21a8]/20" />
                                ))}
                              </div>
                              <p className="mt-1 text-xs text-gray-400">Encuéntralo en el menú de Yape.</p>
                            </div>}
                            <p className="text-xs text-gray-500">
                              {pagosConfig.yape.instruccion ?? 'Verifica que "Compras por internet" esté activado en tu Yape.'}
                            </p>
                          </div>
                        )}

                        {/* — Detalle Plin — */}
                        {metodoPago === 'plin' && (
                          <div className="mt-4 rounded-xl border-2 border-[#00b4d8]/20 bg-cyan-50 p-5">
                            <p className="mb-3 text-center text-base font-black text-[#00b4d8]">Paga S/ {total.toFixed(2)} con Plin</p>
                            {pagosConfig.plin.qr && (
                              <div className="mb-4 flex justify-center">
                                <img src={pagosConfig.plin.qr} alt="QR Plin" className="h-40 w-40 rounded-xl object-contain shadow" />
                              </div>
                            )}
                            {pagosConfig.plin.numero && (
                              <p className="mb-3 text-center text-sm font-semibold text-gray-700">
                                Número: <span className="font-black text-[#00b4d8]">{pagosConfig.plin.numero}</span>
                              </p>
                            )}
                            <div>
                              <label className="mb-1 block text-sm font-semibold text-gray-700">Celular desde el que pagas</label>
                              <input type="tel" placeholder="9XXXXXXXX" value={plinData.celular}
                                onChange={(e) => setPlinData({ celular: e.target.value.replace(/\D/g, '').slice(0, 9) })}
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#00b4d8] focus:ring-2 focus:ring-[#00b4d8]/20" />
                            </div>
                            <p className="mt-3 text-xs text-gray-500">
                              {pagosConfig.plin.instruccion ?? 'Disponible con BBVA, Interbank, Scotiabank y Caja Arequipa.'}
                            </p>
                          </div>
                        )}

                        {/* — Detalle BCP — */}
                        {metodoPago === 'bcp' && (
                          <div className="mt-4 rounded-xl border-2 border-[#003087]/20 bg-blue-50 p-5 text-sm text-gray-700">
                            <p className="mb-3 font-black text-[#003087]">Datos para transferencia BCP</p>
                            {pagosConfig.bcp.qr && (
                              <div className="mb-3 flex justify-center">
                                <img src={pagosConfig.bcp.qr} alt="QR BCP" className="h-40 w-40 rounded-xl object-contain shadow" />
                              </div>
                            )}
                            {pagosConfig.bcp.numeroCuenta
                              ? <p>N° de cuenta: <strong>{pagosConfig.bcp.numeroCuenta}</strong></p>
                              : <p className="text-gray-400 italic">Número de cuenta no configurado aún.</p>
                            }
                            <p className="mt-2 text-gray-500">
                              {pagosConfig.bcp.instruccion ?? 'Envía tu voucher por WhatsApp al finalizar la compra.'}
                            </p>
                          </div>
                        )}

                        {/* — Detalle Interbank — */}
                        {metodoPago === 'interbank' && (
                          <div className="mt-4 rounded-xl border-2 border-[#00843d]/20 bg-green-50 p-5 text-sm text-gray-700">
                            <p className="mb-3 font-black text-[#00843d]">Datos para transferencia Interbank</p>
                            {pagosConfig.interbank.qr && (
                              <div className="mb-3 flex justify-center">
                                <img src={pagosConfig.interbank.qr} alt="QR Interbank" className="h-40 w-40 rounded-xl object-contain shadow" />
                              </div>
                            )}
                            {pagosConfig.interbank.numeroCuenta
                              ? <p>N° de cuenta: <strong>{pagosConfig.interbank.numeroCuenta}</strong></p>
                              : <p className="text-gray-400 italic">Número de cuenta no configurado aún.</p>
                            }
                            <p className="mt-2 text-gray-500">
                              {pagosConfig.interbank.instruccion ?? 'Envía tu voucher por WhatsApp al finalizar la compra.'}
                            </p>
                          </div>
                        )}

                        {/* — Detalle Efectivo — */}
                        {metodoPago === 'efectivo' && (
                          <div className="mt-4 rounded-xl border-2 border-gray-300 bg-gray-50 p-5 text-sm text-gray-700">
                            <p className="font-semibold text-gray-800">Pago al recibir tu pedido</p>
                            <p className="mt-1 text-gray-500">
                              {pagosConfig.efectivo.instruccion ?? `Nuestro repartidor cobrará S/ ${total.toFixed(2)} al momento de la entrega.`}
                            </p>
                          </div>
                        )}

                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar resumen */}
            <div className="h-fit rounded-xl border border-gray-100 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-6 py-4">
                <h2 className="font-black uppercase tracking-wide text-gray-900">Resumen de compra</h2>
              </div>
              <div className="divide-y divide-gray-50 px-6 py-4">
                {items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 py-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-black text-white">
                      {item.cantidad}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-800">{item.nombre}</p>
                      <p className="text-xs text-gray-400">Talla: {item.talla}</p>
                    </div>
                    <span className="text-sm font-bold text-gray-700">S/ {(item.precio * item.cantidad).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 px-6 py-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>S/ {subtotal.toFixed(2)}</span>
                </div>
                {descuento > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Descuento</span>
                    <span className="font-semibold text-green-600">-S/ {descuento.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Gastos de envío</span>
                  <span className={costoEnvioFinal === 0 ? 'font-semibold text-green-600' : 'text-accent font-semibold'}>
                    {costoEnvioFinal === 0 ? 'Gratis ✓' : `S/ ${costoEnvioFinal.toFixed(2)}`}
                  </span>
                </div>
                {costoEnvioFinal > 0 && (
                  <p className="text-xs text-gray-400">Compras mayores a S/299 tienen envío gratis</p>
                )}
              </div>
              <div className="border-t-2 border-gray-100 px-6 py-4">
                <div className="flex justify-between">
                  <span className="font-black text-gray-900">Total</span>
                  <span className="text-xl font-black text-primary">S/ {total.toFixed(2)}</span>
                </div>
              </div>
              {paso === 4 && (
                <div className="px-6 pb-6">
                  <button
                    onClick={handleConfirmar}
                    disabled={loading || !metodoPago}
                    className="w-full rounded-lg bg-accent py-4 font-black text-white shadow-lg shadow-accent/30 transition-all hover:bg-accent-dark disabled:opacity-60"
                  >
                    {loading ? 'Procesando...' : 'REALIZAR COMPRA'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
