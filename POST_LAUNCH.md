# Post-launch — operatoria diaria de Dale Deal

Guía operativa para mantener el sitio sano, monitorearlo, restaurar de
backups y escalar cuando crezca. Pensada para que cualquier persona del
equipo pueda hacer las cosas sin asistencia.

---

## 1. URLs y servicios — el mapa

```
PRODUCCIÓN
├─ Frontend (Cloudflare Workers + CDN edge BsAs)
│  └─ https://daledeal.com.ar
│     └─ www.daledeal.com.ar (alias)
│
├─ Backend (Railway, Node.js + Postgres)
│  └─ https://daledeal-backend-production.up.railway.app
│     └─ api.daledeal.com.ar (cuando se agreguen los DNS records)
│
├─ Emails transaccionales
│  └─ Resend → hola@daledeal.com.ar (DKIM/SPF/DMARC verified)
│
├─ Pagos
│  └─ Mercado Pago (modo TEST, migrar a PROD cuando verifiquen identidad)
│
└─ Email inbox profesional
   └─ Hostinger (gestionado por separado)
```

### Repos GitHub

| Repo | Branch principal | URL |
|---|---|---|
| Frontend | `main` | https://github.com/gastoncge/Dale-Deal |
| Backend | `main` (mergeado desde `wip/mp-integration`) | https://github.com/gracianoponce/daledeal-backend |

---

## 2. Monitoreo diario — qué chequear

### Health checks que tenés que mirar al menos 1 vez por día

```bash
# Frontend vivo + tiempo de respuesta
curl -s -o /dev/null -w "Frontend: HTTP %{http_code} | %{time_total}s\n" https://daledeal.com.ar/

# Backend vivo + DB conectada
curl -s https://daledeal-backend-production.up.railway.app/health

# Conteo de productos en DB
curl -s "https://daledeal-backend-production.up.railway.app/products?limit=1" | \
  python3 -c "import sys,json; print('Productos:', json.load(sys.stdin)['total'])"
```

Si el frontend tarda más de 2s o el backend devuelve algo distinto a
`{"status":"ok"}`, hay algo mal.

### Alertas automáticas (recomendado activar)

**UptimeRobot** (gratis):
1. Signup en https://uptimerobot.com
2. Add New Monitor → HTTP(s)
3. URL: `https://daledeal-backend-production.up.railway.app/health`
4. Monitoring Interval: 5 minutes
5. Te avisa por email/SMS si el endpoint cae

**Sentry** (gratis hasta 5k errores/mes):
- Captura errores JS del frontend automáticamente
- Captura excepciones del backend Node
- Te llega un email cuando hay un error en producción
- Setup: ver sección 6 más abajo

**Cloudflare Web Analytics** (gratis, sin cookies):
- Dashboard CF → Analytics → Web Analytics → Add a site
- Te muestra: visitas, top pages, países, dispositivos
- NO requiere cookies (no necesita banner GDPR)

---

## 3. Backups de la base de datos

### Automático (configurar UNA vez)

Hay un workflow en `.github/workflows/db-backup.yml` (repo backend) que
hace `pg_dump` todos los días a las 00:00 ARG y sube el snapshot como
artifact de GitHub Actions (retiene 30 días).

**Setup inicial (UNA vez):**

1. Conseguir la URL pública de Postgres:
   - Railway → Postgres → Database → Connect → Public Network
   - Copiar la "Connection URL" (formato `postgresql://postgres:...@zephyr.proxy.rlwy.net:33001/railway`)

2. GitHub → repo backend → Settings → Secrets and variables → Actions → New repository secret:
   - Name: `DATABASE_URL_BACKUP`
   - Value: pegar la URL completa

3. Listo. El próximo backup corre automático esa noche a las 00:00 ARG.
   También podés triggerearlo manual: Actions → DB Backup → Run workflow.

### Restaurar de un backup

```bash
# Descargar el .sql.gz desde GitHub → Actions → seleccionar el run → Artifacts
# Después:
gunzip daledeal-backup-20260601-030000.sql.gz

# Conectar a Postgres y restaurar (cuidado, esto SOBREESCRIBE todo)
psql "$DATABASE_URL" -f daledeal-backup-20260601-030000.sql
```

---

## 4. Deploy de nuevas versiones

### Frontend (cambios en HTML/CSS/JS)

```bash
cd /Users/gracianoponce/Desktop/dale\ deal/.claude/worktrees/gallant-banzai-5d983c

# 1. Editar archivos
# 2. Probar local
npm run build && cd dist && python3 -m http.server 5500

# 3. Commit + push (CI corre lint automático)
git add .
git commit -m "feat: descripción del cambio"
git push origin main

# 4. Deploy a Cloudflare Workers
npx wrangler deploy
```

