import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      service: 'plussport',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
    },
    {
      headers: {
        'Cache-Control': 'no-store',
      },
    },
  )
}
