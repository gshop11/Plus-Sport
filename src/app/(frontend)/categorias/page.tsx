import Footer from '@/components/Footer'
import Header from '@/components/Header'
import { getCategoriasData } from '@/lib/storefront'

export const revalidate = 60

export default async function CategoriasPage() {
  const categorias = await getCategoriasData()

  return (
    <>
      <Header />
      <main>
        <section className="bg-gradient-to-br from-primary to-primary-dark py-12 text-white">
          <div className="section-shell">
            <span className="mb-4 inline-flex rounded-full border border-white/25 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/90">
              Explora por deporte
            </span>
            <h1 className="mb-3 text-3xl font-black sm:text-5xl">Categorias deportivas</h1>
            <p className="max-w-2xl text-sm text-white/80 sm:text-base">Selecciona tu tipo de deporte y entra directo a productos filtrados para compra rapida.</p>
          </div>
        </section>

        <section className="bg-white py-14">
          <div className="section-shell">
            {categorias.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {categorias.map(({ nombre, slug, descripcion, icono, imagenUrl }) => (
                  <a
                    href={`/categoria/${slug}`}
                    key={slug}
                    className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div
                      className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                      style={{
                        backgroundImage: imagenUrl
                          ? `linear-gradient(160deg, rgba(16,24,40,0.9), rgba(16,24,40,0.44)), url(${imagenUrl})`
                          : 'linear-gradient(160deg, rgba(26,35,126,0.12), rgba(26,35,126,0.03))',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    />
                    <div className="relative z-10">
                      <p className="mb-2 text-2xl transition-transform group-hover:scale-110">{icono || '•'}</p>
                      <h2 className="mb-2 text-xl font-black text-gray-900 transition-colors group-hover:text-white">{nombre}</h2>
                      <p className="line-clamp-2 text-sm text-gray-600 transition-colors group-hover:text-white/85">
                        {descripcion || 'Productos seleccionados para esta categoria.'}
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="store-empty-state">
                <h3>No hay categorias disponibles</h3>
                <p>Crea o activa categorias desde el admin para mostrarlas aqui.</p>
                <a href="/productos" className="store-button-primary">
                  Ver productos
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
