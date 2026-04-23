# Izipay Sandbox - PlusSport

Este documento describe el flujo sandbox actual en `feat/izipay-sandbox`, incluyendo webhook como fuente de verdad backend.

## 1. Variables de entorno

Configura estas variables en `.env`:

- `IZIPAY_ENV`: entorno (`sandbox`).
- `IZIPAY_SESSION_TOKEN_URL`: endpoint backend para generar token/sesion.
- `IZIPAY_API_USERNAME`: credencial backend auth (usuario API).
- `IZIPAY_API_PASSWORD`: credencial backend auth (password API).
- `IZIPAY_KEY_RSA`: llave publica RSA (`keyRSA`) para SDK web.
- `IZIPAY_HASH_KEY`: clave hash para validar firma HMAC-SHA256 del webhook.
- `IZIPAY_MERCHANT_CODE`: codigo de comercio.
- `IZIPAY_CHECKOUT_JS_URL`: script SDK web sandbox.
- `IZIPAY_PUBLIC_BASE_URL`: URL publica base para construir callbacks.
- `IZIPAY_RETURN_URL`: URL de retorno frontend (ej. `/confirmacion`).
- `IZIPAY_WEBHOOK_URL`: URL IPN/webhook registrada en Izipay.
- `IZIPAY_CURRENCY`: moneda (default `PEN`).

Compatibilidad:

- `IZIPAY_USERNAME` / `IZIPAY_PASSWORD` funcionan como alias.
- `IZIPAY_PUBLIC_KEY` funciona como alias de `IZIPAY_KEY_RSA`.
- `IZIPAY_HMAC_KEY` funciona como alias de `IZIPAY_HASH_KEY`.

## 2. Endpoints involucrados

- `POST /api/payments/izipay/session`
  - crea sesion sandbox para una orden local existente.
  - usa total de DB, no montos del frontend.
  - guarda correlacion (`transactionId`, `externalOrderId`, `paymentReference`).

- `POST /api/payments/izipay/visual-result`
  - guarda resultado visual provisional del SDK.
  - no confirma pago final.
  - si la orden ya fue confirmada por webhook (`paid`), no pisa estado final.

- `POST /api/payments/izipay/webhook`
  - fuente de verdad final backend.
  - valida firma HMAC-SHA256 con `payloadHttp + IZIPAY_HASH_KEY`.
  - correlaciona orden por `transactionId`, `externalOrderId`, `paymentReference`, `codigoCorrelacion` y `numeroPedido`.
  - aplica idempotencia por `eventKey` persistido.

## 3. Validacion de firma webhook

Webhook espera campos como:

- `transactionId`
- `payloadHttp`
- `signature`
- `code`

La validacion:

1. Toma `payloadHttp` literal recibido.
2. Calcula HMAC-SHA256 usando `IZIPAY_HASH_KEY`.
3. Compara en modo seguro (`timing-safe`) contra `signature` recibida.
4. Soporta firma en hex/base64 (y variantes comunes de prefijo).

Si la firma no es valida:

- no se confirma pago;
- se guarda intento en `paymentPayload.izipay`;
- la respuesta del webhook devuelve `accepted: false`.

## 4. Idempotencia y efectos finales

Cada webhook genera un `eventKey` y se guarda en:

- `paymentPayload.izipay.processedWebhookEvents`

Si el evento ya fue procesado, el endpoint responde `duplicate: true` y no repite efectos.

Solo cuando webhook es valido y exitoso:

- `estadoPago -> paid`
- `paidAt` y `authorizationCode`
- `paymentSignatureValid -> true`
- efectos de negocio:
  - descuento de stock
  - consumo de cupon (`usosActuales + 1`)
  - actualizacion de `clientes.totalCompras`

En webhook fallido/cancelado:

- `estadoPago -> failed` o `canceled`
- `paymentErrorCode` / `paymentErrorMessage`
- no se aplican efectos finales.

## 5. Flujo sandbox completo

1. Frontend crea cliente (`POST /api/clientes`).
2. Frontend crea orden local (`POST /api/checkout/ordenes`) con `estadoPago=pending`.
3. Frontend solicita sesion (`POST /api/payments/izipay/session`).
4. SDK Izipay abre checkout y retorna resultado visual.
5. Frontend reporta resultado visual (`POST /api/payments/izipay/visual-result`) como provisional.
6. Izipay envia webhook (`POST /api/payments/izipay/webhook`) y este cierra el estado final confiable.
7. Confirmacion frontend refleja estado final real (`pending`, `paid`, `failed`, `canceled`).

