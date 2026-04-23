import Footer from '@/components/Footer'
import Header from '@/components/Header'
import TarjetaProducto from '@/components/TarjetaProducto'
import { getProductList, PRODUCTS_PER_PAGE } from '@/lib/storefront'

export const revalidate = 60

const heroBackground = 'linear-gradient(90deg, #ff7a00 0%, #ff6f00 55%, #ff8c1a 100%)'

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
        <section className="py-12 text-white" style={{ background: heroBackground }}>
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-4 inline-flex rounded-full border border-white/25 bg-white/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/90">
              Promociones activas
            </div>
            <h1 className="mb-2 text-4xl font-black tracking-tight lg:text-5xl">
              <span className="text-[#fff7ef]">Nuestras </span>
              <span className="text-primary">Ofertas</span>
            </h1>
            <p className="max-w-2xl text-[#fff1dd]">Descuentos especiales en productos seleccionados de las mejores marcas.</p>
          </div>
        </section>

        {productos.length > 0 ? (
          <section className="bg-white py-12">
            <div className="mx-auto max-w-7xl px-4">
              <p className="mb-6 text-gray-600">
                Mostrando <span className="font-bold">{productos.length}</span> de <span className="font-bold">{totalDocs}</span> productos en oferta
              </p>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {productos.map((p, i) => (
                  <TarjetaProducto key={p.id} producto={p} index={i} />
                ))}
              </div>

              <div className="mt-8 flex items-center justify-center gap-3">
                {hasPrevPage ? (
                  <a
                    href={prevHref}
                    className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Anterior
                  </a>
                ) : (
                  <span className="cursor-not-allowed rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-300">
                    Anterior
                  </span>
                )}

                <span className="text-sm font-semibold text-gray-700">
                  Pagina {currentPage} de {Math.max(totalPages, 1)}
                </span>

                {hasNextPage ? (
                  <a
                    href={nextHref}
                    className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Siguiente
                  </a>
                ) : (
                  <span className="cursor-not-allowed rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-300">
                    Siguiente
                  </span>
                )}
              </div>
            </div>
          </section>
        ) : (
          <section className="bg-white py-20 text-center">
            <div className="mx-auto max-w-2xl">
              <p className="text-lg text-gray-500">No hay ofertas disponibles en este momento.</p>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  )
}
