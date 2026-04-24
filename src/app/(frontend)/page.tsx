import Footer from '@/components/Footer'
import FormSuscribir from '@/components/FormSuscribir'
import Header from '@/components/Header'
import HeroSlider from '@/components/HeroSlider'
import TarjetaProducto from '@/components/TarjetaProducto'
import { getHomeData } from '@/lib/storefront'

export const revalidate = 60

const segmentCards = [
  {
    label: 'Hombre',
    copy: 'Sneakers, training y streetwear para uso diario.',
    href: '/productos?segmento=hombre',
    background:
      'linear-gradient(152deg, rgba(17,24,39,0.96), rgba(17,24,39,0.72) 55%, rgba(17,24,39,0.35))',
  },
  {
    label: 'Mujer',
    copy: 'Nuevas siluetas y prendas deportivas en tendencia.',
    href: '/productos?segmento=mujer',
    background:
      'linear-gradient(152deg, rgba(53,26,55,0.96), rgba(53,26,55,0.72) 55%, rgba(53,26,55,0.35))',
  },
  {
    label: 'Ninos',
    copy: 'Modelos resistentes para juego, colegio y deporte.',
    href: '/productos?segmento=ninos',
    background:
      'linear-gradient(152deg, rgba(12,54,71,0.96), rgba(12,54,71,0.72) 55%, rgba(12,54,71,0.35))',
  },
]

const valueProps = [
  'Envio nacional con seguimiento',
  'Cambios y devoluciones simples',
  'Pago seguro y metodos locales',
  'Soporte comercial por WhatsApp',
]

export default async function HomePage() {
  const { slides, productos, marcas, categorias, storefront } = await getHomeData()

  const novedades = productos.slice(0, 4)
  const ofertas = productos.filter((item) => item.etiqueta === 'oferta' || Number(item.precioAnterior || 0) > Number(item.precio || 0)).slice(0, 4)
  const ofertasVisibles = ofertas.length > 0 ? ofertas : productos.slice(4, 8)

  return (
    <>
      <Header />
      <main>
        <HeroSlider slides={slides} />

        <section className="border-y border-gray-200/80 bg-white py-3">
          <div className="section-shell grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {valueProps.map((item) => (
              <p key={item} className="rounded-lg border border-gray-200/80 bg-[var(--surface-soft)] px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-600">
                {item}
              </p>
            ))}
          </div>
        </section>

        <section className="bg-[var(--surface-soft)] py-8">
          <div className="section-shell grid gap-3 lg:grid-cols-[1.4fr_1fr]">
            <a
              href="/productos?sort=newest"
              className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-primary to-primary-dark p-5 text-white shadow-lg"
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
              className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-accent to-accent-dark p-5 text-white shadow-lg"
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

        <section className="py-9">
          <div className="section-shell">
            <span className="section-eyebrow">Compra por segmento</span>
            <h2 className="section-heading mb-2">Hombre, mujer y ninos</h2>
            <p className="section-copy mb-5 max-w-2xl">Entrada directa al catalogo por publico objetivo, con bloques densos y de alto contraste.</p>
            <div className="grid gap-3 md:grid-cols-3">
              {segmentCards.map((segment) => (
                <a
                  key={segment.label}
                  href={segment.href}
                  className="group relative overflow-hidden rounded-2xl border border-white/10 p-5 text-white shadow-lg"
                  style={{ background: segment.background }}
                >
                  <div className="absolute -right-6 top-0 h-24 w-24 rounded-full bg-white/10 blur-xl" />
                  <span className="mb-2 inline-flex rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]">
                    {segment.label}
                  </span>
                  <h3 className="mb-1 text-2xl font-black">{segment.label}</h3>
                  <p className="mb-4 text-sm text-white/80">{segment.copy}</p>
                  <span className="inline-flex items-center text-sm font-semibold text-white transition-colors group-hover:text-[#ffd8b5]">Explorar ahora</span>
                </a>
              ))}
            </div>
          </div>
        </section>

        {novedades.length > 0 ? (
          <section className="bg-white pb-10">
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
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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
                <section key={section.key} className="bg-[var(--surface-soft)] py-10">
                  <div className="section-shell">
                    {section.subtitulo ? <span className="section-eyebrow">{section.subtitulo}</span> : null}
                    <h2 className="section-heading mb-1">{section.titulo}</h2>
                    <p className="section-copy mb-5 max-w-2xl">Compra por deporte con paneles de alto impacto para reducir sensacion de pantalla vacia.</p>

                    <div className="grid auto-rows-[180px] gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {categorias.map(({ nombre, slug, descripcion, imagenUrl }, index) => (
                        <a
                          href={`/categoria/${slug}`}
                          key={slug}
                          className={`group relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg ${
                            index === 0 ? 'sm:col-span-2 lg:col-span-2 lg:row-span-2' : ''
                          }`}
                        >
                          <div
                            className="absolute inset-0"
                            style={{
                              backgroundImage: imagenUrl
                                ? `linear-gradient(156deg, rgba(16,24,40,0.86), rgba(16,24,40,0.28)), url(${imagenUrl})`
                                : 'linear-gradient(156deg, rgba(16,24,40,0.86), rgba(16,24,40,0.38))',
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
                <section key={section.key} className="bg-white py-10">
                  <div className="section-shell">
                    {section.subtitulo ? <span className="section-eyebrow">{section.subtitulo}</span> : null}
                    <h2 className="section-heading mb-1">{section.titulo}</h2>
                    <p className="section-copy mb-5 max-w-2xl">Muro de marcas top para orientar el browse de sneaker/sport fashion.</p>

                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {marcas.map(({ nombre, id, slug, logoUrl }) => (
                        <a
                          key={id}
                          href={`/productos?marca=${slug}`}
                          className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-[#f4f7ff] p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
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
                <section key={section.key} className="bg-[var(--surface-soft)] py-10">
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
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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
                <section key={section.key} className="py-10">
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
          <section className="bg-white pb-12">
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
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
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
