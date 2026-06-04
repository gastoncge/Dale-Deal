/**
 * =====================================================
 * DALE DEAL - Utilidades JavaScript Globales
 * =====================================================
 */

// ===== CONFIGURACIÓN GLOBAL =====
// API_BASE_URL: detecta automáticamente si estamos en local (localhost/127.0.0.1)
// vs producción. NO hardcodear "https://api.daledeal.com" — ese host no existe
// y rompe el frontend en local. La URL real de producción la define api.js
// (Railway: daledeal-backend-production.up.railway.app).
const __HOST = window.location.hostname;
const __IS_LOCAL = __HOST === "localhost" || __HOST === "127.0.0.1" || __HOST === "";
window.DaleDeal = {
  CONFIG: {
    DEBUG: __IS_LOCAL,
    API_BASE_URL: __IS_LOCAL ? "http://localhost:3000" : "https://daledeal-backend-production.up.railway.app",
    // Google OAuth Client ID (Web).
    // Setear acá el ID público que sale de Google Cloud Console → OAuth 2.0
    // (Authorized JS origins: http://localhost:8080 + https://daledeal.com.ar).
    // Si queda vacío, los botones "Google" muestran "Próximamente" en vez de
    // intentar abrir el popup y fallar feo.
    GOOGLE_CLIENT_ID: "627566643982-7e7qp5su0vlsr7f70e2b0r2oiduittod.apps.googleusercontent.com",
    PRODUCTS_PER_PAGE: 12,
    SEARCH_DELAY: 300,
    ANIMATION_DURATION: 300,
    LOCAL_STORAGE_PREFIX: "daledeal:",
    BREAKPOINTS: {
      sm: 576,
      md: 768,
      lg: 992,
      xl: 1200,
      xxl: 1400,
    },
  },

  // ===== ESTADO GLOBAL =====
  state: {
    user: null,
    cart: [],
    favorites: [],
    notifications: [],
  },

  // ===== UTILIDADES =====
  utils: {},

  // ===== LOGGER =====
  log: (...args) => { if (window.DaleDeal?.CONFIG?.DEBUG) console.log('[DaleDeal]', ...args); },
  warn: (...args) => { if (window.DaleDeal?.CONFIG?.DEBUG) console.warn('[DaleDeal]', ...args); },
  error: (...args) => console.error('[DaleDeal]', ...args),
};

