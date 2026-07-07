'use client'

import type { StorefrontConfig } from '@/lib/storefront-types'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

type FooterMethod = {
  nombre: string
  activo: boolean
  mostrarEnFooter: boolean
}

const fallbackFooter: StorefrontConfig['footer'] = {
  descripcion: 'Tu tienda deportiva de confianza en Peru. Las mejores marcas al mejor precio.',
  telefono: '+51 979 705 255',
  email: '',
  direccion: 'Trujillo, Peru',
  horario: 'Lunes a Sabado 9am-8pm',
  redesSociales: { facebook: '', instagram: '', tiktok: '', youtube: '' },
  linksRapidos: [
    { etiqueta: 'Inicio', url: '/' },
    { etiqueta: 'Todos los productos', url: '/productos' },
    { etiqueta: 'Categorias', url: '/categorias' },
    { etiqueta: 'Ofertas', url: '/ofertas' },
  ],
  textoCopyright: `© ${new Date().getFullYear()} PlusSport. Todos los derechos reservados.`,
}

const fallbackIdentity = {
  name: 'PlusSport',
}

const trustItems = [
  'Atencion por WhatsApp',
  'Consulta disponibilidad por talla',
  'Coordinacion de entrega',
]

const normalizeFooterHref = (href: string) => (href === '/ofertas' ? '/productos?oferta=1' : href)

export default function Footer() {
  const [metodosFooter, setMetodosFooter] = useState<string[]>(['BCP', 'Yape', 'Interbank'])
  const [footerConfig, setFooterConfig] = useState<StorefrontConfig['footer']>(fallbackFooter)
  const [storeName, setStoreName] = useState(fallbackIdentity.name)

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const [configRes, metodosRes] = await Promise.all([
          fetch('/api/storefront-config', { cache: 'no-store' }),
          fetch('/api/metodos-pago', { cache: 'no-store' }),
        ])

        if (configRes.ok) {
          const config = (await configRes.json()) as StorefrontConfig
          setFooterConfig(config.footer)
          setStoreName(config.identity.name || fallbackIdentity.name)
        }

        if (metodosRes.ok) {
          const data = await metodosRes.json()
          const methods = Array.isArray(data?.metodos) ? (data.metodos as FooterMethod[]) : []
          const names = methods
            .filter((m) => m?.activo && m?.mostrarEnFooter)
            .map((m) => String(m.nombre || '').trim())
            .filter(Boolean)

          if (names.length > 0) setMetodosFooter(names)
        }
      } catch {
        // keep fallback
      }
    }

    void loadConfig()
  }, [])

  const socialLinks = useMemo(
    () =>
      [
        { label: 'Facebook', url: footerConfig.redesSociales.facebook },
        { label: 'Instagram', url: footerConfig.redesSociales.instagram },
        { label: 'TikTok', url: footerConfig.redesSociales.tiktok },
        { label: 'YouTube', url: footerConfig.redesSociales.youtube },
      ].filter((item) => Boolean(item.url)),
    [footerConfig.redesSociales.facebook, footerConfig.redesSociales.instagram, footerConfig.redesSociales.tiktok, footerConfig.redesSociales.youtube],
  )

  return (
    <footer className="mt-12 bg-primary text-white">
      <div className="border-b border-white/10 bg-gradient-to-r from-accent/95 to-accent-dark px-4 py-4">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-white/90">Catalogo deportivo con atencion por WhatsApp</p>
          <a href="/productos?oferta=1" className="rounded-full border border-white/35 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.11em] text-white transition-colors hover:bg-white/20">
            Ver ofertas destacadas
          </a>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {trustItems.map((item) => (
            <div key={item} className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-center text-xs font-semibold uppercase tracking-[0.12em] text-blue-100">
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[1.2fr_0.8fr_1fr]">
          <div className="rounded-2xl border border-white/15 bg-white/5 p-6">
            <span className="mb-2 block text-2xl font-black">
              <span className="text-accent">{storeName}</span>
            </span>
            <p className="max-w-sm text-sm text-blue-200/90">{footerConfig.descripcion}</p>
          </div>

          <div>
            <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-blue-100">Tienda</h4>
            <ul className="space-y-2 text-sm text-blue-200/90">
              {footerConfig.linksRapidos.map((link) => (
                <li key={`${link.url}-${link.etiqueta}`}>
                  <Link href={normalizeFooterHref(link.url)} className="transition-colors hover:text-white">
                    {link.etiqueta}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/5 p-6">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-blue-100">Contacto comercial</h4>
            {footerConfig.telefono ? <p className="text-sm text-blue-200/90">WhatsApp: {footerConfig.telefono}</p> : null}
            {footerConfig.email ? <p className="text-sm text-blue-200/90">Email: {footerConfig.email}</p> : null}
            {footerConfig.direccion ? <p className="text-sm text-blue-200/90">{footerConfig.direccion}</p> : null}
            {footerConfig.horario ? <p className="text-sm text-blue-200/90">{footerConfig.horario}</p> : null}
            {socialLinks.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-blue-100 transition-colors hover:bg-white/20"
                  >
                    {social.label}
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 sm:flex-row">
          <div className="flex flex-wrap items-center gap-2 text-xs text-blue-300">
            <span className="font-semibold uppercase tracking-[0.12em] text-blue-200">Metodos de pago:</span>
            {metodosFooter.map((m) => (
              <span key={m} className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1">
                {m}
              </span>
            ))}
          </div>
          <span className="text-xs text-blue-300">{footerConfig.textoCopyright}</span>
        </div>
      </div>
    </footer>
  )
}
