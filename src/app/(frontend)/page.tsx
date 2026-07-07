import type { Metadata } from 'next'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import HeroSlider from '@/components/HeroSlider'
import StoreRail from '@/components/StoreRail'
import TarjetaProducto from '@/components/TarjetaProducto'
import { normalizeWhatsappNumber } from '@/lib/availability-inquiry'
import { getHomeData } from '@/lib/storefront'
import type { HomeCategory, HomeSectionConfig } from '@/lib/storefront-types'

export const revalidate = 60

export const metadata: Metadata = {
  alternates: { canonical: '/' },
}

const defaultSubscriptionSection: HomeSectionConfig = {
  key: 'suscripcion',
  titulo: 'Atencion comercial por WhatsApp',
  subtitulo: 'Escribenos y te ayudamos a encontrar tu talla y coordinar tu compra.',
  mostrar: true,
  orden: 9,
}

const getCategoryDedupeKeys = ({ id, slug }: HomeCategory) => [id, slug, `/categoria/${slug}`].filter(Boolean)

const mergeHomeCategories = (mainCategories: HomeCategory[], generalCategories: HomeCategory[]) => {
  const seen = new Set<string>()
  const categories: HomeCategory[] = []

  for (const category of [...mainCategories, ...generalCategories]) {
    const keys = getCategoryDedupeKeys(category)

    if (keys.some((key) => seen.has(key))) continue
    keys.forEach((key) => seen.add(key))
    categories.push(category)
  }

  return categories
}

const renderMainCategoryCard = ({ nombre, slug, imagenUrl }: HomeCategory) => (
  <a
    href={`/categoria/${slug}`}
    key={slug}
    className="store-main-category-card"
    style={{
      backgroundImage: imagenUrl
        ? `linear-gradient(156deg, rgba(13,23,87,0.82), rgba(13,23,87,0.32)), url(${imagenUrl})`
        : 'linear-gradient(156deg, rgba(13,23,87,0.82), rgba(13,23,87,0.42))',
    }}
  >
    <span className="store-main-category-card__name">{nombre}</span>
    <span className="store-main-category-card__action">Ver coleccion</span>
  </a>
)

