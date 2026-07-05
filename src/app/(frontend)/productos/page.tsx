import CatalogFilters, { type CatalogFilterGroup } from '@/components/CatalogFilters'
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
  if (sort) query.set('sort', sortValue)

  const quickBrandFilters = marca ? marcas.filter((item) => item.slug === marca) : marcas.slice(0, 6)
  const hasActiveFilters = Boolean(normalizedSegmento || coleccion || marca || onlyOffers || searchTerm || sort)

  const filterGroups: CatalogFilterGroup[] = [
    {
      label: 'Publico',
      options: [
        { label: 'Todos', href: buildHref(query, { segmento: null, page: null }), active: !segmento },
        { label: 'Hombre', href: buildHref(query, { segmento: 'hombre', page: null }), active: segmento === 'hombre' },
        { label: 'Mujer', href: buildHref(query, { segmento: 'mujer', page: null }), active: segmento === 'mujer' },
        { label: 'Ninos', href: buildHref(query, { segmento: 'ninos', page: null }), active: segmento === 'ninos' },
      ],
    },
    {
      label: 'Categoria',
      options: [
        { label: 'Todas las categorias', href: buildHref(query, { coleccion: null, page: null }), active: !coleccion },
        { label: 'Calzado', href: buildHref(query, { coleccion: 'calzado', page: null }), active: coleccion === 'calzado' },
      ],
    },
    {
      label: 'Promocion',
      options: [
        {
          label: onlyOffers ? 'Quitar ofertas' : 'Solo ofertas',
          href: buildHref(query, { oferta: onlyOffers ? null : '1', page: null }),
          active: onlyOffers,
        },
      ],
    },
  ]

  if (quickBrandFilters.length > 0) {
    filterGroups.push({
      label: 'Marca',
      options: quickBrandFilters.map((brand) => ({
        label: brand.nombre,
        href: buildHref(query, { marca: brand.slug, page: null }),
        active: marca === brand.slug,
      })),
    })
  }

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

        <section className="bg-white py-6 pb-14">
          <div className="section-shell">
            <div className="lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start lg:gap-8">
              <CatalogFilters groups={filterGroups} hasActiveFilters={hasActiveFilters} resetHref="/productos" />

              <div>
                <div className="store-catalog-sort">
                  <p className="text-sm text-gray-600">
                    Mostrando <span className="font-bold text-gray-900">{productos.length}</span> de <span className="font-bold text-gray-900">{totalDocs}</span> productos
                  </p>
                  <form action="/productos" method="get" className="store-catalog-sort__form">
                    {segmento ? <input type="hidden" name="segmento" value={segmento} /> : null}
                    {coleccion ? <input type="hidden" name="coleccion" value={coleccion} /> : null}
                    {marca ? <input type="hidden" name="marca" value={marca} /> : null}
                    {onlyOffers ? <input type="hidden" name="oferta" value="1" /> : null}
                    {searchTerm ? <input type="hidden" name="search" value={searchTerm} /> : null}
                    <label htmlFor="sort" className="store-catalog-sort__label">
                      Ordenar
                    </label>
                    <select
                      id="sort"
                      name="sort"
                      defaultValue={sortValue}
                      className="store-catalog-sort__select"
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

                {productos.length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
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
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
