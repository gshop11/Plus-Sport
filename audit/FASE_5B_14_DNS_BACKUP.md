# FASE 5B.14 — Respaldo DNS previo a migración (plussport.pe)

> Ver también: [FASE 5B.14A — Verificación de correo en Contabo](#fase-5b14a--verificación-final-de-correo-en-contabo) al final de este documento.

Fecha de respaldo: 2026-07-07
Ejecutado por: Claude Sonnet 5 (segunda línea / revisor independiente, sesión Vercel ya autenticada)
Alcance: solo lectura. Ningún registro fue modificado.

## Proveedor DNS detectado

- Zona `plussport.pe` alojada en **BanaHosting** (nameservers actuales, confirmados vía SOA/NS en 3 resolvers: sistema, 1.1.1.1, 8.8.8.8):
  - `ns7114.banahosting.com` (50.31.174.131)
  - `ns7115.banahosting.com` (50.31.174.132)
- SOA: `ns7114.banahosting.com. support.banahosting.com. 2026070704 ...`
- No hay sesión autenticada de Claude Code hacia el panel de BanaHosting. No se dispone de credenciales ni de acceso de navegador a ese panel en esta sesión.

## Estado en Vercel (proyecto plus-sport-mkar)

- Project ID: `prj_lqhgGX5ddoyr5CF3INVOJnaVcRiO`
- Team: `gshop11s-projects` (team_0WzvT96IcxfKEA3lOLfoU0vC)
- Deployment `dpl_7uJdkWibncDhJQUupVSffhPgpUMC`: status **Ready**, target **production**, commit `2154a475fa44456cb6d6d8da3aa4aed17e3bc692`, rama `stabilize/next16-payload385`.
- Aliases ya asignados al deployment: `plussport.pe`, `www.plussport.pe`, `plus-sport-mkar.vercel.app`, `plus-sport-mkar-gshop11s-projects.vercel.app`, `plus-sport-mkar-gshop11-gshop11s-projects.vercel.app`.
- `vercel domains inspect plussport.pe` → **WARNING: dominio no configurado correctamente**. Vercel exige una de estas dos opciones:
  - a) (recomendada) `A plussport.pe 76.76.21.21`
  - b) Cambiar nameservers a `ns1.vercel-dns.com` / `ns2.vercel-dns.com`
- `vercel domains inspect www.plussport.pe` → mismo estado, exige `A www.plussport.pe 76.76.21.21` (opción a) o el cambio de nameservers (opción b).
- No hay certificado emitido todavía porque el dominio no apunta a Vercel.

## Registros DNS actuales (previos a cualquier cambio), verificados en 3 resolvers

Consultados con resolver del sistema, 1.1.1.1 y 8.8.8.8 (coincidentes), más Cloudflare DNS-over-HTTPS para CAA/DMARC.

| Registro | Host | Valor actual | TTL |
|---|---|---|---|
| A | `plussport.pe` | `109.205.177.51` | 14400s |
| CNAME | `www.plussport.pe` | `plussport.pe.` | 14400s |
| AAAA | `plussport.pe` | (no existe) | — |
| AAAA | `www.plussport.pe` | (no existe) | — |
| NS | `plussport.pe` | `ns7114.banahosting.com`, `ns7115.banahosting.com` | 86400s |
| MX | `plussport.pe` | `0 plussport.pe.` (el propio apex es el mail exchanger) | 14400s |
| TXT (SPF) | `plussport.pe` | `v=spf1 ip4:50.31.174.130 +a +mx include:relay.mailchannels.net ~all` | 14400s |
| TXT (`_dmarc`) | `_dmarc.plussport.pe` | no existe (NXDOMAIN) | — |
| CAA | `plussport.pe` | no existe (sin restricción, sin conflicto) | — |

Host actual `109.205.177.51` corresponde presuntamente al servidor anterior (Contabo/Coolify según contexto de fase), pendiente de confirmación adicional si se requiere — no fue necesario para esta verificación porque el conflicto ya quedó demostrado por DNS (el A record no apunta a `76.76.21.21`).

## Riesgo material detectado: registros de correo dependen del apex

El MX de `plussport.pe` es **el propio nombre de dominio raíz** (`0 plussport.pe.`), no un host de correo dedicado (p. ej. `mail.plussport.pe`). Esto significa que **el registro A del apex sirve simultáneamente para web y para la resolución de correo**. Si se cambia el A de `plussport.pe` a `76.76.21.21` (IP de borde de Vercel, que no acepta SMTP), la entrega de correo hacia `@plussport.pe` se rompería de inmediato (rebotes), porque el MX resolvería a una IP sin servicio SMTP.

