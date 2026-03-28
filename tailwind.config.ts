import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/app/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Colores base — se pueden cambiar desde el panel admin (SiteSettings)
        primary: {
          DEFAULT: '#1a237e', // Azul marino
          light: '#283593',
          dark: '#0d1757',
        },
        accent: {
          DEFAULT: '#ff6f00', // Naranja
          light: '#ffa000',
          dark: '#e65100',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config
