import { getPayload } from 'payload'
import config from '@payload-config'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ComprobanteUploader from '@/components/ComprobanteUploader'
import { normalizeWhatsappNumber } from '@/lib/availability-inquiry'
import { getMetodosPagoActivos, type MetodoPagoPublico } from '@/lib/payment-methods'
import { getStorefrontConfig } from '@/lib/storefront'
import { formatMoney } from '@/lib/money'

export const dynamic = 'force-dynamic'

// Etiquetas genericas por metodo. Los datos reales (numero, titular, cuenta,
// CCI, QR) provienen SOLO de la configuracion administrada en Payload.
const metodoLabels: Record<string, string> = {
  yape: 'Yape',
  plin: 'Plin',
  interbank: 'Transferencia Interbank',
  transferencia: 'Transferencia BCP',
  tarjeta: 'Tarjeta',
  efectivo: 'Efectivo contra entrega',
  whatsapp: 'Coordinacion por WhatsApp',
}

const ESTADO_LABELS: Record<string, string> = {
  pendiente_pago: 'Pendiente de pago',
  comprobante_recibido: 'Comprobante recibido',
  pago_en_revision: 'Pago en revision',
  pagado: 'Pagado',
  preparando: 'Preparando',
  enviado: 'Enviado',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
  pago_fallido: 'Pago fallido',
  reembolsado: 'Reembolsado',
  pendiente: 'Pendiente',
  procesando: 'Procesando',
}

type ConfirmSearchParams = {
  orderRef?: string
  izipayStatus?: string
  izipayTx?: string
}

function clean(value?: string) {
  return (value || '').trim()
}

