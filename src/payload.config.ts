import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

// Collections (Backoffice)
import { Usuarios } from './collections/Usuarios'
import { Media } from './collections/Media'
import { Categorias } from './collections/Categorias'
import { Marcas } from './collections/Marcas'
import { Productos } from './collections/Productos'
import { Clientes } from './collections/Clientes'
import { Ordenes } from './collections/Ordenes'
import { Cupones } from './collections/Cupones'
import { Envios } from './collections/Envios'
import { Suscriptores } from './collections/Suscriptores'

// Collections (Frontend)
import { Banners } from './collections/Banners'

// Globals
import { ConfigTienda } from './globals/ConfigTienda'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)
const sqlitePath = path.resolve(dirname, '../dev.db').replace(/\\/g, '/')

export default buildConfig({
  admin: {
    user: Usuarios.slug,
    meta: {
      titleSuffix: '— Panel Admin',
    },
  },

  // Todas las colecciones
  collections: [
    // Administración
    Usuarios,
    Media,
    // Catálogo
    Categorias,
    Marcas,
    Productos,
    // Ventas
    Clientes,
    Ordenes,
    Cupones,
    Envios,
    Suscriptores,
    // Diseño de tienda
    Banners,
  ],

  // Configuración global de la tienda
  globals: [ConfigTienda],

  // Editor de texto enriquecido
  editor: lexicalEditor(),

  // Habilita resize/transform de imagenes en Payload
  sharp,

  // Base de datos: SQLite en local, PostgreSQL en producción
  db: (process.env.DATABASE_URI || process.env.DATABASE_URL)
    ? postgresAdapter({ pool: { connectionString: process.env.DATABASE_URI || process.env.DATABASE_URL } })
    : sqliteAdapter({ client: { url: `file:${sqlitePath}` } }),

  // Clave secreta
  secret: process.env.PAYLOAD_SECRET || 'fallback-secret-key',

  // TypeScript
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },

  // Idioma del panel
  i18n: {
    fallbackLanguage: 'es',
  },
})
