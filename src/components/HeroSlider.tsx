'use client'

import { useEffect, useMemo, useState } from 'react'

export type SlideData = {
  id: string
  titulo: string
  subtitulo: string
  descripcion: string
  btn1Text: string
  btn1Url: string
  btn2Text?: string
  btn2Url?: string
  colorFondo: string
  imagenUrl?: string | null
}

const SLIDES_DEFAULT: SlideData[] = [
  {
    id: '1',
    titulo: 'NUEVA TEMPORADA SNEAKER',
    subtitulo: 'Lanzamientos y modelos top en tendencia',
    descripcion: 'Descubre pares de alto impacto y ropa sport para rotacion diaria.',
    btn1Text: 'Ver novedades',
    btn1Url: '/productos?sort=newest',
    btn2Text: 'Comprar ofertas',
    btn2Url: '/productos?oferta=1',
    colorFondo: '#0f1d54',
  },
  {
    id: '2',
    titulo: 'RUNNING Y TRAINING',
    subtitulo: 'Performance para tu proxima marca',
    descripcion: 'Calzado tecnico, prendas ligeras y accesorios para entrenar con ritmo.',
    btn1Text: 'Explorar catalogo',
    btn1Url: '/productos',
    btn2Text: 'Ver hombre',
    btn2Url: '/productos?segmento=hombre',
    colorFondo: '#0e2e4d',
  },
  {
    id: '3',
    titulo: 'STREETWEAR ACTIVO',
    subtitulo: 'Looks urbanos con ADN deportivo',
    descripcion: 'Combina sneakers iconicos con prendas esenciales para uso diario.',
    btn1Text: 'Ver mujer',
    btn1Url: '/productos?segmento=mujer',
    btn2Text: 'Ver ninos',
    btn2Url: '/productos?segmento=ninos',
    colorFondo: '#352017',
  },
]

const quickSegments = [
  { label: 'Hombre', href: '/productos?segmento=hombre' },
  { label: 'Mujer', href: '/productos?segmento=mujer' },
  { label: 'Ninos', href: '/productos?segmento=ninos' },
]

const commerceQuickLinks = [
  { label: 'Nuevos drops', href: '/productos?sort=newest' },
  { label: 'Lo mas vendido', href: '/productos' },
  { label: 'Ofertas destacadas', href: '/productos?oferta=1' },
]

export default function HeroSlider({ slides }: { slides?: SlideData[] }) {
  const validSlides = slides?.filter((slide) => slide.titulo && slide.titulo.trim().length > 5) ?? []
  const data = validSlides.length > 0 ? validSlides : SLIDES_DEFAULT

  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const slide = data[current]

  useEffect(() => {
    if (paused || data.length <= 1) return
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % data.length)
    }, 6200)
    return () => clearInterval(timer)
  }, [paused, data.length])

  const heroBackground = useMemo(() => {
    if (slide.imagenUrl) {
      return `linear-gradient(105deg, rgba(7, 11, 26, 0.95) 0%, rgba(7, 11, 26, 0.8) 46%, rgba(7, 11, 26, 0.38) 100%), url(${slide.imagenUrl})`
    }
    return `radial-gradient(circle at 85% 4%, rgba(255,255,255,0.16), transparent 42%), linear-gradient(122deg, ${slide.colorFondo} 0%, color-mix(in srgb, ${slide.colorFondo} 72%, #050914) 74%)`
  }, [slide.colorFondo, slide.imagenUrl])

  return (
    <section
      className="relative overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="relative flex min-h-[500px] items-center bg-cover bg-center text-white sm:min-h-[620px]"
        style={{ backgroundImage: heroBackground }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/55" />
        <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute right-[-8rem] top-[-6rem] h-80 w-80 rounded-full bg-white/10 blur-3xl" />

        <div className="section-shell relative z-10 py-10 sm:py-14">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
            <div className="max-w-2xl animate-fadeIn">
              <span className="mb-4 inline-flex items-center rounded-full border border-white/30 bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/90 backdrop-blur-sm">
                {slide.subtitulo || 'Coleccion destacada'}
              </span>

              <h1 className="mb-4 text-4xl font-black uppercase leading-[0.92] sm:text-6xl lg:text-7xl">{slide.titulo}</h1>
              {slide.descripcion ? <p className="mb-7 max-w-xl text-sm text-white/80 sm:text-base">{slide.descripcion}</p> : null}

              <div className="mb-6 flex flex-wrap gap-3">
                <a href={slide.btn1Url} className="store-button-primary">
                  {slide.btn1Text || 'Comprar ahora'}
                </a>
                {slide.btn2Text ? (
                  <a href={slide.btn2Url || '/productos'} className="store-button-secondary border-white/40 text-white hover:bg-white/10">
                    {slide.btn2Text}
                  </a>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                {quickSegments.map((segment) => (
                  <a
                    key={segment.href}
                    href={segment.href}
                    className="rounded-full border border-white/25 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white/85 transition-colors hover:bg-white/15"
                  >
                    {segment.label}
                  </a>
                ))}
              </div>
            </div>

            <div className="grid gap-3">
              <div className="rounded-2xl border border-white/20 bg-black/25 p-4 backdrop-blur-sm">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/65">Drop de la semana</p>
                <button
                  type="button"
                  onClick={() => setCurrent((current + 1) % data.length)}
                  className="group relative block h-44 w-full overflow-hidden rounded-xl border border-white/20 text-left"
                  style={{
                    backgroundImage: slide.imagenUrl
                      ? `linear-gradient(150deg, rgba(9,9,12,0.84), rgba(9,9,12,0.16)), url(${slide.imagenUrl})`
                      : 'linear-gradient(150deg, rgba(255,255,255,0.15), rgba(255,255,255,0.03))',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="line-clamp-2 text-sm font-bold uppercase text-white">{slide.titulo}</p>
                    <p className="text-xs text-white/75">Nuevo drop activo en tienda</p>
                  </div>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <a href="/productos?sort=price_desc" className="rounded-xl border border-white/20 bg-black/25 p-3 backdrop-blur-sm transition-colors hover:bg-black/35">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/65">Top Picks</p>
                  <p className="text-sm font-bold text-white">Lo mas vendido</p>
                </a>
                <a href="/productos?oferta=1" className="rounded-xl border border-white/20 bg-black/25 p-3 backdrop-blur-sm transition-colors hover:bg-black/35">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/65">Flash deals</p>
                  <p className="text-sm font-bold text-white">Ofertas activas</p>
                </a>
              </div>
            </div>
          </div>
        </div>

        {data.length > 1 && (
          <div className="absolute inset-x-0 bottom-4 z-20">
            <div className="section-shell flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {data.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCurrent(index)}
                    aria-label={`Ver slide ${index + 1}`}
                    className={`h-2 rounded-full transition-all ${index === current ? 'w-14 bg-white' : 'w-6 bg-white/35 hover:bg-white/65'}`}
                  />
                ))}
              </div>
              <div className="hidden items-center gap-2 sm:flex">
                {commerceQuickLinks.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.11em] text-white/85 transition-colors hover:bg-white/20"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
