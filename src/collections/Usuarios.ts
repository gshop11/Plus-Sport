import type { CollectionConfig } from 'payload'

export const Usuarios: CollectionConfig = {
  slug: 'usuarios',
  auth: true,
  admin: {
    useAsTitle: 'email',
    group: 'Administración',
  },
  labels: {
    singular: 'Usuario Admin',
    plural: 'Usuarios Admin',
  },
  fields: [
    {
      name: 'nombre',
      type: 'text',
      label: 'Nombre completo',
      required: true,
    },
    {
      name: 'rol',
      type: 'select',
      label: 'Rol',
      defaultValue: 'editor',
      options: [
        { label: 'Administrador', value: 'admin' },
        { label: 'Editor', value: 'editor' },
        { label: 'Vendedor', value: 'vendedor' },
      ],
    },
  ],
}
