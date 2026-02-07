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
DaleDeal.formatCurrency = DaleDeal.utils.formatPrice;
DaleDeal.utils.formatCurrency = DaleDeal.utils.formatPrice;

DaleDeal.utils.formatDate = (date) => {
  return new Intl.DateTimeFormat("es-AR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
};

DaleDeal.utils.formatRelativeTime = (date) => {
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Hace un momento";
  if (minutes < 60) return `Hace ${minutes} minuto${minutes > 1 ? "s" : ""}`;
  if (hours < 24) return `Hace ${hours} hora${hours > 1 ? "s" : ""}`;
  return `Hace ${days} día${days > 1 ? "s" : ""}`;
};

// ===== UTILIDADES DE VALIDACIÓN =====
DaleDeal.utils.isValidEmail = (email) => {
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email) && email.length <= 254;
};

DaleDeal.utils.isValidPassword = (password) => {
  return password && password.length >= 8;
};

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

  // Bonificaciones
  if (password.length >= 12) score += 10;
  if (password.match(/[!@#$%^&*(),.?":{}|<>]/)) score += 5;

  // Penalizaciones
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

// ===== UTILIDADES DE DOM =====
DaleDeal.utils.createElement = (tag, className = "", content = "") => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (content) element.innerHTML = content;
  return element;
};

DaleDeal.utils.debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

DaleDeal.utils.throttle = (func, limit) => {
  let inThrottle;
  return function () {
    const args = arguments;

    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

DaleDeal.utils.smoothScrollTo = (element) => {
  element.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
};

// ===== UTILIDADES DE ANIMACIÓN =====
DaleDeal.utils.fadeIn = (element, duration = 300) => {
  element.style.opacity = "0";
  element.style.display = "block";

  let opacity = 0;
  const timer = setInterval(() => {
    opacity += 50 / duration;
    if (opacity >= 1) {
      clearInterval(timer);
      opacity = 1;
    }
    element.style.opacity = opacity;
  }, 50);
};

DaleDeal.utils.fadeOut = (element, duration = 300) => {
  let opacity = 1;
  const timer = setInterval(() => {
    opacity -= 50 / duration;
    if (opacity <= 0) {
      clearInterval(timer);
      element.style.display = "none";
      opacity = 0;
    }
    element.style.opacity = opacity;
  }, 50);
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
  // Normalizar el tipo para compatibilidad
  const normalizedType = type === 'danger' ? 'error' : type;

  // Configuración por defecto
  const config = {
    style: options.style || 'toast', // 'alert' o 'toast'
    position: options.position || 'bottom-right',
    duration: duration,
    ...options
  };

  // Decidir qué estilo usar
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

  // Obtener o crear contenedor de toasts
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

  const notification = DaleDeal.utils.createElement(
    "div",
    `alert ${alertClass} alert-dismissible fade show notification-item`,
    `
      <div class="d-flex align-items-center">
        <i class="bi bi-${icon} me-2"></i>
        <div class="flex-grow-1">
          <div>${message}</div>
        </div>
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
      </div>
    `
  );

  notification.style.cssText = `
    margin-bottom: 10px;
    animation: slideInRight 0.3s ease-out;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  `;

  container.appendChild(notification);

  // Auto-dismiss
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
DaleDeal.utils.createNotificationContainer = (position = 'top-right') => {
  const container = DaleDeal.utils.createElement(
    "div",
    "notification-container position-fixed"
  );
  container.id = "notificationContainer";

  // Configurar posición
  const positions = {
    'top-right': 'top: 20px; right: 20px;',
    'top-left': 'top: 20px; left: 20px;',
    'bottom-right': 'bottom: 20px; right: 20px;',
    'bottom-left': 'bottom: 20px; left: 20px;'
  };

  container.style.cssText = `
    ${positions[position] || positions['top-right']}
    z-index: 1055;
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

  // Configurar posición
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

// ===== UTILIDADES DE FORMULARIOS =====
DaleDeal.utils.validateField = (field) => {
  const isValid = field.checkValidity();

  if (!isValid) {
    field.classList.add("is-invalid");
    field.classList.remove("is-valid");
  } else {
    field.classList.remove("is-invalid");
    field.classList.add("is-valid");
  }

  return isValid;
};

DaleDeal.utils.clearFieldError = (field) => {
  field.classList.remove("is-invalid");
};

DaleDeal.utils.setLoadingState = (button, loading) => {
  const btnText = button.querySelector(".btn-text");
  const btnLoading = button.querySelector(".btn-loading");

  if (loading) {
    if (btnText) btnText.classList.add("d-none");
    if (btnLoading) btnLoading.classList.remove("d-none");
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
  } else {
    if (btnText) btnText.classList.remove("d-none");
    if (btnLoading) btnLoading.classList.add("d-none");
    button.disabled = false;
    button.removeAttribute("aria-busy");
  }
};

DaleDeal.utils.collectFormData = (form) => {
  const formData = new FormData(form);
  const data = {};

  for (const [key, value] of formData.entries()) {
    if (data[key]) {
      if (Array.isArray(data[key])) {
        data[key].push(value);
      } else {
        data[key] = [data[key], value];
      }
    } else {
      data[key] = value;
    }
  }

  return data;
};

// ===== UTILIDADES DE PRODUCTOS =====
DaleDeal.utils.generateStars = (rating) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  let starsHTML = "";

  for (let i = 0; i < fullStars; i++) {
    starsHTML += '<i class="bi bi-star-fill"></i>';
  }

  if (hasHalfStar) {
    starsHTML += '<i class="bi bi-star-half"></i>';
  }

  const emptyStars = 5 - Math.ceil(rating);
  for (let i = 0; i < emptyStars; i++) {
    starsHTML += '<i class="bi bi-star"></i>';
  }

  return starsHTML;
};

DaleDeal.utils.calculateDiscount = (originalPrice, currentPrice) => {
  if (!originalPrice || originalPrice <= currentPrice) return 0;
  return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
};

// ===== UTILIDADES DE DISPOSITIVO =====
DaleDeal.utils.isMobile = () => {
  return window.innerWidth <= DaleDeal.CONFIG.BREAKPOINTS.md;
};

DaleDeal.utils.isTablet = () => {
  return (
    window.innerWidth > DaleDeal.CONFIG.BREAKPOINTS.md &&
    window.innerWidth <= DaleDeal.CONFIG.BREAKPOINTS.lg
  );
};

DaleDeal.utils.isDesktop = () => {
  return window.innerWidth > DaleDeal.CONFIG.BREAKPOINTS.lg;
};

DaleDeal.utils.getDeviceType = () => {
  if (DaleDeal.utils.isMobile()) return "mobile";
  if (DaleDeal.utils.isTablet()) return "tablet";
  return "desktop";
};

// ===== UTILIDADES DE RED =====
DaleDeal.utils.isOnline = () => {
  return navigator.onLine;
};

DaleDeal.utils.handleNetworkError = (error) => {
  if (!navigator.onLine) {
    return "No hay conexión a internet. Verificá tu conexión y volvé a intentar.";
  }

  if (error.name === "TypeError" && error.message.includes("fetch")) {
    return "Error de conexión. Verificá tu conexión a internet.";
  }

  return (
    error.message ||
    "Ha ocurrido un error inesperado. Por favor, intentá nuevamente."
  );
};

// ===== UTILIDADES DE SEGURIDAD =====
DaleDeal.utils.sanitizeInput = (input) => {
  if (typeof input !== "string") return "";
  const div = document.createElement("div");
  div.textContent = input;
  return div.innerHTML;
};

DaleDeal.utils.generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

// ===== UTILIDADES DE URL =====
DaleDeal.utils.getUrlParams = () => {
  const params = new URLSearchParams(window.location.search);
  const result = {};
  for (const [key, value] of params) {
    result[key] = value;
  }
  return result;
};

DaleDeal.utils.updateUrlParams = (params) => {
  const url = new URL(window.location);
  Object.keys(params).forEach((key) => {
    if (params[key] !== null && params[key] !== undefined) {
      url.searchParams.set(key, params[key]);
    } else {
      url.searchParams.delete(key);
    }
  });
  window.history.replaceState({}, "", url);
};

// ===== INICIALIZACIÓN =====
DaleDeal.utils.init = () => {
  // Cargar estado desde localStorage
  DaleDeal.state.cart = DaleDeal.utils.storage.get("cart", []);
  DaleDeal.state.favorites = DaleDeal.utils.storage.get("favorites", []);
  DaleDeal.state.user = DaleDeal.utils.storage.get("user", null);

  // Event listeners globales
  window.addEventListener("online", () => {
    DaleDeal.utils.showNotification("Conexión restablecida.", "success");
  });

  window.addEventListener("offline", () => {
    DaleDeal.utils.showNotification(
      "Se perdió la conexión a internet.",
      "warning"
    );
  });

  // Crear contenedor de toasts (preferido)
  DaleDeal.utils.createToastContainer();

  DaleDeal.log("Utils inicializados");
};

// Auto-inicializar cuando el DOM esté listo
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", DaleDeal.utils.init);
} else {
  DaleDeal.utils.init();
}

// Exponer para debugging en desarrollo
if (
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
) {
  window.DaleDealer = DaleDeal;
}
