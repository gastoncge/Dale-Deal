// =====================================================
// DALE DEAL - Cliente de API Real
// Conecta el frontend con el backend Express + PostgreSQL
// =====================================================

// URL del backend, resolución en orden:
//   1) window.DaleDeal.CONFIG.API_BASE_URL si está definido (override manual)
//   2) localhost:3000 si el frontend está corriendo en localhost / 127.0.0.1
//   3) Si está en cualquier otro hostname (producción), asume que el backend
//      está deployado en daledeal-backend.up.railway.app — cambialo cuando
//      tengas tu backend real desplegado.
function getApiUrl() {
  if (window.DaleDeal?.CONFIG?.API_BASE_URL) {
    return window.DaleDeal.CONFIG.API_BASE_URL;
  }
  const host = window.location.hostname;
  if (host === 'localhost' || host === '127.0.0.1' || host === '') {
    return 'http://localhost:3000';
  }
  // Backend en Railway (producción).
  // Cambiar a https://api.daledeal.com.ar cuando configures el CNAME en Cloudflare.
  return 'https://daledeal-backend-production.up.railway.app';
}
const API_URL = null; // legacy — no usar directamente

// =====================================================
// HELPERS INTERNOS
// =====================================================

function getToken() {
  return localStorage.getItem('daledeal:token');
}

/**
 * Traduce errores HTTP / de red a mensajes amigables en castellano,
 * priorizando el mensaje del backend si vino algo razonable.
 */
