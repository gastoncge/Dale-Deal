// =====================================================
// DALE DEAL - Página de Producto
// =====================================================

class ProductPage {
  constructor() {
    this.currentProduct = null;
    this.selectedColor = '';
    this.selectedStorage = '';
    this.quantity = 1;
    this.currentImageIndex = 0;

    this.init();
  }

  init() {
    this.loadProductData();
    if (!this.currentProduct) return; // Abort if product not found
    this.setupEventListeners();
    this.setupImageGallery();
    this.updatePrice();
    this.updateFavoriteButton();
    this.loadSellerProducts();
    this.loadSimilarProducts();
    this.loadRecentlyViewed();
    this.saveToRecentlyViewed();
  }

  // ── ID resolution: URL param → localStorage → fallback 1 ──────────────────
  loadProductData() {
    const params = new URLSearchParams(window.location.search);
    const paramId = params.get('id');
    const storedId = localStorage.getItem('selectedProductId');
    const productId = parseInt(paramId || storedId) || 1;

    // Keep localStorage in sync with the URL param (for legacy pages)
    if (paramId) {
      localStorage.setItem('selectedProductId', paramId);
    }

    const productData = window.getProductById ? window.getProductById(productId) : null;

    if (!productData) {
      DaleDeal.error('Product not found:', productId);
      if (window.DaleDeal?.utils?.showNotification) {
        DaleDeal.utils.showNotification(
          `Producto #${productId} no encontrado. Redirigiendo al inicio…`,
          'error'
        );
      }
      setTimeout(() => { window.location.href = '../index.html'; }, 2000);
      return;
    }

    this.currentProduct = {
      id: productData.id,
      title: productData.title,
      category: productData.category,
      subcategory: productData.subcategory,
      basePrice: productData.price,
      originalPrice: productData.originalPrice,
      discount: productData.discount,
      rating: productData.rating,
      reviewCount: productData.reviewCount,
      salesCount: productData.soldCount,
      stock: productData.stock,
      description: productData.description,
      features: productData.features || [],
      specifications: productData.specifications || {},
      badges: productData.badges || [],
      colors: {},
      storage: {},
      images: productData.images
    };

    // Convert arrays → keyed objects
    (productData.colors || []).forEach(c => {
      this.currentProduct.colors[c.value] = { name: c.name, price: 0, color: c.color };
    });
    (productData.storage || []).forEach(s => {
      this.currentProduct.storage[s.size] = { name: s.size, price: s.price };
    });

    // Set default selections
    const colorKeys = Object.keys(this.currentProduct.colors);
    const storageKeys = Object.keys(this.currentProduct.storage);
    this.selectedColor = colorKeys[0] || '';
    // Prefer second storage option when multiple exist (mirrors product title e.g. "256GB")
    this.selectedStorage = storageKeys.length > 1 ? storageKeys[1] : (storageKeys[0] || '');

    this.updatePageContent();
  }

  // ── Event listeners ────────────────────────────────────────────────────────
  setupEventListeners() {
    // Color selectors
    document.querySelectorAll('.color-option').forEach(option => {
      option.addEventListener('click', (e) => {
        this.selectColor(e.currentTarget.dataset.color);
      });
    });

    // Storage selectors — use currentTarget so clicks on inner <span> still work
    document.querySelectorAll('.storage-option').forEach(option => {
      option.addEventListener('click', (e) => {
        this.selectStorage(e.currentTarget.dataset.storage);
      });
    });

    // Quantity controls
    document.getElementById('decreaseBtn')?.addEventListener('click', () => this.changeQuantity(-1));
    document.getElementById('increaseBtn')?.addEventListener('click', () => this.changeQuantity(1));
    document.getElementById('quantityInput')?.addEventListener('change', (e) => {
      this.setQuantity(parseInt(e.target.value) || 1);
    });

    // Purchase buttons
    document.querySelector('.btn-buy-now')?.addEventListener('click', () => this.buyNow());
    document.querySelector('.btn-add-cart')?.addEventListener('click', () => this.addToCart());

    // View more similar
    document.getElementById('viewMoreSimilarBtn')?.addEventListener('click', () => this.goToCategory());
  }

