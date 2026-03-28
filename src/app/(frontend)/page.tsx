import Footer from '@/components/Footer'
import FormSuscribir from '@/components/FormSuscribir'
import Header from '@/components/Header'
import HeroSlider from '@/components/HeroSlider'
import TarjetaProducto from '@/components/TarjetaProducto'
import { getHomeData } from '@/lib/storefront'

export const revalidate = 60

export default async function HomePage() {
  const { slides, productos, marcas, categorias } = await getHomeData()

  return (
    <>
      <Header />

      <main>
        <HeroSlider slides={slides} />

        {categorias.length > 0 && (
          <section className="bg-gradient-to-b from-white to-gray-50 py-12">
            <div className="mx-auto max-w-7xl px-4">
              <div className="mb-8 text-center">
                <p className="mb-2 text-sm font-bold uppercase tracking-widest text-accent">- Explora por deporte</p>
                <h2 className="text-4xl font-black text-primary">
                  TU <span className="text-accent">DEPORTE</span>, TU ESTILO
                </h2>
              </div>

              <div className="flex flex-wrap justify-center gap-4">
                {categorias.map(({ nombre, icono, slug }) => (
                  <a
                    href={`/categoria/${slug}`}
                    key={slug}
                    className="w-full rounded-3xl border-2 border-gray-300 bg-white px-6 py-8 text-center shadow-sm transition-all hover:-translate-y-1 hover:border-accent hover:shadow-xl sm:w-[calc(50%-0.5rem)] lg:w-[calc(20%-0.8rem)]"
                  >
                    <p className="text-lg font-black uppercase tracking-[0.18em] text-primary">{nombre}</p>
                    <p className="mt-2 text-sm font-medium text-gray-500">Ver todos los productos</p>
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}

        {marcas.length > 0 && (
          <section className="bg-gray-50 py-10">
            <div className="mx-auto max-w-7xl px-4">
              <div className="mb-8 text-center">
                <p className="mb-2 text-sm font-bold uppercase tracking-widest text-accent">- Marcas oficiales</p>
                <h2 className="text-4xl font-black">
                  <span className="text-primary">LAS </span>
                  <span className="text-accent">MEJORES</span> <span className="text-primary">DEL MUNDO</span>
                </h2>
              </div>

              <div className="flex flex-wrap justify-center gap-4">
                {marcas.map(({ nombre, id, slug }) => (
                  <a
                    key={id}
                    href={`/productos?marca=${slug}`}
                    className="w-full rounded-3xl border-2 border-gray-300 bg-white px-6 py-8 text-center shadow-sm transition-all hover:-translate-y-1 hover:border-accent hover:shadow-xl sm:w-[calc(50%-0.5rem)] lg:w-[calc(25%-0.75rem)]"
                  >
                    <p className="text-lg font-black uppercase tracking-[0.18em] text-primary">{nombre}</p>
                    <p className="mt-3 text-sm font-medium text-gray-500">Ver productos de esta marca</p>
                  </a>
                ))}
              </div>
            </div>
          </section>
        )}

        {productos.length > 0 && (
          <section className="bg-white py-12">
            <div className="mx-auto max-w-7xl px-4">
              <div className="mb-8 text-center">
                <p className="mb-2 text-sm font-bold uppercase tracking-widest text-accent">- Mas comprados</p>
                <h2 className="text-4xl font-black text-primary">
                  LO MAS <span className="text-accent">VENDIDO</span>
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {productos.map((p, i) => (
                  <TarjetaProducto key={p.id} producto={p} index={i} />
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="bg-white py-16">
          <div className="mx-auto max-w-2xl px-4 text-center">
            <h2 className="mb-3 text-4xl font-black text-primary">Ofertas exclusivas para ti</h2>
            <p className="mb-8 text-lg font-semibold" style={{ color: '#ff6f00' }}>Déjanos tu WhatsApp y te avisamos primero.</p>
            <FormSuscribir />
          </div>
        </section>
      </main>

      <Footer />
    </>
  )
}
