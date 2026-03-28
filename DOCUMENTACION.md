# PlusSport - Documentación del Proyecto

> Tienda deportiva online construida con Next.js 15 + Payload CMS v3

---

## Stack Tecnológico

| Tecnología | Versión | Rol |
|---|---|---|
| Next.js | 15.4.11 | Framework fullstack (App Router) |
| Payload CMS | 3.79.1 | CMS headless + panel admin |
| React | 19.2.4 | UI |
| TypeScript | 5.9.3 | Tipado estático |
| Tailwind CSS | 3.4.19 | Estilos |
| SQLite | - | BD local (desarrollo) |
| PostgreSQL | - | BD producción |
| Sharp | 0.34.5 | Procesamiento de imágenes |

**Colores de marca:**
- Primario: `#1a237e` (azul marino)
- Acento: `#ff6f00` (naranja)

---

## Estructura del Proyecto

```
PlusSport/
├── src/
│   ├── app/
│   │   ├── (frontend)/              # Tienda pública
│   │   │   ├── page.tsx             # Homepage
│   │   │   ├── productos/page.tsx   # Catálogo completo
│   │   │   ├── categorias/page.tsx  # Listado de categorías
│   │   │   ├── categoria/[slug]/    # Productos por categoría
│   │   │   ├── ofertas/page.tsx     # Productos en oferta
│   │   │   ├── carrito/page.tsx     # Carrito de compras
│   │   │   ├── checkout/page.tsx    # Proceso de pago
│   │   │   ├── confirmacion/page.tsx# Confirmación de pedido
│   │   │   ├── layout.tsx           # Layout raíz
│   │   │   └── globals.css          # Estilos globales
│   │   ├── (payload)/               # Panel admin Payload
│   │   │   ├── layout.tsx
│   │   │   └── admin/[[...segments]]/page.tsx
│   │   └── api/
│   │       ├── [...slug]/route.ts   # Proxy REST de Payload
│   │       ├── clientes/route.ts    # POST crear cliente
│   │       ├── ordenes/route.ts     # POST crear orden
│   │       └── productos/route.ts   # GET productos con filtros
│   ├── collections/                 # 10 colecciones Payload
│   │   ├── Usuarios.ts
│   │   ├── Media.ts
│   │   ├── Categorias.ts
│   │   ├── Marcas.ts
│   │   ├── Productos.ts
│   │   ├── Clientes.ts
│   │   ├── Ordenes.ts
│   │   ├── Cupones.ts
│   │   ├── Envios.ts
│   │   └── Banners.ts
│   ├── globals/
│   │   └── ConfigTienda.ts          # Configuración global de la tienda
│   ├── components/
│   │   ├── Header.tsx               # Navegación principal
│   │   ├── Footer.tsx               # Pie de página
│   │   ├── HeroSlider.tsx           # Carrusel de banners
│   │   ├── TarjetaProducto.tsx      # Card de producto
│   │   └── AgregarAlCarrito.tsx     # Modal agregar al carrito
│   ├── payload.config.ts            # Config principal de Payload
│   └── seed.ts                      # Datos iniciales de ejemplo
├── public/media/                    # Imágenes subidas
├── tailwind.config.ts
├── next.config.ts
└── package.json
```

---

## Colecciones de Payload CMS

### Usuarios (`/admin` auth)
Usuarios administrativos del panel.

| Campo | Tipo | Notas |
|---|---|---|
| email | email | Único, login |
| nombre | text | Requerido |
| rol | select | admin, editor, vendedor |

### Media
Gestión centralizada de imágenes.

| Configuración | Valor |
|---|---|
| Directorio | `/public/media` |
| Tipos | Solo imágenes |
| Tamaños | thumbnail (400x400), card (800x800), banner (1920x600) |

### Categorias
Organización jerárquica de productos.

| Campo | Tipo | Notas |
|---|---|---|
| nombre | text | Requerido |
| slug | text | URL amigable |
| descripcion | textarea | - |
| imagen | upload (Media) | - |
| icono | text | Emoji (ej: 👟 🏃 ⚽) |
| categoriaPadre | relationship | Auto-referencia (subcategorías) |
| orden | number | Posición en listado |
| activa | checkbox | Default: true |

### Marcas
Catálogo de marcas deportivas.

| Campo | Tipo | Notas |
|---|---|---|
| nombre | text | Requerido |
| slug | text | Requerido |
| logo | upload (Media) | - |
| activa | checkbox | Default: true |

### Productos
Inventario completo de la tienda.

