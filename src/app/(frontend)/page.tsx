import Footer from '@/components/Footer'
import FormSuscribir from '@/components/FormSuscribir'
import Header from '@/components/Header'
import HeroSlider from '@/components/HeroSlider'
import StoreRail from '@/components/StoreRail'
import TarjetaProducto from '@/components/TarjetaProducto'
import { getHomeData } from '@/lib/storefront'
import type { HomeCategory, HomeSectionConfig } from '@/lib/storefront-types'

export const revalidate = 60

// Temporary static promo bar until this slot is managed from content.
const TEMP_PROMO_BAR = {
  message: 'Explora la seleccion Plus Sport para entrenar, caminar y renovar tus esenciales.',
  cta: 'Ver catalogo',
  href: '/productos',
} as const

const defaultSubscriptionSection: HomeSectionConfig = {
  key: 'suscripcion',
  titulo: 'Ofertas exclusivas para ti',
  subtitulo: 'Dejanos tu WhatsApp y te avisamos primero.',
  mostrar: true,
  orden: 9,
}

const renderCategoryCard = ({ nombre, slug, descripcion, imagenUrl }: HomeCategory, index: number) => (
  <a
    href={`/categoria/${slug}`}
    key={slug}
    className={`group relative overflow-hidden rounded-3xl border border-[var(--line-soft)] bg-white shadow-[0_18px_44px_-34px_rgba(13,23,87,0.62)] transition-all hover:-translate-y-1 hover:shadow-[0_28px_54px_-36px_rgba(13,23,87,0.7)] ${
      index === 0 ? 'sm:col-span-2 lg:col-span-2 lg:row-span-2' : ''
    }`}
  >
    <div
      className="absolute inset-0"
      style={{
        backgroundImage: imagenUrl
          ? `linear-gradient(156deg, rgba(13,23,87,0.82), rgba(13,23,87,0.3)), url(${imagenUrl})`
          : 'linear-gradient(156deg, rgba(13,23,87,0.82), rgba(13,23,87,0.4))',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    />
    <div className="relative flex h-full flex-col justify-end p-4 text-white">
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70">Categoria</p>
      <p className="mb-1 text-2xl font-black uppercase">{nombre}</p>
      <p className="line-clamp-2 text-sm text-white/80">{descripcion || 'Modelos y ropa para esta categoria.'}</p>
    </div>
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

  const visibleNewArrivals = newArrivalProducts.slice(0, 4)
  const subscriptionSection = config.homeSections.find((section) => section.key === 'suscripcion' && section.mostrar) ?? defaultSubscriptionSection

  return (
    <>
      <Header />
      <main className="store-home-shell">
        <section className="store-promo-strip">
          <div className="store-home-container store-promo-strip__inner">
            <p className="font-semibold">{TEMP_PROMO_BAR.message}</p>
            <a href={TEMP_PROMO_BAR.href} className="store-section-cta">
              {TEMP_PROMO_BAR.cta}
            </a>
          </div>
        </section>

        <section className="store-hero-section">
          <HeroSlider slides={banners} />
        </section>

        {brands.length > 0 ? (
          <section className="store-section store-section--brand">
            <div className="store-home-container">
              <div className="store-section-header">
                <span className="store-section-eyebrow">Marcas</span>
                <h2 className="store-section-title">Elige por marca</h2>
                <p className="store-section-copy">Accesos de marca conectados al catalogo.</p>
              </div>

              <StoreRail
                ariaLabel="Marcas disponibles"
                previousLabel="Ver marcas anteriores"
                nextLabel="Ver mas marcas"
                staticThreshold={3}
                className="store-brand-rail"
                mode="cyclic"
                autoplay
                autoplayInterval={5500}
                visibleItems={{ mobile: 1, tablet: 2, desktop: 3 }}
              >
                {brands.map(({ nombre, id, slug, logoUrl }) => (
                  <a key={id} href={`/productos?marca=${slug}`} className="store-brand-card">
                    <span className="store-brand-card__logo" aria-hidden={!logoUrl}>
                      {logoUrl ? <img src={logoUrl} alt={`Logo de ${nombre}`} /> : <span>{nombre}</span>}
                    </span>
                    <span className="store-brand-card__name">{nombre}</span>
                    <span className="store-brand-card__action">Ver coleccion</span>
                  </a>
                ))}
              </StoreRail>
            </div>
          </section>
        ) : null}

        {promotionalProducts.length > 0 ? (
          <section className="store-section store-section--soft">
            <div className="store-home-container">
              <div className="store-section-header store-section-header--split">
                <div>
                  <span className="store-section-eyebrow">Promociones</span>
                  <h2 className="store-section-title">Productos promocionales</h2>
                  <p className="store-section-copy">Seleccion conectada a la regla comercial de promociones.</p>
                </div>
                <a href="/productos?oferta=1" className="store-section-cta">
                  Ver promociones
                </a>
              </div>
              <StoreRail
                ariaLabel="Productos en oferta"
                previousLabel="Ver ofertas anteriores"
                nextLabel="Ver mas ofertas"
                staticThreshold={3}
                className="store-product-rail"
                mode="cyclic"
                autoplay
                autoplayInterval={6500}
                visibleItems={{ mobile: 1, tablet: 2, desktop: 3 }}
              >
                {promotionalProducts.map((producto, index) => (
                  <TarjetaProducto key={`promocion-${producto.id}`} producto={producto} index={index} />
                ))}
              </StoreRail>
            </div>
          </section>
        ) : null}

        {mainCategories.length > 0 ? (
          <section className="store-section store-section--soft">
            <div className="store-home-container">
              <div className="store-section-header">
                <span className="store-section-eyebrow">Categorias principales</span>
                <h2 className="store-section-title">Compra por categoria</h2>
                <p className="store-section-copy">Accesos principales para orientar la navegacion del home.</p>
              </div>

              <div className="grid auto-rows-[168px] gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {mainCategories.map(renderCategoryCard)}
              </div>
            </div>
          </section>
        ) : null}

        {visibleNewArrivals.length > 0 ? (
          <section className="store-section">
            <div className="store-home-container">
              <div className="store-section-header store-section-header--split">
                <div>
                  <span className="store-section-eyebrow">Nuevos ingresos</span>
                  <h2 className="store-section-title">Recien llegados</h2>
                  <p className="store-section-copy">Productos conectados al dataset semantico de novedades.</p>
                </div>
                <a href="/productos?sort=newest" className="store-section-cta">
                  Ver novedades
                </a>
              </div>
              <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
                {visibleNewArrivals.map((producto, index) => (
                  <TarjetaProducto key={`nuevo-${producto.id}`} producto={producto} index={index} />
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {generalCategories.length > 0 ? (
          <section className="store-section store-section--soft">
            <div className="store-home-container">
              <div className="store-section-header">
                <span className="store-section-eyebrow">Mas categorias</span>
                <h2 className="store-section-title">Explora el catalogo</h2>
                <p className="store-section-copy">Categorias activas adicionales sin repetir las principales.</p>
              </div>

              <div className="grid auto-rows-[168px] gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {generalCategories.map(renderCategoryCard)}
              </div>
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
                      <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.11em] text-white/80">Drops semanales</span>
                      <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.11em] text-white/80">Ofertas privadas</span>
                      <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.11em] text-white/80">Stock primero</span>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white/95 p-4 text-left text-gray-800 shadow-xl">
                    <FormSuscribir />
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
