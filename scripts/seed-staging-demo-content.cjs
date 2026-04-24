#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { Client } = require('pg')

const DATABASE_URI = process.env.DATABASE_URI
const MEDIA_DIR = path.join(process.cwd(), 'public', 'media')

if (!DATABASE_URI) {
  console.error('Missing DATABASE_URI. Run with: set -a; source .env.production; set +a; node scripts/seed-staging-demo-content.cjs')
  process.exit(1)
}

const BRAND_DEFS = [
  { slug: 'nike', nombre: 'Nike', colors: ['#111827', '#374151'] },
  { slug: 'adidas', nombre: 'Adidas', colors: ['#0f172a', '#1f2937'] },
  { slug: 'joma', nombre: 'Joma', colors: ['#052e16', '#14532d'] },
  { slug: 'puma', nombre: 'Puma', colors: ['#7f1d1d', '#b91c1c'] },
  { slug: 'under-armour', nombre: 'Under Armour', colors: ['#27272a', '#3f3f46'] },
  { slug: 'new-balance', nombre: 'New Balance', colors: ['#7c2d12', '#9a3412'] },
  { slug: 'asics', nombre: 'Asics', colors: ['#1e1b4b', '#312e81'] },
  { slug: 'skechers', nombre: 'Skechers', colors: ['#0c4a6e', '#0369a1'] },
  { slug: 'reebok', nombre: 'Reebok', colors: ['#334155', '#475569'] },
  { slug: 'fila', nombre: 'Fila', colors: ['#991b1b', '#1e40af'] },
  { slug: 'converse', nombre: 'Converse', colors: ['#3f3f46', '#52525b'] },
  { slug: 'kangaroos', nombre: 'KangaROOS', colors: ['#78350f', '#92400e'] },
]

const CATEGORY_DEFS = [
  {
    slug: 'running',
    nombre: 'Running',
    icono: '🏃',
    descripcion: 'Zapatillas de running para asfalto, trote diario y fondo largo.',
    orden: 1,
    colors: ['#1d4ed8', '#0ea5e9'],
  },
  {
    slug: 'futbol',
    nombre: 'Futbol',
    icono: '⚽',
    descripcion: 'Botines TF e indoor para entrenamiento y partidos semanales.',
    orden: 2,
    colors: ['#166534', '#16a34a'],
  },
  {
    slug: 'training',
    nombre: 'Training',
    icono: '🏋️',
    descripcion: 'Modelos estables para gym, funcional y entrenamientos mixtos.',
    orden: 3,
    colors: ['#7c3aed', '#a855f7'],
  },
  {
    slug: 'lifestyle',
    nombre: 'Lifestyle',
    icono: '🔥',
    descripcion: 'Sneakers urbanos para uso diario con estilo sportwear.',
    orden: 4,
    colors: ['#be123c', '#f97316'],
  },
  {
    slug: 'escolar',
    nombre: 'Escolar',
    icono: '🎒',
    descripcion: 'Calzado escolar resistente para uso diario y recreo.',
    orden: 5,
    colors: ['#0f766e', '#14b8a6'],
  },
]

const BANNER_DEFS = [
  {
    orden: 1,
    titulo: 'NUEVA TEMPORADA SNEAKER',
    subtitulo: 'Running + lifestyle para rotacion comercial',
    descripcion: 'Drops semanales y modelos de alta demanda para vitrina principal.',
    btn1: 'Ver novedades',
    url1: '/productos?sort=newest',
    btn2: 'Ir a ofertas',
    url2: '/ofertas',
    colorFondo: '#0f1d54',
    colors: ['#0f1d54', '#223ea3'],
  },
  {
    orden: 2,
    titulo: 'MODO FUTBOL ACTIVO',
    subtitulo: 'Botines TF e indoor para hombre, mujer y ninos',
    descripcion: 'Seleccion orientada a entrenamiento y campeonatos de fin de semana.',
    btn1: 'Ver futbol',
    url1: '/categoria/futbol',
    btn2: 'Top vendidos',
    url2: '/productos',
    colorFondo: '#0f5132',
    colors: ['#0f5132', '#198754'],
  },
  {
    orden: 3,
    titulo: 'TRAINING Y GYM',
    subtitulo: 'Estabilidad, grip y respuesta para entrenar mejor',
    descripcion: 'Linea de training con ofertas y nuevas siluetas.',
    btn1: 'Ver training',
    url1: '/categoria/training',
    btn2: 'Comprar ahora',
    url2: '/productos',
    colorFondo: '#4c1d95',
    colors: ['#4c1d95', '#7c3aed'],
  },
]

