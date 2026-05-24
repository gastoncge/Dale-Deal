# Deploy Dale Deal — guía paso a paso

Guía operativa para lanzar **frontend** + **backend** + **dominio** a producción.
Asume que ya tenés cuenta en Vercel, Railway, Cloudflare y GitHub.

**Tiempo estimado:** 2–3 horas la primera vez (con paciencia).

---

## 0. Antes de empezar — checklist de prerrequisitos

- [ ] Cuenta en **GitHub** con acceso a los dos repos:
  - Frontend: `gastoncge/Dale-Deal`
  - Backend: `gracianoponce/daledeal-backend`
- [ ] Cuenta en **Vercel** (frontend) o Netlify o Cloudflare Pages — cualquier hosting estático
- [ ] Cuenta en **Railway** (backend) o Render o Fly.io — cualquier hosting de Node
- [ ] Cuenta en **Cloudflare** (DNS) — ya configurada según las conversaciones previas
- [ ] **Dominio** `daledeal.com.ar` registrado en NIC.ar con nameservers apuntando a Cloudflare
- [ ] **Cuentas de servicios externos**:
  - [ ] Resend (envío de emails) — `RESEND_API_KEY`
  - [ ] Mercado Pago **producción** (no sandbox) — `MP_ACCESS_TOKEN`, `MP_PUBLIC_KEY`, `MP_WEBHOOK_SECRET`
- [ ] Local: poder correr `npm run build` en frontend y `npm test` en backend sin errores

---

## 1. Backend (Railway) — primer deploy

El backend Node + Postgres se sube a Railway. Railway tiene un free tier que alcanza para arrancar.

### 1.1 Crear el proyecto

1. Entrar a https://railway.app/new
2. **Deploy from GitHub repo** → seleccionar `gracianoponce/daledeal-backend`
3. Railway detecta `package.json` y mete el build con `npm install && npm start`. No tocar.

### 1.2 Agregar Postgres

1. En el proyecto recién creado: **New → Database → Add PostgreSQL**
2. Railway inyecta automáticamente `DATABASE_URL` como env var en el servicio Node
3. Esperar 30 seg a que Postgres esté listo (luz verde)

### 1.3 Cargar el schema

```bash
# Desde local, conectarse al Postgres de Railway
psql "$(railway variables get DATABASE_URL)" -f db/schema.sql
psql "$(railway variables get DATABASE_URL)" -f db/migrations/002_payments.sql
psql "$(railway variables get DATABASE_URL)" -f db/migrations/006_indexes.sql
# Aplicá las demás migraciones que estén en db/migrations/ en orden:
for m in db/migrations/*.sql; do
  psql "$(railway variables get DATABASE_URL)" -f "$m"
done
```

> Alternativa: instalar `railway CLI` (`brew install railway`) y `railway run psql -f db/schema.sql`.

### 1.4 Configurar env vars en Railway

En la UI de Railway → tu servicio → **Variables** → agregar (NO copies estos valores literales, son ejemplo):

| Variable | Valor de producción | Notas |
|---|---|---|
| `NODE_ENV` | `production` | **CRÍTICO** — sin esto el CORS queda abierto |
| `PORT` | `3000` (Railway lo override) | déjalo igual |
| `JWT_SECRET` | `<64 chars random>` | `openssl rand -hex 32` |
| `JWT_EXPIRES_IN` | `7d` | |
| `FRONTEND_URL` | `https://daledeal.com.ar` | CORS whitelist. Múltiples separados por coma |
| `APP_BASE_URL` | `https://<tu-app>.up.railway.app` | Railway te da esta URL después del deploy |
| `RESEND_API_KEY` | `re_xxxxx` | de https://resend.com/api-keys |
| `RESEND_FROM` | `Dale Deal <hola@daledeal.com.ar>` | el dominio debe estar verificado en Resend |
| `MP_ACCESS_TOKEN` | `APP_USR-xxxxxx` | **PRODUCCIÓN**, NO el de test |
| `MP_PUBLIC_KEY` | `APP_USR-xxxxxx` | |
| `MP_WEBHOOK_SECRET` | `<MP webhook secret>` | de MP → Tu integración → Webhooks |
| `MP_ENVIRONMENT` | `production` | si tu código lee este flag |

### 1.5 Verificar el deploy

