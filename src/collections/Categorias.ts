import type { CollectionConfig } from 'payload'

export const Categorias: CollectionConfig = {
  slug: 'categorias',
  admin: {
    useAsTitle: 'nombre',
    group: 'Catalogo',
  },
  labels: {
    singular: 'Categoria',
    plural: 'Categorias',
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
      admin: { description: 'Ej: zapatillas-running (sin espacios, en minusculas)' },
    },
    {
      name: 'descripcion',
      type: 'textarea',
      label: 'Descripcion',
    },
    {
      name: 'imagen',
      type: 'upload',
      label: 'Imagen de categoria',
      relationTo: 'media',
    },
    {
      name: 'icono',
      type: 'text',
      label: 'Emoji o icono',
      admin: { description: 'Ej: teni, running, futbol' },
    },
    {
      name: 'categoriaPadre',
      type: 'relationship',
      label: 'Categoria padre (opcional)',
      relationTo: 'categorias',
      admin: { description: 'Deja vacio si es categoria principal' },
    },
    {
      name: 'orden',
      type: 'number',
      label: 'Orden de aparicion',
      defaultValue: 0,
      index: true,
    },
    {
      name: 'activa',
      type: 'checkbox',
      label: 'Categoria activa',
      defaultValue: true,
      index: true,
    },
  ],
}