const PRODUCT_DEFS = [
  {
    nombre: 'Nike Air Zoom Pegasus 41',
    slug: 'nike-air-zoom-pegasus-41',
    sku: 'NIK-RUN-001',
    categoria: 'running',
    marca: 'nike',
    segmento: 'hombre',
    precio: 459,
    precioAnterior: 499,
    etiqueta: 'top',
    destacado: true,
    nuevoIngreso: true,
    stock: 18,
    tallas: ['39', '40', '41', '42', '43', '44'],
  },
  {
    nombre: 'Adidas Duramo SL 2',
    slug: 'adidas-duramo-sl-2',
    sku: 'ADI-RUN-002',
    categoria: 'running',
    marca: 'adidas',
    segmento: 'mujer',
    precio: 289,
    precioAnterior: 329,
    etiqueta: 'oferta',
    destacado: true,
    nuevoIngreso: true,
    stock: 14,
    tallas: ['35', '36', '37', '38', '39', '40'],
  },
  {
    nombre: 'Joma Top Flex TF',
    slug: 'joma-top-flex-tf',
    sku: 'JOM-FUT-003',
    categoria: 'futbol',
    marca: 'joma',
    segmento: 'hombre',
    precio: 239,
    precioAnterior: null,
    etiqueta: 'hot',
    destacado: true,
    nuevoIngreso: true,
    stock: 15,
    tallas: ['39', '40', '41', '42', '43'],
  },
  {
    nombre: 'Nike Metcon 9',
    slug: 'nike-metcon-9',
    sku: 'NIK-TRN-004',
    categoria: 'training',
    marca: 'nike',
    segmento: 'unisex',
    precio: 519,
    precioAnterior: null,
    etiqueta: 'nuevo',
    destacado: true,
    nuevoIngreso: true,
    stock: 13,
    tallas: ['37', '38', '39', '40', '41', '42', '43'],
  },
  {
    nombre: 'Asics Gel Nimbus 26',
    slug: 'asics-gel-nimbus-26',
    sku: 'ASI-RUN-005',
    categoria: 'running',
    marca: 'asics',
    segmento: 'mujer',
    precio: 579,
    precioAnterior: 649,
    etiqueta: 'oferta',
    destacado: true,
    nuevoIngreso: true,
    stock: 12,
    tallas: ['35', '36', '37', '38', '39', '40'],
  },
  {
    nombre: 'New Balance Fresh Foam 1080 v13',
    slug: 'new-balance-fresh-foam-1080-v13',
    sku: 'NB-RUN-006',
    categoria: 'running',
    marca: 'new-balance',
    segmento: 'hombre',
    precio: 559,
    precioAnterior: 619,
    etiqueta: 'top',
    destacado: true,
    nuevoIngreso: true,
    stock: 11,
    tallas: ['39', '40', '41', '42', '43', '44'],
  },
  {
    nombre: 'Puma Deviate Nitro 3',
    slug: 'puma-deviate-nitro-3',
    sku: 'PUM-RUN-007',
    categoria: 'running',
    marca: 'puma',
    segmento: 'hombre',
    precio: 499,
    precioAnterior: null,
    etiqueta: 'nuevo',
    destacado: false,
    nuevoIngreso: true,
    stock: 9,
    tallas: ['39', '40', '41', '42', '43'],
  },
  {
    nombre: 'Skechers GO RUN Ride 11',
    slug: 'skechers-go-run-ride-11',
    sku: 'SKE-RUN-008',
    categoria: 'running',
    marca: 'skechers',
    segmento: 'unisex',
    precio: 359,
    precioAnterior: 429,
    etiqueta: 'oferta',
    destacado: false,
    nuevoIngreso: true,
    stock: 16,
    tallas: ['36', '37', '38', '39', '40', '41', '42'],
  },
  {
    nombre: 'Under Armour Charged Assert 10',
    slug: 'under-armour-charged-assert-10',
    sku: 'UA-RUN-009',
    categoria: 'running',
    marca: 'under-armour',
    segmento: 'hombre',
    precio: 319,
    precioAnterior: null,
    etiqueta: 'nuevo',
    destacado: false,
    nuevoIngreso: true,
    stock: 17,
    tallas: ['39', '40', '41', '42', '43', '44'],
  },
  {
    nombre: 'Adidas Supernova Rise',
    slug: 'adidas-supernova-rise',
    sku: 'ADI-RUN-010',
    categoria: 'running',
    marca: 'adidas',
    segmento: 'mujer',
    precio: 439,
    precioAnterior: 489,
    etiqueta: 'oferta',
    destacado: true,
    nuevoIngreso: false,
    stock: 10,
    tallas: ['35', '36', '37', '38', '39', '40'],
  },
  {
    nombre: 'Nike ZoomX Invincible 3',
    slug: 'nike-zoomx-invincible-3',
    sku: 'NIK-RUN-011',
    categoria: 'running',
    marca: 'nike',
    segmento: 'hombre',
    precio: 629,
    precioAnterior: null,
    etiqueta: 'top',
    destacado: true,
    nuevoIngreso: false,
    stock: 8,
    tallas: ['39', '40', '41', '42', '43'],
  },
  {
    nombre: 'Joma R Hispalis 24',
    slug: 'joma-r-hispalis-24',
    sku: 'JOM-RUN-012',
    categoria: 'running',
    marca: 'joma',
    segmento: 'hombre',
    precio: 329,
    precioAnterior: 379,
    etiqueta: 'oferta',
    destacado: false,
    nuevoIngreso: false,
    stock: 13,
    tallas: ['39', '40', '41', '42', '43'],
  },
  {
    nombre: 'Nike Mercurial Vapor 16 Club TF',
    slug: 'nike-mercurial-vapor-16-club-tf',
    sku: 'NIK-FUT-013',
    categoria: 'futbol',
    marca: 'nike',
    segmento: 'hombre',
    precio: 269,
    precioAnterior: 319,
    etiqueta: 'oferta',
    destacado: true,
    nuevoIngreso: true,
    stock: 20,
    tallas: ['39', '40', '41', '42', '43'],
  },
  {
    nombre: 'Adidas Predator League TF',
    slug: 'adidas-predator-league-tf',
    sku: 'ADI-FUT-014',
    categoria: 'futbol',
    marca: 'adidas',
    segmento: 'hombre',
    precio: 299,
    precioAnterior: null,
    etiqueta: 'top',
    destacado: true,
    nuevoIngreso: false,
    stock: 19,
    tallas: ['39', '40', '41', '42', '43', '44'],
  },
  {
    nombre: 'Puma Future 7 Play TF',
    slug: 'puma-future-7-play-tf',
    sku: 'PUM-FUT-015',
    categoria: 'futbol',
    marca: 'puma',
    segmento: 'unisex',
    precio: 249,
    precioAnterior: null,
    etiqueta: 'nuevo',
    destacado: false,
    nuevoIngreso: true,
    stock: 21,
    tallas: ['37', '38', '39', '40', '41', '42'],
  },
  {
    nombre: 'Joma Dribling 2503 TF',
    slug: 'joma-dribling-2503-tf',
    sku: 'JOM-FUT-016',
    categoria: 'futbol',
    marca: 'joma',
    segmento: 'mujer',
    precio: 219,
    precioAnterior: 259,
    etiqueta: 'oferta',
    destacado: false,
    nuevoIngreso: true,
    stock: 15,
    tallas: ['35', '36', '37', '38', '39', '40'],
  },
  {
    nombre: 'Nike Tiempo Legend 10 Club TF',
    slug: 'nike-tiempo-legend-10-club-tf',
    sku: 'NIK-FUT-017',
    categoria: 'futbol',
    marca: 'nike',
    segmento: 'hombre',
    precio: 259,
    precioAnterior: null,
    etiqueta: 'hot',
    destacado: true,
    nuevoIngreso: false,
    stock: 18,
    tallas: ['39', '40', '41', '42', '43'],
  },
  {
    nombre: 'Adidas Copa Pure 2 Club TF',
    slug: 'adidas-copa-pure-2-club-tf',
    sku: 'ADI-FUT-018',
    categoria: 'futbol',
    marca: 'adidas',
    segmento: 'hombre',
    precio: 249,
    precioAnterior: 289,
    etiqueta: 'oferta',
    destacado: false,
    nuevoIngreso: false,
    stock: 16,
    tallas: ['39', '40', '41', '42', '43'],
  },
  {
    nombre: 'Puma Ultra Play TF Jr',
    slug: 'puma-ultra-play-tf-jr',
    sku: 'PUM-FUT-019',
    categoria: 'futbol',
    marca: 'puma',
    segmento: 'ninos',
    precio: 199,
    precioAnterior: null,
    etiqueta: 'nuevo',
    destacado: false,
    nuevoIngreso: true,
    stock: 22,
    tallas: ['30', '31', '32', '33', '34', '35'],
  },
  {
    nombre: 'Adidas Dropset 3',
    slug: 'adidas-dropset-3',
    sku: 'ADI-TRN-020',
    categoria: 'training',
    marca: 'adidas',
    segmento: 'unisex',
    precio: 419,
    precioAnterior: null,
    etiqueta: 'top',
    destacado: true,
    nuevoIngreso: false,
    stock: 12,
    tallas: ['37', '38', '39', '40', '41', '42', '43'],
  },
  {
    nombre: 'Under Armour Project Rock 6',
    slug: 'under-armour-project-rock-6',
    sku: 'UA-TRN-021',
    categoria: 'training',
    marca: 'under-armour',
    segmento: 'hombre',
    precio: 469,
    precioAnterior: 529,
    etiqueta: 'oferta',
    destacado: true,
    nuevoIngreso: false,
    stock: 10,
    tallas: ['39', '40', '41', '42', '43'],
  },
  {
    nombre: 'Reebok Nano X4',
    slug: 'reebok-nano-x4',
    sku: 'REE-TRN-022',
    categoria: 'training',
    marca: 'reebok',
    segmento: 'mujer',
    precio: 399,
    precioAnterior: null,
    etiqueta: 'hot',
    destacado: false,
    nuevoIngreso: true,
    stock: 11,
    tallas: ['35', '36', '37', '38', '39', '40'],
  },
  {
    nombre: 'Puma Fuse 3.0',
    slug: 'puma-fuse-3-0',
    sku: 'PUM-TRN-023',
    categoria: 'training',
    marca: 'puma',
    segmento: 'unisex',
    precio: 339,
    precioAnterior: null,
    etiqueta: 'nuevo',
    destacado: false,
    nuevoIngreso: true,
    stock: 13,
    tallas: ['37', '38', '39', '40', '41', '42'],
  },
  {
    nombre: 'Joma Master 1000 Training',
    slug: 'joma-master-1000-training',
    sku: 'JOM-TRN-024',
    categoria: 'training',
    marca: 'joma',
    segmento: 'hombre',
    precio: 229,
    precioAnterior: 269,
    etiqueta: 'oferta',
    destacado: false,
    nuevoIngreso: false,
    stock: 14,
    tallas: ['39', '40', '41', '42', '43'],
  },
  {
    nombre: 'Nike Air Force 1 07',
    slug: 'nike-air-force-1-07',
    sku: 'NIK-LIF-025',
    categoria: 'lifestyle',
    marca: 'nike',
    segmento: 'unisex',
    precio: 489,
    precioAnterior: null,
    etiqueta: 'top',
    destacado: true,
    nuevoIngreso: false,
    stock: 18,
    tallas: ['37', '38', '39', '40', '41', '42'],
  },
  {
    nombre: 'Adidas Grand Court 2',
    slug: 'adidas-grand-court-2',
    sku: 'ADI-LIF-026',
    categoria: 'lifestyle',
    marca: 'adidas',
    segmento: 'mujer',
    precio: 299,
    precioAnterior: 349,
    etiqueta: 'oferta',
    destacado: true,
    nuevoIngreso: false,
    stock: 19,
    tallas: ['35', '36', '37', '38', '39', '40'],
  },
  {
    nombre: 'Puma Smash v2',
    slug: 'puma-smash-v2',
    sku: 'PUM-LIF-027',
    categoria: 'lifestyle',
    marca: 'puma',
    segmento: 'unisex',
    precio: 249,
    precioAnterior: null,
    etiqueta: 'hot',
    destacado: false,
    nuevoIngreso: false,
    stock: 20,
    tallas: ['36', '37', '38', '39', '40', '41', '42'],
  },
  {
    nombre: 'Skechers Uno Lite',
    slug: 'skechers-uno-lite',
    sku: 'SKE-LIF-028',
    categoria: 'lifestyle',
    marca: 'skechers',
    segmento: 'mujer',
    precio: 309,
    precioAnterior: 349,
    etiqueta: 'oferta',
    destacado: false,
    nuevoIngreso: true,
    stock: 12,
    tallas: ['35', '36', '37', '38', '39', '40'],
  },
  {
    nombre: 'Fila Disruptor Mini',
    slug: 'fila-disruptor-mini',
    sku: 'FIL-LIF-029',
    categoria: 'lifestyle',
    marca: 'fila',
    segmento: 'ninos',
    precio: 229,
    precioAnterior: null,
    etiqueta: 'nuevo',
    destacado: false,
    nuevoIngreso: true,
    stock: 17,
    tallas: ['30', '31', '32', '33', '34', '35'],
  },
  {
    nombre: 'New Balance 574 Core',
    slug: 'new-balance-574-core',
    sku: 'NB-LIF-030',
    categoria: 'lifestyle',
    marca: 'new-balance',
    segmento: 'unisex',
    precio: 379,
    precioAnterior: null,
    etiqueta: 'top',
    destacado: false,
    nuevoIngreso: false,
    stock: 15,
    tallas: ['36', '37', '38', '39', '40', '41', '42'],
  },
  {
    nombre: 'Converse Chuck Taylor All Star',
    slug: 'converse-chuck-taylor-all-star',
    sku: 'CON-LIF-031',
    categoria: 'lifestyle',
    marca: 'converse',
    segmento: 'unisex',
    precio: 269,
    precioAnterior: null,
    etiqueta: 'hot',
    destacado: false,
    nuevoIngreso: false,
    stock: 18,
    tallas: ['36', '37', '38', '39', '40', '41'],
  },
  {
    nombre: 'Nike Court Vision Low',
    slug: 'nike-court-vision-low',
    sku: 'NIK-LIF-032',
    categoria: 'lifestyle',
    marca: 'nike',
    segmento: 'hombre',
    precio: 339,
    precioAnterior: 379,
    etiqueta: 'oferta',
    destacado: true,
    nuevoIngreso: false,
    stock: 14,
    tallas: ['39', '40', '41', '42', '43'],
  },
  {
    nombre: 'Adidas Hoops 3.0 Mid',
    slug: 'adidas-hoops-3-0-mid',
    sku: 'ADI-LIF-033',
    categoria: 'lifestyle',
    marca: 'adidas',
    segmento: 'hombre',
    precio: 329,
    precioAnterior: null,
    etiqueta: 'nuevo',
    destacado: false,
    nuevoIngreso: true,
    stock: 13,
    tallas: ['39', '40', '41', '42', '43'],
  },
  {
    nombre: 'KangaROOS School Run VC',
    slug: 'kangaroos-school-run-vc',
    sku: 'KAN-ESC-034',
    categoria: 'escolar',
    marca: 'kangaroos',
    segmento: 'ninos',
    precio: 159,
    precioAnterior: 189,
    etiqueta: 'oferta',
    destacado: true,
    nuevoIngreso: true,
    stock: 28,
    tallas: ['28', '29', '30', '31', '32', '33', '34'],
  },
  {
    nombre: 'Puma Carina Kids',
    slug: 'puma-carina-kids',
    sku: 'PUM-ESC-035',
    categoria: 'escolar',
    marca: 'puma',
    segmento: 'ninos',
    precio: 179,
    precioAnterior: null,
    etiqueta: 'nuevo',
    destacado: false,
    nuevoIngreso: true,
    stock: 24,
    tallas: ['29', '30', '31', '32', '33', '34', '35'],
  },
  {
    nombre: 'Adidas Tensaur Sport 2 Kids',
    slug: 'adidas-tensaur-sport-2-kids',
    sku: 'ADI-ESC-036',
    categoria: 'escolar',
    marca: 'adidas',
    segmento: 'ninos',
    precio: 169,
    precioAnterior: 199,
    etiqueta: 'oferta',
    destacado: false,
    nuevoIngreso: false,
    stock: 26,
    tallas: ['28', '29', '30', '31', '32', '33', '34', '35'],
  },
  {
    nombre: 'Nike Revolution 7 Kids',
    slug: 'nike-revolution-7-kids',
    sku: 'NIK-ESC-037',
    categoria: 'escolar',
    marca: 'nike',
    segmento: 'ninos',
    precio: 189,
    precioAnterior: null,
    etiqueta: 'top',
    destacado: true,
    nuevoIngreso: false,
    stock: 20,
    tallas: ['29', '30', '31', '32', '33', '34', '35'],
  },
  {
    nombre: 'Skechers Skech Fast Kids',
    slug: 'skechers-skech-fast-kids',
    sku: 'SKE-ESC-038',
    categoria: 'escolar',
    marca: 'skechers',
    segmento: 'ninos',
    precio: 169,
    precioAnterior: null,
    etiqueta: 'nuevo',
    destacado: false,
    nuevoIngreso: true,
    stock: 23,
    tallas: ['28', '29', '30', '31', '32', '33', '34'],
  },
  {
    nombre: 'Converse All Star Kids School',
    slug: 'converse-all-star-kids-school',
    sku: 'CON-ESC-039',
    categoria: 'escolar',
    marca: 'converse',
    segmento: 'ninos',
    precio: 149,
    precioAnterior: 179,
    etiqueta: 'oferta',
    destacado: false,
    nuevoIngreso: false,
    stock: 22,
    tallas: ['29', '30', '31', '32', '33', '34'],
  },
  {
    nombre: 'Joma Top Flex Jr School',
    slug: 'joma-top-flex-jr-school',
    sku: 'JOM-ESC-040',
    categoria: 'escolar',
    marca: 'joma',
    segmento: 'ninos',
    precio: 139,
    precioAnterior: null,
    etiqueta: 'hot',
    destacado: false,
    nuevoIngreso: false,
    stock: 21,
    tallas: ['29', '30', '31', '32', '33', '34', '35'],
  },
]

