import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
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

const databaseUri = process.env.DATABASE_URI || process.env.DATABASE_URL
const payloadSecret = process.env.PAYLOAD_SECRET || 'fallback-secret-key'

if (!databaseUri) {
  console.warn('⚠️  ADVERTENCIA: DATABASE_URI o DATABASE_URL no están definidas. Payload usará SQLite temporalmente.')
}

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
  db: databaseUri
    ? postgresAdapter({ pool: { connectionString: databaseUri }, push: true })
    : sqliteAdapter({ client: { url: `file:${sqlitePath}` } }),

  // Clave secreta
  secret: payloadSecret,

  // TypeScript
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },

  // Almacenamiento de archivos: Vercel Blob en producción, disco local en desarrollo
  plugins: [
    ...(process.env.BLOB_READ_WRITE_TOKEN
      ? [
          vercelBlobStorage({
            enabled: true,
            collections: {
              media: true,
            },
            token: process.env.BLOB_READ_WRITE_TOKEN,
          }),
        ]
      : []),
  ],

  // Idioma del panel
  i18n: {
    fallbackLanguage: 'es',
  },
})
