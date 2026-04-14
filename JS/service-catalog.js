// ===== SERVICE CATALOG =====
// Lógica de carga, filtrado y renderizado de servicios para servicios.html
// Extraído de HTML/servicios.html (REORG-02b)

class ServiceCatalog {
  constructor() {
    this.services = [];
    this.filteredServices = [];
    this.currentPage = 1;
    this.servicesPerPage = 12;
    this.isLoading = false;

    this.currentCategory = 'all';
    this.currentSort = 'featured';
    this.searchTerm = '';
    this.filters = {
      priceMin: null,
      priceMax: null,
      rating: null,
      certified: false,
      warranty: false,
      available247: false
    };

    this.init();
  }

  init() {
    try {
      if (typeof servicesData === 'undefined') {
        throw new Error('servicesData no está definido');
      }

      this.services = this.transformServicesData(servicesData);
      this.filteredServices = [...this.services];
      this.bindFilterEvents();
      this.renderFilteredServices();

    } catch (error) {
      DaleDeal.error('Error loading services:', error);
      this.showError('Error al cargar los servicios. Por favor, intenta nuevamente.');
    }
  }

  // ===========================================
  // DATA FETCHING & TRANSFORMATION
  // ===========================================

  transformServicesData(apiServices) {
    return apiServices.map(service => ({
      id: service.id,
      title: service.title,
      description: service.description || '',
      price: service.price,
      category: this.mapCategory(service.category),
      image: service.image,
      rating: service.rating,
      reviewCount: service.reviewCount || 0,
      location: service.location || 'CABA',
      badges: service.badges || [],
      featured: service.featured || false,
      priceType: service.priceType || null,
      topRated: service.topRated || false,
      emergency: service.emergency || false,
      nationwide: service.nationwide || false,
      provider: service.provider || null
    }));
  }

  mapCategory(category) {
    const categoryMap = {
      'Instalación': 'installation',
      'Reparación': 'repair',
      'Mantenimiento': 'maintenance',
      'Consultoría': 'consultation',
      'Gastronomía': 'catering',
      'Construcción': 'construction'
    };
    return categoryMap[category] || category?.toLowerCase() || 'general';
  }

  // ===========================================
  // FILTER EVENT BINDINGS
  // ===========================================

