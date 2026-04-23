import { randomUUID } from 'crypto'
import type { CollectionConfig } from 'payload'

export const Ordenes: CollectionConfig = {
  slug: 'ordenes',
  access: {
    create: () => true,
    read: ({ req }) => req?.user?.rol === 'admin',
    update: ({ req }) => req?.user?.rol === 'admin',
    delete: ({ req }) => req?.user?.rol === 'admin',
  },
  admin: {
    useAsTitle: 'numeroPedido',
    group: 'Ventas',
    defaultColumns: ['numeroPedido', 'codigoCorrelacion', 'cliente', 'total', 'estadoComercial', 'estadoPago', 'createdAt'],
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
      admin: { readOnly: true, description: 'Se usa para correlacion con pasarela de pago' },
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
            {
              name: 'talla',
              type: 'text',
              label: 'Talla',
              admin: { width: '25%' },
            },
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
              name: 'subtotal',
              type: 'number',
              label: 'Subtotal item (S/)',
              required: true,
              admin: { width: '25%' },
            },
          ],
        },
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
        { name: 'calle', type: 'text', label: 'Calle', required: true },
        { name: 'distrito', type: 'text', label: 'Distrito', required: true },
        { name: 'ciudad', type: 'text', label: 'Ciudad', defaultValue: 'Lima' },
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
      label: 'Estado comercial',
      required: true,
      defaultValue: 'pendiente',
      options: [
        { label: 'Pendiente', value: 'pendiente' },
        { label: 'Procesando', value: 'procesando' },
        { label: 'Enviado', value: 'enviado' },
        { label: 'Entregado', value: 'entregado' },
        { label: 'Cancelado', value: 'cancelado' },
      ],
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
      ({ data, operation }) => {
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

        return data
      },
    ],
  },
}
