import 'server-only'
import type { Payload } from 'payload'
import { resolveMediaURL } from './media'

// Reglas de visibilidad de metodos de pago manuales.
// Un metodo SOLO se expone al cliente cuando esta activo Y tiene todos sus
// datos obligatorios configurados. No existen metodos por defecto: sin
// configuracion en Payload no se muestra ningun metodo.

export type MetodoPagoCodigo = 'yape' | 'plin' | 'interbank' | 'transferencia' | 'tarjeta' | 'efectivo' | 'whatsapp'

export type MetodoPagoPublico = {
  codigo: MetodoPagoCodigo
  nombre: string
  instruccion: string | null
  mostrarEnFooter: boolean
  // Datos de pago (solo los que corresponden al tipo, ya validados como completos)
  numero?: string
  titular?: string
  qrUrl?: string | null
  banco?: string
  numeroCuenta?: string
  cci?: string
  monedaCuenta?: string
}

// Feature flag de pago con tarjeta (Izipay). Mientras el incidente INT_015
// no se resuelva con soporte, debe permanecer en false.
export function isIzipayCardEnabled() {
  return process.env.IZIPAY_CARD_ENABLED?.trim().toLowerCase() === 'true'
}

type MetodoRaw = Record<string, unknown>

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function esMetodoCompleto(codigo: MetodoPagoCodigo, m: MetodoRaw): boolean {
  switch (codigo) {
    case 'yape':
    case 'plin':
      return Boolean(str(m.numero) && str(m.titular))
    case 'transferencia':
    case 'interbank':
      return Boolean(str(m.banco) && str(m.titular) && str(m.numeroCuenta) && str(m.cci))
    case 'efectivo':
    case 'whatsapp':
      return true
    case 'tarjeta':
      // Ademas del flag, requiere credenciales del proveedor en el entorno.
      return (
        isIzipayCardEnabled() &&
        Boolean(process.env.IZIPAY_API_USERNAME?.trim()) &&
        Boolean(process.env.IZIPAY_API_PASSWORD?.trim()) &&
        Boolean(process.env.IZIPAY_PUBLIC_KEY?.trim())
      )
    default:
      return false
  }
}

export async function getMetodosPagoActivos(payload: Payload): Promise<MetodoPagoPublico[]> {
  let metodosRaw: MetodoRaw[] = []
  try {
    const ct = (await payload.findGlobal({ slug: 'config-tienda', depth: 1, overrideAccess: true })) as unknown as {
      pagos?: { metodos?: MetodoRaw[] }
    }
    metodosRaw = Array.isArray(ct?.pagos?.metodos) ? ct.pagos.metodos : []
  } catch {
    return []
  }

  const publicos: MetodoPagoPublico[] = []

  for (const m of metodosRaw) {
    const codigo = str(m.codigo) as MetodoPagoCodigo
    if (!codigo || m.activo !== true) continue
    if (!esMetodoCompleto(codigo, m)) continue

    const base: MetodoPagoPublico = {
      codigo,
      nombre: str(m.nombre) || codigo,
      instruccion: str(m.instruccion) || null,
      mostrarEnFooter: m.mostrarEnFooter !== false,
    }

    if (codigo === 'yape' || codigo === 'plin') {
      base.numero = str(m.numero)
      base.titular = str(m.titular)
      base.qrUrl = resolveMediaURL(m.qr as Record<string, unknown> | null)
    }

    if (codigo === 'transferencia' || codigo === 'interbank') {
      base.banco = str(m.banco)
      base.titular = str(m.titular)
      base.numeroCuenta = str(m.numeroCuenta)
      base.cci = str(m.cci)
      base.monedaCuenta = str(m.monedaCuenta) || 'PEN'
      base.qrUrl = resolveMediaURL(m.qr as Record<string, unknown> | null)
    }

    publicos.push(base)
  }

  return publicos
}

export function isMetodoPagoValido(metodos: MetodoPagoPublico[], codigo: string): boolean {
  return metodos.some((m) => m.codigo === codigo && m.codigo !== 'whatsapp')
}