// ===== UTILIDADES DE FORMATO =====
DaleDeal.utils.formatPrice = (price) => {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

// Alias usado en home.js y servicios.html
DaleDeal.utils.formatCurrency = DaleDeal.utils.formatPrice;

// ===== UTILIDADES DE VALIDACIÓN =====
DaleDeal.utils.calculatePasswordStrength = (password) => {
  let score = 0;
  const feedback = [];

  if (password.length === 0) {
    return { score: 0, text: "Mínimo 8 caracteres", class: "" };
  }

  if (password.length >= 8) score += 25;
  else feedback.push("mínimo 8 caracteres");

  if (password.match(/[a-z]/)) score += 20;
  else feedback.push("letras minúsculas");

  if (password.match(/[A-Z]/)) score += 20;
  else feedback.push("letras mayúsculas");

  if (password.match(/[0-9]/)) score += 20;
  else feedback.push("números");

  if (password.match(/[^A-Za-z0-9]/)) score += 15;
  else feedback.push("símbolos especiales");

  if (password.length >= 12) score += 10;
  if (password.match(/[!@#$%^&*(),.?":{}|<>]/)) score += 5;

  if (password.match(/(.)\1{2,}/)) score -= 15;
  if (password.match(/123|abc|qwe|password/i)) score -= 20;

  let strengthClass = "";
  let strengthText = "";

  if (score < 40) {
    strengthClass = "weak";
    strengthText = "Débil";
    if (feedback.length > 0) {
      strengthText += ` - Falta: ${feedback.slice(0, 2).join(", ")}`;
    }
  } else if (score < 70) {
    strengthClass = "medium";
    strengthText = "Media";
    if (feedback.length > 0) {
      strengthText += ` - Sugerencia: ${feedback[0]}`;
    }
  } else {
    strengthClass = "strong";
    strengthText = "¡Excelente!";
  }

  return {
    score: Math.min(score, 100),
    text: strengthText,
    class: strengthClass,
  };
};

// ===== UTILIDADES DE ALMACENAMIENTO =====
DaleDeal.utils.storage = {
  set: (key, value) => {
    try {
      const prefixedKey = DaleDeal.CONFIG.LOCAL_STORAGE_PREFIX + key;
      localStorage.setItem(prefixedKey, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn("Error al guardar en localStorage:", error);
      return false;
    }
  },

  get: (key, defaultValue = null) => {
    try {
      const prefixedKey = DaleDeal.CONFIG.LOCAL_STORAGE_PREFIX + key;
      const item = localStorage.getItem(prefixedKey);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn("Error al leer de localStorage:", error);
      return defaultValue;
    }
  },

  remove: (key) => {
    try {
      const prefixedKey = DaleDeal.CONFIG.LOCAL_STORAGE_PREFIX + key;
      localStorage.removeItem(prefixedKey);
      return true;
    } catch (error) {
      console.warn("Error al eliminar de localStorage:", error);
      return false;
    }
  },

  clear: () => {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(DaleDeal.CONFIG.LOCAL_STORAGE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (error) {
      console.warn("Error al limpiar localStorage:", error);
      return false;
    }
  },
};

// ===== UTILIDADES DE NOTIFICACIONES =====
/**
 * Sistema unificado de notificaciones para toda la aplicación
 * Soporta dos estilos: 'alert' (alertas en la esquina) y 'toast' (toasts de Bootstrap)
 *
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de notificación: 'success', 'error', 'warning', 'info'
 * @param {number} duration - Duración en ms (0 para persistente)
 * @param {object} options - Opciones adicionales: { style: 'alert'|'toast', position: 'top-right'|'top-left'|'bottom-right'|'bottom-left' }
 */
DaleDeal.utils.showNotification = (message, type = "info", duration = 3000, options = {}) => {
  const normalizedType = type === 'danger' ? 'error' : type;

  const config = {
    style: options.style || 'toast',
    position: options.position || 'bottom-right',
    duration: duration,
    ...options
  };

  if (config.style === 'toast' && window.bootstrap?.Toast) {
    return DaleDeal.utils.showToast(message, normalizedType, config);
  } else {
    return DaleDeal.utils.showAlert(message, normalizedType, config);
  }
};

/**
 * Mostrar notificación estilo Toast (Bootstrap)
 */
DaleDeal.utils.showToast = (message, type, config) => {
  const toastId = 'toast_' + Date.now();
  const bgClass = DaleDeal.utils.getBootstrapBgClass(type);
  const icon = DaleDeal.utils.getNotificationIcon(type);

  const toastHTML = `
    <div class="toast align-items-center text-white ${bgClass} border-0"
         role="alert" aria-live="assertive" aria-atomic="true" id="${toastId}">
      <div class="d-flex">
        <div class="toast-body">
          <i class="bi bi-${icon} me-2"></i>
          ${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Cerrar"></button>
      </div>
    </div>
  `;

  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = DaleDeal.utils.createToastContainer(config.position);
  }

  toastContainer.insertAdjacentHTML('beforeend', toastHTML);

  const toastElement = document.getElementById(toastId);
  const toast = new bootstrap.Toast(toastElement, {
    delay: config.duration,
    autohide: config.duration > 0
  });

  toast.show();

  toastElement.addEventListener('hidden.bs.toast', () => {
    toastElement.remove();
  });

  return toastElement;
};

/**
 * Mostrar notificación estilo Alert (custom)
 */
DaleDeal.utils.showAlert = (message, type, config) => {
  const container =
    document.getElementById("notificationContainer") ||
    DaleDeal.utils.createNotificationContainer(config.position);

  const alertClass = DaleDeal.utils.getBootstrapAlertClass(type);
  const icon = DaleDeal.utils.getNotificationIcon(type);

  const notification = document.createElement("div");
  notification.className = `alert ${alertClass} alert-dismissible fade show notification-item`;
  notification.innerHTML = `
    <div class="d-flex align-items-center">
      <i class="bi bi-${icon} me-2"></i>
      <div class="flex-grow-1">
        <div>${message}</div>
      </div>
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
    </div>
  `;

  notification.style.cssText = `
    margin-bottom: 10px;
    animation: slideInRight 0.3s ease-out;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  `;

  container.appendChild(notification);

  if (config.duration > 0) {
    setTimeout(() => {
      if (notification.parentNode) {
        notification.classList.remove("show");
        setTimeout(() => {
          if (notification.parentNode) {
            notification.remove();
          }
        }, 150);
      }
    }, config.duration);
  }

  return notification;
};

/**
 * Crear contenedor de notificaciones tipo Alert
 */
DaleDeal.utils.createNotificationContainer = (position = 'bottom-right') => {
  const container = document.createElement("div");
  container.className = "notification-container position-fixed";
  container.id = "notificationContainer";

  const positions = {
    'top-right': 'top: 20px; right: 20px;',
    'top-left': 'top: 20px; left: 20px;',
    'bottom-right': 'bottom: 28px; right: 128px;',
    'bottom-left': 'bottom: 28px; left: 20px;'
  };

  container.style.cssText = `
    ${positions[position] || positions['bottom-right']}
    z-index: 9999;
    max-width: 350px;
  `;

  document.body.appendChild(container);
  return container;
};

/**
 * Crear contenedor de toasts
 */
DaleDeal.utils.createToastContainer = (position = 'bottom-right') => {
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.className = 'toast-container position-fixed p-3';
  container.style.zIndex = '9999';

  const positionClasses = {
    'top-right': 'top-0 end-0',
    'top-left': 'top-0 start-0',
    'bottom-right': 'bottom-0 end-0',
    'bottom-left': 'bottom-0 start-0'
  };

  container.className += ' ' + (positionClasses[position] || positionClasses['bottom-right']);

  document.body.appendChild(container);
  return container;
};

/**
 * Obtener icono según tipo
 */
DaleDeal.utils.getNotificationIcon = (type) => {
  const icons = {
    success: "check-circle-fill",
    error: "exclamation-triangle-fill",
    warning: "exclamation-triangle-fill",
    info: "info-circle-fill",
  };
  return icons[type] || "info-circle-fill";
};

/**
 * Obtener clase de Bootstrap para background (toasts)
 */
DaleDeal.utils.getBootstrapBgClass = (type) => {
  const classes = {
    success: "bg-success",
    error: "bg-danger",
    warning: "bg-warning",
    info: "bg-primary",
  };
  return classes[type] || "bg-primary";
};

/**
 * Obtener clase de Bootstrap para alertas
 */
DaleDeal.utils.getBootstrapAlertClass = (type) => {
  const classes = {
    success: "alert-success",
    error: "alert-danger",
    warning: "alert-warning",
    info: "alert-info",
  };
  return classes[type] || "alert-info";
};

// ===== UTILIDADES DE SEGURIDAD =====
/**
 * Escapa caracteres HTML para evitar XSS en interpolaciones de innerHTML.
 * Usar siempre que se inserte texto de usuario en innerHTML.
 */
DaleDeal.utils.escapeHtml = (str) => {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

// ===== UTILIDADES DE UI =====
/**
 * Renderiza estrellas de rating como HTML de Bootstrap Icons.
 * Fuente canónica — usar en lugar de implementaciones locales en cada módulo.
 * @param {number} rating - Valor entre 0 y 5 (acepta decimales tipo 4.5)
 * @returns {string} HTML string con los íconos de estrellas
 */
DaleDeal.utils.renderStars = (rating) => {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  let html = '';
  for (let i = 0; i < fullStars; i++) html += '<i class="bi bi-star-fill"></i>';
  if (hasHalf) html += '<i class="bi bi-star-half"></i>';
  const empty = 5 - fullStars - (hasHalf ? 1 : 0);
  for (let i = 0; i < empty; i++) html += '<i class="bi bi-star"></i>';
  return html;
};

// ===== FALLBACK DE IMAGEN ROTA =====
// SVG placeholder mostrado cuando una imagen de producto/servicio no carga
DaleDeal.utils.PLACEHOLDER_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f0f0f0'/%3E%3Crect x='150' y='90' width='100' height='80' rx='8' fill='%23d0d0d0'/%3E%3Ccircle cx='175' cy='115' r='12' fill='%23b0b0b0'/%3E%3Cpolygon points='150,170 190,130 220,155 250,120 300,170' fill='%23b0b0b0'/%3E%3Ctext x='200' y='210' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%23999'%3EImagen no disponible%3C/text%3E%3C/svg%3E";

/**
 * Aplica el placeholder a una imagen rota. Usar en onerror o llamar directamente.
 */
DaleDeal.utils.handleImageError = (img) => {
  if (img.src !== DaleDeal.utils.PLACEHOLDER_IMG) {
    img.src = DaleDeal.utils.PLACEHOLDER_IMG;
    img.style.objectFit = 'contain';
  }
};

// ===== INICIALIZACIÓN =====
DaleDeal.utils.init = () => {
  DaleDeal.state.cart = DaleDeal.utils.storage.get("cart", []);
  DaleDeal.state.favorites = DaleDeal.utils.storage.get("favorites", []);
  DaleDeal.state.user = DaleDeal.utils.storage.get("user", null);

  window.addEventListener("online", () => {
    DaleDeal.utils.showNotification("Conexión restablecida.", "success");
  });

  window.addEventListener("offline", () => {
    DaleDeal.utils.showNotification("Se perdió la conexión a internet.", "warning");
  });

  // Captura errores de carga de imágenes de producto/servicio en toda la app
  const PRODUCT_IMG_CLASSES = ["product-image", "service-image", "cart-item-image", "main-image"];
  document.addEventListener("error", (e) => {
    const img = e.target;
    if (img.tagName === "IMG" && PRODUCT_IMG_CLASSES.some(c => img.classList.contains(c))) {
      DaleDeal.utils.handleImageError(img);
    }
  }, true);

  DaleDeal.utils.createToastContainer();

  // Flash messages — leemos sessionStorage por si la página anterior dejó
  // un mensaje (ej. api.js redirige a login con "Tu sesión expiró"). Los
  // mostramos UNA vez como toast y limpiamos para que no se repitan.
  try {
    const flashRaw = sessionStorage.getItem('daledeal:flash');
    if (flashRaw) {
      sessionStorage.removeItem('daledeal:flash');
      const flash = JSON.parse(flashRaw);
      if (flash && flash.message) {
        // setTimeout para asegurar que el toast container esté listo
        setTimeout(() => {
          DaleDeal.utils.showNotification(flash.message, flash.type || 'info', flash.duration || 5000);
        }, 200);
      }
    }
  } catch (_) { /* ignore */ }

  DaleDeal.log("Utils inicializados");
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", DaleDeal.utils.init);
} else {
  DaleDeal.utils.init();
}

// ===== NAVEGACIÓN A PRODUCTO =====
// Función global usada desde cualquier página para navegar al detalle de producto.
window.goToProduct = function(productId) {
  localStorage.setItem('daledeal:product:selected', productId);
  const path = window.location.pathname;
  if (path.includes('producto.html')) {
    window.location.href = window.location.pathname + '?id=' + productId;
  } else if (path.includes('/HTML/')) {
    window.location.href = './producto.html?id=' + productId;
  } else {
    window.location.href = './HTML/producto.html?id=' + productId;
  }
};
/**
 * =====================================================
 * DALE DEAL — theme.js
 * Maneja: Dark Mode, Barra de Anuncios, Back to Top
 * =====================================================
 */

/* =====================================================
   DARK MODE
   ===================================================== */
(function () {
  const STORAGE_KEY = 'daledeal:theme';

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const iconClass = theme === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-stars-fill';
    const icon = document.getElementById('themeIcon');
    if (icon) icon.className = iconClass;
    const iconMobile = document.getElementById('themeIconMobile');
    if (iconMobile) iconMobile.className = iconClass;
  }

  function getStoredTheme() {
    try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
  }

  function setStoredTheme(theme) {
    try { localStorage.setItem(STORAGE_KEY, theme); } catch {}
  }

  function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function initTheme() {
    const stored = getStoredTheme();
    const theme  = stored || getSystemTheme();
    applyTheme(theme);
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next    = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    setStoredTheme(next);
  }

  // Aplicar tema antes del primer render (evita flash)
  initTheme();

  document.addEventListener('DOMContentLoaded', function () {
    initTheme(); // Re-aplicar cuando el DOM esté listo (el icon puede no existir aún)

    // Botón toggle en navbar desktop
    const btn = document.getElementById('themeToggle');
    if (btn) btn.addEventListener('click', toggleTheme);

    // Botón toggle en menú mobile — delegación porque el header se carga dinámicamente
    document.addEventListener('click', function(e) {
      if (e.target.closest('#themeToggleMobile')) toggleTheme();
    });

    // Escuchar cambios del sistema en tiempo real
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!getStoredTheme()) applyTheme(e.matches ? 'dark' : 'light');
    });
  });
})();


/* =====================================================
   BACK TO TOP
   ===================================================== */
(function () {
  function createBackToTopButton() {
    if (document.getElementById('backToTop')) return;
    const btn = document.createElement('button');
    btn.id    = 'backToTop';
    btn.title = 'Volver arriba';
    btn.innerHTML = '<i class="bi bi-arrow-up"></i>';
    document.body.appendChild(btn);

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }
    }, { passive: true });
  }

  document.addEventListener('DOMContentLoaded', createBackToTopButton);
})();


