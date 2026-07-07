import type { MetadataRoute } from 'next'
import { getCategoriasData } from '@/lib/storefront'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://plussport.pe'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const categorias = await getCategoriasData().catch(() => [])

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${siteUrl}/productos`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${siteUrl}/categorias`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${siteUrl}/marcas`, changeFrequency: 'weekly', priority: 0.7 },
  ]

  const categoryRoutes: MetadataRoute.Sitemap = categorias
    .filter((categoria) => categoria.slug)
    .map((categoria) => ({
      url: `${siteUrl}/categoria/${categoria.slug}`,
      changeFrequency: 'weekly',
      priority: 0.6,
    }))

  return [...staticRoutes, ...categoryRoutes]
}
