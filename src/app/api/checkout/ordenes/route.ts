import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

type MetodoEntrega = 'delivery' | 'retiro_tienda'
type MetodoPago = 'yape' | 'plin' | 'interbank' | 'transferencia' | 'bcp' | 'tarjeta' | 'efectivo' | 'whatsapp'

type CheckoutItemInput = {
  productoId: string
  talla?: string
  cantidad: number
}

type CheckoutRequest = {
  cliente: string
  nombreCliente: string
  telefono: string
  items: CheckoutItemInput[]
  direccionEnvio: {
    calle: string
    distrito: string
    ciudad?: string
    referencias?: string
  }
  metodoEntrega: MetodoEntrega
  metodoPago: MetodoPago
  cuponCodigo?: string | null
  comprobante?: 'boleta' | 'factura'
}

type ProductoDoc = {
  id: string
  nombre?: string
  precio?: number
  activo?: boolean
  stock?: number
  tallas?: Array<{ talla?: string; stock?: number }>
}

type CuponDoc = {
  id: string
  codigo?: string
  tipo?: 'porcentaje' | 'monto' | 'envio_gratis'
  valor?: number
  activo?: boolean
  minimoCompra?: number
  usoMaximo?: number
  usosActuales?: number
  vencimiento?: string
}

const DELIVERY_FREE_MIN = 299
const DELIVERY_BASE_COST = 15
const VALID_PAYMENT_METHODS: MetodoPago[] = ['yape', 'plin', 'interbank', 'transferencia', 'bcp', 'tarjeta', 'efectivo', 'whatsapp']
const VALID_DELIVERY_METHODS: MetodoEntrega[] = ['delivery', 'retiro_tienda']

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function asNonEmptyString(value: unknown) {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function asIdString(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }
  return asNonEmptyString(value)
}

function toRelationshipValue(value: string) {
  return /^\d+$/.test(value) ? Number(value) : value
}

function toPositiveInt(value: unknown) {
  const num = typeof value === 'number' ? value : Number(value)
  if (!Number.isInteger(num) || num <= 0) return null
  return num
}

function roundMoney(value: number) {
  return Number(value.toFixed(2))
}

function normalizePaymentMethod(value: MetodoPago): Exclude<MetodoPago, 'bcp'> {
  return value === 'bcp' ? 'transferencia' : value
}

function computeBaseShipping(subtotal: number, metodoEntrega: MetodoEntrega) {
  if (metodoEntrega === 'retiro_tienda') return 0
  return subtotal >= DELIVERY_FREE_MIN ? 0 : DELIVERY_BASE_COST
}

async function parseCheckoutRequest(request: Request) {
  let rawBody: unknown

  try {
    rawBody = await request.json()
  } catch {
    return { ok: false as const, errors: ['Body JSON invalido.'] }
  }

  if (!isRecord(rawBody)) {
    return { ok: false as const, errors: ['El body debe ser un objeto JSON.'] }
  }

  const errors: string[] = []

  const cliente = asIdString(rawBody.cliente)
  const nombreCliente = asNonEmptyString(rawBody.nombreCliente)
  const telefono = asNonEmptyString(rawBody.telefono)
  const metodoPagoRaw = asNonEmptyString(rawBody.metodoPago) as MetodoPago | null
  const metodoEntregaRaw = asNonEmptyString(rawBody.metodoEntrega) as MetodoEntrega | null
  const cuponCodigo = rawBody.cuponCodigo === null || rawBody.cuponCodigo === undefined
    ? null
    : asNonEmptyString(rawBody.cuponCodigo)

  const direccion = rawBody.direccionEnvio
  const itemsRaw = rawBody.items

  if (!cliente) errors.push('cliente es requerido.')
  if (!nombreCliente) errors.push('nombreCliente es requerido.')
  if (!telefono) errors.push('telefono es requerido.')

  if (!metodoPagoRaw || !VALID_PAYMENT_METHODS.includes(metodoPagoRaw)) {
    errors.push('metodoPago no es valido.')
  }

  if (!metodoEntregaRaw || !VALID_DELIVERY_METHODS.includes(metodoEntregaRaw)) {
    errors.push('metodoEntrega no es valido.')
  }

  if (!isRecord(direccion)) {
    errors.push('direccionEnvio es requerida.')
  }

  const calle = isRecord(direccion) ? asNonEmptyString(direccion.calle) : null
  const distrito = isRecord(direccion) ? asNonEmptyString(direccion.distrito) : null
  const ciudad = isRecord(direccion) ? asNonEmptyString(direccion.ciudad) : null
  const referencias = isRecord(direccion) ? asNonEmptyString(direccion.referencias) : null

  if (!calle) errors.push('direccionEnvio.calle es requerida.')
  if (!distrito) errors.push('direccionEnvio.distrito es requerido.')

  if (!Array.isArray(itemsRaw) || itemsRaw.length === 0) {
    errors.push('items debe tener al menos un producto.')
  }

  const parsedItems: CheckoutItemInput[] = []

  if (Array.isArray(itemsRaw)) {
    for (let index = 0; index < itemsRaw.length; index += 1) {
      const row = itemsRaw[index]
      if (!isRecord(row)) {
        errors.push(`items[${index}] debe ser un objeto.`)
        continue
      }

      const productoId = asIdString(row.productoId)
      const cantidad = toPositiveInt(row.cantidad)
      const talla = asNonEmptyString(row.talla) ?? undefined

      if (!productoId) {
        errors.push(`items[${index}].productoId es requerido.`)
      }

      if (!cantidad) {
        errors.push(`items[${index}].cantidad debe ser entero positivo.`)
      }

      if (productoId && cantidad) {
        parsedItems.push({ productoId, cantidad, talla })
      }
    }
  }

  if (errors.length > 0 || !cliente || !nombreCliente || !telefono || !metodoPagoRaw || !metodoEntregaRaw || !calle || !distrito) {
    return { ok: false as const, errors }
  }

  const comprobante = rawBody.comprobante === 'factura' ? 'factura' : 'boleta'

  const parsed: CheckoutRequest = {
    cliente,
    nombreCliente,
    telefono,
    metodoPago: metodoPagoRaw,
    metodoEntrega: metodoEntregaRaw,
    items: parsedItems,
    cuponCodigo,
    comprobante,
    direccionEnvio: {
      calle,
      distrito,
      ciudad: ciudad ?? 'Lima',
      referencias: referencias ?? '',
    },
  }

  return { ok: true as const, data: parsed }
}

