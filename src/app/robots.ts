import type { MetadataRoute } from 'next'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://plussport.pe'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Se excluyen tambien las paginas legales mientras su contenido este en
      // preparacion (cada pagina ademas declara robots noindex en su metadata).
      disallow: [
        '/admin',
        '/api/',
        '/checkout',
        '/carrito',
        '/confirmacion',
        '/terminos',
        '/privacidad',
        '/cambios-devoluciones',
        '/entregas',
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  }
}
