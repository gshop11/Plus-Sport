import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getMetodosPagoActivos } from '@/lib/payment-methods'

// Devuelve UNICAMENTE los metodos de pago activos y con datos completos
// configurados en Payload (global config-tienda > pagos.metodos).
// Sin configuracion no hay metodos por defecto: el checkout mostrara el
// estado "sin metodos disponibles" con derivacion a WhatsApp.

export async function GET() {
  try {
    const payload = await getPayload({ config })
    const metodos = await getMetodosPagoActivos(payload)

    return NextResponse.json(
      { metodos },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    console.error('Error en /api/metodos-pago:', error)
    return NextResponse.json({ metodos: [] }, { headers: { 'Cache-Control': 'no-store' } })
  }
}
