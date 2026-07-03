import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_usuarios_rol" AS ENUM('admin', 'editor', 'vendedor');
  CREATE TYPE "public"."enum_productos_segmento" AS ENUM('hombre', 'mujer', 'ninos', 'unisex');
  CREATE TYPE "public"."enum_productos_etiqueta" AS ENUM('', 'nuevo', 'hot', 'top', 'oferta');
  CREATE TYPE "public"."enum_clientes_etiqueta" AS ENUM('normal', 'vip', 'frecuente', 'inactivo');
  CREATE TYPE "public"."enum_ordenes_metodo_entrega" AS ENUM('delivery', 'retiro_tienda');
  CREATE TYPE "public"."enum_ordenes_metodo_pago" AS ENUM('yape', 'plin', 'interbank', 'transferencia', 'tarjeta', 'efectivo', 'whatsapp');
  CREATE TYPE "public"."enum_ordenes_estado_comercial" AS ENUM('pendiente', 'procesando', 'enviado', 'entregado', 'cancelado');
  CREATE TYPE "public"."enum_ordenes_estado_pago" AS ENUM('pending', 'authorized', 'paid', 'failed', 'canceled', 'refunded');
  CREATE TYPE "public"."enum_cupones_tipo" AS ENUM('porcentaje', 'monto', 'envio_gratis');
  CREATE TYPE "public"."enum_config_tienda_home_secciones_key" AS ENUM('categorias', 'marcas', 'destacados', 'suscripcion');
  CREATE TYPE "public"."enum_config_tienda_pagos_metodos_codigo" AS ENUM('yape', 'plin', 'interbank', 'transferencia', 'tarjeta', 'efectivo', 'whatsapp');
  CREATE TABLE "usuarios_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "usuarios" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nombre" varchar NOT NULL,
  	"rol" "enum_usuarios_rol" DEFAULT 'editor',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar,
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
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_banner_url" varchar,
  	"sizes_banner_width" numeric,
  	"sizes_banner_height" numeric,
  	"sizes_banner_mime_type" varchar,
  	"sizes_banner_filesize" numeric,
  	"sizes_banner_filename" varchar
  );
  
  CREATE TABLE "categorias" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nombre" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"descripcion" varchar,
  	"imagen_id" integer,
  	"icono" varchar,
  	"categoria_padre_id" integer,
  	"orden" numeric DEFAULT 0,
  	"activa" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "marcas" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nombre" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"logo_id" integer,
  	"activa" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "productos_imagenes" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"imagen_id" integer NOT NULL
  );
  
  CREATE TABLE "productos_tallas" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"talla" varchar NOT NULL,
  	"stock" numeric DEFAULT 0 NOT NULL
  );
  
  CREATE TABLE "productos" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nombre" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"descripcion" jsonb,
  	"sku" varchar,
  	"precio" numeric NOT NULL,
  	"precio_anterior" numeric,
  	"categoria_id" integer NOT NULL,
  	"marca_id" integer,
  	"segmento" "enum_productos_segmento" DEFAULT 'unisex',
  	"imagen_principal_id" integer,
  	"stock" numeric DEFAULT 0,
  	"etiqueta" "enum_productos_etiqueta" DEFAULT '',
  	"destacado" boolean DEFAULT false,
  	"nuevo_ingreso" boolean DEFAULT false,
  	"activo" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "clientes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nombre" varchar NOT NULL,
  	"telefono" varchar,
  	"email" varchar,
  	"documento" varchar,
  	"direccion_calle" varchar,
  	"direccion_distrito" varchar,
  	"direccion_ciudad" varchar DEFAULT 'Lima',
  	"direccion_referencias" varchar,
  	"notas" varchar,
  	"total_compras" numeric DEFAULT 0,
  	"etiqueta" "enum_clientes_etiqueta" DEFAULT 'normal',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "ordenes_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"producto_id" integer NOT NULL,
  	"nombre_producto" varchar NOT NULL,
  	"talla" varchar,
  	"cantidad" numeric DEFAULT 1 NOT NULL,
  	"precio_unitario" numeric NOT NULL,
  	"subtotal" numeric NOT NULL
  );
  
  CREATE TABLE "ordenes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"numero_pedido" varchar,
  	"codigo_correlacion" varchar,
  	"cliente_id" integer,
  	"nombre_cliente" varchar NOT NULL,
  	"telefono" varchar NOT NULL,
  	"metodo_entrega" "enum_ordenes_metodo_entrega" DEFAULT 'delivery' NOT NULL,
  	"subtotal" numeric,
  	"descuento" numeric DEFAULT 0,
  	"costo_envio" numeric DEFAULT 0,
  	"total" numeric,
  	"cupon_id" integer,
  	"direccion_envio_calle" varchar NOT NULL,
  	"direccion_envio_distrito" varchar NOT NULL,
  	"direccion_envio_ciudad" varchar DEFAULT 'Lima',
  	"direccion_envio_referencias" varchar,
  	"metodo_pago" "enum_ordenes_metodo_pago",
  	"estado_comercial" "enum_ordenes_estado_comercial" DEFAULT 'pendiente' NOT NULL,
  	"estado_pago" "enum_ordenes_estado_pago" DEFAULT 'pending' NOT NULL,
  	"payment_provider" varchar DEFAULT 'manual',
  	"payment_method" varchar,
  	"transaction_id" varchar,
  	"external_order_id" varchar,
  	"payment_reference" varchar,
  	"authorization_code" varchar,
  	"payment_payload" jsonb,
  	"payment_signature_valid" boolean DEFAULT false,
  	"paid_at" timestamp(3) with time zone,
  	"payment_error_code" varchar,
  	"payment_error_message" varchar,
  	"notas" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "cupones" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"codigo" varchar NOT NULL,
  	"tipo" "enum_cupones_tipo" DEFAULT 'porcentaje' NOT NULL,
  	"valor" numeric,
  	"minimo_compra" numeric DEFAULT 0,
  	"uso_maximo" numeric DEFAULT 0,
  	"usos_actuales" numeric DEFAULT 0,
  	"vencimiento" timestamp(3) with time zone,
  	"activo" boolean DEFAULT true,
  	"descripcion" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "envios_distritos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"distrito" varchar NOT NULL
  );
  
  CREATE TABLE "envios" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nombre" varchar NOT NULL,
  	"descripcion" varchar,
  	"costo" numeric DEFAULT 0 NOT NULL,
  	"tiempo_entrega" varchar,
  	"minimo_gratis" numeric DEFAULT 0,
  	"activo" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "suscriptores" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"telefono" varchar NOT NULL,
  	"contactado" boolean DEFAULT false,
  	"nota" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "banners" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"titulo" varchar NOT NULL,
  	"subtitulo" varchar,
  	"descripcion" varchar,
  	"imagen_id" integer,
  	"color_fondo" varchar DEFAULT '#1a237e',
  	"text_boton1" varchar,
  	"url_boton1" varchar,
  	"text_boton2" varchar,
  	"url_boton2" varchar,
  	"orden" numeric DEFAULT 1,
  	"activo" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"usuarios_id" integer,
  	"media_id" integer,
  	"categorias_id" integer,
  	"marcas_id" integer,
  	"productos_id" integer,
  	"clientes_id" integer,
  	"ordenes_id" integer,
  	"cupones_id" integer,
  	"envios_id" integer,
  	"suscriptores_id" integer,
  	"banners_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"usuarios_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "config_tienda_header_menu_principal_sub_items" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"etiqueta" varchar NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "config_tienda_header_menu_principal" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"etiqueta" varchar NOT NULL,
  	"url" varchar NOT NULL,
  	"es_destacado" boolean DEFAULT false
  );
  
  CREATE TABLE "config_tienda_home_secciones" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"key" "enum_config_tienda_home_secciones_key" NOT NULL,
  	"orden" numeric DEFAULT 1,
  	"mostrar" boolean DEFAULT true,
  	"titulo" varchar NOT NULL,
  	"subtitulo" varchar
  );
  
  CREATE TABLE "config_tienda_footer_links_rapidos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"etiqueta" varchar NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "config_tienda_pagos_metodos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"nombre" varchar NOT NULL,
  	"codigo" "enum_config_tienda_pagos_metodos_codigo" DEFAULT 'whatsapp',
  	"activo" boolean DEFAULT true,
  	"mostrar_en_footer" boolean DEFAULT true,
  	"instruccion" varchar DEFAULT 'Te enviaremos los pasos por WhatsApp.'
  );
  
  CREATE TABLE "config_tienda" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nombre_tienda" varchar DEFAULT 'PlusSport' NOT NULL,
  	"tagline" varchar DEFAULT 'Performance Athletic Wear',
  	"logo_id" integer,
  	"favicon_id" integer,
  	"colores_primario" varchar DEFAULT '#1a237e',
  	"colores_acento" varchar DEFAULT '#ff6f00',
  	"colores_fondo" varchar DEFAULT '#ffffff',
  	"moneda_simbolo" varchar DEFAULT 'S/',
  	"moneda_codigo_i_s_o" varchar DEFAULT 'PEN',
  	"header_anuncio_barra" varchar DEFAULT 'ENVIO GRATIS POR COMPRAS MAYORES A S/299',
  	"header_mostrar_anuncio" boolean DEFAULT true,
  	"header_texto_btn_whatsapp" varchar DEFAULT 'Comprar por WhatsApp',
  	"header_numero_whatsapp" varchar,
  	"footer_descripcion" varchar DEFAULT 'Tu tienda deportiva de confianza en Peru.',
  	"footer_telefono" varchar,
  	"footer_email" varchar,
  	"footer_direccion" varchar DEFAULT 'Lima, Peru',
  	"footer_horario" varchar DEFAULT 'Lunes a Sabado 9am-8pm',
  	"footer_redes_sociales_facebook" varchar,
  	"footer_redes_sociales_instagram" varchar,
  	"footer_redes_sociales_tiktok" varchar,
  	"footer_redes_sociales_youtube" varchar,
  	"footer_texto_copyright" varchar DEFAULT '© 2025 PlusSport. Todos los derechos reservados.',
  	"seo_meta_titulo" varchar,
  	"seo_meta_descripcion" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "usuarios_sessions" ADD CONSTRAINT "usuarios_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "categorias" ADD CONSTRAINT "categorias_imagen_id_media_id_fk" FOREIGN KEY ("imagen_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "categorias" ADD CONSTRAINT "categorias_categoria_padre_id_categorias_id_fk" FOREIGN KEY ("categoria_padre_id") REFERENCES "public"."categorias"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "marcas" ADD CONSTRAINT "marcas_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "productos_imagenes" ADD CONSTRAINT "productos_imagenes_imagen_id_media_id_fk" FOREIGN KEY ("imagen_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "productos_imagenes" ADD CONSTRAINT "productos_imagenes_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."productos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "productos_tallas" ADD CONSTRAINT "productos_tallas_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."productos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "productos" ADD CONSTRAINT "productos_categoria_id_categorias_id_fk" FOREIGN KEY ("categoria_id") REFERENCES "public"."categorias"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "productos" ADD CONSTRAINT "productos_marca_id_marcas_id_fk" FOREIGN KEY ("marca_id") REFERENCES "public"."marcas"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "productos" ADD CONSTRAINT "productos_imagen_principal_id_media_id_fk" FOREIGN KEY ("imagen_principal_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ordenes_items" ADD CONSTRAINT "ordenes_items_producto_id_productos_id_fk" FOREIGN KEY ("producto_id") REFERENCES "public"."productos"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ordenes_items" ADD CONSTRAINT "ordenes_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."ordenes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ordenes" ADD CONSTRAINT "ordenes_cliente_id_clientes_id_fk" FOREIGN KEY ("cliente_id") REFERENCES "public"."clientes"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "ordenes" ADD CONSTRAINT "ordenes_cupon_id_cupones_id_fk" FOREIGN KEY ("cupon_id") REFERENCES "public"."cupones"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "envios_distritos" ADD CONSTRAINT "envios_distritos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."envios"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "banners" ADD CONSTRAINT "banners_imagen_id_media_id_fk" FOREIGN KEY ("imagen_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_usuarios_fk" FOREIGN KEY ("usuarios_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categorias_fk" FOREIGN KEY ("categorias_id") REFERENCES "public"."categorias"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_marcas_fk" FOREIGN KEY ("marcas_id") REFERENCES "public"."marcas"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_productos_fk" FOREIGN KEY ("productos_id") REFERENCES "public"."productos"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_clientes_fk" FOREIGN KEY ("clientes_id") REFERENCES "public"."clientes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_ordenes_fk" FOREIGN KEY ("ordenes_id") REFERENCES "public"."ordenes"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_cupones_fk" FOREIGN KEY ("cupones_id") REFERENCES "public"."cupones"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_envios_fk" FOREIGN KEY ("envios_id") REFERENCES "public"."envios"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_suscriptores_fk" FOREIGN KEY ("suscriptores_id") REFERENCES "public"."suscriptores"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_banners_fk" FOREIGN KEY ("banners_id") REFERENCES "public"."banners"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_usuarios_fk" FOREIGN KEY ("usuarios_id") REFERENCES "public"."usuarios"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "config_tienda_header_menu_principal_sub_items" ADD CONSTRAINT "config_tienda_header_menu_principal_sub_items_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."config_tienda_header_menu_principal"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "config_tienda_header_menu_principal" ADD CONSTRAINT "config_tienda_header_menu_principal_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."config_tienda"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "config_tienda_home_secciones" ADD CONSTRAINT "config_tienda_home_secciones_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."config_tienda"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "config_tienda_footer_links_rapidos" ADD CONSTRAINT "config_tienda_footer_links_rapidos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."config_tienda"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "config_tienda_pagos_metodos" ADD CONSTRAINT "config_tienda_pagos_metodos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."config_tienda"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "config_tienda" ADD CONSTRAINT "config_tienda_logo_id_media_id_fk" FOREIGN KEY ("logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "config_tienda" ADD CONSTRAINT "config_tienda_favicon_id_media_id_fk" FOREIGN KEY ("favicon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "usuarios_sessions_order_idx" ON "usuarios_sessions" USING btree ("_order");
  CREATE INDEX "usuarios_sessions_parent_id_idx" ON "usuarios_sessions" USING btree ("_parent_id");
  CREATE INDEX "usuarios_updated_at_idx" ON "usuarios" USING btree ("updated_at");
  CREATE INDEX "usuarios_created_at_idx" ON "usuarios" USING btree ("created_at");
  CREATE UNIQUE INDEX "usuarios_email_idx" ON "usuarios" USING btree ("email");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "media" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_banner_sizes_banner_filename_idx" ON "media" USING btree ("sizes_banner_filename");
  CREATE INDEX "categorias_slug_idx" ON "categorias" USING btree ("slug");
  CREATE INDEX "categorias_imagen_idx" ON "categorias" USING btree ("imagen_id");
  CREATE INDEX "categorias_categoria_padre_idx" ON "categorias" USING btree ("categoria_padre_id");
  CREATE INDEX "categorias_orden_idx" ON "categorias" USING btree ("orden");
  CREATE INDEX "categorias_activa_idx" ON "categorias" USING btree ("activa");
  CREATE INDEX "categorias_updated_at_idx" ON "categorias" USING btree ("updated_at");
  CREATE INDEX "categorias_created_at_idx" ON "categorias" USING btree ("created_at");
  CREATE INDEX "marcas_slug_idx" ON "marcas" USING btree ("slug");
  CREATE INDEX "marcas_logo_idx" ON "marcas" USING btree ("logo_id");
  CREATE INDEX "marcas_activa_idx" ON "marcas" USING btree ("activa");
  CREATE INDEX "marcas_updated_at_idx" ON "marcas" USING btree ("updated_at");
  CREATE INDEX "marcas_created_at_idx" ON "marcas" USING btree ("created_at");
  CREATE INDEX "productos_imagenes_order_idx" ON "productos_imagenes" USING btree ("_order");
  CREATE INDEX "productos_imagenes_parent_id_idx" ON "productos_imagenes" USING btree ("_parent_id");
  CREATE INDEX "productos_imagenes_imagen_idx" ON "productos_imagenes" USING btree ("imagen_id");
  CREATE INDEX "productos_tallas_order_idx" ON "productos_tallas" USING btree ("_order");
  CREATE INDEX "productos_tallas_parent_id_idx" ON "productos_tallas" USING btree ("_parent_id");
  CREATE INDEX "productos_slug_idx" ON "productos" USING btree ("slug");
  CREATE INDEX "productos_categoria_idx" ON "productos" USING btree ("categoria_id");
  CREATE INDEX "productos_marca_idx" ON "productos" USING btree ("marca_id");
  CREATE INDEX "productos_segmento_idx" ON "productos" USING btree ("segmento");
  CREATE INDEX "productos_imagen_principal_idx" ON "productos" USING btree ("imagen_principal_id");
  CREATE INDEX "productos_etiqueta_idx" ON "productos" USING btree ("etiqueta");
  CREATE INDEX "productos_destacado_idx" ON "productos" USING btree ("destacado");
  CREATE INDEX "productos_activo_idx" ON "productos" USING btree ("activo");
  CREATE INDEX "productos_updated_at_idx" ON "productos" USING btree ("updated_at");
  CREATE INDEX "productos_created_at_idx" ON "productos" USING btree ("created_at");
  CREATE INDEX "clientes_updated_at_idx" ON "clientes" USING btree ("updated_at");
  CREATE INDEX "clientes_created_at_idx" ON "clientes" USING btree ("created_at");
  CREATE INDEX "ordenes_items_order_idx" ON "ordenes_items" USING btree ("_order");
  CREATE INDEX "ordenes_items_parent_id_idx" ON "ordenes_items" USING btree ("_parent_id");
  CREATE INDEX "ordenes_items_producto_idx" ON "ordenes_items" USING btree ("producto_id");
  CREATE UNIQUE INDEX "ordenes_numero_pedido_idx" ON "ordenes" USING btree ("numero_pedido");
  CREATE UNIQUE INDEX "ordenes_codigo_correlacion_idx" ON "ordenes" USING btree ("codigo_correlacion");
  CREATE INDEX "ordenes_cliente_idx" ON "ordenes" USING btree ("cliente_id");
  CREATE INDEX "ordenes_cupon_idx" ON "ordenes" USING btree ("cupon_id");
  CREATE INDEX "ordenes_estado_comercial_idx" ON "ordenes" USING btree ("estado_comercial");
  CREATE INDEX "ordenes_estado_pago_idx" ON "ordenes" USING btree ("estado_pago");
  CREATE INDEX "ordenes_external_order_id_idx" ON "ordenes" USING btree ("external_order_id");
  CREATE INDEX "ordenes_payment_reference_idx" ON "ordenes" USING btree ("payment_reference");
  CREATE INDEX "ordenes_updated_at_idx" ON "ordenes" USING btree ("updated_at");
  CREATE INDEX "ordenes_created_at_idx" ON "ordenes" USING btree ("created_at");
  CREATE INDEX "cupones_updated_at_idx" ON "cupones" USING btree ("updated_at");
  CREATE INDEX "cupones_created_at_idx" ON "cupones" USING btree ("created_at");
  CREATE INDEX "envios_distritos_order_idx" ON "envios_distritos" USING btree ("_order");
  CREATE INDEX "envios_distritos_parent_id_idx" ON "envios_distritos" USING btree ("_parent_id");
  CREATE INDEX "envios_updated_at_idx" ON "envios" USING btree ("updated_at");
  CREATE INDEX "envios_created_at_idx" ON "envios" USING btree ("created_at");
  CREATE INDEX "suscriptores_updated_at_idx" ON "suscriptores" USING btree ("updated_at");
  CREATE INDEX "suscriptores_created_at_idx" ON "suscriptores" USING btree ("created_at");
  CREATE INDEX "banners_imagen_idx" ON "banners" USING btree ("imagen_id");
  CREATE INDEX "banners_orden_idx" ON "banners" USING btree ("orden");
  CREATE INDEX "banners_activo_idx" ON "banners" USING btree ("activo");
  CREATE INDEX "banners_updated_at_idx" ON "banners" USING btree ("updated_at");
  CREATE INDEX "banners_created_at_idx" ON "banners" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_usuarios_id_idx" ON "payload_locked_documents_rels" USING btree ("usuarios_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_categorias_id_idx" ON "payload_locked_documents_rels" USING btree ("categorias_id");
  CREATE INDEX "payload_locked_documents_rels_marcas_id_idx" ON "payload_locked_documents_rels" USING btree ("marcas_id");
  CREATE INDEX "payload_locked_documents_rels_productos_id_idx" ON "payload_locked_documents_rels" USING btree ("productos_id");
  CREATE INDEX "payload_locked_documents_rels_clientes_id_idx" ON "payload_locked_documents_rels" USING btree ("clientes_id");
  CREATE INDEX "payload_locked_documents_rels_ordenes_id_idx" ON "payload_locked_documents_rels" USING btree ("ordenes_id");
  CREATE INDEX "payload_locked_documents_rels_cupones_id_idx" ON "payload_locked_documents_rels" USING btree ("cupones_id");
  CREATE INDEX "payload_locked_documents_rels_envios_id_idx" ON "payload_locked_documents_rels" USING btree ("envios_id");
  CREATE INDEX "payload_locked_documents_rels_suscriptores_id_idx" ON "payload_locked_documents_rels" USING btree ("suscriptores_id");
  CREATE INDEX "payload_locked_documents_rels_banners_id_idx" ON "payload_locked_documents_rels" USING btree ("banners_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_usuarios_id_idx" ON "payload_preferences_rels" USING btree ("usuarios_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "config_tienda_header_menu_principal_sub_items_order_idx" ON "config_tienda_header_menu_principal_sub_items" USING btree ("_order");
  CREATE INDEX "config_tienda_header_menu_principal_sub_items_parent_id_idx" ON "config_tienda_header_menu_principal_sub_items" USING btree ("_parent_id");
  CREATE INDEX "config_tienda_header_menu_principal_order_idx" ON "config_tienda_header_menu_principal" USING btree ("_order");
  CREATE INDEX "config_tienda_header_menu_principal_parent_id_idx" ON "config_tienda_header_menu_principal" USING btree ("_parent_id");
  CREATE INDEX "config_tienda_home_secciones_order_idx" ON "config_tienda_home_secciones" USING btree ("_order");
  CREATE INDEX "config_tienda_home_secciones_parent_id_idx" ON "config_tienda_home_secciones" USING btree ("_parent_id");
  CREATE INDEX "config_tienda_footer_links_rapidos_order_idx" ON "config_tienda_footer_links_rapidos" USING btree ("_order");
  CREATE INDEX "config_tienda_footer_links_rapidos_parent_id_idx" ON "config_tienda_footer_links_rapidos" USING btree ("_parent_id");
  CREATE INDEX "config_tienda_pagos_metodos_order_idx" ON "config_tienda_pagos_metodos" USING btree ("_order");
  CREATE INDEX "config_tienda_pagos_metodos_parent_id_idx" ON "config_tienda_pagos_metodos" USING btree ("_parent_id");
  CREATE INDEX "config_tienda_logo_idx" ON "config_tienda" USING btree ("logo_id");
  CREATE INDEX "config_tienda_favicon_idx" ON "config_tienda" USING btree ("favicon_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "usuarios_sessions" CASCADE;
  DROP TABLE "usuarios" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "categorias" CASCADE;
  DROP TABLE "marcas" CASCADE;
  DROP TABLE "productos_imagenes" CASCADE;
  DROP TABLE "productos_tallas" CASCADE;
  DROP TABLE "productos" CASCADE;
  DROP TABLE "clientes" CASCADE;
  DROP TABLE "ordenes_items" CASCADE;
  DROP TABLE "ordenes" CASCADE;
  DROP TABLE "cupones" CASCADE;
  DROP TABLE "envios_distritos" CASCADE;
  DROP TABLE "envios" CASCADE;
  DROP TABLE "suscriptores" CASCADE;
  DROP TABLE "banners" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "config_tienda_header_menu_principal_sub_items" CASCADE;
  DROP TABLE "config_tienda_header_menu_principal" CASCADE;
  DROP TABLE "config_tienda_home_secciones" CASCADE;
  DROP TABLE "config_tienda_footer_links_rapidos" CASCADE;
  DROP TABLE "config_tienda_pagos_metodos" CASCADE;
  DROP TABLE "config_tienda" CASCADE;
  DROP TYPE "public"."enum_usuarios_rol";
  DROP TYPE "public"."enum_productos_segmento";
  DROP TYPE "public"."enum_productos_etiqueta";
  DROP TYPE "public"."enum_clientes_etiqueta";
  DROP TYPE "public"."enum_ordenes_metodo_entrega";
  DROP TYPE "public"."enum_ordenes_metodo_pago";
  DROP TYPE "public"."enum_ordenes_estado_comercial";
  DROP TYPE "public"."enum_ordenes_estado_pago";
  DROP TYPE "public"."enum_cupones_tipo";
  DROP TYPE "public"."enum_config_tienda_home_secciones_key";
  DROP TYPE "public"."enum_config_tienda_pagos_metodos_codigo";`)
}
