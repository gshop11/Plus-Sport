import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

type Metodo = {
  nombre: string
  codigo: 'yape' | 'plin' | 'interbank' | 'transferencia' | 'tarjeta' | 'efectivo' | 'whatsapp'
  activo: boolean
  mostrarEnFooter: boolean
  instruccion: string | null
}

const emptyLegacy = {
  numero: null as string | null,
  numeroCuenta: null as string | null,
  qr: null as string | null,
}

const defaultMetodos: Metodo[] = [
  {
    nombre: 'Visa / Mastercard',
    codigo: 'tarjeta',
    activo: true,
    mostrarEnFooter: true,
    instruccion: 'Pago seguro con Izipay Sandbox. La validacion final depende del webhook backend.',
  },
  {
    nombre: 'Yape',
    codigo: 'yape',
    activo: true,
    mostrarEnFooter: true,
    instruccion: 'Te compartiremos los pasos de pago por WhatsApp al finalizar la compra.',
  },
  {
    nombre: 'Plin',
    codigo: 'plin',
    activo: true,
    mostrarEnFooter: true,
    instruccion: 'Disponible para transferencias inmediatas desde apps bancarias compatibles.',
  },
  {
    nombre: 'Transferencia BCP',
    codigo: 'transferencia',
    activo: true,
    mostrarEnFooter: true,
    instruccion: 'Completa la transferencia y envia el comprobante para validar la orden.',
  },
  {
    nombre: 'Transferencia Interbank',
    codigo: 'interbank',
    activo: true,
    mostrarEnFooter: true,
    instruccion: 'Completa la transferencia y envia el comprobante para validar la orden.',
  },
  {
    nombre: 'Pago en Efectivo',
    codigo: 'efectivo',
    activo: true,
    mostrarEnFooter: true,
    instruccion: 'El pago se realiza contra entrega dentro de la cobertura disponible.',
  },
]

export async function GET() {
  const buildResponse = (metodos: Metodo[]) => {
    const find = (codigo: Metodo['codigo']) => metodos.find((m) => m.codigo === codigo && m.activo)

    const yape = find('yape')
    const plin = find('plin')
    const bcp = find('transferencia')
    const interbank = find('interbank')
    const tarjeta = find('tarjeta')
    const efectivo = find('efectivo')

    return NextResponse.json(
      {
        metodos,
        yape: { activo: Boolean(yape), nombre: yape?.nombre ?? 'Yape', instruccion: yape?.instruccion ?? null, ...emptyLegacy },
        plin: { activo: Boolean(plin), nombre: plin?.nombre ?? 'Plin', instruccion: plin?.instruccion ?? null, ...emptyLegacy },
        bcp: { activo: Boolean(bcp), nombre: bcp?.nombre ?? 'Transferencia BCP', instruccion: bcp?.instruccion ?? null, ...emptyLegacy },
        interbank: { activo: Boolean(interbank), nombre: interbank?.nombre ?? 'Transferencia Interbank', instruccion: interbank?.instruccion ?? null, ...emptyLegacy },
        tarjeta: { activo: Boolean(tarjeta), nombre: tarjeta?.nombre ?? 'Visa / Mastercard', instruccion: tarjeta?.instruccion ?? null },
        efectivo: { activo: Boolean(efectivo), nombre: efectivo?.nombre ?? 'Pago en Efectivo', instruccion: efectivo?.instruccion ?? null },
      },
      {
        headers: { 'Cache-Control': 'no-store' },
      },
    )
  }

  try {
    const payload = await getPayload({ config })
    const ct = await payload.findGlobal({ slug: 'config-tienda', depth: 2, overrideAccess: true })
    const pagos = (ct as any)?.pagos ?? {}
    const metodosRaw = Array.isArray(pagos.metodos) ? pagos.metodos : []

    const metodos: Metodo[] = metodosRaw.map((m: any) => ({
      nombre: m?.nombre || 'Metodo',
      codigo: (m?.codigo || 'whatsapp') as Metodo['codigo'],
      activo: Boolean(m?.activo),
      mostrarEnFooter: m?.mostrarEnFooter !== false,
      instruccion: m?.instruccion || null,
    }))

    return buildResponse(metodos.length > 0 ? metodos : defaultMetodos)
  } catch (error) {
    console.error('Error en /api/metodos-pago:', error)
    return buildResponse(defaultMetodos)
  }
}