  // ── Page content update ────────────────────────────────────────────────────
  updatePageContent() {
    const p = this.currentProduct;

    // Title
    const titleEl = document.querySelector('.product-title');
    if (titleEl) titleEl.textContent = p.title;

    // Breadcrumb
    const bcCat = document.querySelector('.breadcrumb-item:nth-child(2) a');
    const bcSub = document.querySelector('.breadcrumb-item:nth-child(3) a');
    const bcActive = document.querySelector('.breadcrumb-item.active');
    if (bcCat) bcCat.textContent = p.category;
    if (bcSub) bcSub.textContent = p.subcategory;
    if (bcActive) bcActive.textContent = p.title;

    // SEO — dynamic title + meta tags
    document.title = `${p.title} - DALE DEAL`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      const preview = p.description.length > 120
        ? p.description.substring(0, 120) + '…'
        : p.description;
      metaDesc.setAttribute('content',
        `${p.title} al mejor precio. ${preview} Envío gratis y cuotas sin interés en Dale Deal.`
      );
    }
    const metaKw = document.querySelector('meta[name="keywords"]');
    if (metaKw) {
      metaKw.setAttribute('content',
        [p.title, p.category, p.subcategory, 'dale deal', 'marketplace Argentina'].join(', ')
      );
    }

    // Rating
    const ratingText = document.querySelector('.rating-text');
    if (ratingText) {
      ratingText.textContent = `${p.rating} (${p.reviewCount.toLocaleString('es-AR')} reseñas)`;
    }
    const ratingStars = document.querySelector('.product-rating .stars');
    if (ratingStars) ratingStars.innerHTML = this.renderProductStars(p.rating);

    // Sold count
    const soldEl = document.querySelector('.product-sold span');
    if (soldEl) soldEl.textContent = `+${p.salesCount} vendidos`;

    // Prices
    const currentPriceEl = document.querySelector('.current-price');
    if (currentPriceEl) currentPriceEl.textContent = this.formatPrice(p.basePrice);

    const originalPriceEl = document.querySelector('.original-price');
    if (originalPriceEl) {
      if (p.originalPrice) {
        originalPriceEl.textContent = this.formatPrice(p.originalPrice);
        originalPriceEl.style.display = '';
      } else {
        originalPriceEl.style.display = 'none';
      }
    }

    const discountBadgeEl = document.querySelector('.discount-badge');
    if (discountBadgeEl) {
      if (p.discount) {
        discountBadgeEl.textContent = `${p.discount}% OFF`;
        discountBadgeEl.style.display = '';
      } else {
        discountBadgeEl.style.display = 'none';
      }
    }

    // Installments
    const installmentsEl = document.querySelector('.installments');
    if (installmentsEl) {
      installmentsEl.innerHTML = `Hasta <strong>12 cuotas sin interés</strong> de ${this.formatPrice(p.basePrice / 12)}`;
    }

    // Stock
    const stockInfo = document.querySelector('.stock-info');
    if (stockInfo) stockInfo.textContent = `Stock disponible: ${p.stock} unidades`;

    // Quantity max
    const qtyInput = document.getElementById('quantityInput');
    if (qtyInput) qtyInput.max = Math.min(p.stock, 10);

    // Options
    this.updateColorOptions();
    this.updateStorageOptions();

    // Description & specs tabs
    this.updateDescriptionTab();
    this.updateSpecificationsTab();

