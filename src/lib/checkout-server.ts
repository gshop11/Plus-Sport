import 'server-only'
import type { Payload } from 'payload'
import { resolveMediaURL } from './media'
import { isVarianteComprable, resolvePrecioVariante } from './purchase'

// Reconstruccion y validacion del carrito en SERVIDOR.
// Nada de lo que envia el navegador (precios, stock, envio, totales) se usa
// como verdad: aqui se recalcula todo contra la base de datos.

export type CheckoutItemInput = {
  productoId: string
  talla?: string | null
  cantidad: number
}

export type ItemEstado = 'ok' | 'ajustado_stock' | 'sin_stock' | 'no_disponible'

export type ItemValidado = {
  productoId: number
  slug: string
  nombre: string
  marca: string
  sku: string | null
  skuVariante: string | null
  color: string | null
  talla: string | null
  cantidadSolicitada: number
  cantidad: number
  stockDisponible: number
  precioUnitario: number
  precioAnterior: number | null
  imagenUrl: string | null
  subtotal: number
  estado: ItemEstado
  motivo?: string
}

export type EnvioResultado =
  | { tipo: 'pendiente'; costo: null; etiqueta: string }
  | { tipo: 'tarifa'; costo: number; etiqueta: string; zona: string; tiempoEntrega: string | null }
  | { tipo: 'coordinar'; costo: null; etiqueta: string }
  | { tipo: 'retiro'; costo: 0; etiqueta: string; punto: PuntoRecojo }

export type PuntoRecojo = {
  nombre: string
  direccion: string
  horario: string | null
  instrucciones: string | null
}

export type CuponResultado = {
  ok: boolean
  id?: number
  codigo?: string
  tipo?: 'porcentaje' | 'monto' | 'envio_gratis'
  descuento: number
  envioGratis: boolean
  error?: string
}

export function roundMoney(value: number) {
  return Number(value.toFixed(2))
}

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase()

export async function validarItems(payload: Payload, items: CheckoutItemInput[]): Promise<ItemValidado[]> {
  const resultados: ItemValidado[] = []

  for (const input of items) {
    const cantidadSolicitada = Math.trunc(Number(input.cantidad))
    const productoIdNum = Number(input.productoId)
    const talla = input.talla ? String(input.talla).trim() : null

    const base: Omit<ItemValidado, 'estado'> = {
      productoId: Number.isFinite(productoIdNum) ? productoIdNum : 0,
      slug: '',
      nombre: '',
      marca: '',
      sku: null,
      skuVariante: null,
      color: null,
      talla,
      cantidadSolicitada,
      cantidad: 0,
      stockDisponible: 0,
      precioUnitario: 0,
      precioAnterior: null,
      imagenUrl: null,
      subtotal: 0,
    }

    if (!Number.isFinite(productoIdNum) || !Number.isInteger(cantidadSolicitada) || cantidadSolicitada <= 0) {
      resultados.push({ ...base, estado: 'no_disponible', motivo: 'Item invalido.' })
      continue
    }

    let doc: Record<string, unknown> | null = null
    try {
      doc = (await payload.findByID({
        collection: 'productos',
        id: productoIdNum,
        depth: 1,
        overrideAccess: true,
      })) as unknown as Record<string, unknown>
    } catch {
      doc = null
    }

    if (!doc || doc.activo === false || !doc.ventaOnline) {
      resultados.push({ ...base, estado: 'no_disponible', motivo: 'Producto no disponible para compra online.' })
      continue
    }

    const marca = typeof doc.marca === 'object' && doc.marca !== null ? String((doc.marca as Record<string, unknown>).nombre ?? '') : ''
    const tallasRaw = Array.isArray(doc.tallas) ? (doc.tallas as Record<string, unknown>[]) : []
    const precioProducto = Number(doc.precio || 0)

    base.slug = String(doc.slug ?? '')
    base.nombre = String(doc.nombre ?? '')
    base.marca = marca
    base.sku = doc.sku ? String(doc.sku) : null
    base.color = doc.color ? String(doc.color) : null
    base.imagenUrl = resolveMediaURL(doc.imagenPrincipal as Record<string, unknown> | null)

    if (tallasRaw.length > 0) {
      if (!talla) {
        resultados.push({ ...base, estado: 'no_disponible', motivo: 'Debes seleccionar una talla.' })
        continue
      }

      const varianteRaw = tallasRaw.find((t) => normalizeText(String(t.talla ?? '')) === normalizeText(talla))
      const variante = varianteRaw
        ? {
            talla: String(varianteRaw.talla ?? ''),
            stock: Number(varianteRaw.stock || 0),
            ventaHabilitada: Boolean(varianteRaw.ventaHabilitada),
            skuVariante: varianteRaw.skuVariante ? String(varianteRaw.skuVariante) : null,
            precio: Number.isFinite(Number(varianteRaw.precio)) ? Number(varianteRaw.precio) : null,
            imagenUrl: resolveMediaURL(varianteRaw.imagen as Record<string, unknown> | null),
          }
        : null

      if (!variante || !isVarianteComprable(variante)) {
        resultados.push({
          ...base,
          estado: variante && variante.stock <= 0 ? 'sin_stock' : 'no_disponible',
          motivo: variante ? 'Talla sin stock disponible.' : 'La talla seleccionada no esta disponible para venta online.',
        })
        continue
      }

      const cantidad = Math.min(cantidadSolicitada, variante.stock)
      const precioUnitario = roundMoney(resolvePrecioVariante(precioProducto, variante))

      resultados.push({
        ...base,
        talla: variante.talla,
        skuVariante: variante.skuVariante,
        imagenUrl: variante.imagenUrl ?? base.imagenUrl,
        cantidad,
        stockDisponible: variante.stock,
        precioUnitario,
        precioAnterior: Number(doc.precioAnterior) > 0 ? Number(doc.precioAnterior) : null,
        subtotal: roundMoney(precioUnitario * cantidad),
        estado: cantidad === cantidadSolicitada ? 'ok' : 'ajustado_stock',
        motivo: cantidad === cantidadSolicitada ? undefined : `Solo hay ${variante.stock} unidades disponibles.`,
      })
      continue
    }

    // Producto sin tallas: usa stock general.
    const stockGeneral = Number(doc.stock || 0)
    if (stockGeneral <= 0) {
      resultados.push({ ...base, estado: 'sin_stock', motivo: 'Producto sin stock disponible.' })
      continue
    }

    const cantidad = Math.min(cantidadSolicitada, stockGeneral)
    const precioUnitario = roundMoney(precioProducto)

    resultados.push({
      ...base,
      talla: null,
      cantidad,
      stockDisponible: stockGeneral,
      precioUnitario,
      precioAnterior: Number(doc.precioAnterior) > 0 ? Number(doc.precioAnterior) : null,
      subtotal: roundMoney(precioUnitario * cantidad),
      estado: cantidad === cantidadSolicitada ? 'ok' : 'ajustado_stock',
      motivo: cantidad === cantidadSolicitada ? undefined : `Solo hay ${stockGeneral} unidades disponibles.`,
    })
  }

  return resultados
}

