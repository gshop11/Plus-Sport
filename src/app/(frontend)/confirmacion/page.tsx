import { getPayload } from 'payload'
import config from '@payload-config'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { getStorefrontConfig } from '@/lib/storefront'
import { formatMoney } from '@/lib/money'

const fallbackMetodos: Record<string, { label: string; instruccion: string }> = {
  yape: { label: 'Yape', instruccion: 'Yapea a PLUS SPORT SAC y envia el comprobante por WhatsApp.' },
  plin: { label: 'Plin', instruccion: 'Paga con Plin a PLUS SPORT SAC y envia el comprobante por WhatsApp.' },
  interbank: { label: 'Transferencia Interbank', instruccion: 'Transfiere y envia el comprobante por WhatsApp.' },
  transferencia: { label: 'Transferencia BCP', instruccion: 'Deposita y envia el comprobante por WhatsApp.' },
  tarjeta: { label: 'Tarjeta', instruccion: 'Pago en pasarela Izipay. La validacion final depende del webhook backend.' },
  efectivo: { label: 'Efectivo contra entrega', instruccion: 'Paga en efectivo cuando recibas tu pedido.' },
  whatsapp: { label: 'WhatsApp', instruccion: 'Coordina el pago directamente por WhatsApp.' },
}

type ConfirmSearchParams = {
  orderRef?: string
  ordenId?: string
  numeroPedido?: string
  total?: string
  metodo?: string
  izipayStatus?: string
  izipayTx?: string
}

function clean(value?: string) {
  return (value || '').trim()
}

