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
 * Obtiene un producto específico por su ID
 * @param {number|string} productId - ID del producto a buscar
 * @returns {Promise<Object|null>} Producto encontrado o null
 */
async function fetchProductById(productId) {
  try {
    const products = await fetchProducts();
    return products.find(p => p.id === Number(productId)) || null;
  } catch (error) {
    DaleDeal.error(`Error al buscar producto ${productId}:`, error.message);
    throw error;
  }
}

/**
 * Filtra productos por categoría
 */
async function fetchProductsByCategory(category) {
  try {
    const products = await fetchProducts();
    return products.filter(p =>
      p.category.toLowerCase() === category.toLowerCase()
    );
  } catch (error) {
    DaleDeal.error('Error al filtrar por categoría:', error.message);
    throw error;
  }
}

/**
 * Filtra productos por subcategoría
 */
async function fetchProductsBySubcategory(subcategory) {
  try {
    const products = await fetchProducts();
    return products.filter(p =>
      p.subcategory.toLowerCase() === subcategory.toLowerCase()
    );
  } catch (error) {
    DaleDeal.error('Error al filtrar por subcategoría:', error.message);
    throw error;
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

/**
 * Obtiene productos con descuento
 */
async function fetchDiscountedProducts() {
  try {
    const products = await fetchProducts();
    return products.filter(p => p.discount && p.discount > 0);
  } catch (error) {
    DaleDeal.error('Error al obtener productos con descuento:', error.message);
    throw error;
  }
}

/**
 * Ordena productos por precio
 */
async function fetchProductsSortedByPrice(order = 'asc') {
  try {
    const products = await fetchProducts();
    return [...products].sort((a, b) => {
      return order === 'asc' ? a.price - b.price : b.price - a.price;
    });
  } catch (error) {
    DaleDeal.error('Error al ordenar productos:', error.message);
    throw error;
  }
}

/**
 * Obtiene productos disponibles en stock
 */
async function fetchProductsInStock() {
  try {
    const products = await fetchProducts();
    return products.filter(p => p.stock > 0);
  } catch (error) {
    DaleDeal.error('Error al obtener productos en stock:', error.message);
    throw error;
  }
}

// Exportar funciones para uso global
if (typeof window !== 'undefined') {
  window.DaleDeal = window.DaleDeal || {};
  window.DaleDeal.api = {
    fetchProducts,
    fetchProductById,
    fetchProductsByCategory,
    fetchProductsBySubcategory,
    searchProducts,
    fetchDiscountedProducts,
    fetchProductsSortedByPrice,
    fetchProductsInStock
  };
}
