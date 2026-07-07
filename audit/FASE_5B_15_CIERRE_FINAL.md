# FASE 5B.15 — Cierre comercial, SEO y entrega final de Plus Sport

Fecha: 2026-07-07
Rama: `stabilize/next16-payload385`
Commit final: `1b301a9c19f2c8b977baa356dc3aca74f6540d8e`
Proyecto Vercel: `plus-sport-mkar` (`prj_lqhgGX5ddoyr5CF3INVOJnaVcRiO`)
Dominio publico: `https://plussport.pe`

## Estado inicial (verificacion previa)

- Repositorio: `C:\Users\Norte Publicitario 1\Documents\GShop\Plus-Sport-Workspace\repository`, remoto `https://github.com/gshop11/Plus-Sport.git`.
- Rama `stabilize/next16-payload385`, HEAD `2154a475fa44456cb6d6d8da3aa4aed17e3bc692` (coincide con el commit publicado en Production segun el estado canonico de la fase), `git status --short` limpio salvo `audit/` (propio de esta sesion).
- Se leyeron los informes previos `audit/FASE_5B_14_DNS_BACKUP.md` (secciones 5B.14, 5B.14A, 5B.14B) antes de repetir cualquier verificacion de DNS/correo/SSL — no se repitieron esas auditorias en esta fase.
- Se confirmo que `plussport.pe` y `www.plussport.pe` pertenecen al proyecto `plus-sport-mkar` (`vercel domains inspect`) y que el certificado SSL emitido en 5B.14B seguia vigente.

## Hallazgo relevante antes de ejecutar (fuera del estado descrito por la fase)

El brief de la fase describia el storefront como "catalogo con WhatsApp, sin checkout integrado". La revision del codigo mostro lo contrario: existia un carrito + checkout + pasarela de pago (Izipay Sandbox, Yape, Plin, transferencia BCP/Interbank, efectivo) completamente conectado desde cada ficha de producto con stock, sin credenciales de Izipay configuradas en Production. Se consulto al usuario antes de actuar (ver conversacion) y se opto por **ocultar el flujo de carrito/checkout de la navegacion visible, sin eliminar el codigo** (queda reversible para una fase futura si se activa un medio de pago real).

## Archivos modificados

- `src/lib/storefront.ts` — logica de ofertas.
- `src/app/(frontend)/page.tsx` — seccion Ofertas (estado vacio), seccion suscripcion (CTA WhatsApp), metadata canonical.
- `src/app/(frontend)/productos/page.tsx` — estado vacio especifico para `oferta=1`, metadata canonical.
- `src/app/(frontend)/categorias/page.tsx`, `src/app/(frontend)/marcas/page.tsx` — metadata canonical.
- `src/app/(frontend)/layout.tsx` — `metadataBase` apuntando a `https://plussport.pe`.
- `src/components/Footer.tsx` — textos comerciales.
- `src/components/HeaderClient.tsx` — se retira icono/drawer de carrito y enlace roto "Mi cuenta" (apuntaba a `/checkout`); se agrega CTA de WhatsApp.
- `src/components/ProductDetailView.tsx` — se retira el flujo "Agregar al carrito"; CTA unico de consulta por WhatsApp; beneficios reescritos.
- `src/globals/ConfigTienda.ts` — `defaultValue` del anuncio de header.
- `next.config.ts` — redireccion 308 `www.plussport.pe` → `plussport.pe` (a nivel de aplicacion, sin tocar DNS).
- Nuevos: `src/app/robots.ts`, `src/app/sitemap.ts`.
- No se modificaron: schema/migraciones, colecciones `Ordenes`/`Clientes`/`Suscriptores`, rutas `/carrito`, `/checkout`, `/confirmacion`, ni ningun endpoint de `/api/checkout/*` o `/api/payments/*` (quedan en el repo, sin enlaces de navegacion hacia ellas).

## Logica final de ofertas

- `getHomeData()` ya no infiere ofertas desde `precioAnterior`. La seccion "Productos en oferta" y `/productos?oferta=1` solo muestran productos con `etiqueta = 'oferta'` (campo explicito ya existente en la coleccion `productos`, sin migraciones nuevas).
- Sin ofertas explicitas activas, ambos lugares muestran el estado: **"No hay ofertas activas por ahora."** + enlace "Ver catalogo completo". Verificado en vivo: Production tiene 0 productos con `etiqueta = 'oferta'` en este momento, por lo que el estado vacio es el que se ve hoy en `https://plussport.pe/productos?oferta=1`.
- No se modifico ningun producto, precio, stock, Media ni relacion — solo la consulta y el render.

## Textos corregidos

