# Dale Deal — Frontend

Marketplace de productos y servicios para Argentina. Frontend HTML/CSS/JS vanilla con build via esbuild para minificación de producción.

Repo backend: [`gracianoponce/daledeal-backend`](https://github.com/gracianoponce/daledeal-backend).

## Stack

- **HTML/CSS/JS vanilla** (sin React/Next, sin TypeScript)
- **Bootstrap 5** (CSS + JS desde CDN)
- **Bootstrap Icons** + **AOS** (animaciones on scroll, deshabilitadas en mobile)
- **Inter** + **Space Grotesk** desde Google Fonts (cargadas vía `@import` en `CSS/variables.css`)
- **esbuild** como bundler (solo para producción, minifica todos los JS y CSS)

## Estructura

```
.
├── index.html                  ← home
├── HTML/
│   ├── components/             ← navbar y footer compartidos (inyectados con component-loader.js)
│   ├── productos.html, servicios.html, ...
│   └── (25 páginas HTML en total)
├── CSS/
│   ├── variables.css           ← tokens (colores, spacing, tipos), @import de Google Fonts
│   ├── components.css          ← botones, cards, forms, empty-state, modales, dropdowns
│   ├── responsive.css          ← media queries globales
│   └── pages/                  ← CSS específico por página
├── JS/
│   ├── utils.js, api.js, auth.js, cart.js, ...   ← core
│   ├── pages/                  ← lógica específica por página
│   ├── theme.js                ← dark/light mode
│   ├── component-loader.js     ← inyecta header.html y footer.html en cada página
│   └── support-widget.js       ← FAB de "¿Necesitás ayuda?"
├── IMG/                        ← logos y assets locales
├── manifest.json               ← PWA manifest (Add to Home Screen)
├── robots.txt + sitemap*.xml   ← SEO
├── build.js                    ← script de build (esbuild minify)
├── package.json                ← deps: solo esbuild
└── .github/workflows/ci.yml    ← lint estático JS+HTML en cada push
```

## Desarrollo local

```bash
# Servir los archivos estáticos directamente (sin build):
python3 -m http.server 5555

# Después: http://localhost:5555/index.html
```

El backend tiene que estar corriendo en `localhost:3000` (`cd dale-deal-backend && npm start`). El frontend detecta automáticamente si está en localhost y apunta el API ahí; en producción apunta al backend remoto (ver `JS/api.js`).

## Build para producción

```bash
npm install      # solo esbuild como devDep
npm run build    # output a ./dist/
```

Qué hace `build.js`:

- Minifica los 29 archivos JS en `JS/` (~37% más chico)
- Minifica los 10 archivos CSS en `CSS/` (~27% más chico)
- Copia HTMLs, imágenes y `manifest.json` tal cual
- Mantiene la misma estructura de carpetas → los HTMLs no necesitan reescritura, solo hay que servir `dist/` en lugar de la raíz

**Tiempo:** ~150ms para todos los archivos.
**Reducción total:** ~270 KB por visita.

Watch mode para tunear durante dev:

```bash
npm run build:watch
```

## Deploy

### Recomendado: Vercel, Netlify o Cloudflare Pages

```
Build command:    npm install && npm run build
Output directory: dist
```

El frontend es 100% estático después del build — cualquier hosting de estáticos funciona.

### URLs del backend en producción

`JS/api.js` (función `getApiUrl()`) detecta el entorno:

- `localhost` o `127.0.0.1` → `http://localhost:3000`
- cualquier otro hostname (producción) → `https://daledeal-backend.up.railway.app` (editar acá cuando tengas la URL real)

## CI

`.github/workflows/ci.yml` corre en cada push a `main` o PR:

- Sintaxis JS en todos los archivos (`node -c`)
- Detecta `debugger` statements sueltos
- Verifica HTML básico (`<!DOCTYPE>`, `</html>`) en páginas principales
- Corre el build de producción y reporta tamaños

Si algo falla, GitHub bloquea el merge (configurar branch protection en Settings → Branches → main → "Require status checks").

## Testing

No hay tests automatizados en el frontend todavía. El backend tiene smoke tests con jest+supertest que cubren los endpoints críticos (ver repo backend, `tests/smoke.test.js`).

## Performance

- Lighthouse target: **70+** en performance (medido en mobile 3G simulado).
- Optimizaciones aplicadas:
  - Minify JS/CSS via esbuild
  - `preconnect` a CDNs externos (Bootstrap, AOS, Google Fonts) en `<head>` de las 9 páginas principales
  - `fetchpriority="high"` + `decoding="async"` en imagen del hero (LCP)
  - `loading="lazy"` en imágenes below-the-fold
  - `width`/`height` declarados en imágenes para evitar CLS
  - AOS deshabilitado en mobile (causaba overflow horizontal)
- Pendiente: bundle real (concatenar JS sueltos en 1-2 archivos para reducir requests).

## Accesibilidad

- Skip-to-content link (off-screen hasta recibir Tab)
- `:focus-visible` con outline de marca
- `aria-label` en botones icon-only
- `<main id="main" tabindex="-1">` en cada página
- Voseo argentino en copy
- Soporte dark mode con contraste verificado

## Pendientes técnicos (deuda)

- Refactor `!important` en `CSS/components.css` (241 usos)
- Coordinar `ProductsCatalog` con `ProductFilters` (renderizan el mismo grid y se machacan, lo cual impide skeleton states consistentes)
- Migrar imágenes de productos de Unsplash externo a CDN propio (Cloudflare Images o R2)
- Setup de Sentry + Plausible + UptimeRobot (requiere cuentas externas)
- Eventual migración a Next.js cuando el equipo crezca o el SEO server-side sea bloqueante

## Licencia

Privado. Todos los derechos reservados.
