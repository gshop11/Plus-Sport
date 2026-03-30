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
    btn1Text: 'VER OFERTAS ->',
    btn1Url: '/productos',
    btn2Text: 'EXPLORAR COLECCION',
    btn2Url: '/categorias',
    colorFondo: '#1a237e',
  },
  {
    id: '2',
    titulo: 'JUEGA EN GRANDE',
    subtitulo: 'Coleccion Futbol 2025',
    descripcion: 'Botines, camisetas y accesorios para futbol de alto nivel.',
    btn1Text: 'VER COLECCION ->',
    btn1Url: '/categoria/futbol',
    btn2Text: 'VER OFERTAS',
    btn2Url: '/ofertas',
    colorFondo: '#b71c1c',
  },
  {
    id: '3',
    titulo: 'ENTRENA SIN LIMITES',
    subtitulo: 'Gym & Training 2025',
    descripcion: 'Todo para tu gym: ropa, accesorios y equipamiento de las mejores marcas.',
    btn1Text: 'VER GYM ->',
    btn1Url: '/categoria/gym-fitness',
    btn2Text: 'EXPLORAR TODO',
    btn2Url: '/productos',
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
      className="relative flex min-h-[500px] items-center overflow-hidden text-white"
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

      <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-8 px-4 py-16 lg:grid-cols-2">

        {/* IZQUIERDA: Texto y CTAs */}
        <div key={slide.id} className="animate-fadeIn">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-primary shadow-lg">
            <span className="h-2 w-2 rounded-full bg-accent" />
            <span>{slide.subtitulo || 'Coleccion 2025'}</span>
          </div>

          <h1 className="mb-4 text-5xl font-black leading-tight lg:text-7xl">
            {slide.titulo}
          </h1>

          {slide.descripcion && (
            <p className="mb-8 max-w-md text-lg text-white/80">{slide.descripcion}</p>
          )}

          <div className="flex flex-wrap gap-3">
            <a
              href={slide.btn1Url}
              className="rounded-lg bg-accent px-6 py-3 font-bold text-white shadow-lg transition-all hover:bg-orange-700 hover:shadow-xl"
            >
              {slide.btn1Text}
            </a>
            {slide.btn2Text && (
              <a
                href={slide.btn2Url || '#'}
                className="rounded-lg border-2 border-white px-6 py-3 font-bold text-white transition-all hover:bg-white hover:text-primary"
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
            className="absolute left-3 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-xl text-white backdrop-blur-sm transition hover:bg-white/40 active:bg-white/50"
            aria-label="Anterior"
          >
            ‹
          </button>
          <button
            onClick={() => setCurrent((prev) => (prev + 1) % data.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-white/20 text-xl text-white backdrop-blur-sm transition hover:bg-white/40 active:bg-white/50"
            aria-label="Siguiente"
          >
            ›
          </button>
        </>
      )}
    </section>
  )
}
