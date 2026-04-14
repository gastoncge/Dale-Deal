// ===== PRODUCT CATALOG =====
// Lógica de carga, transformación y renderizado de productos para productos.html
// Extraído de HTML/productos.html (REORG-02)

class ProductCatalog {
  constructor() {
    this.products = [];
    this.currentPage = 1;
    this.productsPerPage = 12;
    this.displayedProducts = [];
    this.isLoading = false;

    this.init();
  }

  async init() {
    try {
      this.showLoading(true);

      const productsData = await window.DaleDeal.api.fetchProducts();
      this.products = this.transformProductsData(productsData);

      // Conectar productFilters — fuente única de verdad
      if (window.productFilters) {
        window.productFilters.renderProducts = () => this.renderFilteredProducts();
        window.productFilters.products = this.createFilterableProducts();
        window.productFilters.originalProducts = [...window.productFilters.products];

        const categoryParam = new URLSearchParams(window.location.search).get('category');
        if (categoryParam && categoryParam !== 'all') {
          window.productFilters.currentCategory = categoryParam;
          const radio = document.querySelector(`input[name="category"][value="${categoryParam}"]`);
          if (radio) radio.checked = true;
        }
      }

      this.showLoading(false);
      this.createProductCards();
      this.updateResultsCount();

    } catch (error) {
      DaleDeal.error('Error loading products:', error);
      this.showLoading(false);
      this.showError('Error al cargar los productos. Por favor, intenta nuevamente.');
    }
  }

  transformProductsData(apiProducts) {
    return apiProducts.map(product => ({
      id: product.id,
      title: product.title,
      description: product.description || '',
      price: product.price,
      originalPrice: product.originalPrice,
      discount: product.discount,
      category: this.mapCategory(product.category),
      images: product.images?.gallery || [product.images?.main],
      image: product.images?.main,
      rating: product.rating,
      reviews: product.reviewCount || 0,
      featured: product.badges?.includes('Premium') || product.badges?.includes('MÁS VENDIDO') || false,
      isOffer: product.discount > 0,
      shipping: product.shipping || { free: true, speed: 'tomorrow' },
      seller: product.seller || null
    }));
  }

  mapCategory(category) {
    const categoryMap = {
      'Electrónicos': 'electronics',
      'Moda': 'fashion',
      'Hogar': 'home',
      'Deportes': 'sports',
      'Libros': 'books'
    };
    return categoryMap[category] || category.toLowerCase();
  }

  showLoading(show) {
    const emptyStateContainer = document.getElementById('emptyStateContainer');
    const loading = document.getElementById('loadingContainer');
    const grid = document.getElementById('productsGrid');
    const noResults = document.getElementById('noResults');

    if (show) {
      grid.style.display = 'none';
      emptyStateContainer.style.display = 'flex';
      loading.style.display = 'block';
      noResults.style.display = 'none';
      this.isLoading = true;
    } else {
      emptyStateContainer.style.display = 'none';
      loading.style.display = 'none';
      grid.style.display = 'grid';
      this.isLoading = false;
    }
  }

