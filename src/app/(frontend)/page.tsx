import Footer from '@/components/Footer'
import FormSuscribir from '@/components/FormSuscribir'
import Header from '@/components/Header'
import HeroSlider from '@/components/HeroSlider'
import TarjetaProducto from '@/components/TarjetaProducto'
import { getHomeData } from '@/lib/storefront'

export const revalidate = 60

const segmentCards = [
  {
    key: 'hombre',
    label: 'Hombre',
    copy: 'Sneakers y training con enfoque en estabilidad y uso diario.',
    href: '/productos?segmento=hombre',
    fallbackBackground:
      'linear-gradient(152deg, rgba(13,23,87,0.97), rgba(13,23,87,0.76) 52%, rgba(17,24,39,0.54))',
  },
  {
    key: 'mujer',
    label: 'Mujer',
    copy: 'Siluetas nuevas con soporte deportivo y lectura premium.',
    href: '/productos?segmento=mujer',
    fallbackBackground:
      'linear-gradient(152deg, rgba(16,24,69,0.95), rgba(16,24,69,0.72) 48%, rgba(255,111,0,0.58))',
  },
  {
    key: 'ninos',
    label: 'Ninos',
    copy: 'Modelos resistentes para juego, colegio y entrenamiento.',
    href: '/productos?segmento=ninos',
    fallbackBackground:
      'linear-gradient(152deg, rgba(16,16,20,0.96), rgba(16,16,20,0.75) 48%, rgba(26,35,126,0.62))',
  },
] as const

