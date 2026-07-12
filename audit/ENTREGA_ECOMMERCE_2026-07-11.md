# ENTREGA TECNICA — Ecommerce Plus Sport — 2026-07-11/12

Documento tecnico de la entrega. Complementa `audit/PROGRESO_ECOMMERCE_2026-07-11.md`
(bitacora por fases) y `README_IZIPAY.md` (seccion 9, incidente INT_015).

## Repositorio y ramas

- Repositorio: `https://github.com/gshop11/Plus-Sport.git`
- Rama base oficial: `stabilize/next16-payload385` @ `28fe78e`
- Rama de trabajo / entrega: `feat/ecommerce-entrega-2026-07-11`
- HEAD inicial de la rama: `3236f1a` (= 28fe78e + Izipay Krypton REST V4)
- `main` (historico divergente) NO fue tocada.

## Commits de la entrega (sobre 3236f1a)

```
3f68131 chore: establish ecommerce delivery baseline
08cab0d fix: stabilize serverless postgres configuration
06816db feat: add product variants and inventory model
802dc6e feat: enable variant-based product purchasing
780073a feat: implement persistent validated cart
3a8a77c feat: implement manual payment proof workflow
32d7ae0 feat: add idempotent order creation workflow
d0b4a6d feat: implement server-validated checkout
b93d4f4 feat: harden izipay behind feature flag
2144105 fix: align storefront with commercial requirements
d13938d feat: add ecommerce delivery schema migration
e9c4ca5 test: validate complete ecommerce flow
```

## Arquitectura y archivos clave

- **Infra Postgres serverless** (`src/lib/env.ts`, `src/payload.config.ts`): runtime pooled + reescritura a endpoint `-pooler` de Neon en Vercel, sslmode `verify-full`, migraciones por endpoint directo, pool acotado.
- **Modelo de compra** (`src/collections/Productos.ts`, `src/lib/purchase.ts`, `src/lib/inventory.ts`): `ventaOnline` (producto) + `ventaHabilitada`/`skuVariante`/`precio`/`imagen` por talla; descuento de stock atomico transaccional; restauracion al cancelar.
- **Carrito/checkout servidor** (`src/lib/checkout-server.ts`, `src/app/api/checkout/validar/route.ts`): reconstruccion y recalculo total en servidor (precio/stock/cupon/envio). Envio solo desde coleccion `envios`; sin tarifa => coordinar por WhatsApp.
- **Pedidos** (`src/collections/Ordenes.ts`, `src/app/api/checkout/ordenes/route.ts`): idempotencia por `idempotencyKey` unica, transaccion con descuento de stock, snapshot completo, estados y historial, aceptacion legal.
- **Pagos manuales** (`src/globals/ConfigTienda.ts`, `src/lib/payment-methods.ts`, `src/app/api/metodos-pago/route.ts`): solo metodos activos Y completos; sin defaults.
- **Comprobantes** (`src/collections/Comprobantes.ts`, `.../[orderRef]/comprobante/route.ts`): validacion de MIME real (magic bytes), 5 MB, acceso admin, => `comprobante_recibido`.
- **Izipay** (`src/app/api/payments/izipay/*`, `src/lib/payment-methods.ts`): tras `IZIPAY_CARD_ENABLED` (false).
- **Storefront/legal** (`HeaderClient.tsx`, `Footer.tsx`, `LegalPage.tsx`, rutas `/terminos` etc.).

## Migraciones

- `20260702_231456_initial_staging_schema` (previa).
- `20260712_024242_ecommerce_delivery_20260711` (nueva): `up()` solo aditivo (CREATE TABLE / ADD COLUMN), destructivo (DROP) SOLO en `down()`. Retrocompatible.

## Variables por entorno (solo nombres)

- Runtime: `DATABASE_URI` (o `DATABASE_URL`/`POSTGRES_URL`), `PAYLOAD_SECRET`, `NEXT_PUBLIC_SERVER_URL`, `BLOB_READ_WRITE_TOKEN`, `PAYLOAD_DB_PUSH`, `PG_POOL_MAX`, `PG_DISABLE_POOLER_REWRITE`.
- Migraciones: `DATABASE_URI_MIGRATIONS` / `POSTGRES_URL_NON_POOLING` / `DATABASE_URL_UNPOOLED`.
- Izipay: `IZIPAY_CARD_ENABLED`, `IZIPAY_ENV`, `IZIPAY_API_BASE_URL`, `IZIPAY_API_USERNAME`, `IZIPAY_API_PASSWORD`, `IZIPAY_PUBLIC_KEY`, `IZIPAY_HMAC_SHA256_KEY`, `IZIPAY_KR_*`, `IZIPAY_RETURN_URL`, `IZIPAY_WEBHOOK_URL`, `IZIPAY_CURRENCY`.

## Base de datos por entorno

- **Local:** SQLite `dev.db` (sin `DATABASE_URI`).
- **Preview (esta rama):** base Neon AISLADA `plussport_preview_ecom_20260711` (creada aditivamente en el endpoint de la integracion; migraciones aplicadas; datos de prueba con prefijo `TEST-ECOMMERCE-20260711`). Variable `DATABASE_URI` branch-scoped para `feat/ecommerce-entrega-2026-07-11`.
- **Produccion:** `DATABASE_URI` propia (host distinto de `neondb`); NO tocada en esta entrega.

## Rollback

- **Codigo:** `git revert` de los commits de la rama (no destructivo) o simplemente no fusionar.
- **Base Preview:** la base aislada `plussport_preview_ecom_20260711` puede eliminarse sin impacto (no la usa Produccion).
- **Migracion en Produccion:** aun NO aplicada. Cuando se aplique, `down()` revierte el esquema; es preferible NO revertir tras recibir pedidos reales (perdida de columnas de snapshot).
- **Variables:** `IZIPAY_CARD_ENABLED` y `DATABASE_URI` branch-scoped pueden eliminarse desde Vercel.

## Datos comerciales PENDIENTES (no inventados)

Logo oficial · razon social · RUC · textos legales aprobados · datos bancarios reales (Yape/Plin/transferencia con QR) · tarifas y cobertura de envio reales · inventario real por talla (activar `ventaOnline`/`ventaHabilitada`) · Izipay produccion (INT_015) · politicas de devolucion · pagina "Nosotros".
