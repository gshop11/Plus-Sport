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
    btn1Text: 'VER NOVEDADES',
    btn1Url: '/productos?sort=newest',
    btn2Text: 'IR A OFERTAS',
    btn2Url: '/productos?oferta=1',
    colorFondo: '#10184d',
  },
  {
    id: '2',
    titulo: 'RUNNING Y TRAINING',
    subtitulo: 'Performance para tu proxima marca',
    descripcion: 'Calzado tecnico, prendas ligeras y accesorios para entrenar con ritmo.',
    btn1Text: 'VER CATALOGO',
    btn1Url: '/productos',
    btn2Text: 'VER OFERTAS',
    btn2Url: '/productos?oferta=1',
    colorFondo: '#18348d',
  },
  {
    id: '3',
    titulo: 'STREETWEAR ACTIVO',
    subtitulo: 'Looks urbanos con ADN deportivo',
    descripcion: 'Combina sneakers iconicos con prendas esenciales para uso diario.',
    btn1Text: 'VER COLECCION',
    btn1Url: '/productos',
    btn2Text: 'IR A OFERTAS',
    btn2Url: '/productos?oferta=1',
    colorFondo: '#1f1f27',
  },
]

const heroBenefits = [
  'Envio express',
  'Cambios faciles',
  'Ofertas reales',
  'Compra segura',
]

export default function HeroSlider({ slides }: { slides?: SlideData[] }) {
  const validSlides = slides?.filter((slide) => slide.titulo && slide.titulo.trim().length > 5) ?? []
  const data = validSlides.length > 0 ? validSlides : SLIDES_DEFAULT

  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const slide = data[current]

  const headline = useMemo(() => {
    const words = String(slide.titulo || '')
      .toUpperCase()
      .replace(/[^A-Z0-9ÑÁÉÍÓÚÜ ]/g, ' ')
      .split(/\s+/)
      .filter(Boolean)

    if (words.length === 0) {
      return { lead: 'TRAINING', accent: 'Y GYM' }
    }

    if (words.length === 1) {
      return { lead: words[0], accent: 'Y GYM' }
    }

    if (words.length === 2) {
      return { lead: words[0], accent: words[1] }
    }

    return {
      lead: words.slice(0, 2).join(' '),
      accent: words.slice(2, 4).join(' '),
    }
  }, [slide.titulo])

  useEffect(() => {
    if (paused || data.length <= 1) return
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % data.length)
    }, 6200)
    return () => clearInterval(timer)
  }, [paused, data.length])

  const heroBackground = useMemo(() => {
    if (slide.imagenUrl) {
      return `linear-gradient(125deg, rgba(10, 17, 52, 0.16), rgba(10, 17, 52, 0.72)), url(${slide.imagenUrl})`
    }
    return `radial-gradient(circle at 8% 22%, rgba(255, 111, 0, 0.45), transparent 36%), linear-gradient(140deg, ${slide.colorFondo} 0%, color-mix(in srgb, ${slide.colorFondo} 62%, #0b102b) 78%)`
  }, [slide.colorFondo, slide.imagenUrl])

  return (
    <section
      className="relative overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative bg-white">
        <div className="section-shell relative py-6 sm:py-8 lg:py-10">
          <div className="grid items-stretch gap-5 lg:grid-cols-[1.06fr_0.94fr] lg:gap-6">
            <div className="store-panel animate-fadeIn border-primary/15 bg-white p-6 sm:p-8 lg:p-10">
              <span className="mb-4 inline-flex items-center rounded-full border border-primary/25 bg-[var(--surface-soft)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.17em] text-primary">
                {slide.subtitulo || 'NUEVA TEMPORADA'}
              </span>

              <h1 className="font-display mb-4 leading-[0.9]">
                <span className="block text-[2.3rem] font-black uppercase tracking-[-0.03em] text-primary sm:text-[3.2rem] lg:text-[4.4rem]">
                  {headline.lead}
                </span>
                <span className="mt-1 block text-[2.3rem] font-black uppercase tracking-[-0.02em] text-accent sm:text-[3.2rem] lg:text-[4.2rem]">
                  {headline.accent}
                </span>
              </h1>

              <p className="mb-6 max-w-xl text-sm text-primary-dark/90 sm:text-base">
                {slide.descripcion || 'Estabilidad, grip y respuesta para entrenar mejor, todos los dias.'}
              </p>

              <div className="mb-5 flex flex-wrap gap-3">
                <a href={slide.btn1Url} className="store-button-primary">
                  {slide.btn1Text || 'VER NOVEDADES'}
                </a>
                {slide.btn2Text ? (
                  <a
                    href={slide.btn2Url || '/productos'}
                    className="inline-flex items-center justify-center rounded-xl border border-primary bg-white px-5 py-3 text-sm font-semibold text-primary transition-colors hover:bg-[var(--surface-soft)]"
                  >
                    {slide.btn2Text}
                  </a>
                ) : null}
              </div>

              <div className="grid gap-2 text-[11px] font-semibold uppercase tracking-[0.11em] text-primary-dark sm:grid-cols-2">
                {heroBenefits.map((benefit) => (
                  <p key={benefit} className="inline-flex items-center gap-2 rounded-lg border border-[var(--line-soft)] bg-[var(--surface-soft)] px-3 py-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                    {benefit}
                  </p>
                ))}
              </div>
            </div>

            <div className="relative min-h-[320px] overflow-hidden rounded-3xl border border-[var(--line-soft)] bg-primary shadow-[0_26px_52px_-34px_rgba(13,23,87,0.72)] sm:min-h-[400px]">
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: heroBackground }} />
              <div className="absolute inset-0 bg-gradient-to-tr from-black/35 via-transparent to-accent/20" />
              <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-accent/30 blur-2xl lg:-right-12 lg:-top-12 lg:h-44 lg:w-44" />
              <div className="absolute bottom-4 left-4 rounded-full border border-white/35 bg-black/30 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white backdrop-blur-sm">
                SNEAKER / SPORTWEAR
              </div>
            </div>
          </div>
        </div>

        {data.length > 1 && (
          <div className="section-shell pb-2">
            <div className="flex items-center justify-center gap-2 pt-2">
              {data.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCurrent(index)}
                  aria-label={`Ver slide ${index + 1}`}
                  className={`h-2 rounded-full transition-all ${index === current ? 'w-12 bg-primary' : 'w-5 bg-primary/35 hover:bg-primary/55'}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