Railway te da una URL tipo `https://daledeal-backend-production-xxxx.up.railway.app`.

```bash
# 1. Healthcheck
curl https://daledeal-backend-production-xxxx.up.railway.app/health
# Esperado: {"status":"ok"}

# 2. Endpoint público
curl https://daledeal-backend-production-xxxx.up.railway.app/products
# Esperado: {"data":[],"pagination":{...}}  ← array vacío hasta que cargues productos

# 3. Verificar headers de seguridad
curl -I https://daledeal-backend-production-xxxx.up.railway.app/
# Esperado: ver X-Frame-Options, X-Content-Type-Options, etc.
```

Si los tres responden bien, el backend está vivo. Copiá la URL — la vas a usar en el frontend.

---

## 2. Frontend (Vercel) — primer deploy

### 2.1 Actualizar la URL del backend en `JS/api.js`

**ANTES de pushear a deploy**, abrir `JS/api.js` y editar la función `getApiUrl()`:

```javascript
function getApiUrl() {
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1') {
    return 'http://localhost:3000';
  }
  // ← CAMBIAR ESTA LÍNEA con la URL real de Railway:
  return 'https://daledeal-backend-production-xxxx.up.railway.app';
}
```

Commit + push:
```bash
git add JS/api.js
git commit -m "config(api): URL del backend de producción"
git push origin main
```

### 2.2 Crear proyecto en Vercel

1. https://vercel.com/new → **Import Git Repository** → `gastoncge/Dale-Deal`
2. **Framework Preset**: `Other`
3. **Build Command**: `npm install && npm run build`
4. **Output Directory**: `dist`
5. **Install Command**: `npm install` (default)
6. **Node Version**: 20.x

Click **Deploy**. Tarda ~30 seg.

### 2.3 Verificar el deploy

Vercel te da una URL tipo `https://dale-deal-xxxx.vercel.app`.

```bash
# 1. Home carga
curl -I https://dale-deal-xxxx.vercel.app/
# Esperado: 200 OK + content-encoding: gzip

# 2. CSS bundle servido
curl -I https://dale-deal-xxxx.vercel.app/CSS/core.css
# Esperado: 200 + content-encoding: gzip + Cache-Control de muchos segundos
```

**Abrir https://dale-deal-xxxx.vercel.app en el browser**:
- [ ] La home carga sin errores en console
- [ ] El carousel del hero se mueve
- [ ] El navbar tiene el logo
- [ ] Las imágenes se ven (WebP/AVIF según browser)
- [ ] El theme toggle (dark mode) funciona
- [ ] Click en "Productos" navega bien
- [ ] Network tab: cero requests a `localhost:3000` o `fonts.googleapis.com`

Si todo OK, el frontend está vivo.

---

## 3. Dominio (Cloudflare DNS)

Asumiendo que ya tenés `daledeal.com.ar` apuntando a Cloudflare (nameservers en NIC.ar).

### 3.1 Agregar subdominio para el backend (recomendado)

En Cloudflare → DNS → Add record:
- **Type**: CNAME
- **Name**: `api`
- **Target**: `<tu-app>.up.railway.app` (sin `https://`)
- **Proxy**: 🟠 Proxied (naranja)
- **TTL**: Auto

Resultado: `https://api.daledeal.com.ar` apunta al backend.

### 3.2 Apuntar root al frontend (Vercel)

En Cloudflare → DNS → Add record:
- **Type**: CNAME
- **Name**: `@` (root)
- **Target**: `cname.vercel-dns.com`
- **Proxy**: ⚪ DNS only (gris) — Vercel necesita ver el origen real para el SSL
- **TTL**: Auto

> Si Cloudflare no te deja CNAME en root, usa **A record** apuntando a `76.76.21.21` (IP de Vercel). Vercel da las instrucciones exactas en su panel cuando agregás el dominio.

### 3.3 Agregar dominio en Vercel

En Vercel → tu proyecto → **Settings → Domains → Add**:
1. Escribir `daledeal.com.ar`
2. Vercel valida que el DNS apunte
3. Vercel emite cert SSL automáticamente (5–10 min)
4. También agregar `www.daledeal.com.ar` con redirect a la versión sin www

### 3.4 Actualizar env var del backend

Ahora que tenés `https://api.daledeal.com.ar`, actualizá:

```
APP_BASE_URL = https://api.daledeal.com.ar
FRONTEND_URL = https://daledeal.com.ar,https://www.daledeal.com.ar
```

Railway te re-deploya solo.

### 3.5 Actualizar `JS/api.js` con la URL final

```javascript
return 'https://api.daledeal.com.ar';
```

Commit + push → Vercel re-builda solo.

---

## 4. Servicios externos — última milla

### 4.1 Resend (emails)

1. https://resend.com → API Keys → Create
2. Copiar `re_xxxxx` a Railway env var `RESEND_API_KEY`
3. https://resend.com → Domains → Add `daledeal.com.ar`
4. Resend te da 3 DNS records (SPF, DKIM, MX) — copiarlos a Cloudflare DNS
5. Verificar dominio en Resend (puede tardar 1 hora)
6. Sin dominio verificado, los emails saldrán con `from: onboarding@resend.dev` (feo pero funciona)

### 4.2 Mercado Pago (pagos)

1. Acceder con la cuenta de producción (no sandbox) en https://mercadopago.com.ar/developers
2. Tu integración → Credentials → copiar **production** access token y public key
3. Copiarlos a Railway env vars `MP_ACCESS_TOKEN` y `MP_PUBLIC_KEY`
4. **Webhooks** → Add notification URL: `https://api.daledeal.com.ar/payments/webhook`
5. **Webhook events**: marcar `payment` (al menos)
6. **Secret**: copiar el secret generado → Railway env var `MP_WEBHOOK_SECRET`
7. Test: hacer una compra real con tarjeta de test → confirmar que llegue el webhook (Railway logs)

---

## 5. Smoke test post-deploy

Con el dominio funcionando:

```bash
# Frontend
curl -I https://daledeal.com.ar/
curl -I https://daledeal.com.ar/HTML/productos.html
curl -I https://daledeal.com.ar/IMG/LOGO.png

# Backend
curl https://api.daledeal.com.ar/health
curl https://api.daledeal.com.ar/products | head -c 200
curl -I https://api.daledeal.com.ar/admin/stats
# ↑ debería ser 401 (sin auth)

# CORS desde el frontend
curl -H "Origin: https://daledeal.com.ar" -I https://api.daledeal.com.ar/products
# ↑ debería tener Access-Control-Allow-Origin: https://daledeal.com.ar
```

### Test funcional manual (15 min)

- [ ] Registrarse con un email real → recibo el email de bienvenida
- [ ] Login con esas credenciales → entra
- [ ] Logout → redirige a home
- [ ] "Olvidé mi contraseña" → recibo el link → puedo resetear
- [ ] Como usuario: explorar productos, agregar al carrito
- [ ] Como vendedor: publicar un producto (necesita activar `seller` en DB manualmente la primera vez)
- [ ] Como comprador: comprar un producto → flujo MP → pago aprobado → email de confirmación → orden en "Mis compras"
- [ ] Como admin: entrar a `/HTML/admin.html` (tu user debe tener `role='admin'` en DB)

---

## 6. CI/CD — branch protection (recomendado)

En GitHub:

### Frontend (`gastoncge/Dale-Deal`)
- Settings → Branches → Add rule
- Branch name pattern: `main`
- ☑ Require status checks to pass: `CI` (de `.github/workflows/ci.yml`)
- ☑ Require branches to be up to date
- ☑ Do not allow bypassing the above settings

### Backend (`gracianoponce/daledeal-backend`)
- Settings → Branches → Add rule
- Branch name pattern: `main`
- ☑ Require status checks to pass: `Smoke tests`
- (Misma config)

> Mientras `wip/mp-integration` no esté merged a `main`, sumalo a la branch protection también.

---

## 7. Performance — Lighthouse post-deploy

Una vez vivo en producción real (con gzip + CDN cache de Cloudflare):

```bash
npx lighthouse https://daledeal.com.ar/ \
  --view --form-factor=mobile \
  --output=html --output-path=./lh-prod.html
```

**Esperado en producción** (basado en optimizaciones aplicadas):

| Métrica | Local sin gzip | Producción esperada |
|---|---|---|
| Performance | 65–75 | **80–90** |
| FCP | 2.85s | 1.0–1.5s |
| LCP | 5.3s | 2.0–3.0s |
| CLS | 0 | 0 |
| TBT | 0ms | 0–50ms |

