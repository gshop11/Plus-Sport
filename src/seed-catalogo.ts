/**
 * seed-catalogo.ts
 * Carga todos los productos JOMA y ESCOLAR desde las carpetas de imágenes.
 * Uso: npx tsx src/seed-catalogo.ts
 */
import { getPayload } from 'payload'
import config from './payload.config'
import fs from 'fs'
import path from 'path'

const BASE = process.cwd()
const JOMA_BASE = path.join(BASE, 'JOMA')
const ESCOLAR_BASE = path.join(BASE, 'ESCOLAR')

type Talla = { talla: string; stock: number }
type Segmento = 'hombre' | 'mujer' | 'ninos' | 'unisex'
type Etiqueta = '' | 'nuevo' | 'hot' | 'top' | 'oferta'

function mkTallas(range: string[]): Talla[] {
  return range.map((t) => ({ talla: t, stock: 10 }))
}

// Rangos de tallas JOMA
const T_39_435 = mkTallas(['39', '40', '41', '42', '43', '43.5'])
const T_40_43  = mkTallas(['40', '41', '42', '43'])
const T_38_41  = mkTallas(['38', '39', '40', '41'])
const T_41     = mkTallas(['41'])
const T_31_38  = mkTallas(['31', '32', '33', '34', '35', '36', '37', '38'])
const T_34_39  = mkTallas(['34', '35', '36', '37', '38', '39'])
const T_34_36  = mkTallas(['34', '36'])