  showError(message) {
    const emptyStateContainer = document.getElementById('emptyStateContainer');
    const grid = document.getElementById('productsGrid');
    const loading = document.getElementById('loadingContainer');
    const noResults = document.getElementById('noResults');

    grid.style.display = 'none';
    emptyStateContainer.style.display = 'flex';
    loading.style.display = 'none';
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

  createFilterableProducts() {
    return this.products.map(product => ({
      id: product.id,
      title: product.title,
      price: product.price,
      priceText: DaleDeal.utils.formatCurrency(product.price),
      rating: product.rating,
      category: product.category,
      imageUrl: product.image,
      badges: this.extractBadges(product),
      element: null,
      productData: product
    }));
  }

  extractBadges(product) {
    const badges = [];
    if (product.isOffer) badges.push(`-${product.discount}%`);
    if (product.featured) badges.push('Destacado');
    return badges;
  }

  renderFilteredProducts() {
    const container = document.getElementById('productsGrid');
    const emptyStateContainer = document.getElementById('emptyStateContainer');
    const loading = document.getElementById('loadingContainer');
    const noResults = document.getElementById('noResults');
    const loadMore = document.getElementById('loadMoreContainer');

    if (!window.productFilters) return;

    container.style.display = 'none';
    emptyStateContainer.style.display = 'flex';
    loading.style.display = 'block';
    noResults.style.display = 'none';
    container.innerHTML = '';

    setTimeout(() => {
      if (window.productFilters.products.length === 0) {
        container.style.display = 'none';
        emptyStateContainer.style.display = 'flex';
        loading.style.display = 'none';
        noResults.style.display = 'block';
        loadMore.style.display = 'none';
        this.updateResultsCount();
        return;
      }

      emptyStateContainer.style.display = 'none';
      loading.style.display = 'none';
      noResults.style.display = 'none';
      container.style.display = 'grid';

      const endIndex = this.currentPage * this.productsPerPage;
      const productsToShow = window.productFilters.products.slice(0, endIndex);

      productsToShow.forEach((productData, index) => {
        const product = productData.productData || this.findProductById(productData.id);
        if (product) {
          const productCard = this.createProductCard(product, index);
          container.appendChild(productCard);
        }
      });

      const loadMoreBtn = document.getElementById('loadMoreBtn');
      if (loadMoreBtn) {
        loadMoreBtn.classList.remove('loading');
        loadMoreBtn.disabled = false;
        loadMoreBtn.innerHTML = '<i class="bi bi-bag me-2"></i> Ver más productos';
      }

      if (endIndex < window.productFilters.products.length) {
        loadMore.style.display = 'block';
      } else {
        loadMore.style.display = 'none';
      }

      this.updateResultsCount();

      setTimeout(() => {
        if (window.productCarousel) {
          window.productCarousel.reinitialize();
        } else if (typeof initializeProductCarousels === 'function') {
          initializeProductCarousels();
        }
      }, 100);
    }, 0);
  }

  findProductById(id) {
    return this.products.find(p => p.id == id);
  }

  createProductCards() {
    this.renderFilteredProducts();
  }

  createProductCard(product, index) {
    const card = document.createElement('div');
    let cardClasses = 'product-card';

    if (product.isOffer && product.discount) {
      cardClasses += ' has-offer';
    }

    card.className = cardClasses;
    card.setAttribute('data-id', product.id);
    card.setAttribute('data-clickable', 'true');
    card.setAttribute('data-aos', 'fade-up');
    card.setAttribute('data-aos-delay', (index % 12) * 50);

    const starsHTML = DaleDeal.utils.renderStars(product.rating);

    const offerBadges = [];
    if (product.isOffer && product.discount) {
      offerBadges.push(`<span class="badge-offer">${product.discount}% OFF</span>`);
    }
    (product.badges || []).filter(b => typeof b === 'object' && b.text).forEach(b => {
      offerBadges.push(`<span class="badge-custom" style="background:${b.color}">${b.text}</span>`);
    });
    const topLeftHtml = offerBadges.length ? `<div class="service-badges">${offerBadges.join('')}</div>` : '';

    const platformBadges = [];
    if (product.featured) platformBadges.push(`<span class="badge-featured">MÁS VENDIDO</span>`);

    const badgesHtml = topLeftHtml + platformBadges.join('');

    const images = product.images || [product.image];
    const imageCarouselHtml = images.length > 1 ? `
      <div class="product-image-carousel" data-current-image="0">
        ${images.map((img, idx) => `
          <img
            src="${img}"
            alt="${DaleDeal.utils.escapeHtml(product.title)} - Vista ${idx + 1}"
            class="product-image ${idx === 0 ? 'active' : ''}"
          />
        `).join('')}
        <button class="carousel-control carousel-prev" data-direction="prev">
          <i class="bi bi-chevron-left"></i>
        </button>
        <button class="carousel-control carousel-next" data-direction="next">
          <i class="bi bi-chevron-right"></i>
        </button>
        <div class="carousel-indicators">
          ${images.map((_, idx) => `
            <span class="indicator ${idx === 0 ? 'active' : ''}" data-index="${idx}"></span>
          `).join('')}
        </div>
      </div>
    ` : `
      <img
        src="${images[0]}"
        alt="${DaleDeal.utils.escapeHtml(product.title)}"
        class="product-image"
      />
    `;

    const priceHTML = product.originalPrice ? `
      <span class="product-current-price">${DaleDeal.utils.formatCurrency(product.price)}</span>
      <span class="product-original-price">${DaleDeal.utils.formatCurrency(product.originalPrice)}</span>
    ` : `
      <span class="product-current-price">${DaleDeal.utils.formatCurrency(product.price)}</span>
    `;

    const shortDescription = product.description
      ? (product.description.length > 80
          ? product.description.substring(0, 80) + '...'
          : product.description)
      : '';

    const sellerHTML = product.seller ? `
      <div class="product-provider">
        <img src="${product.seller.avatar}" alt="${DaleDeal.utils.escapeHtml(product.seller.name)}" class="product-provider-avatar" />
        <span class="product-provider-name">${DaleDeal.utils.escapeHtml(product.seller.name)}</span>
        ${product.seller.verified ? '<i class="bi bi-patch-check-fill product-provider-verified"></i>' : ''}
      </div>` : '';

    card.innerHTML = `
      <div class="product-image-container">
        ${imageCarouselHtml}
        ${badgesHtml}
        <div class="product-actions">
          <button class="action-heart" title="Agregar a favoritos" data-product-id="${product.id}">
            <i class="bi bi-heart"></i>
          </button>
        </div>
      </div>
      <div class="product-info">
        <h3 class="product-title">${DaleDeal.utils.escapeHtml(product.title)}</h3>
        ${sellerHTML}
        <p class="product-description">${DaleDeal.utils.escapeHtml(shortDescription)}</p>

        <div class="product-meta-group">
          <div class="product-rating">
            <div class="stars">${starsHTML}</div>
            <span class="reviews-count">(${product.reviews.toLocaleString('es-AR')})</span>
            ${product.shipping?.free ? `<span class="shipping-badge"><i class="bi bi-truck"></i> Envío gratis</span>` : ''}
          </div>
          <div class="product-location">
            <i class="bi bi-geo-alt-fill"></i>
            <span>CABA</span>
            ${product.shipping?.speed === 'today' ? `<span class="shipping-badge"><i class="bi bi-lightning-charge-fill"></i> Llega hoy</span>` : ''}
            ${product.shipping?.speed === 'tomorrow' ? `<span class="shipping-badge"><i class="bi bi-clock-fill"></i> Llega mañana</span>` : ''}
          </div>
        </div>

        <div class="product-pricing-wrapper">
          <div class="product-pricing">
            ${priceHTML}
          </div>
        </div>
      </div>
    `;

    card.addEventListener('click', (e) => {
      if (e.target.closest('.action-heart') || e.target.closest('.action-quick-view')) {
        return;
      }
      window.location.href = `./producto.html?id=${product.id}`;
    });

    return card;
  }

  addToCart(product) {
    if (window.cartManager) {
      window.cartManager.addItem({
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.images ? product.images[0] : product.image,
        quantity: 1
      });
    }
  }

  updateResultsCount() {
    const count = window.productFilters ? window.productFilters.products.length : this.products.length;
    const countEl = document.getElementById('resultsCount');
    if (countEl) countEl.textContent = `${count} producto${count !== 1 ? 's' : ''} encontrado${count !== 1 ? 's' : ''}`;
  }

  loadMore() {
    this.currentPage++;
    this.renderFilteredProducts();
  }
}

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', () => {
  const catalog = new ProductCatalog();
  window.productCatalog = catalog;

