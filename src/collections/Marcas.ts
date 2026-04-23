import type { CollectionConfig } from 'payload'

export const Marcas: CollectionConfig = {
  slug: 'marcas',
  admin: {
    useAsTitle: 'nombre',
    group: 'Catalogo',
  },
  labels: {
    singular: 'Marca',
    plural: 'Marcas',
  },
  fields: [
    {
      name: 'nombre',
      type: 'text',
      label: 'Nombre',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      label: 'URL (slug)',
      required: true,
      index: true,
    },
    {
      name: 'logo',
      type: 'upload',
      label: 'Logo',
      relationTo: 'media',
    },
    {
      name: 'activa',
      type: 'checkbox',
      label: 'Mostrar en tienda',
      defaultValue: true,
      index: true,
    },
  ],
}
