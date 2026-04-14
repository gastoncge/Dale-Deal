/**
 * =====================================================
 * DALE DEAL - Utilidades JavaScript Globales
 * =====================================================
 */

// ===== CONFIGURACIÓN GLOBAL =====
window.DaleDeal = {
  CONFIG: {
    DEBUG: window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1",
    API_BASE_URL: "https://api.daledeal.com",
    PRODUCTS_PER_PAGE: 12,
    SEARCH_DELAY: 300,
    ANIMATION_DURATION: 300,
    LOCAL_STORAGE_PREFIX: "daledealer_",
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

// Alias para compatibilidad
DaleDeal.utils.formatCurrency = DaleDeal.utils.formatPrice;

// Parsea un string de precio ARS a número (ej: "$ 1.234,56" → 1234.56)
DaleDeal.utils.parseARSPrice = (priceText) => {
  if (typeof priceText === 'number') return priceText;
  if (!priceText) return 0;
  // ARS: separador de miles = '.', decimal = ','
  const cleaned = String(priceText)
    .replace(/[^0-9,.]/g, '')   // quitar todo excepto dígitos, puntos y comas
    .replace(/\./g, '')          // quitar puntos (separadores de miles)
    .replace(',', '.');          // convertir coma decimal a punto
  return parseFloat(cleaned) || 0;
};

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

  DaleDeal.utils.createToastContainer();

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
  localStorage.setItem('selectedProductId', productId);
  const path = window.location.pathname;
  if (path.includes('producto.html')) {
    window.location.href = window.location.pathname + '?id=' + productId;
  } else if (path.includes('/HTML/')) {
    window.location.href = './producto.html?id=' + productId;
  } else {
    window.location.href = './HTML/producto.html?id=' + productId;
  }
};
