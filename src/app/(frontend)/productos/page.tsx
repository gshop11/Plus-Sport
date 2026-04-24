import Footer from '@/components/Footer'
import Header from '@/components/Header'
import TarjetaProducto from '@/components/TarjetaProducto'
import { getCategoriaBySlug, getMarcasData, getProductList, PRODUCTS_PER_PAGE, type ProductSort } from '@/lib/storefront'

export const revalidate = 60

const segmentMeta = {
  hombre: {
    titleLead: 'Coleccion',
    titleAccent: 'Hombre',
    description: 'Sneakers, training y streetwear pensado para hombre.',
  },
  mujer: {
    titleLead: 'Coleccion',
    titleAccent: 'Mujer',
    description: 'Modelos deportivos y lifestyle para mujer.',
  },
  ninos: {
    titleLead: 'Coleccion',
    titleAccent: 'Ninos',
    description: 'Opciones comodas y resistentes para ninos.',
  },
  unisex: {
    titleLead: 'Coleccion',
    titleAccent: 'Unisex',
    description: 'Productos versatiles para cualquier estilo deportivo.',
  },
} as const

type SegmentKey = keyof typeof segmentMeta

interface ProductosPageProps {
  searchParams: Promise<{
    segmento?: string
    coleccion?: string
    marca?: string
    oferta?: string
    page?: string
    search?: string
    sort?: string
  }>
}

const parsePage = (value?: string) => {
  const parsed = Number(value)
  if (Number.isNaN(parsed) || parsed < 1) return 1
  return Math.floor(parsed)
}

const allowedSorts: ProductSort[] = ['newest', 'price_asc', 'price_desc', 'name_asc']

const parseSort = (value?: string): ProductSort => {
  if (!value) return 'newest'
  return allowedSorts.includes(value as ProductSort) ? (value as ProductSort) : 'newest'
}

const buildHref = (params: URLSearchParams, updates?: Record<string, string | null | undefined>) => {
  const next = new URLSearchParams(params)
  if (updates) {
    Object.entries(updates).forEach(([key, value]) => {
      if (!value) {
        next.delete(key)
        return
      }
      next.set(key, value)
    })
  }
  const query = next.toString()
  return query ? `/productos?${query}` : '/productos'
}

