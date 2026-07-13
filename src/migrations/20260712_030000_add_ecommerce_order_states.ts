import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// MIGRACION A (no destructiva) — Amplia el enum de estado_comercial.
//
// Agrega los nuevos estados del flujo ecommerce SIN recrear el tipo y SIN
// tocar los datos existentes. Los valores legacy ('pendiente', 'procesando',
// 'enviado', 'entregado', 'cancelado') se conservan intactos.
//
// Debe ir en su PROPIA migracion (separada del resto del esquema) porque
// PostgreSQL no permite USAR un valor de enum recien agregado dentro de la
// misma transaccion. Payload ejecuta y hace COMMIT de cada migracion por
// separado (initTransaction -> up -> commitTransaction), por lo que la
// migracion B (que usa 'pendiente_pago' como DEFAULT) corre en una
// transaccion posterior donde el valor ya esta disponible.
//
// ALTER TYPE ... ADD VALUE es soportado dentro de transaccion en PostgreSQL 12+
// (Produccion usa Neon PostgreSQL 17). 'IF NOT EXISTS' hace la migracion
// idempotente y segura ante reejecucion.

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "public"."enum_ordenes_estado_comercial" ADD VALUE IF NOT EXISTS 'pendiente_pago';
    ALTER TYPE "public"."enum_ordenes_estado_comercial" ADD VALUE IF NOT EXISTS 'comprobante_recibido';
    ALTER TYPE "public"."enum_ordenes_estado_comercial" ADD VALUE IF NOT EXISTS 'pago_en_revision';
    ALTER TYPE "public"."enum_ordenes_estado_comercial" ADD VALUE IF NOT EXISTS 'pagado';
    ALTER TYPE "public"."enum_ordenes_estado_comercial" ADD VALUE IF NOT EXISTS 'preparando';
    ALTER TYPE "public"."enum_ordenes_estado_comercial" ADD VALUE IF NOT EXISTS 'pago_fallido';
    ALTER TYPE "public"."enum_ordenes_estado_comercial" ADD VALUE IF NOT EXISTS 'reembolsado';
  `)
}

export async function down(_args: MigrateDownArgs): Promise<void> {
  // PostgreSQL no permite eliminar valores de un enum sin recrearlo (operacion
  // destructiva que requeriria convertir la columna, con riesgo si algun dato
  // ya usa los valores nuevos). Revertir esta ampliacion NO es seguro de forma
  // automatica: se deja como no-op intencional. Los valores extra en el enum
  // son inofensivos si la migracion B ya fue revertida (el DEFAULT vuelve a
  // 'pendiente'). Para una reversion total del tipo, hacerlo manualmente con
  // respaldo.
}
