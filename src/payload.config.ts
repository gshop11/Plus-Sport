import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { sqliteAdapter } from '@payloadcms/db-sqlite'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { getDatabaseUri, getPayloadSecret, shouldPushPayloadSchema, validateServerEnv } from './lib/env'

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

validateServerEnv()

// Prefer a direct/unpooled PostgreSQL connection for Payload/Drizzle compatibility.
const databaseUri = getDatabaseUri()
const payloadSecret = getPayloadSecret()
const pushSchema = shouldPushPayloadSchema()
const sqlitePushSchema = process.env.PAYLOAD_DB_PUSH?.trim().toLowerCase() === 'true'

if (!databaseUri) {
  console.warn('WARNING: No PostgreSQL connection string was found. Payload will use local SQLite for development.')
}

export default buildConfig({
  admin: {
    user: Usuarios.slug,
    meta: {
      titleSuffix: '- Panel Admin',
    },
  },

  collections: [
    Usuarios,
    Media,
    Categorias,
    Marcas,
    Productos,
    Clientes,
    Ordenes,
    Cupones,
    Envios,
    Suscriptores,
    Banners,
  ],

  globals: [ConfigTienda],

  editor: lexicalEditor(),

  sharp,

  // SQLite is for local development only. Production requires PostgreSQL.
  // PAYLOAD_DB_PUSH defaults to false in production to avoid automatic schema changes.
  // In local SQLite it must also be opt-in: Drizzle can ask interactive rename
  // questions on schema drift and block storefront navigation requests.
  db: databaseUri
    ? postgresAdapter({ pool: { connectionString: databaseUri }, push: pushSchema })
    : sqliteAdapter({ client: { url: `file:${sqlitePath}` }, push: sqlitePushSchema }),

  secret: payloadSecret,

  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },

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

  i18n: {
    fallbackLanguage: 'es',
  },
})
