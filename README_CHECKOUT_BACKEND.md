# Checkout Backend Hardening (Pre-Izipay)

This phase hardens order creation and persistence before integrating Izipay SDK/session/webhook.

## Implemented in this phase

- `POST /api/checkout/ordenes`
- Server-side validation of checkout payload.
- Server-side recomputation of `subtotal`, `descuento`, `costoEnvio`, `total`.
- Server-side stock validation from `productos`.
- Server-side coupon validation from `cupones`.
- Order creation with:
  - `estadoComercial = pendiente`
  - `estadoPago = pending`
  - no stock decrement
  - no coupon consumption
  - no customer metrics increment
- Internal correlation reference generated in order model: `codigoCorrelacion`.

## New secure order query endpoint

- `GET /api/checkout/ordenes/[orderRef]`
- Accepts one path value (`orderRef`) and resolves by:
  - `codigoCorrelacion`, then
  - `numeroPedido`, then
  - internal `id` fallback.
- Returns a minimal public-safe order summary for confirmation screens.

## Order fields prepared for payment gateway correlation

Order model now includes:

- `estadoComercial`
- `estadoPago`
- `codigoCorrelacion`
- `paymentProvider`
- `paymentMethod`
- `transactionId`
- `externalOrderId`
- `paymentReference`
- `authorizationCode`
- `paymentPayload`
- `paymentSignatureValid`
- `paidAt`
- `paymentErrorCode`
- `paymentErrorMessage`

## Endpoint to call before opening Izipay (next phase)

Use:

- `POST /api/checkout/ordenes`

Expected behavior in next phase:

1. Create local order in `pending` payment state.
2. Use `codigoCorrelacion` and `id` for gateway correlation.
3. Request Izipay session/token.
4. Open Izipay SDK.
5. Finalize payment state asynchronously via webhook.

## Pending for next phase (not implemented yet)

- Izipay session/token endpoint.
- Izipay SDK frontend integration.
- Izipay webhook endpoint and signature verification.
- Final payment confirmation and post-payment side effects:
  - stock decrement
  - coupon usage increment
  - customer metrics update
