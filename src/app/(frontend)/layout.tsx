import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { getStorefrontConfig } from '@/lib/storefront'
import './globals.css'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Tienda Deportiva',
  description: 'Equipamiento deportivo de alto rendimiento',
}

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
        className={`${inter.className} antialiased`}
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
