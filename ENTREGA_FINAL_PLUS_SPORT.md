# Entrega final — Plus Sport

Fecha de entrega: 2026-07-07

## Que se entrego

Un catalogo online de productos deportivos (zapatillas, ropa y accesorios) con navegacion por categoria, marca, publico y talla, buscador, y atencion comercial directa por WhatsApp.

## Dominio publico

**https://plussport.pe** (HTTPS con certificado valido). `www.plussport.pe` redirige automaticamente al dominio principal.

## Funciones disponibles

- Catalogo completo con filtros (categoria, marca, publico, talla, precio, disponibilidad) y buscador.
- Fichas de producto con imagenes, tallas y disponibilidad.
- Seccion de ofertas: muestra unicamente productos marcados explicitamente como oferta; si no hay ninguna activa, se indica con claridad en vez de mostrar descuentos inventados.
- Panel de administracion (Payload CMS) para gestionar productos, categorias, marcas, banners y configuracion general de la tienda.

## Como se gestionan las consultas

Toda consulta de disponibilidad, talla y compra se coordina por WhatsApp. El sitio no procesa pagos ni compras en linea de forma automatica: cada boton de "Consultar disponibilidad" abre WhatsApp con el detalle del producto pre-cargado para agilizar la atencion.

## Tecnologias generales

Next.js (frontend) + Payload CMS (administracion de contenido) sobre PostgreSQL, desplegado en Vercel.

## Que no incluye el proyecto

- Checkout o pago en linea automatizado (toda venta se coordina manualmente por WhatsApp).
- Creacion de cuentas de usuario / inicio de sesion para clientes.
- Envio automatico de notificaciones o campanas de marketing.

## Estado final

Sitio en produccion, funcional, verificado en escritorio y movil, sin mensajes comerciales no verificables ni funciones que aparenten estar activas sin estarlo.