| Campo | Tipo | Notas |
|---|---|---|
| nombre | text | Requerido |
| slug | text | Requerido |
| descripcion | richText | Editor Lexical |
| sku | text | Código interno |
| precio | number | Requerido |
| precioAnterior | number | Para mostrar descuento |
| categoria | relationship | Requerido, apunta a Categorias |
| marca | relationship | Apunta a Marcas |
| imagenPrincipal | upload (Media) | Foto principal |
| imagenes | array (upload) | Galería adicional |
| tallas | array | Cada item: talla (text) + stock (number) |
| stock | number | Para productos sin tallas |
| etiqueta | select | nuevo, hot, top, oferta |
| destacado | checkbox | Aparece en "Lo más vendido" |
| nuevoIngreso | checkbox | Aparece en "Nuevos Ingresos" |
| activo | checkbox | Default: true |

### Clientes
CRM de compradores.

| Campo | Tipo | Notas |
|---|---|---|
| nombre | text | Requerido |
| telefono | text | WhatsApp |
| email | email | - |
| documento | text | DNI/RUC |
| direccion | group | calle, distrito, ciudad, referencias |
| notas | textarea | Interno admin |
| totalCompras | number | Readonly, auto-calculado |
| etiqueta | select | normal, vip, frecuente, inactivo |

### Ordenes
Pedidos de compra.

| Campo | Tipo | Notas |
|---|---|---|
| numeroPedido | text | Auto-generado (PS-XXXXX) |
| cliente | relationship | Apunta a Clientes |
| nombreCliente | text | Respaldo si no hay cuenta |
| telefono | text | - |
| items | array | producto, talla, cantidad, precioUnitario |
| subtotal | number | - |
| descuento | number | - |
| costoEnvio | number | - |
| total | number | - |
| cupon | relationship | Apunta a Cupones |
| direccionEnvio | group | calle, distrito, ciudad, referencias |
| metodoPago | select | yape, plin, transferencia, tarjeta, efectivo, whatsapp |
| estado | select | pendiente, confirmado, preparando, enviado, entregado, cancelado, devuelto |
| notas | textarea | - |

### Cupones
Sistema de descuentos y promociones.

| Campo | Tipo | Notas |
|---|---|---|
| codigo | text | Ej: VERANO20 |
| tipo | select | porcentaje, monto, envio_gratis |
| valor | number | Cantidad de descuento |
| minimoCompra | number | Monto mínimo requerido |
| usoMaximo | number | 0 = ilimitado |
| usosActuales | number | Readonly |
| vencimiento | date | - |
| activo | checkbox | - |

### Envios
Configuración de zonas y costos de envío.

| Campo | Tipo | Notas |
|---|---|---|
| nombre | text | Ej: Lima Metropolitana |
| descripcion | text | Ej: 24-48 horas |
| costo | number | Default: 0 |
| tiempoEntrega | text | - |
| minimoGratis | number | Monto para envío gratis |
| distritos | array | Lista de distritos cubiertos |
| activo | checkbox | - |

### Banners
Slides del hero en homepage.

| Campo | Tipo | Notas |
|---|---|---|
| titulo | text | Requerido |
| subtitulo | text | - |
| descripcion | textarea | - |
| imagen | upload (Media) | Fondo |
| colorFondo | text | Hex, default: #1a237e |
| textBoton1 / urlBoton1 | text | CTA principal |
| textBoton2 / urlBoton2 | text | CTA secundario |
| orden | number | Posición |
| activo | checkbox | - |

---

## Global: ConfigTienda

Configuración centralizada editable desde el admin.

### Identidad
- nombreTienda, tagline, logo, favicon

