/**
 * DALE DEAL - Sistema de Filtros de Productos
 * Maneja el filtrado y búsqueda de productos
 */

class ProductFilters {
  constructor() {
    this.currentCategory = 'all';
    this.currentSort = 'featured';
    this.searchQuery = '';
    this.products = [];
    this.originalProducts = [];
    this.init();
  }

  init() {
    this.loadProducts();
    this.bindEvents();
    this.renderProducts();
  }

  // Cargar productos desde el DOM
  loadProducts() {
    const productCards = document.querySelectorAll('.product-card');
    this.products = Array.from(productCards).map(card => {
      const id = card.dataset.id;
      const title = card.querySelector('.product-title')?.textContent || '';
      const priceText = card.querySelector('.product-current-price')?.textContent || '$0';
      const price = parseFloat(priceText.replace(/[^0-9]/g, '')) || 0;
      const rating = this.extractRating(card);
      const category = this.inferCategory(title);
      const imageUrl = card.querySelector('.product-image')?.src || '';
      const badges = this.extractBadges(card);
      
      return {
        id,
        title,
        price,
        priceText,
        rating,
        category,
        imageUrl,
        badges,
        element: card
      };
    });
    
    this.originalProducts = [...this.products];
    console.log('Productos cargados:', this.products.length);
  }

  // Extraer rating de una tarjeta
  extractRating(card) {
    const stars = card.querySelectorAll('.stars .bi-star-fill').length;
    const halfStars = card.querySelectorAll('.stars .bi-star-half').length;
    return stars + (halfStars * 0.5);
  }

  // Inferir categoría basada en el título
  inferCategory(title) {
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('iphone') || titleLower.includes('samsung') || titleLower.includes('smartphone')) {
      return 'electronics';
    }
    if (titleLower.includes('macbook') || titleLower.includes('laptop') || titleLower.includes('computadora')) {
      return 'electronics';
    }
    if (titleLower.includes('playstation') || titleLower.includes('xbox') || titleLower.includes('gaming')) {
      return 'electronics';
    }
    if (titleLower.includes('airpods') || titleLower.includes('auriculares') || titleLower.includes('headphones')) {
      return 'electronics';
    }
    if (titleLower.includes('tv') || titleLower.includes('smart tv') || titleLower.includes('televisor')) {
      return 'electronics';
    }
    if (titleLower.includes('ropa') || titleLower.includes('camisa') || titleLower.includes('pantalón')) {
      return 'fashion';
    }
    if (titleLower.includes('mueble') || titleLower.includes('mesa') || titleLower.includes('silla')) {
      return 'home';
    }
    if (titleLower.includes('deporte') || titleLower.includes('fitness') || titleLower.includes('gym')) {
      return 'sports';
    }
    if (titleLower.includes('libro') || titleLower.includes('novela') || titleLower.includes('manual')) {
      return 'books';
    }
    
