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

## Migraciones (CORREGIDAS 2026-07-12/13 — ver seccion final)

> La migracion unica anterior `20260712_024242_ecommerce_delivery_20260711`
> fue ELIMINADA por defectuosa (contenia `DROP TYPE` + recreacion del enum +
> re-cast en `up()`, y una FK `SET NULL` sobre columna `NOT NULL`). Nunca se
> aplico a Produccion. Sustituida por dos migraciones no destructivas:

- `20260702_231456_initial_staging_schema` (previa).
- `20260712_030000_add_ecommerce_order_states` (**Migracion A**, no destructiva):
  amplia el enum `estado_comercial` con 7 estados nuevos via
  `ALTER TYPE ... ADD VALUE IF NOT EXISTS`. Conserva los 5 estados legacy.
  SIN `DROP TYPE`, sin conversion a text, sin perdida de datos. `down()` = no-op
  intencional (PostgreSQL no permite quitar valores de enum sin recrearlo).
- `20260712_030100_ecommerce_delivery_schema` (**Migracion B**): resto del
  esquema (CREATE TABLE / ADD COLUMN / indices / FK). Usa el enum ya confirmado
  por la Migracion A (Payload hace COMMIT entre migraciones). `up()` SIN
  `DROP TYPE`/`DROP TABLE`/`DROP COLUMN`/`DELETE`/`TRUNCATE`. Solo cambia el
  DEFAULT a `pendiente_pago` (valor ya existente). FK
  `comprobantes.orden_id` = **NOT NULL + ON DELETE RESTRICT** (preserva
  evidencia financiera). `down()` concentra los DROP (rollback disponible).

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

## Interruptor maestro de compra (hardening preproduccion)

`ECOMMERCE_ENABLED` (default false; solo `true` habilita). Con false, el
catalogo y la consulta por WhatsApp siguen; la compra online queda apagada de
extremo a extremo, con validacion de SERVIDOR (no solo UI): sin metodos de
pago, sin creacion de pedidos (403), sin descuento de stock, sin comprobantes.
`getStorefrontConfig` recomputa la bandera fuera del Data Cache para que el
cambio se refleje de inmediato. **Produccion debe iniciar con
`ECOMMERCE_ENABLED=false` e `IZIPAY_CARD_ENABLED=false`.**

## Plan EXACTO de aplicacion a Produccion (no ejecutado en esta fase)

1. **Respaldo:** snapshot/backup de la base de Produccion (Neon branch o dump
   `pg_dump` por endpoint directo) ANTES de migrar. Verificar restauracion.
2. **Variables (Vercel, Production):** `ECOMMERCE_ENABLED=false`,
   `IZIPAY_CARD_ENABLED=false`; confirmar `DATABASE_URI`, `PAYLOAD_SECRET`,
   `NEXT_PUBLIC_SERVER_URL`, `BLOB_READ_WRITE_TOKEN` ya presentes; opcional
   `DATABASE_URI_MIGRATIONS` (endpoint directo) para la migracion.
3. **Migracion:** `payload migrate` con la conexion DIRECTA (unpooled) contra
   Produccion; ejecuta A (enum, `ADD VALUE`) y luego B (esquema) en
   transacciones independientes con COMMIT entre ambas. No destructiva en
   `up()` (sin `DROP TYPE`/`DROP TABLE`/`DROP COLUMN`/`DELETE`/`TRUNCATE`); el
   codigo desplegado 1b301a9 sigue funcionando con el esquema nuevo. Revisar salida.
4. **Rama estable:** fast-forward o merge de `feat/ecommerce-entrega-2026-07-11`
   a `stabilize/next16-payload385` (sin tocar `main`).
5. **Despliegue:** desplegar exactamente el commit validado a Production.
6. **Smoke tests (Production, compra apagada):** home/catalogo/ficha 200;
   ficha sin "Añadir al carrito" con WhatsApp; `/api/metodos-pago` = [];
   POST `/api/checkout/ordenes` => 403; izipay session 403; Payload admin OK;
   sin 500 en runtime logs.
7. **Monitoreo:** runtime logs y conexiones Postgres (sin saturacion del
   pooler) durante las primeras horas.
8. **Rollback:** reasignar alias al deployment anterior
   (`dpl_AFgujPtbTFcqCTzFzL9AdcGoXRpY`, commit `1b301a9`) sin rebuild; el `up()`
   es no destructivo (columnas/tablas nuevas ignoradas por el codigo viejo, no
   requiere revertir esquema). Si se revierte el esquema, usar `down()` SOLO si
   no hay pedidos nuevos. Variables: volver a quitar/one-off.

## Datos comerciales PENDIENTES (no inventados)

Logo oficial · razon social · RUC · textos legales aprobados · datos bancarios reales (Yape/Plin/transferencia con QR) · tarifas y cobertura de envio reales · inventario real por talla (activar `ventaOnline`/`ventaHabilitada`) · Izipay produccion (INT_015) · politicas de devolucion · pagina "Nosotros".

Para ACTIVAR la compra online (despues de cargar lo anterior): poner
`ECOMMERCE_ENABLED=true` en Production y redeployar.

## Correccion y validacion de migraciones (2026-07-12/13)

