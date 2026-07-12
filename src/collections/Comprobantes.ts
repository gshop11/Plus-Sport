import type { CollectionConfig } from 'payload'

// Comprobantes de pago manual (Yape/Plin/transferencia).
// - Lectura, edicion y borrado: solo usuarios administrativos.
// - Creacion: solo desde el endpoint del servidor (overrideAccess), nunca
//   directamente por la API publica.
// - Un comprobante NUNCA marca la orden como pagada automaticamente: la deja
//   en comprobante_recibido para revision humana.
export const Comprobantes: CollectionConfig = {
  slug: 'comprobantes',
  access: {
    create: ({ req }) => Boolean(req.user),
    read: ({ req }) => Boolean(req.user),
    update: ({ req }) => req.user?.rol === 'admin',
    delete: ({ req }) => req.user?.rol === 'admin',
  },
  admin: {
    group: 'Ventas',
    defaultColumns: ['filename', 'orden', 'metodoPago', 'createdAt'],
    description: 'Comprobantes subidos por clientes. Verificar el pago antes de marcar la orden como pagada.',
  },
  labels: {
    singular: 'Comprobante de pago',
    plural: 'Comprobantes de pago',
  },
  upload: {
    staticDir: 'public/media/comprobantes',
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  },
  fields: [
    {
      name: 'orden',
      type: 'relationship',
      relationTo: 'ordenes',
      label: 'Orden asociada',
      required: true,
      index: true,
    },
    {
      name: 'metodoPago',
      type: 'text',
      label: 'Metodo de pago declarado',
    },
    {
      name: 'notasCliente',
      type: 'textarea',
      label: 'Nota del cliente',
    },
    {
      name: 'revisado',
      type: 'checkbox',
      label: 'Revisado por administracion',
      defaultValue: false,
    },
  ],
}
