import { getStorefrontConfig } from '@/lib/storefront'
import HeaderClient from './HeaderClient'

export default async function Header() {
  const storefront = await getStorefrontConfig()
  return <HeaderClient initialConfig={storefront} />
}
