/**
 * Worker de Dale Deal — assets estáticos + subida/servido de imágenes.
 *
 * Rutas propias (todo lo demás cae a los assets de dist/, que conservan
 * su _redirects, _headers y página 404 vía env.ASSETS):
 *
 *   POST /api/upload  — sube una imagen del form de publicar. Requiere sesión:
 *                       el token JWT se valida contra el backend de Railway
 *                       (GET /auth/me), que es el único dueño del secreto.
 *                       Acá no vive ningún secreto.
 *   GET  /img/<key>   — sirve la imagen subida, con cache inmutable.
 *
 * Pre-lanzamiento: con COMING_SOON = "1" (wrangler.toml) las páginas muestran
 * "Próximamente" (coming-soon.js) salvo para el equipo (ver comingSoonGate).
 *
 * Storage: Workers KV (binding IMAGES). R2 no está habilitado en la cuenta
 * (hay que activarlo a mano en el dashboard); KV viene incluido y su plan
 * free (1 GB, 1.000 escrituras/día) sobra para la etapa de validación.
 * Si el volumen crece: habilitar R2, copiar objetos y cambiar el binding —
 * la interfaz pública /img/<key> no cambia.
 */

import { comingSoonPage } from "./coming-soon.js";

const BACKEND = 'https://daledeal-backend-production.up.railway.app';

// Solo formatos raster seguros. SVG queda excluido a propósito: puede llevar
// scripts embebidos y estas imágenes se sirven desde nuestro dominio.
const IMAGE_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
};
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB por foto

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    // HTTPS siempre en producción: Cloudflare también servía el sitio por http
    // (login incluido). Lo definitivo es activar "Always Use HTTPS" en el panel;
    // esto cubre lo que pasa por el worker. El esquema real lo dice Cloudflare
    // (CF-Visitor / X-Forwarded-Proto): en `wrangler dev` la URL llega como
    // http://daledeal.com.ar y redirigir por eso armaba un bucle en local.
    const viaHttp = /"scheme":"http"/.test(request.headers.get('cf-visitor') || '')
      || request.headers.get('x-forwarded-proto') === 'http';
    if (viaHttp && url.protocol === 'http:' && /(^|\.)daledeal\.com\.ar$/.test(url.hostname)) {
      url.protocol = 'https:';
      return Response.redirect(url.toString(), 301);
    }
    if (url.pathname === '/sitemap-products.xml' || url.pathname === '/sitemap-services.xml') {
      return proxySitemap(url.pathname);
    }
    if (url.pathname.startsWith('/img/')) return serveImage(request, env, url);
    if (url.pathname === '/api/upload') return handleUpload(request, env, url);
    if (env.COMING_SOON === '1') {
      const gated = await comingSoonGate(request, env, url);
      if (gated === TEAM_PAGE) return teamPage(request, env);
      if (gated) return gated;
    }
    return env.ASSETS.fetch(request);
  },
};

