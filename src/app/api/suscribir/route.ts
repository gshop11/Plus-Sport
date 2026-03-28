import { getPayload } from 'payload'
import config from '@/payload.config'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { telefono } = await req.json()

    if (!telefono || telefono.trim().length < 7) {
      return NextResponse.json({ error: 'Número inválido' }, { status: 400 })
    }

    const payload = await getPayload({ config })

    await payload.create({
      collection: 'suscriptores',
      data: { telefono: `+51 ${telefono.trim()}` },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Error al guardar' }, { status: 500 })
  }
}
