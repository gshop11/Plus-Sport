# Despliegue en VPS Linux

Guia para desplegar PlusSport en Ubuntu con Next.js, Payload CMS y PostgreSQL.

## Estado de esta fase

- Este documento cubre infraestructura y despliegue VPS (runtime, base de datos, media, proceso y reverse proxy).
- El flujo de pagos Izipay sandbox/webhook se documenta en `README_IZIPAY.md`.

## Requisitos recomendados

- Ubuntu 22.04 LTS o 24.04 LTS.
- Node.js 24.x compatible con `package.json`.
- npm 11.x.
- PostgreSQL 15 o superior.
- nginx.
- Certbot para SSL.
- PM2 o systemd para mantener el proceso activo.

## 1. Preparar servidor

```bash
sudo apt update
sudo apt upgrade -y
sudo apt install -y curl git build-essential nginx postgresql postgresql-contrib
```

Instalar Node.js 24.x con NodeSource:

```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

## 2. Crear base de datos PostgreSQL

```bash
sudo -u postgres psql
```

Dentro de `psql`:

```sql
CREATE DATABASE plussport;
CREATE USER plussport_user WITH ENCRYPTED PASSWORD 'REEMPLAZAR_PASSWORD_SEGURO';
GRANT ALL PRIVILEGES ON DATABASE plussport TO plussport_user;
\c plussport
GRANT ALL ON SCHEMA public TO plussport_user;
\q
```

Cadena de conexion esperada:

```bash
postgresql://plussport_user:REEMPLAZAR_PASSWORD_SEGURO@127.0.0.1:5432/plussport
```

## 3. Subir o clonar el proyecto

Si esta carpeta todavia no tiene Git inicializado, inicializalo antes de subir a un remoto:

```bash
git init
git add .
git commit -m "Prepare VPS deployment"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
git push -u origin main
```

En el VPS:

```bash
sudo mkdir -p /var/www/plussport
sudo chown -R "$USER":"$USER" /var/www/plussport
git clone https://github.com/TU_USUARIO/TU_REPO.git /var/www/plussport/app
cd /var/www/plussport/app
```

## 4. Configurar variables de entorno

Crear `.env.production`:

```bash
cp .env.example .env.production
nano .env.production
```

Valores minimos para VPS:

```bash
NODE_ENV=production
NEXT_PUBLIC_SERVER_URL=https://tudominio.com
PAYLOAD_SECRET=REEMPLAZAR_CON_SECRETO_ALEATORIO_DE_32_CARACTERES_O_MAS
DATABASE_URI=postgresql://plussport_user:REEMPLAZAR_PASSWORD_SEGURO@127.0.0.1:5432/plussport
PAYLOAD_DB_PUSH=false
PORT=3000
```

Reglas:

- `PAYLOAD_SECRET` no puede ser placeholder y debe tener minimo 32 caracteres.
- `DATABASE_URI` es obligatorio en production.
- SQLite queda solo para desarrollo local.
- `NEXT_PUBLIC_SERVER_URL` debe ser la URL publica final.

## 5. Instalar dependencias y compilar

```bash
cd /var/www/plussport/app
npm ci
```

Antes de `npm run build`, la base PostgreSQL debe tener el esquema esperado porque algunas rutas leen Payload durante el prerender.

Si es el primer despliegue y la base esta vacia, existen dos caminos:

- Recomendado para operacion controlada: crear una migracion formal de Payload/Drizzle y aplicarla antes del build.
- Temporal para bootstrap inicial: configurar `PAYLOAD_DB_PUSH=true` solo durante el primer build/arranque, verificar que el esquema se cree, y volver a `PAYLOAD_DB_PUSH=false`.

No se recomienda dejar `PAYLOAD_DB_PUSH=true` permanentemente en production porque puede aplicar cambios automaticos de esquema al arrancar.

Compilar:

```bash
npm run build
```

## 6. Media y persistencia

Estado actual:

- Sin `BLOB_READ_WRITE_TOKEN`, Payload guarda uploads en `public/media`.
- `public/media` esta ignorado por Git salvo `.gitkeep`.
- Si se borra el directorio de deploy o se redepliega desde cero, se pierden archivos subidos si no hay volumen/backup.

Estrategia VPS con disco local:

```bash
sudo mkdir -p /var/www/plussport/shared/media
sudo chown -R "$USER":"$USER" /var/www/plussport/shared