async function findOrder(payload: any, refs: { orderRef?: string; ordenId?: string; numeroPedido?: string }) {
  const orderRef = clean(refs.orderRef)
  const ordenId = clean(refs.ordenId)
  const numeroPedido = clean(refs.numeroPedido)

  if (orderRef) {
    const byRef = await payload.find({
      collection: 'ordenes',
      where: {
        or: [
          { codigoCorrelacion: { equals: orderRef } },
          { numeroPedido: { equals: orderRef } },
        ],
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })

    if (byRef.docs.length > 0) return byRef.docs[0]
  }

  if (ordenId) {
    try {
      return await payload.findByID({
        collection: 'ordenes',
        id: ordenId,
        depth: 0,
        overrideAccess: true,
      })
    } catch {
      // continue
    }
  }

  if (numeroPedido) {
    const byNumber = await payload.find({
      collection: 'ordenes',
      where: { numeroPedido: { equals: numeroPedido } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    if (byNumber.docs.length > 0) return byNumber.docs[0]
  }

  return null
}

function getVisualStatusLabel(value: string) {
  const v = value.toLowerCase()
  if (v === 'success') return 'success'
  if (v === 'failed') return 'failed'
  if (v === 'cancelled') return 'cancelled'
  return 'unknown'
}

function getPaymentCopy({
  isIzipay,
  estadoPago,
  visualStatus,
  paymentSignatureValid,
  hasSecureOrder,
}: {
  isIzipay: boolean
  estadoPago: string
  visualStatus: string
  paymentSignatureValid: boolean
  hasSecureOrder: boolean
}) {
  if (!hasSecureOrder) {
    return {
      title: 'Orden no encontrada',
      body: 'No se pudo validar la orden con la referencia recibida. Verifica el numero de pedido o vuelve al checkout.',
      boxClass: 'border-accent/30 bg-accent/10 text-accent-dark',
    }
  }

  if (!isIzipay) {
    return {
      title: 'Pago pendiente',
      body: 'Sigue las instrucciones del metodo de pago seleccionado para completar tu compra.',
      boxClass: 'border-primary/25 bg-[var(--surface-soft)] text-primary-dark',
    }
  }

  if (estadoPago === 'paid' && paymentSignatureValid) {
    return {
      title: 'Pago confirmado',
      body: 'La orden figura como pagada y confirmada por webhook backend.',
      boxClass: 'border-primary/25 bg-primary/10 text-primary-dark',
    }
  }

  if (estadoPago === 'failed') {
    return {
      title: 'Pago rechazado',
      body: 'El pago fue rechazado y no se confirmo en backend. Puedes reintentar con una nueva sesion.',
      boxClass: 'border-accent/30 bg-accent/10 text-accent-dark',
    }
  }

  if (estadoPago === 'canceled') {
    return {
      title: 'Pago cancelado',
      body: 'El pago fue cancelado y no se confirmo en backend.',
      boxClass: 'border-accent/30 bg-accent/10 text-accent-dark',
    }
  }

  if (estadoPago === 'authorized' || visualStatus === 'success') {
    return {
      title: 'Pago autorizado visualmente',
      body: 'Se recibio respuesta positiva en checkout Izipay, pero la validacion final se realiza por webhook backend.',
      boxClass: 'border-primary/25 bg-[var(--surface-soft)] text-primary-dark',
    }
  }

  if (visualStatus === 'failed') {
    return {
      title: 'Pago rechazado visualmente',
      body: 'El checkout visual reporta rechazo. Espera la validacion final backend o intenta nuevamente.',
      boxClass: 'border-accent/30 bg-accent/10 text-accent-dark',
    }
  }

  if (visualStatus === 'cancelled') {
    return {
      title: 'Pago cancelado visualmente',
      body: 'El checkout visual fue cancelado. Si no hubo webhook final, la orden seguira pendiente.',
      boxClass: 'border-accent/30 bg-accent/10 text-accent-dark',
    }
  }

  return {
    title: 'Pago pendiente de verificacion',
    body: 'La orden esta creada y lista para validacion final por webhook/consulta backend.',
    boxClass: 'border-primary/25 bg-[var(--surface-soft)] text-primary-dark',
  }
}

export default async function ConfirmacionPage({
  searchParams,
}: {
  searchParams: Promise<ConfirmSearchParams>
}) {
  const params = await searchParams
  const storefront = await getStorefrontConfig()

  let pagosConfig: any = null
  let order: any = null

  try {
    const payload = await getPayload({ config })
    order = await findOrder(payload, {
      orderRef: params.orderRef,
      ordenId: params.ordenId,
      numeroPedido: params.numeroPedido,
    })

    const cfg = await payload.findGlobal({ slug: 'config-tienda', overrideAccess: true, depth: 0 })
    pagosConfig = (cfg as any).pagos ?? null
  } catch {
    // fallback rendering
  }

  const numeroPedido = order?.numeroPedido || params.numeroPedido || 'PS-XXXXX'
  const codigoCorrelacion = order?.codigoCorrelacion || params.orderRef || ''

  const totalFromOrder = typeof order?.total === 'number' ? Number(order.total) : null
  const totalFromQuery = params.total ? Number(params.total) : null
  const totalValue = Number.isFinite(totalFromOrder as number)
    ? (totalFromOrder as number)
    : Number.isFinite(totalFromQuery as number)
      ? (totalFromQuery as number)
      : null

  const total = totalValue !== null ? formatMoney(totalValue, storefront.moneda.simbolo) : ''

  const metodo = String(order?.paymentMethod || order?.metodoPago || params.metodo || 'whatsapp')
  const fallback = fallbackMetodos[metodo] || fallbackMetodos.whatsapp
  const metodosConfig = Array.isArray(pagosConfig?.metodos) ? pagosConfig.metodos : []
  const metodoConfig = metodosConfig.find((m: any) => m?.codigo === metodo && m?.activo)
  const infoPago = {
    label: metodoConfig?.nombre || fallback.label,
    instruccion: metodoConfig?.instruccion || fallback.instruccion,
  }

  const estadoPago = String(order?.estadoPago || 'pending')
  const estadoComercial = String(order?.estadoComercial || 'pendiente')
  const paymentSignatureValid = Boolean(order?.paymentSignatureValid)
  const visualStatus = getVisualStatusLabel(clean(params.izipayStatus))
  const hasSecureOrder = Boolean(order)
  const isIzipay = metodo === 'tarjeta' || String(order?.paymentProvider || '').toLowerCase().includes('izipay')
  const paymentCopy = getPaymentCopy({ isIzipay, estadoPago, visualStatus, paymentSignatureValid, hasSecureOrder })
  const transactionId = clean(order?.transactionId) || clean(params.izipayTx)
  const paymentReference = clean(order?.paymentReference) || clean(order?.codigoCorrelacion)

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[var(--surface-soft)]">
        <section className="bg-primary py-8 text-white">
          <div className="mx-auto max-w-7xl px-4">
            <h1 className="text-3xl font-black">Confirmacion de pedido</h1>
          </div>
        </section>

        <div className="mx-auto max-w-2xl space-y-6 px-4 py-12">
          <div className="rounded-2xl border border-[var(--line-soft)] bg-white p-8 text-center shadow-sm">
            <div className="mb-4 text-5xl">Pedido</div>
            <h2 className="mb-1 text-2xl font-black text-primary">{hasSecureOrder ? 'Orden registrada' : 'Orden no validada'}</h2>
            <p className="text-sm text-gray-500">
              {hasSecureOrder
                ? 'Tu orden fue creada correctamente en PlusSport.'
                : 'No se pudo recuperar una orden valida con la referencia recibida.'}
            </p>

            <div className="mt-5 inline-block rounded-xl border-2 border-primary/25 bg-[var(--surface-soft)] px-8 py-4">
              <p className="mb-1 text-xs uppercase tracking-widest text-gray-500">Numero de pedido</p>
              <p className="text-2xl font-black text-primary">{numeroPedido}</p>
            </div>

            {codigoCorrelacion && <p className="mt-3 text-xs text-gray-500">Ref: {codigoCorrelacion}</p>}

            {total && (
              <p className="mt-4 text-lg font-bold text-gray-700">
                Total de orden: <span className="text-primary">{total}</span>
              </p>
            )}

            <div className="mt-4 rounded-lg border border-[var(--line-soft)] bg-[var(--surface-soft)] px-4 py-3 text-left text-sm text-gray-700">
              {hasSecureOrder && <p><span className="font-semibold">Estado comercial:</span> {estadoComercial}</p>}
              {hasSecureOrder && <p><span className="font-semibold">Estado de pago:</span> {estadoPago}</p>}
              {hasSecureOrder && isIzipay && <p><span className="font-semibold">Firma webhook valida:</span> {paymentSignatureValid ? 'si' : 'no / pendiente'}</p>}
              {transactionId && <p><span className="font-semibold">Transaction ID:</span> {transactionId}</p>}
              {paymentReference && <p><span className="font-semibold">Payment reference:</span> {paymentReference}</p>}
            </div>

            {!hasSecureOrder && (
              <p className="mt-4 text-xs text-accent-dark">
                No se pudo validar la orden en servidor con la referencia recibida. Verifica el codigo de pedido.
              </p>
            )}
          </div>

          <div className={`rounded-2xl border p-6 shadow-sm ${paymentCopy.boxClass}`}>
            <h3 className="mb-2 text-base font-bold">{paymentCopy.title}</h3>
            <p className="text-sm leading-relaxed">{paymentCopy.body}</p>
          </div>

          <div className="rounded-2xl border border-[var(--line-soft)] bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-bold">Metodo de pago: {infoPago.label}</h3>
            <p className="rounded-lg border border-accent/25 bg-accent/10 p-4 text-sm leading-relaxed text-gray-700">
              {infoPago.instruccion}
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
