import Footer from '@/components/Footer'
import Header from '@/components/Header'
import TarjetaProducto from '@/components/TarjetaProducto'
import { getCategoriaBySlug, getProductList, normalizeCategorySlug, PRODUCTS_PER_PAGE } from '@/lib/storefront'
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

  const categoriaSlug = normalizeCategorySlug(categoria.slug || categoria.nombre || slug)

  const { productos, totalDocs, totalPages, hasPrevPage, hasNextPage } = await getProductList({
    page: currentPage,
    limit: PRODUCTS_PER_PAGE,
    categoriaId: String(categoria.id),
  })

  const prevHref = `/categoria/${categoriaSlug}?page=${Math.max(currentPage - 1, 1)}`
  const nextHref = `/categoria/${categoriaSlug}?page=${currentPage + 1}`

  return (
    <>
      <Header />
      <main>
        <section className="bg-gradient-to-br from-primary to-primary-dark py-12 text-white">
          <div className="section-shell">
            <a href="/categorias" className="mb-4 inline-flex items-center text-xs font-semibold uppercase tracking-[0.12em] text-white/70 hover:text-white">
              ← Volver a categorias
            </a>
            <div className="flex flex-wrap items-center gap-4">
              <span className="text-5xl">{categoria.icono || '•'}</span>
              <div>
                <h1 className="text-3xl font-black sm:text-5xl">{categoria.nombre}</h1>
                <p className="mt-2 max-w-2xl text-sm text-white/80 sm:text-base">
                  {categoria.descripcion || `Explora productos de ${String(categoria.nombre).toLowerCase()} con disponibilidad actual.`}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-12">
          <div className="section-shell">
            {productos.length > 0 ? (
              <>
                <p className="mb-6 rounded-xl border border-gray-200 bg-[var(--surface-soft)] px-4 py-3 text-sm text-gray-600">
                  Mostrando <span className="font-bold text-gray-900">{productos.length}</span> de <span className="font-bold text-gray-900">{totalDocs}</span> productos
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
                <h3>No hay productos en {categoria.nombre}</h3>
                <p>Esta categoria no tiene stock visible por ahora.</p>
                <a href="/productos" className="store-button-primary">
                  Ver catalogo completo
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