    // Reviews tab — update rating summary with real data
    const overallRatingEl = document.querySelector('.overall-rating .rating-number');
    if (overallRatingEl) overallRatingEl.textContent = p.rating;
    const reviewCountEl = document.querySelector('.overall-rating .rating-count');
    if (reviewCountEl) reviewCountEl.textContent = `${p.reviewCount.toLocaleString('es-AR')} reseñas`;
    const reviewStarsEl = document.querySelector('.overall-rating .rating-stars');
    if (reviewStarsEl) reviewStarsEl.innerHTML = this.renderProductStars(p.rating);
  }

  // ── Color options ──────────────────────────────────────────────────────────
  updateColorOptions() {
    const container = document.querySelector('.color-options');
    if (!container) return;

    container.innerHTML = '';
    const colorKeys = Object.keys(this.currentProduct.colors);
    colorKeys.forEach((key, i) => {
      const c = this.currentProduct.colors[key];
      const div = document.createElement('div');
      div.className = `color-option ${i === 0 ? 'active' : ''}`;
      div.dataset.color = key;
      div.style.background = c.color;
      div.title = c.name;
      container.appendChild(div);
    });
    // selectedColor already set in loadProductData
  }

  // ── Storage options ────────────────────────────────────────────────────────
  updateStorageOptions() {
    const container = document.querySelector('.storage-options');
    if (!container) return;

    const storageKeys = Object.keys(this.currentProduct.storage);
    container.innerHTML = '';
    storageKeys.forEach((key, i) => {
      const s = this.currentProduct.storage[key];
      const div = document.createElement('div');
      // Edge case: single option → always active at index 0
      const isActive = storageKeys.length === 1 ? i === 0 : i === 1;
      div.className = `storage-option ${isActive ? 'active' : ''}`;
      div.dataset.storage = key;
      const priceText = s.price === 0
        ? 'Base'
        : s.price > 0 ? `+${this.formatPrice(s.price)}` : this.formatPrice(s.price);
      div.innerHTML = `${key}<span class="extra-cost">${priceText}</span>`;
      container.appendChild(div);
    });
    // selectedStorage already set in loadProductData
  }

  // ── Description tab — muestra el contenido tal como fue escrito ───────────
  updateDescriptionTab() {
    const descContent = document.querySelector('.description-content');
    if (!descContent) return;

    const p = this.currentProduct;
    // Si la descripción contiene HTML (editor rico), se renderiza directo.
    // Si es texto plano, se respetan los saltos de línea.
    const isHTML = /<[a-z][\s\S]*>/i.test(p.description || '');
    descContent.innerHTML = isHTML
      ? p.description
      : `<p style="white-space:pre-line;line-height:1.8;color:var(--gray-700)">${p.description || ''}</p>`;
  }

  // ── Specifications tab — dynamic ───────────────────────────────────────────
  updateSpecificationsTab() {
    const specsContainer = document.querySelector('.specifications-content');
    if (!specsContainer || !this.currentProduct.specifications) return;

    specsContainer.innerHTML = '';
    Object.keys(this.currentProduct.specifications).forEach(groupKey => {
      const group = this.currentProduct.specifications[groupKey];
      const groupDiv = document.createElement('div');
      groupDiv.className = 'spec-group';

      const title = document.createElement('h4');
      title.textContent = this.getSpecGroupTitle(groupKey);
      groupDiv.appendChild(title);

      Object.keys(group).forEach(specKey => {
        const specDiv = document.createElement('div');
        specDiv.className = 'spec-item';
        specDiv.innerHTML = `
          <span class="spec-label">${this.getSpecLabel(specKey)}</span>
          <span class="spec-value">${group[specKey]}</span>
        `;
        groupDiv.appendChild(specDiv);
      });
      specsContainer.appendChild(groupDiv);
    });
  }

  getSpecGroupTitle(key) {
    const map = {
      screen: 'Pantalla', display: 'Pantalla', performance: 'Rendimiento',
      camera: 'Cámara', memory: 'Memoria', audio: 'Audio',
      battery: 'Batería', connectivity: 'Conectividad', video: 'Video', smart: 'Smart TV'
    };
    return map[key] || key.charAt(0).toUpperCase() + key.slice(1);
  }

  getSpecLabel(key) {
    const map = {
      size: 'Tamaño', technology: 'Tecnología', resolution: 'Resolución', density: 'Densidad',
      chip: 'Chip', cpu: 'CPU', gpu: 'GPU', neuralEngine: 'Neural Engine',
      ram: 'RAM', storage: 'Almacenamiento', main: 'Principal',
      ultraWide: 'Ultra gran angular', telephoto: 'Teleobjetivo', opticalZoom: 'Zoom óptico',
      telephoto1: 'Teleobjetivo 1', telephoto2: 'Teleobjetivo 2',
      drivers: 'Controladores', frequency: 'Frecuencia', impedance: 'Impedancia',
      sensitivity: 'Sensibilidad', listening: 'Escucha', withCase: 'Con estuche',
      talkTime: 'Tiempo de llamada', charging: 'Carga rápida', bluetooth: 'Bluetooth',
      compatibility: 'Compatibilidad', memory: 'Memoria', frameRate: 'Tasa de frames',
      rayTracing: 'Ray Tracing', hdr: 'HDR', output: 'Salida', os: 'Sistema operativo',
      wifi: 'Wi-Fi', apps: 'Aplicaciones', hdmi: 'HDMI', usb: 'USB', ethernet: 'Ethernet'
    };
    return map[key] || key.charAt(0).toUpperCase() + key.slice(1);
  }

  // ── Image gallery ──────────────────────────────────────────────────────────
  setupImageGallery() {
    if (!this.currentProduct?.images) return;

    const mainImage = document.querySelector('.main-product-image');
    const thumbnailContainer = document.querySelector('.thumbnail-container');

    if (mainImage && this.currentProduct.images.main) {
      mainImage.src = this.currentProduct.images.main;
      mainImage.alt = this.currentProduct.title;
    }

    if (thumbnailContainer && this.currentProduct.images.thumbnails?.length) {
      thumbnailContainer.innerHTML = '';
      this.currentProduct.images.thumbnails.forEach((thumb, i) => {
        const img = document.createElement('img');
        img.src = thumb;
        img.alt = `${this.currentProduct.title} – Vista ${i + 1}`;
        img.className = `thumbnail ${i === 0 ? 'active' : ''}`;
        img.dataset.full = this.currentProduct.images.gallery[i] || thumb;

        img.addEventListener('click', () => {
          if (mainImage) {
            mainImage.src = this.currentProduct.images.gallery[i] || thumb;
          }
          thumbnailContainer.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
          img.classList.add('active');
          this.currentImageIndex = i;
        });
        thumbnailContainer.appendChild(img);
      });
    }

    // Product badge (discount indicator on image)
    const badgeEl = document.querySelector('.product-badge');
    if (badgeEl) {
      if (this.currentProduct.discount) {
        badgeEl.textContent = `${this.currentProduct.discount}% OFF`;
        badgeEl.style.display = '';
      } else {
        badgeEl.style.display = 'none';
      }
    }
  }

  // ── Selectors ──────────────────────────────────────────────────────────────
  selectColor(color) {
    if (!color || !this.currentProduct.colors[color]) return;
    this.selectedColor = color;
    document.querySelectorAll('.color-option').forEach(o => o.classList.remove('active'));
    document.querySelector(`[data-color="${color}"]`)?.classList.add('active');
    this.updatePrice();
    this.showNotification(`Color: ${this.currentProduct.colors[color].name}`, 'info');
  }

  selectStorage(storage) {
    if (!storage || !this.currentProduct.storage[storage]) return;
    this.selectedStorage = storage;
    document.querySelectorAll('.storage-option').forEach(o => o.classList.remove('active'));
    document.querySelector(`[data-storage="${storage}"]`)?.classList.add('active');
    this.updatePrice();
    this.showNotification(`Almacenamiento: ${storage}`, 'info');
  }

  // ── Quantity ───────────────────────────────────────────────────────────────
  changeQuantity(delta) { this.setQuantity(this.quantity + delta); }

  setQuantity(qty) {
    const max = Math.min(this.currentProduct.stock, 10);
    this.quantity = Math.max(1, Math.min(qty, max));
    const input = document.getElementById('quantityInput');
    if (input) input.value = this.quantity;
    this.updatePrice();
  }

  // ── Price update ───────────────────────────────────────────────────────────
  updatePrice() {
    if (!this.currentProduct) return;

    // Safety guards: reset selection to first valid option if stale
    const storageKeys = Object.keys(this.currentProduct.storage);
    if (!this.currentProduct.storage[this.selectedStorage]) {
      this.selectedStorage = storageKeys.length > 1 ? storageKeys[1] : (storageKeys[0] || '');
    }
    const colorKeys = Object.keys(this.currentProduct.colors);
    if (!this.currentProduct.colors[this.selectedColor]) {
      this.selectedColor = colorKeys[0] || '';
    }

    const storagePrice = this.currentProduct.storage[this.selectedStorage]?.price || 0;
    const colorPrice  = this.currentProduct.colors[this.selectedColor]?.price  || 0;
    const totalPrice  = (this.currentProduct.basePrice + storagePrice + colorPrice) * this.quantity;

    const currentPriceEl = document.querySelector('.current-price');
    if (currentPriceEl) currentPriceEl.textContent = this.formatPrice(totalPrice);

    // Rebuild installments text to avoid stale DOM references
    const installmentsEl = document.querySelector('.installments');
    if (installmentsEl) {
      installmentsEl.innerHTML = `Hasta <strong>12 cuotas sin interés</strong> de ${this.formatPrice(totalPrice / 12)}`;
    }
  }

  // ── Cart & Buy ─────────────────────────────────────────────────────────────
  calculateUnitPrice() {
    const storagePrice = this.currentProduct.storage[this.selectedStorage]?.price || 0;
    const colorPrice   = this.currentProduct.colors[this.selectedColor]?.price   || 0;
    return this.currentProduct.basePrice + storagePrice + colorPrice;
  }

  async addToCart() {
    const button = document.querySelector('.btn-add-cart');
    this.setButtonLoading(button, true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const colorName = this.currentProduct.colors[this.selectedColor]?.name || this.selectedColor;
      const cartItem = {
        id: `${this.currentProduct.id}-${this.selectedColor}-${this.selectedStorage}`,
        title: `${this.currentProduct.title} – ${colorName}`,
        price: this.calculateUnitPrice(),
        // Use the currently displayed gallery image (not a stale hardcoded array)
        image: this.currentProduct.images.gallery[this.currentImageIndex]
               || this.currentProduct.images.main,
        quantity: this.quantity,
        color: this.selectedColor,
        storage: this.selectedStorage,
      };
      if (window.cartManager) {
        window.cartManager.addItem(cartItem);
      } else {
        this.showNotification('Producto agregado al carrito', 'success');
      }
    } catch (err) {
      DaleDeal.error('Error agregando al carrito:', err);
      this.showNotification('Error al agregar al carrito', 'error');
    } finally {
      this.setButtonLoading(button, false);
    }
  }

  async buyNow() {
    const button = document.querySelector('.btn-buy-now');
    this.setButtonLoading(button, true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1200));
      this.showNotification('Redirigiendo al checkout…', 'info');
      setTimeout(() => {
        DaleDeal.log('¡Checkout! En producción aquí se procesaría el pago.');
      }, 1000);
    } catch (err) {
      DaleDeal.error('Error en compra:', err);
      this.showNotification('Error al procesar la compra', 'error');
    } finally {
      this.setButtonLoading(button, false);
    }
  }

  // ── Favorites ──────────────────────────────────────────────────────────────
  updateFavoriteButton() {
    setTimeout(() => {
      if (window.favoritesManager) window.favoritesManager.updateWishlistButton();
    }, 150);
  }

  // ── Custom paged carousel (sin Bootstrap JS) ──────────────────────────────
  _buildCarousel(carouselId, gridId, products, isRecent = false) {
    const carousel = document.getElementById(carouselId);
    const grid = document.getElementById(gridId);
    if (!carousel || !grid || products.length === 0) return;

    const pps = window.innerWidth < 768 ? 1 : window.innerWidth < 1024 ? 2 : 4;
    const pages = [];
    for (let i = 0; i < products.length; i += pps) {
      pages.push(products.slice(i, i + pps));
    }

    let current = 0;

    const render = () => {
      grid.innerHTML = `<div class="row justify-content-center">${pages[current].map(p => this.renderProductCard(p, isRecent)).join('')}</div>`;
      setTimeout(() => window.favoritesManager?.updateFavoriteButtons(), 100);
    };

    render();

    const prev = carousel.querySelector('.carousel-control-prev');
    const next = carousel.querySelector('.carousel-control-next');

    if (prev) {
      prev.style.display = 'flex';
      prev.onclick = () => { current = (current - 1 + pages.length) % pages.length; render(); };
    }
    if (next) {
      next.style.display = 'flex';
      next.onclick = () => { current = (current + 1) % pages.length; render(); };
    }
  }

  // ── Seller products ────────────────────────────────────────────────────────
  async loadSellerProducts() {
    const section = document.getElementById('sellerProductsSection');
    if (!section || !this.currentProduct) return;

    try {
      await new Promise(resolve => setTimeout(resolve, 400));
      const allProducts = window.getAllProducts ? window.getAllProducts() : [];
      const sellerProducts = allProducts
        .filter(p => p.category === this.currentProduct.category && p.id !== this.currentProduct.id)
        .slice(0, 8);

      if (sellerProducts.length === 0) return;
      section.style.display = '';
      this._buildCarousel('sellerProductsCarousel', 'sellerProductsGrid', sellerProducts);
    } catch (err) {
      DaleDeal.error('Error cargando productos del vendedor:', err);
    }
  }

  // ── Similar products ───────────────────────────────────────────────────────
  async loadSimilarProducts() {
    if (!this.currentProduct) return;

    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const allProducts = window.getAllProducts ? window.getAllProducts() : [];
      let similar = allProducts
        .filter(p => p.category === this.currentProduct.category && p.id !== this.currentProduct.id)
        .slice(0, 8);

      if (similar.length === 0) {
        similar = allProducts
          .filter(p => p.id !== this.currentProduct.id)
          .sort(() => 0.5 - Math.random())
          .slice(0, 8);
      }
      this._buildCarousel('similarProductsCarousel', 'similarProductsGrid', similar);
    } catch (err) {
      DaleDeal.error('Error cargando similares:', err);
    }
  }

  // ── Recently viewed ────────────────────────────────────────────────────────
  loadRecentlyViewed() {
    try {
      const recentIds = this.getRecentlyViewed()
        .filter(id => id !== String(this.currentProduct.id))
        .slice(0, 8);
      if (!recentIds.length) return;
      const products = recentIds
        .map(id => window.getProductById ? window.getProductById(parseInt(id)) : null)
        .filter(Boolean);
      if (products.length) this._buildCarousel('recentlyViewedCarousel', 'recentlyViewedGrid', products, true);
    } catch (err) {
      DaleDeal.error('Error cargando recientes:', err);
    }
  }

  // ── Shared card renderer (similar, seller & recent) ──────────────────────
  renderProductCard(product, isRecent = false) {
    const hasDiscount = product.discount && product.discount > 0;
    const hasMultipleImages = product.images?.gallery?.length > 1;

    // Badges — top-left: custom + offer (sin duplicar descuento); bottom-right: solo badges de plataforma (sin texto personalizado)
    const badges = product.badges || [];
    const customBadges = badges.filter(b => typeof b === 'object' && b.text);
    const legacyBadges = badges.filter(b => typeof b === 'string');
    // Si ya hay discount en el campo, ignorar strings tipo "X% OFF" para no duplicar
    const legacyOfferBadges = hasDiscount ? [] : legacyBadges.filter(b => b.includes('OFF'));
    const platformBadges = legacyBadges.filter(b => !b.includes('OFF') && ['DESTACADO', 'MÁS VENDIDO', 'NUEVO', 'RECOMENDADO'].includes(b.toUpperCase()));
    const topLeftInner = [
      ...customBadges.map(b => `<span class="badge-custom" style="background:${b.color}">${b.text}</span>`),
      hasDiscount ? `<span class="badge-offer">-${product.discount}%</span>` : '',
      ...legacyOfferBadges.map(b => `<span class="badge-offer">${b}</span>`),
    ].filter(Boolean).join('');
    const topLeftHTML = topLeftInner ? `<div class="service-badges">${topLeftInner}</div>` : '';
    const bottomRightHTML = platformBadges.map(b => `<span class="badge-featured">${b}</span>`).join('');

    // Images
    let imagesHTML = '';
    if (hasMultipleImages) {
      imagesHTML = `
        <div class="product-image-carousel" data-current-image="0">
          ${product.images.gallery.map((img, i) => `
            <img src="${img}" alt="${product.title} - Vista ${i + 1}" class="product-image ${i === 0 ? 'active' : ''}" />
          `).join('')}
          <button class="carousel-control carousel-prev" data-direction="prev"><i class="bi bi-chevron-left"></i></button>
          <button class="carousel-control carousel-next" data-direction="next"><i class="bi bi-chevron-right"></i></button>
          <div class="carousel-indicators">
            ${product.images.gallery.map((_, i) => `<span class="indicator ${i === 0 ? 'active' : ''}" data-index="${i}"></span>`).join('')}
          </div>
        </div>`;
    } else {
      imagesHTML = `<img src="${product.images.main}" alt="${product.title}" class="product-image" />`;
    }

    const desc = product.description
      ? (product.description.length > 80 ? product.description.substring(0, 80) + '…' : product.description)
      : '';

    const priceHTML = hasDiscount
      ? `<span class="product-current-price">${this.formatPrice(product.price)}</span>
         <span class="product-original-price">${this.formatPrice(product.originalPrice)}</span>`
      : `<span class="product-current-price">${this.formatPrice(product.price)}</span>`;

    return `
      <div class="col-12 col-md-6 col-lg-3 mb-4 d-flex">
        <div class="product-card ${hasDiscount ? 'has-offer' : ''} w-100"
             data-id="${product.id}" data-clickable="true">
          <div class="product-image-container">
            ${imagesHTML}
            ${topLeftHTML}
            ${bottomRightHTML}
            ${isRecent ? `<div class="recently-viewed-badge"><i class="bi bi-clock-history"></i></div>` : ''}
            <div class="product-actions">
              <button class="action-heart" title="Agregar a favoritos" data-product-id="${product.id}">
                <i class="bi bi-heart"></i>
              </button>
            </div>
          </div>
          <div class="product-info">
            <h3 class="product-title">${product.title}</h3>
            <p class="product-description">${desc}</p>
            <div class="product-meta-group">
              <div class="product-rating">
                <div class="stars">${this.renderProductStars(product.rating)}</div>
                <span class="reviews-count">(${product.reviewCount.toLocaleString('es-AR')})</span>
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
              <div class="product-pricing">${priceHTML}</div>
            </div>
          </div>
        </div>
      </div>`;
  }

  // ── Recently viewed persistence ────────────────────────────────────────────
  saveToRecentlyViewed() {
    if (!this.currentProduct) return;
    try {
      const id = String(this.currentProduct.id);
      let recent = this.getRecentlyViewed().filter(x => x !== id);
      recent.unshift(id);
      localStorage.setItem('daledealt_recently_viewed', JSON.stringify(recent.slice(0, 10)));
    } catch (err) {
      DaleDeal.error('Error guardando reciente:', err);
    }
  }

  getRecentlyViewed() {
    try {
      const raw = localStorage.getItem('daledealt_recently_viewed');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  // ── Category navigation ────────────────────────────────────────────────────
  goToCategory() {
    // Navigate to productos.html filtered by category
    window.location.href =
      `./productos.html?category=${encodeURIComponent(this.currentProduct.category)}`;
  }

  // ── Stars renderer ─────────────────────────────────────────────────────────
  renderProductStars(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
      if (i <= rating)          html += '<i class="bi bi-star-fill"></i>';
      else if (i - 0.5 <= rating) html += '<i class="bi bi-star-half"></i>';
      else                        html += '<i class="bi bi-star"></i>';
    }
    return html;
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  formatPrice(price) {
    if (window.DaleDeal?.utils?.formatPrice) return window.DaleDeal.utils.formatPrice(price);
    return new Intl.NumberFormat('es-AR', {
      style: 'currency', currency: 'ARS',
      minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(price);
  }

  setButtonLoading(button, isLoading) {
    if (!button) return;
    button.classList.toggle('btn-loading', isLoading);
    button.disabled = isLoading;
  }

  showNotification(message, type = 'info') {
    if (window.DaleDeal?.utils?.showNotification) {
      window.DaleDeal.utils.showNotification(message, type);
      return;
    }
    DaleDeal.log(`[${type.toUpperCase()}] ${message}`);
  }
}

// ── Bootstrap ────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  new ProductPage();
});
