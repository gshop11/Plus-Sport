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
    defaultColumns: ['numeroPedido', 'cliente', 'total', 'estado', 'createdAt'],
  },
  labels: {
    singular: 'Orden',
    plural: 'Órdenes',
  },
  fields: [
    {
      name: 'numeroPedido',
      type: 'text',
      label: 'N° Pedido',
      admin: { readOnly: true },
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
      admin: { description: 'Si el cliente no está registrado' },
    },
    {
      name: 'telefono',
      type: 'text',
      label: 'Teléfono / WhatsApp',
    },
    {
      name: 'items',
      type: 'array',
      label: 'Productos del pedido',
      fields: [
        {
          name: 'producto',
          type: 'relationship',
          label: 'Producto',
          relationTo: 'productos',
        },
        {
          name: 'nombreProducto',
          type: 'text',
          label: 'Nombre',
        },
        {
          type: 'row',
          fields: [
            {
              name: 'talla',
              type: 'text',
              label: 'Talla',
              admin: { width: '33%' },
            },
            {
              name: 'cantidad',
              type: 'number',
              label: 'Cantidad',
              required: true,
              defaultValue: 1,
              admin: { width: '33%' },
            },
            {
              name: 'precioUnitario',
              type: 'number',
              label: 'Precio (S/)',
              required: true,
              admin: { width: '33%' },
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
          label: 'Envío (S/)',
          defaultValue: 0,
          admin: { width: '25%' },
        },
        {
          name: 'total',
          type: 'number',
          label: 'TOTAL (S/)',
          admin: { width: '25%' },
        },
      ],
    },
    {
      name: 'cupon',
      type: 'relationship',
      label: 'Cupón aplicado',
      relationTo: 'cupones',
    },
    {
      name: 'direccionEnvio',
      type: 'group',
      label: 'Dirección de envío',
      fields: [
        { name: 'calle', type: 'text', label: 'Calle' },
        { name: 'distrito', type: 'text', label: 'Distrito' },
        { name: 'ciudad', type: 'text', label: 'Ciudad' },
        { name: 'referencias', type: 'text', label: 'Referencias' },
      ],
    },
    {
      name: 'metodoPago',
      type: 'select',
      label: 'Método de pago',
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
      name: 'estado',
      type: 'select',
      label: 'Estado del pedido',
      required: true,
      defaultValue: 'pendiente',
      options: [
        { label: '🕐 Pendiente', value: 'pendiente' },
        { label: '✅ Confirmado', value: 'confirmado' },
        { label: '📦 En preparación', value: 'preparando' },
        { label: '🚚 En camino', value: 'enviado' },
        { label: '🎉 Entregado', value: 'entregado' },
        { label: '❌ Cancelado', value: 'cancelado' },
        { label: '🔄 Devuelto', value: 'devuelto' },
      ],
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
        return data
      },
    ],
  },
}