**Afirmacion previa CORREGIDA:** el analisis inicial declaro "`up()` 100 %
aditiva / 0 DROP". Era FALSO: la migracion unica original SI hacia `DROP TYPE`
+ recreacion del enum + re-cast en `up()` (causa raiz: orden del enum con los
valores nuevos primero, que forzaba a Payload a regenerar el tipo de forma
destructiva) y definia la FK de comprobantes como `ON DELETE SET NULL` sobre
una columna `NOT NULL` (contradiccion). Esa migracion fue eliminada (nunca
llego a Produccion) y sustituida por las dos migraciones no destructivas A y B.

**Commits de correccion (sobre la rama):**
- `5670b03` fix: make ecommerce enum migration non-destructive (Migracion A/B)
- `ef12cbc` fix: protect payment proof order relationship (FK RESTRICT + hook `beforeDelete`)
- `90e3d61` docs: correct production migration risk assessment

**Transaccionalidad (verificada en `@payloadcms/drizzle`):** cada migracion
corre en su propia transaccion (`initTransaction` → `up` → `commitTransaction`)
con COMMIT independiente. Por eso A (que agrega valores de enum) y B (que usa
`pendiente_pago` como DEFAULT) van separadas: PostgreSQL no permite usar un
valor de enum recien agregado dentro de la misma transaccion.

**Politica de eliminacion de ordenes (evidencia financiera):** defensa en
profundidad — (1) FK `comprobantes_orden_id_ordenes_id_fk` con `ON DELETE
RESTRICT` a nivel de base; (2) hook `beforeDelete` en `Ordenes.ts` que lanza
`APIError` 409 si la orden tiene comprobantes. Se cancela cambiando el estado
a `cancelado`, nunca borrando la orden.

**Drift conocido (deliberado, NO aplicar):** Payload/drizzle hardcodea
`onDelete: 'set null'` para las FK de relaciones (`traverseFields.js`). Nuestra
FK usa `RESTRICT` a proposito; `migrate:create` reporta ese unico drift. Es
intencional y documentado; no se regenera la migracion por eso.

**Base Preview aislada v2:** `plussport_preview_ecom_v2_20260712` (Neon,
endpoint de la integracion; NO es Produccion ni el respaldo). Datos de prueba
con prefijo `TEST-ECOMMERCE-2026071x`. Migraciones registradas EN ORDEN
(batch 1): `initial_staging_schema` → `add_ecommerce_order_states` →
`ecommerce_delivery_schema`. Verificado en la base: enum legacy-first
(5 + 7 valores), DEFAULT `pendiente_pago`, `comprobantes.orden_id` NOT NULL,
FK `confdeltype = r` (RESTRICT).

**Preview FLAG FALSE:** `dpl_7UYfuXhW9VEeD6M5TW83YF38efWK` (commit `90e3d61`)
`https://plus-sport-mkar-mwb4xr2fi-gshop11s-projects.vercel.app`.
Verificado: `storefront-config.ecommerceEnabled=false`; `/api/metodos-pago`=[];
ficha SIN "Añadir al carrito" (modo "Consultar por WhatsApp"); POST
`/api/checkout/ordenes` → 403 `ECOMMERCE_DISABLED`; carga de comprobante → 403;
Izipay session → 403 `IZIPAY_CARD_DISABLED`; home/productos/ficha/admin 200;
sin errores en consola; cero 500.

**Preview FLAG TRUE:** `dpl_Ga4ArjqBoUUqkTePoR2NwPuKCvio` (commit `90e3d61`)
`https://plus-sport-mkar-94vlly8lo-gshop11s-projects.vercel.app`
(env `ECOMMERCE_ENABLED=true` branch-scoped, `IZIPAY_CARD_ENABLED=false`).
Verificado: `ecommerceEnabled=true`; metodos `yape` + `transferencia`
(Plin incompleto OCULTO, tarjeta OCULTA por flag); ficha CON "Añadir al carrito"
+ selector de talla; pedido idempotente (POST #1 → 201 orden id 1; POST #2 misma
key → 200 `idempotent:true`, misma orden); stock descontado UNA vez (8→6, el
segundo POST no vuelve a descontar); eliminacion fisica de orden con comprobante
RECHAZADA a nivel de base (FK `23503`, probada con `ROLLBACK`, sin cambios
persistentes); Izipay session sigue 403; ~20 rutas 2xx; cero 500.
El flag branch-scoped se restauro a `false` tras la prueba (baseline seguro);
la evidencia flag-true queda inmutable en `dpl_Ga4ArjqBoUUqkTePoR2NwPuKCvio`.

**Validaciones locales:** `npm run typecheck` OK; `npm run build` OK
(compilacion + TypeScript + recoleccion de rutas, con env presentes).

**Estado invariable:** Produccion intacta (`dpl_AFgujPtbTFcqCTzFzL9AdcGoXRpY`
/ `1b301a9`); respaldo `backup-pre-ecommerce-20260712`
(`br-wandering-union-atg5mcjn`) sin tocar; `main` y
`stabilize/next16-payload385` sin cambios; ninguna migracion aplicada a
Produccion; ninguna variable de Production modificada.