const HOME_MENU = [
  { id: 'menu-catalogo', etiqueta: 'Catalogo', url: '/productos', destacado: false },
  { id: 'menu-hombre', etiqueta: 'Hombre', url: '/productos?segmento=hombre', destacado: false },
  { id: 'menu-mujer', etiqueta: 'Mujer', url: '/productos?segmento=mujer', destacado: false },
  { id: 'menu-ninos', etiqueta: 'Ninos', url: '/productos?segmento=ninos', destacado: false },
  { id: 'menu-marcas', etiqueta: 'Marcas', url: '/marcas', destacado: false },
  { id: 'menu-ofertas', etiqueta: 'Ofertas', url: '/ofertas', destacado: true },
]

const HOME_SECTIONS = [
  { id: 'home-categorias', key: 'categorias', orden: 1, titulo: 'COMPRA POR DEPORTE', subtitulo: 'Running, futbol, training, lifestyle y escolar' },
  { id: 'home-marcas', key: 'marcas', orden: 2, titulo: 'MARCAS TOP EN TENDENCIA', subtitulo: 'Seleccion comercial para sneaker/sportwear' },
  { id: 'home-destacados', key: 'destacados', orden: 3, titulo: 'LO MAS VENDIDO', subtitulo: 'Productos con mayor traccion y mejor conversion' },
  { id: 'home-suscripcion', key: 'suscripcion', orden: 4, titulo: 'Recibe drops y ofertas exclusivas', subtitulo: 'Dejanos tu WhatsApp y te avisamos primero' },
]

