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
    <footer className="bg-primary text-white">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <span className="mb-1 block text-2xl font-black">
              <span className="text-accent">{storeName}</span>
            </span>
            <p className="text-sm text-blue-200">{footerConfig.descripcion}</p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-bold uppercase tracking-widest">Tienda</h4>
            <ul className="space-y-2 text-sm text-blue-200">
              {footerConfig.linksRapidos.map((link) => (
                <li key={`${link.url}-${link.etiqueta}`}>
                  <Link href={link.url}>{link.etiqueta}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-bold uppercase tracking-widest">Contacto</h4>
            {footerConfig.telefono ? <p className="text-sm text-blue-200">WhatsApp: {footerConfig.telefono}</p> : null}
            {footerConfig.email ? <p className="text-sm text-blue-200">Email: {footerConfig.email}</p> : null}
            {footerConfig.direccion ? <p className="text-sm text-blue-200">{footerConfig.direccion}</p> : null}
            {footerConfig.horario ? <p className="text-sm text-blue-200">{footerConfig.horario}</p> : null}
            {socialLinks.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {socialLinks.map((social) => (
                  <a
                    key={social.label}
                    href={social.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-blue-100 transition-colors hover:bg-white/20"
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
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-4 sm:flex-row">
          <div className="flex flex-wrap items-center gap-2 text-xs text-blue-300">
            <span className="font-semibold text-blue-200">Metodos de pago:</span>
            {metodosFooter.map((m) => (
              <span key={m} className="rounded-full bg-white/10 px-2.5 py-1">
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


