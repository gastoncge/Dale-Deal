// =====================================================
// DALE DEAL - Cliente de API Real
// Conecta el frontend con el backend Express + PostgreSQL
// =====================================================

// URL del backend: usa localhost en desarrollo, API_BASE_URL en producción
function getApiUrl() {
  if (window.DaleDeal?.CONFIG?.DEBUG) return 'http://localhost:3000';
  return window.DaleDeal?.CONFIG?.API_BASE_URL || 'http://localhost:3000';
}
const API_URL = null; // legacy — no usar directamente

// =====================================================
// HELPERS INTERNOS
// =====================================================

function getToken() {
  return localStorage.getItem('daledeal_token');
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${getApiUrl()}${path}`, { ...options, headers });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(errBody.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// =====================================================
// TRANSFORMAR PRODUCTO (formato backend → formato frontend)
// =====================================================

function transformProduct(p) {
  const images = Array.isArray(p.images) ? p.images : [];
  const mainImage = images[0] || 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=600&h=600&fit=crop';

  return {
    id: p.id,
    title: p.title,
    category: p.category_name || 'Sin categoría',
    subcategory: p.category_slug || '',
    description: p.description || '',
    price: parseFloat(p.price),
    originalPrice: null,
    discount: null,
    rating: 4.5,
    reviewCount: 0,
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
  };
}

// =====================================================
// TRANSFORMAR SERVICIO (formato backend → formato frontend)
// =====================================================

function transformService(s) {
  const images = Array.isArray(s.images) ? s.images : [];
  return {
    id: s.id,
    title: s.title,
    description: s.description || '',
    category: s.category_slug || 'otros-servicios',
    price: parseFloat(s.price_from) || 0,
    priceFrom: parseFloat(s.price_from) || null,
    priceTo: parseFloat(s.price_to) || null,
    priceType: s.price_type || 'fixed',
    rating: 4.5,
    reviewCount: 0,
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
    // Helper de bajo nivel
    apiFetch,
  };
}
