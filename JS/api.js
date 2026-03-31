// =====================================================
// DALE DEAL - API de Productos
// =====================================================

/**
 * Carga los datos de productos desde el archivo JSON
 * @returns {Promise<Array>} Array de productos
 * @throws {Error} Si hay un error al cargar o parsear los datos
 */
async function fetchProducts() {
  try {
    const isRoot = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');
    const jsonPath = isRoot ? './products.json' : '../products.json';

    const response = await fetch(jsonPath);

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();

    if (!data) {
      throw new Error('No se encontraron datos de productos');
    }

    const productsArray = Object.values(data);
    DaleDeal.log(`${productsArray.length} productos cargados`);
    return productsArray;

  } catch (error) {
    if (error instanceof TypeError) {
      DaleDeal.error('Error de red o CORS al cargar productos:', error.message);
      throw new Error('No se pudo conectar con el servidor. Verifica tu conexión a internet.');
    } else if (error instanceof SyntaxError) {
      DaleDeal.error('Error al parsear JSON:', error.message);
      throw new Error('El formato de datos de productos es inválido.');
    } else {
      DaleDeal.error('Error al cargar productos:', error.message);
      throw error;
    }
  }
}

/**
 * Busca productos por término de búsqueda
 */
async function searchProducts(searchTerm) {
  try {
    const products = await fetchProducts();
    const term = searchTerm.toLowerCase();

    return products.filter(p =>
      p.title.toLowerCase().includes(term) ||
      p.description.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term) ||
      p.subcategory.toLowerCase().includes(term)
    );
  } catch (error) {
    DaleDeal.error('Error al buscar productos:', error.message);
    throw error;
  }
}

// =====================================================
// PUBLICAR — stubs locales (sin backend)
// =====================================================

/**
 * Simula la creación de un producto.
 * Guarda en localStorage y devuelve el objeto creado.
 */
async function createProduct(data) {
  await new Promise(r => setTimeout(r, 600));
  const product = { ...data, id: Date.now(), createdAt: new Date().toISOString() };
  try {
    const existing = JSON.parse(localStorage.getItem('daledeal_my_products') || '[]');
    existing.push(product);
    localStorage.setItem('daledeal_my_products', JSON.stringify(existing));
  } catch (_) { /* quota o parse error — ignorar */ }
  return product;
}

/**
 * Simula la creación de un servicio.
 * Guarda en localStorage y devuelve el objeto creado.
 */
async function createService(data) {
  await new Promise(r => setTimeout(r, 600));
  const service = { ...data, id: Date.now(), createdAt: new Date().toISOString() };
  try {
    const existing = JSON.parse(localStorage.getItem('daledeal_my_services') || '[]');
    existing.push(service);
    localStorage.setItem('daledeal_my_services', JSON.stringify(existing));
  } catch (_) { /* quota o parse error — ignorar */ }
  return service;
}

/**
 * Busca servicios por término de búsqueda.
 * Filtra en memoria desde el array servicesData (services-data.js).
 */
async function searchServices(query) {
  const term = query.toLowerCase();
  // Soporta tanto window.servicesData como la variable global servicesData
  const data = (typeof window !== 'undefined' && window.servicesData)
    ? window.servicesData
    : (typeof servicesData !== 'undefined' ? servicesData : []);
  return data.filter(s =>
    (s.title || '').toLowerCase().includes(term) ||
    (s.description || '').toLowerCase().includes(term) ||
    (s.category || '').toLowerCase().includes(term)
  );
}

// Exportar funciones para uso global
if (typeof window !== 'undefined') {
  window.DaleDeal = window.DaleDeal || {};
  window.DaleDeal.api = {
    fetchProducts,
    searchProducts,
    createProduct,
    createService,
    searchServices,
  };
}
