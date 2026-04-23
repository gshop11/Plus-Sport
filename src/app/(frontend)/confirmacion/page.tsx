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
  tarjeta: { label: 'Tarjeta', instruccion: 'Aun no hay cobro automatico de tarjeta en esta fase.' },
  efectivo: { label: 'Efectivo contra entrega', instruccion: 'Paga en efectivo cuando recibas tu pedido.' },
  whatsapp: { label: 'WhatsApp', instruccion: 'Coordina el pago directamente por WhatsApp.' },
}

type ConfirmSearchParams = {
  orderRef?: string
  ordenId?: string
  numeroPedido?: string
  total?: string
  metodo?: string
}

async function findOrder(payload: any, refs: { orderRef?: string; ordenId?: string; numeroPedido?: string }) {
  const orderRef = (refs.orderRef || '').trim()
  const ordenId = (refs.ordenId || '').trim()
  const numeroPedido = (refs.numeroPedido || '').trim()

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

    if (byRef.docs.length > 0) {
      return byRef.docs[0]
    }
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

    if (byNumber.docs.length > 0) {
      return byNumber.docs[0]
    }
  }

  return null
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

  const estadoPago = order?.estadoPago || 'pending'
  const estadoComercial = order?.estadoComercial || 'pendiente'
  const hasSecureOrder = Boolean(order)

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        <section className="bg-primary py-8 text-white">
          <div className="mx-auto max-w-7xl px-4">
            <h1 className="text-3xl font-black">Confirmacion de pedido</h1>
          </div>
        </section>

        <div className="mx-auto max-w-2xl space-y-6 px-4 py-12">
          <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
            <div className="mb-4 text-5xl">Pedido</div>
            <h2 className="mb-1 text-2xl font-black text-green-600">Pedido registrado</h2>
            <p className="text-sm text-gray-500">Tu orden fue registrada correctamente</p>

            <div className="mt-5 inline-block rounded-xl border-2 border-primary bg-blue-50 px-8 py-4">
              <p className="mb-1 text-xs uppercase tracking-widest text-gray-500">Numero de pedido</p>
              <p className="text-2xl font-black text-primary">{numeroPedido}</p>
            </div>

            {codigoCorrelacion && (
              <p className="mt-3 text-xs text-gray-500">Ref: {codigoCorrelacion}</p>
            )}

            {total && (
              <p className="mt-4 text-lg font-bold text-gray-700">
                Total de orden: <span className="text-primary">{total}</span>
              </p>
            )}

            <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-left text-sm text-gray-700">
              <p><span className="font-semibold">Estado comercial:</span> {estadoComercial}</p>
              <p><span className="font-semibold">Estado de pago:</span> {estadoPago}</p>
            </div>

            {!hasSecureOrder && (
              <p className="mt-4 text-xs text-orange-600">
                No se pudo validar la orden en servidor con la referencia recibida. Verifica el codigo de pedido.
              </p>
            )}
          </div>

          <div className="hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-base font-bold">Metodo de pago: {infoPago.label}</h3>
            <p className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm leading-relaxed text-gray-700">
              {infoPago.instruccion}
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
