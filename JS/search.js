// =====================================================
// DALE DEAL - Product Search System
// =====================================================

class SearchManager {
  constructor() {
    this.searchInput = null;
    this.searchResults = [];
    this.isSearching = false;
    this.debounceTimer = null;
    this.init();
  }

  init() {
    // Esperar a que el DOM esté listo
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.bindEvents());
    } else {
      this.bindEvents();
    }
  }

  bindEvents() {
    // Buscar el input de búsqueda (puede estar en el componente header)
    const checkSearchInput = () => {
      this.searchInput = document.getElementById('searchInput');

      if (this.searchInput) {
        this.searchInput.addEventListener('input', (e) => this.handleSearch(e));
        this.searchInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            this.performSearch(e.target.value);
          }
        });
        DaleDeal.log('✓ Search input initialized');
      } else {
        // Reintentar después de que se cargue el header
        setTimeout(checkSearchInput, 500);
      }
    };

    checkSearchInput();
  }

  /**
   * Maneja el evento de búsqueda con debounce
   */
  handleSearch(e) {
    const query = e.target.value.trim();

    // Limpiar el timer anterior
    clearTimeout(this.debounceTimer);

    // Si el query está vacío, limpiar resultados
    if (query.length === 0) {
      this.clearSearchResults();
      return;
    }

    // Esperar 300ms antes de buscar
    this.debounceTimer = setTimeout(() => {
      if (query.length >= 2) {
        this.performSearch(query);
      }
    }, 300);
  }

  /**
   * Realiza la búsqueda. Comportamiento contextual:
   *  - En productos.html → busca productos y filtra el grid
   *  - En servicios.html → busca servicios (delega al input nativo de la página)
   *  - En cualquier otra página → redirige a productos.html?q=…
   */
  async performSearch(query) {
    try {
      this.isSearching = true;
      DaleDeal.log(`🔍 Buscando: "${query}"`);
      const path = window.location.pathname;

      // Si estamos en servicios.html, dejamos que el manager interno
      // de esa página filtre vía su searchTerm. Solo disparamos el input event.
      if (path.includes('servicios.html')) {
        // No hacemos nada extra: el input #searchInput tiene listener nativo
        // en servicios.html que filtra el grid de servicios.
        return;
      }

      if (!window.DaleDeal?.api) {
        DaleDeal.error('API no disponible para búsqueda');
        return;
      }

      this.searchResults = await window.DaleDeal.api.searchProducts(query);

      if (path.includes('productos.html')) {
        this.renderSearchResults();
      } else {
        // Cualquier otra página → redirigir a productos
        this.redirectToProductsPage(query);
      }
    } catch (error) {
      DaleDeal.error('Error al buscar productos:', error);
      this.showSearchError();
    } finally {
      this.isSearching = false;
    }
  }

  /**
   * Renderiza los resultados de búsqueda en la página de productos
   */
  renderSearchResults() {
    const productsGrid = document.getElementById('productsGrid');
    const resultsCount = document.getElementById('resultsCount');

    if (!productsGrid) return;

    // Actualizar contador
    if (resultsCount) {
      resultsCount.textContent = `${this.searchResults.length} producto${this.searchResults.length !== 1 ? 's' : ''} encontrado${this.searchResults.length !== 1 ? 's' : ''}`;
    }

    // Si no hay resultados → sugerir buscar en servicios
    if (this.searchResults.length === 0) {
      const query = encodeURIComponent(this.searchInput?.value || '');
      productsGrid.innerHTML = `
        <div class="col-12">
          <div class="no-results-container text-center py-5">
            <i class="bi bi-search display-1 text-muted mb-3"></i>
            <h4 class="text-muted">No se encontraron productos</h4>
            <p class="text-muted">Probá con otros términos o buscá entre los servicios profesionales.</p>
            <div class="d-flex gap-2 justify-content-center flex-wrap mt-3">
              <button class="btn btn-outline-secondary" onclick="window.searchManager.clearSearchResults()">
                <i class="bi bi-arrow-left me-2"></i>Ver todos los productos
              </button>
              <a class="btn btn-primary" href="./servicios.html?q=${query}">
                <i class="bi bi-tools me-2"></i>Buscar en servicios
              </a>
            </div>
          </div>
        </div>
      `;
      return;
    }

    // Renderizar productos encontrados
    if (window.HomePageLoader?.renderProductCard) {
      productsGrid.innerHTML = '';

      // Dividir en filas de 3
      const productsPerRow = 3;
      for (let i = 0; i < this.searchResults.length; i += productsPerRow) {
        const rowProducts = this.searchResults.slice(i, i + productsPerRow);

        const row = document.createElement('div');
        row.className = 'products-row';

        rowProducts.forEach(product => {
          row.innerHTML += window.HomePageLoader.renderProductCard(product);
        });

        productsGrid.appendChild(row);
      }

      // Reinicializar listeners
      if (window.HomePageLoader?.initializeProductListeners) {
        window.HomePageLoader.initializeProductListeners();
      }
    }
  }

  /**
   * Redirige a la página de productos con el query de búsqueda
   */
  redirectToProductsPage(query) {
    // Guardar query en localStorage
    localStorage.setItem('searchQuery', query);

    // Redirigir
    const isRoot = window.location.pathname.endsWith('index.html') ||
                   window.location.pathname.endsWith('/') ||
                   !window.location.pathname.includes('HTML/');

    const productsUrl = isRoot ? './HTML/productos.html' : './productos.html';
    window.location.href = `${productsUrl}?q=${encodeURIComponent(query)}`;
  }

  /**
   * Limpia los resultados de búsqueda y recarga todos los productos
   */
  clearSearchResults() {
    this.searchResults = [];

    if (this.searchInput) {
      this.searchInput.value = '';
    }

    // Recargar productos
    if (window.HomePageLoader?.loadProducts) {
      window.HomePageLoader.loadProducts();
    } else if (window.ProductsPageLoader?.loadProducts) {
      window.ProductsPageLoader.loadProducts();
    }
  }

  /**
   * Muestra un error de búsqueda
   */
  showSearchError() {
    if (window.DaleDeal?.utils?.showNotification) {
      window.DaleDeal.utils.showNotification(
        'Error al buscar productos. Por favor, intenta nuevamente.',
        'error'
      );
    }
  }

  /**
   * Obtiene el query desde la URL
   */
  getQueryFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('q');
  }

  /**
   * Carga búsqueda desde URL si existe
   */
  loadSearchFromURL() {
    const query = this.getQueryFromURL();
    const storedQuery = localStorage.getItem('searchQuery');

    if (query || storedQuery) {
      const searchQuery = query || storedQuery;

      // Establecer el valor en el input
      if (this.searchInput) {
        this.searchInput.value = searchQuery;
      }

      // Realizar búsqueda
      this.performSearch(searchQuery);

      // Limpiar localStorage
      localStorage.removeItem('searchQuery');
    }
  }
}

// Inicializar SearchManager globalmente
if (typeof window !== 'undefined') {
  window.searchManager = new SearchManager();
}

// Exportar para uso con módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SearchManager;
}