function escapeXml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function writeMediaSvg(filename, content) {
  fs.mkdirSync(MEDIA_DIR, { recursive: true })
  const filePath = path.join(MEDIA_DIR, filename)
  fs.writeFileSync(filePath, content, 'utf8')
  return filePath
}

function buildLogoSvg(name, colors) {
  const [c1, c2] = colors
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="720" height="260" viewBox="0 0 720 260">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="720" height="260" rx="40" fill="url(#g)"/>
  <circle cx="95" cy="130" r="46" fill="rgba(255,255,255,.18)"/>
  <text x="170" y="148" fill="#ffffff" font-size="62" font-weight="800" font-family="Arial, Helvetica, sans-serif">${escapeXml(name)}</text>
</svg>`
}

function buildCategorySvg(name, subtitle, colors) {
  const [c1, c2] = colors
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="1000" fill="url(#g)"/>
  <circle cx="1320" cy="170" r="210" fill="rgba(255,255,255,.12)"/>
  <circle cx="240" cy="880" r="280" fill="rgba(255,255,255,.08)"/>
  <text x="120" y="560" fill="#fff" font-size="128" font-weight="900" letter-spacing="2" font-family="Arial, Helvetica, sans-serif">${escapeXml(name.toUpperCase())}</text>
  <text x="120" y="640" fill="rgba(255,255,255,.85)" font-size="44" font-weight="500" font-family="Arial, Helvetica, sans-serif">${escapeXml(subtitle)}</text>
</svg>`
}

