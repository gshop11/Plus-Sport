import Footer from '@/components/Footer'
import Header from '@/components/Header'
import TarjetaProducto from '@/components/TarjetaProducto'
import { getProductList, PRODUCTS_PER_PAGE } from '@/lib/storefront'

export const revalidate = 60

interface OfertasPageProps {
  searchParams: Promise<{
    page?: string
  }>
}

const parsePage = (value?: string) => {
  const parsed = Number(value)
  if (Number.isNaN(parsed) || parsed < 1) return 1
  return Math.floor(parsed)
}

export default async function OfertasPage({ searchParams }: OfertasPageProps) {
  const { page } = await searchParams
  const currentPage = parsePage(page)

  const { productos, totalDocs, totalPages, hasPrevPage, hasNextPage } = await getProductList({
    page: currentPage,
    limit: PRODUCTS_PER_PAGE,
    onlyOffers: true,
  })

  const prevHref = `/ofertas?page=${Math.max(currentPage - 1, 1)}`
  const nextHref = `/ofertas?page=${currentPage + 1}`

  return (
    <>
      <Header />
      <main>
        <section className="bg-gradient-to-br from-accent to-accent-dark py-12 text-white">
          <div className="section-shell">
            <span className="mb-4 inline-flex rounded-full border border-white/25 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/90">
              Promociones activas
            </span>
            <h1 className="mb-3 text-3xl font-black sm:text-5xl">Ofertas en zapatillas y moda deportiva</h1>
            <p className="max-w-2xl text-sm text-white/80 sm:text-base">Descuentos visibles y comparacion clara de precio para acelerar la decision de compra.</p>
          </div>
        </section>

        <section className="bg-white py-12">
          <div className="section-shell">
            {productos.length > 0 ? (
              <>
                <p className="mb-6 rounded-xl border border-gray-200 bg-[var(--surface-soft)] px-4 py-3 text-sm text-gray-600">
                  Mostrando <span className="font-bold text-gray-900">{productos.length}</span> de <span className="font-bold text-gray-900">{totalDocs}</span> productos en oferta
                </p>
                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  {productos.map((producto, index) => (
                    <TarjetaProducto key={producto.id} producto={producto} index={index} />
                  ))}
                </div>

                <div className="mt-8 flex items-center justify-center gap-3">
                  {hasPrevPage ? (
                    <a href={prevHref} className="store-button-secondary px-4 py-2">
                      Anterior
                    </a>
                  ) : (
                    <span className="cursor-not-allowed rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-300">Anterior</span>
                  )}
                  <span className="text-sm font-semibold text-gray-700">
                    Pagina {currentPage} de {Math.max(totalPages, 1)}
                  </span>
                  {hasNextPage ? (
                    <a href={nextHref} className="store-button-secondary px-4 py-2">
                      Siguiente
                    </a>
                  ) : (
                    <span className="cursor-not-allowed rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-300">Siguiente</span>
                  )}
                </div>
              </>
            ) : (
              <div className="store-empty-state">
                <h3>No hay ofertas activas por ahora</h3>
                <p>Vuelve pronto o revisa el catalogo completo para descubrir nuevos ingresos.</p>
                <a href="/productos" className="store-button-primary">
                  Ir al catalogo
                </a>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