    // Por defecto, asignar a electrónicos si no se puede determinar
    return 'electronics';
  }

  // Extraer badges de una tarjeta
  extractBadges(card) {
    const badges = [];
    const badgeElements = card.querySelectorAll('[class*="badge-"]');
    badgeElements.forEach(badge => {
      badges.push(badge.textContent.trim());
    });
    return badges;
  }

  // Vincular eventos
  bindEvents() {
    // Filtros de categoría
    document.querySelectorAll('.filter-tab').forEach(tab => {
      tab.addEventListener('click', (e) => this.handleCategoryFilter(e));
    });

    // Botón de ordenar
    document.getElementById('sortBtn')?.addEventListener('click', () => this.showSortOptions());

    // Botón de filtros avanzados
    document.getElementById('filterBtn')?.addEventListener('click', () => this.showAdvancedFilters());

    // Botón de limpiar filtros
    document.getElementById('clearFiltersBtn')?.addEventListener('click', () => this.clearFilters());

    // Actualizar visibilidad del botón de limpiar
    this.updateClearButtonVisibility();

    // Listener para resize de ventana
    window.addEventListener('resize', () => {
      this.renderProducts();
    });

    // Búsqueda
    document.getElementById('searchInput')?.addEventListener('input', (e) => this.handleSearch(e));
    document.getElementById('searchInput')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleSearch(e);
      }
    });
  }

  // Manejar filtro de categoría
  handleCategoryFilter(e) {
    e.preventDefault();
    
    // Actualizar estado visual
    document.querySelectorAll('.filter-tab').forEach(tab => tab.classList.remove('active'));
    e.target.classList.add('active');
    
    // Actualizar categoría actual
    this.currentCategory = e.target.dataset.category;
    
    // Filtrar y renderizar
    this.filterAndRender();
  }

  // Manejar búsqueda
  handleSearch(e) {
    this.searchQuery = e.target.value.toLowerCase().trim();
    this.filterAndRender();
  }

  // Filtrar productos
  filterProducts() {
    let filtered = [...this.originalProducts];

    // Filtro por categoría
    if (this.currentCategory && this.currentCategory !== 'all') {
      filtered = filtered.filter(product => product.category === this.currentCategory);
    }

    // Filtro por búsqueda
    if (this.searchQuery) {
      filtered = filtered.filter(product => 
        product.title.toLowerCase().includes(this.searchQuery) ||
        product.badges.some(badge => badge.toLowerCase().includes(this.searchQuery))
      );
    }

    // Ordenar productos
    filtered = this.sortProducts(filtered);

    return filtered;
  }

  // Ordenar productos
  sortProducts(products) {
    switch (this.currentSort) {
      case 'price-asc':
        return products.sort((a, b) => a.price - b.price);
      case 'price-desc':
        return products.sort((a, b) => b.price - a.price);
      case 'rating':
        return products.sort((a, b) => b.rating - a.rating);
      case 'name':
        return products.sort((a, b) => a.title.localeCompare(b.title));
      case 'newest':
        // Simular orden por fecha (productos con badge "Nuevo" primero)
        return products.sort((a, b) => {
          const aNew = a.badges.some(badge => badge.toLowerCase().includes('nuevo'));
          const bNew = b.badges.some(badge => badge.toLowerCase().includes('nuevo'));
          if (aNew && !bNew) return -1;
          if (!aNew && bNew) return 1;
          return 0;
        });
      default: // featured
        // Ordenar por rating y luego por ofertas
        return products.sort((a, b) => {
          // Productos con ofertas primero
          const aOffer = a.badges.some(badge => badge.includes('%') || badge.toLowerCase().includes('oferta'));
          const bOffer = b.badges.some(badge => badge.includes('%') || badge.toLowerCase().includes('oferta'));
          if (aOffer && !bOffer) return -1;
          if (!aOffer && bOffer) return 1;
          // Luego por rating
          return b.rating - a.rating;
        });
    }
  }

  // Filtrar y renderizar
  filterAndRender() {
    this.products = this.filterProducts();
    this.renderProducts();
    this.updateClearButtonVisibility();
  }

  // Renderizar productos
  renderProducts() {
    const container = document.getElementById('productsGrid');
    if (!container) return;

    // Limpiar el contenedor
    container.innerHTML = '';

    // Mostrar productos filtrados
    if (this.products.length === 0) {
      this.showNoResults();
    } else {
      this.hideNoResults();
      
      // Organizar productos en filas (responsive)
      let productsPerRow = 3;
      if (window.innerWidth <= 480) {
        productsPerRow = 1;
      } else if (window.innerWidth <= 768) {
        productsPerRow = 2;
      }
      for (let i = 0; i < this.products.length; i += productsPerRow) {
        const rowProducts = this.products.slice(i, i + productsPerRow);
        
        // Crear fila
        const row = document.createElement('div');
        row.className = 'products-row';
        
        // Agregar productos a la fila
        rowProducts.forEach((product, index) => {
          const clonedElement = product.element.cloneNode(true);
          clonedElement.style.animationDelay = `${(i + index) * 0.1}s`;
          clonedElement.classList.add('product-fade-in');
          row.appendChild(clonedElement);
        });
        
        container.appendChild(row);
      }
      
      // Reinicializar eventos del carrito y favoritos
      this.reinitializeEvents();
    }

    // Actualizar contador
    this.updateResultsCounter();
  }

  // Reinicializar eventos después de recrear el DOM
  reinitializeEvents() {
    // No es necesario hacer nada especial ya que los eventos del carrito y favoritos
    // usan event delegation en el document, por lo que funcionarán automáticamente
  }

  // Mostrar mensaje sin resultados
  showNoResults() {
    const container = document.getElementById('productsGrid');
    const noResultsHTML = `
      <div class="no-results" id="noResults">
        <div class="no-results-content">
          <i class="bi bi-search"></i>
          <h3>No encontramos productos</h3>
          <p>Intenta con otros términos de búsqueda o categorías</p>
          <button class="btn btn-primary" onclick="productFilters.clearFilters()">
            <i class="bi bi-arrow-clockwise me-2"></i>Limpiar filtros
          </button>
        </div>
      </div>
    `;
    container.innerHTML = noResultsHTML;
  }

  // Ocultar mensaje sin resultados
  hideNoResults() {
    // No necesario ya que limpiamos todo el contenedor en renderProducts
  }

  // Actualizar contador de resultados
  updateResultsCounter() {
    let counterEl = document.getElementById('resultsCounter');
    if (!counterEl) {
      counterEl = document.createElement('div');
      counterEl.id = 'resultsCounter';
      counterEl.className = 'results-counter';
      const filtersContainer = document.querySelector('.filters-container');
      if (filtersContainer) {
        filtersContainer.appendChild(counterEl);
      }
    }

    const count = this.products.length;
    const total = this.originalProducts.length;
    
    if (this.searchQuery || this.currentCategory !== 'all') {
      counterEl.innerHTML = `${count} de ${total} productos`;
      counterEl.style.display = 'block';
    } else {
      counterEl.style.display = 'none';
    }
  }

  // Mostrar opciones de ordenamiento
  showSortOptions() {
    const sortOptions = [
      { value: 'featured', label: 'Destacados' },
      { value: 'price-asc', label: 'Menor precio' },
      { value: 'price-desc', label: 'Mayor precio' },
      { value: 'rating', label: 'Mejor valorados' },
      { value: 'newest', label: 'Más nuevos' },
      { value: 'name', label: 'A-Z' }
    ];

    const modal = this.createModal('Ordenar productos', sortOptions.map(option => `
      <button class="sort-option ${this.currentSort === option.value ? 'active' : ''}" 
              data-sort="${option.value}">
        ${option.label}
        ${this.currentSort === option.value ? '<i class="bi bi-check ms-auto"></i>' : ''}
      </button>
    `).join(''));

    // Agregar eventos a las opciones
    modal.querySelectorAll('.sort-option').forEach(option => {
      option.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.currentSort = e.target.dataset.sort;
        this.closeModal(); // Cerrar primero
        this.filterAndRender();
      });
    });
  }

  // Mostrar filtros avanzados
  showAdvancedFilters() {
    const content = `
      <div class="advanced-filters">
        <div class="filter-section">
          <div class="section-header">
            <i class="bi bi-geo-alt me-2"></i>
            <h5>Ubicación y entrega</h5>
          </div>
          <div class="filter-group">
            <label for="locationSearch">
              <i class="bi bi-search me-2"></i>Buscar por ubicación
            </label>
            <div class="location-search-container">
              <input type="text" id="locationSearch" placeholder="Ej: Buenos Aires, CABA, Córdoba..." class="form-control">
              <button class="btn btn-outline-primary btn-sm" onclick="productFilters.detectLocation()">
                <i class="bi bi-crosshair"></i>
              </button>
            </div>
            <div class="location-suggestions" id="locationSuggestions"></div>
          </div>
          
          <div class="filter-group">
            <label>Opciones de entrega</label>
            <div class="delivery-options">
              <label class="option-checkbox">
                <input type="checkbox" id="freeShipping" checked>
                <span class="checkmark"></span>
                Envío gratis
              </label>
              <label class="option-checkbox">
                <input type="checkbox" id="fastDelivery">
                <span class="checkmark"></span>
                Entrega rápida (24-48hs)
              </label>
              <label class="option-checkbox">
                <input type="checkbox" id="pickupStore">
                <span class="checkmark"></span>
                Retiro en tienda
              </label>
            </div>
          </div>
        </div>

        <div class="filter-section">
          <div class="section-header">
            <i class="bi bi-currency-dollar me-2"></i>
            <h5>Precio</h5>
          </div>
          <div class="filter-group">
            <div class="price-range-container">
              <div class="price-inputs">
                <div class="price-input-group">
                  <label>Mínimo</label>
                  <input type="number" id="minPriceInput" placeholder="0" class="form-control">
                </div>
                <div class="price-input-group">
                  <label>Máximo</label>
                  <input type="number" id="maxPriceInput" placeholder="2000000" class="form-control">
                </div>
              </div>
              <div class="price-range-sliders">
                <input type="range" id="minPrice" min="0" max="2000000" step="10000" value="0">
                <input type="range" id="maxPrice" min="0" max="2000000" step="10000" value="2000000">
              </div>
              <div class="price-labels">
                <span id="minPriceLabel">$0</span>
                <span id="maxPriceLabel">$2.000.000</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="filter-section">
          <div class="section-header">
            <i class="bi bi-star me-2"></i>
            <h5>Calificación</h5>
          </div>
          <div class="filter-group">
            <div class="rating-filter">
              ${[5,4,3,2,1].map(rating => `
                <button class="rating-option" data-rating="${rating}">
                  <div class="stars">
                    ${'<i class="bi bi-star-fill"></i>'.repeat(rating)}${'<i class="bi bi-star"></i>'.repeat(5-rating)}
                  </div>
                  <span>${rating}+ estrellas</span>
                </button>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="filter-section">
          <div class="section-header">
            <i class="bi bi-tags me-2"></i>
            <h5>Características</h5>
          </div>
          <div class="filter-group">
            <div class="feature-options">
              <label class="option-checkbox">
                <input type="checkbox" id="onSale">
                <span class="checkmark"></span>
                En oferta
              </label>
              <label class="option-checkbox">
                <input type="checkbox" id="newProduct">
                <span class="checkmark"></span>
                Productos nuevos
              </label>
              <label class="option-checkbox">
                <input type="checkbox" id="warranty">
                <span class="checkmark"></span>
                Con garantía extendida
              </label>
              <label class="option-checkbox">
                <input type="checkbox" id="installation">
                <span class="checkmark"></span>
                Instalación incluida
              </label>
            </div>
          </div>
        </div>
        
        <div class="filter-actions">
          <button class="btn btn-outline-danger btn-clear-filters" onclick="productFilters.clearFilters()">
            <i class="bi bi-arrow-clockwise me-2"></i>
            Limpiar filtros
          </button>
          <button class="btn btn-primary btn-apply-filters" onclick="productFilters.applyAdvancedFilters()">
            <i class="bi bi-check-circle me-2"></i>
            Aplicar filtros
          </button>
        </div>
      </div>
    `;

    this.createModal('Filtros avanzados', content);
    this.bindAdvancedFilterEvents();
  }

  // Vincular eventos de filtros avanzados
  bindAdvancedFilterEvents() {
    // Búsqueda de ubicación
    const locationInput = document.getElementById('locationSearch');
    if (locationInput) {
      locationInput.addEventListener('input', (e) => this.handleLocationSearch(e));
    }

    // Sincronizar sliders con inputs
    const minPriceSlider = document.getElementById('minPrice');
    const maxPriceSlider = document.getElementById('maxPrice');
    const minPriceInput = document.getElementById('minPriceInput');
    const maxPriceInput = document.getElementById('maxPriceInput');

    if (minPriceSlider && minPriceInput) {
      minPriceSlider.addEventListener('input', (e) => {
        minPriceInput.value = e.target.value;
        this.updatePriceLabels();
      });
      minPriceInput.addEventListener('input', (e) => {
        minPriceSlider.value = e.target.value;
        this.updatePriceLabels();
      });
    }

    if (maxPriceSlider && maxPriceInput) {
      maxPriceSlider.addEventListener('input', (e) => {
        maxPriceInput.value = e.target.value;
        this.updatePriceLabels();
      });
      maxPriceInput.addEventListener('input', (e) => {
        maxPriceSlider.value = e.target.value;
        this.updatePriceLabels();
      });
    }

    // Rating buttons
    document.querySelectorAll('.rating-option').forEach(button => {
      button.addEventListener('click', (e) => {
        document.querySelectorAll('.rating-option').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
      });
    });

    this.updatePriceLabels();
  }

  // Manejar búsqueda de ubicación
  handleLocationSearch(e) {
    const query = e.target.value.trim();
    if (query.length < 2) {
      this.hidLocationSuggestions();
      return;
    }

    const suggestions = this.getLocationSuggestions(query);
    this.showLocationSuggestions(suggestions);
  }

  // Obtener sugerencias de ubicación
  getLocationSuggestions(query) {
    const locations = [
      'Buenos Aires, CABA',
      'Córdoba, Córdoba',
      'Rosario, Santa Fe',
      'Mendoza, Mendoza',
      'La Plata, Buenos Aires',
      'Mar del Plata, Buenos Aires',
      'Tucumán, Tucumán',
      'Salta, Salta',
      'Santa Fe, Santa Fe',
      'Neuquén, Neuquén',
      'Bahía Blanca, Buenos Aires',
      'Resistencia, Chaco',
      'Paraná, Entre Ríos',
      'Posadas, Misiones',
      'San Juan, San Juan'
    ];

    return locations.filter(location => 
      location.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);
  }

  // Mostrar sugerencias de ubicación
  showLocationSuggestions(suggestions) {
    const container = document.getElementById('locationSuggestions');
    if (!container) return;

    if (suggestions.length === 0) {
      container.innerHTML = '<div class="no-suggestions">No se encontraron ubicaciones</div>';
      container.classList.add('active');
      return;
    }

    container.innerHTML = suggestions.map(location => `
      <div class="location-suggestion" onclick="productFilters.selectLocation('${location}')">
        <i class="bi bi-geo-alt me-2"></i>
        ${location}
      </div>
    `).join('');
    container.classList.add('active');
  }

  // Ocultar sugerencias
  hidLocationSuggestions() {
    const container = document.getElementById('locationSuggestions');
    if (container) {
      container.classList.remove('active');
    }
  }

  // Seleccionar ubicación
  selectLocation(location) {
    const input = document.getElementById('locationSearch');
    if (input) {
      input.value = location;
    }
    this.hidLocationSuggestions();
  }

  // Detectar ubicación
  detectLocation() {
    if (!navigator.geolocation) {
      console.log('La geolocalización no está soportada en este navegador');
      return;
    }

    const button = event.target.closest('button');
    const originalContent = button.innerHTML;
    button.innerHTML = '<i class="bi bi-arrow-repeat spin"></i>';
    button.disabled = true;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // En una aplicación real, aquí haríamos una consulta a un servicio de geocoding
        const location = 'Buenos Aires, CABA'; // Simulado
        this.selectLocation(location);
        
        button.innerHTML = originalContent;
        button.disabled = false;
      },
      (error) => {
        button.innerHTML = originalContent;
        button.disabled = false;
      }
    );
  }

  // Actualizar etiquetas de precio
  updatePriceLabels() {
    const minPrice = document.getElementById('minPrice')?.value || 0;
    const maxPrice = document.getElementById('maxPrice')?.value || 2000000;
    
    const minLabel = document.getElementById('minPriceLabel');
    const maxLabel = document.getElementById('maxPriceLabel');
    
    if (minLabel) minLabel.textContent = this.formatPrice(minPrice);
    if (maxLabel) maxLabel.textContent = this.formatPrice(maxPrice);
  }

  // Formatear precio
  formatPrice(price) {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0
    }).format(price);
  }

  // Crear modal genérico
  createModal(title, content) {
    // Remover modal existente
    this.closeModal();

    const modal = document.createElement('div');
    modal.className = 'filter-modal';
    modal.innerHTML = `
      <div class="filter-modal-backdrop"></div>
      <div class="filter-modal-content">
        <div class="filter-modal-header">
          <h4>${title}</h4>
          <button class="btn-close-modal">
            <i class="bi bi-x"></i>
          </button>
        </div>
        <div class="filter-modal-body">
          ${content}
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Eventos para cerrar
    modal.querySelector('.btn-close-modal').addEventListener('click', () => this.closeModal());
    modal.querySelector('.filter-modal-backdrop').addEventListener('click', () => this.closeModal());

    return modal;
  }

  // Cerrar modal
  closeModal() {
    const modal = document.querySelector('.filter-modal');
    if (modal) {
      modal.remove();
    }
  }

  // Limpiar filtros
  clearFilters() {
    // Verificar si hay filtros aplicados
    const hasFilters = this.currentCategory !== 'all' || 
                      this.currentSort !== 'featured' || 
                      this.searchQuery !== '';

    if (!hasFilters) {
      return;
    }

    // Animación del botón
    const clearBtn = document.getElementById('clearFiltersBtn');
    if (clearBtn) {
      clearBtn.classList.add('clearing');
      clearBtn.innerHTML = '<i class="bi bi-arrow-clockwise me-2 spinning"></i>Limpiando...';
    }

    // Limpiar filtros después de animación
    setTimeout(() => {
      this.currentCategory = 'all';
      this.currentSort = 'featured';
      this.searchQuery = '';
      
      // Actualizar UI
      document.querySelectorAll('.filter-tab').forEach(tab => tab.classList.remove('active'));
      document.querySelector('[data-category="all"]')?.classList.add('active');
      
      const searchInput = document.getElementById('searchInput');
      if (searchInput) searchInput.value = '';

      this.filterAndRender();
      this.closeModal();

      // Restaurar botón
      if (clearBtn) {
        clearBtn.classList.remove('clearing');
        clearBtn.innerHTML = '<i class="bi bi-arrow-clockwise me-2"></i>Limpiar';
      }
    }, 800);
  }

  // Actualizar visibilidad del botón limpiar
  updateClearButtonVisibility() {
    const clearBtn = document.getElementById('clearFiltersBtn');
    if (!clearBtn) return;

    const hasFilters = this.currentCategory !== 'all' || 
                      this.currentSort !== 'featured' || 
                      this.searchQuery !== '';

    if (hasFilters) {
      clearBtn.style.opacity = '1';
      clearBtn.style.pointerEvents = 'auto';
      clearBtn.style.transform = 'scale(1)';
    } else {
      clearBtn.style.opacity = '0.5';
      clearBtn.style.pointerEvents = 'none';
      clearBtn.style.transform = 'scale(0.95)';
    }
  }


  // Obtener nombre de categoría
  getCategoryName() {
    const categories = {
      'all': 'Todos',
      'electronics': 'Electrónicos',
      'fashion': 'Moda',
      'home': 'Hogar',
      'sports': 'Deportes',
      'books': 'Libros'
    };
    return categories[this.currentCategory] || 'Todos';
  }

  // Obtener nombre de ordenamiento
  getSortName() {
    const sorts = {
      'featured': 'Destacados',
      'price-asc': 'Menor precio',
      'price-desc': 'Mayor precio',
      'rating': 'Mejor valorados',
      'newest': 'Más nuevos',
      'name': 'A-Z'
    };
    return sorts[this.currentSort] || 'Destacados';
  }

  // Mostrar toast
  showToast(message, type = 'info') {
    const toastId = 'toast_' + Date.now();
    const toastHTML = `
      <div class="toast align-items-center text-white bg-${type === 'success' ? 'success' : type === 'error' ? 'danger' : 'primary'} border-0" 
           role="alert" aria-live="assertive" aria-atomic="true" id="${toastId}">
        <div class="d-flex">
          <div class="toast-body">
            <i class="bi bi-${type === 'success' ? 'check-circle' : type === 'error' ? 'x-circle' : 'info-circle'} me-2"></i>
            ${message}
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
      </div>
    `;

    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
      toastContainer.style.zIndex = '9999';
      document.body.appendChild(toastContainer);
    }

    toastContainer.insertAdjacentHTML('beforeend', toastHTML);

    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
    toast.show();

    toastElement.addEventListener('hidden.bs.toast', () => {
      toastElement.remove();
    });
  }
}