export default async function HomePage() {
  const {
    banners,
    promotionalProducts,
    newArrivalProducts,
    mainCategories,
    generalCategories,
    brands,
    config,
  } = await getHomeData()

  const subscriptionSection = config.homeSections.find((section) => section.key === 'suscripcion' && section.mostrar) ?? defaultSubscriptionSection
  const homeCategories = mergeHomeCategories(mainCategories, generalCategories)

  return (
    <>
      <Header />
      <main className="store-home-shell">
        <section className="store-hero-section">
          <HeroSlider slides={banners} />
        </section>

        {brands.length > 0 ? (
          <section className="store-section store-section--brand">
            <div className="store-home-container">
              <div className="store-section-header store-section-header--split">
                <div>
                  <span className="store-section-eyebrow">Marcas</span>
                  <h2 className="store-section-title">Elige por marca</h2>
                  <p className="store-section-copy">Accesos de marca conectados al catalogo.</p>
                </div>
                <a href="/marcas" className="store-section-link">
                  Ver todas las marcas
                  <span aria-hidden="true" className="store-section-link__chevron">
                    ›
                  </span>
                </a>
              </div>

              <StoreRail
                ariaLabel="Marcas disponibles"
                previousLabel="Ver marcas anteriores"
                nextLabel="Ver mas marcas"
                staticThreshold={3}
                className="store-brand-rail"
                mode="cyclic"
                autoplay
                autoplayInterval={3200}
                visibleItems={{ mobile: 2, tablet: 3, desktop: 4 }}
              >
                {brands.map(({ nombre, id, slug }) => (
                  <a key={id} href={`/productos?marca=${slug}`} className="store-brand-card">
                    <span className="store-brand-card__name">{nombre}</span>
                    <span className="store-brand-card__action">Ver coleccion</span>
                  </a>
                ))}
              </StoreRail>
            </div>
          </section>
        ) : null}

        {homeCategories.length > 0 ? (
          <section className="store-section store-section--soft">
            <div className="store-home-container">
              <div className="store-section-header store-section-header--split">
                <div>
                  <span className="store-section-eyebrow">Categorias</span>
                  <h2 className="store-section-title">Compra por categoria</h2>
                  <p className="store-section-copy">Accesos activos del catalogo reunidos en un solo carrusel.</p>
                </div>
                <a href="/categorias" className="store-section-link">
                  Ver todas las categorias
                  <span aria-hidden="true" className="store-section-link__chevron">
                    ›
                  </span>
                </a>
              </div>

              <StoreRail
                ariaLabel="Categorias"
                previousLabel="Ver categorias anteriores"
                nextLabel="Ver mas categorias"
                staticThreshold={3}
                className="store-main-category-rail"
                mode="cyclic"
                autoplay
                autoplayInterval={3600}
                visibleItems={{ mobile: 1, tablet: 3, desktop: 5 }}
              >
                {homeCategories.map(renderMainCategoryCard)}
              </StoreRail>
            </div>
          </section>
        ) : null}

        <section className="store-section store-section--soft">
          <div className="store-home-container">
            <div className="store-section-header store-section-header--split">
              <div>
                <span className="store-section-eyebrow">Ofertas</span>
                <h2 className="store-section-title">Productos en oferta</h2>
                <p className="store-section-copy">Productos seleccionados con precios especiales.</p>
              </div>
              {promotionalProducts.length > 0 ? (
                <a href="/productos?oferta=1" className="store-section-link">
                  Ver todas las ofertas
                  <span aria-hidden="true" className="store-section-link__chevron">
                    ›
                  </span>
                </a>
              ) : null}
            </div>
            {promotionalProducts.length > 0 ? (
              <StoreRail
                ariaLabel="Productos en oferta"
                previousLabel="Ver ofertas anteriores"
                nextLabel="Ver mas ofertas"
                staticThreshold={3}
                className="store-product-rail"
                mode="cyclic"
                autoplay
                autoplayInterval={4000}
                visibleItems={{ mobile: 1, tablet: 3, desktop: 5 }}
              >
                {promotionalProducts.map((producto, index) => (
                  <TarjetaProducto key={`promocion-${producto.id}`} producto={producto} index={index} variant="homeOffer" />
                ))}
              </StoreRail>
            ) : (
              <div className="store-empty-state">
                <h3>No hay ofertas activas por ahora.</h3>
                <p>Vuelve pronto o explora el catalogo completo mientras tanto.</p>
                <a href="/productos" className="store-button-primary">
                  Ver catalogo completo
                </a>
              </div>
            )}
          </div>
        </section>

        {newArrivalProducts.length > 0 ? (
          <section className="store-section">
            <div className="store-home-container">
              <div className="store-section-header store-section-header--split">
                <div>
                  <span className="store-section-eyebrow">Nuevos ingresos</span>
                  <h2 className="store-section-title">Recien llegados</h2>
                  <p className="store-section-copy">Productos conectados al dataset semantico de novedades.</p>
                </div>
                <a href="/productos?sort=newest" className="store-section-link">
                  Ver todas las novedades
                  <span aria-hidden="true" className="store-section-link__chevron">
                    ›
                  </span>
                </a>
              </div>
              <StoreRail
                ariaLabel="Nuevos ingresos"
                previousLabel="Ver novedades anteriores"
                nextLabel="Ver mas novedades"
                staticThreshold={3}
                className="store-product-rail store-new-arrivals-rail"
                mode="cyclic"
                autoplay
                autoplayInterval={4200}
                visibleItems={{ mobile: 1, tablet: 3, desktop: 5 }}
              >
                {newArrivalProducts.map((producto, index) => (
                  <TarjetaProducto key={`nuevo-${producto.id}`} producto={producto} index={index} variant="homeNewArrival" />
                ))}
              </StoreRail>
            </div>
          </section>
        ) : null}

        {subscriptionSection.mostrar ? (
          <section className="store-section store-section--subscription">
            <div className="store-home-container">
              <div className="store-panel overflow-hidden bg-gradient-to-br from-primary to-primary-dark text-white">
                <div className="grid gap-4 px-6 py-8 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
                  <div>
                    <span className="mb-3 inline-flex rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-white/85">
                      Comunidad Plus-Sport
                    </span>
                    <h2 className="mb-2 text-3xl font-black sm:text-4xl">{subscriptionSection.titulo}</h2>
                    {subscriptionSection.subtitulo ? <p className="max-w-xl text-sm text-white/80 sm:text-base">{subscriptionSection.subtitulo}</p> : null}
                    <div className="mt-5 flex flex-wrap gap-2">
                      <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.11em] text-white/80">Atencion personalizada</span>
                      <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.11em] text-white/80">Consulta de talla y stock</span>
                      <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.11em] text-white/80">Coordinacion de entrega</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-center rounded-2xl bg-white/95 p-6 text-center shadow-xl">
                    <a
                      href={`https://wa.me/${normalizeWhatsappNumber(config.whatsapp.numero)}?text=${encodeURIComponent('Hola, quiero recibir informacion de productos y ofertas de Plus Sport.')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="store-button-primary w-full text-center"
                    >
                      {config.whatsapp.textoBoton || 'Escribir por WhatsApp'}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </main>
      <Footer />
    </>
  )
}