function friendlyError(status, backendMsg) {
  if (status === 0) {
    return 'No pudimos conectarnos al servidor. Revisá tu internet y volvé a intentar.';
  }
  if (status === 401) {
    return backendMsg && backendMsg !== 'Token requerido'
      ? backendMsg
      : 'Tu sesión expiró. Volvé a iniciar sesión.';
  }
  if (status === 403) return backendMsg || 'No tenés permiso para hacer esto.';
  if (status === 404) return backendMsg || 'No encontramos lo que buscabas.';
  if (status === 409) return backendMsg || 'Ya hay un registro con esos datos.';
  if (status === 429) return 'Demasiados intentos. Esperá un minuto y volvé a intentar.';
  if (status >= 500) return 'Tuvimos un problema en el servidor. Probá en unos minutos.';
  // 4xx genérico — usamos el mensaje del backend si existe
  return backendMsg || `Algo no funcionó (HTTP ${status}).`;
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${getApiUrl()}${path}`, { ...options, headers });
  } catch (networkErr) {
    // Sin red, CORS, DNS, etc.
    const err = new Error(friendlyError(0));
    err.status = 0;
    err.cause  = networkErr;
    throw err;
  }

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const err = new Error(friendlyError(res.status, errBody?.error));
    err.status = res.status;
    err.body   = errBody;
    // Auto-logout si el token expiró + flash + redirect a login.
    // Antes solo limpiaba el token y dejaba al usuario en el aire (la página
    // seguía rota porque su UI era para usuario loggeado). Ahora le avisamos
    // y lo mandamos a login con un return path para que vuelva donde estaba.
    if (res.status === 401 && token) {
      try {
        localStorage.removeItem('daledeal:token');
        localStorage.removeItem('daledeal:user');
        // Flash message para mostrar después del redirect
        sessionStorage.setItem('daledeal:flash', JSON.stringify({
          type: 'warning',
          message: 'Tu sesión expiró. Iniciá sesión de nuevo para continuar.'
        }));
      } catch (_) {}
      // Redirigir si no estamos ya en login/signup (evita loop) y no es un
      // request en background (ej. el polling de notificaciones — si redirige
      // por cada poll cuando token caducó, el user no puede ni ver el aviso).
      const path = window.location.pathname;
      const onAuthPage = /\/(login|signup|recuperar-contrasena)\.html$/.test(path);
      const isBackground = options._background === true;
      if (!onAuthPage && !isBackground) {
        const ret = encodeURIComponent(path + window.location.search);
        const loginUrl = path.includes('/HTML/')
          ? `./login.html?redirect=${ret}`
          : `./HTML/login.html?redirect=${ret}`;
        // Pequeño defer para que el throw se propague y el caller pueda
        // limpiar antes de la navegación.
        setTimeout(() => { window.location.href = loginUrl; }, 100);
      }
    }
    throw err;
  }

  // 204 No Content
  if (res.status === 204) return null;
  return res.json();
}

// =====================================================
// TRANSFORMAR PRODUCTO (formato backend → formato frontend)
// =====================================================

function transformProduct(p) {
  const images = Array.isArray(p.images) ? p.images : [];
  const mainImage = images[0] || 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=600&h=600&fit=crop';

  // Rating real desde el backend; 0 cuando todavía no tiene reseñas.
  const realRating = p.avg_rating != null ? parseFloat(p.avg_rating) : 0;
  const realCount  = p.review_count != null ? parseInt(p.review_count) : 0;

  return {
    id: p.id,
    title: p.title,
    category: p.category_name || 'Sin categoría',
    subcategory: p.category_slug || '',
    description: p.description || '',
    price: parseFloat(p.price),
    originalPrice: null,
    discount: null,
    rating: realRating,
    reviewCount: realCount,
    soldCount: 0,
    stock: p.stock || 0,
    condition: p.condition || 'new',
    location: p.location || 'Argentina',
    seller_id: p.seller_id,
    seller_name: p.seller_name,
    seller_avatar: p.seller_avatar,
    images: {
      main: mainImage,
      gallery: images.length > 0 ? images : [mainImage],
      thumbnails: images.length > 0 ? images : [mainImage],
    },
    colors: [],
    storage: [],
    features: [],
    specifications: {},
    badges: (p.stock > 0 && p.stock < 5) ? ['Stock limitado'] : [],
    shipping: { free: parseFloat(p.price) > 50000 },
    // Campos de envío del sprint logística (migración 003)
    shipping_required: !!p.shipping_required,
    offers_delivery:   !!p.offers_delivery,
    offers_pickup:     !!p.offers_pickup,
    shipping_cost:     p.shipping_cost != null ? parseFloat(p.shipping_cost) : null,
    pickup_address:    p.pickup_address || null,
  };
}

// =====================================================
// TRANSFORMAR SERVICIO (formato backend → formato frontend)
// =====================================================

function transformService(s) {
  const images = Array.isArray(s.images) ? s.images : [];
  const realRating = s.avg_rating != null ? parseFloat(s.avg_rating) : 0;
  const realCount  = s.review_count != null ? parseInt(s.review_count) : 0;
  return {
    id: s.id,
    title: s.title,
    description: s.description || '',
    category: s.category_slug || 'otros-servicios',
    price: parseFloat(s.price_from) || 0,
    priceFrom: parseFloat(s.price_from) || null,
    priceTo: parseFloat(s.price_to) || null,
    priceType: s.price_type || 'fixed',
    rating: realRating,
    reviewCount: realCount,
    location: s.location || 'Argentina',
    image: images[0] || 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&h=300&fit=crop',
    badges: [],
    provider_id: s.provider_id,
    provider_name: s.provider_name,
    featured: true,
  };
}

// =====================================================
// PRODUCTOS
// =====================================================

async function fetchProducts(filters = {}) {
  try {
    const params = new URLSearchParams(filters).toString();
    const data = await apiFetch(`/products${params ? '?' + params : ''}`);
    DaleDeal.log(`${(data.data || []).length} productos cargados desde la API`);
    return (data.data || []).map(transformProduct);
  } catch (error) {
    DaleDeal.error('Error al cargar productos:', error.message);
    throw new Error('No se pudo conectar con el servidor. Verificá tu conexión.');
  }
}

async function fetchProductById(id) {
  try {
    const product = await apiFetch(`/products/${id}`);
    return transformProduct(product);
  } catch (error) {
    DaleDeal.error('Error al cargar producto:', error.message);
    return null;
  }
}

async function searchProducts(searchTerm) {
  try {
    const data = await apiFetch(`/products?search=${encodeURIComponent(searchTerm)}`);
    return (data.data || []).map(transformProduct);
  } catch (error) {
    DaleDeal.error('Error al buscar productos:', error.message);
    throw error;
  }
}

async function createProduct(productData) {
  return apiFetch('/products', {
    method: 'POST',
    body: JSON.stringify(productData),
  });
}

// =====================================================
// SERVICIOS
// =====================================================

async function fetchServices(filters = {}) {
  try {
    const params = new URLSearchParams(filters).toString();
    const data = await apiFetch(`/services${params ? '?' + params : ''}`);
    return (data.data || []).map(transformService);
  } catch (error) {
    DaleDeal.error('Error al cargar servicios:', error.message);
    throw error;
  }
}

async function fetchServiceById(id) {
  try {
    const service = await apiFetch(`/services/${id}`);
    return transformService(service);
  } catch (error) {
    DaleDeal.error('Error al cargar servicio:', error.message);
    return null;
  }
}

async function createService(serviceData) {
  return apiFetch('/services', {
    method: 'POST',
    body: JSON.stringify(serviceData),
  });
}

// =====================================================
// AUTENTICACIÓN
// =====================================================

async function loginUser(email, password) {
  return apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

async function registerUser(name, email, password) {
  return apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
}

async function getMe() {
  return apiFetch('/auth/me');
}

// =====================================================
// USUARIOS
// =====================================================

async function getUserById(id) {
  return apiFetch(`/users/${id}`);
}

async function updateProfile(profileData) {
  return apiFetch('/users/me', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  });
}

async function getMyProducts() {
  return apiFetch('/users/me/products');
}

async function getMyServices() {
  return apiFetch('/users/me/services');
}

// =====================================================
// FAVORITOS
// =====================================================

async function fetchFavorites() {
  return apiFetch('/favorites');
}

async function addFavoriteApi(item_type, item_id) {
  return apiFetch('/favorites', {
    method: 'POST',
    body: JSON.stringify({ item_type, item_id: Number(item_id) }),
  });
}

async function removeFavoriteApi(item_type, item_id) {
  return apiFetch(`/favorites/item/${item_type}/${Number(item_id)}`, {
    method: 'DELETE',
  });
}

async function checkFavoriteApi(item_type, item_id) {
  return apiFetch(`/favorites/check/${item_type}/${Number(item_id)}`);
}

// =====================================================
// RESEÑAS (REVIEWS)
// =====================================================

async function fetchReviews(itemType, itemId, { page = 1, limit = 10 } = {}) {
  const path = `/reviews/${itemType}/${itemId}?page=${page}&limit=${limit}`;
  return apiFetch(path);
}

async function createReview({ item_type, item_id, rating, title, body }) {
  return apiFetch('/reviews', {
    method: 'POST',
    body: JSON.stringify({ item_type, item_id, rating, title, body }),
  });
}

async function updateReview(id, { rating, title, body }) {
  return apiFetch(`/reviews/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ rating, title, body }),
  });
}

