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
    }, 5000)
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
      role="region"
      aria-roledescription="carousel"
      aria-label="Carrusel visual de Plus Sport"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
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