export default async function ProductosPage({ searchParams }: ProductosPageProps) {
  const { segmento, coleccion, marca, oferta, page, search, sort } = await searchParams
  const currentPage = parsePage(page)
  const normalizedSegmento = segmento && segmento in segmentMeta ? (segmento as SegmentKey) : undefined
  const onlyOffers = oferta === '1'
  const sortValue = parseSort(sort)
  const categoriaCalzado = coleccion === 'calzado' ? await getCategoriaBySlug('calzado') : null
  const searchTerm = search?.trim() || undefined
  const marcas = await getMarcasData()

  const { productos, totalDocs, totalPages, hasPrevPage, hasNextPage } = await getProductList({
    page: currentPage,
    limit: PRODUCTS_PER_PAGE,
    segmento: normalizedSegmento,
    marcaSlug: marca,
    categoriaId: categoriaCalzado ? String(categoriaCalzado.id) : undefined,
    onlyOffers,
    search: searchTerm,
    sort: sortValue,
  })

  const heroContent = searchTerm
    ? {
        titleLead: 'Resultados para',
        titleAccent: `"${searchTerm}"`,
        description: `${totalDocs} producto${totalDocs !== 1 ? 's' : ''} encontrado${totalDocs !== 1 ? 's' : ''}.`,
      }
    : normalizedSegmento && onlyOffers
      ? {
          titleLead: 'Ofertas para',
          titleAccent: segmentMeta[normalizedSegmento].titleAccent,
          description: `Descuentos activos en ${segmentMeta[normalizedSegmento].titleAccent.toLowerCase()}.`,
        }
      : normalizedSegmento
        ? segmentMeta[normalizedSegmento]
        : onlyOffers
          ? {
              titleLead: 'Productos en',
              titleAccent: 'Oferta',
              description: 'Precios especiales en productos seleccionados.',
            }
          : coleccion === 'calzado'
            ? {
                titleLead: 'Coleccion',
                titleAccent: 'Calzado',
                description: 'Modelos deportivos para uso diario y entrenamiento.',
              }
            : {
                titleLead: 'Todo el',
                titleAccent: 'Catalogo',
                description: 'Explora zapatillas, ropa y accesorios por segmento o marca.',
              }

  const query = new URLSearchParams()
  if (segmento) query.set('segmento', segmento)
  if (coleccion) query.set('coleccion', coleccion)
  if (marca) query.set('marca', marca)
  if (onlyOffers) query.set('oferta', '1')
  if (searchTerm) query.set('search', searchTerm)
  if (sortValue && sortValue !== 'newest') query.set('sort', sortValue)

  const quickBrandFilters = marca ? marcas.filter((item) => item.slug === marca) : marcas.slice(0, 6)

  return (
    <>
      <Header />
      <main>
        <section className="bg-gradient-to-br from-primary to-primary-dark py-12 text-white">
          <div className="section-shell">
            <span className="mb-4 inline-flex rounded-full border border-white/25 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/90">
              Catalogo Plus-Sport
            </span>
            <h1 className="mb-3 text-3xl font-black sm:text-5xl">
              <span className="text-white/85">{heroContent.titleLead} </span>
              <span className="text-[#ffd8b5]">{heroContent.titleAccent}</span>
            </h1>
            <p className="max-w-2xl text-sm text-white/80 sm:text-base">{heroContent.description}</p>
          </div>
        </section>

        <section className="bg-white py-6">
          <div className="section-shell space-y-4">
            <div className="flex flex-wrap gap-2">
              <a href={buildHref(query, { segmento: 'hombre', page: null })} className={`store-chip ${segmento === 'hombre' ? '!bg-primary !text-white !border-primary' : ''}`}>Hombre</a>
              <a href={buildHref(query, { segmento: 'mujer', page: null })} className={`store-chip ${segmento === 'mujer' ? '!bg-primary !text-white !border-primary' : ''}`}>Mujer</a>
              <a href={buildHref(query, { segmento: 'ninos', page: null })} className={`store-chip ${segmento === 'ninos' ? '!bg-primary !text-white !border-primary' : ''}`}>Ninos</a>
              <a href={buildHref(query, { coleccion: 'calzado', page: null })} className={`store-chip ${coleccion === 'calzado' ? '!bg-primary !text-white !border-primary' : ''}`}>Calzado</a>
              <a href={buildHref(query, { oferta: onlyOffers ? null : '1', page: null })} className={`store-chip ${onlyOffers ? '!bg-accent !text-white !border-accent' : ''}`}>
                {onlyOffers ? 'Quitar ofertas' : 'Solo ofertas'}
              </a>
              {(normalizedSegmento || coleccion || marca || onlyOffers || searchTerm) && (
                <a href="/productos" className="store-chip">
                  Limpiar filtros
                </a>
              )}
            </div>

            {quickBrandFilters.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">Marcas:</span>
                {quickBrandFilters.map((brand) => (
                  <a
                    key={brand.id}
                    href={buildHref(query, { marca: brand.slug, page: null })}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] ${
                      marca === brand.slug
                        ? 'border-primary bg-primary text-white'
                        : 'border-gray-300 text-gray-700 hover:border-primary hover:text-primary'
                    }`}
                  >
                    {brand.nombre}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <section className="bg-white pb-14">
          <div className="section-shell">
            {productos.length > 0 ? (
              <>
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-[var(--surface-soft)] px-4 py-3">
                  <p className="text-sm text-gray-600">
                    Mostrando <span className="font-bold text-gray-900">{productos.length}</span> de <span className="font-bold text-gray-900">{totalDocs}</span> productos
                  </p>
                  <form action="/productos" method="get" className="flex items-center gap-2">
                    {segmento ? <input type="hidden" name="segmento" value={segmento} /> : null}
                    {coleccion ? <input type="hidden" name="coleccion" value={coleccion} /> : null}
                    {marca ? <input type="hidden" name="marca" value={marca} /> : null}
                    {onlyOffers ? <input type="hidden" name="oferta" value="1" /> : null}
                    {searchTerm ? <input type="hidden" name="search" value={searchTerm} /> : null}
                    <label htmlFor="sort" className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-500">
                      Ordenar
                    </label>
                    <select
                      id="sort"
                      name="sort"
                      defaultValue={sortValue}
                      className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-primary"
                    >
                      <option value="newest">Mas recientes</option>
                      <option value="price_asc">Precio: menor a mayor</option>
                      <option value="price_desc">Precio: mayor a menor</option>
                      <option value="name_asc">Nombre A-Z</option>
                    </select>
                    <button type="submit" className="store-button-secondary px-3 py-2 text-xs">
                      Aplicar
                    </button>
                  </form>
                </div>

                <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                  {productos.map((producto, index) => (
                    <TarjetaProducto key={producto.id} producto={producto} index={index} />
                  ))}
                </div>

                <div className="mt-8 flex items-center justify-center gap-3">
                  {hasPrevPage ? (
                    <a href={buildHref(query, { page: String(currentPage - 1) })} className="store-button-secondary px-4 py-2">
                      Anterior
                    </a>
                  ) : (
                    <span className="cursor-not-allowed rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-300">Anterior</span>
                  )}

                  <span className="text-sm font-semibold text-gray-700">
                    Pagina {currentPage} de {Math.max(totalPages, 1)}
                  </span>

                  {hasNextPage ? (
                    <a href={buildHref(query, { page: String(currentPage + 1) })} className="store-button-secondary px-4 py-2">
                      Siguiente
                    </a>
                  ) : (
                    <span className="cursor-not-allowed rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-300">Siguiente</span>
                  )}
                </div>
              </>
            ) : (
              <div className="store-empty-state">
                <h3>No encontramos productos para este filtro</h3>
                <p>Prueba cambiando segmento, marca u oferta para encontrar mas resultados.</p>
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
