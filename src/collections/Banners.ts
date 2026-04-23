import type { CollectionConfig } from 'payload'

export const Banners: CollectionConfig = {
  slug: 'banners',
  admin: {
    useAsTitle: 'titulo',
    group: 'Diseno de Tienda',
  },
  labels: {
    singular: 'Banner',
    plural: 'Banners',
  },
  fields: [
    {
      name: 'titulo',
      type: 'text',
      label: 'Titulo principal',
      required: true,
    },
    {
      name: 'subtitulo',
      type: 'text',
      label: 'Subtitulo',
    },
    {
      name: 'descripcion',
      type: 'textarea',
      label: 'Descripcion',
    },
    {
      name: 'imagen',
      type: 'upload',
      label: 'Imagen de fondo',
      relationTo: 'media',
    },
    {
      name: 'colorFondo',
      type: 'text',
      label: 'Color de fondo (hex)',
      defaultValue: '#1a237e',
      admin: { description: 'Ej: #1a237e' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'textBoton1',
          type: 'text',
          label: 'Boton 1 - Texto',
          admin: { width: '50%' },
        },
        {
          name: 'urlBoton1',
          type: 'text',
          label: 'Boton 1 - URL',
          admin: { width: '50%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'textBoton2',
          type: 'text',
          label: 'Boton 2 - Texto',
          admin: { width: '50%' },
        },
        {
          name: 'urlBoton2',
          type: 'text',
          label: 'Boton 2 - URL',
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'orden',
      type: 'number',
      label: 'Orden',
      defaultValue: 1,
      index: true,
    },
    {
      name: 'activo',
      type: 'checkbox',
      label: 'Banner activo',
      defaultValue: true,
      index: true,
    },
  ],
}
