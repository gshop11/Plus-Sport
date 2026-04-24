import type { Metadata } from 'next'
import { getStorefrontConfig } from '@/lib/storefront'
import { Manrope, Space_Grotesk } from 'next/font/google'
import './globals.css'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Tienda Deportiva',
  description: 'Equipamiento deportivo de alto rendimiento',
}

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-base',
  display: 'swap',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const hexToRgb = (hex: string) => {
  const clean = hex.replace('#', '').trim()
  const normalized = clean.length === 3 ? clean.split('').map((c) => `${c}${c}`).join('') : clean
  const value = Number.parseInt(normalized, 16)
  if (Number.isNaN(value) || normalized.length !== 6) {
    return { r: 26, g: 35, b: 126 }
  }
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  }
}

const clamp = (value: number) => Math.max(0, Math.min(255, Math.round(value)))

const shiftColor = (hex: string, amount: number) => {
  const { r, g, b } = hexToRgb(hex)
  return `rgb(${clamp(r + amount)} ${clamp(g + amount)} ${clamp(b + amount)})`
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const storefront = await getStorefrontConfig()
  return (
    <html lang="es">
      <body
        className={`${manrope.variable} ${spaceGrotesk.variable} antialiased`}
        style={
          {
            '--color-primario': storefront.colores.primario,
            '--color-primario-light': shiftColor(storefront.colores.primario, 20),
            '--color-primario-dark': shiftColor(storefront.colores.primario, -35),
            '--color-acento': storefront.colores.acento,
            '--color-acento-light': shiftColor(storefront.colores.acento, 24),
            '--color-acento-dark': shiftColor(storefront.colores.acento, -24),
            '--color-fondo': storefront.colores.fondo,
            '--store-currency-symbol': `"${storefront.moneda.simbolo}"`,
          } as Record<string, string>
        }
      >
        {children}
      </body>
    </html>
  )
}