### Colores
- primario (#1a237e), acento (#ff6f00), fondo (#ffffff)

### Header
- anuncioBarra (texto promocional top)
- mostrarAnuncio (toggle)
- textoBtnWhatsapp, numeroWhatsapp
- menuPrincipal (array: etiqueta, url, esDestacado)

### Footer
- descripcion, telefono, email, direccion, horario
- redesSociales (facebook, instagram, tiktok, youtube)
- metodosPago (array)
- textoCopyright

### SEO
- metaTitulo, metaDescripcion

---

## Rutas API

### `GET /api/productos`
Lista productos con filtros opcionales.

| Param | Tipo | Default |
|---|---|---|
| categoria | string (slug) | - |
| marca | string (slug) | - |
| search | string | - |
| limit | number | 20 |
| page | number | 1 |

**Respuesta:**
```json
{
  "data": [{ "id", "nombre", "marca", "precio", "precioAnterior", "imagenUrl", "tallas", "etiqueta" }],
  "pagination": { "total", "page", "limit", "pages" }
}
```

### `POST /api/clientes`
Crea un nuevo cliente.

**Body:** `{ nombre, email, telefono, documento, direccion: { calle, distrito, ciudad, referencias } }`

**Respuesta:** `{ success: true, doc: { ...cliente } }` (201)

### `POST /api/ordenes`
Crea una orden de compra. Auto-actualiza `totalCompras` del cliente.

**Body:**
```json
{
  "cliente": "ID",
  "nombreCliente": "string",
  "telefono": "string",
  "items": [{ "producto": "ID", "talla": "string", "cantidad": 1, "precioUnitario": 299 }],
  "subtotal": 299,
  "descuento": 0,
  "costoEnvio": 15,
  "total": 314,
  "direccionEnvio": { "calle", "distrito", "ciudad", "referencias" },
  "metodoPago": "yape",
  "estado": "pendiente"
}
```

**Respuesta:** `{ success: true, doc: { ...orden } }` (201)

### `REST /api/[...slug]`
Proxy a todas las colecciones de Payload (GET, POST, PATCH, DELETE, PUT, OPTIONS).

---

## Páginas del Frontend

| Ruta | Tipo | Descripción |
|---|---|---|
| `/` | Server | Homepage: hero slider, categorías, beneficios, marcas, destacados |
| `/productos` | Server | Catálogo completo de productos activos |
| `/categorias` | Server | Grid de todas las categorías activas |
| `/categoria/[slug]` | Server | Productos filtrados por categoría |
| `/ofertas` | Server | Productos con descuento (precioAnterior > precio) |
| `/carrito` | Client | Carrito de compras (localStorage) |
| `/checkout` | Client | Formulario de datos + resumen + crear orden |
| `/confirmacion` | Server | Post-compra con número de pedido y pasos |

**ISR:** Todas las páginas server se revalidan cada 60 segundos.

---

## Componentes

| Componente | Tipo | Descripción |
|---|---|---|
| Header | Client | Nav sticky: logo, buscador, iconos (cuenta, favoritos, carrito), WhatsApp, menú móvil |
| Footer | Server | 4 columnas: info, categorías, ayuda, contacto + copyright |
| HeroSlider | Client | Carrusel auto-rotativo (5s) con banners desde Payload |
| TarjetaProducto | Client | Card: imagen, badges, favorito, precio, tallas, botón agregar + modal |
| AgregarAlCarrito | Client | Selector de talla + cantidad, guarda en localStorage |

---

## Flujo de Compra

```
Homepage → Navegar productos/categorías
    ↓
TarjetaProducto → Click "AGREGAR"
    ↓
Modal AgregarAlCarrito → Seleccionar talla + cantidad → localStorage
    ↓
/carrito → Ver items, ajustar cantidades → "Ir al checkout"
    ↓
/checkout → Llenar datos personales + dirección + método de pago
    ↓
POST /api/clientes → Crear cliente
POST /api/ordenes → Crear orden
    ↓
/confirmacion?numeroPedido=PS-XXXXX → Instrucciones de pago + WhatsApp
```

---

## Flujo Admin

```
/admin → Login (email + contraseña)
    ↓
Dashboard → Gestionar:
  - Productos (crear, editar, activar/desactivar)
  - Categorías (organizar jerarquía)
  - Marcas (logos y slugs)
  - Órdenes (ver pedidos, cambiar estados)
  - Clientes (CRM, etiquetas VIP)
  - Cupones (crear descuentos)
  - Envíos (zonas y costos)
  - Banners (slides del hero)
  - ConfigTienda (colores, header, footer, SEO)
```

---

## Datos Iniciales (Seed)

Ejecutar `npm run seed` para popular con datos de ejemplo:

- **6 Categorías:** Running, Fútbol, Gym & Fitness, Natación, Tenis, Ciclismo
- **8 Marcas:** Nike, Adidas, New Balance, Puma, Asics, Under Armour, Reebok, Fila
- **8 Productos:** Air Max 270, Ultraboost 22, Fresh Foam 1080, RS-X Tech, etc.
- **3 Banners:** "CORRE MÁS LEJOS", "JUEGA EN GRANDE", "ENTRENA SIN LÍMITES"
- **ConfigTienda:** Nombre, colores, menú, footer, SEO

---

## Comandos

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Compilar para producción
npm run start        # Iniciar producción
npm run seed         # Cargar datos de ejemplo
npm run generate:types  # Generar tipos TypeScript de Payload
```

---

## Métodos de Pago Soportados

| Método | Clave |
|---|---|
| Yape | `yape` |
| Plin | `plin` |
| Transferencia bancaria | `transferencia` |
| Tarjeta (Visa/Mastercard) | `tarjeta` |
| Efectivo (contra entrega) | `efectivo` |
| WhatsApp (coordinado) | `whatsapp` |

---

## Variables de Entorno

```env
PAYLOAD_SECRET=tu-secreto-aqui
DATABASE_URI=postgres://...       # Producción (PostgreSQL)
# SQLite se usa por defecto en desarrollo
```

---

*Última actualización: 2026-03-23*