Adicionalmente, el TXT de SPF usa los mecanismos `+a` y `+mx`, que se resuelven dinámicamente contra los registros A/MX vigentes del dominio — un cambio en el A del apex altera también el resultado de estas comprobaciones SPF.

La IP real del servidor de correo (según el SPF) es `50.31.174.130`, **distinta** de la IP web actual `109.205.177.51`. Esto confirma que existe infraestructura de correo separada que depende indirectamente del apex vía el MX.

## Procedimiento de rollback (si se llegara a modificar)

Si en una fase posterior se autoriza y ejecuta el cambio, para revertir bastaría con restaurar en BanaHosting:

```
A     plussport.pe        109.205.177.51   TTL 14400
CNAME www.plussport.pe    plussport.pe.    TTL 14400
```

(MX, SPF/TXT, NS y ausencia de CAA/AAAA se mantienen sin cambios en todo momento; no se modifican en este respaldo).

---

## FASE 5B.14A — Verificación final de correo en Contabo

Fecha: 2026-07-07. Solo lectura. Ninguna modificación realizada en ningún servidor.

### IP inspeccionada

- **109.205.177.51** — IP a la que apunta actualmente `A plussport.pe` (la que Vercel pide reemplazar).

### Acceso disponible en este entorno

- Config SSH local con dos identidades:
  - `gshop-contabo-legacy` → `109.205.177.51`, clave `gshop_contabo_ed25519`.
  - `gshop-contabo` → `213.136.85.57`, clave `gshop_contabo_current_ed25519`.
- Handshake SSH contra `109.205.177.51` se completa correctamente (verificación de host key exitosa, sin indicios de MITM: la ed25519 host key vigente coincide con una ya registrada de una sesión anterior de este mismo proyecto).
- **Autenticación rechazada** con ambas claves disponibles: `Permission denied (publickey,password)`. No existe en este entorno ninguna clave autorizada para `root@109.205.177.51`, y no se intentó autenticación por contraseña (no hay canal interactivo real que evite que yo vea la contraseña, y las instrucciones de la fase prohíben imprimirla).
- No se encontró ningún token/credencial de la API o panel de Contabo guardado localmente para consultar de forma alternativa qué servidor es "el" servidor de Plus Sport.

### Verificación cruzada en el otro host accesible (213.136.85.57)

Sí tengo acceso funcional a `213.136.85.57` (alias `gshop-contabo`, hostname `vmi3301361`), pero **no es el host al que apunta el DNS de `plussport.pe`**. Se inspeccionó solo para descartar si por error alojaba correo de Plus Sport:

- `docker ps`: únicamente contenedores `redis_nortego_pe`, `supervisor_nortego_pe`, `mariadb_nortego_pe`, `nginx_nortego_pe`, `scheduling_nortego_pe`, `fpm_nortego_pe`, `proxy-proxy-1` — **todos pertenecen a otro cliente (NorteGo)**, no a Plus Sport.
- `grep -rIl plussport` en `/etc`, `/root`, `/home`: **0 coincidencias**.
- `systemctl list-units` filtrado por `postfix|exim|dovecot|sendmail|mail`: **0 servicios**.
- `ss -tlnp` en puertos 25/465/587/110/143/993/995: **0 puertos en escucha**.

Por aislamiento estricto entre clientes, no se profundizó más en este servidor — no es de Plus Sport y no debe mezclarse con esta verificación.

### Evidencia mínima recopilada

- No se pudo inspeccionar directamente `109.205.177.51` (el host real de `plussport.pe`) por falta de credenciales autorizadas en este entorno.
- El único otro host Contabo accesible no tiene ningún rastro de `plussport.pe` ni de servicios de correo (pertenece a otro cliente).
- Por tanto no hay evidencia positiva de buzones/reenvíos activos en ningún host que pude inspeccionar, pero tampoco pude confirmar ni descartar el estado real de `109.205.177.51`.

### Clasificación final

**UNDETERMINED** — no fue posible demostrarlo. El host que realmente importa (`109.205.177.51`, el que resuelve el MX de `plussport.pe`) no fue accesible con las credenciales disponibles en este entorno. El único servidor Contabo alcanzable es de otro cliente y no aporta evidencia sobre `plussport.pe`.

### Riesgo de cambiar el A del apex a Vercel (76.76.21.21), dado este resultado