Si el score real está en 80+ no toques nada más. Si está por debajo de 70, los próximos pasos a explorar:
- Critical CSS inline (probado local, ver `build.js` línea ~200)
- PurgeCSS sobre Bootstrap (-50KB)
- Self-host Bootstrap CSS bundleado en core.css

---

## 8. Monitoring (recomendado, no bloquea launch)

- **UptimeRobot** (free): monitorear `https://api.daledeal.com.ar/health` cada 5 min — te avisa por email si cae
- **Sentry** (free tier): capturar errores JS del frontend y excepciones del backend
- **Plausible Analytics** (€9/mes) o **Cloudflare Analytics** (free): traffic + page views sin cookies

---

## 9. Rollback de emergencia

### Frontend
Vercel → tu proyecto → Deployments → click en el deploy anterior → **Promote to Production**. Instantáneo.

### Backend
Railway → tu servicio → Deployments → click en el anterior → **Redeploy**. ~2 min.

### Base de datos
Railway no tiene snapshots automáticos en free tier. Recomendación:

```bash
# Backup manual diario (cron local o GitHub Action)
pg_dump "$(railway variables get DATABASE_URL)" > backup-$(date +%Y%m%d).sql
```

---

## 10. Troubleshooting rápido

| Síntoma | Causa probable | Fix |
|---|---|---|
| Frontend muestra "Cannot read property of undefined" en console | `JS/api.js` apunta a `localhost` en producción | Verificar `getApiUrl()` |
| Backend 502 Bad Gateway | `PORT` mal configurado | Railway usa `process.env.PORT`, no hardcodear |
| CORS error en browser | `FRONTEND_URL` no incluye tu dominio | Agregar `https://daledeal.com.ar` |
| Emails no llegan | `RESEND_API_KEY` faltante o dominio no verificado | Ver logs de backend con `railway logs` |
| Webhook MP no se procesa | `MP_WEBHOOK_SECRET` mal o URL no registrada en MP | Ver dashboard de MP → Webhooks → Test |
| Imágenes Unsplash no cargan | Hot-link bloqueado | Migrar a CDN propio (Cloudflare Images o R2) |
| Fonts no se ven (caen a Arial) | `IMG/fonts/` no copiado al deploy | Verificar que `dist/IMG/fonts/` existe post-build |
| Score Lighthouse <70 en prod | gzip/brotli no activo | Vercel/Netlify lo hacen automático — verificar headers |

---

## Apéndice A — Variables de entorno completas

### Backend (`.env` en producción)

```bash
# Críticas (sin estas, NO arranca o queda inseguro)
NODE_ENV=production
JWT_SECRET=<64 chars random — generar con: openssl rand -hex 32>
DATABASE_URL=postgresql://...  # inyectada por Railway
FRONTEND_URL=https://daledeal.com.ar,https://www.daledeal.com.ar
APP_BASE_URL=https://api.daledeal.com.ar

# Emails (sin esto: no envía emails de reset password, etc.)
RESEND_API_KEY=re_xxxxxxxxxx
RESEND_FROM=Dale Deal <hola@daledeal.com.ar>

# Mercado Pago (sin esto: no procesa pagos)
MP_ACCESS_TOKEN=APP_USR-xxxxxxxxxx
MP_PUBLIC_KEY=APP_USR-xxxxxxxxxx
MP_WEBHOOK_SECRET=xxxxxxxxxx

# Opcionales
JWT_EXPIRES_IN=7d
PORT=3000
```

### Frontend
No tiene `.env` — toda la config vive en `JS/api.js` (URL del backend según hostname).

---

## Apéndice B — Comandos útiles

```bash
# Local: ver el dist/ exactamente como lo verá producción
npm run build && cd dist && python3 -m http.server 5500

# Backend: ver logs en vivo
railway logs --tail

# Backend: conectarse al Postgres prod (cuidado!)
railway run psql

# Backend: ver env vars (sin valores secretos)
railway variables

# Backend: re-deploy manual
git push origin main  # CI corre tests, Railway re-deploya si pasan

# Frontend: re-deploy manual
git push origin main  # Vercel re-builda y deploya automático
```

---

**Última actualización:** 2026-05-24
**Si algo no funciona y no está acá**: pegar el error en chat y resolvemos. La mayoría de los problemas son env vars mal escritos.