function buildBannerSvg(title, subtitle, colors) {
  const [c1, c2] = colors
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="700" viewBox="0 0 1920 700">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="1920" height="700" fill="url(#g)"/>
  <circle cx="1650" cy="140" r="220" fill="rgba(255,255,255,.14)"/>
  <circle cx="1460" cy="560" r="250" fill="rgba(255,255,255,.09)"/>
  <rect x="120" y="150" width="980" height="400" rx="36" fill="rgba(0,0,0,.25)"/>
  <text x="180" y="310" fill="#fff" font-size="96" font-weight="900" font-family="Arial, Helvetica, sans-serif">${escapeXml(title)}</text>
  <text x="180" y="390" fill="rgba(255,255,255,.86)" font-size="44" font-weight="500" font-family="Arial, Helvetica, sans-serif">${escapeXml(subtitle)}</text>
  <text x="180" y="470" fill="rgba(255,255,255,.72)" font-size="30" font-weight="500" font-family="Arial, Helvetica, sans-serif">Plus-Sport staging demo</text>
</svg>`
}

function buildProductSvg(brand, productName, colors) {
  const [c1, c2] = colors
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="1200" fill="url(#g)"/>
  <ellipse cx="600" cy="900" rx="330" ry="70" fill="rgba(0,0,0,.25)"/>
  <path d="M250 710 C380 550 560 500 760 560 C840 580 920 640 980 720 L940 810 C900 790 850 790 790 820 C680 875 550 895 430 870 C350 852 285 808 240 760 Z" fill="rgba(255,255,255,.93)"/>
  <path d="M360 730 C470 620 620 585 760 625 C700 635 620 690 560 740 C500 790 440 820 350 812 Z" fill="rgba(0,0,0,.17)"/>
  <text x="86" y="120" fill="rgba(255,255,255,.92)" font-size="62" font-weight="800" font-family="Arial, Helvetica, sans-serif">${escapeXml(brand.toUpperCase())}</text>
  <text x="86" y="1065" fill="#fff" font-size="50" font-weight="700" font-family="Arial, Helvetica, sans-serif">${escapeXml(productName)}</text>
</svg>`
}