// CSS para las animaciones y modales
const style = document.createElement('style');
style.textContent = `
  .product-fade-in {
    animation: fadeInUp 0.6s ease-out;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .no-results {
    grid-column: 1 / -1;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 400px;
    text-align: center;
    color: var(--gray-500);
  }

  .no-results-content i {
    font-size: var(--font-size-5xl);
    color: var(--gray-300);
    margin-bottom: var(--spacing-4);
  }

  .no-results-content h3 {
    font-size: var(--font-size-2xl);
    font-weight: 600;
    color: var(--gray-700);
    margin-bottom: var(--spacing-2);
  }

  .results-counter {
    font-size: var(--font-size-sm);
    color: var(--gray-600);
    font-weight: 500;
  }

  .filter-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .filter-modal-backdrop {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(4px);
  }

  .filter-modal-content {
    position: relative;
    background: var(--white);
    border-radius: var(--radius-2xl);
    box-shadow: var(--shadow-2xl);
    width: 90%;
    max-width: 500px;
    max-height: 80vh;
    overflow: hidden;
  }

  .filter-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--spacing-5);
    border-bottom: 1px solid var(--gray-200);
    background: var(--gray-50);
  }

  .filter-modal-header h4 {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--gray-900);
    margin: 0;
  }

  .btn-close-modal {
    background: none;
    border: none;
    color: var(--gray-500);
    font-size: var(--font-size-lg);
    cursor: pointer;
    padding: var(--spacing-2);
    border-radius: var(--radius-md);
    transition: all var(--transition-fast);
  }

  .btn-close-modal:hover {
    background: var(--gray-200);
    color: var(--gray-700);
  }

  .filter-modal-body {
    padding: var(--spacing-5);
    max-height: 60vh;
    overflow-y: auto;
  }

  .sort-option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: var(--spacing-3) var(--spacing-4);
    background: none;
    border: 1px solid var(--gray-200);
    border-radius: var(--radius-lg);
    color: var(--gray-700);
    font-size: var(--font-size-base);
    cursor: pointer;
    transition: all var(--transition-fast);
    margin-bottom: var(--spacing-2);
  }

  .sort-option:hover {
    background: var(--gray-50);
    border-color: var(--primary-red);
  }

  .sort-option.active {
    background: var(--primary-red-light);
    border-color: var(--primary-red);
    color: var(--primary-red);
    font-weight: 600;
  }
`;

