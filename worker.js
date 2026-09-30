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
    if (url.pathname.startsWith('/img/')) return serveImage(request, env, url);
    if (url.pathname === '/api/upload') return handleUpload(request, env, url);
    if (env.COMING_SOON === '1') {
      const gated = await comingSoonGate(request, env, url);
      if (gated) return gated;
    }
    return env.ASSETS.fetch(request);
  },
};

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
// (queda una cookie por 30 días) y sale con ?acceso=salir.
// PREVIEW_KEY es un secreto de Cloudflare (npx wrangler secret put PREVIEW_KEY):
// no vive en el repo. Sin PREVIEW_KEY no entra nadie, ni el equipo.
// ============================================================
const PREVIEW_COOKIE = 'dd_preview';
const PREVIEW_DAYS = 30;

async function comingSoonGate(request, env, url) {
  const key = String(env.PREVIEW_KEY || '').trim();
  const token = key ? await sha256Hex('dd-preview:' + key) : null;
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
      return redirectWithCookie(clean, `${PREVIEW_COOKIE}=${token}; Path=/; Max-Age=${PREVIEW_DAYS * 86400}; HttpOnly; SameSite=Lax${secure}${domain}`);
    }
    // Clave incorrecta: sigue como cualquier visitante.
  }

  if (token && readCookie(request, PREVIEW_COOKIE) === token) return null; // equipo → sitio normal
  if (!isPageRequest(request, url)) return null;                          // assets → pasan

  return new Response(request.method === 'HEAD' ? null : comingSoonPage(), {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
      'x-robots-tag': 'noindex',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'strict-origin-when-cross-origin',
    },
  });
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