export async function getPuntosRecojo(payload: Payload): Promise<PuntoRecojo[]> {
  try {
    const config = (await payload.findGlobal({ slug: 'config-tienda', depth: 0, overrideAccess: true })) as unknown as {
      entrega?: { puntosRecojo?: Array<Record<string, unknown>> }
    }
    const puntos = Array.isArray(config?.entrega?.puntosRecojo) ? config.entrega.puntosRecojo : []
    return puntos
      .filter((p) => p?.activo && String(p?.nombre ?? '').trim() && String(p?.direccion ?? '').trim())
      .map((p) => ({
        nombre: String(p.nombre),
        direccion: String(p.direccion),
        horario: p.horario ? String(p.horario) : null,
        instrucciones: p.instrucciones ? String(p.instrucciones) : null,
      }))
  } catch {
    return []
  }
}

export async function resolverEnvio(
  payload: Payload,
  opts: { metodoEntrega?: string | null; distrito?: string | null; subtotal: number },
): Promise<EnvioResultado> {
  if (opts.metodoEntrega === 'retiro_tienda') {
    const puntos = await getPuntosRecojo(payload)
    if (puntos.length === 0) {
      return { tipo: 'coordinar', costo: null, etiqueta: 'Recojo en tienda no disponible por ahora' }
    }
    return { tipo: 'retiro', costo: 0, etiqueta: `Recojo en tienda: ${puntos[0].nombre}`, punto: puntos[0] }
  }

  const distrito = opts.distrito ? normalizeText(String(opts.distrito)) : ''
  if (!distrito) {
    return { tipo: 'pendiente', costo: null, etiqueta: 'Se calcula segun tu distrito en el checkout' }
  }

  try {
    const zonas = await payload.find({
      collection: 'envios',
      where: { activo: { equals: true } },
      limit: 100,
      depth: 0,
      overrideAccess: true,
    })

    for (const zona of zonas.docs as unknown as Array<Record<string, unknown>>) {
      const distritos = Array.isArray(zona.distritos) ? (zona.distritos as Array<Record<string, unknown>>) : []
      const match = distritos.some((d) => normalizeText(String(d?.distrito ?? '')) === distrito)
      if (!match) continue

      const costoBase = Number(zona.costo)
      if (!Number.isFinite(costoBase) || costoBase < 0) continue

      const minimoGratis = Number(zona.minimoGratis || 0)
      const costo = minimoGratis > 0 && opts.subtotal >= minimoGratis ? 0 : roundMoney(costoBase)

      return {
        tipo: 'tarifa',
        costo,
        etiqueta: costo === 0 ? `Envio gratis (${String(zona.nombre ?? 'zona')})` : `Envio ${String(zona.nombre ?? '')}`.trim(),
        zona: String(zona.nombre ?? ''),
        tiempoEntrega: zona.tiempoEntrega ? String(zona.tiempoEntrega) : null,
      }
    }
  } catch {
    // Sin acceso a zonas: tratar como coordinar (nunca inventar tarifa).
  }

  return { tipo: 'coordinar', costo: null, etiqueta: 'Costo de entrega por coordinar' }
}