async function deleteReview(id) {
  return apiFetch(`/reviews/${id}`, { method: 'DELETE' });
}

async function fetchUserReviews(userId, { page = 1, limit = 10 } = {}) {
  return apiFetch(`/reviews/user/${userId}?page=${page}&limit=${limit}`);
}

// =====================================================
// EXPORTAR PARA USO GLOBAL
// =====================================================

if (typeof window !== 'undefined') {
  window.DaleDeal = window.DaleDeal || {};
  window.DaleDeal.api = {
    // Productos
    fetchProducts,
    fetchProductById,
    searchProducts,
    createProduct,
    // Servicios
    fetchServices,
    fetchServiceById,
    createService,
    // Auth
    loginUser,
    registerUser,
    getMe,
    getToken,
    // Usuarios
    getUserById,
    updateProfile,
    getMyProducts,
    getMyServices,
    // Reseñas
    fetchReviews,
    createReview,
    updateReview,
    deleteReview,
    fetchUserReviews,
    // Favoritos
    fetchFavorites,
    addFavoriteApi,
    removeFavoriteApi,
    checkFavoriteApi,
    // Helper de bajo nivel
    apiFetch,
  };
}
// =====================================================
// DALE DEAL - Cliente de API para Mensajería
// Extiende window.DaleDeal.api con los métodos de /messages
// Requiere que api.js se haya cargado antes (para apiFetch).
// =====================================================

