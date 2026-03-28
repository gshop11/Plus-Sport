import { getPayload } from 'payload'
import config from '@payload-config'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const fallbackMetodos: Record<string, { label: string; instruccion: string }> = {
  yape: { label: 'Yape', instruccion: 'Yapea a PLUS SPORT SAC y envia el comprobante por WhatsApp.' },
  plin: { label: 'Plin', instruccion: 'Paga con Plin a PLUS SPORT SAC y envia el comprobante por WhatsApp.' },
  interbank: { label: 'Transferencia Interbank', instruccion: 'Transfiere a la cuenta Interbank de PLUS SPORT SAC y envia el comprobante por WhatsApp.' },
  transferencia: { label: 'Transferencia BCP', instruccion: 'Deposita en la cuenta BCP de PLUS SPORT SAC y envia el comprobante por WhatsApp.' },
  tarjeta: { label: 'Tarjeta', instruccion: 'Te enviaremos el link de pago por WhatsApp.' },
  efectivo: { label: 'Efectivo contra entrega', instruccion: 'Paga en efectivo cuando recibas tu pedido.' },
  whatsapp: { label: 'WhatsApp', instruccion: 'Coordina el pago directamente con nosotros por WhatsApp.' },
}

export default async function ConfirmacionPage({
  searchParams,
}: {
  searchParams: Promise<{
    ordenId?: string
    numeroPedido?: string
    nombre?: string
    telefono?: string
    total?: string
    metodo?: string
    resumen?: string
  }>
}) {
  const params = await searchParams
  const numeroPedido = params.numeroPedido || 'PS-XXXXX'
  const total = params.total ? `S/ ${parseFloat(params.total).toFixed(2)}` : ''
  const metodo = params.metodo || 'whatsapp'

  let pagosConfig: any = null
  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
  try {
    const payload = await getPayload({ config })
    const cfg = await payload.findGlobal({ slug: 'config-tienda', overrideAccess: true })
    pagosConfig = (cfg as any).pagos ?? null
  } catch {
    // usa fallback si falla
  }

  type InfoPago = { label: string; instruccion: string; numero?: string; qrUrl?: string }
  let infoPago: InfoPago = fallbackMetodos[metodo] ?? fallbackMetodos.whatsapp

  const toAbsUrl = (url?: string) => {
    if (!url) return undefined
    if (url.startsWith('http')) return url
    return `${serverUrl}${url}`
  }

  if (pagosConfig) {
    const buildInstruccion = (custom: string, numero: string, fallbackConNum: string, fallbackSinNum: string) =>
      custom || (numero ? fallbackConNum : fallbackSinNum)

    const map: Record<string, () => InfoPago> = {
      yape: () => ({
        label: 'Yape',
        instruccion: buildInstruccion(
          pagosConfig.yape?.instruccion,
          pagosConfig.yape?.numero,
          `Yapea al numero ${pagosConfig.yape?.numero} (PLUS SPORT SAC) y envia el comprobante por WhatsApp.`,
          'Escanea el QR de arriba con tu app Yape y envia el comprobante por WhatsApp.',
        ),
        numero: pagosConfig.yape?.numero || undefined,
        qrUrl: toAbsUrl(pagosConfig.yape?.qr?.url),
      }),
      plin: () => ({
        label: 'Plin',
        instruccion: buildInstruccion(
          pagosConfig.plin?.instruccion,
          pagosConfig.plin?.numero,
          `Paga con Plin al numero ${pagosConfig.plin?.numero} (PLUS SPORT SAC) y envia el comprobante por WhatsApp.`,
          'Escanea el QR de arriba con Plin y envia el comprobante por WhatsApp.',
        ),
        numero: pagosConfig.plin?.numero || undefined,
        qrUrl: toAbsUrl(pagosConfig.plin?.qr?.url),
      }),
      interbank: () => ({
        label: 'Transferencia Interbank',
        instruccion: buildInstruccion(
          pagosConfig.interbank?.instruccion,
          pagosConfig.interbank?.numeroCuenta,
          `Transfiere a la cuenta Interbank ${pagosConfig.interbank?.numeroCuenta} (PLUS SPORT SAC) y envia el comprobante por WhatsApp.`,
          'Realiza la transferencia Interbank y envia el comprobante por WhatsApp.',
        ),
        numero: pagosConfig.interbank?.numeroCuenta || undefined,
        qrUrl: toAbsUrl(pagosConfig.interbank?.qr?.url),
      }),
      transferencia: () => ({
        label: 'Transferencia BCP',
        instruccion: buildInstruccion(
          pagosConfig.bcp?.instruccion,
          pagosConfig.bcp?.numeroCuenta,
          `Deposita en cuenta BCP ${pagosConfig.bcp?.numeroCuenta} (PLUS SPORT SAC) y envia el comprobante por WhatsApp.`,
          'Realiza la transferencia y envia el comprobante por WhatsApp.',
        ),
        numero: pagosConfig.bcp?.numeroCuenta || undefined,
        qrUrl: toAbsUrl(pagosConfig.bcp?.qr?.url),
      }),
      tarjeta: () => ({
        label: 'Tarjeta',
        instruccion: pagosConfig.tarjeta?.instruccion || 'Te enviaremos el link de pago por WhatsApp.',
      }),
      efectivo: () => ({
        label: 'Efectivo contra entrega',
        instruccion: pagosConfig.efectivo?.instruccion || 'Paga en efectivo cuando recibas tu pedido.',
      }),
    }
    if (map[metodo]) infoPago = map[metodo]()
  }

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
            <div className="mb-4 text-5xl">🎉</div>
            <h2 className="mb-1 text-2xl font-black text-green-600">¡Pedido recibido!</h2>
            <p className="text-sm text-gray-500">Tu orden fue registrada correctamente</p>

            <div className="mt-5 inline-block rounded-xl border-2 border-primary bg-blue-50 px-8 py-4">
              <p className="mb-1 text-xs uppercase tracking-widest text-gray-500">N° de pedido</p>
              <p className="text-2xl font-black text-primary">{numeroPedido}</p>
            </div>

            {total && (
              <p className="mt-4 text-lg font-bold text-gray-700">
                Total a pagar: <span className="text-primary">{total}</span>
              </p>
            )}
          </div>

          <div className="hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-base font-bold">
              <span>💳</span> Como pagar - {infoPago.label}
            </h3>

            {infoPago.qrUrl && (
              <div className="mb-4 flex justify-center">
                <div className="overflow-hidden rounded-2xl border-4 border-gray-200 bg-white p-2 shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={infoPago.qrUrl}
                    alt={`QR de pago ${infoPago.label}`}
                    width={220}
                    height={220}
                    className="rounded-xl object-contain"
                  />
                </div>
              </div>
            )}

            {infoPago.numero && (
              <div className="mb-4 flex items-center justify-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                <span className="text-sm font-medium text-gray-600">N°:</span>
                <span className="text-lg font-black tracking-wider text-green-700">{infoPago.numero}</span>
              </div>
            )}

            {!infoPago.qrUrl && (
              <p className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-sm leading-relaxed text-gray-700">
                {infoPago.instruccion}
              </p>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
