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
 * Storage: Workers KV (binding IMAGES). R2 no está habilitado en la cuenta
 * (hay que activarlo a mano en el dashboard); KV viene incluido y su plan
 * free (1 GB, 1.000 escrituras/día) sobra para la etapa de validación.
 * Si el volumen crece: habilitar R2, copiar objetos y cambiar el binding —
 * la interfaz pública /img/<key> no cambia.
 */

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