| Antes | Ahora |
|---|---|
| "Plus-Sport: tienda lista para compra real" | "Catalogo deportivo con atencion por WhatsApp" |
| "Compra segura" / "Enviamos a todo el pais" / "Soporte postventa" (footer) | "Atencion por WhatsApp" / "Consulta disponibilidad por talla" / "Coordinacion de entrega" |
| "ENVIO GRATIS POR COMPRAS MAYORES A S/299" (banner) | "CATALOGO DEPORTIVO CON ATENCION POR WHATSAPP" |
| "Envio nacional: Despachos con seguimiento a todo Peru" / "Pago seguro: Checkout protegido y confirmacion inmediata" (ficha de producto) | "Atencion por WhatsApp", "Coordinacion de entrega", "Consulta antes de comprar" |
| "Disponible para despacho inmediato" | "Disponible" |
| "Dejanos tu WhatsApp y te avisamos primero" + formulario de telefono (guardaba en `suscriptores`, sin envio automatico real) | CTA directo a WhatsApp reutilizando el helper `normalizeWhatsappNumber` existente |
| "Mi cuenta" (enlace roto hacia `/checkout`, sin sistema de cuentas real) | Retirado |

El banner "CATALOGO DEPORTIVO CON ATENCION POR WHATSAPP" tambien se corrigio en el documento **ya persistido en Payload** (global `config-tienda`, campo `header.anuncioBarra`), no solo en el codigo por defecto, via la API REST autenticada con la credencial admin ya verificada en fases previas (sin imprimir la contraseña en ningun momento). Verificado con GET posterior: el valor en base de datos quedo actualizado.

## SEO incorporado

- `metadataBase` y Open Graph corregidos a `https://plussport.pe` (antes apuntaban por defecto a `plus-sport-mkar.vercel.app`).
- `alternates.canonical` explicito en `/`, `/productos`, `/categorias`, `/marcas`.
- `src/app/robots.ts`: permite todo salvo `/admin`, `/api/`, `/checkout`, `/carrito`, `/confirmacion`; referencia el sitemap.
- `src/app/sitemap.ts`: incluye `/`, `/productos`, `/categorias`, `/marcas` y las categorias publicas activas (reutilizando `getCategoriasData()`, consulta ya existente y acotada). No se incluyeron productos individuales para mantener el sitemap estatico y de bajo costo, segun lo permitido por el brief.
- Redireccion 308 `www.plussport.pe` → `plussport.pe` via `next.config.ts` (`redirects()` con `has: [{ type: 'host', ... }]`), sin tocar DNS ni certificados.

## Comandos ejecutados (resumen)

```
npm run typecheck                         # limpio
npm run build                             # falla localmente por falta de secretos de produccion
                                           # (PAYLOAD_SECRET/DATABASE_URI/NEXT_PUBLIC_SERVER_URL) —
                                           # limitacion conocida del entorno local, no del codigo;
                                           # TypeScript compilo sin errores en ambos intentos.
git commit / git push origin stabilize/next16-payload385
vercel inspect <preview> --logs           # solo warning conocido de sslmode, sin errores reales
vercel --prod
curl a rutas criticas de Production
```

## Preview

- Deployment: `dpl_8DrLfJqFv7j5uNFSMzecWikSkhXv` (target `preview`), commit `1b301a9`.
- Build: `Ready`, sin errores reales en logs (unico hallazgo: warning conocido de `sslmode` en la conexion Postgres, ya documentado en fases anteriores).
- El Preview de Vercel esta protegido por SSO a nivel de equipo (documentado en fases previas de este proyecto); no se pudo hacer `curl`/captura directa contra la URL de Preview. Se valido en su lugar: (a) build exitoso con TypeScript limpio, (b) prueba interactiva equivalente en servidor local (`next dev`) con las mismas capturas y sin errores de consola, y (c) validacion HTTP/visual completa ya en Production (no protegido por SSO), como en fases anteriores de este mismo proyecto.

## Production

- Deployment: `dpl_AFgujPtbTFcqCTzFzL9AdcGoXRpY` (target `production`), commit `1b301a9c19f2c8b977baa356dc3aca74f6540d8e`.
- Alias confirmados: `https://plussport.pe`, `https://plus-sport-mkar.vercel.app`.
- `https://www.plussport.pe` ya no es un alias directo de contenido: redirige 308 a `https://plussport.pe` (verificado con y sin path).

### Rutas verificadas (HTTP)

| Ruta | Resultado |
|---|---|
| `/` | 200 |
| `/productos` | 200 |
| `/categorias` | 200 |
| `/marcas` | 200 |
| `/productos?oferta=1` | 200, estado vacio correcto (0 ofertas explicitas activas) |
| `/categoria/zapatillas` (categoria real) | 200 |
| `/producto/convert-ti5591796` (producto real) | 200 |
| `/robots.txt` | 200, contenido correcto |
| `/sitemap.xml` | 200, incluye home/productos/categorias/marcas + 3 categorias activas |
| `/api/storefront-config` | 200 |
| `http://plussport.pe` | 308 → `https://plussport.pe/` |
| `https://www.plussport.pe/productos` | 308 → `https://plussport.pe/productos` |

