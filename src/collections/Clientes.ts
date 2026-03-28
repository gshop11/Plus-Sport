import type { CollectionConfig } from 'payload'

export const Clientes: CollectionConfig = {
  slug: 'clientes',
  access: {
    create: () => true,
    read: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
  },
  admin: {
    useAsTitle: 'nombre',
    group: 'CRM',
    defaultColumns: ['nombre', 'email', 'telefono', 'totalCompras'],
  },
  labels: {
    singular: 'Cliente',
    plural: 'Clientes',
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'nombre',
          type: 'text',
          label: 'Nombre completo',
          required: true,
          admin: { width: '50%' },
        },
        {
          name: 'telefono',
          type: 'text',
          label: 'Teléfono / WhatsApp',
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'email',
      type: 'email',
      label: 'Correo electrónico',
    },
    {
      name: 'documento',
      type: 'text',
      label: 'DNI / RUC',
    },
    {
      name: 'direccion',
      type: 'group',
      label: 'Dirección de envío',
      fields: [
        {
          name: 'calle',
          type: 'text',
          label: 'Calle y número',
        },
        {
          type: 'row',
          fields: [
            {
              name: 'distrito',
              type: 'text',
              label: 'Distrito',
              admin: { width: '50%' },
            },
            {
              name: 'ciudad',
              type: 'text',
              label: 'Ciudad',
              defaultValue: 'Lima',
              admin: { width: '50%' },
            },
          ],
        },
        {
          name: 'referencias',
          type: 'text',
          label: 'Referencias',
        },
      ],
    },
    {
      name: 'notas',
      type: 'textarea',
      label: 'Notas internas',
      admin: { description: 'Notas privadas sobre el cliente (no las ve el cliente)' },
    },
    {
      name: 'totalCompras',
      type: 'number',
      label: 'Total de compras (S/)',
      defaultValue: 0,
      admin: { readOnly: true },
    },
    {
      name: 'etiqueta',
      type: 'select',
      label: 'Etiqueta CRM',
      options: [
        { label: 'Normal', value: 'normal' },
        { label: 'VIP', value: 'vip' },
        { label: 'Frecuente', value: 'frecuente' },
        { label: 'Inactivo', value: 'inactivo' },
      ],
      defaultValue: 'normal',
    },
  ],
}
