import { redirect } from 'next/navigation'

type SearchParams = Promise<{
  page?: string | string[]
}>

interface OfertasPageProps {
  searchParams: SearchParams
}

const getScalarParam = (value?: string | string[]) => {
  if (Array.isArray(value)) return value[0]
  return value
}

export default async function OfertasPage({ searchParams }: OfertasPageProps) {
  const { page } = await searchParams
  const targetParams = new URLSearchParams({ oferta: '1' })
  const pageParam = getScalarParam(page)

  if (pageParam) {
    targetParams.set('page', pageParam)
  }

  redirect(`/productos?${targetParams.toString()}`)
}
