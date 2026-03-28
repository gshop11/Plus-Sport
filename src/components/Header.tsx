import { getStoreIdentity } from '@/lib/storefront'
import HeaderClient from './HeaderClient'

export default async function Header() {
  const brand = await getStoreIdentity()
  return <HeaderClient brand={brand} />
}
