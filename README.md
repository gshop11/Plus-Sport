# PlusSport

Plantilla fullstack de e-commerce deportivo construida con **Next.js 15 + Payload CMS v3**.

Incluye:
- Tienda publica con catalogo, categorias, marcas, carrito y checkout.
- Panel de administracion para gestionar productos, pedidos, banners y configuracion global.
- API interna para productos, clientes, cupones, metodos de pago, suscripciones y creacion de ordenes.

## Stack Tecnologico

- Next.js 15 (App Router)
- React 19 + TypeScript
- Payload CMS 3
- Tailwind CSS
- SQLite por defecto en local
- PostgreSQL en produccion via `DATABASE_URI`

## Estructura del Proyecto

```text
src/
  app/
    (frontend)/                 # Tienda publica
    (payload)/admin/            # Panel admin de Payload
    api/                        # Endpoints del proyecto
  collections/                  # Modelos / colecciones CMS
  components/                   # Componentes UI
  globals/                      # Configuracion global editable
  lib/                          # Utilidades storefront
  payload.config.ts             # Config principal de Payload
  seed.ts                       # Seed base de datos (demo)
  seed-catalogo.ts              # Seed de catalogo propio (requiere assets locales)
public/
scripts/next-workflow.ps1       # Flujo de dev/build/start en Windows
```

## Requisitos

- Node.js 20 LTS recomendado (minimo `20.9.0`)
- npm 10+

Usa `.nvmrc` si quieres alinear rapido el runtime local.

## Configuracion de Entorno

1. Copia el ejemplo:

```bash
cp .env.example .env
```

2. Define al menos:
- `PAYLOAD_SECRET`
- `NEXT_PUBLIC_SERVER_URL`

Variables opcionales:
- `DATABASE_URI` para PostgreSQL
- `BLOB_READ_WRITE_TOKEN` para uploads en Vercel Blob
- `NEXT_PUBLIC_MEDIA_BASE_URL` si tus imagenes viven en un bucket o CDN externo

Sin `DATABASE_URI`, el proyecto usa SQLite local en `dev.db`.

## Instalacion

```bash
npm install
```

## Comandos

```bash
npm run dev
npm run build
npm run start
npm run reset
npm run generate:types
npm run seed
npm run seed:catalogo
```

En Windows con PowerShell y politicas restrictivas tambien puedes usar:

```bash
cmd /c npm run dev
cmd /c npm run build
cmd /c npm run start
cmd /c npm run reset
```

## Flujo de Datos

1. El frontend consulta productos y configuracion desde Payload.
2. En checkout:
   - se crea el cliente (`/api/clientes`)
   - se valida el cupon (`/api/cupones/validar`, si aplica)
   - se registra la orden (`/api/checkout/ordenes`)
3. El panel admin permite gestionar catalogo, pedidos y contenido visual.

## Endpoints del Proyecto

- `GET /api/productos`
- `POST /api/clientes`
- `POST /api/checkout/ordenes`
- `POST /api/cupones/validar`
- `GET /api/metodos-pago`
- `GET /api/store-identity`
- `POST /api/suscribir`
- `ALL /api/[...slug]`

## Media y Entornos

- En local, los archivos de `media` se sirven desde `/media` y `public/media`.
- Si Payload ya devuelve una `url` absoluta, el storefront la usa tal cual.
- Si alojas media en Blob o CDN y solo conservas `filename`, define `NEXT_PUBLIC_MEDIA_BASE_URL` para resolver esas URLs de forma consistente entre local y produccion.

## Notas de Produccion

- No subas archivos sensibles (`.env`, backups, logs, datasets locales).
- Define `PAYLOAD_SECRET` robusto.
- Configura la base de datos y el storage de media segun tu entorno.