### Verificaciones adicionales en el HTML de Production

- `<link rel="canonical" href="https://plussport.pe"/>` presente en home.
- `<title>Plus Sport | Catalogo deportivo con atencion por WhatsApp</title>`.
- 0 ocurrencias de "Compra segura", "Enviamos a todo el pais", "Soporte postventa", "tienda lista para compra real", "Mi cuenta", "Abrir carrito", o la palabra "checkout" en el HTML de home.
- Ficha de producto: aparece "Consultar disponibilidad por WhatsApp"; no aparece "Agregar al carrito".
- Enlace de WhatsApp resuelto correctamente a `wa.me/51979705255`.

## Capturas

Guardadas en `audit/final-screenshots/`:

- `01-home-desktop.png` (1440×900)
- `02-home-mobile.png` (390×844)
- `03-productos-desktop.png` (1440×900)
- `04-producto-mobile.png` (390×844)
- `05-ofertas-desktop.png` (1440×900) — estado vacio "No hay ofertas activas por ahora."

## Errores y remediaciones

- **Build local sin secretos de produccion**: falla esperada (`PAYLOAD_SECRET`, `DATABASE_URI`, `NEXT_PUBLIC_SERVER_URL` ausentes localmente). No es un error de codigo — TypeScript compilo limpio y el build en Vercel (con las variables reales) fue exitoso. Documentado como limitacion conocida del entorno, consistente con fases anteriores de este proyecto.
- **Cache de 5 minutos en `getStorefrontConfig`**: tras corregir el banner via API, la respuesta publica de `/api/storefront-config` siguio mostrando el texto anterior por unos minutos (cache de Next.js `unstable_cache`, no un fallo). Se resolvio solo al desplegar la nueva version (cache reconstruida); verificado que el valor en base de datos ya estaba correcto antes de eso.
- **Hallazgo no bloqueante, documentado pero no corregido en esta fase**: a 390px de ancho, la barra de busqueda movil del header se desborda levemente del viewport (visible en `02-home-mobile.png` y `04-producto-mobile.png`). Es un problema preexistente, no introducido en esta fase, y no forma parte de los criterios de exito solicitados; se deja como mejora menor para una fase de ajuste visual futura.

## Rollback

Si se necesita revertir Production al estado previo a esta fase:

1. **Vercel (reasignar alias sin nuevo build):**
   ```
   vercel alias set dpl_7uJdkWibncDhJQUupVSffhPgpUMC plussport.pe
   vercel alias set dpl_7uJdkWibncDhJQUupVSffhPgpUMC www.plussport.pe
   ```
   (Deployment anterior aprobado: `dpl_7uJdkWibncDhJQUupVSffhPgpUMC`, commit `2154a475fa44456cb6d6d8da3aa4aed17e3bc692`, que permanece intacto en Vercel como historial de deployments — no fue eliminado.)

2. **Git (no destructivo):**
   ```
   git revert 1b301a9c19f2c8b977baa356dc3aca74f6540d8e
   git push origin stabilize/next16-payload385
   ```
   Esto crea un commit nuevo que deshace los cambios de codigo sin reescribir historial. El banner corregido en el global `config-tienda` de Payload tendria que revertirse aparte (no es parte del historial Git), restaurando manualmente `header.anuncioBarra` a `ENVIO GRATIS POR COMPRAS MAYORES A S/299` via el mismo mecanismo de API si se desea.

## Riesgos residuales (documentados, no resueltos en esta fase)

- `main` tiene historial divergente y no fue tocado.
- Los registros de correo/MX antiguos de `plussport.pe` (documentados en `audit/FASE_5B_14_DNS_BACKUP.md`, secciones 5B.14 y 5B.14A) siguen sin resolverse — no se investigaron de nuevo en esta fase.
- Las credenciales compartidas en fases previas (admin de Payload) deben rotarse por sus responsables cuando corresponda; no se rotaron en esta fase.
- El VPS/Contabo/Coolify anterior no fue tocado ni eliminado.
- El codigo de carrito/checkout/pago (Izipay Sandbox, cupones, ordenes) permanece en el repositorio, solo oculto de la navegacion. Si en el futuro se activa un medio de pago real, requiere: credenciales de Izipay en produccion, revision de seguridad del flujo de checkout, y volver a exponer las rutas en la navegacion.
- Desbordamiento menor de la barra de busqueda movil a 390px (ver seccion de errores).
