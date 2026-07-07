import type { Metadata } from 'next'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import { getMarcasData } from '@/lib/storefront'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Marcas',
  description: 'Explora el catalogo de Plus Sport por marca deportiva.',
  alternates: { canonical: '/marcas' },
}

export default async function MarcasPage() {
  const marcas = await getMarcasData()

  return (
    <>
      <Header />
      <main>
        <section className="bg-gradient-to-br from-primary to-primary-dark py-12 text-white">
          <div className="section-shell">
            <span className="mb-4 inline-flex rounded-full border border-white/25 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/90">
              Marcas destacadas
            </span>
            <h1 className="mb-3 text-3xl font-black sm:text-5xl">Marcas deportivas en Plus-Sport</h1>
            <p className="max-w-2xl text-sm text-white/80 sm:text-base">Acceso directo por marca para replicar la navegacion comercial de sneaker retailers de referencia.</p>
          </div>
        </section>

        <section className="bg-white py-14">
          <div className="section-shell">
            {marcas.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {marcas.map((marca) => (
                  <a
                    key={marca.id}
                    href={`/productos?marca=${marca.slug}`}
                    className="store-panel flex min-h-[150px] flex-col items-center justify-center gap-3 p-5 text-center transition-all hover:-translate-y-1 hover:shadow-lg"
                  >
                    {marca.logoUrl ? <img src={marca.logoUrl} alt={marca.nombre} className="h-9 w-auto object-contain" /> : <span className="store-chip">Marca</span>}
                    <p className="text-base font-black uppercase tracking-[0.12em] text-gray-900">{marca.nombre}</p>
                    <span className="text-xs font-semibold uppercase tracking-[0.1em] text-gray-500">Ver productos</span>
                  </a>
                ))}
              </div>
            ) : (
              <div className="store-empty-state">
                <h3>No hay marcas activas</h3>
                <p>Activa marcas en el admin para mostrarlas en esta pagina.</p>
                <a href="/productos" className="store-button-primary">
                  Ir al catalogo
                </a>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