async function upsertMedia(client, { filename, alt, width, height }) {
  const filePath = path.join(MEDIA_DIR, filename)
  const fileStats = fs.statSync(filePath)
  const url = `/media/${filename}`

  const query = `
    INSERT INTO media (
      alt, filename, url, mime_type, filesize, width, height, created_at, updated_at
    ) VALUES ($1, $2, $3, 'image/svg+xml', $4, $5, $6, now(), now())
    ON CONFLICT (filename) DO UPDATE
    SET alt = EXCLUDED.alt,
        url = EXCLUDED.url,
        mime_type = EXCLUDED.mime_type,
        filesize = EXCLUDED.filesize,
        width = EXCLUDED.width,
        height = EXCLUDED.height,
        updated_at = now()
    RETURNING id
  `

  const result = await client.query(query, [alt, filename, url, fileStats.size, width, height])
  return result.rows[0].id
}

async function upsertBrand(client, def, logoId) {
  const updated = await client.query(
    `UPDATE marcas
     SET nombre = $1, logo_id = $2, activa = true, updated_at = now()
     WHERE slug = $3
     RETURNING id`,
    [def.nombre, logoId, def.slug],
  )
  if (updated.rowCount > 0) return updated.rows[0].id

  const inserted = await client.query(
    `INSERT INTO marcas (nombre, slug, logo_id, activa, created_at, updated_at)
     VALUES ($1, $2, $3, true, now(), now())
     RETURNING id`,
    [def.nombre, def.slug, logoId],
  )
  return inserted.rows[0].id
}