// Rangos de tallas ESCOLAR
const T_ESC_MINI = mkTallas(['26', '27', '28', '29', '30', '31'])
const T_ESC_NIN  = mkTallas(['28', '29', '30', '31', '32', '33', '34', '35'])
const T_ESC_UNI  = mkTallas(['36', '37', '38', '39', '40'])
const T_ESC_HOM  = mkTallas(['41', '42', '43', '44'])
const T_ESC_MUJ  = mkTallas(['35', '36', '37', '38', '39', '40'])
const T_ESC_FULL = mkTallas(['28', '29', '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40'])

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function seedCatalogo() {
  const payload = await getPayload({ config })

  // Verificar si ya se corrió
  const check = await payload.find({
    collection: 'marcas',
    where: { slug: { equals: 'joma' } },
    limit: 1,
  })
  if (check.docs.length > 0) {
    console.log('⚠️  El catálogo JOMA/ESCOLAR ya fue cargado.')
    console.log('   Para recargar: borra los productos JOMA/ESCOLAR desde el admin y la marca "joma".')
    return
  }

  console.log('🌱 Cargando catálogo JOMA + ESCOLAR...\n')

  // ─── Helpers ────────────────────────────────────────────────────────────────

  async function findOrCreateCategoria(nombre: string, slug: string, icono: string, orden: number) {
    const res = await payload.find({
      collection: 'categorias',
      where: { slug: { equals: slug } },
      limit: 1,
    })
    if (res.docs[0]) return res.docs[0]
    return payload.create({
      collection: 'categorias',
      data: { nombre, slug, icono, orden, activa: true },
    })
  }

  async function findOrCreateMarca(nombre: string, slug: string) {
    const res = await payload.find({
      collection: 'marcas',
      where: { slug: { equals: slug } },
      limit: 1,
    })
    if (res.docs[0]) return res.docs[0]
    return payload.create({
      collection: 'marcas',
      data: { nombre, slug, activa: true },
    })
  }

  async function uploadImage(filePath: string, alt: string): Promise<number> {
    if (!fs.existsSync(filePath)) {
      console.warn(`  ⚠ Imagen no encontrada: ${filePath}`)
      return 0
    }
    const buffer = fs.readFileSync(filePath)
    const stat   = fs.statSync(filePath)
    const media  = await payload.create({
      collection: 'media',
      data: { alt },
      file: {
        data: buffer,
        mimetype: 'image/png',
        name: path.basename(filePath),
        size: stat.size,
      },
    })
    return media.id as number
  }

  async function crearProducto(opts: {
    nombre: string
    slug: string
    sku: string
    precio: number
    categoriaId: number | string
    marcaId: number | string
    segmento: Segmento
    tallas: Talla[]
    imagePath: string
    etiqueta?: Etiqueta
    destacado?: boolean
  }) {
    const imgId = await uploadImage(opts.imagePath, opts.nombre)
    const data: Record<string, unknown> = {
      nombre: opts.nombre,
      slug: opts.slug,
      sku: opts.sku,
      precio: opts.precio,
      categoria: opts.categoriaId,
      marca: opts.marcaId,
      segmento: opts.segmento,
      tallas: opts.tallas,
      etiqueta: opts.etiqueta ?? '',
      destacado: opts.destacado ?? false,
      nuevoIngreso: true,
      activo: true,
    }
    if (imgId) data.imagenPrincipal = imgId
    await payload.create({ collection: 'productos', data })
    console.log(`  ✓ ${opts.nombre} — S/${opts.precio}`)
  }

  // ─── 1. Categorías ──────────────────────────────────────────────────────────
  console.log('📂 Categorías...')
  const [escolar, futbol, tenis] = await Promise.all([
    findOrCreateCategoria('Escolar',  'escolar', '🎒', 7),
    findOrCreateCategoria('Fútbol',   'futbol',  '⚽', 2),
    findOrCreateCategoria('Tenis',    'tenis',   '🎾', 5),
  ])
  console.log('✓ Categorías listas\n')

  // ─── 2. Marcas ──────────────────────────────────────────────────────────────
  console.log('🏷️  Marcas...')
  const [joma, adidas, puma, skechers, convers, kangaroos, tigre, russ] = await Promise.all([
    findOrCreateMarca('Joma',      'joma'),
    findOrCreateMarca('Adidas',    'adidas'),
    findOrCreateMarca('Puma',      'puma'),
    findOrCreateMarca('Skechers',  'skechers'),
    findOrCreateMarca('Convers',   'convers'),
    findOrCreateMarca('KangaROOS', 'kangaroos'),
    findOrCreateMarca('Tigre',     'tigre'),
    findOrCreateMarca('Russ',      'russ'),
  ])
  console.log('✓ Marcas listas\n')

  // ─── 3. Productos ESCOLAR ────────────────────────────────────────────────────
  console.log('🎒 Cargando ESCOLAR (23 productos)...')

  type EscolarDef = {
    file: string
    nombre: string
    sku: string
    precio: number
    marca: { id: number | string }
    segmento: Segmento
    tallas: Talla[]
    etiqueta?: Etiqueta
    destacado?: boolean
  }

  const escolarDefs: EscolarDef[] = [
    // Convers
    { file: '1077BB - 85.png',    nombre: 'Convers Clásica Escolar Blanca Niño',   sku: '1077BB-N',   precio: 85,  marca: convers,    segmento: 'ninos',   tallas: T_ESC_NIN },
    { file: '1077BB - 100.png',   nombre: 'Convers Clásica Escolar Blanca',         sku: '1077BB',     precio: 100, marca: convers,    segmento: 'unisex',  tallas: T_ESC_UNI, etiqueta: 'top' },
    { file: '1077BB - 120.png',   nombre: 'Convers Clásica Escolar Blanca Adulto',  sku: '1077BB-H',   precio: 120, marca: convers,    segmento: 'hombre',  tallas: T_ESC_HOM },
    // KangaROOS
    { file: '1109BB - 89.png',    nombre: 'KangaROOS Velcro Escolar Blanca Niño',   sku: '1109BB-S',   precio: 89,  marca: kangaroos,  segmento: 'ninos',   tallas: T_ESC_MINI },
    { file: '1109BB - 105.png',   nombre: 'KangaROOS Velcro Escolar Blanca',        sku: '1109BB',     precio: 105, marca: kangaroos,  segmento: 'ninos',   tallas: T_ESC_NIN },
    // Russ
    { file: '126BB - 85.png',     nombre: 'Russ Running Escolar Blanca Niño',       sku: '126BB-N',    precio: 85,  marca: russ,       segmento: 'ninos',   tallas: T_ESC_NIN },
    { file: '126BB - 100.png',    nombre: 'Russ Running Escolar Blanca',            sku: '126BB',      precio: 100, marca: russ,       segmento: 'unisex',  tallas: T_ESC_UNI },
    { file: '126BB - 120.png',    nombre: 'Russ Running Escolar Blanca Adulto',     sku: '126BB-H',    precio: 120, marca: russ,       segmento: 'hombre',  tallas: T_ESC_HOM },
    // Puma
    { file: '193623-01 - 129.png',nombre: 'Puma Fun Racer Velcro Blanca',          sku: '193623-01',  precio: 129, marca: puma,       segmento: 'ninos',   tallas: T_ESC_NIN, etiqueta: 'nuevo' },
    { file: '193623-02 - 129.png',nombre: 'Puma Fun Racer Velcro Negra',           sku: '193623-02',  precio: 129, marca: puma,       segmento: 'ninos',   tallas: T_ESC_NIN, etiqueta: 'nuevo' },
    { file: '394252-08 - 139.png',nombre: 'Puma Smash Escolar Blanca',             sku: '394252-08',  precio: 139, marca: puma,       segmento: 'unisex',  tallas: T_ESC_UNI, etiqueta: 'hot', destacado: true },
    { file: '394252-11 - 139.png',nombre: 'Puma Smash Escolar Negra',              sku: '394252-11',  precio: 139, marca: puma,       segmento: 'unisex',  tallas: T_ESC_UNI },
    // Skechers
    { file: '302630L-WHT - 129.png', nombre: 'Skechers Sport Escolar Blanca',      sku: '302630L-WHT',precio: 129, marca: skechers,   segmento: 'mujer',   tallas: T_ESC_MUJ },
    // Adidas
    { file: 'GW1987 - 129.png',   nombre: 'Adidas Tensaur Velcro Blanca',          sku: 'GW1987',     precio: 129, marca: adidas,     segmento: 'ninos',   tallas: T_ESC_NIN },
    { file: 'GW6422 - 129.png',   nombre: 'Adidas Tensaur Sport Blanca/Negra',     sku: 'GW6422',     precio: 129, marca: adidas,     segmento: 'ninos',   tallas: T_ESC_NIN },
    { file: 'GW6423 - 129.png',   nombre: 'Adidas Tensaur Sport Blanca',           sku: 'GW6423',     precio: 129, marca: adidas,     segmento: 'ninos',   tallas: T_ESC_NIN },
    { file: 'GW6440 - 129.png',   nombre: 'Adidas Tensaur Velcro Negro',           sku: 'GW6440',     precio: 129, marca: adidas,     segmento: 'ninos',   tallas: T_ESC_MINI },
    { file: 'IE8688 - 139.png',   nombre: 'Adidas Advantage Blanca',               sku: 'IE8688',     precio: 139, marca: adidas,     segmento: 'mujer',   tallas: T_ESC_MUJ, etiqueta: 'top', destacado: true },
    { file: 'IE9020 - 129.png',   nombre: 'Adidas Advantage Velcro Blanca',        sku: 'IE9020',     precio: 129, marca: adidas,     segmento: 'ninos',   tallas: T_ESC_MINI },
    // Tigre
    { file: 'TI55916270 - 30.png',nombre: 'Tigre Lona Clásica Blanca',             sku: 'TI55916270', precio: 30,  marca: tigre,      segmento: 'unisex',  tallas: T_ESC_FULL },
    { file: 'TI5591796 - 30.png', nombre: 'Tigre Lona Plus Blanca',                sku: 'TI5591796',  precio: 30,  marca: tigre,      segmento: 'unisex',  tallas: T_ESC_FULL },
    { file: 'TI88916100 - 45.png',nombre: 'Tigre Canvas Escolar Blanca Niño',      sku: 'TI88916100-N',precio: 45, marca: tigre,     segmento: 'ninos',   tallas: T_ESC_NIN },
    { file: 'TI88916100 - 49.png',nombre: 'Tigre Canvas Escolar Blanca',           sku: 'TI88916100', precio: 49,  marca: tigre,      segmento: 'unisex',  tallas: T_ESC_UNI },
  ]

  for (const p of escolarDefs) {
    await crearProducto({
      nombre:      p.nombre,
      slug:        toSlug(p.sku + '-' + p.precio),
      sku:         p.sku,
      precio:      p.precio,
      categoriaId: escolar.id as number,
      marcaId:     p.marca.id as number,
      segmento:    p.segmento,
      tallas:      p.tallas,
      imagePath:   path.join(ESCOLAR_BASE, p.file),
      etiqueta:    p.etiqueta,
      destacado:   p.destacado,
    })
  }
  console.log(`✓ ${escolarDefs.length} productos ESCOLAR cargados\n`)

  // ─── 4. Productos JOMA ───────────────────────────────────────────────────────
  console.log('⚽ Cargando JOMA (55 productos)...')

  type JomaDef = {
    file: string
    carpeta: string
    nombre: string
    sku: string
    precio: number
    segmento: Segmento
    tallas: Talla[]
    categoriaId: number
    etiqueta?: Etiqueta
    destacado?: boolean
  }

  const jomaDefs: JomaDef[] = [
    // ── Adultos / Tallas 39-43.5 ──────────────────────────────────────────────
    { file: '2303TF - S.149.png',      carpeta: 'Adultos/Tallas 39-43.5', nombre: 'Joma Maxima 2303 TF',                    sku: '2303TF',      precio: 149, segmento: 'hombre', tallas: T_39_435, categoriaId: futbol.id as number },
    { file: '2321TF - S.139.png',      carpeta: 'Adultos/Tallas 39-43.5', nombre: 'Joma Toledo 2321 TF',                    sku: '2321TF',      precio: 139, segmento: 'hombre', tallas: T_39_435, categoriaId: futbol.id as number },
    { file: '2501TF - S.139.png',      carpeta: 'Adultos/Tallas 39-43.5', nombre: 'Joma Toledo 2501 TF',                    sku: '2501TF',      precio: 139, segmento: 'hombre', tallas: T_39_435, categoriaId: futbol.id as number, etiqueta: 'nuevo' },
    { file: '2501TF - S.149.png',      carpeta: 'Adultos/Tallas 39-43.5', nombre: 'Joma Toledo 2501 TF Premium',             sku: '2501TF-P',    precio: 149, segmento: 'hombre', tallas: T_39_435, categoriaId: futbol.id as number, etiqueta: 'nuevo' },
    { file: '2502TF - S.139.png',      carpeta: 'Adultos/Tallas 39-43.5', nombre: 'Joma Toledo 2502 TF',                    sku: '2502TF',      precio: 139, segmento: 'hombre', tallas: T_39_435, categoriaId: futbol.id as number },
    { file: '2503TF - S.139.png',      carpeta: 'Adultos/Tallas 39-43.5', nombre: 'Joma Toledo 2503 TF',                    sku: '2503TF',      precio: 139, segmento: 'hombre', tallas: T_39_435, categoriaId: futbol.id as number },
    { file: '2508TF - S.149.png',      carpeta: 'Adultos/Tallas 39-43.5', nombre: 'Joma Maxima 2508 TF',                    sku: '2508TF',      precio: 149, segmento: 'hombre', tallas: T_39_435, categoriaId: futbol.id as number },
    { file: '2509IN - S.159.png',      carpeta: 'Adultos/Tallas 39-43.5', nombre: 'Joma Indoor 2509 Sala',                  sku: '2509IN',      precio: 159, segmento: 'hombre', tallas: T_39_435, categoriaId: futbol.id as number, etiqueta: 'hot' },
    { file: '2509TF - S.149.png',      carpeta: 'Adultos/Tallas 39-43.5', nombre: 'Joma Toledo 2509 TF',                    sku: '2509TF',      precio: 149, segmento: 'hombre', tallas: T_39_435, categoriaId: futbol.id as number },
    { file: '2520IN - S.149.png',      carpeta: 'Adultos/Tallas 39-43.5', nombre: 'Joma Indoor 2520 Sala',                  sku: '2520IN',      precio: 149, segmento: 'hombre', tallas: T_39_435, categoriaId: futbol.id as number },
    { file: '2535TF - S.169.png',      carpeta: 'Adultos/Tallas 39-43.5', nombre: 'Joma Maxima 2535 TF',                    sku: '2535TF',      precio: 169, segmento: 'hombre', tallas: T_39_435, categoriaId: futbol.id as number, etiqueta: 'top' },
    { file: 'AGU2504 - S.139.png',     carpeta: 'Adultos/Tallas 39-43.5', nombre: 'Joma Águila 2504 TF',                    sku: 'AGU2504',     precio: 139, segmento: 'hombre', tallas: T_39_435, categoriaId: futbol.id as number },
    { file: 'AGUS2504TF - S.139.png',  carpeta: 'Adultos/Tallas 39-43.5', nombre: 'Joma Águila Senior 2504 TF',             sku: 'AGUS2504TF',  precio: 139, segmento: 'hombre', tallas: T_39_435, categoriaId: futbol.id as number },
    { file: 'CANW2502IN - S.159.png',  carpeta: 'Adultos/Tallas 39-43.5', nombre: 'Joma Cantera Women 2502 Indoor',         sku: 'CANW2502IN',  precio: 159, segmento: 'mujer',  tallas: T_39_435, categoriaId: futbol.id as number },
    { file: 'CANW2505T - S.159.png',   carpeta: 'Adultos/Tallas 39-43.5', nombre: 'Joma Cantera Women 2505 TF',             sku: 'CANW2505T',   precio: 159, segmento: 'mujer',  tallas: T_39_435, categoriaId: futbol.id as number },
    { file: 'DRI2501TF - S.159.png',   carpeta: 'Adultos/Tallas 39-43.5', nombre: 'Joma Dribbling 2501 TF',                 sku: 'DRI2501TF',   precio: 159, segmento: 'hombre', tallas: T_39_435, categoriaId: futbol.id as number, etiqueta: 'hot', destacado: true },
    { file: 'DRIW2501TF - S.159.png',  carpeta: 'Adultos/Tallas 39-43.5', nombre: 'Joma Dribbling Women 2501 TF',           sku: 'DRIW2501TF',  precio: 159, segmento: 'mujer',  tallas: T_39_435, categoriaId: futbol.id as number },
    { file: 'DRIW2502TF - S.159.png',  carpeta: 'Adultos/Tallas 39-43.5', nombre: 'Joma Dribbling Women 2502 TF',           sku: 'DRIW2502TF',  precio: 159, segmento: 'mujer',  tallas: T_39_435, categoriaId: futbol.id as number },
    { file: 'DRIW2503TF - S.159.png',  carpeta: 'Adultos/Tallas 39-43.5', nombre: 'Joma Dribbling Women 2503 TF',           sku: 'DRIW2503TF',  precio: 159, segmento: 'mujer',  tallas: T_39_435, categoriaId: futbol.id as number },
    { file: 'DRIW2510IN - S.159.png',  carpeta: 'Adultos/Tallas 39-43.5', nombre: 'Joma Dribbling Women 2510 Indoor',       sku: 'DRIW2510IN',  precio: 159, segmento: 'mujer',  tallas: T_39_435, categoriaId: futbol.id as number },
    { file: 'DRIW2527IN - S.159.png',  carpeta: 'Adultos/Tallas 39-43.5', nombre: 'Joma Dribbling Women 2527 Indoor',       sku: 'DRIW2527IN',  precio: 159, segmento: 'mujer',  tallas: T_39_435, categoriaId: futbol.id as number },
    { file: 'FS2501IN - S.290.png',    carpeta: 'Adultos/Tallas 39-43.5', nombre: 'Joma Flash 2501 Indoor',                 sku: 'FS2501IN',    precio: 290, segmento: 'hombre', tallas: T_39_435, categoriaId: futbol.id as number, etiqueta: 'top', destacado: true },
    { file: 'GAMW2501IN - S.229.png',  carpeta: 'Adultos/Tallas 39-43.5', nombre: 'Joma Game Women 2501 Indoor',            sku: 'GAMW2501IN',  precio: 229, segmento: 'mujer',  tallas: T_39_435, categoriaId: futbol.id as number },
    { file: 'GAMW2523IN - S.229.png',  carpeta: 'Adultos/Tallas 39-43.5', nombre: 'Joma Game Women 2523 Indoor',            sku: 'GAMW2523IN',  precio: 229, segmento: 'mujer',  tallas: T_39_435, categoriaId: futbol.id as number },
    { file: 'MAXS2502TF - S.149.png',  carpeta: 'Adultos/Tallas 39-43.5', nombre: 'Joma Maxima Senior 2502 TF',             sku: 'MAXS2502TF',  precio: 149, segmento: 'hombre', tallas: T_39_435, categoriaId: futbol.id as number },
    { file: 'MAXS2527TF - S.149.png',  carpeta: 'Adultos/Tallas 39-43.5', nombre: 'Joma Maxima Senior 2527 TF',             sku: 'MAXS2527TF',  precio: 149, segmento: 'hombre', tallas: T_39_435, categoriaId: futbol.id as number },
    { file: 'MAXW2409TF - S.149.png',  carpeta: 'Adultos/Tallas 39-43.5', nombre: 'Joma Maxima Women 2409 TF',              sku: 'MAXW2409TF',  precio: 149, segmento: 'mujer',  tallas: T_39_435, categoriaId: futbol.id as number },
    { file: 'MAXW2511TF - S.149.png',  carpeta: 'Adultos/Tallas 39-43.5', nombre: 'Joma Maxima Women 2511 TF',              sku: 'MAXW2511TF',  precio: 149, segmento: 'mujer',  tallas: T_39_435, categoriaId: futbol.id as number },
    { file: 'MUNW2503TF - S.199.png',  carpeta: 'Adultos/Tallas 39-43.5', nombre: 'Joma Mundial Women 2503 TF',             sku: 'MUNW2503TF',  precio: 199, segmento: 'mujer',  tallas: T_39_435, categoriaId: futbol.id as number },
    { file: 'MUNW2504TF - S.199.png',  carpeta: 'Adultos/Tallas 39-43.5', nombre: 'Joma Mundial Women 2504 TF',             sku: 'MUNW2504TF',  precio: 199, segmento: 'mujer',  tallas: T_39_435, categoriaId: futbol.id as number },
    { file: 'TOPS2121IN - S.249.png',  carpeta: 'Adultos/Tallas 39-43.5', nombre: 'Joma Top Flex Senior Indoor',            sku: 'TOPS2121IN',  precio: 249, segmento: 'hombre', tallas: T_39_435, categoriaId: futbol.id as number, etiqueta: 'top' },
    { file: 'TOPW2576IN - S.249.png',  carpeta: 'Adultos/Tallas 39-43.5', nombre: 'Joma Top Flex Women Indoor',             sku: 'TOPW2576IN',  precio: 249, segmento: 'mujer',  tallas: T_39_435, categoriaId: futbol.id as number },
    { file: 'TORW2501IN - S.299.png',  carpeta: 'Adultos/Tallas 39-43.5', nombre: 'Joma Toledo Royal Women 2501 Indoor',    sku: 'TORW2501IN',  precio: 299, segmento: 'mujer',  tallas: T_39_435, categoriaId: futbol.id as number },
    { file: 'TORW2503TF - S.299.png',  carpeta: 'Adultos/Tallas 39-43.5', nombre: 'Joma Toledo Royal Women 2503 TF',        sku: 'TORW2503TF',  precio: 299, segmento: 'mujer',  tallas: T_39_435, categoriaId: futbol.id as number },
    { file: 'TORW2507IN - S.299.png',  carpeta: 'Adultos/Tallas 39-43.5', nombre: 'Joma Toledo Royal Women 2507 Indoor',    sku: 'TORW2507IN',  precio: 299, segmento: 'mujer',  tallas: T_39_435, categoriaId: futbol.id as number },
    { file: 'TORW2509IN - S.299.png',  carpeta: 'Adultos/Tallas 39-43.5', nombre: 'Joma Toledo Royal Women 2509 Indoor',    sku: 'TORW2509IN',  precio: 299, segmento: 'mujer',  tallas: T_39_435, categoriaId: futbol.id as number },
    { file: 'TORW2517IN - S.299.png',  carpeta: 'Adultos/Tallas 39-43.5', nombre: 'Joma Toledo Royal Women 2517 Indoor',    sku: 'TORW2517IN',  precio: 299, segmento: 'mujer',  tallas: T_39_435, categoriaId: futbol.id as number },
    { file: 'TORW2529TF - S.299.png',  carpeta: 'Adultos/Tallas 39-43.5', nombre: 'Joma Toledo Royal Women 2529 TF',        sku: 'TORW2529TF',  precio: 299, segmento: 'mujer',  tallas: T_39_435, categoriaId: futbol.id as number },
    { file: 'TOUW250IN - S.309.png',   carpeta: 'Adultos/Tallas 39-43.5', nombre: 'Joma Toulon Women 250 Indoor',           sku: 'TOUW250IN',   precio: 309, segmento: 'mujer',  tallas: T_39_435, categoriaId: futbol.id as number, etiqueta: 'top' },
    { file: 'TOUW2528IN - S.309.png',  carpeta: 'Adultos/Tallas 39-43.5', nombre: 'Joma Toulon Women 2528 Indoor',          sku: 'TOUW2528IN',  precio: 309, segmento: 'mujer',  tallas: T_39_435, categoriaId: futbol.id as number },

    // ── Adultos / Tallas 40-43 ────────────────────────────────────────────────
    { file: '2304TF - S.159.png',      carpeta: 'Adultos/Tallas 40-43',   nombre: 'Joma Toledo 2304 TF',                    sku: '2304TF',      precio: 159, segmento: 'hombre', tallas: T_40_43,  categoriaId: futbol.id as number },
    { file: '2503TF - S.159.png',      carpeta: 'Adultos/Tallas 40-43',   nombre: 'Joma Toledo 2503 TF Plus',               sku: '2503TF-40',   precio: 159, segmento: 'hombre', tallas: T_40_43,  categoriaId: futbol.id as number },
    { file: 'AGUS2507 - S.139.png',    carpeta: 'Adultos/Tallas 40-43',   nombre: 'Joma Águila Senior 2507',                sku: 'AGUS2507',    precio: 139, segmento: 'hombre', tallas: T_40_43,  categoriaId: futbol.id as number },

    // ── Adultos / Tallas 38-41 (mujer / padel) ────────────────────────────────
    { file: 'BSCRES2502IN - S.219.png',carpeta: 'Adultos/Tallas 38-41',   nombre: 'Joma Baseliner Indoor 2502',             sku: 'BSCRES2502IN',precio: 219, segmento: 'mujer',  tallas: T_38_41,  categoriaId: tenis.id as number,  etiqueta: 'top' },

    // ── Adultos / Talla 41 ────────────────────────────────────────────────────
    { file: 'MAX2433 - S.149.png',     carpeta: 'Adultos/Talla 41',       nombre: 'Joma Maxima 2433 TF',                    sku: 'MAX2433',     precio: 149, segmento: 'hombre', tallas: T_41,     categoriaId: futbol.id as number },

    // ── Niños / Tallas 31-38 ──────────────────────────────────────────────────
    { file: 'TOJ2501TF - S.119.png',   carpeta: 'Niños/Tallas 31-38',     nombre: 'Joma Toledo Junior 2501 TF',             sku: 'TOJ2501TF',   precio: 119, segmento: 'ninos',  tallas: T_31_38,  categoriaId: futbol.id as number, etiqueta: 'nuevo' },
    { file: 'TOJ2502TF - S.119.png',   carpeta: 'Niños/Tallas 31-38',     nombre: 'Joma Toledo Junior 2502 TF',             sku: 'TOJ2502TF',   precio: 119, segmento: 'ninos',  tallas: T_31_38,  categoriaId: futbol.id as number },
    { file: 'TOJ2505TF - S.119.png',   carpeta: 'Niños/Tallas 31-38',     nombre: 'Joma Toledo Junior 2505 TF',             sku: 'TOJ2505TF',   precio: 119, segmento: 'ninos',  tallas: T_31_38,  categoriaId: futbol.id as number },
    { file: 'TOJW2503 - S.119.png',    carpeta: 'Niños/Tallas 31-38',     nombre: 'Joma Toledo Junior Women 2503',          sku: 'TOJW2503',    precio: 119, segmento: 'ninos',  tallas: T_31_38,  categoriaId: futbol.id as number },
    { file: 'TOJW2504 - S.119.png',    carpeta: 'Niños/Tallas 31-38',     nombre: 'Joma Toledo Junior Women 2504',          sku: 'TOJW2504',    precio: 119, segmento: 'ninos',  tallas: T_31_38,  categoriaId: futbol.id as number },

    // ── Niños / Tallas 34-39 ──────────────────────────────────────────────────
    { file: 'EVJW2501TF - S.119.png',  carpeta: 'Niños/Tallas 34-39',     nombre: 'Joma Evolution Junior Women 2501 TF',    sku: 'EVJW2501TF',  precio: 119, segmento: 'ninos',  tallas: T_34_39,  categoriaId: futbol.id as number },
    { file: 'EVJW2503IN - S.119.png',  carpeta: 'Niños/Tallas 34-39',     nombre: 'Joma Evolution Junior Women 2503 Indoor',sku: 'EVJW2503IN',  precio: 119, segmento: 'ninos',  tallas: T_34_39,  categoriaId: futbol.id as number },
    { file: 'EVJW2503TF - S.119.png',  carpeta: 'Niños/Tallas 34-39',     nombre: 'Joma Evolution Junior Women 2503 TF',    sku: 'EVJW2503TF',  precio: 119, segmento: 'ninos',  tallas: T_34_39,  categoriaId: futbol.id as number },

    // ── Niños / Tallas 34 y 36 ────────────────────────────────────────────────
    { file: 'EVJW2532IN - S.119.png',  carpeta: 'Niños/Tallas 34 y 36',   nombre: 'Joma Evolution Junior Women 2532 Indoor',sku: 'EVJW2532IN',  precio: 119, segmento: 'ninos',  tallas: T_34_36,  categoriaId: futbol.id as number },
  ]

  for (const p of jomaDefs) {
    await crearProducto({
      nombre:      p.nombre,
      slug:        toSlug(p.sku),
      sku:         p.sku,
      precio:      p.precio,
      categoriaId: p.categoriaId,
      marcaId:     joma.id as number,
      segmento:    p.segmento,
      tallas:      p.tallas,
      imagePath:   path.join(JOMA_BASE, p.carpeta, p.file),
      etiqueta:    p.etiqueta,
      destacado:   p.destacado,
    })
  }
  console.log(`✓ ${jomaDefs.length} productos JOMA cargados\n`)

  const total = escolarDefs.length + jomaDefs.length
  console.log(`🎉 ¡Catálogo cargado! ${total} productos en total.`)
  console.log('   Abre http://localhost:3000 para ver la tienda.')
}

seedCatalogo()
  .catch((err) => {
    console.error('❌ Error en seed-catalogo:', err)
    process.exit(1)
  })
  .finally(() => process.exit(0))