El último step (`wrangler deploy`) sube el `dist/` a Cloudflare y queda
vivo en `https://daledeal.com.ar` en ~30 seg. No hay re-deploy
automático en push (a propósito — control manual de qué llega a prod).

### Backend (cambios en Node)

Railway tiene auto-deploy activado para la branch `main` del repo
backend. Cualquier `git push origin main` triggea el rebuild + redeploy
automático. Tarda ~2 min total.

Para mirar logs en vivo durante el deploy:
- Railway → daledeal-backend → Deployments → click en el más reciente → View logs

### Variables de entorno (Railway)

```
Railway → daledeal-backend → Variables → Raw Editor
```

Cualquier cambio dispara un redeploy automático. Las críticas:

| Variable | Para qué | Si la cambiás... |
|---|---|---|
| `NODE_ENV` | `production` | Restringe CORS, oculta stack traces |
| `JWT_SECRET` | Firma tokens de sesión | **Invalida TODAS las sesiones activas** |
| `DATABASE_URL` | Conexión a Postgres | Reinicio limpio del servicio |
| `FRONTEND_URL` | CORS whitelist (comma-separated) | Si sacás daledeal.com.ar, el sitio rompe |
| `RESEND_API_KEY` | Mandar emails | Sin esto, registro/reset no andan |
| `MP_ACCESS_TOKEN` | Mercado Pago | Sin esto, no procesa pagos |
| `MP_WEBHOOK_SECRET` | Validar webhook MP | Sin esto, MP no puede notificar pagos |

---

## 5. Troubleshooting

### "El sitio no carga"
1. `curl -I https://daledeal.com.ar/` → si responde HTTP 200, el problema es del usuario (DNS/red)
2. Si responde 5xx o no responde → checkear Cloudflare dashboard → Workers & Pages → dale-deal → ver si hay error reciente
3. Rollback rápido: `npx wrangler rollback` o desde dashboard → Deployments → "Rollback to this version"

### "El backend está caído (502/503)"
1. Railway → daledeal-backend → Deployments → últimos logs
2. Causas comunes:
   - Crashed por env var faltante → ver logs, agregar la var, redeploy
   - DB connection lost → Postgres en Railway → ver si está Online
   - Out of memory → upgradear el plan o optimizar queries

### "Los emails no llegan"
1. Resend dashboard → Logs → ver intentos recientes
2. Si dice "Domain not verified" → ir a Domains → re-verify DNS
3. Si los emails llegan a Spam → setear DMARC más estricto (de `p=none` a `p=quarantine`)

### "Mercado Pago rechaza pagos"
1. Verificar que MP_ACCESS_TOKEN sea PROD (empieza con `APP_USR-`, no `TEST-`)
2. MP dashboard → Tu integración → Activity → ver detalle del error
3. Si dice "App not enabled for production" → completar verificación de identidad MP

### "Un cliente dice que no puede registrarse"
1. Probá vos mismo: ir a https://daledeal.com.ar/HTML/signup.html
2. Si funciona, pedile screenshot del error al cliente
3. Si NO funciona, abrí console del navegador (F12) → ver errores → mandame
4. También chequea backend logs en Railway en ese horario

### "Quiero ver qué hace un usuario específico"
- Loggeate como admin: `graciano@daledeal.com.ar` / `DaleDealAdmin2026!`
- Andá a `/HTML/admin.html`
- Sección Usuarios → buscar por email

---

## 6. Activar Sentry (errores en producción)

**Por qué:** Cuando algo se rompe en el navegador de un cliente, vos no
te enterás (no estás mirando su consola). Sentry te avisa por email.

**Setup (10 min):**

1. https://sentry.io/signup/ — crear cuenta gratis
2. Create New Project → Browser JavaScript → name "dale-deal-frontend"
3. Sentry te da un DSN (URL larga tipo `https://abc123@o12345.ingest.sentry.io/67890`)
4. En el frontend, agregar al `<head>` de `index.html` y los HTMLs principales:
   ```html
   <script
     src="https://browser.sentry-cdn.com/8.x.x/bundle.tracing.min.js"
     crossorigin="anonymous"></script>
   <script>
     Sentry.init({
       dsn: "TU_DSN_ACA",
       tracesSampleRate: 0.1,  // 10% de transactions, suficiente
       environment: window.location.hostname.includes('localhost') ? 'dev' : 'prod'
     });
   </script>
   ```