async function upsertCategory(client, def, imagenId) {
  const updated = await client.query(
    `UPDATE categorias
     SET nombre = $1,
         descripcion = $2,
         imagen_id = $3,
         icono = $4,
         orden = $5,
         activa = true,
         updated_at = now()
     WHERE slug = $6
     RETURNING id`,
    [def.nombre, def.descripcion, imagenId, def.icono, def.orden, def.slug],
  )
  if (updated.rowCount > 0) return updated.rows[0].id

  const inserted = await client.query(
    `INSERT INTO categorias (nombre, slug, descripcion, imagen_id, icono, orden, activa, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, true, now(), now())
     RETURNING id`,
    [def.nombre, def.slug, def.descripcion, imagenId, def.icono, def.orden],
  )
  return inserted.rows[0].id
}

async function upsertBannerByOrder(client, def, imagenId) {
  const existing = await client.query(
    `SELECT id
     FROM banners
     WHERE orden = $1
     ORDER BY id
     LIMIT 1`,
    [def.orden],
  )

  if (existing.rowCount > 0) {
    await client.query(
      `UPDATE banners
       SET titulo = $1,
           subtitulo = $2,
           descripcion = $3,
           imagen_id = $4,
           color_fondo = $5,
           text_boton1 = $6,
           url_boton1 = $7,
           text_boton2 = $8,
           url_boton2 = $9,
           activo = true,
           updated_at = now()
       WHERE id = $10`,
      [
        def.titulo,
        def.subtitulo,
        def.descripcion,
        imagenId,
        def.colorFondo,
        def.btn1,
        def.url1,
        def.btn2,
        def.url2,
        existing.rows[0].id,
      ],
    )
    return existing.rows[0].id
  }

  const inserted = await client.query(
    `INSERT INTO banners (
      titulo, subtitulo, descripcion, imagen_id, color_fondo, text_boton1, url_boton1, text_boton2, url_boton2,
      orden, activo, created_at, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true,now(),now())
    RETURNING id`,
    [
      def.titulo,
      def.subtitulo,
      def.descripcion,
      imagenId,
      def.colorFondo,
      def.btn1,
      def.url1,
      def.btn2,
      def.url2,
      def.orden,
    ],
  )
  return inserted.rows[0].id
}

async function upsertProduct(client, def, categoryId, brandId, imageId) {
  const updated = await client.query(
    `UPDATE productos
     SET nombre = $1,
         sku = $2,
         precio = $3,
         precio_anterior = $4,
         categoria_id = $5,
         marca_id = $6,
         segmento = $7,
         imagen_principal_id = $8,
         stock = $9,
         etiqueta = $10,
         destacado = $11,
         nuevo_ingreso = $12,
         activo = true,
         updated_at = now()
     WHERE slug = $13
     RETURNING id`,
    [
      def.nombre,
      def.sku,
      def.precio,
      def.precioAnterior,
      categoryId,
      brandId,
      def.segmento,
      imageId,
      def.stock,
      def.etiqueta,
      def.destacado,
      def.nuevoIngreso,
      def.slug,
    ],
  )

  let productId
  if (updated.rowCount > 0) {
    productId = updated.rows[0].id
  } else {
    const inserted = await client.query(
      `INSERT INTO productos (
        nombre, slug, sku, precio, precio_anterior, categoria_id, marca_id, segmento, imagen_principal_id,
        stock, etiqueta, destacado, nuevo_ingreso, activo, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,true,now(),now())
      RETURNING id`,
      [
        def.nombre,
        def.slug,
        def.sku,
        def.precio,
        def.precioAnterior,
        categoryId,
        brandId,
        def.segmento,
        imageId,
        def.stock,
        def.etiqueta,
        def.destacado,
        def.nuevoIngreso,
      ],
    )
    productId = inserted.rows[0].id
  }

  await client.query('DELETE FROM productos_tallas WHERE _parent_id = $1', [productId])
  for (let i = 0; i < def.tallas.length; i += 1) {
    const talla = def.tallas[i]
    const sizeStock = Math.max(1, Math.round(def.stock / def.tallas.length + (i % 2)))
    await client.query(
      `INSERT INTO productos_tallas (_order, _parent_id, id, talla, stock)
       VALUES ($1, $2, $3, $4, $5)`,
      [i + 1, productId, `${def.slug}-${talla}`, talla, sizeStock],
    )
  }
}

