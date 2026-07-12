# Plus Sport — Entrega Ecommerce (resumen para el negocio)

Fecha: 2026-07-12

## Qué puede hacer ahora la tienda

La tienda dejó de ser solo un catálogo con WhatsApp: ya tiene un flujo de
compra real y administrable de principio a fin.

- El cliente ve un producto, elige **talla y cantidad**, lo agrega al
  **carrito**, y completa un **checkout por pasos** (sus datos, la entrega y
  el pago).
- Al terminar se crea un **pedido** con su número, y el cliente puede
  **subir el comprobante** de su pago (Yape, Plin o transferencia).
- Todos los pedidos quedan en el **panel de administración** (Payload), con
  su estado, sus productos, el cliente y el comprobante.

## Cómo compra el cliente

1. Entra a un producto y elige una talla **que tenga stock real**.
2. Agrega al carrito y va al checkout.
3. Ingresa nombres, apellidos, documento, correo y celular.
4. Elige envío a domicilio (según su distrito) o recojo en tienda.
5. Elige el método de pago disponible y acepta los términos.
6. Recibe su número de pedido y las instrucciones de pago.

## Cómo recibe el negocio el pedido

Cada pedido aparece en el panel con: número, cliente, productos comprados
(con precio y talla congelados al momento de la compra), total, método de
pago y estado. El negocio nunca depende de lo que diga el navegador del
cliente: **los precios, el stock y el total se calculan en el servidor**.

## Cómo se validan los pagos

- Yape / Plin / transferencia: el cliente paga y **sube su comprobante**.
  El pedido queda como **"comprobante recibido"**. Una persona del negocio
  revisa el comprobante y recién ahí lo marca como pagado. **El sistema nunca
  marca un pedido como pagado solo — siempre lo revisa una persona.**

## Qué métodos de pago están activos

- Solo se muestran los métodos que el negocio **configure con datos reales**
  (número, titular, o banco/cuenta/CCI). Un método sin datos completos
  **no aparece**. Hoy no hay datos bancarios reales cargados, así que el
  negocio debe completarlos en el panel para activarlos.

## Por qué el pago con tarjeta sigue desactivado

La integración con Izipay (tarjetas) quedó **lista pero apagada** por un
incidente pendiente con el proveedor (error "INT_015 — correo del cliente
inválido") que solo puede resolver el soporte de Izipay. Mientras tanto, la
tarjeta **no se ofrece** a los clientes y no se puede cobrar por ese medio.
Cuando Izipay lo resuelva, se activa cambiando un interruptor.

## Qué información falta completar (el negocio debe entregarla)

- Logo oficial, razón social y RUC.
- Textos legales aprobados (términos, privacidad, cambios/devoluciones, entregas).
- Datos bancarios reales: números de Yape/Plin, titular, QR, banco/cuenta/CCI.
- Tarifas y cobertura de envío por distrito.
- Inventario real por talla (para activar la venta online de cada producto).
- Resolución del incidente de Izipay para cobrar con tarjeta.

## Riesgos y recomendaciones inmediatas

- **No hay stock real cargado todavía**: los productos solo se pueden comprar
  online cuando el negocio registre tallas con inventario verificado y active
  la venta online. Los productos con rangos como "36 al 40" quedan en modo
  consulta hasta que se registre stock por talla individual.
- **Cargar los datos bancarios reales** en el panel para que aparezca al menos
  un método de pago.
- **Cargar las tarifas de envío** por distrito; sin ellas, el checkout deriva
  al cliente a coordinar la entrega por WhatsApp (no inventa un costo).
- **Publicar los textos legales** reales; mientras tanto las páginas muestran
  un aviso de "contenido en preparación".

## Estado técnico

Probado en un entorno de Preview aislado (base de datos separada de la tienda
en vivo). La tienda en vivo (Producción) **no fue modificada**. La activación
en Producción requiere una autorización explícita.
