'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import HeaderClient from '@/components/HeaderClient'
import Footer from '@/components/Footer'
import { useCurrencySymbol } from '@/hooks/useCurrencySymbol'
import { formatMoney } from '@/lib/money'

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

type IzipayVisualStatus = 'success' | 'failed' | 'cancelled' | 'unknown'

type IzipaySessionResponse = {
  success: boolean
  session?: {
    scriptUrl: string
    authorization: string
    keyRSA: string
    returnUrl: string
    config: Record<string, unknown>
  }
}

const PASOS = [
  { n: 1, label: 'Carrito' },
  { n: 2, label: 'Datos personales' },
  { n: 3, label: 'Datos de entrega' },
  { n: 4, label: 'Metodo de pago' },
]

const inputCls =
  'w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'
const labelCls = 'mb-1 block text-sm font-semibold text-gray-700'

declare global {
  interface Window {
    Izipay?: new (input: { config: Record<string, unknown> }) => {
      LoadForm: (input: {
        authorization: string
        keyRSA: string
        callbackResponse?: (response: unknown) => void
      }) => void
    }
  }
}

function loadIzipayScript(scriptUrl: string) {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.Izipay) return Promise.resolve()

  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-izipay-sdk="1"]')
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('No se pudo cargar el SDK Izipay.')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = scriptUrl
    script.defer = true
    script.async = true
    script.dataset.izipaySdk = '1'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('No se pudo cargar el SDK Izipay.'))
    document.head.appendChild(script)
  })
}

function resolveVisualStatus(response: unknown): IzipayVisualStatus {
  const source =
    typeof response === 'string'
      ? response.toLowerCase()
      : JSON.stringify(response || '').toLowerCase()

  if (
    source.includes('authorised') ||
    source.includes('authorized') ||
    source.includes('captured') ||
    source.includes('"00"') ||
    source.includes('operacion exitosa') ||
    source.includes('successful')
  ) {
    return 'success'
  }

  if (source.includes('cancel') || source.includes('anulad') || source.includes('abort')) {
    return 'cancelled'
  }

  if (
    source.includes('refused') ||
    source.includes('deneg') ||
    source.includes('rechaz') ||
    source.includes('failed') ||
    source.includes('error')
  ) {
    return 'failed'
  }

  return 'unknown'
}

function getResponseTransactionId(response: any) {
  if (!response || typeof response !== 'object') return ''
  const fromOrder = response?.response?.order?.[0]?.referenceNumber
  return String(
    response?.transactionId ||
      response?.response?.transactionId ||
      fromOrder ||
      '',
  ).trim()
}

function buildReturnUrl(base: string, query: Record<string, string | undefined>) {
  const parsed = new URL(base, window.location.origin)
  Object.entries(query).forEach(([key, value]) => {
    if (!value) return
    parsed.searchParams.set(key, value)
  })
  return parsed.toString()
}