// Solo codigoCorrelacion (no adivinable). Sin fallback por ID o numeroPedido.
async function findOrder(payload: Awaited<ReturnType<typeof getPayload>>, orderRef: string) {
  if (!orderRef.startsWith('ORD-')) return null
  try {
    const byRef = await payload.find({
      collection: 'ordenes',
      where: { codigoCorrelacion: { equals: orderRef } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    return (byRef.docs[0] as unknown as Record<string, unknown>) ?? null
  } catch {
    return null
  }
}

export default async function ConfirmacionPage({
  searchParams,
}: {
  searchParams: Promise<ConfirmSearchParams>
}) {
  const params = await searchParams
  const storefront = await getStorefrontConfig()
  const orderRef = clean(params.orderRef)

  let order: Record<string, unknown> | null = null
  let metodosActivos: MetodoPagoPublico[] = []

  try {
    const payload = await getPayload({ config })
    if (orderRef) {
      order = await findOrder(payload, orderRef)
    }
    metodosActivos = await getMetodosPagoActivos(payload)
  } catch {
    // render de respaldo
  }

  const hasSecureOrder = Boolean(order)
  const numeroPedido = String(order?.numeroPedido ?? '')
  const totalValue = typeof order?.total === 'number' ? Number(order.total) : null
  const total = totalValue !== null ? formatMoney(totalValue, storefront.moneda.simbolo) : ''
  const metodo = String(order?.paymentMethod || order?.metodoPago || 'whatsapp')
  const metodoConfig = metodosActivos.find((m) => m.codigo === metodo) ?? null
  const metodoLabel = metodoConfig?.nombre || metodoLabels[metodo] || metodo
  const estadoComercial = String(order?.estadoComercial || 'pendiente_pago')
  const estadoLabel = ESTADO_LABELS[estadoComercial] ?? estadoComercial
  const esManual = ['yape', 'plin', 'interbank', 'transferencia'].includes(metodo)
  const aceptaComprobante = esManual && ['pendiente_pago', 'comprobante_recibido', 'pago_en_revision', 'pendiente'].includes(estadoComercial)
  const items = Array.isArray(order?.items) ? (order?.items as Array<Record<string, unknown>>) : []

  const whatsappHref = `https://wa.me/${normalizeWhatsappNumber(storefront.whatsapp.numero)}?text=${encodeURIComponent(
    hasSecureOrder
      ? `Hola, acabo de realizar el pedido ${numeroPedido}. Quiero coordinar la entrega/pago.`
      : 'Hola, tengo una consulta sobre mi pedido.',
  )}`

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
            <h2 className="mb-1 text-2xl font-black text-primary">{hasSecureOrder ? 'Pedido registrado' : 'Orden no validada'}</h2>
            <p className="text-sm text-gray-500">
              {hasSecureOrder
                ? 'Tu pedido fue creado correctamente. Guarda tu numero de pedido.'
                : 'No se pudo recuperar una orden valida con la referencia recibida. Verifica el enlace de tu pedido.'}
            </p>

            {hasSecureOrder ? (
              <>
                <div className="mt-5 inline-block rounded-xl border-2 border-primary/25 bg-[var(--surface-soft)] px-8 py-4">
                  <p className="mb-1 text-xs uppercase tracking-widest text-gray-500">Numero de pedido</p>
                  <p className="text-2xl font-black text-primary">{numeroPedido}</p>
                </div>
                <p className="mt-3 text-xs text-gray-500">Ref: {orderRef}</p>
                {total ? (
                  <p className="mt-4 text-lg font-bold text-gray-700">
                    Total: <span className="text-primary">{total}</span>
                  </p>
                ) : null}
                <p className="mt-2 inline-block rounded-full border border-primary/20 bg-[var(--surface-soft)] px-4 py-1 text-sm font-semibold text-primary-dark">
                  Estado: {estadoLabel}
                </p>

                {items.length > 0 ? (
                  <div className="mt-5 rounded-lg border border-[var(--line-soft)] bg-[var(--surface-soft)] px-4 py-3 text-left text-sm text-gray-700">
                    {items.map((item, i) => (
                      <p key={i}>
                        {String(item.cantidad)} x {String(item.nombreProducto)}
                        {item.talla ? ` (talla ${String(item.talla)})` : ''} —{' '}
                        {formatMoney(Number(item.subtotal || 0), storefront.moneda.simbolo)}
                      </p>
                    ))}
                  </div>
                ) : null}
              </>
            ) : null}
          </div>

          {hasSecureOrder ? (
            <div className="rounded-2xl border border-[var(--line-soft)] bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-base font-bold text-gray-900">Pago: {metodoLabel}</h3>

              {metodoConfig && (metodoConfig.codigo === 'yape' || metodoConfig.codigo === 'plin') ? (
                <div className="mb-4 rounded-lg border border-primary/20 bg-[var(--surface-soft)] p-4 text-sm text-gray-700">
                  {metodoConfig.qrUrl ? (
                    <div className="mb-3 flex justify-center">
                      <img src={metodoConfig.qrUrl} alt={`QR ${metodoConfig.nombre}`} className="h-40 w-40 rounded-xl object-contain shadow" />
                    </div>
                  ) : null}
                  <p>Numero: <strong>{metodoConfig.numero}</strong></p>
                  <p>Titular: <strong>{metodoConfig.titular}</strong></p>
                  {total ? <p className="mt-1">Monto: <strong>{total}</strong></p> : null}
                </div>
              ) : null}

              {metodoConfig && (metodoConfig.codigo === 'transferencia' || metodoConfig.codigo === 'interbank') ? (
                <div className="mb-4 rounded-lg border border-primary/20 bg-[var(--surface-soft)] p-4 text-sm text-gray-700">
                  <p>Banco: <strong>{metodoConfig.banco}</strong></p>
                  <p>Titular: <strong>{metodoConfig.titular}</strong></p>
                  <p>Cuenta: <strong>{metodoConfig.numeroCuenta}</strong></p>
                  <p>CCI: <strong>{metodoConfig.cci}</strong></p>
                  {total ? <p className="mt-1">Monto: <strong>{total}</strong></p> : null}
                </div>
              ) : null}

              {metodoConfig?.instruccion ? (
                <p className="mb-4 rounded-lg border border-accent/25 bg-accent/10 p-4 text-sm leading-relaxed text-gray-700">
                  {metodoConfig.instruccion}
                </p>
              ) : null}

              {metodo === 'tarjeta' ? (
                <p className="mb-4 rounded-lg border border-primary/25 bg-[var(--surface-soft)] p-4 text-sm text-primary-dark">
                  El estado final del pago con tarjeta se confirma mediante la validacion del proveedor. Si tu pago fue exitoso, se
                  reflejara en el estado del pedido.
                </p>
              ) : null}

              {metodo === 'efectivo' ? (
                <p className="mb-4 rounded-lg border border-[var(--line-soft)] bg-[var(--surface-soft)] p-4 text-sm text-gray-700">
                  Pagaras en efectivo al recibir tu pedido.
                </p>
              ) : null}

              {aceptaComprobante ? (
                <div className="mt-2">
                  <h4 className="mb-2 text-sm font-bold text-gray-900">Sube tu comprobante de pago</h4>
                  <p className="mb-3 text-xs text-gray-500">
                    Tu pedido quedara como &quot;Comprobante recibido&quot; y lo validaremos manualmente antes de confirmarlo como pagado.
                  </p>
                  <ComprobanteUploader orderRef={orderRef} />
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="rounded-2xl border border-[var(--line-soft)] bg-white p-6 text-center shadow-sm">
            <p className="mb-3 text-sm text-gray-600">¿Dudas con tu pedido? Escribenos y te ayudamos.</p>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="store-button-primary inline-block"
            >
              Escribir por WhatsApp
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
