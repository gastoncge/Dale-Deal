// Product data for DALE DEAL
// Sin productos de ejemplo: antes había 6 inventados (iPhones, precios y
// descuentos) que aparecían en "similares", "vistos recientemente" y favoritos
// si la API tardaba o un id no existía. Se llena solo con la API (sync abajo).
const PRODUCTS_DATA = {};

// Function to get product by ID (busca en cache local, incluyendo datos de la API)
function getProductById(id) {
  return PRODUCTS_DATA[id] || null;
}

// Function to get all products
function getAllProducts() {
  return Object.values(PRODUCTS_DATA);
}

// =====================================================
// SINCRONIZACIÓN CON LA API REAL
// Los datos del backend se mezclan con los hardcodeados.
// Los productos de la API tienen prioridad.
// =====================================================
async function syncProductsFromAPI() {
  try {
    if (!window.DaleDeal?.api?.fetchProducts) return;
    const products = await window.DaleDeal.api.fetchProducts();
    products.forEach(p => {
      PRODUCTS_DATA[p.id] = p;
    });
    window.PRODUCTS_DATA = PRODUCTS_DATA;
    DaleDeal.log(`✅ product-data.js sincronizado: ${products.length} productos de la API`);

    // Actualizar UI: el contador "Cargando productos..." del header se quedaba
    // pegado porque syncProductsFromAPI no avisaba a la página. Trigger
    // re-render si está disponible algún loader/filtro que conoce los nuevos.
    if (window.ProductsPageLoader?.loadProducts) {
      try { await window.ProductsPageLoader.loadProducts(); } catch (_) {}
    }
    if (window.productFilters?.renderProducts) {
      try { window.productFilters.renderProducts(); } catch (_) {}
    }
    // Update directo del contador como red de seguridad (si nadie más lo hizo).
    const resultsCount = document.getElementById('resultsCount');
    if (resultsCount && resultsCount.textContent.includes('Cargando')) {
      const n = products.length;
      resultsCount.textContent = `${n} producto${n !== 1 ? 's' : ''} encontrado${n !== 1 ? 's' : ''}`;
    }
  } catch (err) {
    DaleDeal.warn('No se pudo sincronizar con la API, usando datos locales como fallback.', err.message);
  }
}

// Intentar sincronizar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', syncProductsFromAPI);
} else {
  syncProductsFromAPI();
}

// Make available globally
window.PRODUCTS_DATA = PRODUCTS_DATA;
window.getProductById = getProductById;
window.getAllProducts = getAllProducts;
window.syncProductsFromAPI = syncProductsFromAPI;