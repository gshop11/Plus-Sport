# PROGRESO — Entrega Ecommerce Plus Sport — 2026-07-11

Documento de progreso por fases. Permite reanudar el trabajo si se pierde el contexto de la sesión.

- Repositorio: `https://github.com/gshop11/Plus-Sport.git` (origin verificado)
- Rama base: `stabilize/next16-payload385` @ `28fe78ee3dd10d478d5a7a82a34c2cf4ad8c7361`
- Rama de trabajo: `feat/ecommerce-entrega-2026-07-11`
- Producción vigente (verificada hoy vía Vercel API): `dpl_AFgujPtbTFcqCTzFzL9AdcGoXRpY`, commit `1b301a9c19f2c8b977baa356dc3aca74f6540d8e`, target production, READY, rollback candidate.
- Proyecto Vercel: `plus-sport-mkar` (`prj_lqhgGX5ddoyr5CF3INVOJnaVcRiO`, team `team_0WzvT96IcxfKEA3lOLfoU0vC`). Dominios: plussport.pe, www.plussport.pe, plus-sport-mkar.vercel.app.
- REGLA: NO desplegar Producción. Solo Preview. Esperar orden textual exacta `GO PROD`.

---

## FASE 0 — Auditoría de solo lectura

- **Estado:** COMPLETADA
- **HEAD inicial:** `3236f1a` (rama local `feat/izipay-krypton-migration`), base remota `28fe78e`.
- **Comandos:** `git remote -v`, `git fetch --all --prune`, `git branch -vv`, `git status --short`, `git log -10 --oneline`, `git tag --list`, `git checkout stabilize/next16-payload385`, `git pull --ff-only` (Already up to date), `npm ci` (OK), `npm run typecheck` (OK, 0 errores), inspección Vercel (get_project, list_deployments, `vercel env ls`, `vercel env pull` a scratchpad), inspección Neon en SOLO LECTURA vía `pg`.

### Hallazgos de repositorio
- origin = gshop11/Plus-Sport ✔. Rama base existe y coincide con remoto ✔. Working tree limpio ✔.
- Sin secretos versionados: solo `.env.example` con placeholders. `.env.local` (no versionado) contiene solo variables Izipay sandbox + PAYLOAD_DB_PUSH (nombres, no valores, registrados).
- Rama local `feat/izipay-krypton-migration` = `28fe78e` + 2 commits (`6878736`, `3236f1a`) con la migración Izipay Krypton REST V4 (toca solo archivos Izipay + checkout). No está en el remoto.
- `main` divergente: NO tocar (regla).
- Existe flujo completo de carrito/checkout/pagos/ordenes en el código, oculto de la navegación desde Fase 5B.15 (documentado en `audit/FASE_5B_15_CIERRE_FINAL.md`).

