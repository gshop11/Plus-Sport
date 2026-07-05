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
      .replace(/[^\p{L}\p{N} ]/gu, ' ')
      .split(/\s+/)
      .filter(Boolean)

    if (words.length === 0) {
      return { lead: 'TRAINING', accent: 'Y GYM' }
    }

    if (words.length === 1) {
      return { lead: words[0], accent: 'Y GYM' }
    }

    const splitIndex = Math.ceil(words.length / 2)

    return {
      lead: words.slice(0, splitIndex).join(' '),
      accent: words.slice(splitIndex).join(' '),
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
      return `url(${slide.imagenUrl})`
    }
    return `radial-gradient(circle at 12% 24%, rgba(255, 111, 0, 0.42), transparent 34%), radial-gradient(circle at 84% 18%, rgba(255, 255, 255, 0.14), transparent 30%), linear-gradient(140deg, ${slide.colorFondo} 0%, color-mix(in srgb, ${slide.colorFondo} 58%, #070a1f) 78%)`
  }, [slide.colorFondo, slide.imagenUrl])

  return (
    <section
      className="store-hero"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="store-hero__surface"
        style={{
          backgroundImage: heroBackground,
        }}
      >
        <div className="store-hero__backdrop" aria-hidden="true" />
        <div className="store-hero__glow" aria-hidden="true" />

        <div className="store-home-container store-hero__inner">
          <div className="store-hero__content animate-fadeIn">
            <span className="store-hero__eyebrow">
              {slide.subtitulo || 'NUEVA TEMPORADA'}
            </span>

            <h1 className="store-hero__title font-display" aria-label={slide.titulo}>
              <span className="store-hero__title-line store-hero__title-line--primary">
                {headline.lead}
              </span>
              <span className="store-hero__title-line store-hero__title-line--accent">
                {headline.accent}
              </span>
            </h1>

            <p className="store-hero__copy">
              {slide.descripcion || 'Estabilidad, grip y respuesta para entrenar mejor, todos los dias.'}
            </p>

            <div className="store-hero__actions">
              <a href={slide.btn1Url} className="store-hero__cta store-hero__cta--primary">
                {slide.btn1Text || 'VER NOVEDADES'}
              </a>
              {slide.btn2Text ? (
                <a
                  href={slide.btn2Url || '/productos'}
                  className="store-hero__cta store-hero__cta--secondary"
                >
                  {slide.btn2Text}
                </a>
              ) : null}
            </div>

            <div className="store-hero__benefits">
              {heroBenefits.map((benefit) => (
                <p key={benefit} className="store-hero__benefit">
                  <span className="store-hero__benefit-dot" aria-hidden="true" />
                  {benefit}
                </p>
              ))}
            </div>
          </div>
        </div>

        {data.length > 1 && (
          <div className="store-home-container store-hero__indicator-shell">
            <div className="store-hero__indicators">
              {data.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCurrent(index)}
                  aria-label={`Ver slide ${index + 1}`}
                  aria-current={index === current ? 'true' : undefined}
                  className={`store-hero__indicator ${index === current ? 'store-hero__indicator--active' : ''}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
