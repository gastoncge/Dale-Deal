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
    // Detectar ruta correcta según ubicación
    const isRoot = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');
    const jsonPath = isRoot ? './products.json' : '../products.json';

    // Realizar petición al archivo JSON
    const response = await fetch(jsonPath);

    // Verificar que la respuesta sea exitosa
    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
    }

    // Parsear la respuesta como JSON
    const data = await response.json();

    // Verificar que los datos existan
    if (!data) {
      throw new Error('No se encontraron datos de productos');
    }

    // Convertir el objeto de productos a array
    const productsArray = Object.values(data);

    // Validar que haya productos
    if (productsArray.length === 0) {
      console.warn('Advertencia: El archivo de productos está vacío');
    }

    console.log(`✓ ${productsArray.length} productos cargados correctamente`);
    return productsArray;

  } catch (error) {
    // Manejo de diferentes tipos de errores
    if (error instanceof TypeError) {
      console.error('Error de red o CORS al cargar productos:', error.message);
      throw new Error('No se pudo conectar con el servidor. Verifica tu conexión a internet.');
    } else if (error instanceof SyntaxError) {
      console.error('Error al parsear JSON:', error.message);
      throw new Error('El formato de datos de productos es inválido.');
    } else {
      console.error('Error al cargar productos:', error.message);
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
    const product = products.find(p => p.id === Number(productId));

    if (!product) {
      console.warn(`Producto con ID ${productId} no encontrado`);
      return null;
    }

    return product;

  } catch (error) {
    console.error(`Error al buscar producto ${productId}:`, error.message);
    throw error;
  }
}

/**
 * Filtra productos por categoría
 * @param {string} category - Categoría a filtrar
 * @returns {Promise<Array>} Array de productos filtrados
 */
async function fetchProductsByCategory(category) {
  try {
    const products = await fetchProducts();
    const filtered = products.filter(p =>
      p.category.toLowerCase() === category.toLowerCase()
    );

    console.log(`✓ ${filtered.length} productos encontrados en la categoría "${category}"`);
    return filtered;

  } catch (error) {
    console.error(`Error al filtrar productos por categoría:`, error.message);
    throw error;
  }
}

/**
 * Filtra productos por subcategoría
 * @param {string} subcategory - Subcategoría a filtrar
 * @returns {Promise<Array>} Array de productos filtrados
 */
async function fetchProductsBySubcategory(subcategory) {
  try {
    const products = await fetchProducts();
    const filtered = products.filter(p =>
      p.subcategory.toLowerCase() === subcategory.toLowerCase()
    );

    console.log(`✓ ${filtered.length} productos encontrados en la subcategoría "${subcategory}"`);
    return filtered;

  } catch (error) {
    console.error(`Error al filtrar productos por subcategoría:`, error.message);
    throw error;
  }
}

/**
 * Busca productos por término de búsqueda
 * @param {string} searchTerm - Término a buscar en título y descripción
 * @returns {Promise<Array>} Array de productos que coinciden
 */
async function searchProducts(searchTerm) {
  try {
    const products = await fetchProducts();
    const term = searchTerm.toLowerCase();

    const results = products.filter(p =>
      p.title.toLowerCase().includes(term) ||
      p.description.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term) ||
      p.subcategory.toLowerCase().includes(term)
    );

    console.log(`✓ ${results.length} productos encontrados para "${searchTerm}"`);
    return results;

  } catch (error) {
    console.error(`Error al buscar productos:`, error.message);
    throw error;
  }
}

/**
 * Obtiene productos con descuento
 * @returns {Promise<Array>} Array de productos con descuento
 */
async function fetchDiscountedProducts() {
  try {
    const products = await fetchProducts();
    const discounted = products.filter(p => p.discount && p.discount > 0);

    console.log(`✓ ${discounted.length} productos con descuento encontrados`);
    return discounted;

  } catch (error) {
    console.error(`Error al obtener productos con descuento:`, error.message);
    throw error;
  }
}

/**
 * Ordena productos por precio
 * @param {string} order - 'asc' para ascendente, 'desc' para descendente
 * @returns {Promise<Array>} Array de productos ordenados
 */
async function fetchProductsSortedByPrice(order = 'asc') {
  try {
    const products = await fetchProducts();

    const sorted = [...products].sort((a, b) => {
      return order === 'asc' ? a.price - b.price : b.price - a.price;
    });

    console.log(`✓ Productos ordenados por precio (${order})`);
    return sorted;

  } catch (error) {
    console.error(`Error al ordenar productos:`, error.message);
    throw error;
  }
}

/**
 * Obtiene productos disponibles en stock
 * @returns {Promise<Array>} Array de productos con stock disponible
 */
async function fetchProductsInStock() {
  try {
    const products = await fetchProducts();
    const inStock = products.filter(p => p.stock > 0);

    console.log(`✓ ${inStock.length} productos en stock`);
    return inStock;

  } catch (error) {
    console.error(`Error al obtener productos en stock:`, error.message);
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

// Exportar para uso con módulos ES6 (si es necesario)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
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
