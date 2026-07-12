import { getPayload } from 'payload'
import config from '@payload-config'
import { RichText } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export type LegalField = 'terminosCondiciones' | 'politicaPrivacidad' | 'politicaCambios' | 'politicaEntregas'

// Pagina legal generica. El contenido se administra en Payload
// (config-tienda > legal). Mientras este vacio se muestra un aviso explicito
// de contenido pendiente: NUNCA se publican textos legales inventados.
export default async function LegalPage({ titulo, field }: { titulo: string; field: LegalField }) {
  let contenido: SerializedEditorState | null = null
  let razonSocial = ''
  let ruc = ''
  let version = ''

  try {
    const payload = await getPayload({ config })
    const ct = (await payload.findGlobal({ slug: 'config-tienda', depth: 0, overrideAccess: true })) as unknown as {
      legal?: Record<string, unknown>
    }
    const legal = ct?.legal ?? {}
    contenido = (legal[field] as SerializedEditorState | undefined) ?? null
    razonSocial = String(legal.razonSocial ?? '').trim()
    ruc = String(legal.ruc ?? '').trim()
    version = String(legal.versionTerminos ?? '').trim()
  } catch {
    contenido = null
  }

  const tieneContenido = Boolean(
    contenido &&
      typeof contenido === 'object' &&
      Array.isArray((contenido as { root?: { children?: unknown[] } }).root?.children) &&
      ((contenido as { root: { children: unknown[] } }).root.children.length > 0),
  )

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[var(--surface-soft)]">
        <section className="bg-primary py-8 text-white">
          <div className="mx-auto max-w-4xl px-4">
            <h1 className="text-3xl font-black">{titulo}</h1>
            {version && field === 'terminosCondiciones' && version !== 'sin-version' ? (
              <p className="mt-1 text-sm text-white/70">Version: {version}</p>
            ) : null}
          </div>
        </section>

        <div className="mx-auto max-w-4xl px-4 py-10">
          {tieneContenido ? (
            <article className="prose prose-sm max-w-none rounded-2xl border border-[var(--line-soft)] bg-white p-8 text-gray-800 shadow-sm sm:prose-base">
              <RichText data={contenido as SerializedEditorState} />
              {(razonSocial || ruc) && (
                <p className="mt-8 border-t border-[var(--line-soft)] pt-4 text-sm text-gray-500">
                  {razonSocial ? `Razon social: ${razonSocial}. ` : ''}
                  {ruc ? `RUC: ${ruc}.` : ''}
                </p>
              )}
            </article>
          ) : (
            <div className="rounded-2xl border border-accent/25 bg-white p-8 text-center shadow-sm">
              <h2 className="mb-2 text-lg font-black text-gray-900">Contenido en preparacion</h2>
              <p className="text-sm text-gray-600">
                Este documento legal aun esta siendo elaborado por el negocio. Si tienes dudas sobre {titulo.toLowerCase()},
                escribenos por WhatsApp y te responderemos directamente.
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
