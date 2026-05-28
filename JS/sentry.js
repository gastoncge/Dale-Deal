// =====================================================
// DALE DEAL — Sentry error tracking (scaffolding listo)
// =====================================================
//
// CÓMO ACTIVAR:
//   1) Crear cuenta en https://sentry.io (gratis hasta 5k errores/mes)
//   2) New project → Browser JavaScript → name "dale-deal-frontend"
//   3) Sentry te da un DSN tipo:
//      https://abc123def456@o12345.ingest.us.sentry.io/789
//   4) Editar JS/utils.js y agregar dentro de window.DaleDeal.CONFIG:
//        SENTRY_DSN: 'https://abc123def456@o12345.ingest.us.sentry.io/789'
//   5) npm run build && npx wrangler deploy
//   6) Refrescar el sitio en cualquier browser → Sentry empieza a capturar
//
// Sin SENTRY_DSN seteado, este archivo no hace nada (ni siquiera carga el
// CDN de Sentry). Cero overhead para usuarios reales mientras no activamos.
//
// Para testear que funciona:
//   En consola del browser:  throw new Error('test sentry ' + Date.now());
//   Después: Sentry dashboard → Issues → debería aparecer en 30 seg.

(function () {
  'use strict';

  const dsn = window.DaleDeal?.CONFIG?.SENTRY_DSN;
  if (!dsn) {
    // No DSN configurado → no cargar Sentry. Silencioso a propósito.
    return;
  }

  // Cargar SDK de Sentry dinámicamente solo cuando hay DSN configurado.
  // Versión 8.x: bundle.tracing.min.js incluye Sentry + tracing en uno.
  const script = document.createElement('script');
  script.src = 'https://browser.sentry-cdn.com/8.45.1/bundle.tracing.min.js';
  script.integrity = 'sha384-7Sdy7G1g3sgUR2cWihlMcuKDsRtkP8FBJVZIc+ITzAFAfWaXi3kf3+yWnAt8wnAW';
  script.crossOrigin = 'anonymous';
  script.async = true;

  script.onload = function () {
    if (!window.Sentry) {
      console.warn('[Sentry] SDK cargó pero window.Sentry no existe');
      return;
    }
    try {
      Sentry.init({
        dsn: dsn,
        environment: __IS_LOCAL ? 'dev' : 'production',
        release: 'dale-deal@2.0.0',

        // 10% de transactions tracking — suficiente para detectar slow pages
        // sin saturar el quota de 5k events/mes de la free tier.
        tracesSampleRate: __IS_LOCAL ? 0 : 0.1,

        // No mandar PII automático. Si necesitás incluir user_id después
        // del login, hacelo manual con Sentry.setUser({ id: ... }).
        sendDefaultPii: false,

        // Ignora errores conocidos del ecosistema que no aportan info real.
        ignoreErrors: [
          // Bootstrap / extensiones de Chrome ruidosas
          'ResizeObserver loop limit exceeded',
          'ResizeObserver loop completed with undelivered notifications',
          // Adblockers
          /AdBlock/i,
          // Network errors transitorios — los manejamos en api.js
          'Failed to fetch',
          'NetworkError',
          'Load failed',
        ],

        // Filtrar antes de enviar para limpiar PII residual de URLs.
        beforeSend(event) {
          // Limpiar tokens de reset/auth que pueden estar en la URL
          if (event.request?.url) {
            event.request.url = event.request.url.replace(/[?&]token=[^&]+/g, '?token=REDACTED');
          }
          return event;
        },
      });

      // Hook para tagear con info del usuario cuando se loggea
      if (window.authManager && typeof window.authManager.on === 'function') {
        window.authManager.on('login', (user) => {
          Sentry.setUser({ id: user.id, email: user.email });
        });
        window.authManager.on('logout', () => {
          Sentry.setUser(null);
        });
      }

      if (window.DaleDeal?.log) {
        DaleDeal.log('✓ Sentry inicializado en entorno', __IS_LOCAL ? 'dev' : 'production');
      }
    } catch (err) {
      console.error('[Sentry] Error inicializando:', err);
    }
  };

  script.onerror = function () {
    console.warn('[Sentry] No se pudo cargar el SDK desde el CDN');
  };

  document.head.appendChild(script);
})();
