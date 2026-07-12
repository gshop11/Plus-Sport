import { randomUUID } from 'crypto'
import type { CollectionConfig } from 'payload'
import { restoreStock, type StockLineItem } from '../lib/inventory'

// Estados del pedido (flujo manual + pasarela):
// pendiente_pago -> comprobante_recibido -> pago_en_revision -> pagado
//   -> preparando -> enviado -> entregado
// Estados terminales/laterales: cancelado, pago_fallido, reembolsado.
// 'pendiente' y 'procesando' se conservan por compatibilidad con ordenes previas.
const ESTADOS_ORDEN = [
  { label: 'Pendiente de pago', value: 'pendiente_pago' },
  { label: 'Comprobante recibido', value: 'comprobante_recibido' },
  { label: 'Pago en revision', value: 'pago_en_revision' },
  { label: 'Pagado', value: 'pagado' },
  { label: 'Preparando', value: 'preparando' },
  { label: 'Enviado', value: 'enviado' },
  { label: 'Entregado', value: 'entregado' },
  { label: 'Cancelado', value: 'cancelado' },
  { label: 'Pago fallido', value: 'pago_fallido' },
  { label: 'Reembolsado', value: 'reembolsado' },
  { label: 'Pendiente (legado)', value: 'pendiente' },
  { label: 'Procesando (legado)', value: 'procesando' },
]

