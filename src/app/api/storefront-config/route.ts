import { NextResponse } from 'next/server'
import { getStorefrontConfig } from '@/lib/storefront'

export async function GET() {
  const config = await getStorefrontConfig()
  return NextResponse.json(config, {
    headers: {
      'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600',
    },
  })
}