El riesgo señalado en FASE 5B.14 **se mantiene sin poder descartarse**: como `MX plussport.pe -> plussport.pe` (el propio apex), cambiar el A del apex a `76.76.21.21` cambiaría también dónde intenta entregarse el correo de `@plussport.pe`. BanaHosting confirma 0 cuentas/reenviadores en su panel de correo, lo cual reduce el riesgo, pero no lo elimina por completo porque:
- No se pudo confirmar si `109.205.177.51` recibe correo por una vía distinta a la gestionada por BanaHosting (por ejemplo, un MTA propio en el VPS aceptando el puerto 25 directamente, sin pasar por el panel de correo de BanaHosting).
- El SPF (`ip4:50.31.174.130 +a +mx ...`) apunta a una IP de correo (`50.31.174.130`) que **no es ni `109.205.177.51` ni `213.136.85.57`** — es una tercera IP no verificada en esta fase, posiblemente de un proveedor de correo externo (relay/hosting de correo separado del VPS web). Esa IP no depende del A del apex y no se vería afectada por el cambio propuesto, lo cual es una señal favorable, pero no fue verificada de forma independiente en esta fase.

### Modificaciones realizadas

Ninguna. No se modificó DNS, correo, Docker, firewall, ni ningún archivo de configuración en ningún servidor. Único artefacto nuevo: este documento de auditoría.

---

## FASE 5B.14B — Provisión y validación SSL del dominio

Fecha: 2026-07-07. DNS ya apuntaba a `76.76.21.21` (confirmado en 1.1.1.1, 8.8.8.8 y resolver del sistema). No se tocó DNS ni se creó deployment ni se ejecutó `vercel --prod`.

### Estado del dominio antes de actuar

- `vercel domains inspect plussport.pe` / `www.plussport.pe`: sin advertencia de configuración (a diferencia de FASE 5B.14, ya no aparece el WARNING de A record incorrecto).
- `vercel certs ls`: **ningún certificado existente** ("No certificates found").
- `curl -kI https://plussport.pe`: 404 (edge sin cert propio todavía).
- `curl -kI https://www.plussport.pe`: fallo de handshake TLS.
- Primer intento de `openssl s_client` contra el apex conectó erróneamente a `109.205.177.51` (el host viejo) por **caché DNS local de Windows**, residual de la verificación de la fase anterior — no por un problema real de DNS. Se resolvió con `ipconfig /flushdns`; tras esto todos los resolvers y `openssl` conectan a `76.76.21.21`.

### Certificado emitido

- Comando: `vercel certs issue plussport.pe www.plussport.pe`.
- Resultado: `cert_EwlDJG7fApnAM5qj7FaKKiHh`, nombres cubiertos `plussport.pe` y `www.plussport.pe`, expira en 90 días, renovación automática.
- Emisor real (verificado con `openssl s_client`): **Let's Encrypt (CN=YR2)**, cadena hasta `ISRG Root X1`, `verify return:1` en los 4 niveles (confiable). Vigencia: `2026-07-07` a `2026-10-05`.
- No se eliminó ningún certificado (no existía ninguno previo).

### Resultados HTTP (sin `-k`, validación real de cadena)

| Ruta | Resultado |
|---|---|
| `http://plussport.pe` | `308 Permanent Redirect` → `https://plussport.pe/` |
| `https://plussport.pe` | `200 OK`, `Server: Vercel`, `X-Powered-By: Next.js, Payload` |
| `https://www.plussport.pe` | `200 OK` |
| `https://plussport.pe/productos` | `200 OK` |
| `https://plussport.pe/categorias` | `200 OK` (prerender) |
| `https://plussport.pe/producto/convert-ti5591796` (producto real) | `200 OK` |
| `https://plussport.pe/api/storefront-config` | `200 OK`, `Content-Type: application/json` |

Ya no aparece `SEC_E_UNTRUSTED_ROOT` en ninguna ruta. `sitemap.xml` devuelve 404 (no relacionado con el certificado; el proyecto no tiene sitemap generado — fuera de alcance de esta fase).

### Errores

Ninguno bloqueante. El único "error" fue el falso positivo de `openssl` por caché DNS local, resuelto con `ipconfig /flushdns` (operación puramente local, no afecta producción).

### Modificaciones realizadas

- Se emitió 1 certificado SSL en Vercel para `plussport.pe` + `www.plussport.pe` (`vercel certs issue`).
- Se vació la caché DNS local de Windows en esta máquina (`ipconfig /flushdns`) — sin efecto en producción ni en otros clientes.
- No se tocó DNS, código, Git, base de datos, Payload, ni se creó un nuevo deployment.

### Riesgos residuales

- Certificado válido por 90 días con renovación automática gestionada por Vercel — sin acción pendiente mientras el dominio siga apuntando a Vercel.
- El riesgo de correo señalado en FASE 5B.14 / 5B.14A (MX = apex) sigue vigente y sin resolver de forma independiente a esto — no fue tocado en esta fase.
- `sitemap.xml` ausente (404): no es un riesgo de esta fase, pero queda como hallazgo menor para una fase de SEO si se requiere.