  // Load more button
  document.getElementById('loadMoreBtn')?.addEventListener('click', () => {
    const btn = document.getElementById('loadMoreBtn');
    if (btn) {
      btn.classList.add('loading');
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Cargando...';
    }
    catalog.loadMore();
  });

  // Search input
  document.getElementById('searchInput')?.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    if (window.productFilters) {
      window.productFilters.searchTerm = searchTerm;
      window.productFilters.filterAndRender();
    }
  });

  // Category filter from URL params
  const categoryParam = new URLSearchParams(window.location.search).get('category');
  if (categoryParam && window.productFilters) {
    setTimeout(() => {
      document.querySelector(`[data-category="${categoryParam}"]`)?.click();
    }, 500);
  }

  // ===== SIDEBAR TOGGLE (MOBILE) =====
  const filtersSidebar = document.getElementById('filtersSidebar');
  const sidebarOverlay = document.getElementById('sidebarOverlay');

  function openSidebar() {
    filtersSidebar?.classList.add('active');
    sidebarOverlay?.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeSidebar() {
    filtersSidebar?.classList.remove('active');
    sidebarOverlay?.classList.remove('active');
    document.body.style.overflow = '';
  }

  document.getElementById('toggleFilters')?.addEventListener('click', openSidebar);
  sidebarOverlay?.addEventListener('click', closeSidebar);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && filtersSidebar?.classList.contains('active')) closeSidebar();
  });

  // ===== FILTER CONTROLS =====
  function applyAllFilters() {
    if (!window.productFilters) return;
    window.productFilters.currentCategory = document.querySelector('input[name="category"]:checked')?.value || 'all';
    window.productFilters.minPrice = parseFloat(document.getElementById('minPrice')?.value) || null;
    window.productFilters.maxPrice = parseFloat(document.getElementById('maxPrice')?.value) || null;
    window.productFilters.currentRating = document.querySelector('input[name="rating"]:checked')?.value || 'all';
    window.productFilters.currentSort = document.getElementById('sortSelect')?.value || 'featured';
    window.productFilters.filterAndRender();
  }

  let priceDebounceTimer;
  function applyFiltersDebounced() {
    clearTimeout(priceDebounceTimer);
    priceDebounceTimer = setTimeout(applyAllFilters, 500);
  }

  document.querySelectorAll('input[name="category"]').forEach(r => r.addEventListener('change', applyAllFilters));
  document.querySelectorAll('input[name="rating"]').forEach(r => r.addEventListener('change', applyAllFilters));
  document.getElementById('sortSelect')?.addEventListener('change', applyAllFilters);
  document.getElementById('minPrice')?.addEventListener('input', applyFiltersDebounced);
  document.getElementById('maxPrice')?.addEventListener('input', applyFiltersDebounced);

  document.querySelectorAll('.stepper-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.target);
      if (!input) return;
      const val = parseFloat(input.value) || 0;
      input.value = btn.dataset.action === 'up' ? val + 1 : Math.max(0, val - 1);
      input.dispatchEvent(new Event('input'));
    });
  });

  document.getElementById('clearAllFilters')?.addEventListener('click', () => {
    const allCatRadio = document.querySelector('input[name="category"][value="all"]');
    if (allCatRadio) allCatRadio.checked = true;
    const allRatingRadio = document.querySelector('input[name="rating"][value="all"]');
    if (allRatingRadio) allRatingRadio.checked = true;
    document.querySelectorAll('.filter-option input[type="checkbox"]').forEach(cb => { cb.checked = false; });
    const minPrice = document.getElementById('minPrice');
    const maxPrice = document.getElementById('maxPrice');
    if (minPrice) minPrice.value = '';
    if (maxPrice) maxPrice.value = '';
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) sortSelect.value = 'featured';
    if (window.productFilters) {
      window.productFilters.currentCategory = 'all';
      window.productFilters.minPrice = null;
      window.productFilters.maxPrice = null;
      window.productFilters.currentSort = 'featured';
      window.productFilters.filterAndRender();
    }
  });
});