async function resolveCoupon(payload: any, cuponCodigo: string, subtotal: number, costoEnvio: number) {
  const codigo = cuponCodigo.toUpperCase()

  const found = await payload.find({
    collection: 'cupones',
    where: {
      and: [{ codigo: { equals: codigo } }, { activo: { equals: true } }],
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  const cupon = (found.docs[0] || null) as CuponDoc | null
  if (!cupon) {
    return { ok: false as const, error: 'Cupon no valido o inactivo.' }
  }

  if (cupon.vencimiento && new Date(cupon.vencimiento).getTime() < Date.now()) {
    return { ok: false as const, error: 'Cupon vencido.' }
  }

  if ((cupon.minimoCompra || 0) > subtotal) {
    return { ok: false as const, error: 'Cupon no cumple minimo de compra.' }
  }

  if ((cupon.usoMaximo || 0) > 0 && (cupon.usosActuales || 0) >= (cupon.usoMaximo || 0)) {
    return { ok: false as const, error: 'Cupon sin usos disponibles.' }
  }

  let descuento = 0
  let envioFinal = costoEnvio

  if (cupon.tipo === 'porcentaje') {
    descuento = Math.max(0, (subtotal * Number(cupon.valor || 0)) / 100)
  } else if (cupon.tipo === 'monto') {
    descuento = Math.max(0, Math.min(Number(cupon.valor || 0), subtotal))
  } else if (cupon.tipo === 'envio_gratis') {
    envioFinal = 0
  }

  return {
    ok: true as const,
    cupon,
    codigo,
    descuento: roundMoney(descuento),
    envioFinal: roundMoney(envioFinal),
  }
}

export async function POST(request: Request) {
  const parsed = await parseCheckoutRequest(request)

  if (!parsed.ok) {
    return NextResponse.json(
      { error: 'Validacion de checkout fallida.', details: parsed.errors },
      { status: 400 },
    )
  }

  try {
    const payload = await getPayload({ config })
    const reqData = parsed.data

    try {
      await payload.findByID({
        collection: 'clientes',
        id: reqData.cliente,
        depth: 0,
        overrideAccess: true,
      })
    } catch {
      return NextResponse.json({ error: 'Cliente no encontrado.' }, { status: 400 })
    }

    const computedItems: Array<{
      producto: string | number
      nombreProducto: string
      talla?: string
      cantidad: number
      precioUnitario: number
      subtotal: number
    }> = []

    let subtotal = 0

    for (const item of reqData.items) {
      let producto: ProductoDoc | null = null
      try {
        producto = (await payload.findByID({
          collection: 'productos',
          id: item.productoId,
          depth: 0,
          overrideAccess: true,
        })) as ProductoDoc
      } catch {
        return NextResponse.json(
          { error: `Producto no encontrado: ${item.productoId}` },
          { status: 400 },
        )
      }

      if (!producto || producto.activo === false) {
        return NextResponse.json(
          { error: `Producto no disponible: ${item.productoId}` },
          { status: 400 },
        )
      }

      const precioUnitario = Number(producto.precio || 0)
      if (precioUnitario < 0) {
        return NextResponse.json(
          { error: `Precio invalido para producto ${item.productoId}` },
          { status: 400 },
        )
      }

      const tallas = Array.isArray(producto.tallas) ? producto.tallas : []
      if (tallas.length > 0) {
        if (!item.talla) {
          return NextResponse.json(
            { error: `La talla es requerida para ${producto.nombre || item.productoId}` },
            { status: 400 },
          )
        }

        const tallaMatch = tallas.find(
          (t) => (t.talla || '').trim().toLowerCase() === item.talla!.trim().toLowerCase(),
        )

        if (!tallaMatch) {
          return NextResponse.json(
            { error: `La talla ${item.talla} no existe para ${producto.nombre || item.productoId}` },
            { status: 400 },
          )
        }

        if (Number(tallaMatch.stock || 0) < item.cantidad) {
          return NextResponse.json(
            { error: `Stock insuficiente para ${producto.nombre || item.productoId} talla ${item.talla}` },
            { status: 400 },
          )
        }
      } else if (Number(producto.stock || 0) < item.cantidad) {
        return NextResponse.json(
          { error: `Stock insuficiente para ${producto.nombre || item.productoId}` },
          { status: 400 },
        )
      }

      const lineSubtotal = roundMoney(precioUnitario * item.cantidad)
      subtotal = roundMoney(subtotal + lineSubtotal)

      computedItems.push({
        producto: toRelationshipValue(item.productoId),
        nombreProducto: producto.nombre || 'Producto',
        talla: item.talla,
        cantidad: item.cantidad,
        precioUnitario: roundMoney(precioUnitario),
        subtotal: lineSubtotal,
      })
    }

    const normalizedPaymentMethod = normalizePaymentMethod(reqData.metodoPago)
    let paymentMethodIsActive = true
    try {
      const storefrontConfig = await payload.findGlobal({
        slug: 'config-tienda',
        depth: 0,
        overrideAccess: true,
      })
      const metodos = Array.isArray((storefrontConfig as any)?.pagos?.metodos)
        ? (storefrontConfig as any).pagos.metodos
        : []

      if (metodos.length > 0) {
        paymentMethodIsActive = metodos.some(
          (m: any) => m?.activo && String(m?.codigo || '') === normalizedPaymentMethod,
        )
      }
    } catch {
      // If config lookup fails, keep compatibility and continue.
    }

    if (!paymentMethodIsActive) {
      return NextResponse.json(
        { error: `Metodo de pago no disponible: ${normalizedPaymentMethod}` },
        { status: 400 },
      )
    }

    const costoEnvioBase = computeBaseShipping(subtotal, reqData.metodoEntrega)

    let descuento = 0
    let costoEnvioFinal = costoEnvioBase
    let cuponId: string | undefined
    let cuponCodigoAplicado: string | undefined

    if (reqData.cuponCodigo) {
      const couponResult = await resolveCoupon(payload, reqData.cuponCodigo, subtotal, costoEnvioBase)
      if (!couponResult.ok) {
        return NextResponse.json({ error: couponResult.error }, { status: 400 })
      }

      cuponId = couponResult.cupon.id
      cuponCodigoAplicado = couponResult.codigo
      descuento = couponResult.descuento
      costoEnvioFinal = couponResult.envioFinal
    }

    const total = roundMoney(Math.max(0, subtotal - descuento) + costoEnvioFinal)
    const paymentProvider = normalizedPaymentMethod === 'tarjeta' ? 'izipay_sandbox' : 'manual'

    const orden = await payload.create({
      collection: 'ordenes',
      overrideAccess: true,
      data: {
        cliente: toRelationshipValue(reqData.cliente),
        nombreCliente: reqData.nombreCliente,
        telefono: reqData.telefono,
        metodoEntrega: reqData.metodoEntrega,
        items: computedItems,
        subtotal,
        descuento,
        costoEnvio: costoEnvioFinal,
        total,
        cupon: cuponId,
        direccionEnvio: reqData.direccionEnvio,
        metodoPago: normalizedPaymentMethod,
        estadoComercial: 'pendiente',
        estadoPago: 'pending',
        paymentProvider,
        paymentMethod: normalizedPaymentMethod,
        paymentSignatureValid: false,
        paymentPayload: {
          source: 'checkout-api',
          comprobante: reqData.comprobante || null,
          cuponCodigo: cuponCodigoAplicado || null,
          finalValidationPending: normalizedPaymentMethod === 'tarjeta',
        },
      },
    })

    return NextResponse.json(
      {
        success: true,
        order: {
          id: orden.id,
          numeroPedido: orden.numeroPedido,
          codigoCorrelacion: orden.codigoCorrelacion,
          estadoComercial: orden.estadoComercial,
          estadoPago: orden.estadoPago,
          subtotal: orden.subtotal,
          descuento: orden.descuento,
          costoEnvio: orden.costoEnvio,
          total: orden.total,
          paymentProvider: orden.paymentProvider,
          paymentMethod: orden.paymentMethod,
        },
        doc: orden,
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('Error creando orden:', error)
    return NextResponse.json(
      { error: 'Error creando orden', details: (error as Error).message },
      { status: 500 },
    )
  }
}
