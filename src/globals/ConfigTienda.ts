import type { GlobalConfig } from 'payload'

export const ConfigTienda: GlobalConfig = {
  slug: 'config-tienda',
  admin: {
    group: 'Diseno de Tienda',
  },
  label: 'Configuracion General',
  fields: [
    {
      name: 'nombreTienda',
      type: 'text',
      label: 'Nombre de la tienda',
      required: true,
      defaultValue: 'PlusSport',
    },
    {
      name: 'tagline',
      type: 'text',
      label: 'Slogan',
      defaultValue: 'Performance Athletic Wear',
    },
    {
      type: 'row',
      fields: [
        {
          name: 'logo',
          type: 'upload',
          label: 'Logo del header',
          relationTo: 'media',
          admin: { width: '50%' },
        },
        {
          name: 'favicon',
          type: 'upload',
          label: 'Favicon',
          relationTo: 'media',
          admin: { width: '50%' },
        },
      ],
    },
    {
      name: 'colores',
      type: 'group',
      label: 'Colores de la tienda',
      fields: [
        {
          type: 'row',
          fields: [
            {
              name: 'primario',
              type: 'text',
              label: 'Color primario',
              defaultValue: '#1a237e',
              admin: { width: '33%' },
            },
            {
              name: 'acento',
              type: 'text',
              label: 'Color acento',
              defaultValue: '#ff6f00',
              admin: { width: '33%' },
            },
            {
              name: 'fondo',
              type: 'text',
              label: 'Fondo general',
              defaultValue: '#ffffff',
              admin: { width: '33%' },
            },
          ],
        },
      ],
    },
    {
      name: 'header',
      type: 'group',
      label: 'Header',
      fields: [
        {
          name: 'anuncioBarra',
          type: 'text',
          label: 'Texto del anuncio',
          defaultValue: 'ENVIO GRATIS POR COMPRAS MAYORES A S/299',
        },
        {
          name: 'mostrarAnuncio',
          type: 'checkbox',
          label: 'Mostrar barra de anuncio',
          defaultValue: true,
        },
        {
          name: 'textoBtnWhatsapp',
          type: 'text',
          label: 'Texto boton WhatsApp',
          defaultValue: 'Comprar por WhatsApp',
        },
        {
          name: 'numeroWhatsapp',
          type: 'text',
          label: 'Numero WhatsApp',
        },
        {
          name: 'menuPrincipal',
          type: 'array',
          label: 'Menu de navegacion',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'etiqueta',
                  type: 'text',
                  label: 'Etiqueta',
                  required: true,
                  admin: { width: '50%' },
                },
                {
                  name: 'url',
                  type: 'text',
                  label: 'URL',
                  required: true,
                  admin: { width: '50%' },
                },
              ],
            },
            {
              name: 'esDestacado',
              type: 'checkbox',
              label: 'Resaltar',
              defaultValue: false,
            },
          ],
        },
      ],
    },
    {
      name: 'footer',
      type: 'group',
      label: 'Footer',
      fields: [
        {
          name: 'descripcion',
          type: 'textarea',
          label: 'Descripcion de la tienda',
          defaultValue: 'Tu tienda deportiva de confianza en Peru.',
        },
        {
          name: 'telefono',
          type: 'text',
          label: 'Telefono de contacto',
        },
        {
          name: 'email',
          type: 'email',
          label: 'Email de contacto',
        },
        {
          name: 'direccion',
          type: 'text',
          label: 'Direccion',
          defaultValue: 'Lima, Peru',
        },
        {
          name: 'horario',
          type: 'text',
          label: 'Horario de atencion',
          defaultValue: 'Lunes a Sabado 9am-8pm',
        },
        {
          name: 'redesSociales',
          type: 'group',
          label: 'Redes sociales',
          fields: [
            { name: 'facebook', type: 'text', label: 'Facebook URL' },
            { name: 'instagram', type: 'text', label: 'Instagram URL' },
            { name: 'tiktok', type: 'text', label: 'TikTok URL' },
            { name: 'youtube', type: 'text', label: 'YouTube URL' },
          ],
        },
        {
          name: 'textoCopyright',
          type: 'text',
          label: 'Texto de copyright',
          defaultValue: '© 2025 PlusSport. Todos los derechos reservados.',
        },
      ],
    },
    {
      name: 'pagos',
      type: 'group',
      label: 'Metodos de Pago',
      fields: [
        {
          name: 'metodos',
          type: 'array',
          label: 'Add metodos de pago',
          fields: [
            {
              name: 'nombre',
              type: 'text',
              label: 'Nombre',
              required: true,
            },
            {
              name: 'codigo',
              type: 'select',
              label: 'Tipo interno',
              defaultValue: 'whatsapp',
              options: [
                { label: 'Yape', value: 'yape' },
                { label: 'Plin', value: 'plin' },
                { label: 'Transferencia Interbank', value: 'interbank' },
                { label: 'Transferencia BCP', value: 'transferencia' },
                { label: 'Visa / Mastercard', value: 'tarjeta' },
                { label: 'Efectivo contra entrega', value: 'efectivo' },
                { label: 'WhatsApp / Otro', value: 'whatsapp' },
              ],
            },
            {
              name: 'activo',
              type: 'checkbox',
              label: 'Activar metodo',
              defaultValue: true,
            },
            {
              name: 'mostrarEnFooter',
              type: 'checkbox',
              label: 'Mostrar en footer',
              defaultValue: true,
            },
            {
              name: 'instruccion',
              type: 'text',
              label: 'Instruccion',
              defaultValue: 'Te enviaremos los pasos por WhatsApp.',
            },
          ],
        },
      ],
    },
    {
      name: 'seo',
      type: 'group',
      label: 'SEO',
      fields: [
        {
          name: 'metaTitulo',
          type: 'text',
          label: 'Meta titulo',
        },
        {
          name: 'metaDescripcion',
          type: 'textarea',
          label: 'Meta descripcion',
        },
      ],
    },
  ],
}
