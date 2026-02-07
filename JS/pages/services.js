// =====================================================
// DALE DEAL - Services Page Loader with Filters
// =====================================================

class ServicesPageLoader {
  constructor() {
    this.allServices = [];
    this.filteredServices = [];
    this.currentCategory = 'all';
    this.currentSort = 'featured';
    this.filters = {
      priceMin: null,
      priceMax: null,
      rating: null,
      certified: false,
      verified: false,
      warranty: false
    };
    this.init();
  }

  async init() {
    try {
      // Cargar servicios
      await this.loadServices();

      // Bind eventos
      this.bindFilterEvents();

      console.log('✓ Services page initialized');
    } catch (error) {
      console.error('Error initializing services page:', error);
    }
  }

  /**
   * Carga todos los servicios
   */
  async loadServices() {
    try {
      const servicesGrid = document.getElementById('servicesGrid');
      const loadingContainer = document.getElementById('loadingContainer');

      if (!servicesGrid) {
        console.warn('Services grid not found');
        return;
      }

      // Mostrar loading
      if (loadingContainer) {
        loadingContainer.style.display = 'flex';
      }

      // Simular delay de carga (2 segundos)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Cargar desde servicesData
      if (typeof servicesData !== 'undefined') {
        this.allServices = servicesData;
        this.filteredServices = [...this.allServices];
      } else {
        console.error('servicesData no está definido');
        this.allServices = [];
        this.filteredServices = [];
      }

      // Ocultar loading
      if (loadingContainer) {
        loadingContainer.style.display = 'none';
      }

      // Renderizar
      this.renderServices();

      console.log(`✓ ${this.allServices.length} servicios cargados`);

    } catch (error) {
      console.error('Error loading services:', error);
      this.showError();
    }
  }

