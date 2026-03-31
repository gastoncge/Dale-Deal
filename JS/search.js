// =====================================================
// DALE DEAL - Unified Product & Service Search
// =====================================================

class SearchManager {
  constructor() {
    this.searchInput = null;
    this.productResults = [];
    this.serviceResults = [];
    this.isSearching = false;
    this.debounceTimer = null;
    this._dropdown = null;
    this._stylesInjected = false;
    this.init();
  }

  init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.bindEvents());
    } else {
      this.bindEvents();
    }
  }

  // ── Page detection ─────────────────────────────────────────────────────────

  _onProductsPage() {
    return window.location.pathname.includes('productos.html');
  }

  _onServicesPage() {
    return window.location.pathname.includes('servicios.html');
  }

  _onListPage() {
    return this._onProductsPage() || this._onServicesPage();
  }

  _isRootPage() {
    const p = window.location.pathname;
    return p.endsWith('index.html') || p.endsWith('/') || !p.includes('HTML/');
  }

  // ── Event binding ──────────────────────────────────────────────────────────

  bindEvents() {
    const checkSearchInput = () => {
      this.searchInput = document.getElementById('searchInput');

      if (this.searchInput) {
        // List pages (productos.html / servicios.html) have their own inline
        // input handlers that drive their respective filter systems.
        // Only bind here for all other pages (home, etc.).
        if (!this._onListPage()) {
          this.searchInput.addEventListener('input', (e) => this.handleSearch(e));
        }

        // Enter key: on list pages run performSearch in-place;
        // on other pages redirect to the appropriate list page.
        this.searchInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            const q = e.target.value.trim();
            if (q.length >= 2) {
              if (this._onListPage()) {
                this.performSearch(q);
              } else {
                this.handleEnterSearch(q);
              }
            }
          }
        });

        // Close dropdown on outside click or Escape
        document.addEventListener('click', (e) => {
          if (
            !e.target.closest('.search-wrapper') &&
            !e.target.closest('#searchDropdown')
          ) {
            this.hideDropdown();
          }
        });
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') this.hideDropdown();
        });

        // On servicios.html, trigger ?q= param after catalog has initialised
        if (this._onServicesPage()) {
          setTimeout(() => this.loadSearchFromURL(), 700);
        }

        DaleDeal.log('✓ Search input initialized');
      } else {
        // Retry until the header component injects #searchInput
        setTimeout(checkSearchInput, 500);
      }
    };

    checkSearchInput();
  }

  // ── Input / Enter handlers ─────────────────────────────────────────────────

  handleSearch(e) {
    const query = e.target.value.trim();
    clearTimeout(this.debounceTimer);
    if (query.length === 0) {
      this.clearSearchResults();
      return;
    }
    this.debounceTimer = setTimeout(() => {
      if (query.length >= 2) this.performSearch(query);
    }, 300);
  }

  /** Called on Enter from non-list pages: fetch then redirect. */
  async handleEnterSearch(query) {
    try {
      const api = window.DaleDeal?.api;
      if (!api) { this._redirect(query, [], []); return; }
      const [products, services] = await Promise.all([
        api.searchProducts(query).catch(() => []),
        api.searchServices ? api.searchServices(query).catch(() => []) : Promise.resolve([]),
      ]);
      this._redirect(query, products, services);
    } catch (_) {
      this._redirect(query, [], []);
    }
  }

  _redirect(query, products, services) {
    const base = this._isRootPage() ? './HTML/' : './';
    // Prefer productos.html; fall back to servicios.html if only services found.
    if (products.length > 0 || services.length === 0) {
      window.location.href = `${base}productos.html?q=${encodeURIComponent(query)}`;
    } else {
      window.location.href = `${base}servicios.html?q=${encodeURIComponent(query)}`;
    }
  }

  // ── Core search ────────────────────────────────────────────────────────────

  async performSearch(query) {
    if (!query) return;
    try {
      this.isSearching = true;
      DaleDeal.log(`🔍 Buscando: "${query}"`);

      const api = window.DaleDeal?.api;
      if (!api) {
        DaleDeal.error('API no disponible para búsqueda');
        return;
      }

      const [products, services] = await Promise.all([
        api.searchProducts(query).catch(() => []),
        api.searchServices ? api.searchServices(query).catch(() => []) : Promise.resolve([]),
      ]);

      this.productResults = products;
      this.serviceResults = services;

      if (this._onProductsPage()) {
        this.renderProductsInGrid(products, query);
        this.updateCrossLink('services', services, query);
      } else if (this._onServicesPage()) {
        this.triggerServiceFilter(query);
        this.updateCrossLink('products', products, query);
      } else {
        this.showUnifiedDropdown(query, products, services);
      }
    } catch (error) {
      DaleDeal.error('Error al buscar:', error);
      this.showSearchError();
    } finally {
      this.isSearching = false;
    }
  }

  // ── productos.html rendering ───────────────────────────────────────────────

  renderProductsInGrid(products, query) {
    const productsGrid = document.getElementById('productsGrid');
    const resultsCount = document.getElementById('resultsCount');

    if (!productsGrid) return;

    if (resultsCount) {
      const n = products.length;
      resultsCount.textContent = `${n} producto${n !== 1 ? 's' : ''} encontrado${n !== 1 ? 's' : ''}`;
    }

    if (products.length === 0) {
      productsGrid.innerHTML = `
        <div class="col-12">
          <div class="no-results-container text-center py-5">
            <i class="bi bi-search display-1 text-muted mb-3"></i>
            <h4 class="text-muted">No se encontraron productos para "${query}"</h4>
            <p class="text-muted">Intentá con otros términos de búsqueda</p>
            <button class="btn btn-primary" onclick="window.searchManager.clearSearchResults()">
              <i class="bi bi-arrow-left me-2"></i>Ver todos los productos
            </button>
          </div>
        </div>
      `;
      return;
    }

    if (window.HomePageLoader?.renderProductCard) {
      productsGrid.innerHTML = '';
      const perRow = 3;
      for (let i = 0; i < products.length; i += perRow) {
        const row = document.createElement('div');
        row.className = 'products-row';
        products.slice(i, i + perRow).forEach(p => {
          row.innerHTML += window.HomePageLoader.renderProductCard(p);
        });
        productsGrid.appendChild(row);
      }
      if (window.HomePageLoader?.initializeProductListeners) {
        window.HomePageLoader.initializeProductListeners();
      }
    }
  }

  // ── servicios.html: delegate to the page's own filter system ──────────────

  triggerServiceFilter(query) {
    if (window.serviceCatalog) {
      window.serviceCatalog.searchTerm = query.toLowerCase();
      window.serviceCatalog.applyFilters();
    }
    if (this.searchInput) this.searchInput.value = query;
  }

  // ── Cross-link banner ──────────────────────────────────────────────────────
  // Shows "También encontramos X servicios/productos →" on list pages when
  // the complementary type also has results.

  updateCrossLink(type, results, query) {
    const bannerId = 'search-crosslink-banner';
    let banner = document.getElementById(bannerId);

    if (!results.length) {
      banner?.remove();
      return;
    }

    const isServices = type === 'services';
    const n = results.length;
    const singular = isServices ? 'servicio' : 'producto';
    const plural = isServices ? 'servicios' : 'productos';
    const href = isServices
      ? `./servicios.html?q=${encodeURIComponent(query)}`
      : `./productos.html?q=${encodeURIComponent(query)}`;
    const icon = isServices ? 'bi-wrench-adjustable' : 'bi-box-seam';

    if (!banner) {
      banner = document.createElement('div');
      banner.id = bannerId;
      const grid = document.getElementById('productsGrid') || document.getElementById('servicesGrid');
      if (grid) grid.insertAdjacentElement('beforebegin', banner);
    }

    banner.className = 'alert alert-info d-flex align-items-center gap-2 py-2 px-3 mb-3';
    banner.style.cssText = 'border-radius:10px;font-size:.88rem;';
    banner.innerHTML = `
      <i class="bi ${icon} flex-shrink-0"></i>
      <span>También encontramos <strong>${n} ${n === 1 ? singular : plural}</strong>
        para "<strong>${query}</strong>".</span>
      <a href="${href}" class="ms-auto btn btn-sm btn-outline-primary text-nowrap">
        Ver ${plural} →
      </a>
    `;
  }

  // ── Unified dropdown (non-list pages, e.g. index.html) ────────────────────

  _injectStyles() {
    if (this._stylesInjected) return;
    this._stylesInjected = true;
    const style = document.createElement('style');
    style.textContent = `
      .search-wrapper { position: relative; }
      #searchDropdown {
        position: absolute;
        top: calc(100% + 6px);
        left: 0; right: 0;
        background: #fff;
        border-radius: 14px;
        box-shadow: 0 8px 32px rgba(0,0,0,.16);
        z-index: 1055;
        max-height: 460px;
        overflow-y: auto;
      }
      .sd-section { padding: 10px 14px 6px; }
      .sd-section + .sd-section { border-top: 1px solid #f3f4f6; }
      .sd-section-header {
        font-size: .72rem; font-weight: 700;
        text-transform: uppercase; letter-spacing: .05em;
        color: #6b7280;
        display: flex; align-items: center; gap: 6px; margin-bottom: 6px;
      }
      .sd-item {
        display: flex; align-items: center; gap: 10px;
        padding: 7px 6px; border-radius: 8px;
        text-decoration: none; color: inherit;
        transition: background .15s;
      }
      .sd-item:hover { background: #f9fafb; }
      .sd-item img {
        width: 42px; height: 42px; object-fit: cover;
        border-radius: 6px; flex-shrink: 0;
      }
      .sd-item-title { font-size: .84rem; font-weight: 600; color: #111827; line-height: 1.25; }
      .sd-item-price { font-size: .77rem; color: #6b7280; margin-top: 2px; }
      .sd-view-all {
        display: block; font-size: .8rem; font-weight: 600;
        color: var(--primary-red, #ef4444);
        padding: 5px 6px 9px; text-decoration: none;
      }
      .sd-view-all:hover { text-decoration: underline; }
      .sd-empty { padding: 18px 14px; text-align: center; color: #6b7280; font-size: .88rem; }
    `;
    document.head.appendChild(style);
  }

  _ensureDropdown() {
    this._injectStyles();
    if (!this._dropdown) {
      this._dropdown = document.createElement('div');
      this._dropdown.id = 'searchDropdown';
      const wrapper = this.searchInput?.closest('.search-wrapper');
      (wrapper || document.body).appendChild(this._dropdown);
    }
  }

  showUnifiedDropdown(query, products, services) {
    this._ensureDropdown();

    const base = this._isRootPage() ? './HTML/' : './';
    const productsUrl = `${base}productos.html?q=${encodeURIComponent(query)}`;
    const servicesUrl = `${base}servicios.html?q=${encodeURIComponent(query)}`;

    if (!products.length && !services.length) {
      this._dropdown.innerHTML = `
        <div class="sd-empty">
          <i class="bi bi-search me-2"></i>Sin resultados para "<strong>${query}</strong>"
        </div>`;
      this._dropdown.style.display = 'block';
      return;
    }

    const renderItem = (item, href) => {
      const price = item.price != null
        ? `$${Number(item.price).toLocaleString('es-AR')}`
        : '';
      return `
        <a class="sd-item" href="${href}">
          <img src="${item.image || ''}" alt="" loading="lazy" onerror="this.style.display='none'">
          <div>
            <div class="sd-item-title">${item.title}</div>
            ${price ? `<div class="sd-item-price">${price}</div>` : ''}
          </div>
        </a>`;
    };

    let html = '';

    if (products.length) {
      html += `
        <div class="sd-section">
          <div class="sd-section-header">
            <i class="bi bi-box-seam"></i>Productos (${products.length})
          </div>
          ${products.slice(0, 4).map(p => renderItem(p, productsUrl)).join('')}
          <a class="sd-view-all" href="${productsUrl}">Ver todos los productos →</a>
        </div>`;
    }

    if (services.length) {
      html += `
        <div class="sd-section">
          <div class="sd-section-header">
            <i class="bi bi-wrench-adjustable"></i>Servicios (${services.length})
          </div>
          ${services.slice(0, 4).map(s => renderItem(s, servicesUrl)).join('')}
          <a class="sd-view-all" href="${servicesUrl}">Ver todos los servicios →</a>
        </div>`;
    }

    this._dropdown.innerHTML = html;
    this._dropdown.style.display = 'block';
  }

  hideDropdown() {
    if (this._dropdown) this._dropdown.style.display = 'none';
  }

  // ── Clear ──────────────────────────────────────────────────────────────────

  clearSearchResults() {
    this.productResults = [];
    this.serviceResults = [];

    if (this.searchInput) this.searchInput.value = '';

    this.hideDropdown();
    document.getElementById('search-crosslink-banner')?.remove();

    if (this._onProductsPage()) {
      if (window.HomePageLoader?.loadProducts) {
        window.HomePageLoader.loadProducts();
      } else if (window.ProductsPageLoader?.loadProducts) {
        window.ProductsPageLoader.loadProducts();
      }
    } else if (this._onServicesPage() && window.serviceCatalog) {
      window.serviceCatalog.searchTerm = '';
      window.serviceCatalog.applyFilters();
    }
  }

  // ── URL param loading ──────────────────────────────────────────────────────

  getQueryFromURL() {
    return new URLSearchParams(window.location.search).get('q');
  }

  loadSearchFromURL() {
    const query = this.getQueryFromURL() || localStorage.getItem('searchQuery');
    if (!query) return;

    if (this.searchInput) this.searchInput.value = query;
    this.performSearch(query);
    localStorage.removeItem('searchQuery');
  }

  // ── Error ──────────────────────────────────────────────────────────────────

  showSearchError() {
    window.DaleDeal?.utils?.showNotification(
      'Error al buscar. Por favor, intentá nuevamente.',
      'error'
    );
  }
}

// Initialize globally
if (typeof window !== 'undefined') {
  window.searchManager = new SearchManager();
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SearchManager;
}