export const Ordenes: CollectionConfig = {
  slug: 'ordenes',
  access: {
    // La creacion publica ocurre solo via endpoint del servidor (overrideAccess).
    create: ({ req }) => Boolean(req.user),
    read: ({ req }) => req?.user?.rol === 'admin' || req?.user?.rol === 'vendedor',
    update: ({ req }) => req?.user?.rol === 'admin' || req?.user?.rol === 'vendedor',
    delete: ({ req }) => req?.user?.rol === 'admin',
  },
  admin: {
    useAsTitle: 'numeroPedido',
    group: 'Ventas',
    defaultColumns: ['numeroPedido', 'nombreCliente', 'total', 'metodoPago', 'estadoComercial', 'estadoPago', 'createdAt'],
  },
  labels: {
    singular: 'Orden',
    plural: 'Ordenes',
  },
  fields: [
    {
      name: 'numeroPedido',
      type: 'text',
      label: 'Numero de pedido',
      unique: true,
      index: true,
      admin: { readOnly: true },
    },
    {
      name: 'codigoCorrelacion',
      type: 'text',
      label: 'Codigo de correlacion interno',
      unique: true,
      index: true,
      admin: { readOnly: true, description: 'Referencia no adivinable usada por el cliente y la pasarela de pago' },
    },
    {
      name: 'idempotencyKey',
      type: 'text',
      label: 'Clave de idempotencia',
      unique: true,
      index: true,
      admin: { readOnly: true, description: 'Evita pedidos duplicados por doble envio del formulario' },
    },
    {
      name: 'cliente',
      type: 'relationship',
      label: 'Cliente',
      relationTo: 'clientes',
    },
    {
      name: 'nombreCliente',
      type: 'text',
      label: 'Nombre del cliente',
      required: true,
      admin: { description: 'Snapshot al momento de crear la orden' },
    },
    {
      name: 'datosCliente',
      type: 'group',
      label: 'Datos del cliente (snapshot)',
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'nombres', type: 'text', label: 'Nombres', admin: { width: '50%' } },
            { name: 'apellidos', type: 'text', label: 'Apellidos', admin: { width: '50%' } },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'tipoDocumento',
              type: 'select',
              label: 'Tipo de documento',
              options: [
                { label: 'DNI', value: 'dni' },
                { label: 'Carnet de extranjeria', value: 'ce' },
                { label: 'Pasaporte', value: 'pasaporte' },
                { label: 'RUC', value: 'ruc' },
              ],
              admin: { width: '50%' },
            },
            { name: 'numeroDocumento', type: 'text', label: 'Numero de documento', admin: { width: '50%' } },
          ],
        },
        { name: 'email', type: 'email', label: 'Correo electronico' },
      ],
    },
    {
      name: 'telefono',
      type: 'text',
      label: 'Telefono / WhatsApp',
      required: true,
    },
    {
      name: 'metodoEntrega',
      type: 'select',
      label: 'Metodo de entrega',
      required: true,
      defaultValue: 'delivery',
      options: [
        { label: 'Delivery', value: 'delivery' },
        { label: 'Retiro en tienda', value: 'retiro_tienda' },
      ],
    },
    {
      name: 'puntoRecojo',
      type: 'group',
      label: 'Punto de recojo (snapshot)',
      admin: { condition: (data) => data?.metodoEntrega === 'retiro_tienda' },
      fields: [
        { name: 'nombre', type: 'text', label: 'Punto' },
        { name: 'direccion', type: 'text', label: 'Direccion' },
        { name: 'horario', type: 'text', label: 'Horario' },
      ],
    },
    {
      name: 'items',
      type: 'array',
      label: 'Productos del pedido',
      required: true,
      fields: [
        {
          name: 'producto',
          type: 'relationship',
          label: 'Producto',
          relationTo: 'productos',
          required: true,
        },
        {
          name: 'nombreProducto',
          type: 'text',
          label: 'Nombre',
          required: true,
        },
        {
          type: 'row',
          fields: [
            { name: 'sku', type: 'text', label: 'SKU producto', admin: { width: '25%' } },
            { name: 'skuVariante', type: 'text', label: 'SKU variante', admin: { width: '25%' } },
            { name: 'color', type: 'text', label: 'Color', admin: { width: '25%' } },
            { name: 'talla', type: 'text', label: 'Talla', admin: { width: '25%' } },
          ],
        },
        {
          type: 'row',
          fields: [
            {
              name: 'cantidad',
              type: 'number',
              label: 'Cantidad',
              required: true,
              defaultValue: 1,
              admin: { width: '25%' },
            },
            {
              name: 'precioUnitario',
              type: 'number',
              label: 'Precio unitario (S/)',
              required: true,
              admin: { width: '25%' },
            },
            {
              name: 'precioAnterior',
              type: 'number',
              label: 'Precio anterior (S/)',
              admin: { width: '25%' },
            },
            {
              name: 'subtotal',
              type: 'number',
              label: 'Subtotal item (S/)',
              required: true,
              admin: { width: '25%' },
            },
          ],
        },
        { name: 'imagenUrl', type: 'text', label: 'Imagen (URL snapshot)' },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'subtotal',
          type: 'number',
          label: 'Subtotal (S/)',
          admin: { width: '25%' },
        },
        {
          name: 'descuento',
          type: 'number',
          label: 'Descuento (S/)',
          defaultValue: 0,
          admin: { width: '25%' },
        },
        {
          name: 'costoEnvio',
          type: 'number',
          label: 'Costo envio (S/)',
          defaultValue: 0,
          admin: { width: '25%' },
        },
        {
          name: 'total',
          type: 'number',
          label: 'Total (S/)',
          admin: { width: '25%' },
        },
      ],
    },
    {
      name: 'moneda',
      type: 'text',
      label: 'Moneda',
      defaultValue: 'PEN',
    },
    {
      name: 'cupon',
      type: 'relationship',
      label: 'Cupon aplicado',
      relationTo: 'cupones',
    },
    {
      name: 'direccionEnvio',
      type: 'group',
      label: 'Direccion de envio',
      fields: [
        { name: 'calle', type: 'text', label: 'Direccion', required: true },
        {
          type: 'row',
          fields: [
            { name: 'departamento', type: 'text', label: 'Departamento', admin: { width: '33%' } },
            { name: 'ciudad', type: 'text', label: 'Provincia / Ciudad', defaultValue: 'Lima', admin: { width: '33%' } },
            { name: 'distrito', type: 'text', label: 'Distrito', required: true, admin: { width: '33%' } },
          ],
        },
        { name: 'referencias', type: 'text', label: 'Referencias' },
      ],
    },
    {
      name: 'metodoPago',
      type: 'select',
      label: 'Metodo de pago (compatibilidad)',
      options: [
        { label: 'Yape', value: 'yape' },
        { label: 'Plin', value: 'plin' },
        { label: 'Transferencia Interbank', value: 'interbank' },
        { label: 'Transferencia BCP', value: 'transferencia' },
        { label: 'Visa / Mastercard', value: 'tarjeta' },
        { label: 'Efectivo contra entrega', value: 'efectivo' },
        { label: 'WhatsApp', value: 'whatsapp' },
      ],
    },
    {
      name: 'estadoComercial',
      type: 'select',
      label: 'Estado del pedido',
      required: true,
      defaultValue: 'pendiente_pago',
      options: ESTADOS_ORDEN,
      index: true,
    },
    {
      name: 'estadoPago',
      type: 'select',
      label: 'Estado de pago',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Authorized', value: 'authorized' },
        { label: 'Paid', value: 'paid' },
        { label: 'Failed', value: 'failed' },
        { label: 'Canceled', value: 'canceled' },
        { label: 'Refunded', value: 'refunded' },
      ],
      index: true,
    },
    {
      name: 'historialEstados',
      type: 'array',
      label: 'Historial de estados',
      admin: { readOnly: true },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'estadoAnterior', type: 'text', label: 'Anterior', admin: { width: '25%' } },
            { name: 'estadoNuevo', type: 'text', label: 'Nuevo', admin: { width: '25%' } },
            { name: 'fecha', type: 'date', label: 'Fecha', admin: { width: '25%' } },
            { name: 'usuario', type: 'text', label: 'Usuario', admin: { width: '25%' } },
          ],
        },
        { name: 'comentario', type: 'text', label: 'Comentario' },
      ],
    },
    {
      name: 'comprobantesPago',
      type: 'relationship',
      relationTo: 'comprobantes',
      hasMany: true,
      label: 'Comprobantes de pago',
      admin: { description: 'Comprobantes subidos por el cliente. Verificar antes de marcar pagado.' },
    },
    {
      name: 'aceptaciones',
      type: 'group',
      label: 'Aceptacion legal',
      admin: { readOnly: true },
      fields: [
        {
          type: 'row',
          fields: [
            { name: 'terminos', type: 'checkbox', label: 'Acepto terminos', defaultValue: false, admin: { width: '33%' } },
            { name: 'privacidad', type: 'checkbox', label: 'Acepto privacidad', defaultValue: false, admin: { width: '33%' } },
            { name: 'fecha', type: 'date', label: 'Fecha de aceptacion', admin: { width: '33%' } },
          ],
        },
        { name: 'versionTerminos', type: 'text', label: 'Version de terminos' },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'stockDescontado',
          type: 'checkbox',
          label: 'Stock descontado',
          defaultValue: false,
          admin: { width: '50%', readOnly: true },
        },
        {
          name: 'stockRestaurado',
          type: 'checkbox',
          label: 'Stock restaurado',
          defaultValue: false,
          admin: { width: '50%', readOnly: true, description: 'Se marca al cancelar una orden con stock descontado' },
        },
      ],
    },
    {
      name: 'paymentProvider',
      type: 'text',
      label: 'Payment provider',
      defaultValue: 'manual',
      admin: { description: 'manual, izipay, etc.' },
    },
    {
      name: 'paymentMethod',
      type: 'text',
      label: 'Payment method',
      admin: { description: 'Codigo tecnico del metodo de pago' },
    },
    {
      name: 'transactionId',
      type: 'text',
      label: 'Transaction ID',
    },
    {
      name: 'externalOrderId',
      type: 'text',
      label: 'External order ID',
      index: true,
    },
    {
      name: 'paymentReference',
      type: 'text',
      label: 'Payment reference',
      index: true,
    },
    {
      name: 'authorizationCode',
      type: 'text',
      label: 'Authorization code',
    },
    {
      name: 'paymentPayload',
      type: 'json',
      label: 'Payment payload (summary)',
    },
    {
      name: 'paymentSignatureValid',
      type: 'checkbox',
      label: 'Payment signature valid',
      defaultValue: false,
    },
    {
      name: 'paidAt',
      type: 'date',
      label: 'Paid at',
    },
    {
      name: 'paymentErrorCode',
      type: 'text',
      label: 'Payment error code',
    },
    {
      name: 'paymentErrorMessage',
      type: 'textarea',
      label: 'Payment error message',
    },
    {
      name: 'notas',
      type: 'textarea',
      label: 'Notas del pedido',
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, operation, originalDoc, req }) => {
        if (operation === 'create' && !data.numeroPedido) {
          data.numeroPedido = `PS-${Date.now()}`
        }

        if (operation === 'create' && !data.codigoCorrelacion) {
          const token = randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase()
          data.codigoCorrelacion = `ORD-${Date.now()}-${token}`
        }

        if (!data.paymentMethod && data.metodoPago) {
          data.paymentMethod = data.metodoPago
        }

        const estadoAnterior = originalDoc?.estadoComercial as string | undefined
        const estadoNuevo = data.estadoComercial as string | undefined

        // Historial de estados (creacion y cada transicion).
        if (estadoNuevo && (operation === 'create' || (estadoAnterior && estadoAnterior !== estadoNuevo))) {
          const historial = Array.isArray(data.historialEstados)
            ? data.historialEstados
            : Array.isArray(originalDoc?.historialEstados)
              ? [...originalDoc.historialEstados]
              : []

          historial.push({
            estadoAnterior: operation === 'create' ? null : estadoAnterior,
            estadoNuevo,
            fecha: new Date().toISOString(),
            usuario: req?.user?.email ?? 'sistema',
            comentario: null,
          })
          data.historialEstados = historial
        }

        // Restauracion de stock al cancelar (una sola vez).
        if (
          operation === 'update' &&
          estadoNuevo === 'cancelado' &&
          estadoAnterior !== 'cancelado' &&
          originalDoc?.stockDescontado === true &&
          originalDoc?.stockRestaurado !== true
        ) {
          const items: StockLineItem[] = Array.isArray(originalDoc?.items)
            ? originalDoc.items.map((item: Record<string, unknown>) => ({
                productoId: typeof item.producto === 'object' && item.producto !== null
                  ? Number((item.producto as Record<string, unknown>).id)
                  : Number(item.producto),
                talla: item.talla ? String(item.talla) : null,
                cantidad: Number(item.cantidad || 0),
              }))
            : []

          const transactionID = await req.transactionID
          await restoreStock(req.payload, transactionID, items)
          data.stockRestaurado = true
        }

        return data
      },
    ],
  },
}
