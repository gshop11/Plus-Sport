import type { CollectionConfig } from 'payload'

export const Suscriptores: CollectionConfig = {
  slug: 'suscriptores',
  admin: {
    group: 'Ventas',
    useAsTitle: 'telefono',
    defaultColumns: ['telefono', 'contactado', 'createdAt'],
  },
  labels: {
    singular: 'Suscriptor',
    plural: 'Suscriptores (WhatsApp)',
  },
  access: {
    create: () => true,
    read: ({ req }) => !!req.user,
    update: ({ req }) => !!req.user,
    delete: ({ req }) => !!req.user,
  },
  fields: [
    {
      name: 'telefono',
      type: 'text',
      label: 'WhatsApp',
      required: true,
    },
    {
      name: 'contactado',
      type: 'checkbox',
      label: 'Ya contactado',
      defaultValue: false,
      admin: { description: 'Marca aquí cuando ya le hayas escrito.' },
    },
    {
      name: 'nota',
      type: 'text',
      label: 'Nota interna',
      admin: { description: 'Ej: Le interesa running, esperando respuesta...' },
    },
  ],
}
