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
    this.chatMessages = [];

    this.init();
  }

  init() {
    this.loadProductData();
    if (!this.currentProduct) return; // Abort if product not found
    this.setupEventListeners();
    this.setupImageGallery();
    this.updatePrice();
    this.updateFavoriteButton();
    this.setupSellerCard();
    this.setupChat();
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
      seller: productData.seller || null,
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
    this.selectedStorage = this._defaultStorage(storageKeys);

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
    storageKeys.forEach((key) => {
      const s = this.currentProduct.storage[key];
      const div = document.createElement('div');
      div.className = `storage-option ${key === this.selectedStorage ? 'active' : ''}`;
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

    // Safety guard: reset to base if current selection is no longer valid
    const storageKeys = Object.keys(this.currentProduct.storage);
    if (!this.currentProduct.storage[this.selectedStorage]) {
      const base = storageKeys.find(k => this.currentProduct.storage[k].price === 0);
      this.selectedStorage = base || storageKeys[0] || '';
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

    const visible = window.innerWidth < 768 ? 1 : window.innerWidth < 1024 ? 2 : 3;
    const cardPct = 100 / visible;
    let current = 0;
    const maxIndex = Math.max(0, products.length - visible);

    const track = document.createElement('div');
    track.className = 'carousel-track';
    track.innerHTML = products.map(p => `<div class="carousel-slide-item" style="width:${cardPct}%">${this.renderProductCard(p, isRecent)}</div>`).join('');

    grid.style.overflow = 'hidden';
    grid.innerHTML = '';
    grid.appendChild(track);

    setTimeout(() => {
      if (window.ProductCarousel) window.productCarousel = new window.ProductCarousel();
      window.favoritesManager?.updateFavoriteButtons();
    }, 300);

    track.querySelectorAll('.product-card[data-clickable="true"]').forEach(card => {
      card.addEventListener('click', e => {
        if (e.target.closest('.action-heart') || e.target.closest('.carousel-control') || e.target.closest('.carousel-indicators')) return;
        const id = card.dataset.id;
        if (id) { localStorage.setItem('selectedProductId', id); window.location.href = `producto.html?id=${id}`; }
      });
    });

    const updateTrack = () => { track.style.transform = `translateX(-${current * cardPct}%)`; };

    const container = carousel.parentElement;
    const prev = container?.querySelector('.section-nav-prev');
    const next = container?.querySelector('.section-nav-next');

    if (prev) prev.onclick = () => { current = Math.max(0, current - 1); updateTrack(); };
    if (next) next.onclick = () => { current = Math.min(maxIndex, current + 1); updateTrack(); };
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
            ${product.seller ? `
            <div class="product-provider">
              <img src="${product.seller.avatar}" alt="${product.seller.name}" class="product-provider-avatar" />
              <span class="product-provider-name">${product.seller.name}</span>
              ${product.seller.verified ? '<i class="bi bi-patch-check-fill product-provider-verified"></i>' : ''}
            </div>` : ''}
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

  // ── Default storage deduction ──────────────────────────────────────────────
  // 1. Match against the size mentioned in the product title (e.g. "256GB", "1TB")
  // 2. Fall back to the base option (price === 0)
  // 3. Last resort: first key
  _defaultStorage(storageKeys) {
    if (!storageKeys.length) return '';
    if (storageKeys.length === 1) return storageKeys[0];

    const titleMatch = this.currentProduct.title.match(/\b(\d+\s*(?:GB|TB))\b/i);
    if (titleMatch) {
      const sizeInTitle = titleMatch[1].replace(/\s+/g, '').toUpperCase();
      const fromTitle = storageKeys.find(
        k => k.replace(/\s+/g, '').toUpperCase() === sizeInTitle
      );
      if (fromTitle) return fromTitle;
    }

    const base = storageKeys.find(k => this.currentProduct.storage[k].price === 0);
    return base || storageKeys[0];
  }

  // ── Category navigation ────────────────────────────────────────────────────
  goToCategory() {
    // Map raw category names to the slugs used by productos.html
    const slugMap = {
      'Electrónicos': 'electronics',
      'Moda': 'fashion',
      'Hogar': 'home',
      'Deportes': 'sports',
      'Libros': 'books'
    };
    const slug = slugMap[this.currentProduct.category]
      || this.currentProduct.category.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    window.location.href = `./productos.html?category=${encodeURIComponent(slug)}`;
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

  // ── Seller card ──────────────────────────────────────────────────────────
  setupSellerCard() {
    const p = this.currentProduct;
    if (!p?.seller) return;

    const avatar = document.getElementById('sellerCardAvatar');
    const name = document.getElementById('sellerCardName');
    const verified = document.getElementById('sellerCardVerified');
    const rating = document.getElementById('sellerCardRating');
    const reviews = document.getElementById('sellerCardReviews');
    const chatAvatar = document.getElementById('providerChatAvatar');
    const chatName = document.getElementById('chatProviderName');

    if (avatar) { avatar.src = p.seller.avatar; avatar.alt = p.seller.name; }
    if (name) name.textContent = p.seller.name;
    if (verified) verified.style.display = p.seller.verified ? '' : 'none';
    if (rating) rating.textContent = p.rating ?? '4.8';
    if (reviews) reviews.textContent = (p.reviewCount ?? 0).toLocaleString('es-AR');
    if (chatAvatar) { chatAvatar.src = p.seller.avatar; chatAvatar.alt = p.seller.name; }
    if (chatName) chatName.textContent = p.seller.name;
    const sold = document.getElementById('sellerCardSold');
    if (sold && p.salesCount) sold.textContent = `${p.salesCount.toLocaleString('es-AR')} ventas`;
    const proBadge = document.getElementById('sellerCardProBadge');
    if (proBadge) proBadge.style.display = p.seller.pro ? '' : 'none';
    const subtitle = document.getElementById('sellerProductsSubtitle');
    if (subtitle) subtitle.innerHTML = `Otros productos que ofrece <strong class="provider-name-text">${p.seller.name}</strong>`;

    const badge = document.getElementById('chatFloatBadge');
    if (badge) badge.style.display = 'flex';
  }

  // ── Chat flotante ─────────────────────────────────────────────────────────
  setupChat() {
    const p = this.currentProduct;
    if (!p) return;

    const sellerName = p.seller?.name || 'Vendedor';

    // Mensajes iniciales
    const initial = [
      { from: 'provider', text: `¡Hola! Soy ${sellerName}. Estoy disponible para responder tus preguntas sobre ${p.title}.`, time: this._chatTimeAgo(30) },
      { from: 'provider', text: 'Podés preguntarme sobre el estado, envío o cualquier detalle del producto.', time: this._chatTimeAgo(29) },
    ];
    initial.forEach(m => this._addChatMessage(m.from, m.text, m.time));

    const chatInput    = document.getElementById('chatInput');
    const sendBtn      = document.getElementById('chatSendBtn');
    const attachBtn    = document.getElementById('chatAttachBtn');
    const fileInput    = document.getElementById('chatFileInput');
    const emojiBtn     = document.getElementById('chatEmojiBtn');
    const emojiPicker  = document.getElementById('chatEmojiPicker');
    const attachPreview= document.getElementById('chatAttachPreview');
    let pendingFile = null;

    const updateSendBtn = () => { if (sendBtn) sendBtn.disabled = !chatInput?.value.trim() && !pendingFile; };

    const showTyping = () => {
      const el = document.createElement('div');
      el.className = 'chat-message received chat-typing-indicator';
      el.innerHTML = `<div class="chat-bubble chat-typing-bubble"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div>`;
      const msgs = document.getElementById('chatMessages');
      msgs?.appendChild(el);
      if (msgs) msgs.scrollTop = msgs.scrollHeight;
      return el;
    };

    const hideTyping = (el) => el?.remove();

    const animateStatus = (msgEl) => {
      const s = msgEl?.querySelector('.chat-msg-status');
      if (!s) return;
      setTimeout(() => { s.textContent = 'Entregado'; s.className = 'chat-msg-status chat-status-delivered'; }, 800);
      setTimeout(() => { s.textContent = 'Leído'; s.className = 'chat-msg-status chat-status-read'; }, 2500);
    };

    const sendMessage = () => {
      const text = chatInput?.value.trim();
      if (!text && !pendingFile) return;
      let msgEl = null;
      if (pendingFile) {
        msgEl = this._addChatFile('user', pendingFile);
        pendingFile = null;
        if (attachPreview) attachPreview.style.display = 'none';
      }
      if (text) {
        msgEl = this._addChatMessage('user', text);
        chatInput.value = '';
        chatInput.style.height = 'auto';
      }
      updateSendBtn();
      if (emojiPicker) emojiPicker.style.display = 'none';
      animateStatus(msgEl);
      const typingEl = showTyping();
      setTimeout(() => {
        hideTyping(typingEl);
        const responses = [
          '¡Gracias por tu consulta! Te respondo enseguida.',
          'Claro, el producto está disponible y puedo enviarlo hoy.',
          'Hola, sí! Está en perfectas condiciones. ¿Tenés alguna pregunta más?',
          'Por supuesto, el envío es gratis a todo el país.',
          'Sí, acepto pagos con tarjeta y transferencia. ¿Necesitás más info?',
        ];
        this._addChatMessage('provider', responses[Math.floor(Math.random() * responses.length)]);
      }, 1200 + Math.random() * 800);
    };

    sendBtn?.addEventListener('click', sendMessage);
    chatInput?.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } });
    chatInput?.addEventListener('input', () => {
      updateSendBtn();
      chatInput.style.height = 'auto';
      chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
    });

    attachBtn?.addEventListener('click', () => { if (emojiPicker) emojiPicker.style.display = 'none'; fileInput?.click(); });

    fileInput?.addEventListener('change', () => {
      const file = fileInput.files[0];
      if (!file) return;
      pendingFile = file;
      fileInput.value = '';
      if (attachPreview) {
        attachPreview.style.display = 'flex';
        const isImage = file.type.startsWith('image/');
        if (isImage) {
          const reader = new FileReader();
          reader.onload = e => {
            attachPreview.innerHTML = `<img src="${e.target.result}" class="chat-attach-thumb" /><span class="chat-attach-name">${file.name}</span><button class="chat-attach-remove" id="chatAttachRemove"><i class="bi bi-x"></i></button>`;
            document.getElementById('chatAttachRemove')?.addEventListener('click', () => { pendingFile = null; attachPreview.style.display = 'none'; updateSendBtn(); });
          };
          reader.readAsDataURL(file);
        } else {
          attachPreview.innerHTML = `<i class="bi bi-file-earmark-text chat-attach-file-icon"></i><span class="chat-attach-name">${file.name}</span><button class="chat-attach-remove" id="chatAttachRemove"><i class="bi bi-x"></i></button>`;
          document.getElementById('chatAttachRemove')?.addEventListener('click', () => { pendingFile = null; attachPreview.style.display = 'none'; updateSendBtn(); });
        }
      }
      updateSendBtn();
    });

    const EMOJIS = ['😀','😂','😊','😍','🥰','😎','🤩','😅','😭','😤','👍','👎','👏','🙌','🤝','💪','🙏','❤️','🔥','⭐','✅','❌','📷','📎','💬','📞','🏠','🔧','⚡','🎉','🚀','💡','📋','🗓️','💰','🏆','🛍️','📦','🔑','🎁'];
    if (emojiPicker) {
      emojiPicker.innerHTML = EMOJIS.map(e => `<button class="emoji-item" type="button">${e}</button>`).join('');
      emojiPicker.querySelectorAll('.emoji-item').forEach(btn => {
        btn.addEventListener('click', () => {
          if (!chatInput) return;
          const pos = chatInput.selectionStart ?? chatInput.value.length;
          chatInput.value = chatInput.value.slice(0, pos) + btn.textContent + chatInput.value.slice(pos);
          chatInput.focus();
          chatInput.selectionStart = chatInput.selectionEnd = pos + btn.textContent.length;
          updateSendBtn();
        });
      });
    }
    emojiBtn?.addEventListener('click', e => { e.stopPropagation(); if (emojiPicker) emojiPicker.style.display = emojiPicker.style.display === 'none' ? 'grid' : 'none'; });
    document.addEventListener('click', e => { if (emojiPicker && !emojiPicker.contains(e.target) && e.target !== emojiBtn) emojiPicker.style.display = 'none'; });

    const panel        = document.getElementById('chatFloatPanel');
    const floatBtn     = document.getElementById('chatFloatBtn');
    const closeBtn     = document.getElementById('chatFloatClose');
    const badge        = document.getElementById('chatFloatBadge');
    const backBtn      = document.getElementById('chatBackBtn');
    const listView     = document.getElementById('chatListView');
    const convView     = document.getElementById('chatConversationView');
    const listClose    = document.getElementById('chatListClose');

    const openChat = () => {
      panel?.classList.add('chat-float-open');
      if (badge) badge.style.display = 'none';
      if (listView) listView.style.display = 'none';
      if (convView) convView.style.display = 'flex';
      setTimeout(() => chatInput?.focus(), 250);
    };
    const closeChat = () => { panel?.classList.remove('chat-float-open'); if (emojiPicker) emojiPicker.style.display = 'none'; };
    const showChatList = () => {
      if (emojiPicker) emojiPicker.style.display = 'none';
      if (listView) listView.style.display = 'flex';
      if (convView) convView.style.display = 'none';
      this._renderChatList();
    };
    const showConversation = () => { if (listView) listView.style.display = 'none'; if (convView) convView.style.display = 'flex'; setTimeout(() => chatInput?.focus(), 150); };

    floatBtn?.addEventListener('click', () => panel?.classList.contains('chat-float-open') ? closeChat() : openChat());
    closeBtn?.addEventListener('click', closeChat);
    listClose?.addEventListener('click', closeChat);
    backBtn?.addEventListener('click', showChatList);
    document.getElementById('contactSellerBtn')?.addEventListener('click', openChat);
    this._showConversation = showConversation;
  }

  _renderChatList() {
    const listBody = document.getElementById('chatListBody');
    if (!listBody) return;
    const p = this.currentProduct;
    const contacts = [
      { name: p?.seller?.name || 'Vendedor', avatar: p?.seller?.avatar || '', preview: 'Podés preguntarme sobre el estado, envío o cualquier detalle…', time: 'Ahora', unread: 0, online: true },
    ];
    listBody.innerHTML = contacts.map(c => `
      <div class="chat-list-item">
        <div class="chat-list-avatar-wrap">
          <img src="${c.avatar}" alt="${c.name}" class="chat-list-avatar" />
          ${c.online ? '<span class="chat-list-online"></span>' : ''}
        </div>
        <div class="chat-list-info">
          <div class="chat-list-name">${c.name}</div>
          <div class="chat-list-preview">${c.preview}</div>
        </div>
        <div class="chat-list-meta">
          <span class="chat-list-time">${c.time}</span>
          ${c.unread > 0 ? `<span class="chat-list-unread">${c.unread}</span>` : ''}
        </div>
      </div>
    `).join('');
    listBody.querySelectorAll('.chat-list-item').forEach(item => {
      item.addEventListener('click', () => { if (this._showConversation) this._showConversation(); });
    });
  }

  _addChatMessage(from, text, time = null) {
    const msgs = document.getElementById('chatMessages');
    if (!msgs) return null;
    const isProvider = from === 'provider';
    const timeStr = time || this._chatTimeNow();
    const senderName = isProvider ? (this.currentProduct?.seller?.name || 'Vendedor') : 'Vos';
    const msgEl = document.createElement('div');
    msgEl.className = `chat-message ${isProvider ? 'received' : 'sent'}`;
    msgEl.innerHTML = `
      ${isProvider ? `<div class="chat-sender-name">${senderName}</div>` : ''}
      <div class="chat-bubble">${this._escapeHtml(text)}</div>
      <div class="chat-time">${timeStr}${!isProvider ? ' <span class="chat-msg-status chat-status-sent">Enviado</span>' : ''}</div>
    `;
    msgs.appendChild(msgEl);
    msgs.scrollTop = msgs.scrollHeight;
    this.chatMessages.push({ from, text, time: timeStr });
    return msgEl;
  }

  _addChatFile(from, file) {
    const msgs = document.getElementById('chatMessages');
    if (!msgs) return null;
    const isProvider = from === 'provider';
    const timeStr = this._chatTimeNow();
    const statusHTML = !isProvider ? '<span class="chat-msg-status chat-status-sent">Enviado</span>' : '';
    const msgEl = document.createElement('div');
    msgEl.className = `chat-message ${isProvider ? 'received' : 'sent'}`;
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = e => {
        msgEl.innerHTML = `<div class="chat-bubble chat-bubble-image"><img src="${e.target.result}" class="chat-img-preview" alt="${file.name}" /></div><div class="chat-time">${timeStr} ${statusHTML}</div>`;
        msgs.scrollTop = msgs.scrollHeight;
      };
      reader.readAsDataURL(file);
    } else {
      msgEl.innerHTML = `<div class="chat-bubble chat-bubble-file"><i class="bi bi-file-earmark-text"></i><span>${file.name}</span></div><div class="chat-time">${timeStr} ${statusHTML}</div>`;
    }
    msgs.appendChild(msgEl);
    msgs.scrollTop = msgs.scrollHeight;
    return msgEl;
  }

  _chatTimeAgo(minutesAgo) { const d = new Date(Date.now() - minutesAgo * 60 * 1000); return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }); }
  _chatTimeNow() { return new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }); }
  _escapeHtml(text) { const d = document.createElement('div'); d.appendChild(document.createTextNode(text)); return d.innerHTML; }
}

// ── Bootstrap ────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  new ProductPage();

  const notificationBtn = document.getElementById('notificationBtn');
  if (notificationBtn) {
    notificationBtn.addEventListener('shown.bs.dropdown', () => {
      if (window.notificationManager) window.notificationManager.renderNotifications();
    });
  }

  setTimeout(() => {
    if (window.favoritesManager) window.favoritesManager.updateWishlistButton();
  }, 300);

  // Keyboard accessibility for thumbnails (Enter/Space triggers click)
  document.querySelectorAll('.thumbnail[role="button"]').forEach(thumb => {
    thumb.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        thumb.click();
      }
    });
  });
});
