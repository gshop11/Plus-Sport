import type { CollectionConfig } from 'payload'

export const Envios: CollectionConfig = {
  slug: 'envios',
  admin: {
    useAsTitle: 'nombre',
    group: 'Ventas',
  },
  labels: {
    singular: 'Zona de envío',
    plural: 'Zonas de envío',
  },
  fields: [
    {
      name: 'nombre',
      type: 'text',
      label: 'Nombre de la zona',
      required: true,
      admin: { description: 'Ej: Lima Metropolitana, Provincias, Envío Express' },
    },
    {
      name: 'descripcion',
      type: 'text',
      label: 'Descripción',
      admin: { description: 'Ej: Entrega en 24-48 horas' },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'costo',
          type: 'number',
          label: 'Costo (S/)',
          required: true,
          defaultValue: 0,
          admin: { width: '50%' },
        },
        {
          name: 'tiempoEntrega',
          type: 'text',
          label: 'Tiempo de entrega',
          admin: { width: '50%', description: 'Ej: 1-2 días' },
        },
      ],
    },
    {
      name: 'minimoGratis',
      type: 'number',
      label: 'Monto mínimo para envío gratis (S/)',
      admin: { description: 'Dejar en 0 si no aplica envío gratis' },
      defaultValue: 0,
    },
    {
      name: 'distritos',
      type: 'array',
      label: 'Distritos cubiertos',
      fields: [
        {
          name: 'distrito',
          type: 'text',
          label: 'Distrito',
          required: true,
        },
      ],
    },
    {
      name: 'activo',
      type: 'checkbox',
      label: 'Zona activa',
      defaultValue: true,
    },
  ],
}