/* =====================================================
   SKELETON HELPERS — expuesto globalmente
   ===================================================== */
window.DaleDealTheme = window.DaleDealTheme || {};

/**
 * Genera N tarjetas skeleton para mostrar mientras cargan los productos.
 * @param {number} count - cantidad de skeletons
 * @returns {string} HTML de las tarjetas
 */
window.DaleDealTheme.renderSkeletons = function (count = 8) {
  return Array.from({ length: count }, () => `
    <div class="col">
      <div class="product-card-skeleton">
        <div class="sk-image skeleton"></div>
        <div class="sk-body">
          <div class="sk-title skeleton"></div>
          <div class="sk-price skeleton"></div>
          <div class="sk-stars skeleton"></div>
          <div class="sk-btn skeleton"></div>
        </div>
      </div>
    </div>
  `).join('');
};


/* =====================================================
   LAZY IMAGE FADE-IN
   ===================================================== */
(function () {
  function markLoaded(img) {
    if (img.classList.contains('loaded')) return;
    if (img.complete && img.naturalWidth > 0) {
      img.classList.add('loaded');
    } else {
      img.addEventListener('load', () => img.classList.add('loaded'), { once: true });
      img.addEventListener('error', () => img.classList.add('loaded'), { once: true });
    }
  }

  function initLazyImages(root = document) {
    root.querySelectorAll('img[loading="lazy"]').forEach(markLoaded);
  }

  function observeNewLazyImages() {
    const mo = new MutationObserver(mutations => {
      for (const m of mutations) {
        m.addedNodes.forEach(node => {
          if (node.nodeType !== 1) return;
          if (node.tagName === 'IMG' && node.getAttribute('loading') === 'lazy') {
            markLoaded(node);
          } else if (node.querySelectorAll) {
            node.querySelectorAll('img[loading="lazy"]').forEach(markLoaded);
          }
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initLazyImages();
    observeNewLazyImages();
  });
})();
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
/**
 * =====================================================
 * DALE DEAL - Sistema de Dropdowns (Bootstrap)
 * =====================================================
 */

class DropdownManager {
  constructor() {
    this.activeDropdowns = new Set();
    this.isInitialized = false;

    this.init();
  }

  // ===== INICIALIZACIÓN =====
  init() {
    if (this.isInitialized) return;

    this.setupBootstrapDropdowns();
    this.setupGlobalHandlers();
    this.isInitialized = true;

    DaleDeal.log("✅ DropdownManager inicializado");
  }

  // ===== BOOTSTRAP DROPDOWNS =====
  setupBootstrapDropdowns() {
    document.addEventListener("show.bs.dropdown", (event) => {
      const dropdown = event.target;
      const menu = dropdown.querySelector(".dropdown-menu");

      if (menu) {
        this.positionBootstrapDropdown(dropdown, menu);
        this.createBackdrop(menu, dropdown);
        this.activeDropdowns.add(menu);
      }
    });

    document.addEventListener("hide.bs.dropdown", (event) => {
      const dropdown = event.target;
      const menu = dropdown.querySelector(".dropdown-menu");

      if (menu) {
        ["position", "top", "right", "left", "transform", "bottom"].forEach(
          (p) => menu.style.removeProperty(p)
        );
        menu.classList.remove("dropdown-fixed");
        this.activeDropdowns.delete(menu);
        this.removeBackdrop();
      }
    });
  }

  positionBootstrapDropdown(dropdown, menu) {
    // En mobile pequeño (< 576px) el CSS ya centra el dropdown como modal.
    // Si el JS aplica positioning inline con !important, anula el CSS.
    // Dejamos que el CSS tome control en estas pantallas.
    if (window.innerWidth < 576) {
      menu.classList.add("dropdown-fixed");
      return;
    }

    const toggle =
      dropdown.querySelector('[data-bs-toggle="dropdown"]') || dropdown;
    const rect = toggle.getBoundingClientRect();

    const navbar = toggle.closest("nav") || document.querySelector("#mainNavbar, nav.navbar");
    const anchorBottom = navbar ? navbar.getBoundingClientRect().bottom : rect.bottom;

    const vw = window.innerWidth;
    const top = anchorBottom + 6;

    let right = vw - rect.right;
    if (right < 8) right = 8;

    menu.style.setProperty("position", "fixed", "important");
    menu.style.setProperty("top", `${top}px`, "important");
    menu.style.setProperty("right", `${right}px`, "important");
    menu.style.setProperty("left", "auto", "important");
    menu.style.setProperty("transform", "none", "important");
    menu.style.setProperty("bottom", "auto", "important");
    menu.classList.add("dropdown-fixed");
  }

  createBackdrop(dropdown, button) {
    this.removeBackdrop();

    const backdrop = document.createElement("div");
    backdrop.className = "dropdown-backdrop";
    backdrop.setAttribute("data-dropdown-backdrop", "true");
    const bgColor = window.innerWidth < 768 ? "rgba(0,0,0,0.45)" : "transparent";
    backdrop.style.cssText = `
      position: fixed !important;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 999;
      background: ${bgColor};
      cursor: default;
    `;

    document.body.appendChild(backdrop);

    backdrop.addEventListener("click", () => {
      const bsDropdown = bootstrap.Dropdown.getInstance(button);
      if (bsDropdown) {
        bsDropdown.hide();
      }
    });
  }

  removeBackdrop() {
    const backdrop = document.querySelector(".dropdown-backdrop");
    if (backdrop) {
      backdrop.remove();
    }
  }

  closeAllDropdowns() {
    const openBootstrapDropdowns = document.querySelectorAll(".dropdown-menu.show");
    openBootstrapDropdowns.forEach((menu) => {
      const button = menu
        .closest(".dropdown")
        .querySelector('[data-bs-toggle="dropdown"]');
      if (button) {
        const bsDropdown = bootstrap.Dropdown.getInstance(button);
        if (bsDropdown) {
          bsDropdown.hide();
        }
      }
    });
  }

  // ===== MANEJADORES GLOBALES =====
  setupGlobalHandlers() {
    window.addEventListener("resize", () => {
      this.closeAllDropdowns();
    });

    document.addEventListener("click", (e) => {
      if (e.target.matches("a[href], .nav-link, .navbar-brand")) {
        this.closeAllDropdowns();
      }
    });

    window.addEventListener("beforeunload", () => {
      this.closeAllDropdowns();
    });
  }

  // ===== FEEDBACK =====
  showFeedback(message, type = "info") {
    if (window.DaleDeal?.utils?.showNotification) {
      window.DaleDeal.utils.showNotification(message, type);
    } else if (window.authManager?.showNotification) {
      window.authManager.showNotification(message, type);
    } else {
      DaleDeal.log(message);
    }
  }
}

// ===== INICIALIZACIÓN AUTOMÁTICA =====
let dropdownManager;

function initializeDropdowns() {
  if (!dropdownManager) {
    dropdownManager = new DropdownManager();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeDropdowns);
} else {
  initializeDropdowns();
}

window.dropdownManager = dropdownManager;
window.DropdownManager = DropdownManager;
// =====================================================
// DALE DEAL – Demo Adapter
// Centraliza toda la lógica de simulación para que
// sea fácil de reemplazar cuando haya un backend real.
// =====================================================

const DemoAdapter = (() => {

  /**
   * Simula latencia de red sin errores aleatorios.
   * Reemplazar por la llamada real al backend.
   */
  function demoDelay(ms = 800) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Muestra una notificación usando el sistema centralizado de DaleDeal.
   * Fallback a un banner inline en #alertContainer.
   */
  function notify(message, type = 'info') {
    if (window.DaleDeal?.utils?.showNotification) {
      window.DaleDeal.utils.showNotification(message, type);
      return;
    }
    if (window.authManager?.showNotification) {
      window.authManager.showNotification(message, type);
      return;
    }
    // Last-resort: banner inline
    const container = document.getElementById('alertContainer');
    if (!container) return;
    const el = document.createElement('div');
    el.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show`;
    el.setAttribute('role', 'alert');
    el.innerHTML = `${message}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>`;
    container.appendChild(el);
    setTimeout(() => el.remove(), 6000);
  }

  /**
   * Notifica honestamente que una acción no está implementada en modo demo.
   * @param {string} label – Nombre legible de la acción o función.
   */
  function notifyUnimplemented(label = 'Esta función') {
    notify(`${label} no está disponible en la versión demo.`, 'warning');
  }

  return { demoDelay, notify, notifyUnimplemented };
})();

window.DemoAdapter = DemoAdapter;
// Shared AOS (Animate On Scroll) initialization
// Included by: index.html, HTML/productos.html, HTML/servicios.html, HTML/producto.html, HTML/servicio.html
// Note: HTML/publicar.html uses a different config (duration: 400) and initializes inline.
//
// disable en viewports angostos — los elementos data-aos="fade-left"/"fade-right"
// arrancan con translateX(100px) y opacity:0 hasta entrar al viewport. En
// pantallas chicas eso causa overflow horizontal (el elemento queda corrido
// afuera del viewport) y bloquea visibilidad de contenido above-the-fold.
// Uso una función basada en ancho (≤768px) en vez del preset 'mobile' que se
// basa en user-agent y falla en navegadores que no se identifican como móviles.
if (typeof AOS !== 'undefined') {
  AOS.init({
    duration: 800,
    easing: 'ease-out-cubic',
    once: true,
    offset: 50,
    disable: () => window.matchMedia('(max-width: 768px)').matches,
  });
}