export default function CheckoutPage() {
  const router = useRouter()
  const currencySymbol = useCurrencySymbol()
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
        // Seleccionar automaticamente el primer metodo activo
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
    const warningMessage = 'Si sales del checkout perderas el avance. Deseas salir?'

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
          metodoEntrega: 'delivery',
          items: items.map((item) => ({
            productoId: item.id,
            talla: item.talla,
            cantidad: item.cantidad,
          })),
          cuponCodigo: cuponAplicado?.codigo || null,
          direccionEnvio: datosEnvio,
          metodoPago,
          comprobante,
        }),
      })
      if (!ordenRes.ok) {
        const e = await ordenRes.json().catch(() => ({}))
        throw new Error('Error orden: ' + (e.details || e.error || ordenRes.status))
      }
      const orden = await ordenRes.json()
      const order = orden.order || orden.doc
      const orderRef = order?.codigoCorrelacion || order?.numeroPedido || order?.id

      if (metodoPago === 'tarjeta') {
        const sessionRes = await fetch('/api/payments/izipay/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderRef,
            orderId: order?.id,
          }),
        })

        const sessionJson = (await sessionRes.json().catch(() => ({}))) as IzipaySessionResponse & {
          error?: string
          details?: string
        }

        if (!sessionRes.ok || !sessionJson.session) {
          throw new Error(sessionJson.details || sessionJson.error || 'No se pudo preparar checkout Izipay.')
        }

        const sdkSession = sessionJson.session
        await loadIzipayScript(sdkSession.scriptUrl)
        if (!window.Izipay) {
          throw new Error('El SDK de Izipay no esta disponible en este navegador.')
        }

        const checkout = new window.Izipay({ config: sdkSession.config })

        checkout.LoadForm({
          authorization: sdkSession.authorization,
          keyRSA: sdkSession.keyRSA,
          callbackResponse: async (response: unknown) => {
            const visualStatus = resolveVisualStatus(response)
            const responseTransactionId = getResponseTransactionId(response as any)

            try {
              await fetch('/api/payments/izipay/visual-result', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  orderRef,
                  orderId: order?.id,
                  visualStatus,
                  transactionId: responseTransactionId,
                  response,
                }),
              })
            } catch {
              // The order still exists. Final state will be corrected in webhook phase.
            }

            if (visualStatus === 'success') {
              localStorage.setItem('carrito', '[]')
              localStorage.removeItem('carrito_cupon')
              window.dispatchEvent(new Event('carrito:update'))
            }

            allowNavigationRef.current = true
            const returnUrl = buildReturnUrl(sdkSession.returnUrl || `${window.location.origin}/confirmacion`, {
              orderRef: String(orderRef || ''),
              ordenId: String(order?.id || ''),
              izipayStatus: visualStatus,
              izipayTx: responseTransactionId || undefined,
            })

            window.location.assign(returnUrl)
          },
        })
        setLoading(false)
        return
      }

      localStorage.setItem('carrito', '[]')
      localStorage.removeItem('carrito_cupon')
      window.dispatchEvent(new Event('carrito:update'))
      allowNavigationRef.current = true
      router.push(`/confirmacion?orderRef=${encodeURIComponent(orderRef)}&ordenId=${encodeURIComponent(order?.id || '')}`)
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
      <HeaderClient />
      <main className="min-h-screen bg-[var(--surface-soft)] py-10">
        <div className="mx-auto max-w-6xl px-4">

          {/* Stepper */}
          <div className="store-panel mb-6 flex items-center justify-center px-4 py-5">
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
              <div className="store-panel">
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${paso > 2 ? 'bg-green-500 text-white' : 'bg-primary text-white'}`}>
                      {paso > 2 ? '✓' : '1'}
                    </span>
                    <h2 className="font-bold text-gray-900">Datos Personales</h2>
                  </div>
                  {paso > 2 && (
                    <button onClick={() => setPaso(2)} className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                      Editar
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
                          <label className={labelCls}>Correo electronico *</label>
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
                          alert('Completa nombre, email y telefono')
                          return
                        }
                        setPaso(3)
                      }}
                      className="mt-6 w-full rounded-lg bg-primary py-3 font-bold text-white transition-colors hover:bg-primary-dark"
                    >
                      Continuar
                    </button>
                  </div>
                ) : paso > 2 ? (
                  <div className="px-6 py-4 text-sm text-gray-600">
                    <p><span className="font-semibold">Nombre:</span> {datosPersonales.nombre}</p>
                    <p><span className="font-semibold">Correo:</span> {datosPersonales.email}</p>
                    <p><span className="font-semibold">Telefono:</span> {datosPersonales.telefono}</p>
                    {datosPersonales.dni && <p><span className="font-semibold">DNI:</span> {datosPersonales.dni}</p>}
                  </div>
                ) : null}
              </div>

              {/* Paso 3: Datos de entrega */}
              <div className="store-panel">
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${paso > 3 ? 'bg-green-500 text-white' : paso === 3 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'}`}>
                      {paso > 3 ? '✓' : '2'}
                    </span>
                    <h2 className={`font-bold ${paso >= 3 ? 'text-gray-900' : 'text-gray-400'}`}>Datos de entrega</h2>
                  </div>
                  {paso > 3 && (
                    <button onClick={() => setPaso(3)} className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                      Editar
                    </button>
                  )}
                </div>

                {paso === 3 ? (
                  <div className="p-6">
                    <div className="space-y-4">
                      <div>
                        <label className={labelCls}>Calle y numero *</label>
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
                      Continuar
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

              {/* Paso 4: Metodo de pago */}
              <div className="store-panel">
                <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${paso === 4 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'}`}>
                    3
                  </span>
                  <h2 className={`font-bold ${paso === 4 ? 'text-gray-900' : 'text-gray-400'}`}>Metodo de pago</h2>
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
                      <div className="py-8 text-center text-sm text-gray-400">Cargando metodos de pago...</div>
                    )}

                    {pagosConfig && (
                      <>
                        {/* Opciones de pago - solo las activas */}
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
                                <span className="text-lg font-black text-red-500">•</span>
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

                        {/* Detalle Tarjeta */}
                        {metodoPago === 'tarjeta' && (
                          <div className="mt-4 space-y-4 rounded-xl border border-gray-200 bg-white p-5">
                            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700">
                              <span className="rounded bg-[#1a1f71] px-1.5 py-0.5 text-[9px] font-black text-white">VISA</span>
                              <span className="rounded bg-[#eb001b] px-1.5 py-0.5 text-[9px] font-black text-white">MC</span>
                              Checkout seguro Izipay Sandbox
                            </div>
                            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
                              Los datos de tarjeta no se capturan en este formulario. El cobro se procesa en la pasarela oficial de Izipay.
                            </div>
                            <ul className="space-y-2 text-sm text-gray-700">
                              <li>1. Se registra la orden local con estado de pago pendiente.</li>
                              <li>2. Se solicita el token de sesion de Izipay desde backend.</li>
                              <li>3. Se abre el checkout Izipay para completar el intento de pago.</li>
                            </ul>
                            <p className="text-xs text-gray-500">
                              {pagosConfig.tarjeta.instruccion ?? 'La confirmacion final del pago dependera del webhook backend en la siguiente fase.'}
                            </p>
                          </div>
                        )}

                        {metodoPago === 'yape' && (
                          <div className="mt-4 rounded-xl border border-gray-200 bg-white p-5">
                            <div className="mb-4 rounded-xl border border-[#e8daf7] bg-[#fbf8ff] p-5">
                              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#6b21a8] text-lg font-black text-white">
                                Y
                              </div>
                              <p className="text-center text-2xl font-black text-gray-900">Paga con Yape</p>
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
                                Numero: <span className="font-black text-[#6b21a8]">{pagosConfig.yape.numero}</span>
                              </p>
                            )}
                            {false && <div className="mb-4">
                              <label className="mb-1 block text-sm font-semibold text-gray-700">Celular desde el que yapeas</label>
                              <input type="tel" placeholder="9XXXXXXXX" value={yapeData.celular}
                                onChange={(e) => setYapeData((p) => ({ ...p, celular: e.target.value.replace(/\D/g, '').slice(0, 9) }))}
                                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#6b21a8] focus:ring-2 focus:ring-[#6b21a8]/20" />
                            </div>}
                            {false && <div className="mb-3">
                              <label className="mb-1 block text-sm font-semibold text-gray-700">Codigo de aprobacion</label>
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
                              <p className="mt-1 text-xs text-gray-400">Encuentralo en el menu de Yape.</p>
                            </div>}
                            <p className="text-xs text-gray-500">
                              {pagosConfig.yape.instruccion ?? 'Verifica que "Compras por internet" este activado en tu Yape.'}
                            </p>
                          </div>
                        )}

                        {/* Detalle Plin */}
                        {metodoPago === 'plin' && (
                          <div className="mt-4 rounded-xl border-2 border-[#00b4d8]/20 bg-cyan-50 p-5">
                            <p className="mb-3 text-center text-base font-black text-[#00b4d8]">Paga {formatMoney(total, currencySymbol)} con Plin</p>
                            {pagosConfig.plin.qr && (
                              <div className="mb-4 flex justify-center">
                                <img src={pagosConfig.plin.qr} alt="QR Plin" className="h-40 w-40 rounded-xl object-contain shadow" />
                              </div>
                            )}
                            {pagosConfig.plin.numero && (
                              <p className="mb-3 text-center text-sm font-semibold text-gray-700">
                                Numero: <span className="font-black text-[#00b4d8]">{pagosConfig.plin.numero}</span>
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

                        {/* Detalle BCP */}
                        {metodoPago === 'bcp' && (
                          <div className="mt-4 rounded-xl border-2 border-[#003087]/20 bg-blue-50 p-5 text-sm text-gray-700">
                            <p className="mb-3 font-black text-[#003087]">Datos para transferencia BCP</p>
                            {pagosConfig.bcp.qr && (
                              <div className="mb-3 flex justify-center">
                                <img src={pagosConfig.bcp.qr} alt="QR BCP" className="h-40 w-40 rounded-xl object-contain shadow" />
                              </div>
                            )}
                            {pagosConfig.bcp.numeroCuenta
                              ? <p>Nro de cuenta: <strong>{pagosConfig.bcp.numeroCuenta}</strong></p>
                              : <p className="text-gray-400 italic">Numero de cuenta no configurado aun.</p>
                            }
                            <p className="mt-2 text-gray-500">
                              {pagosConfig.bcp.instruccion ?? 'Envia tu voucher por WhatsApp al finalizar la compra.'}
                            </p>
                          </div>
                        )}

                        {/* Detalle Interbank */}
                        {metodoPago === 'interbank' && (
                          <div className="mt-4 rounded-xl border-2 border-[#00843d]/20 bg-green-50 p-5 text-sm text-gray-700">
                            <p className="mb-3 font-black text-[#00843d]">Datos para transferencia Interbank</p>
                            {pagosConfig.interbank.qr && (
                              <div className="mb-3 flex justify-center">
                                <img src={pagosConfig.interbank.qr} alt="QR Interbank" className="h-40 w-40 rounded-xl object-contain shadow" />
                              </div>
                            )}
                            {pagosConfig.interbank.numeroCuenta
                              ? <p>Nro de cuenta: <strong>{pagosConfig.interbank.numeroCuenta}</strong></p>
                              : <p className="text-gray-400 italic">Numero de cuenta no configurado aun.</p>
                            }
                            <p className="mt-2 text-gray-500">
                              {pagosConfig.interbank.instruccion ?? 'Envia tu voucher por WhatsApp al finalizar la compra.'}
                            </p>
                          </div>
                        )}

                        {/* Detalle Efectivo */}
                        {metodoPago === 'efectivo' && (
                          <div className="mt-4 rounded-xl border-2 border-gray-300 bg-gray-50 p-5 text-sm text-gray-700">
                            <p className="font-semibold text-gray-800">Pago al recibir tu pedido</p>
                            <p className="mt-1 text-gray-500">
                              {pagosConfig.efectivo.instruccion ?? `Nuestro repartidor cobrara ${formatMoney(total, currencySymbol)} al momento de la entrega.`}
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
            <div className="store-panel sticky top-24 h-fit">
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
                    <span className="text-sm font-bold text-gray-700">{formatMoney(item.precio * item.cantidad, currencySymbol)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 px-6 py-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatMoney(subtotal, currencySymbol)}</span>
                </div>
                {descuento > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Descuento</span>
                    <span className="font-semibold text-green-600">-{formatMoney(descuento, currencySymbol)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Gastos de envio</span>
                  <span className={costoEnvioFinal === 0 ? 'font-semibold text-green-600' : 'text-accent font-semibold'}>
                    {costoEnvioFinal === 0 ? 'Gratis ✓' : formatMoney(costoEnvioFinal, currencySymbol)}
                  </span>
                </div>
                {costoEnvioFinal > 0 && (
                  <p className="text-xs text-gray-400">Compras mayores a {formatMoney(299, currencySymbol)} tienen envio gratis</p>
                )}
              </div>
              <div className="border-t-2 border-gray-100 px-6 py-4">
                <div className="flex justify-between">
                  <span className="font-black text-gray-900">Total</span>
                  <span className="text-xl font-black text-primary">{formatMoney(total, currencySymbol)}</span>
                </div>
              </div>
              {paso === 4 && (
                <div className="px-6 pb-6">
                  <button
                    onClick={handleConfirmar}
                    disabled={loading || !metodoPago}
                    className="w-full rounded-lg bg-accent py-4 font-black text-white shadow-lg shadow-accent/30 transition-all hover:bg-accent-dark disabled:opacity-60"
                  >
                    {loading ? 'Procesando...' : metodoPago === 'tarjeta' ? 'PAGAR CON IZIPAY' : 'REALIZAR COMPRA'}
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
