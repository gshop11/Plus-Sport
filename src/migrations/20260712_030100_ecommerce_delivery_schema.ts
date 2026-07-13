import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

// MIGRACION B (no destructiva en up) — Esquema ecommerce.
//
// up() NO contiene DROP TYPE / DROP TABLE / DROP COLUMN / TRUNCATE / DELETE ni
// conversion de columnas a text. Solo agrega: tipos nuevos, tablas nuevas,
// columnas nuevas (nullable o con DEFAULT), indices, claves foraneas y cambios
// de DEFAULT. El estado_comercial NO se recrea: la migracion A ya amplio el
// enum, aqui solo se cambia el DEFAULT a 'pendiente_pago' (valor ya existente).
//
// FK de comprobantes: orden_id es NOT NULL con ON DELETE RESTRICT (no SET NULL),
// para no dejar evidencia financiera huerfana ni violar la nullability. Eliminar
// una orden con comprobantes queda impedido a nivel de base de datos (ademas del
// hook beforeDelete de la coleccion Ordenes).

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TYPE "public"."enum_ordenes_datos_cliente_tipo_documento" AS ENUM('dni', 'ce', 'pasaporte', 'ruc');
  CREATE TYPE "public"."enum_config_tienda_pagos_metodos_moneda_cuenta" AS ENUM('PEN', 'USD');
  CREATE TABLE "ordenes_historial_estados" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"estado_anterior" varchar,
  	"estado_nuevo" varchar,
  	"fecha" timestamp(3) with time zone,
  	"usuario" varchar,
  	"comentario" varchar
  );

  CREATE TABLE "ordenes_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"comprobantes_id" integer
  );

  CREATE TABLE "comprobantes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"orden_id" integer NOT NULL,
  	"metodo_pago" varchar,
  	"notas_cliente" varchar,
  	"revisado" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric
  );

  CREATE TABLE "config_tienda_entrega_puntos_recojo" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"nombre" varchar NOT NULL,
  	"direccion" varchar NOT NULL,
  	"horario" varchar,
  	"activo" boolean DEFAULT false,
  	"instrucciones" varchar
  );

  ALTER TABLE "ordenes" ALTER COLUMN "estado_comercial" SET DEFAULT 'pendiente_pago';
  ALTER TABLE "config_tienda_pagos_metodos" ALTER COLUMN "activo" SET DEFAULT false;
  ALTER TABLE "config_tienda_pagos_metodos" ALTER COLUMN "instruccion" DROP DEFAULT;
  ALTER TABLE "config_tienda" ALTER COLUMN "header_anuncio_barra" SET DEFAULT 'CATALOGO DEPORTIVO CON ATENCION POR WHATSAPP';
  ALTER TABLE "config_tienda" ALTER COLUMN "footer_descripcion" SET DEFAULT '20 anos caminando contigo.';
  ALTER TABLE "config_tienda" ALTER COLUMN "footer_telefono" SET DEFAULT '+51 967 438 872';
  ALTER TABLE "config_tienda" ALTER COLUMN "footer_direccion" SET DEFAULT 'Av. Espana 2023, C.C. Gold Center, tienda 3, Trujillo';
  ALTER TABLE "productos_tallas" ADD COLUMN "venta_habilitada" boolean DEFAULT false;
  ALTER TABLE "productos_tallas" ADD COLUMN "sku_variante" varchar;
  ALTER TABLE "productos_tallas" ADD COLUMN "precio" numeric;
  ALTER TABLE "productos_tallas" ADD COLUMN "imagen_id" integer;
  ALTER TABLE "productos" ADD COLUMN "color" varchar;
  ALTER TABLE "productos" ADD COLUMN "venta_online" boolean DEFAULT false;
  ALTER TABLE "ordenes_items" ADD COLUMN "sku" varchar;
  ALTER TABLE "ordenes_items" ADD COLUMN "sku_variante" varchar;
  ALTER TABLE "ordenes_items" ADD COLUMN "color" varchar;
  ALTER TABLE "ordenes_items" ADD COLUMN "precio_anterior" numeric;
  ALTER TABLE "ordenes_items" ADD COLUMN "imagen_url" varchar;
  ALTER TABLE "ordenes" ADD COLUMN "idempotency_key" varchar;
  ALTER TABLE "ordenes" ADD COLUMN "datos_cliente_nombres" varchar;
  ALTER TABLE "ordenes" ADD COLUMN "datos_cliente_apellidos" varchar;
  ALTER TABLE "ordenes" ADD COLUMN "datos_cliente_tipo_documento" "enum_ordenes_datos_cliente_tipo_documento";
  ALTER TABLE "ordenes" ADD COLUMN "datos_cliente_numero_documento" varchar;
  ALTER TABLE "ordenes" ADD COLUMN "datos_cliente_email" varchar;
  ALTER TABLE "ordenes" ADD COLUMN "punto_recojo_nombre" varchar;
  ALTER TABLE "ordenes" ADD COLUMN "punto_recojo_direccion" varchar;
  ALTER TABLE "ordenes" ADD COLUMN "punto_recojo_horario" varchar;
  ALTER TABLE "ordenes" ADD COLUMN "moneda" varchar DEFAULT 'PEN';
  ALTER TABLE "ordenes" ADD COLUMN "direccion_envio_departamento" varchar;
  ALTER TABLE "ordenes" ADD COLUMN "aceptaciones_terminos" boolean DEFAULT false;
  ALTER TABLE "ordenes" ADD COLUMN "aceptaciones_privacidad" boolean DEFAULT false;
  ALTER TABLE "ordenes" ADD COLUMN "aceptaciones_fecha" timestamp(3) with time zone;
  ALTER TABLE "ordenes" ADD COLUMN "aceptaciones_version_terminos" varchar;
  ALTER TABLE "ordenes" ADD COLUMN "stock_descontado" boolean DEFAULT false;
  ALTER TABLE "ordenes" ADD COLUMN "stock_restaurado" boolean DEFAULT false;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "comprobantes_id" integer;
  ALTER TABLE "config_tienda_pagos_metodos" ADD COLUMN "numero" varchar;
  ALTER TABLE "config_tienda_pagos_metodos" ADD COLUMN "titular" varchar;
  ALTER TABLE "config_tienda_pagos_metodos" ADD COLUMN "qr_id" integer;
  ALTER TABLE "config_tienda_pagos_metodos" ADD COLUMN "banco" varchar;
  ALTER TABLE "config_tienda_pagos_metodos" ADD COLUMN "moneda_cuenta" "enum_config_tienda_pagos_metodos_moneda_cuenta" DEFAULT 'PEN';
  ALTER TABLE "config_tienda_pagos_metodos" ADD COLUMN "numero_cuenta" varchar;
  ALTER TABLE "config_tienda_pagos_metodos" ADD COLUMN "cci" varchar;
  ALTER TABLE "config_tienda" ADD COLUMN "legal_razon_social" varchar;
  ALTER TABLE "config_tienda" ADD COLUMN "legal_ruc" varchar;
  ALTER TABLE "config_tienda" ADD COLUMN "legal_version_terminos" varchar DEFAULT 'sin-version';
  ALTER TABLE "config_tienda" ADD COLUMN "legal_terminos_condiciones" jsonb;
  ALTER TABLE "config_tienda" ADD COLUMN "legal_politica_privacidad" jsonb;
  ALTER TABLE "config_tienda" ADD COLUMN "legal_politica_cambios" jsonb;
  ALTER TABLE "config_tienda" ADD COLUMN "legal_politica_entregas" jsonb;
  ALTER TABLE "ordenes_historial_estados" ADD CONSTRAINT "ordenes_historial_estados_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."ordenes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ordenes_rels" ADD CONSTRAINT "ordenes_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."ordenes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ordenes_rels" ADD CONSTRAINT "ordenes_rels_comprobantes_fk" FOREIGN KEY ("comprobantes_id") REFERENCES "public"."comprobantes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "comprobantes" ADD CONSTRAINT "comprobantes_orden_id_ordenes_id_fk" FOREIGN KEY ("orden_id") REFERENCES "public"."ordenes"("id") ON DELETE restrict ON UPDATE no action;
  ALTER TABLE "config_tienda_entrega_puntos_recojo" ADD CONSTRAINT "config_tienda_entrega_puntos_recojo_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."config_tienda"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "ordenes_historial_estados_order_idx" ON "ordenes_historial_estados" USING btree ("_order");
  CREATE INDEX "ordenes_historial_estados_parent_id_idx" ON "ordenes_historial_estados" USING btree ("_parent_id");
  CREATE INDEX "ordenes_rels_order_idx" ON "ordenes_rels" USING btree ("order");
  CREATE INDEX "ordenes_rels_parent_idx" ON "ordenes_rels" USING btree ("parent_id");
  CREATE INDEX "ordenes_rels_path_idx" ON "ordenes_rels" USING btree ("path");
  CREATE INDEX "ordenes_rels_comprobantes_id_idx" ON "ordenes_rels" USING btree ("comprobantes_id");
  CREATE INDEX "comprobantes_orden_idx" ON "comprobantes" USING btree ("orden_id");
  CREATE INDEX "comprobantes_updated_at_idx" ON "comprobantes" USING btree ("updated_at");
  CREATE INDEX "comprobantes_created_at_idx" ON "comprobantes" USING btree ("created_at");
  CREATE UNIQUE INDEX "comprobantes_filename_idx" ON "comprobantes" USING btree ("filename");
  CREATE INDEX "config_tienda_entrega_puntos_recojo_order_idx" ON "config_tienda_entrega_puntos_recojo" USING btree ("_order");
  CREATE INDEX "config_tienda_entrega_puntos_recojo_parent_id_idx" ON "config_tienda_entrega_puntos_recojo" USING btree ("_parent_id");
  ALTER TABLE "productos_tallas" ADD CONSTRAINT "productos_tallas_imagen_id_media_id_fk" FOREIGN KEY ("imagen_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_comprobantes_fk" FOREIGN KEY ("comprobantes_id") REFERENCES "public"."comprobantes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "config_tienda_pagos_metodos" ADD CONSTRAINT "config_tienda_pagos_metodos_qr_id_media_id_fk" FOREIGN KEY ("qr_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "productos_tallas_imagen_idx" ON "productos_tallas" USING btree ("imagen_id");
  CREATE INDEX "productos_venta_online_idx" ON "productos" USING btree ("venta_online");
  CREATE UNIQUE INDEX "ordenes_idempotency_key_idx" ON "ordenes" USING btree ("idempotency_key");
  CREATE INDEX "payload_locked_documents_rels_comprobantes_id_idx" ON "payload_locked_documents_rels" USING btree ("comprobantes_id");
  CREATE INDEX "config_tienda_pagos_metodos_qr_idx" ON "config_tienda_pagos_metodos" USING btree ("qr_id");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Reversion del esquema ecommerce. NO recrea el enum estado_comercial: los
  // valores agregados por la migracion A permanecen (quitar valores de un enum
  // es destructivo); solo se restaura el DEFAULT legacy 'pendiente'. Las
  // ordenes y sus datos legacy permanecen intactos.
  await db.execute(sql`
  ALTER TABLE "ordenes_historial_estados" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "ordenes_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "comprobantes" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "config_tienda_entrega_puntos_recojo" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "ordenes_historial_estados" CASCADE;
  DROP TABLE "ordenes_rels" CASCADE;
  DROP TABLE "comprobantes" CASCADE;
  DROP TABLE "config_tienda_entrega_puntos_recojo" CASCADE;
  ALTER TABLE "productos_tallas" DROP CONSTRAINT "productos_tallas_imagen_id_media_id_fk";
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_comprobantes_fk";
  ALTER TABLE "config_tienda_pagos_metodos" DROP CONSTRAINT "config_tienda_pagos_metodos_qr_id_media_id_fk";
  ALTER TABLE "ordenes" ALTER COLUMN "estado_comercial" SET DEFAULT 'pendiente';
  DROP INDEX "productos_tallas_imagen_idx";
  DROP INDEX "productos_venta_online_idx";
  DROP INDEX "ordenes_idempotency_key_idx";
  DROP INDEX "payload_locked_documents_rels_comprobantes_id_idx";
  DROP INDEX "config_tienda_pagos_metodos_qr_idx";
  ALTER TABLE "config_tienda_pagos_metodos" ALTER COLUMN "activo" SET DEFAULT true;
  ALTER TABLE "config_tienda_pagos_metodos" ALTER COLUMN "instruccion" SET DEFAULT 'Te enviaremos los pasos por WhatsApp.';
  ALTER TABLE "config_tienda" ALTER COLUMN "header_anuncio_barra" SET DEFAULT 'ENVIO GRATIS POR COMPRAS MAYORES A S/299';
  ALTER TABLE "config_tienda" ALTER COLUMN "footer_descripcion" SET DEFAULT 'Tu tienda deportiva de confianza en Peru.';
  ALTER TABLE "config_tienda" ALTER COLUMN "footer_telefono" DROP DEFAULT;
  ALTER TABLE "config_tienda" ALTER COLUMN "footer_direccion" SET DEFAULT 'Lima, Peru';
  ALTER TABLE "productos_tallas" DROP COLUMN "venta_habilitada";
  ALTER TABLE "productos_tallas" DROP COLUMN "sku_variante";
  ALTER TABLE "productos_tallas" DROP COLUMN "precio";
  ALTER TABLE "productos_tallas" DROP COLUMN "imagen_id";
  ALTER TABLE "productos" DROP COLUMN "color";
  ALTER TABLE "productos" DROP COLUMN "venta_online";
  ALTER TABLE "ordenes_items" DROP COLUMN "sku";
  ALTER TABLE "ordenes_items" DROP COLUMN "sku_variante";
  ALTER TABLE "ordenes_items" DROP COLUMN "color";
  ALTER TABLE "ordenes_items" DROP COLUMN "precio_anterior";
  ALTER TABLE "ordenes_items" DROP COLUMN "imagen_url";
  ALTER TABLE "ordenes" DROP COLUMN "idempotency_key";
  ALTER TABLE "ordenes" DROP COLUMN "datos_cliente_nombres";
  ALTER TABLE "ordenes" DROP COLUMN "datos_cliente_apellidos";
  ALTER TABLE "ordenes" DROP COLUMN "datos_cliente_tipo_documento";
  ALTER TABLE "ordenes" DROP COLUMN "datos_cliente_numero_documento";
  ALTER TABLE "ordenes" DROP COLUMN "datos_cliente_email";
  ALTER TABLE "ordenes" DROP COLUMN "punto_recojo_nombre";
  ALTER TABLE "ordenes" DROP COLUMN "punto_recojo_direccion";
  ALTER TABLE "ordenes" DROP COLUMN "punto_recojo_horario";
  ALTER TABLE "ordenes" DROP COLUMN "moneda";
  ALTER TABLE "ordenes" DROP COLUMN "direccion_envio_departamento";
  ALTER TABLE "ordenes" DROP COLUMN "aceptaciones_terminos";
  ALTER TABLE "ordenes" DROP COLUMN "aceptaciones_privacidad";
  ALTER TABLE "ordenes" DROP COLUMN "aceptaciones_fecha";
  ALTER TABLE "ordenes" DROP COLUMN "aceptaciones_version_terminos";
  ALTER TABLE "ordenes" DROP COLUMN "stock_descontado";
  ALTER TABLE "ordenes" DROP COLUMN "stock_restaurado";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "comprobantes_id";
  ALTER TABLE "config_tienda_pagos_metodos" DROP COLUMN "numero";
  ALTER TABLE "config_tienda_pagos_metodos" DROP COLUMN "titular";
  ALTER TABLE "config_tienda_pagos_metodos" DROP COLUMN "qr_id";
  ALTER TABLE "config_tienda_pagos_metodos" DROP COLUMN "banco";
  ALTER TABLE "config_tienda_pagos_metodos" DROP COLUMN "moneda_cuenta";
  ALTER TABLE "config_tienda_pagos_metodos" DROP COLUMN "numero_cuenta";
  ALTER TABLE "config_tienda_pagos_metodos" DROP COLUMN "cci";
  ALTER TABLE "config_tienda" DROP COLUMN "legal_razon_social";
  ALTER TABLE "config_tienda" DROP COLUMN "legal_ruc";
  ALTER TABLE "config_tienda" DROP COLUMN "legal_version_terminos";
  ALTER TABLE "config_tienda" DROP COLUMN "legal_terminos_condiciones";
  ALTER TABLE "config_tienda" DROP COLUMN "legal_politica_privacidad";
  ALTER TABLE "config_tienda" DROP COLUMN "legal_politica_cambios";
  ALTER TABLE "config_tienda" DROP COLUMN "legal_politica_entregas";
  DROP TYPE "public"."enum_ordenes_datos_cliente_tipo_documento";
  DROP TYPE "public"."enum_config_tienda_pagos_metodos_moneda_cuenta";`)
}