export async function resolverCupon(
  payload: Payload,
  codigoInput: string,
  subtotal: number,
): Promise<CuponResultado> {
  const codigo = codigoInput.trim().toUpperCase()
  if (!codigo) return { ok: false, descuento: 0, envioGratis: false, error: 'Cupon vacio.' }

  const found = await payload.find({
    collection: 'cupones',
    where: { and: [{ codigo: { equals: codigo } }, { activo: { equals: true } }] },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  const cupon = found.docs[0] as unknown as Record<string, unknown> | undefined
  if (!cupon) return { ok: false, descuento: 0, envioGratis: false, error: 'Cupon no valido o inactivo.' }

  if (cupon.vencimiento && new Date(String(cupon.vencimiento)).getTime() < Date.now()) {
    return { ok: false, descuento: 0, envioGratis: false, error: 'Cupon vencido.' }
  }

  if (Number(cupon.minimoCompra || 0) > subtotal) {
    return { ok: false, descuento: 0, envioGratis: false, error: 'Cupon no cumple minimo de compra.' }
  }

  const usoMaximo = Number(cupon.usoMaximo || 0)
  if (usoMaximo > 0 && Number(cupon.usosActuales || 0) >= usoMaximo) {
    return { ok: false, descuento: 0, envioGratis: false, error: 'Cupon sin usos disponibles.' }
  }

  const tipo = String(cupon.tipo) as 'porcentaje' | 'monto' | 'envio_gratis'
  let descuento = 0
  let envioGratis = false

  if (tipo === 'porcentaje') {
    descuento = Math.max(0, (subtotal * Number(cupon.valor || 0)) / 100)
  } else if (tipo === 'monto') {
    descuento = Math.max(0, Math.min(Number(cupon.valor || 0), subtotal))
  } else if (tipo === 'envio_gratis') {
    envioGratis = true
  }

  return {
    ok: true,
    id: Number(cupon.id),
    codigo,
    tipo,
    descuento: roundMoney(descuento),
    envioGratis,
  }
}

export type ResumenCheckout = {
  items: ItemValidado[]
  itemsValidos: ItemValidado[]
  subtotal: number
  cupon: (CuponResultado & { codigo: string }) | null
  cuponError: string | null
  descuento: number
  envio: EnvioResultado
  costoEnvio: number | null
  total: number | null
  moneda: string
}

export async function construirResumen(
  payload: Payload,
  opts: {
    items: CheckoutItemInput[]
    cuponCodigo?: string | null
    metodoEntrega?: string | null
    distrito?: string | null
  },
): Promise<ResumenCheckout> {
  const items = await validarItems(payload, opts.items)
  const itemsValidos = items.filter((item) => item.estado === 'ok' || item.estado === 'ajustado_stock')
  const subtotal = roundMoney(itemsValidos.reduce((acc, item) => acc + item.subtotal, 0))

  let cupon: (CuponResultado & { codigo: string }) | null = null
  let cuponError: string | null = null
  let descuento = 0

  if (opts.cuponCodigo && itemsValidos.length > 0) {
    const resultado = await resolverCupon(payload, opts.cuponCodigo, subtotal)
    if (resultado.ok && resultado.codigo) {
      cupon = { ...resultado, codigo: resultado.codigo }
      descuento = resultado.descuento
    } else {
      cuponError = resultado.error ?? 'Cupon no valido.'
    }
  }

  let envio = await resolverEnvio(payload, {
    metodoEntrega: opts.metodoEntrega,
    distrito: opts.distrito,
    subtotal,
  })

  if (cupon?.envioGratis && envio.tipo === 'tarifa') {
    envio = { ...envio, costo: 0, etiqueta: `Envio gratis por cupon (${cupon.codigo})` }
  }

  const costoEnvio = envio.tipo === 'tarifa' || envio.tipo === 'retiro' ? envio.costo : null
  const total = costoEnvio === null && itemsValidos.length > 0 && opts.metodoEntrega
    ? null
    : roundMoney(Math.max(0, subtotal - descuento) + (costoEnvio ?? 0))

  return {
    items,
    itemsValidos,
    subtotal,
    cupon,
    cuponError,
    descuento: roundMoney(descuento),
    envio,
    costoEnvio,
    total: itemsValidos.length === 0 ? 0 : total,
    moneda: 'PEN',
  }
}