(function () {
  'use strict';

  if (typeof window === 'undefined') return;
  if (!window.DaleDeal || !window.DaleDeal.api || !window.DaleDeal.api.apiFetch) {
    console.warn('[api-messages] api.js no está cargado todavía — los métodos de mensajería no estarán disponibles');
    return;
  }

  const apiFetch = window.DaleDeal.api.apiFetch;

  // ============================================================
  // CONVERSACIONES
  // ============================================================

  /**
   * Lista las conversaciones del usuario.
   * @returns {Promise<Array>} array de conversaciones con metadata
   */
  async function listConversations() {
    const data = await apiFetch('/messages/conversations');
    return data.data || [];
  }

  /**
   * Inicia (o recupera) una conversación con el dueño de un item.
   * @param {'product'|'service'} item_type
   * @param {number} item_id
   * @param {string} [initial_message]
   */
  async function startConversation(item_type, item_id, initial_message) {
    return apiFetch('/messages/conversations', {
      method: 'POST',
      body:   JSON.stringify({ item_type, item_id, initial_message }),
    });
  }

  /**
   * Devuelve los mensajes de una conversación en orden cronológico.
   * @param {number} conversationId
   * @param {object} [opts]
   * @param {string} [opts.before] — ISO date para paginar mensajes anteriores
   * @param {number} [opts.limit]  — default 50, max 100
   */
  async function getMessages(conversationId, { before, limit } = {}) {
    const qs = new URLSearchParams();
    if (before) qs.append('before', before);
    if (limit)  qs.append('limit',  limit);
    const path = `/messages/conversations/${conversationId}/messages${qs.toString() ? '?' + qs.toString() : ''}`;
    const data = await apiFetch(path);
    return data.data || [];
  }

  /**
   * Envía un mensaje en una conversación.
   * @param {number} conversationId
   * @param {string} body
   * @returns {Promise<object>} mensaje creado
   */
  async function sendMessage(conversationId, body) {
    const res = await apiFetch(`/messages/conversations/${conversationId}/messages`, {
      method: 'POST',
      body:   JSON.stringify({ body }),
    });
    return res.message;
  }

  /**
   * Marca como leídos todos los mensajes recibidos en esta conversación.
   * @param {number} conversationId
   * @returns {Promise<number>} cantidad marcados
   */
  async function markConversationRead(conversationId) {
    const res = await apiFetch(`/messages/conversations/${conversationId}/read`, {
      method: 'POST',
    });
    return res.updated || 0;
  }

  /**
   * Total de mensajes no leídos del usuario (para badge global).
   */
  async function getUnreadCount() {
    try {
      const res = await apiFetch('/messages/unread-count');
      return res.unread || 0;
    } catch (e) {
      return 0;
    }
  }

  // ============================================================
  // Exportar
  // ============================================================
  window.DaleDeal.api.messages = {
    listConversations,
    startConversation,
    getMessages,
    sendMessage,
    markConversationRead,
    getUnreadCount,
  };
})();
// =====================================================
// DALE DEAL - Cliente de API de Pagos (Mercado Pago)
// -----------------------------------------------------
// Depende de window.DaleDeal.api.apiFetch (api.js).
// =====================================================

