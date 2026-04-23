import { NextResponse } from 'next/server'
import { getStoreIdentity } from '@/lib/storefront'

export async function GET() {
  const brand = await getStoreIdentity()
  return NextResponse.json(brand, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  })
}
