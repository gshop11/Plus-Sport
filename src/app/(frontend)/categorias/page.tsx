import Footer from '@/components/Footer'
import Header from '@/components/Header'
import { getCategoriasData } from '@/lib/storefront'

export const revalidate = 60

const heroBackground = 'linear-gradient(90deg, #ff7a00 0%, #ff6f00 55%, #ff8c1a 100%)'

export default async function CategoriasPage() {
  const categorias = await getCategoriasData()

  return (
    <>
      <Header />
      <main>
        <section className="py-12 text-white" style={{ background: heroBackground }}>
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-4 inline-flex rounded-full border border-white/25 bg-white/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/90">
              Explora por deporte
            </div>
            <h1 className="mb-2 text-4xl font-black tracking-tight lg:text-5xl">
              <span className="text-[#fff7ef]">Elige Tu </span>
              <span className="text-primary">Deporte</span>
            </h1>
            <p className="max-w-2xl text-[#fff1dd]">Navega por categorias y encuentra exactamente lo que buscas.</p>
          </div>
        </section>

        {categorias.length > 0 ? (
          <section className="bg-white py-16">
            <div className="mx-auto max-w-7xl px-4">
              <div className="flex flex-wrap justify-center gap-4">
                {categorias.map(({ nombre, slug }) => (
                  <a
                    href={`/categoria/${slug}`}
                    key={slug}
                    className="w-full rounded-3xl border-2 border-gray-300 bg-white px-6 py-8 text-center shadow-sm transition-all hover:-translate-y-1 hover:border-accent hover:shadow-xl sm:w-[calc(50%-0.5rem)] lg:w-[calc(25%-0.75rem)]"
                  >
                    <p className="text-lg font-black uppercase tracking-[0.18em] text-primary">{nombre}</p>
                    <p className="mt-3 text-sm font-medium text-gray-500">Ver todos los productos</p>
                  </a>
                ))}
              </div>
            </div>
          </section>
        ) : (
          <section className="bg-white py-20 text-center">
            <div className="mx-auto max-w-2xl">
              <p className="text-lg text-gray-500">No hay categorias disponibles.</p>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  )
}