(function () {
  'use strict';

  function getApiFetch() {
    const apiFetch = window.DaleDeal?.api?.apiFetch;
    if (!apiFetch) {
      throw new Error('API no disponible. ¿Cargaste api.js antes?');
    }
    return apiFetch;
  }

  // -------------------------------------------------------
  // POST /payments/preference
  // -------------------------------------------------------
  // Crea (o recupera) la preferencia de MP para una orden.
  // Devuelve: { ok, preference_id, init_point, sandbox_init_point,
  //             total, commission, net_to_seller }
  // -------------------------------------------------------
  async function createPreference(orderId) {
    if (!orderId) throw new Error('orderId es requerido');
    return getApiFetch()('/payments/preference', {
      method: 'POST',
      body: JSON.stringify({ order_id: Number(orderId) }),
    });
  }

  // -------------------------------------------------------
  // GET /payments/:orderId/status
  // -------------------------------------------------------
  async function getStatus(orderId) {
    if (!orderId) throw new Error('orderId es requerido');
    return getApiFetch()(`/payments/${Number(orderId)}/status`);
  }

  // -------------------------------------------------------
  // Helper: redirige al checkout de MP para una orden dada.
  //
  // En desarrollo (credenciales TEST) usa sandbox_init_point;
  // en producción usa init_point.
  //
  // Guarda la orden actual en localStorage para poder
  // recuperarla desde la página de retorno si hace falta.
  // -------------------------------------------------------
  async function redirectToCheckout(orderId, { preferSandbox = null } = {}) {
    const pref = await createPreference(orderId);

    if (!pref || !pref.ok) {
      throw new Error('No se pudo crear la preferencia de pago.');
    }

    // Recordar la orden en curso (para pago-exitoso/fallido/pendiente)
    try {
      localStorage.setItem('daledeal:payment:order', String(orderId));
    } catch (_) {}

    // Si el backend nos dijo explícitamente si es sandbox, priorizamos eso.
    // Si no, usamos preferSandbox si viene, o por default init_point.
    const useSandbox = preferSandbox !== null
      ? preferSandbox
      : (pref.is_sandbox === true);

    const url = useSandbox
      ? (pref.sandbox_init_point || pref.init_point)
      : (pref.init_point || pref.sandbox_init_point);

    if (!url) {
      throw new Error('Mercado Pago no devolvió un link de checkout.');
    }

    window.location.href = url;
  }

  // -------------------------------------------------------
  // Helper: flujo completo desde una acción "Comprar ahora".
  //   1) POST /orders con product_id + quantity
  //   2) POST /payments/preference con la order_id devuelta
  //   3) Redirige al checkout de MP
  //
  // Devuelve la Promise del redirect — no vuelve.
  // -------------------------------------------------------
  async function buyProductNow({
    product_id,
    quantity = 1,
    shipping_method,        // 'delivery' | 'pickup' | undefined
    shipping_address_obj,   // { recipient_name, phone, street, city, province, postal_code, notes }
  }) {
    if (!product_id) throw new Error('product_id es requerido');

    const apiFetch = getApiFetch();

    // 1) Crear orden (con datos de envío si aplica)
    const orderBody = {
      product_id: Number(product_id),
      quantity:   Number(quantity) || 1,
    };
    if (shipping_method)      orderBody.shipping_method      = shipping_method;
    if (shipping_address_obj) orderBody.shipping_address_obj = shipping_address_obj;

    const orderRes = await apiFetch('/orders', {
      method: 'POST',
      body: JSON.stringify(orderBody),
    });

    const order = orderRes?.order || orderRes;
    const orderId = order?.id;
    if (!orderId) throw new Error('No se pudo crear la orden.');

    // Guardar conversation_id por si volvemos después de pagar
    try {
      const convId = orderRes?.conversation?.id;
      if (convId) localStorage.setItem('daledeal:payment:conv', String(convId));
    } catch (_) {}

    // 2) + 3) Crear preferencia y redirigir
    await redirectToCheckout(orderId);
  }

  // -------------------------------------------------------
  // Exportar
  // -------------------------------------------------------
  window.DaleDeal = window.DaleDeal || {};
  window.DaleDeal.payments = {
    createPreference,
    getStatus,
    redirectToCheckout,
    buyProductNow,
  };
})();