5. Para el backend Node: `npm install @sentry/node` y al inicio de `src/index.js`:
   ```js
   const Sentry = require('@sentry/node');
   Sentry.init({ dsn: process.env.SENTRY_DSN_BACKEND, environment: process.env.NODE_ENV });
   ```
   Agregar `SENTRY_DSN_BACKEND` como env var en Railway con el DSN del proyecto backend en Sentry.
6. Para testear: tirar `throw new Error("test sentry")` en algún lado → debería aparecer en Sentry dashboard

---

## 7. Migrar de MP TEST a MP PROD

Cuando tengas la verificación de identidad aprobada por MP (24-72hs):

1. MP Developers → Tu app → **Credenciales de producción**
2. Copiar Access Token (empieza con `APP_USR-`) y Public Key
3. Railway → daledeal-backend → Variables:
   - `MP_ACCESS_TOKEN` ← nuevo valor PROD
   - `MP_PUBLIC_KEY` ← nuevo valor PROD
4. Configurar webhook:
   - MP → Tu app → Webhooks → Add notification URL
   - URL: `https://daledeal-backend-production.up.railway.app/payments/webhook`
     (o `https://api.daledeal.com.ar/payments/webhook` cuando esté el subdominio)
   - Eventos: `payment`
   - MP te da un Secret → copialo
5. Railway → Variables → `MP_WEBHOOK_SECRET` ← pegar el secret real (reemplaza el placeholder temporal)
6. Railway auto-redeploya
7. Probar con tarjeta real (cobrarte $1 a vos mismo, después devolver)

---

## 8. Cómo cargar productos reales

### Vos (admin) cargando desde la web

1. Login en https://daledeal.com.ar/HTML/login.html como `graciano@daledeal.com.ar`
2. Click en "Publicar" en el navbar
3. Llenás form (título, descripción, precio, fotos, etc.)
4. Aparece en el catálogo automáticamente

### Cualquier vendedor cargando

1. Se registran normal en https://daledeal.com.ar/HTML/signup.html
2. Después entran y publican lo mismo flujo

### Bulk via SQL (avanzado)

Si tenés un Excel/CSV con productos, podés bulkear directo a la DB:

```bash
psql "$DATABASE_URL_PUBLIC" <<EOF
INSERT INTO products (seller_id, category_id, title, description, price, ...)
VALUES (1, 1, 'Producto 1', '...', 99999, ...);
EOF
```

---

## 9. Performance — re-medir periódicamente

Una vez por semana, correr Lighthouse contra producción y comparar con
los baselines (registrados en este repo):

```bash
npx lighthouse https://daledeal.com.ar/ --view --form-factor=mobile
```

**Baselines actuales** (post-deploy inicial):
- Performance: 69 ± 5
- Accessibility: 96
- Best Practices: 96
- SEO: 100

Si Performance baja a <60, hay regresión — revisar últimos commits.

---

## 10. Cosas que NO hicimos todavía (roadmap)

| Item | Prioridad | Esfuerzo | Cuándo |
|---|---|---|---|
| Configurar UptimeRobot | Alta | 5 min | Esta semana |
| Activar Sentry | Alta | 10 min | Esta semana |
| Activar Cloudflare Web Analytics | Media | 5 min | Esta semana |
| Verificación MP identidad + migrar a PROD | Alta | 24-72hs | YA |
| Configurar `DATABASE_URL_BACKUP` secret en GitHub | Alta | 2 min | Esta semana |
| Agregar DNS records de `api.daledeal.com.ar` | Media | 5 min | Cuando puedas |
| Migrar imágenes de Unsplash a Cloudflare R2 | Media | 2 hs | Mes 2 |
| Reducir `!important` en CSS | Baja | 4 hs | Cuando haya tracción |
| Refactor ProductsCatalog ↔ ProductFilters | Baja | 4 hs | Cuando haya tracción |
| Tests E2E con Playwright | Media | 6 hs | Cuando equipo crezca |
| Form de "Olvidaste tu contraseña?" funcional end-to-end | Alta | 30 min | YA |

---

## 11. Contactos importantes

- **Cloudflare support**: dashboard → Help → Submit ticket (responden en ~24hs)
- **Railway support**: railway.com/help (Discord activo)
- **Resend support**: resend.com → Help (responden en ~12hs)
- **Mercado Pago dev support**: mercadopago.com.ar/developers/panel → Soporte
- **NIC.ar**: solo para temas de dominio (no DNS), tickets vía nic.ar

---

**Última actualización:** 2026-05-28
**Próxima revisión sugerida:** 2026-06-28 (1 mes post-launch)
