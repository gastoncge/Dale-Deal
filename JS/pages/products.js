// =====================================================
// DALE DEAL - Products Page Loader with Filters
// =====================================================

class ProductsPageLoader {
  constructor() {
    this.allProducts = [];
    this.filteredProducts = [];
    this.currentCategory = 'all';
    this.currentSort = 'featured';
    this.init();
  }

  async init() {
    try {
      // Cargar productos
      await this.loadProducts();

      // Bind eventos
      this.bindFilterEvents();

      // Cargar búsqueda desde URL si existe
      if (window.searchManager) {
        window.searchManager.loadSearchFromURL();
      }

      console.log('✓ Products page initialized');
    } catch (error) {
      console.error('Error initializing products page:', error);
    }
  }

  /**
   * Carga todos los productos
   */
  async loadProducts() {
    try {
      const productsGrid = document.getElementById('productsGrid');
      const loadingContainer = document.getElementById('loadingContainer');

      if (!productsGrid) {
        console.warn('Products grid not found');
        return;
      }

      // Mostrar loading
      if (loadingContainer) {
        loadingContainer.style.display = 'flex';
      }

      // Cargar desde API
      this.allProducts = await window.DaleDeal.api.fetchProducts();
      this.filteredProducts = [...this.allProducts];

      // Ocultar loading
      if (loadingContainer) {
        loadingContainer.style.display = 'none';
      }

      // Renderizar
      this.renderProducts();

      console.log(`✓ ${this.allProducts.length} productos cargados`);

    } catch (error) {
      console.error('Error loading products:', error);
      this.showError();
    }
  }

  /**
   * Bind eventos de filtros
   */
  bindFilterEvents() {
    // Filtros de categoría
    document.querySelectorAll('.filter-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        e.preventDefault();

        // Actualizar tabs activos
        document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');

        // Aplicar filtro
        this.currentCategory = e.target.dataset.category;
        this.applyFilters();
      });
    });

    // Filtro de ordenamiento
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.currentSort = e.target.value;
        this.applyFilters();
      });
    }
  }

  /**
   * Aplica filtros y ordenamiento
   */
  applyFilters() {
    let filtered = [...this.allProducts];

    // Filtrar por categoría
    if (this.currentCategory && this.currentCategory !== 'all') {
      filtered = filtered.filter(product =>
        product.category.toLowerCase() === this.currentCategory.toLowerCase() ||
        product.subcategory.toLowerCase() === this.currentCategory.toLowerCase()
      );
    }

    // Ordenar
    switch (this.currentSort) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'name':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'newest':
        filtered.sort((a, b) => b.id - a.id);
        break;
      case 'discount':
        filtered = filtered.filter(p => p.discount > 0).sort((a, b) => b.discount - a.discount);
        break;
      case 'featured':
      default:
        // Mantener orden por defecto
        break;
    }

    this.filteredProducts = filtered;
    this.renderProducts();
  }

  /**
   * Renderiza los productos
   */
  renderProducts() {
    const productsGrid = document.getElementById('productsGrid');
    const resultsCount = document.getElementById('resultsCount');

    if (!productsGrid) return;

    // Actualizar contador
    if (resultsCount) {
      const count = this.filteredProducts.length;
      resultsCount.textContent = `${count} producto${count !== 1 ? 's' : ''} encontrado${count !== 1 ? 's' : ''}`;
    }

    // Limpiar grid
    productsGrid.innerHTML = '';

    // Si no hay productos
    if (this.filteredProducts.length === 0) {
      productsGrid.innerHTML = `
        <div class="col-12">
          <div class="no-results-container text-center py-5">
            <i class="bi bi-inbox display-1 text-muted mb-3"></i>
            <h4 class="text-muted">No se encontraron productos</h4>
            <p class="text-muted">Intenta con otros filtros</p>
            <button class="btn btn-primary" onclick="window.productsPageLoader.resetFilters()">
              <i class="bi bi-arrow-counterclockwise me-2"></i>Limpiar filtros
            </button>
          </div>
        </div>
      `;
      return;
    }

    // Renderizar productos usando el renderizador del home
    if (window.HomePageLoader?.renderProductCard) {
      const productsPerRow = 3;

      for (let i = 0; i < this.filteredProducts.length; i += productsPerRow) {
        const rowProducts = this.filteredProducts.slice(i, i + productsPerRow);

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

      // Scroll suave al top de productos
      const productsSection = document.querySelector('.products-section');
      if (productsSection) {
        productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }

  /**
   * Resetea todos los filtros
   */
  resetFilters() {
    this.currentCategory = 'all';
    this.currentSort = 'featured';

    // Actualizar UI
    document.querySelectorAll('.filter-tab').forEach(tab => {
      tab.classList.remove('active');
      if (tab.dataset.category === 'all') {
        tab.classList.add('active');
      }
    });

    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
      sortSelect.value = 'featured';
    }

    // Aplicar filtros
    this.applyFilters();
  }

  /**
   * Muestra error al cargar productos
   */
  showError() {
    const productsGrid = document.getElementById('productsGrid');
    const loadingContainer = document.getElementById('loadingContainer');

    if (loadingContainer) {
      loadingContainer.style.display = 'none';
    }

    if (productsGrid) {
      productsGrid.innerHTML = `
        <div class="col-12">
          <div class="alert alert-danger" role="alert">
            <i class="bi bi-exclamation-triangle me-2"></i>
            Error al cargar los productos. Por favor, intenta nuevamente más tarde.
            <button class="btn btn-sm btn-outline-danger ms-3" onclick="window.productsPageLoader.loadProducts()">
              <i class="bi bi-arrow-clockwise me-1"></i>Reintentar
            </button>
          </div>
        </div>
      `;
    }
  }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (window.DaleDeal?.api && window.location.pathname.includes('productos.html')) {
      window.productsPageLoader = new ProductsPageLoader();
    }
  });
} else {
  if (window.DaleDeal?.api && window.location.pathname.includes('productos.html')) {
    window.productsPageLoader = new ProductsPageLoader();
  }
}

// Exportar
if (typeof window !== 'undefined') {
  window.ProductsPageLoader = ProductsPageLoader;
}
