import Footer from '@/components/Footer'
import Header from '@/components/Header'
import ProductDetailView from '@/components/ProductDetailView'
import TarjetaProducto from '@/components/TarjetaProducto'
import { getProductoDetalleBySlug, getStorefrontConfig } from '@/lib/storefront'
import { notFound } from 'next/navigation'

export const revalidate = 60

interface ProductoDetallePageProps {
  params: Promise<{
    slug: string
  }>
}

export default async function ProductoDetallePage({ params }: ProductoDetallePageProps) {
  const { slug } = await params
  const data = await getProductoDetalleBySlug(slug)

  if (!data) {
    notFound()
  }

  const { producto, relacionados } = data
  const config = await getStorefrontConfig()
  const categoriaHref = producto.categoria.slug ? `/categoria/${producto.categoria.slug}` : '/categorias'

  return (
    <>
      <Header />
      <main className="bg-white">
        <section className="border-b border-gray-200 bg-[var(--surface-soft)] py-3">
          <div className="section-shell text-xs font-semibold uppercase tracking-[0.11em] text-gray-500">
            <a href="/" className="hover:text-primary">Inicio</a>
            <span className="mx-2">/</span>
            <a href="/productos" className="hover:text-primary">Productos</a>
            {producto.categoria.nombre ? (
              <>
                <span className="mx-2">/</span>
                <a href={categoriaHref} className="hover:text-primary">{producto.categoria.nombre}</a>
              </>
            ) : null}
            <span className="mx-2">/</span>
            <span className="text-gray-800">{producto.nombre}</span>
          </div>
        </section>

        <section className="py-8 sm:py-10">
          <div className="section-shell">
            <ProductDetailView producto={producto} whatsapp={config.whatsapp} ecommerceEnabled={config.ecommerceEnabled} />
          </div>
        </section>

        {relacionados.length > 0 ? (
          <section className="border-t border-gray-200 bg-[var(--surface-soft)] py-10">
            <div className="section-shell">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <span className="section-eyebrow">Relacionados</span>
                  <h2 className="section-heading mb-1">Tambien te puede interesar</h2>
                  <p className="section-copy">Seleccion de productos similares por categoria y marca.</p>
                </div>
                <a href="/productos" className="store-button-secondary">
                  Ver catalogo
                </a>
              </div>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {relacionados.slice(0, 4).map((item, index) => (
                  <TarjetaProducto key={`${producto.id}-rel-${item.id}`} producto={item} index={index} />
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </main>
      <Footer />
    </>
  )
}