// Sitemaps dinámicos (productos/servicios): los genera el backend, pero los
// servimos desde este dominio porque un sitemap en otro host no vale dentro
// del sitemap-index. Cache de 1 h en el borde.
async function proxySitemap(path) {
  try {
    const upstream = await fetch(`https://api.daledeal.com.ar${path}`, {
      cf: { cacheTtl: 3600, cacheEverything: true },
    });
    if (!upstream.ok) return new Response('Sitemap no disponible', { status: 502 });
    return new Response(upstream.body, {
      status: 200,
      headers: {
        'content-type': 'application/xml; charset=utf-8',
        'cache-control': 'public, max-age=3600',
      },
    });
  } catch (_) {
    return new Response('Sitemap no disponible', { status: 502 });
  }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

async function handleUpload(request, env, url) {
  if (request.method !== 'POST') {
    return json({ ok: false, error: 'Método no permitido.' }, 405);
  }

  const auth = request.headers.get('authorization') || '';
  if (!auth.startsWith('Bearer ')) {
    return json({ ok: false, error: 'Necesitás iniciar sesión para subir fotos.' }, 401);
  }

  let user;
  try {
    const me = await fetch(`${BACKEND}/auth/me`, { headers: { authorization: auth } });
    if (me.status !== 200) {
      return json({ ok: false, error: 'Sesión inválida o vencida. Volvé a iniciar sesión.' }, 401);
    }
    user = await me.json();
  } catch (_) {
    return json({ ok: false, error: 'No pudimos validar tu sesión. Probá de nuevo en unos segundos.' }, 502);
  }

  const ct = (request.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  const ext = IMAGE_TYPES[ct];
  if (!ext) {
    return json({ ok: false, error: 'Formato no soportado. Usá JPG, PNG, WebP, GIF o AVIF.' }, 415);
  }

  // Pre-chequeo barato por header; el chequeo real es sobre los bytes.
  const declared = parseInt(request.headers.get('content-length') || '0', 10);
  if (declared > MAX_BYTES) {
    return json({ ok: false, error: 'La imagen supera los 8 MB.' }, 413);
  }

  const buf = await request.arrayBuffer();
  if (!buf.byteLength) return json({ ok: false, error: 'El archivo llegó vacío.' }, 400);
  if (buf.byteLength > MAX_BYTES) {
    return json({ ok: false, error: 'La imagen supera los 8 MB.' }, 413);
  }

  // Key 100% generada del lado servidor (nunca usamos el nombre del archivo).
  const key = `uploads/${user.id}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  await env.IMAGES.put(key, buf, { metadata: { contentType: ct, userId: user.id } });

  return json({ ok: true, url: `${url.origin}/img/${key}`, key });
}

async function serveImage(request, env, url) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Método no permitido', { status: 405 });
  }

  const key = decodeURIComponent(url.pathname.slice('/img/'.length));
  // Solo claves con el prefijo que genera el upload — corta path traversal.
  if (!key.startsWith('uploads/') || key.includes('..')) {
    return new Response('No encontrada', { status: 404 });
  }

  const { value, metadata } = await env.IMAGES.getWithMetadata(key, {
    type: 'stream',
    cacheTtl: 86400,
  });
  if (!value) return new Response('No encontrada', { status: 404 });

  return new Response(request.method === 'HEAD' ? null : value, {
    headers: {
      'content-type': (metadata && metadata.contentType) || 'application/octet-stream',
      // La key es única e inmutable → cache fuerte en browser y edge.
      'cache-control': 'public, max-age=31536000, immutable',
      'x-content-type-options': 'nosniff',
    },
  });
}

// ============================================================
// Pre-lanzamiento (COMING_SOON = "1" en wrangler.toml)
//
// El público ve la página de Próximamente en cualquier página del sitio; los
// estilos, scripts, imágenes y fotos pasan igual. El equipo entra con
//   https://daledeal.com.ar/?acceso=<PREVIEW_KEY>
// (queda una cookie por 12 horas) y sale con ?acceso=salir.
// PREVIEW_KEY es un secreto de Cloudflare (npx wrangler secret put PREVIEW_KEY):
// no vive en el repo. Sin PREVIEW_KEY no entra nadie, ni el equipo.
// ============================================================
const PREVIEW_COOKIE = 'dd_preview';
// Antes la cookie duraba 30 días: quien abría el link una vez seguía viendo el
// sitio semanas después y parecía que Próximamente "no estaba". Ahora dura 12 h.
const PREVIEW_HOURS = 12;
// Cambiar la versión invalida TODAS las cookies ya entregadas (el 02/10 se pasó
// a v2: los accesos de antes dejaron de valer y todos volvieron a ver Próximamente).
const PREVIEW_TOKEN_VERSION = 'v2';

async function comingSoonGate(request, env, url) {
  const key = String(env.PREVIEW_KEY || '').trim();
  const token = key ? await sha256Hex(`dd-preview-${PREVIEW_TOKEN_VERSION}:` + key) : null;
  const acceso = url.searchParams.get('acceso');

  if (acceso !== null) {
    const clean = new URL(url);
    clean.searchParams.delete('acceso');
    const secure = url.protocol === 'https:' ? '; Secure' : '';
    // Con Domain la cookie vale para daledeal.com.ar y www (en local, solo el host).
    const domain = /(^|\.)daledeal\.com\.ar$/.test(url.hostname) ? '; Domain=daledeal.com.ar' : '';
    if (acceso === 'salir') {
      return redirectWithCookie(clean, `${PREVIEW_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure}${domain}`);
    }
    if (token && await sameSecret(acceso, key)) {
      return redirectWithCookie(clean, `${PREVIEW_COOKIE}=${token}; Path=/; Max-Age=${PREVIEW_HOURS * 3600}; HttpOnly; SameSite=Lax${secure}${domain}`);
    }
    // Clave incorrecta: sigue como cualquier visitante.
  }

  if (!isPageRequest(request, url)) return null;                          // assets → pasan
  if (token && readCookie(request, PREVIEW_COOKIE) === token) return TEAM_PAGE; // equipo → sitio normal, con aviso

  return new Response(request.method === 'HEAD' ? null : comingSoonPage(), {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex',
      'strict-transport-security': 'max-age=31536000',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'strict-origin-when-cross-origin',
    },
  });
}

// El equipo (cookie válida) ve el sitio normal, con un aviso chico abajo a la
// izquierda: sin él, quien entró una vez con la clave ve el sitio durante 30
// días y cree que Próximamente "se cayó". El aviso recuerda que el público
// sigue viendo Próximamente y deja salir de la vista de equipo con un clic.
const TEAM_PAGE = Symbol('team-page');
// (el ancho deja libre la esquina derecha, donde está el botón de ayuda).
const TEAM_NOTICE = `
<div id="dd-team-notice" style="position:fixed;left:12px;bottom:12px;z-index:2147483000;max-width:min(520px,calc(100vw - 104px));display:flex;flex-wrap:wrap;align-items:center;gap:4px 10px;padding:8px 10px 8px 14px;border-radius:14px;background:#111827;color:#fff;font:600 12px/1.35 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;box-shadow:0 6px 20px rgba(0,0,0,.28)">
  <span>Vista del equipo · el público ve «Próximamente»</span>
  <a href="/?acceso=salir" style="color:#fbbf24;text-decoration:underline;white-space:nowrap">Ver como el público</a>
  <button type="button" aria-label="Ocultar aviso" onclick="this.parentNode.remove()" style="all:unset;cursor:pointer;padding:0 6px;font-size:16px;line-height:1;color:#9ca3af">&times;</button>
</div>`;

async function teamPage(request, env) {
  // Sin If-None-Match / If-Modified-Since: un 304 haría que el navegador use
  // su copia guardada (sin el aviso).
  const req = new Request(request);
  req.headers.delete('if-none-match');
  req.headers.delete('if-modified-since');
  const res = await env.ASSETS.fetch(req);
  if (!res.body || !(res.headers.get('content-type') || '').includes('text/html')) return res;

  const out = new HTMLRewriter()
    .on('body', { element(el) { el.append(TEAM_NOTICE, { html: true }); } })
    .transform(res);
  // no-store y sin validadores: el día del lanzamiento nadie se queda con una
  // copia guardada que todavía muestre el aviso.
  const headers = new Headers(out.headers);
  headers.set('cache-control', 'no-store');
  headers.delete('etag');
  headers.delete('last-modified');
  return new Response(out.body, { status: out.status, statusText: out.statusText, headers });
}

// Páginas = GET/HEAD a "/", *.html o URLs limpias sin extensión (/productos).
function isPageRequest(request, url) {
  if (request.method !== 'GET' && request.method !== 'HEAD') return false;
  const last = url.pathname.split('/').pop();
  return last === '' || /\.html?$/i.test(last) || !last.includes('.');
}

function redirectWithCookie(location, cookie) {
  return new Response(null, {
    status: 302,
    headers: { location: location.toString(), 'set-cookie': cookie, 'cache-control': 'no-store' },
  });
}

function readCookie(request, name) {
  const header = request.headers.get('cookie') || '';
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return null;
}

async function sha256Bytes(text) {
  return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));
}

async function sha256Hex(text) {
  return [...await sha256Bytes(text)].map(b => b.toString(16).padStart(2, '0')).join('');
}

// Comparación en tiempo constante (sobre los hashes, que miden lo mismo).
async function sameSecret(a, b) {
  const [ha, hb] = await Promise.all([sha256Bytes(a), sha256Bytes(b)]);
  let diff = 0;
  for (let i = 0; i < ha.length; i++) diff |= ha[i] ^ hb[i];
  return diff === 0;
}
