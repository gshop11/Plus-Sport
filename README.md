# PlusSport

Plantilla fullstack de e-commerce deportivo construida con **Next.js 15 + Payload CMS v3**.

Incluye:
- Tienda pública con catálogo, categorías, marcas, carrito y checkout.
- Panel de administración para gestionar productos, pedidos, banners y configuración global.
- API interna para productos, clientes, cupones, métodos de pago, suscripciones y creación de órdenes.

## Stack Tecnológico

- Next.js 15 (App Router)
- React 19 + TypeScript
- Payload CMS 3
- Tailwind CSS
- SQLite (desarrollo por defecto)
- PostgreSQL (producción vía `DATABASE_URI`)

## Funcionalidades Principales

- Catálogo de productos con filtros por categoría y marca.
- Página de ofertas y páginas por categoría.
- Carrito persistido en cliente.
- Checkout con registro de cliente y creación de orden.
- Validación de cupones y consulta de métodos de pago.
- Panel admin en `/admin` con colecciones de negocio:
  - `Productos`, `Categorias`, `Marcas`, `Media`
  - `Clientes`, `Ordenes`, `Cupones`, `Envios`, `Suscriptores`
  - `Banners` + global `ConfigTienda`

## Estructura del Proyecto

```text
src/
  app/
    (frontend)/                 # Tienda pública
    (payload)/admin/            # Panel admin de Payload
    api/                        # Endpoints del proyecto
  collections/                  # Modelos/colecciones CMS
  components/                   # Componentes UI
  globals/                      # Configuración global editable
  lib/                          # Utilidades storefront
  payload.config.ts             # Config principal de Payload
  seed.ts                       # Seed base de datos (demo)
  seed-catalogo.ts              # Seed de catálogo propio (requiere assets locales)
public/
scripts/next-workflow.ps1       # Flujo de dev/build/start en Windows
```

## Requisitos

- Node.js 20+ recomendado
- npm 10+

## Configuración de Entorno

1. Copia el ejemplo:

```bash
cp .env.example .env
```

2. Define al menos:
- `PAYLOAD_SECRET` (obligatorio en producción)
- `DATABASE_URI` (solo si usarás PostgreSQL; en local usa SQLite automáticamente)
- `NEXT_PUBLIC_SERVER_URL` (URL pública de la tienda)

## Instalación

```bash
npm install
```

## Comandos

```bash
npm run dev            # Desarrollo (Next + turbo)
npm run build          # Build producción
npm run start          # Build + start producción
npm run reset          # Limpia .next
npm run generate:types # Genera tipos de Payload
npm run seed           # Carga data demo base
npm run seed:catalogo  # Carga catálogo propio (si tienes assets locales)
```

## Flujo de Datos

1. El frontend consulta productos y configuración desde Payload.
2. En checkout:
   - se crea/actualiza cliente (`/api/clientes`)
   - se valida cupón (`/api/cupones/validar`, si aplica)
   - se registra orden (`/api/checkout/ordenes`)
3. El panel admin permite gestionar catálogo, pedidos y contenido visual.

## Endpoints del Proyecto

- `GET /api/productos`
- `POST /api/clientes`
- `POST /api/checkout/ordenes`
- `POST /api/cupones/validar`
- `GET /api/metodos-pago`
- `GET /api/store-identity`
- `POST /api/suscribir`
- `ALL /api/[...slug]` (proxy REST de Payload)

## Base de Datos

- Sin `DATABASE_URI`: usa `SQLite` local (`dev.db`).
- Con `DATABASE_URI`: usa `PostgreSQL` (recomendado para producción).

## Notas de Producción

- No subas archivos sensibles (`.env`, backups, logs, datasets locales).
- Define `PAYLOAD_SECRET` robusto.
- Configura almacenamiento de media y base de datos administrada según tu entorno.

## Estado del Repositorio Público

Este repositorio está optimizado para publicación: se retiraron assets y tooling local no esenciales para mantener seguridad, tamaño y mantenibilidad.

---

Si quieres convertir esta plantilla en una tienda para una marca específica, el punto de entrada recomendado es `ConfigTienda` en el admin y el script `src/seed.ts` para datos iniciales.
