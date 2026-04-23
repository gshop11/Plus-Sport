import { getPayload } from 'payload'
import config from './payload.config'

async function seed() {
  const payload = await getPayload({ config })

  const existing = await payload.find({ collection: 'categorias', limit: 1 })
  if (existing.totalDocs > 0) {
    console.log('✓ Ya hay datos. Si quieres re-seedear, borra dev.db primero.')
    return
  }

  console.log('🌱 Seeding PlusSport...\n')

  // 1. Categorías
  const [running, futbol, gym, natacion, tenis, ciclismo] = await Promise.all([
    payload.create({ collection: 'categorias', data: { nombre: 'Running', slug: 'running', icono: '🏃', orden: 1, activa: true } }),
    payload.create({ collection: 'categorias', data: { nombre: 'Fútbol', slug: 'futbol', icono: '⚽', orden: 2, activa: true } }),
    payload.create({ collection: 'categorias', data: { nombre: 'Gym & Fitness', slug: 'gym', icono: '🏋️', orden: 3, activa: true } }),
    payload.create({ collection: 'categorias', data: { nombre: 'Natación', slug: 'natacion', icono: '🏊', orden: 4, activa: true } }),
    payload.create({ collection: 'categorias', data: { nombre: 'Tenis', slug: 'tenis', icono: '🎾', orden: 5, activa: true } }),
    payload.create({ collection: 'categorias', data: { nombre: 'Ciclismo', slug: 'ciclismo', icono: '🚴', orden: 6, activa: true } }),
  ])
  console.log('✓ 6 categorías creadas')

  // 2. Marcas
  const [nike, adidas, newbalance, puma, asics, underarmour, reebok, fila] = await Promise.all([
    payload.create({ collection: 'marcas', data: { nombre: 'Nike', slug: 'nike', activa: true } }),
    payload.create({ collection: 'marcas', data: { nombre: 'Adidas', slug: 'adidas', activa: true } }),
    payload.create({ collection: 'marcas', data: { nombre: 'New Balance', slug: 'new-balance', activa: true } }),
    payload.create({ collection: 'marcas', data: { nombre: 'Puma', slug: 'puma', activa: true } }),
    payload.create({ collection: 'marcas', data: { nombre: 'Asics', slug: 'asics', activa: true } }),
    payload.create({ collection: 'marcas', data: { nombre: 'Under Armour', slug: 'under-armour', activa: true } }),
    payload.create({ collection: 'marcas', data: { nombre: 'Reebok', slug: 'reebok', activa: true } }),
    payload.create({ collection: 'marcas', data: { nombre: 'Fila', slug: 'fila', activa: true } }),
  ])
  console.log('✓ 8 marcas creadas')

  // 3. Productos
  await Promise.all([
    payload.create({
      collection: 'productos',
      data: {
        nombre: 'Air Max 270 React Sport Lifestyle',
        slug: 'air-max-270-react',
        precio: 389,
        precioAnterior: 599,
        categoria: running.id,
        marca: nike.id,
        segmento: 'hombre',
        tallas: [
          { talla: '38', stock: 5 },
          { talla: '39', stock: 8 },
          { talla: '40', stock: 10 },
          { talla: '41', stock: 7 },
          { talla: '42', stock: 3 },
        ],
        etiqueta: 'hot',
        destacado: true,
        activo: true,
      },
    }),
    payload.create({
      collection: 'productos',
      data: {
        nombre: 'Ultraboost 22 Performance Running',
        slug: 'ultraboost-22',
        precio: 549,
        categoria: running.id,
        marca: adidas.id,
        segmento: 'mujer',
        tallas: [
          { talla: '40', stock: 4 },
          { talla: '41', stock: 6 },
          { talla: '42', stock: 8 },
          { talla: '43', stock: 2 },
        ],
        etiqueta: 'nuevo',
        destacado: true,
        activo: true,
      },
    }),
    payload.create({
      collection: 'productos',
      data: {
        nombre: 'Fresh Foam 1080v12 Running Premium',
        slug: 'fresh-foam-1080',
        precio: 479,
        precioAnterior: 599,
        categoria: running.id,
        marca: newbalance.id,
        segmento: 'mujer',
        tallas: [
          { talla: '39', stock: 3 },
          { talla: '41', stock: 5 },
          { talla: '42', stock: 4 },
        ],
        destacado: true,
        activo: true,
      },
    }),
    payload.create({
      collection: 'productos',
      data: {
        nombre: 'RS-X Tech Training Lifestyle Sneaker',
        slug: 'rs-x-tech',
        precio: 299,
        precioAnterior: 379,
        categoria: gym.id,
        marca: puma.id,
        segmento: 'ninos',
        tallas: [
          { talla: '38', stock: 6 },
          { talla: '39', stock: 8 },
          { talla: '40', stock: 5 },
          { talla: '41', stock: 3 },
        ],
        etiqueta: 'top',
        destacado: true,
        activo: true,
      },
    }),
    payload.create({
      collection: 'productos',
      data: {
        nombre: 'Predator Edge+ Botines Fútbol',
        slug: 'predator-edge',
        precio: 349,
        precioAnterior: 449,
        categoria: futbol.id,
        marca: adidas.id,
        segmento: 'hombre',
        tallas: [
          { talla: '40', stock: 4 },
          { talla: '41', stock: 6 },
          { talla: '42', stock: 7 },
          { talla: '43', stock: 2 },
        ],
        etiqueta: 'oferta',
        destacado: true,
        activo: true,
      },
    }),
    payload.create({
      collection: 'productos',
      data: {
        nombre: 'Zoom Pegasus 40 Running Premium',
        slug: 'zoom-pegasus-40',
        precio: 429,
        categoria: running.id,
        marca: nike.id,
        segmento: 'unisex',
        tallas: [
          { talla: '39', stock: 5 },
          { talla: '40', stock: 8 },
          { talla: '41', stock: 10 },
          { talla: '42', stock: 6 },
        ],
        etiqueta: 'nuevo',
        destacado: true,
        activo: true,
      },
    }),
    payload.create({
      collection: 'productos',
      data: {
        nombre: 'Gel-Kayano 30 Stability Running',
        slug: 'gel-kayano-30',
        precio: 519,
        precioAnterior: 649,
        categoria: running.id,
        marca: asics.id,
        segmento: 'mujer',
        tallas: [
          { talla: '39', stock: 2 },
          { talla: '40', stock: 4 },
          { talla: '41', stock: 6 },
          { talla: '42', stock: 3 },
        ],
        etiqueta: 'oferta',
        destacado: true,
        activo: true,
      },
    }),
    payload.create({
      collection: 'productos',
      data: {
        nombre: 'Charged Assert 10 Training',
        slug: 'charged-assert-10',
        precio: 259,
        categoria: gym.id,
        marca: underarmour.id,
        segmento: 'hombre',
        tallas: [
          { talla: '40', stock: 6 },
          { talla: '41', stock: 8 },
          { talla: '42', stock: 5 },
          { talla: '43', stock: 4 },
        ],
        etiqueta: 'nuevo',
        destacado: true,
        activo: true,
      },
    }),
  ])
  console.log('✓ 8 productos creados')

  // 4. Banners / Slides Hero
  await Promise.all([
    payload.create({
      collection: 'banners',
      data: {
        titulo: 'CORRE MÁS LEJOS',
        subtitulo: '🔥 Air Max 2025 — Más vendido esta semana',
        descripcion: 'Equipamiento deportivo de alto rendimiento para atletas que no se detienen.',
        colorFondo: '#1a237e',
        textBoton1: 'VER OFERTAS →',
        urlBoton1: '/productos',
        textBoton2: 'EXPLORAR COLECCIÓN',
        urlBoton2: '/categorias',
        orden: 1,
        activo: true,
      },
    }),
    payload.create({
      collection: 'banners',
      data: {
        titulo: 'JUEGA EN GRANDE',
        subtitulo: '⚽ Colección Fútbol 2025',
        descripcion: 'Botines, camisetas y accesorios para el fútbol de alto nivel.',
        colorFondo: '#b71c1c',
        textBoton1: 'VER COLECCIÓN →',
        urlBoton1: '/categoria/futbol',
        textBoton2: 'VER OFERTAS',
        urlBoton2: '/ofertas',
        orden: 2,
        activo: true,
      },
    }),
    payload.create({
      collection: 'banners',
      data: {
        titulo: 'ENTRENA SIN LÍMITES',
        subtitulo: '💪 Gym & Training 2025',
        descripcion: 'Todo para tu gym: ropa, accesorios y equipamiento de las mejores marcas.',
        colorFondo: '#1b5e20',
        textBoton1: 'VER GYM →',
        urlBoton1: '/categoria/gym',
        textBoton2: 'EXPLORAR TODO',
        urlBoton2: '/productos',
        orden: 3,
        activo: true,
      },
    }),
  ])
  console.log('✓ 3 banners creados')

  // 5. Configuración tienda (Global)
  await payload.updateGlobal({
    slug: 'config-tienda',
    data: {
      nombreTienda: 'PlusSport',
      tagline: 'Performance Athletic Wear',
      header: {
        anuncioBarra: '🔥 OFERTA DEL DÍA: 30% OFF en zapatillas Nike — Hoy hasta las 23:59',
        mostrarAnuncio: true,
        textoBtnWhatsapp: 'Comprar por WhatsApp',
        numeroWhatsapp: '51900000000',
        menuPrincipal: [
          { etiqueta: 'HOMBRES', url: '/hombres', esDestacado: false },
          { etiqueta: 'MUJERES', url: '/mujeres', esDestacado: false },
          { etiqueta: 'NIÑOS', url: '/ninos', esDestacado: false },
          { etiqueta: 'OFERTAS', url: '/ofertas', esDestacado: true },
        ],
      },
      footer: {
        descripcion: 'Tu tienda deportiva de confianza en Perú. Las mejores marcas al mejor precio.',
        direccion: 'Lima, Perú',
        horario: 'Lunes a Sábado 9am–8pm',
        textoCopyright: '© 2025 PlusSport. Todos los derechos reservados.',
        metodosPago: [
          { nombre: 'Yape' },
          { nombre: 'Plin' },
          { nombre: 'Visa' },
          { nombre: 'Mastercard' },
        ],
      },
      seo: {
        metaTitulo: 'PlusSport — Tienda Deportiva Online en Perú',
        metaDescripcion: 'Las mejores marcas deportivas: Nike, Adidas, Puma y más. Envío rápido a todo Lima.',
      },
    },
  })
  console.log('✓ Config tienda actualizada')

  console.log('\n🎉 Seed completado! Abre http://localhost:3001 para ver la tienda.')
}

seed()
  .catch((err) => {
    console.error('❌ Error en seed:', err)
    process.exit(1)
  })
  .finally(() => process.exit(0))
