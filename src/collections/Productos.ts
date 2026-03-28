import type { CollectionConfig } from 'payload'

export const Productos: CollectionConfig = {
  slug: 'productos',
  admin: {
    useAsTitle: 'nombre',
    group: 'Catalogo',
    defaultColumns: ['nombre', 'precio', 'segmento', 'stock', 'activo'],
  },
  labels: {
    singular: 'Producto',
    plural: 'Productos',
  },
  fields: [
    {
      name: 'nombre',
      type: 'text',
      label: 'Nombre del producto',
      required: true,
    },
    {
      name: 'slug',
      type: 'text',
      label: 'URL (slug)',
      required: true,
      index: true,
      admin: { description: 'Ej: air-max-270-negro (sin espacios)' },
    },
    {
      name: 'descripcion',
      type: 'richText',
      label: 'Descripcion',
    },
    {
      name: 'sku',
      type: 'text',
      label: 'SKU / Codigo',
    },

    {
      type: 'row',
      fields: [
        {
          name: 'precio',
          type: 'number',
          label: 'Precio (S/)',
          required: true,
          admin: { width: '50%' },
        },
        {
          name: 'precioAnterior',
          type: 'number',
          label: 'Precio anterior (para mostrar descuento)',
          admin: {
            width: '50%',
            description: 'Dejar vacio si no hay descuento',
          },
        },
      ],
    },

    {
      name: 'categoria',
      type: 'relationship',
      label: 'Categoria',
      relationTo: 'categorias',
      required: true,
      index: true,
    },
    {
      name: 'marca',
      type: 'relationship',
      label: 'Marca',
      relationTo: 'marcas',
      index: true,
    },
    {
      name: 'segmento',
      type: 'select',
      label: 'Segmento',
      index: true,
      options: [
        { label: 'Hombre', value: 'hombre' },
        { label: 'Mujer', value: 'mujer' },
        { label: 'Ninos', value: 'ninos' },
        { label: 'Unisex', value: 'unisex' },
      ],
      defaultValue: 'unisex',
      admin: {
        description: 'Permite filtrar el catalogo por publico objetivo.',
      },
    },

    {
      name: 'imagenPrincipal',
      type: 'upload',
      label: 'Imagen principal',
      relationTo: 'media',
    },
    {
      name: 'imagenes',
      type: 'array',
      label: 'Galeria de imagenes',
      fields: [
        {
          name: 'imagen',
          type: 'upload',
          relationTo: 'media',
          required: true,
          label: 'Imagen',
        },
      ],
    },

    {
      name: 'tallas',
      type: 'array',
      label: 'Tallas disponibles',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'talla',
              type: 'text',
              label: 'Talla',
              required: true,
              admin: { width: '50%', description: 'Ej: 38, 39, S, M, L' },
            },
            {
              name: 'stock',
              type: 'number',
              label: 'Stock',
              required: true,
              defaultValue: 0,
              admin: { width: '50%' },
            },
          ],
        },
      ],
    },
    {
      name: 'stock',
      type: 'number',
      label: 'Stock total (sin tallas)',
      defaultValue: 0,
      admin: { description: 'Solo si el producto no tiene tallas' },
    },

    {
      name: 'etiqueta',
      type: 'select',
      label: 'Etiqueta destacada',
      index: true,
      options: [
        { label: 'Ninguna', value: '' },
        { label: 'NUEVO', value: 'nuevo' },
        { label: 'HOT', value: 'hot' },
        { label: 'TOP', value: 'top' },
        { label: 'OFERTA', value: 'oferta' },
      ],
      defaultValue: '',
    },
    {
      type: 'row',
      fields: [
        {
          name: 'destacado',
          type: 'checkbox',
          label: 'Mostrar en "Lo mas vendido"',
          defaultValue: false,
          index: true,
          admin: { width: '50%' },
        },
        {
          name: 'nuevoIngreso',
          type: 'checkbox',
          label: 'Mostrar en "Nuevos Ingresos"',
          defaultValue: false,
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'activo',
      type: 'checkbox',
      label: 'Producto activo (visible en tienda)',
      defaultValue: true,
      index: true,
    },
  ],
}
