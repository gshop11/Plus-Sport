import type { CollectionConfig } from 'payload'

export const Cupones: CollectionConfig = {
  slug: 'cupones',
  admin: {
    useAsTitle: 'codigo',
    group: 'Ventas',
    defaultColumns: ['codigo', 'tipo', 'valor', 'activo', 'vencimiento'],
  },
  labels: {
    singular: 'Cupón',
    plural: 'Cupones',
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'codigo',
          type: 'text',
          label: 'Código del cupón',
          required: true,
          admin: {
            width: '50%',
            description: 'Ej: VERANO20, NIKE10OFF',
          },
        },
        {
          name: 'tipo',
          type: 'select',
          label: 'Tipo de descuento',
          required: true,
          defaultValue: 'porcentaje',
          admin: { width: '50%' },
          options: [
            { label: 'Porcentaje (%)', value: 'porcentaje' },
            { label: 'Monto fijo (S/)', value: 'monto' },
            { label: 'Envío gratis', value: 'envio_gratis' },
          ],
        },
      ],
    },
    {
      name: 'valor',
      type: 'number',
      label: 'Valor del descuento',
      admin: { description: 'Ej: 20 = 20% o S/20 según el tipo' },
    },
    {
      name: 'minimoCompra',
      type: 'number',
      label: 'Mínimo de compra (S/)',
      defaultValue: 0,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'usoMaximo',
          type: 'number',
          label: 'Usos máximos',
          admin: {
            width: '50%',
            description: 'Dejar en 0 para ilimitado',
          },
          defaultValue: 0,
        },
        {
          name: 'usosActuales',
          type: 'number',
          label: 'Usos actuales',
          defaultValue: 0,
          admin: { width: '50%', readOnly: true },
        },
      ],
    },
    {
      name: 'vencimiento',
      type: 'date',
      label: 'Fecha de vencimiento',
      admin: { description: 'Dejar vacío para sin vencimiento' },
    },
    {
      name: 'activo',
      type: 'checkbox',
      label: 'Cupón activo',
      defaultValue: true,
    },
    {
      name: 'descripcion',
      type: 'text',
      label: 'Descripción interna',
    },
  ],
}
