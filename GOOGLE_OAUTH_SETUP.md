# Setup de Google Sign-In

Esta guía tarda **~10 minutos** y deja Google login funcional en producción.

## Paso 1 — Crear proyecto en Google Cloud Console

1. Andá a https://console.cloud.google.com
2. Arriba a la izquierda, hacé clic en el selector de proyecto → **NEW PROJECT**
3. Nombre: `Dale Deal` (o el que quieras)
4. Crear

## Paso 2 — Configurar OAuth Consent Screen

1. Menú izq → **APIs & Services** → **OAuth consent screen**
2. User Type: **External** → Create
3. Completar:
   - **App name**: Dale Deal
   - **User support email**: tu email
   - **App logo**: (opcional) subir el logo de Dale Deal
   - **Application home page**: `https://daledeal.com.ar`
   - **Application privacy policy link**: `https://daledeal.com.ar/HTML/privacidad.html`
   - **Application terms of service link**: `https://daledeal.com.ar/HTML/terminos.html`
   - **Authorized domains**: `daledeal.com.ar`
   - **Developer contact email**: tu email
4. Save and continue → Scopes: dejá los default (email, profile, openid) → Save
5. Test users: agregá tu propio email mientras esté en modo "Testing"
6. Cuando esté todo OK, **Publish App** (sino solo los test users pueden loguearse)

## Paso 3 — Crear OAuth Client ID

1. Menú izq → **APIs & Services** → **Credentials**
2. **Create Credentials** → **OAuth client ID**
3. Application type: **Web application**
4. Name: `Dale Deal Web`
5. **Authorized JavaScript origins** (agregar TODAS):
   - `http://localhost:8080`
   - `https://daledeal.com.ar`
   - `https://www.daledeal.com.ar`
6. **Authorized redirect URIs**: dejar vacío (usamos el flow popup que no necesita redirect)
7. Create
8. Copiar el **Client ID** (termina en `.apps.googleusercontent.com`)

## Paso 4 — Configurar el Client ID en el código

### Frontend (Cloudflare)

Editar `JS/utils.js` línea ~17:

```js
GOOGLE_CLIENT_ID: "123456789-abc.apps.googleusercontent.com",
```

Build + deploy:
```bash
npm run build
npx wrangler deploy
```

### Backend (Railway)

Agregar variable de entorno en Railway:
```
GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
```

**Importante**: el valor tiene que ser **idéntico** al del frontend, sino la verificación de audience falla.

Railway reiniciará el server solo.

## Paso 5 — Correr la migración de DB

Una sola vez, para agregar la columna `google_id` a la tabla `users`:

```bash
# Local
cd dale-deal-backend
npm run db:migrate:google

# Producción (Railway)
# Conectarse al psql del Railway DB y correr:
\i db/migrations/007_google_oauth.sql
```

La migración es idempotente (`IF NOT EXISTS`), se puede correr varias veces sin problema.

## Paso 6 — Verificar

1. Andá a https://daledeal.com.ar/HTML/signup.html
2. Hacé clic en **Google**
3. Debería aparecer el popup de "Sign in with Google"
4. Seleccionar tu cuenta
5. Debería loguearte y redirigir al home con tu nombre/avatar en la navbar

## Troubleshooting

| Error | Causa | Solución |
|---|---|---|
| "Login con Google próximamente — falta configuración del servidor" | `GOOGLE_CLIENT_ID` vacío en frontend | Setear en `JS/utils.js` y re-deploy |
| 503 al click | `GOOGLE_CLIENT_ID` falta en Railway | Settearlo y reiniciar |
| "Token de Google inválido o expirado" | Client ID de frontend ≠ Client ID de backend | Asegurarse que son **iguales** |
| Popup bloqueado | Browser bloqueó popups | El usuario tiene que permitirlos para daledeal.com.ar |
| "Access blocked: This app's request is invalid" | Origen no autorizado | Agregar el origin a "Authorized JavaScript origins" en Google Cloud |

## Cómo funciona el flow

```
1. Usuario click "Google" en signup/login
2. auth.js → google.accounts.id.initialize() + prompt()
3. Google muestra popup → usuario selecciona cuenta
4. Google devuelve un ID token (JWT firmado por Google)
5. auth.js → POST /auth/google con el ID token
6. Backend verifica firma + audience con google-auth-library
7. Backend busca user por google_id → si no existe, busca por email → si tampoco, crea uno nuevo
8. Backend devuelve nuestro JWT + user
9. auth.js guarda en localStorage + redirige a home
```

## Costo

Google Sign-In es **gratis** hasta varios millones de usuarios. No hay costo asociado para Dale Deal.