if [ -d /var/www/plussport/app/public/media ] && [ ! -L /var/www/plussport/app/public/media ]; then
  cp -a /var/www/plussport/app/public/media/. /var/www/plussport/shared/media/ 2>/dev/null || true
  mv /var/www/plussport/app/public/media "/var/www/plussport/app/public/media.backup.$(date +%Y%m%d%H%M%S)"
fi

ln -sfn /var/www/plussport/shared/media /var/www/plussport/app/public/media
```

No borres uploads existentes sin backup verificado.

Estrategia con storage externo:

- Configurar `BLOB_READ_WRITE_TOKEN` si se decide mantener Vercel Blob.
- Configurar `NEXT_PUBLIC_MEDIA_BASE_URL` o `MEDIA_BASE_URL` si las imagenes se sirven desde un dominio/CDN externo.
- En VPS puro, Vercel Blob funciona como dependencia externa; si no se desea depender de Vercel, usar volumen persistente local.

## 7. Ejecutar con PM2

```bash
sudo npm install -g pm2
cd /var/www/plussport/app
pm2 start npm --name plussport -- run start
pm2 save
pm2 startup systemd
```

Verificar proceso:

```bash
pm2 status
pm2 logs plussport
curl -i http://127.0.0.1:3000/api/health
```

## 8. nginx reverse proxy

Crear `/etc/nginx/sites-available/plussport`:

```nginx
server {
    listen 80;
    server_name tudominio.com www.tudominio.com;

    client_max_body_size 25m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Activar:

```bash
sudo ln -s /etc/nginx/sites-available/plussport /etc/nginx/sites-enabled/plussport
sudo nginx -t
sudo systemctl reload nginx
```

## 9. SSL con Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d tudominio.com -d www.tudominio.com
sudo systemctl reload nginx
```

Verificar renovacion:

```bash
sudo certbot renew --dry-run
```

## 10. Reinicio y verificacion

```bash
pm2 restart plussport
curl -i https://tudominio.com/api/health
curl -I https://tudominio.com
```

Validaciones minimas:

- `/api/health` responde `200`.
- Home responde `200`.
- Admin de Payload carga en `/admin`.
- Se puede iniciar sesion en Payload con usuario admin.
- Se puede subir una imagen y permanece despues de reiniciar PM2.
- PostgreSQL conserva productos, clientes y ordenes.
- `.env.production` no esta versionado.

## Checklist de produccion

- [ ] Repo Git inicializado y remoto verificado.
- [ ] `.env.production` creado con secretos reales.
- [ ] `PAYLOAD_SECRET` fuerte, unico y fuera de Git.
- [ ] `DATABASE_URI` apunta a PostgreSQL, no SQLite.
- [ ] `PAYLOAD_DB_PUSH=false` despues del bootstrap inicial.
- [ ] Backup automatico de PostgreSQL configurado.
- [ ] Backup o volumen persistente para `public/media`.
- [ ] `npm ci` ejecutado sin errores.
- [ ] `npm run build` ejecutado sin errores.
- [ ] PM2 o systemd mantiene el proceso activo.
- [ ] nginx sirve el dominio final.
- [ ] SSL activo con Certbot.
- [ ] Healthcheck publicado en `/api/health`.
- [ ] Logs revisables con `pm2 logs plussport` o journald.

## Relacion con flujo de pagos

- La integracion sandbox y webhook de Izipay vive en `README_IZIPAY.md`.
- Antes de deploy real en VPS/staging, ejecutar el checklist de QA de `README_IZIPAY.md`.

## Riesgos pendientes fuera de infraestructura

- Alinear codigos/estados definitivos Izipay live antes de pasar a credenciales de produccion.
- Reforzar estrategia de migraciones versionadas (evitar depender de pushes automaticos).
- Definir monitoreo/alertas de conciliacion de pagos y reintentos webhook.