  bindFilterEvents() {
    const self = this;

    document.querySelectorAll('input[name="category"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        self.currentCategory = e.target.value;
        self.applyFilters();
      });
    });

    let priceTimer;
    const minPrice = document.getElementById('minPrice');
    const maxPrice = document.getElementById('maxPrice');

    if (minPrice) {
      minPrice.addEventListener('input', (e) => {
        self.filters.priceMin = e.target.value ? parseFloat(e.target.value) : null;
        clearTimeout(priceTimer);
        priceTimer = setTimeout(() => self.applyFilters(), 500);
      });
    }
    if (maxPrice) {
      maxPrice.addEventListener('input', (e) => {
        self.filters.priceMax = e.target.value ? parseFloat(e.target.value) : null;
        clearTimeout(priceTimer);
        priceTimer = setTimeout(() => self.applyFilters(), 500);
      });
    }

    document.querySelectorAll('.stepper-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = document.getElementById(btn.dataset.target);
        if (!input) return;
        const val = parseFloat(input.value) || 0;
        input.value = btn.dataset.action === 'up' ? val + 1 : Math.max(0, val - 1);
        input.dispatchEvent(new Event('input'));
      });
    });

    document.querySelectorAll('input[name="rating"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        self.filters.rating = e.target.value !== 'all' ? parseFloat(e.target.value) : null;
        self.applyFilters();
      });
    });

    const certifiedCb = document.getElementById('freeShipping');
    const verifiedCb = document.getElementById('conditionNew');
    const warrantyCb = document.getElementById('conditionUsed');

    if (certifiedCb) certifiedCb.addEventListener('change', (e) => { self.filters.certified = e.target.checked; self.applyFilters(); });
    if (verifiedCb) verifiedCb.addEventListener('change', (e) => { self.filters.warranty = e.target.checked; self.applyFilters(); });
    if (warrantyCb) warrantyCb.addEventListener('change', (e) => { self.filters.available247 = e.target.checked; self.applyFilters(); });

    document.getElementById('sortSelect')?.addEventListener('change', (e) => {
      self.currentSort = e.target.value;
      self.applyFilters();
    });

    document.getElementById('clearFilters')?.addEventListener('click', () => self.resetFilters());
    document.getElementById('clearAllFilters')?.addEventListener('click', () => self.resetFilters());

    const sidebar = document.getElementById('filtersSidebar');
    const overlay = document.getElementById('sidebarOverlay');

    document.getElementById('toggleFilters')?.addEventListener('click', () => {
      sidebar?.classList.add('active');
      overlay?.classList.add('active');
      document.body.style.overflow = 'hidden';
    });

    overlay?.addEventListener('click', () => {
      sidebar?.classList.remove('active');
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && sidebar?.classList.contains('active')) {
        sidebar.classList.remove('active');
        overlay?.classList.remove('active');
        document.body.style.overflow = '';
      }
    });

    let searchTimer;
    document.getElementById('searchInput')?.addEventListener('input', (e) => {
      self.searchTerm = e.target.value.toLowerCase();
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => self.applyFilters(), 300);
    });

    document.getElementById('loadMoreBtn')?.addEventListener('click', () => {
      const btn = document.getElementById('loadMoreBtn');
      if (btn) {
        btn.classList.add('loading');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Cargando...';
      }
      self.loadMore();
    });

    window.addEventListener('resize', () => self.syncDesktopSidebarHeight());
  }

  // ===========================================
  // FILTER LOGIC
  // ===========================================

  applyFilters() {
    this.currentPage = 1;

    let filtered = this.currentCategory === 'all'
      ? [...this.services]
      : this.services.filter(s => s.category === this.currentCategory);

    if (this.searchTerm) {
      filtered = filtered.filter(s =>
        s.title.toLowerCase().includes(this.searchTerm) ||
        s.description.toLowerCase().includes(this.searchTerm)
      );
    }

    if (this.filters.priceMin !== null) filtered = filtered.filter(s => s.price >= this.filters.priceMin);
    if (this.filters.priceMax !== null) filtered = filtered.filter(s => s.price <= this.filters.priceMax);
    if (this.filters.rating !== null) filtered = filtered.filter(s => s.rating >= this.filters.rating);

    const badgeText = b => (b !== null && typeof b === 'object') ? (b.text || '') : String(b ?? '');

    if (this.filters.certified) {
      filtered = filtered.filter(s =>
        s.badges?.some(b => {
          const t = badgeText(b);
          return t.includes('Certificado') || t.includes('Matriculado');
        }) || s.provider?.verified === true
      );
    }
    if (this.filters.warranty) {
      filtered = filtered.filter(s => s.badges?.some(b => badgeText(b).includes('Garantía')));
    }
    if (this.filters.available247) {
      filtered = filtered.filter(s =>
        s.badges?.some(b => badgeText(b).includes('24/7')) || s.emergency === true
      );
    }

    switch (this.currentSort) {
      case 'price-low':  filtered.sort((a, b) => a.price - b.price); break;
      case 'price-high': filtered.sort((a, b) => b.price - a.price); break;
      case 'name':       filtered.sort((a, b) => a.title.localeCompare(b.title)); break;
      case 'newest':     filtered.reverse(); break;
      default:           filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }

    this.filteredServices = filtered;
    this.renderFilteredServices();
  }

  resetFilters() {
    this.currentCategory = 'all';
    this.currentSort = 'featured';
    this.searchTerm = '';
    this.filters = { priceMin: null, priceMax: null, rating: null, certified: false, warranty: false, available247: false };

    document.querySelectorAll('input[name="category"]').forEach(r => { r.checked = r.value === 'all'; });
    document.querySelectorAll('input[name="rating"]').forEach(r => { r.checked = r.value === 'all'; });

    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) sortSelect.value = 'featured';

    const minPrice = document.getElementById('minPrice');
    const maxPrice = document.getElementById('maxPrice');
    if (minPrice) minPrice.value = '';
    if (maxPrice) maxPrice.value = '';

    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.value = '';

    ['freeShipping', 'conditionNew', 'conditionUsed'].forEach(id => {
      const cb = document.getElementById(id);
      if (cb) cb.checked = false;
    });

    this.applyFilters();
  }

  // ===========================================
  // LOADING / ERROR STATES
  // ===========================================

  showLoading(show) {
    const emptyStateContainer = document.getElementById('emptyStateContainer');
    const loading = document.getElementById('loadingContainer');
    const grid = document.getElementById('servicesGrid');
    const noResults = document.getElementById('noResults');

    if (show) {
      if (grid) grid.style.display = 'none';
      if (emptyStateContainer) emptyStateContainer.style.display = 'flex';
      if (loading) loading.style.display = 'block';
      if (noResults) noResults.style.display = 'none';
      this.isLoading = true;
    } else {
      if (emptyStateContainer) emptyStateContainer.style.display = 'none';
      if (loading) loading.style.display = 'none';
      if (grid) grid.style.display = 'grid';
      this.isLoading = false;
    }

    this.syncDesktopSidebarHeight();
  }

  showError(message) {
    const emptyStateContainer = document.getElementById('emptyStateContainer');
    const grid = document.getElementById('servicesGrid');
    const loading = document.getElementById('loadingContainer');
    const noResults = document.getElementById('noResults');

    if (grid) grid.style.display = 'none';
    if (emptyStateContainer) emptyStateContainer.style.display = 'flex';
    if (loading) loading.style.display = 'none';
    if (noResults) {
      noResults.style.display = 'block';
      noResults.innerHTML = `
        <div class="empty-state-icon">
          <i class="bi bi-exclamation-triangle" style="color: var(--primary-red);"></i>
        </div>
        <h3 class="empty-state-title">Error al cargar</h3>
        <p class="empty-state-text">${DaleDeal.utils.escapeHtml(message)}</p>
        <div class="empty-state-actions">
          <button class="btn btn-primary" onclick="location.reload()">
            <i class="bi bi-arrow-clockwise me-2"></i>Reintentar
          </button>
        </div>
      `;
    }
  }

  // ===========================================
  // RENDERING
  // ===========================================

  renderFilteredServices() {
    const container = document.getElementById('servicesGrid');
    const emptyStateContainer = document.getElementById('emptyStateContainer');
    const loading = document.getElementById('loadingContainer');
    const noResults = document.getElementById('noResults');
    const loadMore = document.getElementById('loadMoreContainer');

    if (emptyStateContainer) emptyStateContainer.style.display = 'none';
    if (loading) loading.style.display = 'none';
    if (noResults) noResults.style.display = 'none';
    if (container) container.innerHTML = '';

    if (this.filteredServices.length === 0) {
      if (container) container.style.display = 'none';
      if (emptyStateContainer) emptyStateContainer.style.display = 'flex';
      if (noResults) noResults.style.display = 'block';
      if (loadMore) loadMore.style.display = 'none';
      this.updateResultsCount();
      this.syncDesktopSidebarHeight();
      return;
    }

    if (container) container.style.display = 'grid';

    const endIndex = this.currentPage * this.servicesPerPage;
    this.filteredServices.slice(0, endIndex).forEach((service, index) => {
      container.appendChild(this.createServiceCard(service, index));
    });

    const loadMoreBtn = document.getElementById('loadMoreBtn');
    if (loadMoreBtn) {
      loadMoreBtn.classList.remove('loading');
      loadMoreBtn.disabled = false;
      loadMoreBtn.innerHTML = '<i class="bi bi-grid-3x3-gap me-2"></i> Ver más servicios';
    }

    if (loadMore) {
      loadMore.style.display = endIndex < this.filteredServices.length ? 'block' : 'none';
    }

    this.updateResultsCount();
    this.initializeFavoritesListeners();
    this.syncDesktopSidebarHeight();
  }

  createServiceCard(service, index) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.setAttribute('data-id', service.id);
    card.setAttribute('data-type', 'service');

    let priceText = DaleDeal.utils.formatCurrency(service.price);
    if (service.priceType === 'monthly') priceText += '/mes';
    else if (service.priceType === 'per_m2') priceText += '/m²';
    else if (service.priceType === 'per_room') priceText += '/amb';

    const starsHTML = DaleDeal.utils.renderStars(service.rating);

    const customBadges = (service.badges || []).filter(b => typeof b === 'object' && b.text);
    const legacyBadges = (service.badges || []).filter(b => typeof b === 'string');
    const allBadgesInner = [
      ...customBadges.map(b => `<span class="badge-custom" style="background:${b.color}">${b.text}</span>`),
      ...legacyBadges.map(badge => {
        const cls = service.emergency || badge.includes('Premium') || badge.includes('Emergencia')
          ? 'badge-emergency' : 'badge-featured';
        return `<span class="${cls}">${badge}</span>`;
      }),
    ].join('');
    const badgesHTML = allBadgesInner ? `<div class="service-badges">${allBadgesInner}</div>` : '';

    let extraBadges = '';
    if (service.topRated) extraBadges += '<span class="shipping-badge"><i class="bi bi-star-fill"></i> Top rated</span>';
    if (service.emergency) extraBadges += ' <span class="shipping-badge"><i class="bi bi-lightning-charge-fill"></i> Urgencias</span>';
    if (service.nationwide) extraBadges += ' <span class="shipping-badge"><i class="bi bi-truck"></i> Cobertura nacional</span>';

    const shortDesc = service.description
      ? (service.description.length > 80 ? service.description.substring(0, 80) + '...' : service.description)
      : '';

    const provider = service.provider || {};
    const providerHTML = provider.name ? `
      <div class="product-provider">
        <img src="${provider.avatar}" alt="${DaleDeal.utils.escapeHtml(provider.name)}" class="product-provider-avatar" />
        <span class="product-provider-name">${DaleDeal.utils.escapeHtml(provider.name)}</span>
        ${provider.verified ? '<i class="bi bi-patch-check-fill product-provider-verified"></i>' : ''}
      </div>` : '';

    card.innerHTML = `
      <div class="product-image-container">
        <img src="${service.image}" alt="${DaleDeal.utils.escapeHtml(service.title)}" class="product-image active" loading="lazy" />
        ${badgesHTML}
        <div class="product-actions">
          <button class="action-heart" title="Agregar a favoritos" data-product-id="${service.id}">
            <i class="bi bi-heart"></i>
          </button>
        </div>
      </div>
      <div class="product-info">
        <h3 class="product-title">${DaleDeal.utils.escapeHtml(service.title)}</h3>
        ${providerHTML}
        <p class="product-description">${DaleDeal.utils.escapeHtml(shortDesc)}</p>
        <div class="product-meta-group">
          <div class="product-rating">
            <div class="stars">${starsHTML}</div>
            <span class="reviews-count">(${(service.reviewCount || 0).toLocaleString('es-AR')})</span>
            ${extraBadges}
          </div>
          <div class="product-location">
            <i class="bi bi-geo-alt-fill"></i>
            <span>${DaleDeal.utils.escapeHtml(service.location)}</span>
          </div>
        </div>
        <div class="product-pricing-wrapper">
          <div class="product-pricing">
            <span class="product-current-price">${priceText}</span>
          </div>
        </div>
      </div>
    `;

    card.addEventListener('click', (e) => {
      if (e.target.closest('.action-heart')) return;
      localStorage.setItem('selectedServiceId', service.id);
      window.location.href = `servicio.html?id=${service.id}`;
    });

    return card;
  }

  // ===========================================
  // HELPERS
  // ===========================================

  initializeFavoritesListeners() {
    window.favoritesManager?.updateFavoriteButtons();
  }

  findServiceById(id) {
    return this.services.find(s => s.id === id);
  }

  updateResultsCount() {
    const count = this.filteredServices.length;
    const countEl = document.getElementById('resultsCount');
    if (countEl) {
      countEl.textContent = `${count} servicio${count !== 1 ? 's' : ''} encontrado${count !== 1 ? 's' : ''}`;
    }
  }

  syncDesktopSidebarHeight() {
    const sidebar = document.getElementById('filtersSidebar');
    const mainContent = document.querySelector('.products-main-content');
    if (!sidebar || !mainContent) return;

    if (window.innerWidth <= 992) {
      sidebar.style.removeProperty('max-height');
      return;
    }

    requestAnimationFrame(() => {
      const mainHeight = Math.ceil(mainContent.getBoundingClientRect().height);
      if (mainHeight > 0) {
        sidebar.style.maxHeight = `${mainHeight}px`;
      }
    });
  }

  loadMore() {
    this.currentPage++;
    this.renderFilteredServices();
  }
}

// ===========================================
// INITIALIZATION
// ===========================================
document.addEventListener('DOMContentLoaded', () => {
  window.serviceCatalog = new ServiceCatalog();

  const categoryParam = new URLSearchParams(window.location.search).get('category');
  if (categoryParam) {
    const applyUrlCategory = (attempts = 0) => {
      const radio = document.querySelector(`input[name="category"][value="${categoryParam}"]`);
      if (radio) {
        radio.checked = true;
        radio.dispatchEvent(new Event('change'));
      } else if (attempts < 20) {
        setTimeout(() => applyUrlCategory(attempts + 1), 100);
      }
    };
    applyUrlCategory();
  }
});
