'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

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

const ROTATION_INTERVAL = 5200
// Commercial direction: the hero must feel alive immediately, not sit still
// for a full interval before the first transition.
const FIRST_ROTATION_DELAY = 900

export default function HeroSlider({ slides }: { slides?: SlideData[] }) {
  const validSlides = slides?.filter((slide) => slide.titulo && slide.titulo.trim().length > 5) ?? []
  const data = validSlides.length > 0 ? validSlides : SLIDES_DEFAULT

  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const [hasReducedMotion, setHasReducedMotion] = useState(false)
  const hasRotatedOnceRef = useRef(false)
  const slide = data[current]

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotionPreference = () => setHasReducedMotion(motionQuery.matches)
    updateMotionPreference()
    motionQuery.addEventListener('change', updateMotionPreference)
    return () => motionQuery.removeEventListener('change', updateMotionPreference)
  }, [])

  useEffect(() => {
    if (paused || hasReducedMotion || data.length <= 1) return
    const delay = hasRotatedOnceRef.current ? ROTATION_INTERVAL : FIRST_ROTATION_DELAY
    const timer = setTimeout(() => {
      hasRotatedOnceRef.current = true
      setCurrent((prev) => (prev + 1) % data.length)
    }, delay)
    return () => clearTimeout(timer)
  }, [current, paused, hasReducedMotion, data.length])

  const goTo = (index: number) => setCurrent(((index % data.length) + data.length) % data.length)
  const goPrevious = () => goTo(current - 1)
  const goNext = () => goTo(current + 1)

  const heroBackground = useMemo(() => {
    if (slide.imagenUrl) {
      return `url(${slide.imagenUrl})`
    }
    return `radial-gradient(circle at 12% 24%, rgba(255, 111, 0, 0.42), transparent 34%), radial-gradient(circle at 84% 18%, rgba(255, 255, 255, 0.14), transparent 30%), linear-gradient(140deg, ${slide.colorFondo} 0%, color-mix(in srgb, ${slide.colorFondo} 58%, #070a1f) 78%)`
  }, [slide.colorFondo, slide.imagenUrl])

  return (
    <section
      className="store-hero"
      role="region"
      aria-roledescription="carousel"
      aria-label="Carrusel visual de Plus Sport"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setPaused(false)
        }
      }}
    >
      <div
        className="store-hero__surface"
        style={{
          backgroundImage: heroBackground,
        }}
        role="img"
        aria-label={slide.titulo}
      >
        <div className="store-hero__backdrop" aria-hidden="true" />

        {data.length > 1 && (
          <div className="store-hero__arrows">
            <button
              type="button"
              className="store-hero__arrow store-hero__arrow--previous"
              aria-label="Slide anterior"
              onClick={goPrevious}
            >
              <span aria-hidden="true">‹</span>
            </button>
            <button
              type="button"
              className="store-hero__arrow store-hero__arrow--next"
              aria-label="Slide siguiente"
              onClick={goNext}
            >
              <span aria-hidden="true">›</span>
            </button>
          </div>
        )}

        {data.length > 1 && (
          <div className="store-home-container store-hero__indicator-shell">
            <div className="store-hero__indicators">
              {data.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => goTo(index)}
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