## 6. Prueba local/sandbox de webhook

Prerequisito:

- Debe existir catalogo minimo (productos con stock) para poder crear ordenes reales desde checkout.

1. Configura `.env` con todas las variables Izipay sandbox.
2. Ejecuta `npm run dev`.
3. Crea una orden por checkout (tarjeta) para generar correlacion local.
4. Simula webhook con firma valida:

```bash
curl -X POST http://localhost:3000/api/payments/izipay/webhook \
  -H "Content-Type: application/json" \
  -d '{"transactionId":"IZI-...","payloadHttp":"{\"transactionId\":\"IZI-...\",\"code\":\"00\"}","signature":"<firma_hmac>","code":"00"}'
```

5. Repite exactamente el mismo webhook para validar idempotencia (`duplicate: true`).
6. Revisa en orden:
   - `estadoPago`
   - `paidAt`
   - `paymentSignatureValid`
   - `paymentPayload.izipay.processedWebhookEvents`

Consulta segura de orden para verificacion:

```bash
curl http://localhost:3000/api/checkout/ordenes/<ORDER_REF_O_NUMERO>
```

La respuesta incluye `estadoPago`, `paymentSignatureValid`, `transactionId`, `paymentReference` y errores de pago.

## 7. QA tecnico recomendado (fase pre-VPS)

Checklist E2E minimo:

- [ ] Home -> catalogo -> carrito -> checkout navegable sin errores.
- [ ] `POST /api/clientes` crea cliente.
- [ ] `POST /api/checkout/ordenes` crea orden `pending`.
- [ ] `POST /api/payments/izipay/session` devuelve sesion valida.
- [ ] `POST /api/payments/izipay/visual-result` solo estado provisional.
- [ ] `POST /api/payments/izipay/webhook` (firma valida + exito) confirma `paid`.
- [ ] webhook duplicado responde `duplicate: true`.
- [ ] firma invalida no confirma pago.
- [ ] stock/cupon/metricas cambian solo una vez en pago confirmado.
- [ ] confirmacion frontend muestra estado correcto tras refresh.

Casos borde:

- referencia de orden invalida en confirmacion.
- webhook con estado contradictorio respecto al callback visual.
- webhook fallido/cancelado despues de callback visual exitoso.
- respuesta inesperada de Izipay en endpoint de sesion.

## 8. Build y validaciones tecnicas

`npm run typecheck`:

- usa `tsconfig.json` (sin dependencia de `.next/types`).
- valida TypeScript directamente sobre codigo fuente.

`npm run build`:

- mantiene validacion estricta de entorno productivo.
- usa `tsconfig.next.json` via `next.config.ts` para tipos de rutas Next durante build.
- requiere al menos estas variables definidas y validas:
  - `PAYLOAD_SECRET`
  - `NEXT_PUBLIC_SERVER_URL`
  - `DATABASE_URI` (o aliases permitidos)
- ademas, el PostgreSQL objetivo debe estar accesible para que el build complete la recoleccion de datos.

## 9. Checklist antes de VPS/staging

- [ ] Variables de entorno productivas definidas (sin placeholders).
- [ ] PostgreSQL accesible desde la app.
- [ ] URL publica HTTPS para `IZIPAY_RETURN_URL` y `IZIPAY_WEBHOOK_URL`.
- [ ] Webhook sandbox configurado en Izipay apuntando al endpoint backend.
- [ ] Prueba de webhook exito/falla/duplicado ejecutada contra entorno staging.
- [ ] Monitoreo de logs para `session`, `visual-result` y `webhook`.

## 10. Pendientes antes de produccion real

- Confirmar formato exacto final de webhook de Izipay (campos/codigos definitivos live).
- Registrar URLs HTTPS finales de return/webhook en panel Izipay.
- Endurecer trazabilidad operativa (logs, alertas y conciliacion diaria).
- Probar concurrencia real de webhooks duplicados con cargas paralelas.
- Cambiar credenciales/endpoints sandbox a produccion (sin hardcode).