### Infraestructura verificada
- **Local:** sin `DATABASE_URI` → Payload usa SQLite `dev.db`. Aislado de Neon. `npm run build` local falla por diseño sin secretos de producción (limitación conocida, no de código).
- **Producción (Vercel):** variables `DATABASE_URI`, `PAYLOAD_SECRET` (sensitive, no legibles — correcto), `NEXT_PUBLIC_SERVER_URL`, `BLOB_READ_WRITE_TOKEN`, `PAYLOAD_DB_PUSH=false`.
- **Preview genérico (aplicaría a ramas feat/*):** integración Neon (`DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `POSTGRES_URL*`, `PG*`, `NEON_PROJECT_ID`) → base `neondb` en endpoint `ep-lucky-b…aws.neon.tech` (pooler y directo), sslmode=require. `BLOB_READ_WRITE_TOKEN` distinto al de Producción ✔. `PAYLOAD_SECRET` propio ✔.
- **Preview branch-scoped (solo stabilize):** `DATABASE_URI` sensitive propia (presumiblemente la misma base que Producción; no legible). Mi rama feat/* NO la hereda.
- **Verificación empírica (solo lectura) de `neondb`:** contiene datos staging antiguos (75 productos Joma, 27 clientes, 3 órdenes, banner ANTIGUO "ENVIO GRATIS POR COMPRAS MAYORES A S/299" que Producción ya no tiene) → **`neondb` NO es la base de Producción**. Esquema DESALINEADO con el código actual: falta tabla `marcas`; sobran `complementos`, `ocasiones`; `payload_migrations` registra solo push dev (batch -1).
- **Conclusión de aislamiento:** Preview de mi rama queda aislado de Producción, pero la base `neondb` no puede usarse tal cual (esquema roto). Plan: crear base NUEVA en el mismo endpoint Neon (`CREATE DATABASE`), aplicar migraciones versionadas y apuntar la Preview de mi rama con variable branch-scoped. Sin tocar Producción.
- **Causa raíz de saturación de conexiones:** `src/lib/env.ts` prioriza `DATABASE_URL_UNPOOLED` (endpoint DIRECTO) para runtime serverless. Corregir en Fase 2 (usar pooler en runtime, directo para migraciones).

### Diagnóstico clasificado
- **BLOQUEO:** ninguno.
- **CRÍTICO:**
  1. `/api/metodos-pago` activa por defecto TODOS los métodos (incl. tarjeta/Izipay y efectivo) si no hay configuración → viola reglas; eliminar defaults.
  2. Creación de pedidos sin idempotencia, sin descuento/reserva de stock (sobreventa posible), sin transacción (`src/app/api/checkout/ordenes/route.ts`).
  3. Tarifa de envío inventada hardcodeada (S/15, gratis ≥ S/299) en carrito y checkout API; colección `envios` existe pero no se usa.
  4. Conexión PostgreSQL directa en runtime serverless (saturación conocida).
  5. Preview de feat/* rompería hoy por esquema desalineado de `neondb`.
- **ALTO:**
  6. Izipay sin feature flag `IZIPAY_CARD_ENABLED`.
  7. Checkout sin nombres/apellidos separados, sin documento, sin aceptación de términos persistida.
  8. Sin carga segura de comprobantes de pago.
  9. `ConfigTienda.pagos.metodos` sin campos de datos reales (número, titular, QR, banco, cuenta, CCI) → métodos manuales no configurables.
  10. Estados de pedido sin flujo manual (falta comprobante_recibido, pago_en_revision, etc.).
- **MEDIO:** PDP en modo solo-consulta (reactivar compra con stock real); footer sin teléfono/dirección reales (datos entregados por el dueño hoy); contenido legal ausente; snapshot de items incompleto (sin SKU/imagen/precioAnterior).
- **BAJO:** overflow de búsqueda móvil a 390px (preexistente); advertencia sslmode del driver pg.

### Datos comerciales conocidos (entregados por el dueño, configurables en Fase 11)
- Teléfono: +51 967 438 872 · Dirección: Av. España 2023, C.C. Gold Center, tienda 3, Trujillo · Frase: "20 años caminando contigo".

---

## FASE 1 — Rama de trabajo

- **Estado:** COMPLETADA
- **Objetivo:** crear `feat/ecommerce-entrega-2026-07-11` y baseline de documentación.
- **HEAD inicial:** `28fe78e` (stabilize). **HEAD de partida de la rama:** `3236f1a`.
- **Decisión:** la rama se crea desde `feat/izipay-krypton-migration` (= `28fe78e` + commits `6878736` y `3236f1a`), verificado con `git merge-base` que desciende del HEAD limpio de la rama base. Motivo: la Fase 9 exige conservar la integración Izipay Krypton REST V4 ya implementada (incidente INT_015 pendiente con soporte). No se reescribió historial ni se hizo force push.
- **Archivos:** `audit/PROGRESO_ECOMMERCE_2026-07-11.md` (nuevo).
- **Rollback:** borrar la rama local (la base permanece intacta).
- **Siguiente acción:** Fase 2 (PostgreSQL serverless + base Preview aislada).

---

## FASE 2 — Infraestructura y PostgreSQL

- **Estado:** COMPLETADA — commit `08cab0d`
- Runtime prioriza endpoints pooled; hosts Neon se reescriben a `-pooler` en Vercel (opt-out `PG_DISABLE_POOLER_REWRITE`); sslmode explicito `verify-full`; migraciones por endpoint directo (`DATABASE_URI_MIGRATIONS`); pool acotado (`PG_POOL_MAX`, default 5); `PAYLOAD_DB_PUSH` opt-in siempre.
- Base Preview aislada creada: `plussport_preview_ecom_20260711` en el endpoint Neon de la integracion (CREATE DATABASE aditivo; el endpoint solo contenia neondb y postgres — la BD de Produccion vive en OTRO host).
- Pendiente: aplicar migraciones a esa base y variable branch-scoped `DATABASE_URI` para la Preview de esta rama.
- Rollback: revertir commit; la BD nueva puede eliminarse sin impacto.

## FASE 3 — Variantes y stock

- **Estado:** COMPLETADA — commit `06816db`
- ventaOnline (producto, default false) + ventaHabilitada/skuVariante/precio/imagen por talla (default false). Rangos historicos NO vendibles. `lib/purchase.ts` (reglas puras) y `lib/inventory.ts` (descuento atomico condicional + restauracion). Politica de stock: sin reservas; descuento al crear pedido dentro de transaccion; restauracion unica al cancelar.

## FASE 4 — Ficha de producto

- **Estado:** COMPLETADA — commit `802dc6e`
- Panel de compra solo para variantes vendibles con stock; modo consulta WhatsApp intacto para el resto. Carrito v2 cliente (solo referencias + precioRef de render). Header con acceso a carrito.

## FASE 5 — Carrito

- **Estado:** COMPLETADA — commit `780073a`
- `POST /api/checkout/validar` reconstruye el carrito en servidor (stock/precio/cupon/envio). Pagina /carrito con estados por item, vaciar, cupon server-validated. Se elimino la tarifa hardcodeada S/15 / gratis >= 299.

## FASE 6 — Checkout

- **Estado:** COMPLETADA — commit `d0b4a6d`
- Pasos: datos personales (nombres/apellidos/tipoDoc/numDoc/email/celular), entrega (delivery con departamento/provincia/distrito o recojo solo si configurado), pago (solo metodos completos; sin metodos => WhatsApp). Terminos/privacidad persistidos. Distrito sin tarifa => coordinar por WhatsApp (sin total inventado).

## FASE 7 — Pedidos

- **Estado:** COMPLETADA — commit `32d7ae0`
- Ordenes: estados completos, idempotencyKey unica, snapshot completo por item, historial de estados, restauracion de stock al cancelar. Endpoint transaccional con descuento atomico de stock y consumo de cupon. Lookup publico solo por codigoCorrelacion. /api/clientes deprecado (410).

## FASE 8 — Pagos manuales

- **Estado:** COMPLETADA — commit `3a8a77c`
- ConfigTienda: datos completos por metodo (numero/titular/QR/banco/cuenta/CCI/moneda), puntos de recojo, legal. /api/metodos-pago sin defaults (solo activos Y completos). Coleccion comprobantes (lectura admin) + endpoint de subida con validacion de MIME real (magic bytes), 5 MB max, 5 por orden. Comprobante => comprobante_recibido, nunca pagado.
- Decision documentada: datos obligatorios Yape/Plin = numero + titular (QR opcional); transferencias = banco + titular + cuenta + CCI.
- Riesgo residual documentado: Vercel Blob sirve URLs publicas no adivinables; el documento del comprobante es admin-only pero la URL subyacente no esta detras de auth.

## FASE 9 — Izipay

- **Estado:** COMPLETADA — commit `b93d4f4`
- IZIPAY_CARD_ENABLED=false por defecto: tarjeta oculta; session/visual-result 403; webhook 503 controlado; SDK no se carga. INT_015 documentado en README_IZIPAY.md seccion 9 (punto exacto, archivos, proceso de activacion). Sin transacciones reales.

## FASE 10 — Payload CMS

- **Estado:** COMPLETADA (en commits 3a8a77c/32d7ae0)
- Ordenes: listado (numero/cliente/total/metodo/estados/fecha) y detalle completo con snapshots, comprobantes, historial y notas. Acceso: read/update admin+vendedor, delete solo admin, create solo autenticado (publico via endpoint). Comprobantes solo visibles autenticado.

## FASE 11 — Storefront

- **Estado:** COMPLETADA — commit `2144105`
- Placeholder "¿Que estas buscando?"; menu por defecto Hombre/Mujer/Ninos/Colecciones/Marcas/Ofertas; footer con datos reales del negocio (+51 967 438 872; Av. Espana 2023, C.C. Gold Center tienda 3, Trujillo; "20 anos caminando contigo") y enlaces legales; footer sin metodos de pago inventados.
- Pendiente comercial: pagina "Nosotros" (sin contenido real disponible).

## FASE 12 — Legal

- **Estado:** COMPLETADA — commit `2144105`
- Rutas /terminos, /privacidad, /cambios-devoluciones, /entregas administrables (config-tienda > legal, richText) con aviso de contenido pendiente. Aceptacion guardada en el pedido con fecha y version (config legal.versionTerminos). razonSocial/RUC: campos PENDIENTES sin valores inventados. No se guarda IP ni user agent (sin justificacion de tratamiento).

## CHECKPOINT DE RECUPERACION (2026-07-12)

- **Interrupcion:** el limite de uso corto la sesion tras generar/aplicar la migracion y crear el seed de prueba. HEAD recuperado: `2144105`. Sin commit habian quedado: la migracion (`src/migrations/20260712_024242_*` + `index.ts`) y este archivo de progreso.
- **Migracion commiteada:** `d13938d`. Revisada: `up()` solo aditivo (CREATE TABLE / ADD COLUMN), operaciones destructivas (DROP) SOLO en `down()`. Retrocompatible. Aplicada a la base Preview AISLADA `plussport_preview_ecom_20260711` (endpoint Neon de la integracion; NO es la base de Produccion).
- **Auditoria de volumen:** diff real rama vs base = 5694/2388 en 43 archivos (el numero 24527 de la interfaz era acumulado de sesion). Sin binarios, dumps, datos demo ni secretos. El insert grande (1504) es `payload-types.ts` (generado por Payload, correcto versionar).
- **Validaciones:** `npm run typecheck` OK; `npm run build` OK (todas las rutas presentes). Fix menor: comprobante con archivo corrupto ahora responde 415 (antes 500 generico) — commit `<fix>`.

## FASE 13 — Pruebas

- **Estado:** COMPLETADA (Preview local contra base aislada)
- **Smoke de logica P0 (16/16 OK):** comprabilidad (runner comprable con 2 variantes vendibles; rango "36 al 40" NO comprable; talla habilitada con stock 0 NO comprable); metodos de pago (solo yape+transferencia; Plin incompleto OCULTO; tarjeta OCULTA por flag; yape con numero+titular); validacion de carrito (subtotal/envio/total server-side; cantidad 9 sobre stock 2 => ajustado; agotado => sin stock; distrito sin tarifa => coordinar total null; cupon TEST10 10%; retiro tienda envio 0); descuento de stock atomico (5->4) y sobreventa (999) bloqueada.
- **Smoke HTTP (13/13 OK)** en server de produccion local (`npm run start`, base aislada): metodos-pago solo yape+transferencia; validar carrito; izipay session 403 por flag; /api/clientes 410; pedido creado 201; segundo POST misma idempotencyKey => mismo pedido (idempotente); estado pendiente_pago/pending; tarjeta rechazada 400; distrito sin tarifa 422 coordinar; email invalido 400; webhook izipay 503 por flag; GET orden por codigoCorrelacion; telefono enmascarado.
- **Comprobantes:** PNG 1x1 valido => 201 y orden pasa a comprobante_recibido; MIME falso (texto con .png) => 415; PDF/archivo corrupto => 415; orderRef inexistente => 404.
- **Persistencia verificada en BD:** orden en comprobante_recibido, estado_pago pending, total 209.9 (199.9 + envio 10 Trujillo), stock_descontado true; historial de estados con 2 filas; 1 comprobante; stock talla 41 descontado 2->1.
- **Datos de prueba:** prefijo `TEST-ECOMMERCE-20260711` en la base aislada. NO usar en Produccion. La base entera puede eliminarse tras la entrega.

## FASE 14 — Git

- **Estado:** CONTINUO — commits `3f68131..` (ver `git log`). Sin force push, sin secretos, sin binarios/dumps.

## FASE 15 — Preview

- **Estado:** COMPLETADA y VERIFICADA.
- **Rama pusheada:** `feat/ecommerce-entrega-2026-07-11` (commit final tras docs).
- **Variables branch-scoped (Preview):** `DATABASE_URI` = base aislada `plussport_preview_ecom_20260711`; `IZIPAY_CARD_ENABLED` = false.
- **Deployment valido:** `dpl_6qS7b7H7Ka75tiVLpre4F1Q2guMB` (redeploy que tomo las variables branch-scoped), READY. URL: `plus-sport-mkar-759wch65e-gshop11s-projects.vercel.app` (protegida por SSO de equipo; se accedio con share link temporal de Vercel).
- **Incidencia y correccion:** el primer deployment del push (`dpl_FnLt1wrdhqJnBZ4Tu99rVxPgfzKb`) se creo antes de que la variable branch-scoped existiera y tomo la base de integracion `neondb` (esquema viejo => catalogo/metodos vacios por catches defensivos; NO es Produccion; verificado por runtime logs sin errores de conexion). Se resolvio con un redeploy.
- **Verificacion en Preview real (base aislada):** home 200; `/productos` muestra los 4 productos TEST-ECOMMERCE; ficha `test-runner-azul` "Disponible para compra online" con tallas 40/41 (no 42 sin stock, no 43 deshabilitada), stock+SKU y "Añadir al carrito"; `/api/metodos-pago` solo yape+transferencia (Plin incompleto y tarjeta ocultos); pedido idempotente 201 + segundo POST mismo pedido; tarjeta 400; Izipay session 403; webhook 503; `/terminos` "contenido en preparacion"; carrito vacio correcto. Runtime logs: 0 errores 500 (solo el 503 de webhook y 400/403 esperados de las pruebas).
- **Build logs:** sin errores. **Base de Produccion:** NO tocada.

## DICTAMEN

GO CON BLOQUEOS COMERCIALES. P0 tecnicamente cerrado y verificado en Preview aislado. Faltan datos comerciales reales (bancarios, tarifas, inventario, legal, Izipay produccion) para operar; ninguno es un defecto tecnico. Detener antes de Produccion; esperar `GO PROD`.
