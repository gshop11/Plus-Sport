'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import HeaderClient from '@/components/HeaderClient'
import Footer from '@/components/Footer'
import { useCurrencySymbol } from '@/hooks/useCurrencySymbol'
import { clearCart, getCart, type CartItem } from '@/lib/cart'
import { formatMoney } from '@/lib/money'
import { normalizeWhatsappNumber } from '@/lib/availability-inquiry'
import { getDistrictsByCity, isDistrictValidForCity, PERU_CITY_OPTIONS } from '@/lib/peru-locations'

// Checkout por pasos. TODA la verdad comercial (precios, stock, envio,
// cupones, total) viene de POST /api/checkout/validar y el pedido se crea de
// forma idempotente en POST /api/checkout/ordenes. El navegador solo envia
// referencias y datos del cliente.

type MetodoPagoPublico = {
  codigo: 'yape' | 'plin' | 'interbank' | 'transferencia' | 'tarjeta' | 'efectivo' | 'whatsapp'
  nombre: string
  instruccion: string | null
  numero?: string
  titular?: string
  qrUrl?: string | null
  banco?: string
  numeroCuenta?: string
  cci?: string
  monedaCuenta?: string
}

type ItemResumen = {
  productoId: number
  nombre: string
  talla: string | null
  cantidad: number
  precioUnitario: number
  subtotal: number
  estado: 'ok' | 'ajustado_stock' | 'sin_stock' | 'no_disponible'
  motivo?: string
}

type Resumen = {
  items: ItemResumen[]
  subtotal: number
  cupon: { codigo: string } | null
  cuponError: string | null
  descuento: number
  envio: { tipo: 'pendiente' | 'tarifa' | 'coordinar' | 'retiro'; costo: number | null; etiqueta: string }
  costoEnvio: number | null
  total: number | null
}

type PuntoRecojo = {
  nombre: string
  direccion: string
  horario: string | null
  instrucciones: string | null
}

type IzipaySessionResponse = {
  success: boolean
  session?: {
    formToken: string
    publicKey: string
    krPaymentFormJsUrl: string
    krClassicCssUrl: string
    krClassicJsUrl: string
    returnUrl: string
  }
}

const PASOS = [
  { n: 1, label: 'Carrito' },
  { n: 2, label: 'Datos personales' },
  { n: 3, label: 'Entrega' },
  { n: 4, label: 'Pago' },
]

const inputCls =
  'w-full rounded-lg border border-[var(--line-soft)] bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'
const labelCls = 'mb-1 block text-sm font-semibold text-primary-dark'

const CUPON_KEY = 'carrito_cupon_codigo'
const IDEMPOTENCY_KEY = 'checkout_idempotency_key'

declare global {
  interface Window {
    KR?: {
      onSubmit: (callback: (event: any) => boolean | void) => void
    }
  }
}

const IZIPAY_KR_FORM_SELECTOR = '#izipay-kr-form'

function loadKryptonAssets({ jsUrl, cssUrl, publicKey }: { jsUrl: string; cssUrl: string; publicKey: string }) {
  if (typeof window === 'undefined') return Promise.resolve()

  if (!document.querySelector('link[data-izipay-kr-css="1"]')) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = cssUrl
    link.dataset.izipayKrCss = '1'
    document.head.appendChild(link)
  }

  if (window.KR) return Promise.resolve()

  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-izipay-kr-sdk="1"]')
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('No se pudo cargar el SDK Krypton de Izipay.')), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = jsUrl
    script.setAttribute('kr-public-key', publicKey)
    script.setAttribute('kr-language', 'es-PE')
    script.defer = true
    script.dataset.izipayKrSdk = '1'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('No se pudo cargar el SDK Krypton de Izipay.'))
    document.head.appendChild(script)
  })
}

function setKryptonFormToken(formToken: string) {
  if (typeof document === 'undefined') return
  document.querySelector(IZIPAY_KR_FORM_SELECTOR)?.setAttribute('kr-form-token', formToken)
}

function resolveVisualStatus(orderStatus: unknown): 'success' | 'failed' | 'cancelled' | 'unknown' {
  const value = typeof orderStatus === 'string' ? orderStatus.toUpperCase().trim() : ''
  if (value === 'PAID') return 'success'
  if (value === 'UNPAID') return 'failed'
  if (value === 'CANCELLED' || value === 'CANCELED') return 'cancelled'
  return 'unknown'
}

function getOrCreateIdempotencyKey() {
  try {
    const existing = sessionStorage.getItem(IDEMPOTENCY_KEY)
    if (existing) return existing
    const key = crypto.randomUUID().replace(/-/g, '')
    sessionStorage.setItem(IDEMPOTENCY_KEY, key)
    return key
  } catch {
    return crypto.randomUUID().replace(/-/g, '')
  }
}

function clearIdempotencyKey() {
  try {
    sessionStorage.removeItem(IDEMPOTENCY_KEY)
  } catch {
    // ignore
  }
}

