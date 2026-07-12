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

- **Estado:** PENDIENTE

## FASE 3 — Variantes y stock

- **Estado:** PENDIENTE

## FASE 4 — Ficha de producto

- **Estado:** PENDIENTE

## FASE 5 — Carrito

- **Estado:** PENDIENTE

## FASE 6 — Checkout

- **Estado:** PENDIENTE

## FASE 7 — Pedidos

- **Estado:** PENDIENTE

## FASE 8 — Pagos manuales

- **Estado:** PENDIENTE

## FASE 9 — Izipay

- **Estado:** PENDIENTE

## FASE 10 — Payload CMS

- **Estado:** PENDIENTE

## FASE 11 — Storefront

- **Estado:** PENDIENTE

## FASE 12 — Legal

- **Estado:** PENDIENTE

## FASE 13 — Pruebas

- **Estado:** PENDIENTE

## FASE 14 — Git

- **Estado:** CONTINUO

## FASE 15 — Preview

- **Estado:** PENDIENTE
