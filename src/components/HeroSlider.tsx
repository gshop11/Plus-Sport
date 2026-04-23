'use client'
import { useEffect, useState } from 'react'

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
    titulo: 'CORRE MAS LEJOS',
    subtitulo: 'Air Max 2025 - Mas vendido de la semana',
    descripcion: 'Equipamiento deportivo de alto rendimiento para atletas que no se detienen.',
    btn1Text: 'VER OFERTAS',
    btn1Url: '/productos?oferta=1',
    btn2Text: 'EXPLORAR COLECCION',
    btn2Url: '/productos',
    colorFondo: '#1a237e',
  },
  {
    id: '2',
    titulo: 'JUEGA EN GRANDE',
    subtitulo: 'Coleccion Futbol 2025',
    descripcion: 'Botines, camisetas y accesorios para futbol de alto nivel.',
    btn1Text: 'VER COLECCION',
    btn1Url: '/productos',
    btn2Text: 'VER OFERTAS',
    btn2Url: '/productos?oferta=1',
    colorFondo: '#b71c1c',
  },
  {
    id: '3',
    titulo: 'ENTRENA SIN LIMITES',
    subtitulo: 'Gym & Training 2025',
    descripcion: 'Todo para tu gym: ropa, accesorios y equipamiento de las mejores marcas.',
    btn1Text: 'VER PRODUCTOS',
    btn1Url: '/productos',
    btn2Text: 'VER OFERTAS',
    btn2Url: '/productos?oferta=1',
    colorFondo: '#1b5e20',
  },
]

// Emojis decorativos por slide para el círculo derecho
const SLIDE_ICONS = ['👟', '⚽', '🏋️']

export default function HeroSlider({ slides }: { slides?: SlideData[] }) {
  // Solo usar slides del admin si tienen contenido real (titulo > 5 chars)
  const validSlides = slides?.filter((s) => s.titulo && s.titulo.length > 5) ?? []
  const data = validSlides.length > 0 ? validSlides : SLIDES_DEFAULT

  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)

  // Auto-rotación cada 5 segundos
  useEffect(() => {
    if (paused || data.length <= 1) return
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % data.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [paused, data.length])

  const slide = data[current]
  const icon = SLIDE_ICONS[current % SLIDE_ICONS.length]

  return (
    <section
      className="relative flex min-h-[280px] items-center overflow-hidden text-white sm:min-h-[380px] lg:min-h-[500px]"
      style={{ backgroundColor: slide.colorFondo, transition: 'background-color 0.6s ease' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* DERECHA: imagen cubriendo la mitad derecha */}
      {slide.imagenUrl ? (
        <div
          className="absolute inset-y-0 right-0 hidden w-1/2 lg:block"
          style={{
            backgroundImage: `url(${slide.imagenUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      ) : (
        <>
          <div className="absolute right-0 top-0 h-96 w-96 translate-x-1/4 -translate-y-1/2 rounded-full bg-white/5" />
          <div className="absolute bottom-0 right-32 h-64 w-64 translate-y-1/3 rounded-full bg-white/5" />
        </>
      )}

      <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-6 px-4 py-10 sm:gap-8 sm:py-14 lg:grid-cols-2 lg:py-16">

        {/* IZQUIERDA: Texto y CTAs */}
        <div key={slide.id} className="animate-fadeIn">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-primary shadow-lg sm:mb-6 sm:px-4 sm:py-2 sm:text-sm">
            <span className="h-2 w-2 rounded-full bg-accent" />
            <span>{slide.subtitulo || 'Coleccion 2025'}</span>
          </div>

          <h1 className="mb-3 text-3xl font-black leading-tight sm:text-5xl sm:mb-4 lg:text-7xl">
            {slide.titulo}
          </h1>

          {slide.descripcion && (
            <p className="mb-5 max-w-md text-sm text-white/80 sm:mb-8 sm:text-lg">{slide.descripcion}</p>
          )}

          <div className="flex flex-wrap gap-2 sm:gap-3">
            <a
              href={slide.btn1Url}
              className="rounded-lg bg-accent px-4 py-2.5 text-sm font-bold text-white shadow-lg transition-all hover:bg-orange-700 hover:shadow-xl sm:px-6 sm:py-3 sm:text-base"
            >
              {slide.btn1Text}
            </a>
            {slide.btn2Text && (
              <a
                href={slide.btn2Url || '#'}
                className="rounded-lg border-2 border-white px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-white hover:text-primary sm:px-6 sm:py-3 sm:text-base"
              >
                {slide.btn2Text}
              </a>
            )}
          </div>
        </div>

        {/* DERECHA: espacio vacío (la imagen lo cubre como fondo absoluto) */}
        <div className="hidden lg:block" />
      </div>

      {/* Dots de navegación */}
      {data.length > 1 && (
        <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 items-center gap-1">
          {data.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`rounded-full transition-all duration-300 ${
                i === current ? 'h-3 w-10 bg-accent' : 'h-3 w-3 bg-white/40 hover:bg-white/70'
              }`}
              style={{ minWidth: '12px', minHeight: '12px' }}
              aria-label={`Ver slide ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Flechas de navegación */}
      {data.length > 1 && (
        <>
          <button
            onClick={() => setCurrent((prev) => (prev - 1 + data.length) % data.length)}
            className="absolute left-2 top-1/2 z-20 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-black/40 text-white shadow-lg backdrop-blur-sm transition hover:bg-black/60 active:scale-95 sm:left-3 sm:h-11 sm:w-11"
            aria-label="Anterior"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            onClick={() => setCurrent((prev) => (prev + 1) % data.length)}
            className="absolute right-2 top-1/2 z-20 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full bg-black/40 text-white shadow-lg backdrop-blur-sm transition hover:bg-black/60 active:scale-95 sm:right-3 sm:h-11 sm:w-11"
            aria-label="Siguiente"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </>
      )}
    </section>
  )
}
