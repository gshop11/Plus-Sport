import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/app/**/*.{ts,tsx}', './src/components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primario)',
          light: 'var(--color-primario-light)',
          dark: 'var(--color-primario-dark)',
        },
        accent: {
          DEFAULT: 'var(--color-acento)',
          light: 'var(--color-acento-light)',
          dark: 'var(--color-acento-dark)',
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

