import { NextResponse } from 'next/server'
import { getPayload, type Payload } from 'payload'
import config from '@payload-config'
import { construirResumen, getPuntosRecojo, roundMoney, type CheckoutItemInput } from '@/lib/checkout-server'
import { decrementStock, StockInsuficienteError, type StockLineItem } from '@/lib/inventory'
import { ECOMMERCE_DISABLED_MESSAGE, getMetodosPagoActivos, isEcommerceEnabled, isMetodoPagoValido } from '@/lib/payment-methods'

// Creacion de pedidos:
// - Validacion completa en servidor (datos personales, direccion, metodo).
// - Recalculo total de precios/stock/envio/cupon contra la base de datos.
// - Idempotente: la misma idempotencyKey nunca crea dos pedidos.
// - Transaccional: descuento atomico de stock + creacion de la orden se
//   confirman o revierten juntos (sin sobreventa, sin ordenes fantasma).

type MetodoEntrega = 'delivery' | 'retiro_tienda'

type CheckoutRequest = {
  idempotencyKey: string
  datosPersonales: {
    nombres: string
    apellidos: string
    tipoDocumento: 'dni' | 'ce' | 'pasaporte' | 'ruc'
    numeroDocumento: string
    email: string
    celular: string
  }
  direccionEnvio: {
    departamento: string
    ciudad: string
    distrito: string
    calle: string
    referencias: string
  } | null
  metodoEntrega: MetodoEntrega
  metodoPago: string
  items: CheckoutItemInput[]
  cuponCodigo: string | null
  comprobante: 'boleta' | 'factura'
  aceptaTerminos: boolean
  aceptaPrivacidad: boolean
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function str(value: unknown, max = 200): string {
  if (typeof value !== 'string') return ''
  return value.trim().slice(0, max)
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const CELULAR_RE = /^9\d{8}$/
const NOMBRE_RE = /^[\p{L}\p{M}'´` .-]{2,80}$/u
const IDEMPOTENCY_RE = /^[A-Za-z0-9_-]{16,64}$/

function validarDocumento(tipo: string, numero: string): string | null {
  switch (tipo) {
    case 'dni':
      return /^\d{8}$/.test(numero) ? null : 'DNI invalido (8 digitos).'
    case 'ruc':
      return /^\d{11}$/.test(numero) ? null : 'RUC invalido (11 digitos).'
    case 'ce':
      return /^[A-Za-z0-9]{6,12}$/.test(numero) ? null : 'Carnet de extranjeria invalido.'
    case 'pasaporte':
      return /^[A-Za-z0-9]{6,15}$/.test(numero) ? null : 'Pasaporte invalido.'
    default:
      return 'Tipo de documento invalido.'
  }
}

function parseCheckoutRequest(rawBody: unknown): { ok: true; data: CheckoutRequest } | { ok: false; errors: string[] } {
  if (!isRecord(rawBody)) return { ok: false, errors: ['El body debe ser un objeto JSON.'] }

  const errors: string[] = []

  const idempotencyKey = str(rawBody.idempotencyKey, 64)
  if (!IDEMPOTENCY_RE.test(idempotencyKey)) errors.push('idempotencyKey invalida.')

  const dp = isRecord(rawBody.datosPersonales) ? rawBody.datosPersonales : {}
  const nombres = str(dp.nombres, 80)
  const apellidos = str(dp.apellidos, 80)
  const tipoDocumento = str(dp.tipoDocumento, 20) as CheckoutRequest['datosPersonales']['tipoDocumento']
  const numeroDocumento = str(dp.numeroDocumento, 15)
  const email = str(dp.email, 120).toLowerCase()
  const celular = str(dp.celular, 15).replace(/\s/g, '')

  if (!NOMBRE_RE.test(nombres)) errors.push('Nombres invalidos.')
  if (!NOMBRE_RE.test(apellidos)) errors.push('Apellidos invalidos.')
  if (!EMAIL_RE.test(email)) errors.push('Correo electronico invalido.')
  if (!CELULAR_RE.test(celular)) errors.push('Celular invalido (9 digitos, empieza en 9).')

  const docError = validarDocumento(tipoDocumento, numeroDocumento)
  if (docError) errors.push(docError)

  const metodoEntrega = rawBody.metodoEntrega === 'retiro_tienda' ? 'retiro_tienda' : rawBody.metodoEntrega === 'delivery' ? 'delivery' : null
  if (!metodoEntrega) errors.push('metodoEntrega invalido.')

  const metodoPago = str(rawBody.metodoPago, 30)
  if (!metodoPago) errors.push('metodoPago es requerido.')

  let direccionEnvio: CheckoutRequest['direccionEnvio'] = null
  if (metodoEntrega === 'delivery') {
    const dir = isRecord(rawBody.direccionEnvio) ? rawBody.direccionEnvio : {}
    const departamento = str(dir.departamento, 60)
    const ciudad = str(dir.ciudad, 60)
    const distrito = str(dir.distrito, 60)
    const calle = str(dir.calle, 160)
    const referencias = str(dir.referencias, 200)

    if (!departamento) errors.push('Departamento es requerido.')
    if (!ciudad) errors.push('Provincia/ciudad es requerida.')
    if (!distrito) errors.push('Distrito es requerido.')
    if (calle.length < 5) errors.push('Direccion demasiado corta.')

    direccionEnvio = { departamento, ciudad, distrito, calle, referencias }
  }

  const itemsRaw = Array.isArray(rawBody.items) ? rawBody.items : []
  if (itemsRaw.length === 0) errors.push('items debe tener al menos un producto.')
  if (itemsRaw.length > 50) errors.push('Demasiados items.')

  const items: CheckoutItemInput[] = itemsRaw.filter(isRecord).map((row) => ({
    productoId: str(row.productoId, 20),
    talla: row.talla ? str(row.talla, 30) : null,
    cantidad: Math.trunc(Number(row.cantidad)),
  }))

  const aceptaTerminos = rawBody.aceptaTerminos === true
  if (!aceptaTerminos) errors.push('Debes aceptar los terminos y condiciones.')

  if (errors.length > 0 || !metodoEntrega) return { ok: false, errors }

  return {
    ok: true,
    data: {
      idempotencyKey,
      datosPersonales: { nombres, apellidos, tipoDocumento, numeroDocumento, email, celular },
      direccionEnvio,
      metodoEntrega,
      metodoPago,
      items,
      cuponCodigo: rawBody.cuponCodigo ? str(rawBody.cuponCodigo, 30).toUpperCase() : null,
      comprobante: rawBody.comprobante === 'factura' ? 'factura' : 'boleta',
      aceptaTerminos,
      aceptaPrivacidad: rawBody.aceptaPrivacidad === true,
    },
  }
}

function toPublicOrder(orden: Record<string, unknown>) {
  return {
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
  }
}

async function findByIdempotencyKey(payload: Payload, key: string) {
  const found = await payload.find({
    collection: 'ordenes',
    where: { idempotencyKey: { equals: key } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  return (found.docs[0] as unknown as Record<string, unknown>) ?? null
}

async function findOrCreateCliente(payload: Payload, dp: CheckoutRequest['datosPersonales'], direccion: CheckoutRequest['direccionEnvio']) {
  const nombreCompleto = `${dp.nombres} ${dp.apellidos}`.trim()

  try {
    const existing = await payload.find({
      collection: 'clientes',
      where: {
        or: [{ documento: { equals: dp.numeroDocumento } }, { email: { equals: dp.email } }],
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    if (existing.docs[0]) return Number((existing.docs[0] as { id: number | string }).id)
  } catch {
    // continua a crear
  }

  const cliente = await payload.create({
    collection: 'clientes',
    overrideAccess: true,
    data: {
      nombre: nombreCompleto,
      email: dp.email,
      telefono: dp.celular,
      documento: dp.numeroDocumento,
      direccion: direccion
        ? { calle: direccion.calle, distrito: direccion.distrito, ciudad: direccion.ciudad, referencias: direccion.referencias }
        : undefined,
      totalCompras: 0,
      etiqueta: 'normal',
    },
  })
  return Number(cliente.id)
}

export async function POST(request: Request) {
  // Interruptor maestro: sin compra online no se crean pedidos (defensa de
  // servidor; el bloqueo no depende de ocultar botones en el cliente).
  if (!isEcommerceEnabled()) {
    return NextResponse.json(
      { error: ECOMMERCE_DISABLED_MESSAGE, code: 'ECOMMERCE_DISABLED' },
      { status: 403 },
    )
  }

  let rawBody: unknown
  try {
    rawBody = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body JSON invalido.' }, { status: 400 })
  }

  const parsed = parseCheckoutRequest(rawBody)
  if (parsed.ok === false) {
    return NextResponse.json({ error: 'Validacion de checkout fallida.', details: parsed.errors }, { status: 400 })
  }

  const reqData = parsed.data

  try {
    const payload = await getPayload({ config })

    // Idempotencia: misma clave => misma orden, sin efectos repetidos.
    const existente = await findByIdempotencyKey(payload, reqData.idempotencyKey)
    if (existente) {
      return NextResponse.json({ success: true, idempotent: true, order: toPublicOrder(existente) }, { status: 200 })
    }

    // Metodo de pago: solo los configurados y completos. 'tarjeta' ademas
    // exige el feature flag de Izipay.
    const metodosActivos = await getMetodosPagoActivos(payload)
    if (!isMetodoPagoValido(metodosActivos, reqData.metodoPago)) {
      return NextResponse.json({ error: `Metodo de pago no disponible: ${reqData.metodoPago}` }, { status: 400 })
    }

    // Recalculo completo del carrito en servidor.
    const resumen = await construirResumen(payload, {
      items: reqData.items,
      cuponCodigo: reqData.cuponCodigo,
      metodoEntrega: reqData.metodoEntrega,
      distrito: reqData.direccionEnvio?.distrito ?? null,
    })

    if (resumen.itemsValidos.length === 0) {
      return NextResponse.json({ error: 'Ningun producto del carrito esta disponible.' }, { status: 409 })
    }

    // Rechaza pedidos donde el servidor tuvo que ajustar cantidades o algun
    // item quedo sin stock: el cliente debe revisar el carrito actualizado.
    const requiereRevision = resumen.items.some((item) => item.estado !== 'ok')
    if (requiereRevision) {
      return NextResponse.json(
        { error: 'El carrito cambio (stock o disponibilidad). Revisa el resumen actualizado.', resumen },
        { status: 409 },
      )
    }

    // Envio: nunca cerrar un pedido con total indeterminado.
    if (reqData.metodoEntrega === 'delivery' && resumen.envio.tipo !== 'tarifa') {
      return NextResponse.json(
        {
          error: 'Tu distrito no tiene tarifa de envio configurada. Coordina la entrega por WhatsApp.',
          accion: 'coordinar_whatsapp',
        },
        { status: 422 },
      )
    }

    if (reqData.metodoEntrega === 'retiro_tienda' && resumen.envio.tipo !== 'retiro') {
      return NextResponse.json({ error: 'El recojo en tienda no esta disponible por ahora.' }, { status: 422 })
    }

    if (resumen.total === null) {
      return NextResponse.json({ error: 'No se pudo determinar el total del pedido.' }, { status: 422 })
    }

    const clienteId = await findOrCreateCliente(payload, reqData.datosPersonales, reqData.direccionEnvio)

    const versionTerminos = await (async () => {
      try {
        const ct = (await payload.findGlobal({ slug: 'config-tienda', depth: 0, overrideAccess: true })) as unknown as {
          legal?: { versionTerminos?: string }
        }
        return ct?.legal?.versionTerminos || 'sin-version'
      } catch {
        return 'sin-version'
      }
    })()

    const stockItems: StockLineItem[] = resumen.itemsValidos.map((item) => ({
      productoId: item.productoId,
      talla: item.talla,
      cantidad: item.cantidad,
    }))

    const nombreCompleto = `${reqData.datosPersonales.nombres} ${reqData.datosPersonales.apellidos}`.trim()
    const puntoRecojo = resumen.envio.tipo === 'retiro' ? resumen.envio.punto : null

    // Transaccion: descuento de stock condicional + creacion de la orden.
    const transactionID = await payload.db.beginTransaction()
    if (transactionID === null || transactionID === undefined) {
      throw new Error('No se pudo iniciar la transaccion de base de datos.')
    }

    let orden: Record<string, unknown>
    try {
      await decrementStock(payload, transactionID, stockItems)

      orden = (await payload.create({
        collection: 'ordenes',
        overrideAccess: true,
        req: { transactionID } as Parameters<typeof payload.create>[0]['req'],
        data: {
          idempotencyKey: reqData.idempotencyKey,
          cliente: clienteId,
          nombreCliente: nombreCompleto,
          datosCliente: {
            nombres: reqData.datosPersonales.nombres,
            apellidos: reqData.datosPersonales.apellidos,
            tipoDocumento: reqData.datosPersonales.tipoDocumento,
            numeroDocumento: reqData.datosPersonales.numeroDocumento,
            email: reqData.datosPersonales.email,
          },
          telefono: reqData.datosPersonales.celular,
          metodoEntrega: reqData.metodoEntrega,
          puntoRecojo: puntoRecojo
            ? { nombre: puntoRecojo.nombre, direccion: puntoRecojo.direccion, horario: puntoRecojo.horario ?? undefined }
            : undefined,
          items: resumen.itemsValidos.map((item) => ({
            producto: item.productoId,
            nombreProducto: item.nombre,
            sku: item.sku ?? undefined,
            skuVariante: item.skuVariante ?? undefined,
            color: item.color ?? undefined,
            talla: item.talla ?? undefined,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            precioAnterior: item.precioAnterior ?? undefined,
            subtotal: item.subtotal,
            imagenUrl: item.imagenUrl ?? undefined,
          })),
          subtotal: resumen.subtotal,
          descuento: resumen.descuento,
          costoEnvio: resumen.costoEnvio ?? 0,
          total: resumen.total,
          moneda: resumen.moneda,
          cupon: resumen.cupon?.id,
          direccionEnvio: reqData.direccionEnvio
            ? {
                calle: reqData.direccionEnvio.calle,
                departamento: reqData.direccionEnvio.departamento,
                ciudad: reqData.direccionEnvio.ciudad,
                distrito: reqData.direccionEnvio.distrito,
                referencias: reqData.direccionEnvio.referencias,
              }
            : { calle: puntoRecojo?.direccion ?? 'Retiro en tienda', distrito: 'Retiro en tienda', ciudad: '', referencias: '' },
          metodoPago: reqData.metodoPago as never,
          estadoComercial: 'pendiente_pago',
          estadoPago: 'pending',
          stockDescontado: true,
          stockRestaurado: false,
          aceptaciones: {
            terminos: reqData.aceptaTerminos,
            privacidad: reqData.aceptaPrivacidad,
            fecha: new Date().toISOString(),
            versionTerminos,
          },
          paymentProvider: reqData.metodoPago === 'tarjeta' ? 'izipay' : 'manual',
          paymentMethod: reqData.metodoPago,
          paymentSignatureValid: false,
          paymentPayload: {
            source: 'checkout-api',
            comprobante: reqData.comprobante,
            cuponCodigo: resumen.cupon?.codigo ?? null,
            envio: { tipo: resumen.envio.tipo, etiqueta: resumen.envio.etiqueta },
          },
        },
      })) as unknown as Record<string, unknown>

      // Consumo de cupon dentro de la misma transaccion.
      if (resumen.cupon?.id) {
        const cuponDoc = (await payload.findByID({
          collection: 'cupones',
          id: resumen.cupon.id,
          depth: 0,
          overrideAccess: true,
          req: { transactionID } as Parameters<typeof payload.findByID>[0]['req'],
        })) as unknown as { usosActuales?: number }

        await payload.update({
          collection: 'cupones',
          id: resumen.cupon.id,
          overrideAccess: true,
          req: { transactionID } as Parameters<typeof payload.update>[0]['req'],
          data: { usosActuales: Number(cuponDoc?.usosActuales || 0) + 1 },
        })
      }

      await payload.db.commitTransaction(transactionID)
    } catch (error) {
      await payload.db.rollbackTransaction(transactionID)

      if (error instanceof StockInsuficienteError) {
        return NextResponse.json(
          { error: 'Stock insuficiente al confirmar el pedido. Revisa tu carrito.', item: error.item },
          { status: 409 },
        )
      }

      // Carrera de idempotencia: otra solicitud identica gano la unique constraint.
      const yaCreada = await findByIdempotencyKey(payload, reqData.idempotencyKey)
      if (yaCreada) {
        return NextResponse.json({ success: true, idempotent: true, order: toPublicOrder(yaCreada) }, { status: 200 })
      }

      throw error
    }

    return NextResponse.json(
      {
        success: true,
        order: toPublicOrder(orden),
        envio: { tipo: resumen.envio.tipo, etiqueta: resumen.envio.etiqueta, costo: roundMoney(resumen.costoEnvio ?? 0) },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error('Error creando orden:', error)
    return NextResponse.json({ error: 'Error creando orden.' }, { status: 500 })
  }
}
