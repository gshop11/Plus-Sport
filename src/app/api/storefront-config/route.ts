import { NextResponse } from 'next/server'
import { getStorefrontConfig } from '@/lib/storefront'

export async function GET() {
  const config = await getStorefrontConfig()
  // no-store para que el estado de ECOMMERCE_ENABLED se refleje de inmediato
  // (el contenido pesado ya se cachea dentro de getStorefrontConfig).
  return NextResponse.json(config, {
    headers: {
      'Cache-Control': 'no-store',
    },
  })
}