export default async function HomePage() {
  const { slides, productos, marcas, categorias, storefront } = await getHomeData()

  const novedades = productos.slice(0, 4)
  const ofertas = productos.filter((item) => item.etiqueta === 'oferta' || Number(item.precioAnterior || 0) > Number(item.precio || 0)).slice(0, 4)
  const ofertasVisibles = ofertas.length > 0 ? ofertas : productos.slice(4, 8)
  const previewImages = productos.map((item) => item.imagenUrl).filter(Boolean) as string[]
  const segmentPreviewByKey = {
    hombre: previewImages[0],
    mujer: previewImages[1] ?? previewImages[0],
    ninos: previewImages[2] ?? previewImages[1] ?? previewImages[0],
  } as const

  return (
    <>
      <Header />
      <main>
        <HeroSlider slides={slides} />

        <section className="bg-white pb-6 pt-4 sm:pb-8 sm:pt-5">
          <div className="section-shell">
            <span className="section-eyebrow">Compra por segmento</span>
            <h2 className="section-heading mb-2">Hombre, mujer y ninos</h2>
            <p className="section-copy mb-4 max-w-2xl">Acceso directo por publico para encontrar pares y ropa en menos pasos.</p>
            <div className="grid gap-3 md:grid-cols-3 md:gap-4">
              {segmentCards.map((segment) => {
                const previewImage = segmentPreviewByKey[segment.key]
                const backgroundImage = previewImage
                  ? `linear-gradient(152deg, rgba(10,19,66,0.82), rgba(10,19,66,0.32) 52%, rgba(255,111,0,0.28)), url(${previewImage})`
                  : segment.fallbackBackground

                return (
                  <a
                    key={segment.label}
                    href={segment.href}
                    className="group relative isolate min-h-[208px] overflow-hidden rounded-3xl border border-primary/20 shadow-[0_22px_46px_-34px_rgba(13,23,87,0.66)] transition-all hover:-translate-y-1 hover:border-primary/35 hover:shadow-[0_30px_58px_-35px_rgba(13,23,87,0.78)]"
                  >
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-[1.03]"
                      style={{
                        backgroundImage,
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
                    <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-accent/28 blur-2xl" />

                    <div className="relative flex h-full flex-col justify-end p-5 text-white">
                      <span className="mb-2 inline-flex w-fit rounded-full border border-white/35 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.13em]">
                        {segment.label}
                      </span>
                      <h3 className="mb-1 text-[1.55rem] font-black uppercase tracking-[-0.01em]">{segment.label}</h3>
                      <p className="mb-4 text-sm text-white/90">{segment.copy}</p>
                      <span className="inline-flex w-fit items-center rounded-full border border-white/35 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors group-hover:bg-white/20">
                        Ver coleccion
                      </span>
                    </div>
                  </a>
                )
              })}
            </div>
          </div>
        </section>

        <section className="bg-[var(--surface-soft)] py-6">
          <div className="section-shell grid gap-3 lg:grid-cols-[1.4fr_1fr]">
            <a
              href="/productos?sort=newest"
              className="group relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary to-primary-dark p-5 text-white shadow-[0_24px_48px_-30px_rgba(16,24,77,0.8)]"
            >
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-white/70">Nuevos ingresos</p>
              <h2 className="mb-2 text-2xl font-black sm:text-3xl">Los pares que estan entrando esta semana</h2>
              <p className="mb-4 max-w-xl text-sm text-white/80">Modelos nuevos de running, lifestyle y training listos para rotacion comercial.</p>
              <span className="inline-flex rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] transition-colors group-hover:bg-white/20">
                Ver novedades
              </span>
            </a>
            <a
              href="/productos?oferta=1"
              className="group relative overflow-hidden rounded-3xl border border-accent/30 bg-gradient-to-br from-accent to-accent-dark p-5 text-white shadow-[0_24px_48px_-30px_rgba(212,85,0,0.65)]"
            >
              <div className="absolute -bottom-8 -right-8 h-28 w-28 rounded-full bg-white/15" />
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.15em] text-white/70">Oferta destacada</p>
              <h2 className="mb-2 text-xl font-black sm:text-2xl">Precios con descuento real</h2>
              <p className="mb-4 text-sm text-white/85">Ahorro visible por producto para mejorar conversion.</p>
              <span className="inline-flex rounded-full border border-white/35 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] transition-colors group-hover:bg-white/20">
                Entrar a ofertas
              </span>
            </a>
          </div>
        </section>

        {novedades.length > 0 ? (
          <section className="bg-white pb-9">
            <div className="section-shell">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <span className="section-eyebrow">Novedades</span>
                  <h2 className="section-heading mb-1">Recien llegados</h2>
                  <p className="section-copy">Selecciones para mantener la vitrina comercial siempre activa.</p>
                </div>
                <a href="/productos?sort=newest" className="store-button-secondary">
                  Ver todo
                </a>
              </div>
              <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
                {novedades.map((producto, index) => (
                  <TarjetaProducto key={`novedad-${producto.id}`} producto={producto} index={index} />
                ))}
              </div>
            </div>
          </section>
        ) : null}

        {storefront.homeSections
          .filter((section) => section.mostrar)
          .sort((a, b) => a.orden - b.orden)
          .map((section) => {
            if (section.key === 'categorias' && categorias.length > 0) {
              return (
                <section key={section.key} className="bg-[var(--surface-soft)] py-9">
                  <div className="section-shell">
                    {section.subtitulo ? <span className="section-eyebrow">{section.subtitulo}</span> : null}
                    <h2 className="section-heading mb-1">{section.titulo}</h2>
                    <p className="section-copy mb-5 max-w-2xl">Compra por deporte con paneles de alto impacto para reducir sensacion de pantalla vacia.</p>

                    <div className="grid auto-rows-[168px] gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {categorias.map(({ nombre, slug, descripcion, imagenUrl }, index) => (
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
                      ))}
                    </div>
                  </div>
                </section>
              )
            }

            if (section.key === 'marcas' && marcas.length > 0) {
              return (
                <section key={section.key} className="bg-white py-9">
                  <div className="section-shell">
                    {section.subtitulo ? <span className="section-eyebrow">{section.subtitulo}</span> : null}
                    <h2 className="section-heading mb-1">{section.titulo}</h2>
                    <p className="section-copy mb-5 max-w-2xl">Muro de marcas top para orientar el browse de sneaker/sport fashion.</p>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {marcas.map(({ nombre, id, slug, logoUrl }) => (
                        <a
                          key={id}
                          href={`/productos?marca=${slug}`}
                          className="group relative overflow-hidden rounded-3xl border border-[var(--line-soft)] bg-gradient-to-br from-white to-[var(--surface-soft)] p-5 shadow-[0_20px_42px_-36px_rgba(13,23,87,0.6)] transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_28px_52px_-35px_rgba(13,23,87,0.75)]"
                        >
                          <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-primary/10 blur-lg" />
                          <div className="relative z-10 flex min-h-[120px] flex-col items-center justify-center gap-2 text-center">
                            {logoUrl ? <img src={logoUrl} alt={nombre} className="h-8 w-auto object-contain" /> : <span className="store-chip">Marca</span>}
                            <p className="text-base font-black uppercase tracking-[0.14em] text-gray-900">{nombre}</p>
                            <span className="text-[11px] font-semibold uppercase tracking-[0.11em] text-gray-500">Ver coleccion</span>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                </section>
              )
            }

            if (section.key === 'destacados' && productos.length > 0) {
              return (
                <section key={section.key} className="bg-[var(--surface-soft)] py-9">
                  <div className="section-shell">
                    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                      <div>
                        {section.subtitulo ? <span className="section-eyebrow">{section.subtitulo}</span> : null}
                        <h2 className="section-heading mb-1">{section.titulo}</h2>
                        <p className="section-copy">Cards con mayor densidad de imagen, precio y CTA.</p>
                      </div>
                      <a href="/productos" className="store-button-secondary">
                        Ver todo el catalogo
                      </a>
                    </div>
                    <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
                      {productos.map((producto, index) => (
                        <TarjetaProducto key={producto.id} producto={producto} index={index} />
                      ))}
                    </div>
                  </div>
                </section>
              )
            }

            if (section.key === 'suscripcion') {
              return (
                <section key={section.key} className="py-9">
                  <div className="section-shell">
                    <div className="store-panel overflow-hidden bg-gradient-to-br from-primary to-primary-dark text-white">
                      <div className="grid gap-4 px-6 py-8 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
                        <div>
                          <span className="mb-3 inline-flex rounded-full border border-white/30 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-white/85">
                            Comunidad Plus-Sport
                          </span>
                          <h2 className="mb-2 text-3xl font-black sm:text-4xl">{section.titulo}</h2>
                          {section.subtitulo ? <p className="max-w-xl text-sm text-white/80 sm:text-base">{section.subtitulo}</p> : null}
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
              )
            }

            return null
          })}

        {ofertasVisibles.length > 0 ? (
        <section className="bg-white pb-10">
          <div className="section-shell">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <span className="section-eyebrow">Ofertas destacadas</span>
                  <h2 className="section-heading mb-1">Seleccion comercial para cierre de compra</h2>
                  <p className="section-copy">Bloque final para sostener conversion antes del footer.</p>
                </div>
                <a href="/productos?oferta=1" className="store-button-secondary">
                  Ver todas las ofertas
                </a>
              </div>
              <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
                {ofertasVisibles.map((producto, index) => (
                  <TarjetaProducto key={`oferta-${producto.id}-${index}`} producto={producto} index={index + 12} />
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </main>
      <Footer />
    </>
  )
}