  /**
   * Bind eventos de filtros - Aplican automáticamente
   */
  bindFilterEvents() {
    // Debounce para precio
    let priceDebounceTimer;
    const applyFiltersDebounced = () => {
      clearTimeout(priceDebounceTimer);
      priceDebounceTimer = setTimeout(() => this.applyFilters(), 500);
    };

    // Filtros de categoría (radio buttons) - Aplica automáticamente
    document.querySelectorAll('input[name="category"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.currentCategory = e.target.value;
        this.applyFilters();
      });
    });

    // Filtro de precio - Aplica con debounce
    const minPrice = document.getElementById('minPrice');
    const maxPrice = document.getElementById('maxPrice');
    if (minPrice) {
      minPrice.addEventListener('input', (e) => {
        this.filters.priceMin = e.target.value ? parseFloat(e.target.value) : null;
        applyFiltersDebounced();
      });
    }
    if (maxPrice) {
      maxPrice.addEventListener('input', (e) => {
        this.filters.priceMax = e.target.value ? parseFloat(e.target.value) : null;
        applyFiltersDebounced();
      });
    }

    // Filtro de rating - Aplica automáticamente
    document.querySelectorAll('input[name="rating"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.filters.rating = e.target.value !== 'all' ? parseFloat(e.target.value) : null;
        this.applyFilters();
      });
    });

    // Checkboxes adicionales - Aplican automáticamente
    const certifiedCheckbox = document.getElementById('freeShipping');
    const verifiedCheckbox = document.getElementById('conditionNew');
    const warrantyCheckbox = document.getElementById('conditionUsed');

    if (certifiedCheckbox) {
      certifiedCheckbox.addEventListener('change', (e) => {
        this.filters.certified = e.target.checked;
        this.applyFilters();
      });
    }
    if (verifiedCheckbox) {
      verifiedCheckbox.addEventListener('change', (e) => {
        this.filters.verified = e.target.checked;
        this.applyFilters();
      });
    }
    if (warrantyCheckbox) {
      warrantyCheckbox.addEventListener('change', (e) => {
        this.filters.warranty = e.target.checked;
        this.applyFilters();
      });
    }

    // Ordenamiento - Aplica automáticamente
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.currentSort = e.target.value;
        this.applyFilters();
      });
    }

    // Botón limpiar filtros
    const clearFiltersBtn = document.getElementById('clearFilters');
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', () => {
        this.resetFilters();
      });
    }

    // Botón clear all filters (sidebar)
    const clearAllFiltersBtn = document.getElementById('clearAllFilters');
    if (clearAllFiltersBtn) {
      clearAllFiltersBtn.addEventListener('click', () => {
        this.resetFilters();
      });
    }

    // Botón toggle filtros (móvil)
    const toggleFiltersBtn = document.getElementById('toggleFilters');
    const sidebar = document.querySelector('.filters-sidebar');
    const overlay = document.getElementById('sidebarOverlay');

    if (toggleFiltersBtn && sidebar) {
      toggleFiltersBtn.addEventListener('click', () => {
        sidebar.classList.add('active');
        overlay?.classList.add('active');
        document.body.style.overflow = 'hidden';
      });
    }

    if (overlay) {
      overlay.addEventListener('click', () => {
        if (sidebar) sidebar.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
      });
    }
  }

  /**
   * Aplica los filtros seleccionados
   */
  applyFilters() {
    console.log('Applying filters:', {
      category: this.currentCategory,
      sort: this.currentSort,
      filters: this.filters
    });

    // Filtrar por categoría
    let filtered = this.currentCategory === 'all'
      ? [...this.allServices]
      : this.allServices.filter(s => s.category === this.currentCategory);

    // Filtrar por precio
    if (this.filters.priceMin !== null) {
      filtered = filtered.filter(s => s.price >= this.filters.priceMin);
    }
    if (this.filters.priceMax !== null) {
      filtered = filtered.filter(s => s.price <= this.filters.priceMax);
    }

    // Filtrar por rating
    if (this.filters.rating !== null) {
      filtered = filtered.filter(s => s.rating >= this.filters.rating);
    }

    // Filtrar por certificaciones (checkboxes)
    if (this.filters.certified) {
      filtered = filtered.filter(s => s.badges?.some(b => b.includes('Certificado') || b.includes('Matriculado')));
    }
    if (this.filters.verified) {
      filtered = filtered.filter(s => s.badges?.some(b => b.includes('Verificado')) || s.featured);
    }
    if (this.filters.warranty) {
      filtered = filtered.filter(s => s.badges?.some(b => b.includes('Garantía')));
    }

    // Ordenar
    switch (this.currentSort) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'name':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'newest':
        // Por ahora, usar el orden inverso del array
        filtered.reverse();
        break;
      case 'featured':
      default:
        // Destacados primero
        filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
        break;
    }

    this.filteredServices = filtered;
    this.renderServices();
  }

  /**
   * Resetea todos los filtros
   */
  resetFilters() {
    this.currentCategory = 'all';
    this.currentSort = 'featured';
    this.filters = {
      priceMin: null,
      priceMax: null,
      rating: null,
      certified: false,
      verified: false,
      warranty: false
    };

    // Resetear UI
    document.querySelectorAll('input[name="category"]').forEach(radio => {
      radio.checked = radio.value === 'all';
    });

    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) sortSelect.value = 'featured';

    const minPrice = document.getElementById('minPrice');
    const maxPrice = document.getElementById('maxPrice');
    if (minPrice) minPrice.value = '';
    if (maxPrice) maxPrice.value = '';

    document.querySelectorAll('input[name="rating"]').forEach(radio => {
      radio.checked = radio.value === 'all';
    });

    const certifiedCheckbox = document.getElementById('freeShipping');
    const verifiedCheckbox = document.getElementById('conditionNew');
    const warrantyCheckbox = document.getElementById('conditionUsed');
    if (certifiedCheckbox) certifiedCheckbox.checked = false;
    if (verifiedCheckbox) verifiedCheckbox.checked = false;
    if (warrantyCheckbox) warrantyCheckbox.checked = false;

    // Aplicar filtros
    this.applyFilters();
  }

  /**
   * Renderiza los servicios en el grid
   */
  renderServices() {
    const servicesGrid = document.getElementById('servicesGrid');
    const resultsCount = document.getElementById('resultsCount');
    const emptyState = document.getElementById('emptyStateContainer');
    const noResults = document.getElementById('noResults');

    if (!servicesGrid) return;

    // Actualizar contador
    if (resultsCount) {
      const count = this.filteredServices.length;
      resultsCount.textContent = `${count} servicio${count !== 1 ? 's' : ''} encontrado${count !== 1 ? 's' : ''}`;
    }

    // Limpiar grid
    servicesGrid.innerHTML = '';

    // Si no hay servicios
    if (this.filteredServices.length === 0) {
      if (emptyState) emptyState.style.display = 'flex';
      if (noResults) noResults.style.display = 'block';
      return;
    }

    // Ocultar empty state
    if (emptyState) emptyState.style.display = 'none';
    if (noResults) noResults.style.display = 'none';

    // Renderizar cada servicio
    this.filteredServices.forEach((service, index) => {
      const card = this.createServiceCard(service, index);
      servicesGrid.appendChild(card);
    });

    // Inicializar AOS para las nuevas cards
    if (typeof AOS !== 'undefined') {
      AOS.refresh();
    }

    // Inicializar listeners de favoritos
    this.initializeFavoritesListeners();
  }

  /**
   * Crea un elemento de card de servicio
   */
  createServiceCard(service, index) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.setAttribute('data-aos', 'fade-up');
    card.setAttribute('data-aos-delay', (index % 3) * 100);
    card.setAttribute('data-id', service.id);

    // Formatear precio
    let priceText = window.DaleDeal.utils.formatCurrency(service.price);
    if (service.priceType === 'monthly') priceText += '/mes';
    else if (service.priceType === 'per_m2') priceText += '/m²';
    else if (service.priceType === 'per_room') priceText += '/amb';

    // Renderizar badges
    const badgesHTML = service.badges.map((badge, badgeIndex) => {
      const badgeClass = service.emergency || badge.includes('Premium') || badge.includes('Emergencia')
        ? 'badge-offer'
        : 'badge-featured';
      return `<span class="${badgeClass}">${badge}</span>`;
    }).join('\n          ');

    // Renderizar estrellas
    const starsHTML = this.renderStars(service.rating);

    // Badges adicionales
    let extraBadges = '';
    if (service.topRated) {
      extraBadges += '<span class="shipping-badge"><i class="bi bi-star-fill"></i> Top rated</span>';
    }
    if (service.emergency) {
      extraBadges += ' <span class="shipping-badge"><i class="bi bi-lightning-charge-fill"></i> Urgencias</span>';
    }
    if (service.nationwide) {
      extraBadges += ' <span class="shipping-badge"><i class="bi bi-truck"></i> Cobertura nacional</span>';
    }

    card.innerHTML = `
      <div class="product-image-container">
        <img
          src="${service.image}"
          alt="${service.title}"
          class="product-image active"
          loading="lazy"
        />
        ${badgesHTML}
        <div class="product-actions">
          <button class="action-heart" title="Agregar a favoritos" data-product-id="${service.id}">
            <i class="bi bi-heart"></i>
          </button>
        </div>
      </div>
      <div class="product-info">
        <h3 class="product-title">${service.title}</h3>
        <p class="product-description">${service.description.substring(0, 80)}${service.description.length > 80 ? '...' : ''}</p>

        <div class="product-meta-group">
          <div class="product-rating">
            <div class="stars">${starsHTML}</div>
            <span class="reviews-count">(${service.reviewCount})</span>
            ${extraBadges}
          </div>
          <div class="product-location">
            <i class="bi bi-geo-alt-fill"></i>
            <span>${service.location}</span>
          </div>
        </div>

        <div class="product-pricing-wrapper">
          <div class="product-pricing">
            <span class="product-current-price">${priceText}</span>
          </div>
        </div>
      </div>
    `;

    return card;
  }

  /**
   * Renderiza las estrellas de rating
   */
  renderStars(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let starsHTML = '';

    for (let i = 0; i < fullStars; i++) {
      starsHTML += '<i class="bi bi-star-fill"></i>';
    }

    if (hasHalfStar) {
      starsHTML += '<i class="bi bi-star-half"></i>';
    }

    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      starsHTML += '<i class="bi bi-star"></i>';
    }

    return starsHTML;
  }

  /**
   * Inicializa listeners de favoritos
   */
  initializeFavoritesListeners() {
    document.querySelectorAll('.action-heart').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const serviceId = btn.dataset.productId;
        this.toggleFavorite(serviceId, btn);
      });
    });
  }

  /**
   * Toggle favorito
   */
  toggleFavorite(serviceId, btn) {
    const icon = btn.querySelector('i');
    if (icon.classList.contains('bi-heart')) {
      icon.classList.remove('bi-heart');
      icon.classList.add('bi-heart-fill');
      btn.classList.add('active');
      console.log(`Servicio ${serviceId} añadido a favoritos`);
    } else {
      icon.classList.remove('bi-heart-fill');
      icon.classList.add('bi-heart');
      btn.classList.remove('active');
      console.log(`Servicio ${serviceId} eliminado de favoritos`);
    }
  }

  /**
   * Muestra error al cargar servicios
   */
  showError() {
    const servicesGrid = document.getElementById('servicesGrid');
    const loadingContainer = document.getElementById('loadingContainer');

    if (loadingContainer) {
      loadingContainer.style.display = 'none';
    }

    if (servicesGrid) {
      servicesGrid.innerHTML = `
        <div class="col-12">
          <div class="alert alert-danger" role="alert">
            <i class="bi bi-exclamation-triangle me-2"></i>
            Error al cargar los servicios. Por favor, intenta nuevamente más tarde.
          </div>
        </div>
      `;
    }
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  window.servicesLoader = new ServicesPageLoader();
});
