import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Administración',
  },
  labels: {
    singular: 'Archivo',
    plural: 'Archivos (Imágenes)',
  },
  upload: {
    staticDir: 'public/media',
    imageSizes: [
      { name: 'thumbnail', width: 400, height: 400, position: 'centre' },
      { name: 'card', width: 800, height: 800, position: 'centre' },
      { name: 'banner', width: 1920, height: 600, position: 'centre' },
    ],
    adminThumbnail: 'thumbnail',
    mimeTypes: ['image/*'],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'Texto alternativo (SEO)',
    },
  ],
}