async function applyGlobalConfig(client, logoId) {
  const configRes = await client.query(
    `SELECT id
     FROM config_tienda
     ORDER BY id
     LIMIT 1`,
  )

  if (configRes.rowCount === 0) return
  const configId = configRes.rows[0].id

  await client.query(
    `UPDATE config_tienda
     SET logo_id = $1,
         tagline = $2,
         header_anuncio_barra = $3,
         footer_descripcion = $4,
         updated_at = now()
     WHERE id = $5`,
    [
      logoId,
      'Sneakers & Sportwear Curado para Venta Online',
      'ENVIO EXPRESS + CAMBIOS FACILES + OFERTAS ACTIVAS EN SNEAKERS',
      'Demo comercial de PlusSport con catalogo curado para revision de cliente.',
      configId,
    ],
  )

  await client.query('DELETE FROM config_tienda_header_menu_principal WHERE _parent_id = $1', [configId])
  for (let i = 0; i < HOME_MENU.length; i += 1) {
    const item = HOME_MENU[i]
    await client.query(
      `INSERT INTO config_tienda_header_menu_principal (_order, _parent_id, id, etiqueta, url, es_destacado)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [i + 1, configId, item.id, item.etiqueta, item.url, item.destacado],
    )
  }

  await client.query('DELETE FROM config_tienda_home_secciones WHERE _parent_id = $1', [configId])
  for (let i = 0; i < HOME_SECTIONS.length; i += 1) {
    const section = HOME_SECTIONS[i]
    await client.query(
      `INSERT INTO config_tienda_home_secciones (_order, _parent_id, id, key, orden, mostrar, titulo, subtitulo)
       VALUES ($1, $2, $3, $4, $5, true, $6, $7)`,
      [i + 1, configId, section.id, section.key, section.orden, section.titulo, section.subtitulo],
    )
  }
}

async function seedDemoContent() {
  const client = new Client({ connectionString: DATABASE_URI })
  await client.connect()

  try {
    await client.query('BEGIN')

    const mediaIds = new Map()
    const brandIds = new Map()
    const categoryIds = new Map()

    // Marca Plus-Sport para config global
    writeMediaSvg('plussport-wordmark.svg', buildLogoSvg('PlusSport', ['#0f172a', '#1d4ed8']))
    const plusSportLogoId = await upsertMedia(client, {
      filename: 'plussport-wordmark.svg',
      alt: 'Logo PlusSport',
      width: 720,
      height: 260,
    })

    // Logos de marcas
    for (const brand of BRAND_DEFS) {
      const filename = `brand-${brand.slug}-logo.svg`
      writeMediaSvg(filename, buildLogoSvg(brand.nombre, brand.colors))
      const mediaId = await upsertMedia(client, {
        filename,
        alt: `${brand.nombre} logo`,
        width: 720,
        height: 260,
      })
      mediaIds.set(filename, mediaId)
      const brandId = await upsertBrand(client, brand, mediaId)
      brandIds.set(brand.slug, brandId)
    }

    // Imagenes de categorias
    for (const category of CATEGORY_DEFS) {
      const filename = `category-${category.slug}.svg`
      writeMediaSvg(filename, buildCategorySvg(category.nombre, category.descripcion, category.colors))
      const mediaId = await upsertMedia(client, {
        filename,
        alt: `${category.nombre} categoria`,
        width: 1600,
        height: 1000,
      })
      mediaIds.set(filename, mediaId)
      const categoryId = await upsertCategory(client, category, mediaId)
      categoryIds.set(category.slug, categoryId)
    }

    // Banners home
    await client.query('UPDATE banners SET activo = false, updated_at = now()')
    for (const banner of BANNER_DEFS) {
      const filename = `banner-home-${banner.orden}.svg`
      writeMediaSvg(filename, buildBannerSvg(banner.titulo, banner.subtitulo, banner.colors))
      const mediaId = await upsertMedia(client, {
        filename,
        alt: banner.titulo,
        width: 1920,
        height: 700,
      })
      mediaIds.set(filename, mediaId)
      await upsertBannerByOrder(client, banner, mediaId)
    }

    // Productos + imagenes + tallas
    for (const product of PRODUCT_DEFS) {
      const brand = BRAND_DEFS.find((item) => item.slug === product.marca)
      const colors = brand ? brand.colors : ['#111827', '#1f2937']
      const filename = `product-${product.slug}.svg`
      writeMediaSvg(filename, buildProductSvg(product.marca, product.nombre, colors))
      const mediaId = await upsertMedia(client, {
        filename,
        alt: product.nombre,
        width: 1200,
        height: 1200,
      })

      const brandId = brandIds.get(product.marca)
      const categoryId = categoryIds.get(product.categoria)
      if (!brandId || !categoryId) {
        throw new Error(`Missing brand/category for product ${product.slug}`)
      }

      await upsertProduct(client, product, categoryId, brandId, mediaId)
    }

    await applyGlobalConfig(client, plusSportLogoId)

    await client.query('COMMIT')

    console.log('Demo content seeded successfully.')
    console.log(`- Productos demo activos: ${PRODUCT_DEFS.length}`)
    console.log(`- Categorias activas curadas: ${CATEGORY_DEFS.length}`)
    console.log(`- Marcas activas curadas: ${BRAND_DEFS.length}`)
    console.log(`- Banners activos: ${BANNER_DEFS.length}`)
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Failed to seed demo content:', error)
    process.exitCode = 1
  } finally {
    await client.end()
  }
}

seedDemoContent()