document.head.appendChild(style);

// CSS adicional para filtros avanzados
const advancedFiltersStyle = document.createElement('style');
advancedFiltersStyle.textContent = `
  .advanced-filters {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-6);
  }

  .filter-section {
    background: var(--gray-50);
    border-radius: var(--radius-xl);
    padding: var(--spacing-5);
    border: 1px solid var(--gray-200);
  }

  .section-header {
    display: flex;
    align-items: center;
    margin-bottom: var(--spacing-4);
  }

  .section-header h5 {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--gray-900);
    margin: 0;
  }

  .section-header i {
    color: var(--primary-red);
    font-size: var(--font-size-lg);
  }

  .filter-group {
    margin-bottom: var(--spacing-4);
  }

  .filter-group:last-child {
    margin-bottom: 0;
  }

  .filter-group label {
    display: block;
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--gray-700);
    margin-bottom: var(--spacing-2);
  }

  .location-search-container {
    display: flex;
    gap: var(--spacing-2);
    align-items: center;
  }

  .location-search-container input {
    flex: 1;
  }

  .location-suggestions {
    position: relative;
    background: var(--white);
    border: 1px solid var(--gray-200);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-md);
    margin-top: var(--spacing-2);
    max-height: 200px;
    overflow-y: auto;
    display: none;
  }

  .location-suggestions.active {
    display: block;
  }

  .location-suggestion {
    display: flex;
    align-items: center;
    padding: var(--spacing-3);
    cursor: pointer;
    border-bottom: 1px solid var(--gray-100);
    transition: all var(--transition-fast);
  }

  .location-suggestion:last-child {
    border-bottom: none;
  }

  .location-suggestion:hover {
    background: var(--gray-50);
    color: var(--primary-red);
  }

  .location-suggestion i {
    color: var(--gray-400);
  }

  .location-suggestion:hover i {
    color: var(--primary-red);
  }

  .no-suggestions {
    padding: var(--spacing-4);
    text-align: center;
    color: var(--gray-500);
    font-style: italic;
  }

  .delivery-options, .feature-options {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
  }

  .option-checkbox {
    display: flex;
    align-items: center;
    cursor: pointer;
    font-size: var(--font-size-sm);
    color: var(--gray-700);
    position: relative;
    padding-left: var(--spacing-8);
  }

  .option-checkbox input[type="checkbox"] {
    position: absolute;
    opacity: 0;
    cursor: pointer;
    height: 0;
    width: 0;
  }

  .checkmark {
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    height: 20px;
    width: 20px;
    background: var(--white);
    border: 2px solid var(--gray-300);
    border-radius: var(--radius-md);
    transition: all var(--transition-fast);
  }

  .option-checkbox:hover .checkmark {
    border-color: var(--primary-red);
  }

  .option-checkbox input:checked ~ .checkmark {
    background: var(--primary-red);
    border-color: var(--primary-red);
  }

  .checkmark:after {
    content: "";
    position: absolute;
    display: none;
    left: 6px;
    top: 2px;
    width: 6px;
    height: 10px;
    border: solid var(--white);
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }

  .option-checkbox input:checked ~ .checkmark:after {
    display: block;
  }

  .price-range-container {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
  }

  .price-inputs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-4);
  }

  .price-input-group {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
  }

  .price-input-group label {
    font-size: var(--font-size-xs);
    color: var(--gray-600);
    margin-bottom: 0;
  }

  .price-range-sliders {
    position: relative;
    height: 24px;
  }

  .price-range-sliders input[type="range"] {
    position: absolute;
    width: 100%;
    height: 6px;
    background: transparent;
    outline: none;
    pointer-events: none;
  }

  .price-range-sliders input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: var(--primary-red);
    cursor: pointer;
    pointer-events: auto;
    border: 2px solid var(--white);
    box-shadow: var(--shadow-md);
  }

  .price-range-sliders input[type="range"]::-moz-range-thumb {
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: var(--primary-red);
    cursor: pointer;
    pointer-events: auto;
    border: 2px solid var(--white);
    box-shadow: var(--shadow-md);
  }

  .price-labels {
    display: flex;
    justify-content: space-between;
    font-size: var(--font-size-sm);
    color: var(--gray-600);
    font-weight: 600;
  }

  .rating-filter {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
  }

  .rating-option {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--spacing-3);
    background: var(--white);
    border: 2px solid var(--gray-200);
    border-radius: var(--radius-lg);
    cursor: pointer;
    transition: all var(--transition-fast);
    font-size: var(--font-size-sm);
    color: var(--gray-700);
  }

  .rating-option:hover {
    border-color: var(--primary-red-light);
    background: var(--primary-red-light);
  }

  .rating-option.active {
    border-color: var(--primary-red);
    background: var(--primary-red);
    color: var(--white);
  }

  .rating-option .stars {
    display: flex;
    gap: 2px;
  }

  .rating-option .stars i {
    font-size: var(--font-size-sm);
    color: var(--primary-yellow);
  }

  .rating-option.active .stars i {
    color: var(--white);
  }

  .filter-actions {
    display: flex;
    justify-content: space-between;
    gap: var(--spacing-3);
    padding-top: var(--spacing-4);
    border-top: 1px solid var(--gray-200);
    margin-top: var(--spacing-2);
  }

  .btn-clear-filters {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-3) var(--spacing-4);
    font-weight: 600;
    font-size: var(--font-size-sm);
    flex: 0 0 auto;
    min-width: 120px;
  }

  .btn-apply-filters {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-3) var(--spacing-5);
    font-weight: 600;
    font-size: var(--font-size-base);
    flex: 1;
  }

  .filter-modal-content {
    max-width: 600px;
    max-height: 85vh;
  }

  .filter-modal-body {
    max-height: 70vh;
  }

  .spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @media (max-width: 768px) {
    .price-inputs {
      grid-template-columns: 1fr;
    }

    .filter-actions {
      grid-template-columns: 1fr;
    }

    .location-search-container {
      flex-direction: column;
    }

    .location-search-container button {
      align-self: stretch;
    }
  }
`;

document.head.appendChild(advancedFiltersStyle);

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  window.productFilters = new ProductFilters();
});