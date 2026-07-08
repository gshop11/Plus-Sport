# Izipay - Micuentaweb REST V4 / Krypton (PlusSport)

Este documento describe el flujo Izipay actual en `feat/izipay-krypton-migration`,
migrado desde una integracion previa (SDK legacy `window.Izipay`/`LoadForm`) al
producto real confirmado en el Back Office Vendedor de Plus Sport:
Micuentaweb REST V4 con formulario embebido Krypton.

El webhook (IPN) sigue siendo la fuente de verdad backend; el resultado visual del
formulario es siempre provisional.

## 1. Variables de entorno

Configura estas variables en `.env` (ver `.env.example` para la plantilla completa):

- `IZIPAY_ENV`: entorno (`sandbox` o `production`).
- `IZIPAY_API_BASE_URL`: servidor API REST Micuentaweb (`https://api.micuentaweb.pe/api-payment`).
- `IZIPAY_API_USERNAME` / `IZIPAY_API_PASSWORD`: credenciales backend (usuario API REST + password test/produccion). Solo se usan servidor a servidor.
- `IZIPAY_PUBLIC_KEY`: clave publica test/produccion. No es secreta; se entrega al navegador via la respuesta JSON del endpoint de sesion (nunca embebida en el bundle de build).
- `NEXT_PUBLIC_IZIPAY_PUBLIC_KEY`: alternativa si en el futuro el frontend necesitara leerla directamente en build-time. No se usa por defecto en este repo (se prefiere entregarla via API para no acoplar un build a un solo entorno).
- `IZIPAY_HMAC_SHA256_KEY`: clave HMAC-SHA-256 test/produccion para validar `kr-hash` del webhook.
- `IZIPAY_KR_PAYMENT_FORM_JS_URL`: script Krypton (`kr-payment-form.min.js`).
- `IZIPAY_KR_CLASSIC_CSS_URL` / `IZIPAY_KR_CLASSIC_JS_URL`: tema visual clasico Krypton.
- `IZIPAY_PUBLIC_BASE_URL`: URL publica base para construir `returnUrl`/`webhookUrl` por defecto.
- `IZIPAY_RETURN_URL`: URL de retorno frontend (ej. `/confirmacion`).
- `IZIPAY_WEBHOOK_URL`: URL IPN/webhook a registrar en Izipay.
- `IZIPAY_CURRENCY`: moneda (default `PEN`).

Variables legacy eliminadas en esta migracion (ya no se leen en codigo):
`IZIPAY_SESSION_TOKEN_URL`, `IZIPAY_SESSION_URL`, `IZIPAY_USERNAME`, `IZIPAY_PASSWORD`,
`IZIPAY_KEY_RSA`, `IZIPAY_HASH_KEY`, `IZIPAY_HMAC_KEY`, `IZIPAY_MERCHANT_CODE`,
`IZIPAY_CHECKOUT_JS_URL`.

## 2. Endpoints involucrados

- `POST /api/payments/izipay/session`
  - crea el pago via `POST {IZIPAY_API_BASE_URL}/V4/Charge/CreatePayment` para una orden local existente.
  - usa el total de la BD, no montos del frontend; convierte a unidad minima de moneda (centavos).
  - envia `orderId = codigoCorrelacion` de la orden para correlacion estable con la IPN.
  - devuelve al frontend: `formToken`, `publicKey`, URLs del SDK Krypton y `returnUrl`.

- `POST /api/payments/izipay/visual-result`
  - guarda resultado visual provisional (`kr-answer` del callback `KR.onSubmit`).
  - no confirma pago final.
  - si la orden ya fue confirmada por webhook (`paid`), no pisa estado final.

- `POST /api/payments/izipay/webhook`
  - fuente de verdad final backend (IPN Micuentaweb).
  - valida `kr-hash`: HMAC-SHA256 sobre el texto literal de `kr-answer` con `IZIPAY_HMAC_SHA256_KEY`.
  - confirma pago solo si `kr-answer.orderStatus === 'PAID'`.
  - correlaciona orden por `orderDetails.orderId` (nuestro `codigoCorrelacion`) y `transactions[0].uuid`.
  - aplica idempotencia por `eventKey` persistido (prioriza el uuid de transaccion Krypton).

## 3. Validacion de kr-hash

El webhook recibe (normalmente `application/x-www-form-urlencoded`):

- `kr-answer`: JSON string con `orderStatus`, `orderDetails.orderId`, `transactions[]`.
- `kr-hash`: HMAC-SHA256 hex de `kr-answer` calculado con la clave HMAC-SHA-256 test/produccion.

Validacion:

1. Toma `kr-answer` literal recibido (sin reserializar).
2. Calcula HMAC-SHA256 usando `IZIPAY_HMAC_SHA256_KEY`.
3. Compara en modo seguro (`timing-safe`) contra `kr-hash` recibido.

Si la firma no es valida:

- no se confirma pago;
- se guarda intento en `paymentPayload.izipay`;
- la respuesta del webhook devuelve `accepted: false`.

## 4. Idempotencia y efectos finales

Sin cambios respecto a la integracion anterior: cada webhook genera un `eventKey`
(basado en `transactions[0].uuid`, o hash de `kr-hash`/`kr-answer` si no hay uuid) y
se guarda en `paymentPayload.izipay.processedWebhookEvents`.

Solo cuando el webhook es valido y `orderStatus === 'PAID'`:

- `estadoPago -> paid`
- `paidAt` y `authorizationCode` (desde `transactions[0].authorizationNumber`)
- `paymentSignatureValid -> true`
- efectos de negocio (una sola vez): descuento de stock, consumo de cupon, `clientes.totalCompras`.

En `UNPAID`/`CANCELLED`: `estadoPago -> failed` o `canceled`, sin efectos de negocio.

## 5. Flujo Krypton completo

1. Frontend crea cliente (`POST /api/clientes`).
2. Frontend crea orden local (`POST /api/checkout/ordenes`) con `estadoPago=pending`.
3. Frontend solicita sesion (`POST /api/payments/izipay/session`) -> backend llama a `CreatePayment` y obtiene `formToken`.
4. Frontend carga `kr-payment-form.min.js` (script con atributos `kr-public-key` y `kr-language`) + tema clasico. El `formToken` se asigna como atributo `kr-form-token` en el `div.kr-embedded#izipay-kr-form` (patron declarativo: el cliente Krypton detecta el atributo, incluso en nodos insertados dinamicamente, y renderiza el formulario ahi mismo). No se invoca ningun metodo `attachForm`/`setFormConfig` cuyo nombre no estuviera verificado.
5. Usuario completa el formulario embebido; `KR.onSubmit(callback)` (unico metodo JS invocado por esta app) entrega `clientAnswer`/`hash` (provisional) y la app controla la navegacion de retorno (`return false` evita el redirect por defecto).
6. Frontend reporta resultado visual (`POST /api/payments/izipay/visual-result`).
7. Izipay envia IPN (`POST /api/payments/izipay/webhook`) que cierra el estado final confiable.
8. `/confirmacion` refleja el estado final real desde la orden en BD.

## 6. Pendiente humano antes de cualquier prueba sandbox real (Fase 6C)

- Registrar la URL de notificacion (IPN) en Back Office Vendedor -> Configuracion -> Reglas de notificacion. **A la fecha de esta migracion, esa URL no esta parametrizada en el panel.**
- Confirmar contra documentacion oficial vigente los nombres exactos de sub-campos de `customer.billingDetails`/`shippingDetails` en `CreatePayment` (implementados por mejor esfuerzo en `session/route.ts`, no verificados en vivo).
- Confirmar contra el SDK real cargado en navegador que `KR.onSubmit(callback)` retornando `false` efectivamente suprime la redireccion por defecto de Krypton (unico punto de la integracion JS que sigue sin verificacion en vivo tras la revision 6B.1; el resto del contrato frontend usa solo atributos HTML documentados: `kr-public-key`, `kr-language`, `kr-form-token`).
- Regenerar credenciales de test antes de cualquier prueba (nunca reutilizar credenciales ya vistas en configuraciones previas).

## 7. Build y validaciones tecnicas

`npm run typecheck`: valida TypeScript directamente sobre codigo fuente (sin build de Next).

`npm run build`: requiere `PAYLOAD_SECRET`, `NEXT_PUBLIC_SERVER_URL`, `DATABASE_URI` validos y PostgreSQL accesible; no se ejecuta con datos reales en esta fase de migracion.

## 8. Checklist QA (pendiente de ejecutar en 6C, no en esta fase)

- [ ] `POST /api/payments/izipay/session` devuelve `formToken` valido (mock o sandbox real).
- [ ] `KR.attachForm` renderiza el formulario embebido sin errores de consola.
- [ ] `POST /api/payments/izipay/visual-result` guarda estado provisional sin pisar `paid`.
- [ ] `POST /api/payments/izipay/webhook` con `kr-hash` valido y `orderStatus=PAID` confirma pago.
- [ ] webhook duplicado responde `duplicate: true`.
- [ ] `kr-hash` invalido no confirma pago.
- [ ] `orderStatus=UNPAID`/`CANCELLED` no aplica efectos de negocio.
- [ ] stock/cupon/metricas cambian solo una vez en pago confirmado.