export default function CheckoutPage() {
  const router = useRouter()
  const currencySymbol = useCurrencySymbol()
  const allowNavigationRef = useRef(false)
  const [paso, setPaso] = useState(2)
  const [items, setItems] = useState<CartItem[]>([])
  const [resumen, setResumen] = useState<Resumen | null>(null)
  const [puntosRecojo, setPuntosRecojo] = useState<PuntoRecojo[]>([])
  const [loading, setLoading] = useState(false)
  const [errorGeneral, setErrorGeneral] = useState('')
  const [mostrarWhatsappEnvio, setMostrarWhatsappEnvio] = useState(false)
  const [whatsappNumero, setWhatsappNumero] = useState('')
  const validacionSeq = useRef(0)

  const [datosPersonales, setDatosPersonales] = useState({
    nombres: '',
    apellidos: '',
    tipoDocumento: 'dni',
    numeroDocumento: '',
    email: '',
    celular: '',
  })
  const [metodoEntrega, setMetodoEntrega] = useState<'delivery' | 'retiro_tienda'>('delivery')
  const [datosEnvio, setDatosEnvio] = useState({
    departamento: 'La Libertad',
    calle: '',
    distrito: '',
    ciudad: 'Trujillo',
    referencias: '',
  })
  const [comprobante, setComprobante] = useState<'boleta' | 'factura'>('boleta')
  const [metodoPago, setMetodoPago] = useState('')
  const [metodos, setMetodos] = useState<MetodoPagoPublico[] | null>(null)
  const [aceptaTerminos, setAceptaTerminos] = useState(false)
  const [aceptaPrivacidad, setAceptaPrivacidad] = useState(false)
  const [erroresCampos, setErroresCampos] = useState<string[]>([])
  // null = aun cargando; false = compra desactivada; true = habilitada.
  const [ecommerceEnabled, setEcommerceEnabled] = useState<boolean | null>(null)

  const validarEnServidor = useCallback(
    async (opts?: { distrito?: string; entrega?: 'delivery' | 'retiro_tienda' }) => {
      const cart = getCart()
      if (cart.length === 0) return
      const seq = ++validacionSeq.current

      try {
        const res = await fetch('/api/checkout/validar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: cart.map((item) => ({ productoId: item.productoId, talla: item.talla, cantidad: item.cantidad })),
            cuponCodigo: localStorage.getItem(CUPON_KEY),
            metodoEntrega: opts?.entrega ?? metodoEntrega,
            distrito: opts?.distrito ?? datosEnvio.distrito ?? null,
          }),
        })
        const data = await res.json()
        if (seq !== validacionSeq.current) return
        if (res.ok && data?.ok) {
          setResumen(data.resumen as Resumen)
          setPuntosRecojo(Array.isArray(data.puntosRecojo) ? data.puntosRecojo : [])
        }
      } catch {
        // se conserva el ultimo resumen valido
      }
    },
    [metodoEntrega, datosEnvio.distrito],
  )

  useEffect(() => {
    const cart = getCart()
    if (cart.length === 0) {
      router.push('/carrito')
      return
    }
    setItems(cart)
    void validarEnServidor()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  useEffect(() => {
    fetch('/api/metodos-pago')
      .then((r) => r.json())
      .then((data: { metodos?: MetodoPagoPublico[] }) => {
        const lista = Array.isArray(data?.metodos) ? data.metodos.filter((m) => m.codigo !== 'whatsapp') : []
        setMetodos(lista)
        if (lista.length > 0) setMetodoPago(lista[0].codigo)
      })
      .catch(() => setMetodos([]))

    fetch('/api/storefront-config', { cache: 'no-store' })
      .then((r) => r.json())
      .then((cfg) => {
        setWhatsappNumero(String(cfg?.whatsapp?.numero || ''))
        setEcommerceEnabled(cfg?.ecommerceEnabled === true)
      })
      .catch(() => setEcommerceEnabled(false))
  }, [])

  const distritosDisponibles = getDistrictsByCity(datosEnvio.ciudad)
  const ciudadConDistritos = distritosDisponibles.length > 0

  useEffect(() => {
    if (!datosEnvio.distrito || !ciudadConDistritos) return
    if (!isDistrictValidForCity(datosEnvio.ciudad, datosEnvio.distrito)) {
      setDatosEnvio((prev) => ({ ...prev, distrito: '' }))
    }
  }, [ciudadConDistritos, datosEnvio.ciudad, datosEnvio.distrito])

  const hasCheckoutProgress =
    paso > 2 ||
    Boolean(datosPersonales.nombres.trim()) ||
    Boolean(datosPersonales.email.trim()) ||
    Boolean(datosEnvio.calle.trim())

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

  const validarDatosPersonales = () => {
    const errores: string[] = []
    if (datosPersonales.nombres.trim().length < 2) errores.push('Ingresa tus nombres.')
    if (datosPersonales.apellidos.trim().length < 2) errores.push('Ingresa tus apellidos.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(datosPersonales.email.trim())) errores.push('Correo electronico invalido.')
    if (!/^9\d{8}$/.test(datosPersonales.celular.trim())) errores.push('Celular invalido (9 digitos, empieza en 9).')
    if (datosPersonales.tipoDocumento === 'dni' && !/^\d{8}$/.test(datosPersonales.numeroDocumento.trim()))
      errores.push('DNI invalido (8 digitos).')
    if (datosPersonales.tipoDocumento === 'ruc' && !/^\d{11}$/.test(datosPersonales.numeroDocumento.trim()))
      errores.push('RUC invalido (11 digitos).')
    if (
      (datosPersonales.tipoDocumento === 'ce' || datosPersonales.tipoDocumento === 'pasaporte') &&
      !/^[A-Za-z0-9]{6,15}$/.test(datosPersonales.numeroDocumento.trim())
    )
      errores.push('Numero de documento invalido.')
    setErroresCampos(errores)
    return errores.length === 0
  }

  const validarDatosEnvio = () => {
    if (metodoEntrega === 'retiro_tienda') {
      if (puntosRecojo.length === 0) {
        setErroresCampos(['El recojo en tienda no esta disponible por ahora.'])
        return false
      }
      setErroresCampos([])
      return true
    }

    const errores: string[] = []
    if (!datosEnvio.departamento.trim()) errores.push('Ingresa el departamento.')
    if (!datosEnvio.ciudad.trim()) errores.push('Ingresa la provincia o ciudad.')
    if (!datosEnvio.distrito.trim()) errores.push('Ingresa el distrito.')
    if (datosEnvio.calle.trim().length < 5) errores.push('Ingresa la direccion completa.')
    if (ciudadConDistritos && datosEnvio.distrito && !isDistrictValidForCity(datosEnvio.ciudad, datosEnvio.distrito)) {
      errores.push(`Selecciona un distrito valido para ${datosEnvio.ciudad}.`)
    }
    setErroresCampos(errores)
    return errores.length === 0
  }

  const envioListo =
    metodoEntrega === 'retiro_tienda'
      ? resumen?.envio.tipo === 'retiro'
      : resumen?.envio.tipo === 'tarifa'

  const handleConfirmar = async () => {
    setErrorGeneral('')
    if (!aceptaTerminos) {
      setErrorGeneral('Debes aceptar los terminos y condiciones para continuar.')
      return
    }
    if (!metodoPago) {
      setErrorGeneral('Selecciona un metodo de pago.')
      return
    }
    if (!validarDatosEnvio()) return

    setLoading(true)
    try {
      const cart = getCart()
      const idempotencyKey = getOrCreateIdempotencyKey()

      const ordenRes = await fetch('/api/checkout/ordenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idempotencyKey,
          datosPersonales: {
            nombres: datosPersonales.nombres.trim(),
            apellidos: datosPersonales.apellidos.trim(),
            tipoDocumento: datosPersonales.tipoDocumento,
            numeroDocumento: datosPersonales.numeroDocumento.trim(),
            email: datosPersonales.email.trim(),
            celular: datosPersonales.celular.trim(),
          },
          metodoEntrega,
          direccionEnvio:
            metodoEntrega === 'delivery'
              ? {
                  departamento: datosEnvio.departamento.trim(),
                  ciudad: datosEnvio.ciudad.trim(),
                  distrito: datosEnvio.distrito.trim(),
                  calle: datosEnvio.calle.trim(),
                  referencias: datosEnvio.referencias.trim(),
                }
              : null,
          items: cart.map((item) => ({ productoId: item.productoId, talla: item.talla, cantidad: item.cantidad })),
          cuponCodigo: localStorage.getItem(CUPON_KEY),
          metodoPago,
          comprobante,
          aceptaTerminos,
          aceptaPrivacidad,
        }),
      })

      const ordenJson = await ordenRes.json().catch(() => ({}))

      if (ordenRes.status === 409) {
        // El servidor ajusto el carrito (stock/disponibilidad): refrescar.
        await validarEnServidor()
        throw new Error(ordenJson.error || 'El carrito cambio. Revisa el resumen actualizado.')
      }

      if (ordenRes.status === 422 && ordenJson.accion === 'coordinar_whatsapp') {
        setMostrarWhatsappEnvio(true)
        throw new Error(ordenJson.error || 'Tu distrito no tiene tarifa de envio configurada.')
      }

      if (!ordenRes.ok) {
        const detalle = Array.isArray(ordenJson.details) ? ` ${ordenJson.details.join(' ')}` : ''
        throw new Error((ordenJson.error || 'No se pudo crear el pedido.') + detalle)
      }

      const order = ordenJson.order
      const orderRef = order?.codigoCorrelacion

      if (metodoPago === 'tarjeta') {
        const sessionRes = await fetch('/api/payments/izipay/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderRef, orderId: order?.id }),
        })

        const sessionJson = (await sessionRes.json().catch(() => ({}))) as IzipaySessionResponse & {
          error?: string
          details?: string
        }

        if (!sessionRes.ok || !sessionJson.session) {
          throw new Error(sessionJson.details || sessionJson.error || 'No se pudo preparar checkout Izipay.')
        }

        const sdkSession = sessionJson.session
        await loadKryptonAssets({
          jsUrl: sdkSession.krPaymentFormJsUrl,
          cssUrl: sdkSession.krClassicCssUrl,
          publicKey: sdkSession.publicKey,
        })
        if (!window.KR) {
          throw new Error('El SDK Krypton de Izipay no esta disponible en este navegador.')
        }

        setKryptonFormToken(sdkSession.formToken)

        window.KR.onSubmit((event: any) => {
          const clientAnswer = event?.clientAnswer
          const krHash = event?.hash
          const visualStatus = resolveVisualStatus(clientAnswer?.orderStatus)

          void fetch('/api/payments/izipay/visual-result', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderRef,
              orderId: order?.id,
              krAnswer: JSON.stringify(clientAnswer || {}),
              krHash,
            }),
          }).catch(() => {})

          if (visualStatus === 'success') {
            clearCart()
            localStorage.removeItem(CUPON_KEY)
            clearIdempotencyKey()
          }

          allowNavigationRef.current = true
          const parsed = new URL(sdkSession.returnUrl || `${window.location.origin}/confirmacion`, window.location.origin)
          parsed.searchParams.set('orderRef', String(orderRef || ''))
          parsed.searchParams.set('izipayStatus', visualStatus)
          window.location.assign(parsed.toString())
          return false
        })

        setLoading(false)
        return
      }

      // Pedido creado: recien aqui se vacia el carrito.
      clearCart()
      localStorage.removeItem(CUPON_KEY)
      clearIdempotencyKey()
      allowNavigationRef.current = true
      router.push(`/confirmacion?orderRef=${encodeURIComponent(String(orderRef || ''))}`)
    } catch (error) {
      setErrorGeneral((error as Error).message)
      setLoading(false)
    }
  }

  const metodoSeleccionado = metodos?.find((m) => m.codigo === metodoPago) ?? null
  const totalMostrado = resumen?.total !== null && resumen?.total !== undefined ? resumen.total : null

  // Compra desactivada globalmente: checkout informativo, sin formularios ni
  // creacion de pedidos. El bloqueo real vive en servidor (POST /ordenes 403).
  if (ecommerceEnabled === false) {
    return (
      <>
        <HeaderClient />
        <main className="min-h-screen bg-[var(--surface-soft)] py-16">
          <div className="mx-auto max-w-xl px-4 text-center">
            <div className="store-panel p-8">
              <h1 className="mb-3 text-2xl font-black text-gray-900">Compra online proximamente</h1>
              <p className="text-sm text-gray-600">
                La compra online se habilitara proximamente. Consulta disponibilidad por WhatsApp y coordina tu pedido con
                nosotros.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <a
                  href={`https://wa.me/${normalizeWhatsappNumber(whatsappNumero)}?text=${encodeURIComponent('Hola, quiero consultar disponibilidad y coordinar una compra.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="store-button-primary"
                >
                  Consultar por WhatsApp
                </a>
                <a href="/productos" className="store-button-secondary">
                  Volver al catalogo
                </a>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <HeaderClient />
      <main className="min-h-screen bg-[var(--surface-soft)] py-8 sm:py-10">
        <div className="mx-auto max-w-7xl px-4">
          {/* Stepper */}
          <div className="store-panel mb-6 flex items-center justify-center px-4 py-5 sm:px-6">
            {PASOS.map((p, i) => (
              <div key={p.n} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-black transition-colors ${
                      p.n < paso ? 'bg-accent text-white' : p.n === paso ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-[var(--surface-muted)] text-primary/45'
                    }`}
                  >
                    {p.n < paso ? '✓' : p.n}
                  </div>
                  <span className={`mt-1 hidden text-xs font-semibold sm:block ${p.n === paso ? 'text-primary' : p.n < paso ? 'text-accent' : 'text-primary/50'}`}>
                    {p.label}
                  </span>
                </div>
                {i < PASOS.length - 1 && <div className={`mx-2 h-0.5 w-12 sm:w-20 ${p.n < paso ? 'bg-accent/70' : 'bg-[var(--line-soft)]'}`} />}
              </div>
            ))}
          </div>

          {erroresCampos.length > 0 ? (
            <div role="alert" className="mb-4 rounded-xl border border-accent/30 bg-accent/10 px-5 py-4 text-sm font-semibold text-accent-dark">
              <ul className="list-inside list-disc space-y-1">
                {erroresCampos.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              {/* Paso 2: Datos personales */}
              <div className="store-panel">
                <div className="flex items-center justify-between border-b border-[var(--line-soft)] px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${paso > 2 ? 'bg-accent text-white' : 'bg-primary text-white'}`}>
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
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label htmlFor="ck-nombres" className={labelCls}>Nombres *</label>
                          <input id="ck-nombres" className={inputCls} type="text" autoComplete="given-name" value={datosPersonales.nombres}
                            onChange={(e) => setDatosPersonales((p) => ({ ...p, nombres: e.target.value }))} required />
                        </div>
                        <div>
                          <label htmlFor="ck-apellidos" className={labelCls}>Apellidos *</label>
                          <input id="ck-apellidos" className={inputCls} type="text" autoComplete="family-name" value={datosPersonales.apellidos}
                            onChange={(e) => setDatosPersonales((p) => ({ ...p, apellidos: e.target.value }))} required />
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label htmlFor="ck-tipodoc" className={labelCls}>Tipo de documento *</label>
                          <select id="ck-tipodoc" className={inputCls} value={datosPersonales.tipoDocumento}
                            onChange={(e) => setDatosPersonales((p) => ({ ...p, tipoDocumento: e.target.value }))}>
                            <option value="dni">DNI</option>
                            <option value="ce">Carnet de extranjeria</option>
                            <option value="pasaporte">Pasaporte</option>
                            <option value="ruc">RUC</option>
                          </select>
                        </div>
                        <div>
                          <label htmlFor="ck-numdoc" className={labelCls}>Numero de documento *</label>
                          <input id="ck-numdoc" className={inputCls} type="text" maxLength={15} value={datosPersonales.numeroDocumento}
                            onChange={(e) => setDatosPersonales((p) => ({ ...p, numeroDocumento: e.target.value.trim() }))} required />
                        </div>
                      </div>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label htmlFor="ck-email" className={labelCls}>Correo electronico *</label>
                          <input id="ck-email" className={inputCls} type="email" autoComplete="email" value={datosPersonales.email}
                            onChange={(e) => setDatosPersonales((p) => ({ ...p, email: e.target.value }))} required />
                        </div>
                        <div>
                          <label htmlFor="ck-celular" className={labelCls}>Celular / WhatsApp *</label>
                          <input id="ck-celular" className={inputCls} type="tel" placeholder="9XXXXXXXX" autoComplete="tel-national" maxLength={9} value={datosPersonales.celular}
                            onChange={(e) => setDatosPersonales((p) => ({ ...p, celular: e.target.value.replace(/\D/g, '').slice(0, 9) }))} required />
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (!validarDatosPersonales()) return
                        setErroresCampos([])
                        setPaso(3)
                      }}
                      className="store-button-primary mt-6 w-full"
                    >
                      Continuar
                    </button>
                  </div>
                ) : paso > 2 ? (
                  <div className="px-6 py-4 text-sm text-gray-600">
                    <p><span className="font-semibold">Nombre:</span> {datosPersonales.nombres} {datosPersonales.apellidos}</p>
                    <p><span className="font-semibold">Documento:</span> {datosPersonales.tipoDocumento.toUpperCase()} {datosPersonales.numeroDocumento}</p>
                    <p><span className="font-semibold">Correo:</span> {datosPersonales.email}</p>
                    <p><span className="font-semibold">Celular:</span> {datosPersonales.celular}</p>
                  </div>
                ) : null}
              </div>

              {/* Paso 3: Entrega */}
              <div className="store-panel">
                <div className="flex items-center justify-between border-b border-[var(--line-soft)] px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${paso > 3 ? 'bg-accent text-white' : paso === 3 ? 'bg-primary text-white' : 'bg-[var(--surface-muted)] text-primary/45'}`}>
                      {paso > 3 ? '✓' : '2'}
                    </span>
                    <h2 className={`font-bold ${paso >= 3 ? 'text-gray-900' : 'text-primary/50'}`}>Metodo de entrega</h2>
                  </div>
                  {paso > 3 && (
                    <button onClick={() => setPaso(3)} className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                      Editar
                    </button>
                  )}
                </div>

                {paso === 3 ? (
                  <div className="p-6">
                    <div className="mb-5 grid gap-3 sm:grid-cols-2">
                      <label className={`flex cursor-pointer items-center gap-3 rounded-lg border-2 px-4 py-3 transition-colors ${metodoEntrega === 'delivery' ? 'border-primary bg-[var(--surface-soft)]' : 'border-[var(--line-soft)] hover:border-primary/30'}`}>
                        <input type="radio" name="metodoEntrega" value="delivery" checked={metodoEntrega === 'delivery'}
                          onChange={() => {
                            setMetodoEntrega('delivery')
                            void validarEnServidor({ entrega: 'delivery' })
                          }} className="accent-primary" />
                        <span className="text-sm font-semibold text-gray-700">Envio a domicilio</span>
                      </label>
                      <label
                        className={`flex items-center gap-3 rounded-lg border-2 px-4 py-3 transition-colors ${
                          puntosRecojo.length === 0
                            ? 'cursor-not-allowed border-[var(--line-soft)] opacity-50'
                            : metodoEntrega === 'retiro_tienda'
                              ? 'cursor-pointer border-primary bg-[var(--surface-soft)]'
                              : 'cursor-pointer border-[var(--line-soft)] hover:border-primary/30'
                        }`}
                      >
                        <input type="radio" name="metodoEntrega" value="retiro_tienda" disabled={puntosRecojo.length === 0} checked={metodoEntrega === 'retiro_tienda'}
                          onChange={() => {
                            setMetodoEntrega('retiro_tienda')
                            void validarEnServidor({ entrega: 'retiro_tienda' })
                          }} className="accent-primary" />
                        <span className="text-sm font-semibold text-gray-700">
                          Recojo en tienda {puntosRecojo.length === 0 ? '(no disponible)' : ''}
                        </span>
                      </label>
                    </div>

                    {metodoEntrega === 'retiro_tienda' && puntosRecojo.length > 0 ? (
                      <div className="rounded-xl border border-primary/20 bg-[var(--surface-soft)] p-4 text-sm text-gray-700">
                        <p className="font-bold text-primary-dark">{puntosRecojo[0].nombre}</p>
                        <p>{puntosRecojo[0].direccion}</p>
                        {puntosRecojo[0].horario ? <p>Horario: {puntosRecojo[0].horario}</p> : null}
                        {puntosRecojo[0].instrucciones ? <p className="mt-1 text-gray-500">{puntosRecojo[0].instrucciones}</p> : null}
                      </div>
                    ) : null}

                    {metodoEntrega === 'delivery' ? (
                      <div className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <label htmlFor="ck-departamento" className={labelCls}>Departamento *</label>
                            <input id="ck-departamento" className={inputCls} type="text" value={datosEnvio.departamento}
                              onChange={(e) => setDatosEnvio((p) => ({ ...p, departamento: e.target.value }))} required />
                          </div>
                          <div>
                            <label htmlFor="ck-ciudad" className={labelCls}>Provincia / Ciudad *</label>
                            <input id="ck-ciudad" className={inputCls} type="text" list="checkout-ciudades-peru" value={datosEnvio.ciudad}
                              onChange={(e) => setDatosEnvio((p) => ({ ...p, ciudad: e.target.value }))} required />
                            <datalist id="checkout-ciudades-peru">
                              {PERU_CITY_OPTIONS.map((city) => (
                                <option key={city} value={city} />
                              ))}
                            </datalist>
                          </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div>
                            <label htmlFor="ck-distrito" className={labelCls}>Distrito *</label>
                            {ciudadConDistritos ? (
                              <select id="ck-distrito" className={inputCls} value={datosEnvio.distrito}
                                onChange={(e) => {
                                  setDatosEnvio((p) => ({ ...p, distrito: e.target.value }))
                                  void validarEnServidor({ distrito: e.target.value })
                                }} required>
                                <option value="">Selecciona un distrito</option>
                                {distritosDisponibles.map((district) => (
                                  <option key={district} value={district}>{district}</option>
                                ))}
                              </select>
                            ) : (
                              <input id="ck-distrito" className={inputCls} type="text" value={datosEnvio.distrito}
                                onChange={(e) => setDatosEnvio((p) => ({ ...p, distrito: e.target.value }))}
                                onBlur={(e) => void validarEnServidor({ distrito: e.target.value })} required />
                            )}
                          </div>
                          <div>
                            <label htmlFor="ck-calle" className={labelCls}>Direccion (calle y numero) *</label>
                            <input id="ck-calle" className={inputCls} type="text" autoComplete="street-address" value={datosEnvio.calle}
                              onChange={(e) => setDatosEnvio((p) => ({ ...p, calle: e.target.value }))} required />
                          </div>
                        </div>
                        <div>
                          <label htmlFor="ck-referencias" className={labelCls}>Referencias</label>
                          <textarea id="ck-referencias" className={inputCls} rows={2} placeholder="Ej: Cerca del parque, puerta azul..."
                            value={datosEnvio.referencias} onChange={(e) => setDatosEnvio((p) => ({ ...p, referencias: e.target.value }))} />
                        </div>

                        {resumen && datosEnvio.distrito ? (
                          resumen.envio.tipo === 'tarifa' ? (
                            <p className="rounded-lg border border-primary/25 bg-[var(--surface-soft)] px-4 py-3 text-sm font-semibold text-primary-dark">
                              {resumen.envio.etiqueta}: {resumen.envio.costo === 0 ? 'Gratis' : formatMoney(resumen.envio.costo ?? 0, currencySymbol)}
                            </p>
                          ) : resumen.envio.tipo === 'coordinar' ? (
                            <div className="rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent-dark">
                              <p className="font-semibold">Tu distrito aun no tiene tarifa de envio configurada.</p>
                              <p className="mt-1">Coordina el costo de entrega por WhatsApp antes de completar el pedido online.</p>
                              <a
                                href={`https://wa.me/${normalizeWhatsappNumber(whatsappNumero)}?text=${encodeURIComponent(`Hola, quiero coordinar el costo de entrega para el distrito ${datosEnvio.distrito}.`)}`}
                                target="_blank" rel="noopener noreferrer"
                                className="mt-2 inline-block rounded-full border border-accent/40 px-4 py-1.5 text-xs font-bold uppercase tracking-wide"
                              >
                                Coordinar por WhatsApp
                              </a>
                            </div>
                          ) : null
                        ) : null}
                      </div>
                    ) : null}

                    <button
                      onClick={() => {
                        if (!validarDatosEnvio()) return
                        setErroresCampos([])
                        void validarEnServidor()
                        setPaso(4)
                      }}
                      className="store-button-primary mt-6 w-full"
                    >
                      Continuar
                    </button>
                  </div>
                ) : paso > 3 ? (
                  <div className="px-6 py-4 text-sm text-gray-600">
                    {metodoEntrega === 'retiro_tienda' ? (
                      <p>Recojo en tienda: {puntosRecojo[0]?.nombre} — {puntosRecojo[0]?.direccion}</p>
                    ) : (
                      <>
                        <p>{datosEnvio.calle}</p>
                        <p>{datosEnvio.distrito}, {datosEnvio.ciudad} — {datosEnvio.departamento}</p>
                        {datosEnvio.referencias && <p className="text-primary-dark/75">{datosEnvio.referencias}</p>}
                      </>
                    )}
                  </div>
                ) : null}
              </div>

              {/* Paso 4: Pago */}
              <div className="store-panel">
                <div className="flex items-center gap-3 border-b border-[var(--line-soft)] px-6 py-4">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${paso === 4 ? 'bg-primary text-white' : 'bg-[var(--surface-muted)] text-primary/45'}`}>
                    3
                  </span>
                  <h2 className={`font-bold ${paso === 4 ? 'text-gray-900' : 'text-primary/50'}`}>Metodo de pago</h2>
                </div>

                {paso === 4 && (
                  <div className="p-6">
                    <div className="mb-5 flex items-center gap-4">
                      <span className="text-sm font-semibold text-gray-600">Comprobante:</span>
                      <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-gray-700">
                        <input type="radio" name="comprobante" value="boleta" checked={comprobante === 'boleta'} onChange={() => setComprobante('boleta')} className="accent-primary" />
                        Boleta
                      </label>
                      <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-gray-700">
                        <input type="radio" name="comprobante" value="factura" checked={comprobante === 'factura'} onChange={() => setComprobante('factura')} className="accent-primary" />
                        Factura
                      </label>
                    </div>

                    {metodos === null && <div className="py-8 text-center text-sm text-primary/60">Cargando metodos de pago...</div>}

                    {metodos !== null && metodos.length === 0 && (
                      <div className="rounded-xl border border-accent/30 bg-accent/10 p-5 text-sm text-accent-dark">
                        <p className="font-bold">Aun no hay metodos de pago online configurados.</p>
                        <p className="mt-1">Puedes coordinar tu compra directamente por WhatsApp.</p>
                        <a
                          href={`https://wa.me/${normalizeWhatsappNumber(whatsappNumero)}?text=${encodeURIComponent('Hola, quiero coordinar el pago de mi pedido.')}`}
                          target="_blank" rel="noopener noreferrer"
                          className="mt-3 inline-block rounded-full border border-accent/40 px-4 py-2 text-xs font-bold uppercase tracking-wide"
                        >
                          Coordinar por WhatsApp
                        </a>
                      </div>
                    )}

                    {metodos !== null && metodos.length > 0 && (
                      <>
                        <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Metodo de pago">
                          {metodos.map((m) => (
                            <label key={m.codigo} className={`flex cursor-pointer items-center justify-between rounded-lg border-2 px-4 py-3 transition-colors ${metodoPago === m.codigo ? 'border-primary bg-[var(--surface-soft)]' : 'border-[var(--line-soft)] hover:border-primary/30'}`}>
                              <span className="flex items-center gap-3">
                                <input type="radio" name="metodoPago" value={m.codigo} checked={metodoPago === m.codigo} onChange={() => setMetodoPago(m.codigo)} className="accent-primary" />
                                <span className="text-sm font-semibold text-gray-700">{m.nombre}</span>
                              </span>
                              <span className="rounded bg-primary px-2 py-0.5 text-[10px] font-black uppercase text-white">
                                {m.codigo === 'tarjeta' ? 'VISA/MC' : m.codigo === 'transferencia' ? 'BCP' : m.codigo === 'interbank' ? 'IBK' : m.codigo.slice(0, 4)}
                              </span>
                            </label>
                          ))}
                        </div>

                        {metodoSeleccionado && (metodoSeleccionado.codigo === 'yape' || metodoSeleccionado.codigo === 'plin') ? (
                          <div className="mt-4 rounded-xl border-2 border-primary/20 bg-[var(--surface-soft)] p-5 text-sm text-gray-700">
                            <p className="mb-2 font-black text-primary">Paga con {metodoSeleccionado.nombre}</p>
                            {metodoSeleccionado.qrUrl ? (
                              <div className="mb-3 flex justify-center">
                                <img src={metodoSeleccionado.qrUrl} alt={`QR ${metodoSeleccionado.nombre}`} className="h-40 w-40 rounded-xl object-contain shadow" />
                              </div>
                            ) : null}
                            <p>Numero: <strong>{metodoSeleccionado.numero}</strong></p>
                            <p>Titular: <strong>{metodoSeleccionado.titular}</strong></p>
                            {totalMostrado !== null ? <p className="mt-1">Monto a pagar: <strong>{formatMoney(totalMostrado, currencySymbol)}</strong></p> : null}
                            <p className="mt-2 text-gray-500">
                              {metodoSeleccionado.instruccion ?? 'Despues de crear tu pedido podras subir el comprobante de pago.'}
                            </p>
                          </div>
                        ) : null}

                        {metodoSeleccionado && (metodoSeleccionado.codigo === 'transferencia' || metodoSeleccionado.codigo === 'interbank') ? (
                          <div className="mt-4 rounded-xl border-2 border-primary/20 bg-[var(--surface-soft)] p-5 text-sm text-gray-700">
                            <p className="mb-2 font-black text-primary">Datos para {metodoSeleccionado.nombre}</p>
                            <p>Banco: <strong>{metodoSeleccionado.banco}</strong></p>
                            <p>Titular: <strong>{metodoSeleccionado.titular}</strong></p>
                            <p>Cuenta: <strong>{metodoSeleccionado.numeroCuenta}</strong></p>
                            <p>CCI: <strong>{metodoSeleccionado.cci}</strong></p>
                            <p>Moneda: <strong>{metodoSeleccionado.monedaCuenta === 'USD' ? 'Dolares' : 'Soles'}</strong></p>
                            <p className="mt-2 text-gray-500">
                              {metodoSeleccionado.instruccion ?? 'Despues de crear tu pedido podras subir el comprobante de la transferencia.'}
                            </p>
                          </div>
                        ) : null}

                        {metodoSeleccionado?.codigo === 'efectivo' ? (
                          <div className="mt-4 rounded-xl border-2 border-[var(--line-soft)] bg-[var(--surface-soft)] p-5 text-sm text-gray-700">
                            <p className="font-semibold text-gray-800">Pago al recibir tu pedido</p>
                            <p className="mt-1 text-gray-500">
                              {metodoSeleccionado.instruccion ?? (totalMostrado !== null ? `Se cobrara ${formatMoney(totalMostrado, currencySymbol)} al momento de la entrega.` : 'El pago se realiza contra entrega.')}
                            </p>
                          </div>
                        ) : null}

                        {metodoSeleccionado?.codigo === 'tarjeta' ? (
                          <div className="mt-4 space-y-4 rounded-xl border border-[var(--line-soft)] bg-white p-5">
                            <div className="rounded-lg border border-primary/25 bg-[var(--surface-soft)] px-4 py-3 text-sm text-primary-dark">
                              Los datos de tarjeta no se capturan en este formulario. El cobro se procesa en la pasarela oficial de Izipay.
                            </div>
                            <div id="izipay-kr-form" className="kr-embedded" />
                            <p className="text-xs text-gray-500">
                              {metodoSeleccionado.instruccion ?? 'La confirmacion final del pago depende del webhook backend.'}
                            </p>
                          </div>
                        ) : null}

                        <div className="mt-6 space-y-2 rounded-xl border border-[var(--line-soft)] bg-white p-4 text-sm text-gray-700">
                          <label className="flex cursor-pointer items-start gap-3">
                            <input type="checkbox" checked={aceptaTerminos} onChange={(e) => setAceptaTerminos(e.target.checked)} className="mt-0.5 accent-primary" />
                            <span>
                              Acepto los{' '}
                              <a href="/terminos" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline">
                                terminos y condiciones
                              </a>{' '}
                              *
                            </span>
                          </label>
                          <label className="flex cursor-pointer items-start gap-3">
                            <input type="checkbox" checked={aceptaPrivacidad} onChange={(e) => setAceptaPrivacidad(e.target.checked)} className="mt-0.5 accent-primary" />
                            <span>
                              Acepto la{' '}
                              <a href="/privacidad" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline">
                                politica de privacidad
                              </a>
                            </span>
                          </label>
                        </div>
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
              <div className="divide-y divide-[var(--line-soft)]/60 px-6 py-4">
                {(resumen?.items ?? items.map((i) => ({ nombre: i.nombre, talla: i.talla, cantidad: i.cantidad, subtotal: i.precioRef * i.cantidad, estado: 'ok' as const, productoId: 0, precioUnitario: i.precioRef }))).map((item, i) => (
                  <div key={i} className="flex items-center gap-3 py-3">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-black text-white">
                      {item.cantidad}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-gray-800">{item.nombre}</p>
                      {item.talla ? <p className="text-xs text-primary-dark/70">Talla: {item.talla}</p> : null}
                      {item.estado !== 'ok' ? <p className="text-xs font-semibold text-accent-dark">{'motivo' in item ? item.motivo : 'Revisar disponibilidad'}</p> : null}
                    </div>
                    <span className="text-sm font-bold text-gray-700">{formatMoney(item.subtotal, currencySymbol)}</span>
                  </div>
                ))}
              </div>
              <div className="space-y-2 border-t border-[var(--line-soft)] px-6 py-4" aria-live="polite">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>{resumen ? formatMoney(resumen.subtotal, currencySymbol) : '—'}</span>
                </div>
                {resumen && resumen.descuento > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Descuento{resumen.cupon ? ` (${resumen.cupon.codigo})` : ''}</span>
                    <span className="font-semibold text-accent-dark">-{formatMoney(resumen.descuento, currencySymbol)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Envio</span>
                  <span className="font-semibold text-gray-800">
                    {!resumen
                      ? '—'
                      : resumen.envio.tipo === 'tarifa'
                        ? resumen.envio.costo === 0
                          ? 'Gratis ✓'
                          : formatMoney(resumen.envio.costo ?? 0, currencySymbol)
                        : resumen.envio.tipo === 'retiro'
                          ? 'Gratis (recojo)'
                          : resumen.envio.tipo === 'coordinar'
                            ? 'Por coordinar'
                            : 'Segun distrito'}
                  </span>
                </div>
              </div>
              <div className="border-t-2 border-[var(--line-soft)] px-6 py-4">
                <div className="flex justify-between">
                  <span className="font-black text-gray-900">Total</span>
                  <span className="text-xl font-black text-primary">
                    {resumen && envioListo && totalMostrado !== null ? formatMoney(totalMostrado, currencySymbol) : 'Por confirmar'}
                  </span>
                </div>
              </div>

              {errorGeneral ? (
                <div role="alert" className="mx-6 mb-3 rounded-lg border border-accent/30 bg-accent/10 px-4 py-3 text-xs font-semibold text-accent-dark">
                  {errorGeneral}
                  {mostrarWhatsappEnvio ? (
                    <a
                      href={`https://wa.me/${normalizeWhatsappNumber(whatsappNumero)}?text=${encodeURIComponent(`Hola, quiero coordinar la entrega de mi pedido al distrito ${datosEnvio.distrito}.`)}`}
                      target="_blank" rel="noopener noreferrer" className="mt-2 block font-bold underline"
                    >
                      Coordinar entrega por WhatsApp
                    </a>
                  ) : null}
                </div>
              ) : null}

              {paso === 4 && metodos !== null && metodos.length > 0 && (
                <div className="px-6 pb-6">
                  <button
                    onClick={handleConfirmar}
                    disabled={loading || !metodoPago || !aceptaTerminos || !envioListo}
                    className="w-full rounded-lg bg-accent py-4 font-black text-white shadow-lg shadow-accent/35 transition-all hover:bg-accent-dark disabled:opacity-60"
                  >
                    {loading ? 'Procesando...' : metodoPago === 'tarjeta' ? 'PAGAR CON IZIPAY' : 'REALIZAR PEDIDO'}
                  </button>
                  {!envioListo ? (
                    <p className="mt-2 text-center text-xs text-primary-dark/70">Completa la entrega con una tarifa valida para continuar.</p>
                  ) : null}
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
