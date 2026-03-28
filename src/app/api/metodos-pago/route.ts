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

export async function GET() {
  try {
    const payload = await getPayload({ config })
    const ct = await payload.findGlobal({ slug: 'config-tienda', depth: 2 })
    const pagos = (ct as any)?.pagos ?? {}
    const metodosRaw = Array.isArray(pagos.metodos) ? pagos.metodos : []

    const metodos: Metodo[] = metodosRaw.map((m: any) => ({
      nombre: m?.nombre || 'Metodo',
      codigo: (m?.codigo || 'whatsapp') as Metodo['codigo'],
      activo: Boolean(m?.activo),
      mostrarEnFooter: m?.mostrarEnFooter !== false,
      instruccion: m?.instruccion || null,
    }))

    // Compatibilidad para checkout actual
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
  } catch {
    return NextResponse.json({ error: 'Error leyendo config' }, { status: 500 })
  }
}
