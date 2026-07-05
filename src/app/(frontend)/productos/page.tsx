import CatalogFilters, { type CatalogFilterGroup } from '@/components/CatalogFilters'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import TarjetaProducto from '@/components/TarjetaProducto'
import {
  getCategoriaBySlug,
  getCategoriasData,
  getMarcasData,
  getProductList,
  getTallasDisponibles,
  PRODUCTS_PER_PAGE,
  type ProductSort,
} from '@/lib/storefront'

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
    categoria?: string
    coleccion?: string
    marca?: string
    talla?: string
    precioMin?: string
    precioMax?: string
    oferta?: string
    disponible?: string
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

const parsePrecio = (value?: string): number | undefined => {
  if (!value) return undefined
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) return undefined
  return parsed
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

const priceRanges = [
  { label: 'Hasta S/ 100', min: undefined as number | undefined, max: 100 },
  { label: 'S/ 100 a S/ 200', min: 100, max: 200 },
  { label: 'S/ 200 a S/ 300', min: 200, max: 300 },
  { label: 'S/ 300 a S/ 500', min: 300, max: 500 },
  { label: 'Mas de S/ 500', min: 500, max: undefined as number | undefined },
]

export default async function ProductosPage({ searchParams }: ProductosPageProps) {
  const { segmento, categoria, coleccion, marca, talla, precioMin, precioMax, oferta, disponible, page, search, sort } = await searchParams
  const currentPage = parsePage(page)
  const normalizedSegmento = segmento && segmento in segmentMeta ? (segmento as SegmentKey) : undefined
  const onlyOffers = oferta === '1'
  const onlyAvailable = disponible === '1'
  const sortValue = parseSort(sort)
  const searchTerm = search?.trim() || undefined
  const tallaParam = talla?.trim() || undefined

  // Canonical filter param is `categoria=<slug>`. `coleccion=<slug>` (legacy links) is
  // still read here for backward compatibility, but every generated link below uses
  // `categoria` only - there is no special-cased "calzado" logic anymore.
  const categoriaSlugParam = (categoria || coleccion || '').trim() || undefined

  let precioMinValue = parsePrecio(precioMin)
  let precioMaxValue = parsePrecio(precioMax)
  if (precioMinValue !== undefined && precioMaxValue !== undefined && precioMinValue > precioMaxValue) {
    precioMinValue = undefined
    precioMaxValue = undefined
  }

  const [categoriaDoc, categorias, marcas, tallasDisponibles] = await Promise.all([
    categoriaSlugParam ? getCategoriaBySlug(categoriaSlugParam) : Promise.resolve(null),
    getCategoriasData(),
    getMarcasData(),
    getTallasDisponibles(),
  ])

  const { productos, totalDocs, totalPages, hasPrevPage, hasNextPage } = await getProductList({
    page: currentPage,
    limit: PRODUCTS_PER_PAGE,
    segmento: normalizedSegmento,
    marcaSlug: marca,
    categoriaId: categoriaDoc ? String(categoriaDoc.id) : undefined,
    talla: tallaParam,
    precioMin: precioMinValue,
    precioMax: precioMaxValue,
    onlyOffers,
    onlyAvailable,
    search: searchTerm,
    sort: sortValue,
  })

  const categoriaNombre = categoriaDoc ? String(categoriaDoc.nombre || '') : ''

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
          : categoriaDoc
            ? {
                titleLead: 'Coleccion',
                titleAccent: categoriaNombre || 'Categoria',
                description: `Explora productos de la categoria ${categoriaNombre || 'seleccionada'}.`,
              }
            : {
                titleLead: 'Todo el',
                titleAccent: 'Catalogo',
                description: 'Explora zapatillas, ropa y accesorios por segmento o marca.',
              }

  const query = new URLSearchParams()
  if (segmento) query.set('segmento', segmento)
  if (categoriaSlugParam) query.set('categoria', categoriaSlugParam)
  if (marca) query.set('marca', marca)
  if (tallaParam) query.set('talla', tallaParam)
  if (precioMinValue !== undefined) query.set('precioMin', String(precioMinValue))
  if (precioMaxValue !== undefined) query.set('precioMax', String(precioMaxValue))
  if (onlyOffers) query.set('oferta', '1')
  if (onlyAvailable) query.set('disponible', '1')
  if (searchTerm) query.set('search', searchTerm)
  if (sort) query.set('sort', sortValue)

  const hasActiveFilters = Boolean(
    normalizedSegmento ||
      categoriaSlugParam ||
      marca ||
      tallaParam ||
      precioMinValue !== undefined ||
      precioMaxValue !== undefined ||
      onlyOffers ||
      onlyAvailable ||
      searchTerm ||
      sort,
  )

  const filterGroups: CatalogFilterGroup[] = [
    {
      label: 'Categoria',
      options: [
        { label: 'Todas las categorias', href: buildHref(query, { categoria: null, page: null }), active: !categoriaSlugParam },
        ...categorias.map((cat) => ({
          label: cat.nombre,
          href: buildHref(query, { categoria: cat.slug, page: null }),
          active: categoriaSlugParam === cat.slug,
        })),
      ],
    },
    {
      label: 'Publico',
      options: [
        { label: 'Todos', href: buildHref(query, { segmento: null, page: null }), active: !segmento },
        { label: 'Hombre', href: buildHref(query, { segmento: 'hombre', page: null }), active: segmento === 'hombre' },
        { label: 'Mujer', href: buildHref(query, { segmento: 'mujer', page: null }), active: segmento === 'mujer' },
        { label: 'Ninos', href: buildHref(query, { segmento: 'ninos', page: null }), active: segmento === 'ninos' },
        { label: 'Unisex', href: buildHref(query, { segmento: 'unisex', page: null }), active: segmento === 'unisex' },
      ],
    },
  ]

  if (marcas.length > 0) {
    filterGroups.push({
      label: 'Marca',
      collapseAfter: 8,
      options: [
        { label: 'Todas las marcas', href: buildHref(query, { marca: null, page: null }), active: !marca },
        ...marcas.map((brand) => ({
          label: brand.nombre,
          href: buildHref(query, { marca: brand.slug, page: null }),
          active: marca === brand.slug,
        })),
      ],
    })
  }

  if (tallasDisponibles.length > 0) {
    filterGroups.push({
      label: 'Talla',
      collapseAfter: 8,
      options: [
        { label: 'Todas las tallas', href: buildHref(query, { talla: null, page: null }), active: !tallaParam },
        ...tallasDisponibles.map((size) => ({
          label: size,
          href: buildHref(query, { talla: size, page: null }),
          active: tallaParam === size,
        })),
      ],
    })
  }

  filterGroups.push({
    label: 'Precio',
    options: [
      {
        label: 'Cualquier precio',
        href: buildHref(query, { precioMin: null, precioMax: null, page: null }),
        active: precioMinValue === undefined && precioMaxValue === undefined,
      },
      ...priceRanges.map((range) => ({
        label: range.label,
        href: buildHref(query, {
          precioMin: range.min !== undefined ? String(range.min) : null,
          precioMax: range.max !== undefined ? String(range.max) : null,
          page: null,
        }),
        active: precioMinValue === range.min && precioMaxValue === range.max,
      })),
    ],
  })

  filterGroups.push({
    label: 'Promociones',
    variant: 'checkbox',
    options: [
      {
        label: 'Solo ofertas',
        href: buildHref(query, { oferta: onlyOffers ? null : '1', page: null }),
        active: onlyOffers,
      },
    ],
  })

  filterGroups.push({
    label: 'Disponibilidad',
    variant: 'checkbox',
    options: [
      {
        label: 'Solo productos con stock',
        href: buildHref(query, { disponible: onlyAvailable ? null : '1', page: null }),
        active: onlyAvailable,
      },
    ],
  })

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
                    {categoriaSlugParam ? <input type="hidden" name="categoria" value={categoriaSlugParam} /> : null}
                    {marca ? <input type="hidden" name="marca" value={marca} /> : null}
                    {tallaParam ? <input type="hidden" name="talla" value={tallaParam} /> : null}
                    {precioMinValue !== undefined ? <input type="hidden" name="precioMin" value={precioMinValue} /> : null}
                    {precioMaxValue !== undefined ? <input type="hidden" name="precioMax" value={precioMaxValue} /> : null}
                    {onlyOffers ? <input type="hidden" name="oferta" value="1" /> : null}
                    {onlyAvailable ? <input type="hidden" name="disponible" value="1" /> : null}
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
                    <h3>No encontramos productos con estos filtros.</h3>
                    <p>Prueba ajustando los filtros para encontrar mas resultados.</p>
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
