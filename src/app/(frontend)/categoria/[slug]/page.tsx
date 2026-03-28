import Footer from '@/components/Footer'
import Header from '@/components/Header'
import TarjetaProducto from '@/components/TarjetaProducto'
import { getCategoriaBySlug, getProductList, PRODUCTS_PER_PAGE } from '@/lib/storefront'
import { notFound } from 'next/navigation'

export const revalidate = 60

interface CategoriaPageProps {
  params: Promise<{
    slug: string
  }>
  searchParams: Promise<{
    page?: string
  }>
}

const parsePage = (value?: string) => {
  const parsed = Number(value)
  if (Number.isNaN(parsed) || parsed < 1) return 1
  return Math.floor(parsed)
}

export default async function CategoriaPage({ params, searchParams }: CategoriaPageProps) {
  const { slug } = await params
  const { page } = await searchParams
  const currentPage = parsePage(page)

  const categoria = await getCategoriaBySlug(slug)
  if (!categoria) {
    notFound()
  }

  const { productos, totalDocs, totalPages, hasPrevPage, hasNextPage } = await getProductList({
    page: currentPage,
    limit: PRODUCTS_PER_PAGE,
    categoriaId: String(categoria.id),
  })

  const prevHref = `/categoria/${slug}?page=${Math.max(currentPage - 1, 1)}`
  const nextHref = `/categoria/${slug}?page=${currentPage + 1}`

  return (
    <>
      <Header />
      <main>
        <section className="bg-gradient-to-r from-primary to-primary/80 py-12 text-white">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-4 flex items-center gap-4">
              <span className="text-5xl">{categoria.icono}</span>
              <div>
                <h1 className="text-4xl font-black lg:text-5xl">{categoria.nombre}</h1>
              </div>
            </div>
            <p className="text-blue-100">Encuentra todo lo que necesitas para {String(categoria.nombre).toLowerCase()}.</p>
          </div>
        </section>

        {productos.length > 0 ? (
          <section className="bg-white py-12">
            <div className="mx-auto max-w-7xl px-4">
              <p className="mb-6 text-gray-600">
                Mostrando <span className="font-bold">{productos.length}</span> de <span className="font-bold">{totalDocs}</span> productos
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
              <p className="text-lg text-gray-500">No hay productos en {categoria.nombre} en este momento.</p>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  )
}
