import Footer from '@/components/Footer'
import Header from '@/components/Header'
import TarjetaProducto from '@/components/TarjetaProducto'
import { getCategoriaBySlug, getProductList, PRODUCTS_PER_PAGE } from '@/lib/storefront'

export const revalidate = 60

const segmentMeta = {
  hombre: {
    titleLead: 'Coleccion',
    titleAccent: 'Hombre',
    description: 'Calzado, ropa y accesorios deportivos para hombre.',
  },
  mujer: {
    titleLead: 'Coleccion',
    titleAccent: 'Mujer',
    description: 'Encuentra tus esenciales deportivos para mujer.',
  },
  ninos: {
    titleLead: 'Coleccion',
    titleAccent: 'Ninos',
    description: 'Todo para los pequenos deportistas de la casa.',
  },
  unisex: {
    titleLead: 'Coleccion',
    titleAccent: 'Unisex',
    description: 'Productos versatiles para cualquier atleta.',
  },
} as const

type SegmentKey = keyof typeof segmentMeta

interface ProductosPageProps {
  searchParams: Promise<{
    segmento?: string
    coleccion?: string
    marca?: string
    page?: string
  }>
}

const heroBackground = 'linear-gradient(90deg, #ff7a00 0%, #ff6f00 55%, #ff8c1a 100%)'

const parsePage = (value?: string) => {
  const parsed = Number(value)
  if (Number.isNaN(parsed) || parsed < 1) return 1
  return Math.floor(parsed)
}

const buildHref = (params: URLSearchParams, page: number) => {
  const next = new URLSearchParams(params)
  next.set('page', String(page))
  return `/productos?${next.toString()}`
}

export default async function ProductosPage({ searchParams }: ProductosPageProps) {
  const { segmento, coleccion, marca, page } = await searchParams
  const currentPage = parsePage(page)
  const normalizedSegmento = segmento && segmento in segmentMeta ? (segmento as SegmentKey) : undefined
  const categoriaCalzado = coleccion === 'calzado' ? await getCategoriaBySlug('calzado') : null

  const { productos, totalDocs, totalPages, hasPrevPage, hasNextPage } = await getProductList({
    page: currentPage,
    limit: PRODUCTS_PER_PAGE,
    segmento: normalizedSegmento,
    marcaSlug: marca,
    categoriaId: categoriaCalzado ? String(categoriaCalzado.id) : undefined,
  })

  const heroContent = normalizedSegmento
    ? segmentMeta[normalizedSegmento]
    : coleccion === 'calzado'
      ? {
          titleLead: 'Coleccion',
          titleAccent: 'Calzado',
          description: 'Modelos deportivos para cada ritmo y entrenamiento.',
        }
      : {
          titleLead: 'Todos Nuestros',
          titleAccent: 'Productos',
          description: 'Explora nuestra coleccion completa de equipamiento deportivo.',
        }

  const query = new URLSearchParams()
  if (segmento) query.set('segmento', segmento)
  if (coleccion) query.set('coleccion', coleccion)
  if (marca) query.set('marca', marca)

  return (
    <>
      <Header />
      <main>
        <section className="py-12 text-white" style={{ background: heroBackground }}>
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-4 inline-flex rounded-full border border-white/25 bg-white/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/90">
              {normalizedSegmento ? `Segmento ${normalizedSegmento}` : coleccion === 'calzado' ? 'Linea calzado' : 'Catalogo completo'}
            </div>
            <h1 className="mb-2 text-4xl font-black tracking-tight lg:text-5xl">
              <span className="text-[#fff7ef]">{heroContent.titleLead} </span>
              <span className="text-primary">{heroContent.titleAccent}</span>
            </h1>
            <p className="max-w-2xl text-[#fff1dd]">{heroContent.description}</p>
          </div>
        </section>

        {productos.length > 0 ? (
          <section className="bg-white py-12">
            <div className="mx-auto max-w-7xl px-4">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <p className="text-gray-600">
                  Mostrando <span className="font-bold">{productos.length}</span> de <span className="font-bold">{totalDocs}</span> productos
                </p>
                {(normalizedSegmento || coleccion || marca) && (
                  <a
                    href="/productos"
                    className="rounded-full border border-primary px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
                  >
                    Ver todo el catalogo
                  </a>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {productos.map((p, i) => (
                  <TarjetaProducto key={p.id} producto={p} index={i} />
                ))}
              </div>

              <div className="mt-8 flex items-center justify-center gap-3">
                {hasPrevPage ? (
                  <a
                    href={buildHref(query, currentPage - 1)}
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
                    href={buildHref(query, currentPage + 1)}
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
              <p className="text-lg text-gray-500">No hay productos disponibles para este filtro.</p>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  )
}
