// NOTA: este modulo se importa desde colecciones de Payload (hooks), que el
// CLI de Payload carga fuera de Next; por eso NO usa 'server-only'. Nunca debe
// importarse desde componentes cliente.
import { sql } from '@payloadcms/db-postgres/drizzle'
import type { Payload } from 'payload'

// Politica de stock (documentada en audit/ENTREGA_ECOMMERCE_2026-07-11.md):
// - Solo existe "stock disponible" (sin reservas temporales).
// - El stock se descuenta de forma ATOMICA dentro de la transaccion que crea
//   el pedido (UPDATE condicional stock >= cantidad). Si no alcanza, la
//   transaccion completa se revierte y el pedido no se crea (sin sobreventa).
// - Al cancelar un pedido descontado, el stock se restaura una unica vez
//   (bandera stockRestaurado en la orden).
// - En SQLite local (desarrollo) se usa el mismo SQL condicional.

type RawDrizzle = {
  execute?: (query: unknown) => Promise<{ rows?: unknown[] } | unknown[]>
  all?: (query: unknown) => Promise<unknown[]>
}

function getExecutor(payload: Payload, transactionID?: string | number | null): RawDrizzle {
  const db = payload.db as unknown as {
    drizzle: RawDrizzle
    sessions?: Record<string, { db: RawDrizzle }>
  }

  if (transactionID !== undefined && transactionID !== null) {
    const session = db.sessions?.[String(transactionID)]
    if (session?.db) return session.db
  }

  return db.drizzle
}

// Postgres expone .execute(); SQLite (drizzle libsql) expone .all().
async function runQuery(db: RawDrizzle, query: unknown): Promise<{ rows?: unknown[] } | unknown[]> {
  if (typeof db.execute === 'function') return db.execute(query)
  if (typeof db.all === 'function') return db.all(query)
  throw new Error('Adaptador de base de datos sin ejecutor SQL compatible')
}

function rowCount(result: { rows?: unknown[] } | unknown[]): number {
  if (Array.isArray(result)) return result.length
  return Array.isArray(result?.rows) ? result.rows.length : 0
}

export type StockLineItem = {
  productoId: number
  talla?: string | null
  cantidad: number
}

export class StockInsuficienteError extends Error {
  constructor(public readonly item: StockLineItem) {
    super(`Stock insuficiente para producto ${item.productoId}${item.talla ? ` talla ${item.talla}` : ''}`)
    this.name = 'StockInsuficienteError'
  }
}

// Descuenta stock de forma condicional y atomica. Lanza StockInsuficienteError
// si alguna linea no alcanza (el llamador debe hacer rollback de la transaccion).
export async function decrementStock(
  payload: Payload,
  transactionID: string | number | null | undefined,
  items: StockLineItem[],
): Promise<void> {
  const db = getExecutor(payload, transactionID)

  for (const item of items) {
    const cantidad = Math.trunc(item.cantidad)
    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      throw new StockInsuficienteError(item)
    }

    let result
    if (item.talla) {
      result = await runQuery(db, sql`
        UPDATE productos_tallas
        SET stock = stock - ${cantidad}
        WHERE _parent_id = ${item.productoId}
          AND talla = ${item.talla}
          AND venta_habilitada = true
          AND stock >= ${cantidad}
        RETURNING id
      `)
    } else {
      result = await runQuery(db, sql`
        UPDATE productos
        SET stock = stock - ${cantidad}
        WHERE id = ${item.productoId}
          AND venta_online = true
          AND activo = true
          AND stock >= ${cantidad}
        RETURNING id
      `)
    }

    if (rowCount(result) === 0) {
      throw new StockInsuficienteError(item)
    }
  }
}

// Restaura stock (cancelacion). No falla si la talla ya no existe: en ese caso
// deja constancia en el log para revision manual.
export async function restoreStock(
  payload: Payload,
  transactionID: string | number | null | undefined,
  items: StockLineItem[],
): Promise<void> {
  const db = getExecutor(payload, transactionID)

  for (const item of items) {
    const cantidad = Math.trunc(item.cantidad)
    if (!Number.isInteger(cantidad) || cantidad <= 0) continue

    let result
    if (item.talla) {
      result = await runQuery(db, sql`
        UPDATE productos_tallas
        SET stock = stock + ${cantidad}
        WHERE _parent_id = ${item.productoId}
          AND talla = ${item.talla}
        RETURNING id
      `)
    } else {
      result = await runQuery(db, sql`
        UPDATE productos
        SET stock = stock + ${cantidad}
        WHERE id = ${item.productoId}
        RETURNING id
      `)
    }

    if (rowCount(result) === 0) {
      payload.logger.warn(
        `restoreStock: no se pudo restaurar stock (producto ${item.productoId}, talla ${item.talla ?? 'n/a'}, cantidad ${cantidad}). Revisar manualmente.`,
      )
    }
  }
}
