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
    // Iniciamos la carga asíncrona del producto y configuramos el resto cuando esté listo
    this.loadProductDataAsync().then(found => {
      if (!found) return;
      this.setupEventListeners();
      this.setupImageGallery();
      this.updatePrice();
      this.updateFavoriteButton();
      this.loadSimilarProducts();
      this.loadRecentlyViewed();
      this.saveToRecentlyViewed();
      this.loadAndRenderReviews();
    });
  }

  // ── ID resolution: URL param → localStorage → fallback 1 ──────────────────
  async loadProductDataAsync() {
    const params = new URLSearchParams(window.location.search);
    const paramId = params.get('id');
    const storedId = localStorage.getItem('selectedProductId');
    const productId = parseInt(paramId || storedId) || 1;

    if (paramId) {
      localStorage.setItem('selectedProductId', paramId);
    }

    // 1. Intentar obtener desde la API real
    let productData = null;
    if (window.DaleDeal?.api?.fetchProductById) {
      productData = await window.DaleDeal.api.fetchProductById(productId);
    }

    // 2. Fallback: buscar en el cache local (product-data.js)
    if (!productData && window.getProductById) {
      productData = window.getProductById(productId);
    }

    if (!productData) {
      DaleDeal.error('Product not found:', productId);
      if (window.DaleDeal?.utils?.showNotification) {
        DaleDeal.utils.showNotification(
          `Producto #${productId} no encontrado. Redirigiendo al inicio…`,
          'error'
        );
      }
      setTimeout(() => { window.location.href = '../index.html'; }, 2000);
      return false;
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
      images: productData.images,
      seller_id:     productData.seller_id,
      seller_name:   productData.seller_name,
      seller_avatar: productData.seller_avatar,
      seller_location: productData.location,
      // Campos de envío (vienen del backend tras la migración 003)
      shipping_required: !!productData.shipping_required,
      offers_delivery:   !!productData.offers_delivery,
      offers_pickup:     !!productData.offers_pickup,
      shipping_cost:     productData.shipping_cost != null ? parseFloat(productData.shipping_cost) : null,
      pickup_address:    productData.pickup_address || null,
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
    return true;
  }

  // ── Alias para compatibilidad hacia atrás ──────────────────────────────────
  loadProductData() {
    // Método sincrónico mantenido para compatibilidad
    // La lógica real está en loadProductDataAsync()
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
    // Si subcategory está vacío o es solo un slug de category (ej: category
    // "Electrónica" + subcategory "electronica"), ocultamos el nivel de
    // subcategoría para no mostrar duplicados en la UI.
    const bcCat = document.querySelector('#bcCategory a');
    const bcSubItem = document.getElementById('bcSubcategory');
    const bcSub = document.querySelector('#bcSubcategory a');
    const bcSubSep = bcSubItem?.previousElementSibling;
    const bcActive = document.getElementById('bcProductTitle');
    if (bcCat) bcCat.textContent = p.category;

    // Normaliza para comparar sin tildes: "Electrónica" === "electronica"
    const normalize = (s) => (s || '').toString().toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '');
    const subIsRedundant = !p.subcategory ||
      normalize(p.subcategory) === normalize(p.category);

    if (subIsRedundant) {
      if (bcSubItem) bcSubItem.style.display = 'none';
      if (bcSubSep && bcSubSep.classList.contains('breadcrumb-separator')) {
        bcSubSep.style.display = 'none';
      }
    } else if (bcSub) {
      bcSub.textContent = p.subcategory;
    }

    if (bcActive) bcActive.textContent = p.title;

    // SEO — dynamic title + meta tags + Open Graph + Twitter + JSON-LD
    this.updateSEOMeta(p);

    // Rating real (cuando no hay reviews todavía, mostramos un texto neutral
    // en lugar de "0 (0 reseñas)" que se ve roto)
    const ratingText = document.querySelector('.rating-text');
    if (ratingText) {
      ratingText.textContent = p.reviewCount > 0
        ? `${p.rating.toFixed(1)} (${p.reviewCount.toLocaleString('es-AR')} reseña${p.reviewCount === 1 ? '' : 's'})`
        : 'Sin reseñas aún';
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

    // Reviews tab — actualización inicial. La data real la trae loadAndRenderReviews()
    // y reemplaza el contenido entero del tab. Acá solo seteamos lo básico para
    // que no se vea rara la pantalla mientras carga.
    const overallRatingEl = document.querySelector('.overall-rating .rating-number');
    if (overallRatingEl) overallRatingEl.textContent = p.rating ? p.rating.toFixed(1) : '—';
    const reviewCountEl = document.querySelector('.overall-rating .rating-count');
    if (reviewCountEl) reviewCountEl.textContent = `${p.reviewCount.toLocaleString('es-AR')} reseña${p.reviewCount === 1 ? '' : 's'}`;
    const reviewStarsEl = document.querySelector('.overall-rating .rating-stars');
    if (reviewStarsEl) reviewStarsEl.innerHTML = this.renderProductStars(p.rating);

    // Seller card
    this.updateSellerCard();

    // Shipping info block
    this.updateShippingInfoBlock();
  }

  // ── SEO: actualiza title, meta description, OG, Twitter, JSON-LD ─────────
  updateSEOMeta(p) {
    const SITE = 'https://daledeal.com.ar';
    const url  = `${SITE}/HTML/producto.html?id=${p.id}`;
    const img  = p.images?.main || `${SITE}/IMG/LOGO-2.png`;
    const previewDesc = (p.description || '').length > 160
      ? (p.description || '').substring(0, 160) + '…'
      : (p.description || '');
    const fullDesc = previewDesc
      ? `${previewDesc} Compralo en Dale Deal con cuotas sin interés y envío a todo el país.`
      : `${p.title} disponible en Dale Deal. Marketplace argentino de productos y servicios.`;
    const titleSEO = `${p.title} | DALE DEAL`;

    document.title = titleSEO;

    const setMeta = (sel, attr, value) => {
      const el = document.querySelector(sel);
      if (el && value != null) el.setAttribute(attr, value);
    };

    setMeta('meta[name="description"]',  'content', fullDesc);
    setMeta('meta[name="keywords"]',     'content',
      [p.title, p.category, p.subcategory, 'comprar', 'Argentina', 'marketplace', 'Dale Deal']
        .filter(Boolean).join(', ')
    );

    // Open Graph
    setMeta('#ogTitle',         'content', titleSEO);
    setMeta('#ogDescription',   'content', fullDesc);
    setMeta('#ogUrl',           'content', url);
    setMeta('#ogImage',         'content', img);
    setMeta('#ogPriceAmount',   'content', String(p.basePrice || 0));

    // Twitter
    setMeta('#twTitle',         'content', titleSEO);
    setMeta('#twDescription',   'content', fullDesc);
    setMeta('#twImage',         'content', img);

    // Canonical
    const canon = document.getElementById('canonicalLink');
    if (canon) canon.setAttribute('href', url);

    // JSON-LD Schema.org
    this.updateJsonLd(p, url, img, fullDesc);
  }

  updateJsonLd(p, url, img, description) {
    const script = document.getElementById('productSchema');
    if (!script) return;

    const data = {
      '@context':    'https://schema.org',
      '@type':       'Product',
      name:          p.title,
      description:   description,
      image:         img,
      sku:           `daledeal-${p.id}`,
      brand:         { '@type': 'Brand', name: p.category || 'Dale Deal' },
      offers: {
        '@type':         'Offer',
        url:             url,
        priceCurrency:   'ARS',
        price:           p.basePrice,
        availability:    p.stock > 0
                           ? 'https://schema.org/InStock'
                           : 'https://schema.org/OutOfStock',
        itemCondition:   p.condition === 'new'
                           ? 'https://schema.org/NewCondition'
                           : 'https://schema.org/UsedCondition',
        seller:          { '@type': 'Organization', name: p.seller_name || 'Dale Deal' },
      },
    };

    if (p.reviewCount > 0 && p.rating) {
      data.aggregateRating = {
        '@type':      'AggregateRating',
        ratingValue:  p.rating,
        reviewCount:  p.reviewCount,
      };
    }

    try {
      script.textContent = JSON.stringify(data, null, 2);
    } catch (_) { /* silencioso */ }
  }

  // ── Render del bloque de info de envío en la página ──────────────────────
  updateShippingInfoBlock() {
    const p = this.currentProduct;
    // Eliminar bloque anterior si existía
    document.getElementById('product-shipping-info')?.remove();

    // Si no requiere envío, no mostramos nada
    if (!p.shipping_required) return;

    const lines = [];
    if (p.offers_delivery) {
      const cost = (p.shipping_cost == null || p.shipping_cost === 0)
        ? '<span class="text-success fw-bold">Envío gratis</span>'
        : `Envío a domicilio: <strong>${this.formatPrice(p.shipping_cost)}</strong>`;
      lines.push(`<div><i class="bi bi-truck me-2"></i>${cost}</div>`);
    }
    if (p.offers_pickup) {
      lines.push(`
        <div class="mt-1">
          <i class="bi bi-geo-alt me-2"></i>
          Retiro en persona disponible
          ${p.pickup_address ? `<span class="text-muted">· ${p.pickup_address}</span>` : ''}
        </div>
      `);
    }

    if (!lines.length) return;

    const html = `
      <div id="product-shipping-info" class="mt-3 p-3 rounded"
           style="background: var(--gray-50); color: var(--gray-700); border-left: 4px solid var(--primary-red);">
        ${lines.join('')}
      </div>
    `;

    // Insertar después del bloque de precio/cuotas
    const installmentsEl = document.querySelector('.installments');
    const anchor = installmentsEl?.parentElement || document.querySelector('.product-pricing-wrapper') || document.querySelector('.product-info');
    if (anchor) {
      anchor.insertAdjacentHTML('afterend', html);
    }
  }

  // ── Seller card ────────────────────────────────────────────────────────────
  updateSellerCard() {
    const p = this.currentProduct;
    if (!p.seller_id) return;

    const avatar   = document.getElementById('sellerCardAvatar');
    const name     = document.getElementById('sellerCardName');
    const sold     = document.getElementById('sellerCardSold');
    const location = document.querySelector('.provider-location span:last-child');
    const chatAvatar = document.getElementById('providerChatAvatar');
    const chatName   = document.getElementById('chatProviderName');

    if (avatar) {
      const sellerName = encodeURIComponent(p.seller_name || 'Vendedor');
      avatar.src = p.seller_avatar || `https://ui-avatars.com/api/?name=${sellerName}&background=D63031&color=fff&size=128`;
      avatar.alt = p.seller_name || 'Vendedor';
    }
    if (name)     name.textContent = p.seller_name || 'Vendedor';
    if (sold)     sold.textContent = `${p.stock > 0 ? 'En stock' : 'Sin stock'}`;
    if (location) location.textContent = p.location || 'Argentina';

    // Rating real del vendedor (todos sus productos sumados)
    this.loadSellerRating(p.seller_id);

    // Sincronizar con el chat flotante
    if (chatAvatar) chatAvatar.src = avatar?.src || '';
    if (chatName)   chatName.textContent = p.seller_name || 'Soporte Dale Deal';

    // Mostrar sección de otros productos del vendedor
    this.loadSellerProducts(p.seller_id);
  }

  // ── Rating real del vendedor (suma de todas sus reseñas) ──────────────────
  async loadSellerRating(sellerId) {
    if (!sellerId || !window.DaleDeal?.api?.fetchUserReviews) return;
    try {
      const res = await window.DaleDeal.api.fetchUserReviews(sellerId, { limit: 1 });
      const stats = res?.stats || {};
      const total = parseInt(stats.total_reviews || 0);
      const avg   = parseFloat(stats.avg_rating || 0);

      const ratingEl  = document.getElementById('sellerCardRating');
      const reviewsEl = document.getElementById('sellerCardReviews');
      const ratingText = document.querySelector('.provider-rating .rating-text');

      if (total === 0) {
        // Vendedor todavía sin reseñas — texto neutral en lugar de "0 (0 reseñas)"
        if (ratingEl) ratingEl.textContent = '—';
        if (reviewsEl) reviewsEl.textContent = '0';
        if (ratingText) ratingText.textContent = 'Vendedor nuevo · sin reseñas aún';
      } else {
        if (ratingEl) ratingEl.textContent = avg.toFixed(1);
        if (reviewsEl) reviewsEl.textContent = total.toLocaleString('es-AR');
        if (ratingText) {
          ratingText.textContent = `${avg.toFixed(1)} (${total.toLocaleString('es-AR')} reseña${total === 1 ? '' : 's'})`;
        }
      }
    } catch (err) {
      DaleDeal.warn('No se pudo cargar rating del vendedor:', err.message);
    }
  }

  // ── Otros productos del mismo vendedor ────────────────────────────────────
  async loadSellerProducts(sellerId) {
    const section  = document.getElementById('sellerProductsSection');
    const grid     = document.getElementById('sellerProductsGrid');
    const subtitle = document.getElementById('sellerProductsSubtitle');
    if (!section || !grid) return;

    let others = [];

    // 1. Intentar API
    try {
      if (window.DaleDeal?.api?.fetchProducts) {
        const all = await window.DaleDeal.api.fetchProducts({ seller_id: sellerId });
        others = all.filter(p => p.id !== this.currentProduct.id).slice(0, 6);
      }
    } catch (_) {}

    // 2. Fallback local: misma categoría
    if (others.length === 0 && window.PRODUCTS_DATA) {
      others = Object.values(window.PRODUCTS_DATA)
        .filter(p => p.id !== this.currentProduct.id && p.category === this.currentProduct.category)
        .slice(0, 6);
    }

    if (others.length === 0) return;

    if (subtitle) subtitle.textContent = `Otros productos de ${this.currentProduct.seller_name || 'este vendedor'}`;

    // Escape de title (input usuario) + cast de id a número para evitar
    // injection en el onclick. Mejor sería event delegation con data-id,
    // pero acá voy por el fix mínimo.
    const esc = (s) => (window.DaleDeal?.utils?.escapeHtml ? DaleDeal.utils.escapeHtml(s) : String(s ?? ''));
    grid.innerHTML = others.map(prod => {
      const pid = Number(prod.id) || 0;
      const titleSafe = esc(prod.title);
      const imgSrc    = String(prod.images?.main || prod.image || '').replace(/['"<>]/g, '');
      return `
        <div class="product-card-mini" onclick="location.href='producto.html?id=${pid}'" style="cursor:pointer;">
          <img src="${imgSrc}" alt="${titleSafe}" loading="lazy" style="width:100%;height:140px;object-fit:cover;border-radius:8px;">
          <p style="margin:8px 0 4px;font-size:13px;font-weight:600;">${titleSafe}</p>
          <p style="color:var(--primary-red);font-weight:700;">$${(prod.price || prod.basePrice || 0).toLocaleString('es-AR')}</p>
        </div>
      `;
    }).join('');

    section.style.display = '';
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
    const esc = (s) => (window.DaleDeal?.utils?.escapeHtml ? DaleDeal.utils.escapeHtml(s) : String(s ?? ''));
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
      // 'key' viene de Object.keys(producto.storage) → string controlado por
      // el vendedor en la DB. Escapar antes de innerHTML evita XSS si alguien
      // pone una key tipo <img onerror=...>.
      div.innerHTML = `${esc(key)}<span class="extra-cost">${priceText}</span>`;
      container.appendChild(div);
    });
    // selectedStorage already set in loadProductData
  }

  // ── Description tab — plain text del vendedor ────────────────────────────
  updateDescriptionTab() {
    const descContent = document.querySelector('.description-content');
    if (!descContent) return;

    const p = document.createElement('p');
    p.id = 'product-description-text';
    p.style.whiteSpace = 'pre-line';
    p.style.lineHeight = '1.8';
    p.textContent = this.currentProduct.description || '';

    descContent.innerHTML = '';
    descContent.appendChild(p);
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

    // Chequear sesión antes de cualquier modal
    if (!localStorage.getItem('daledeal_token')) {
      this.showNotification('Tenés que iniciar sesión para comprar.', 'warning');
      setTimeout(() => { window.location.href = './login.html'; }, 1500);
      return;
    }

    const productId = this.currentProduct?.id;
    if (!productId) {
      this.showNotification('Producto inválido', 'error');
      return;
    }

    // Si el producto requiere logística → mostramos modal de checkout
    // ANTES de redirigir a MP, así el comprador elige método y dirección.
    if (this.currentProduct.shipping_required) {
      this.openShippingCheckout();
      return;
    }

    // Sin envío → flujo directo
    this.setButtonLoading(button, true);
    try {
      const payments = window.DaleDeal?.payments;
      if (payments?.buyProductNow) {
        this.showNotification('Redirigiendo a Mercado Pago…', 'info');
        await payments.buyProductNow({
          product_id: productId,
          quantity:   this.quantity || 1,
        });
        return; // redirige
      }

      // Fallback legacy
      const apiFetch = window.DaleDeal?.api?.apiFetch;
      if (!apiFetch) throw new Error('API no disponible');
      const res = await apiFetch('/orders', {
        method: 'POST',
        body: JSON.stringify({ product_id: productId, quantity: this.quantity || 1 }),
      });
      this.showNotification('¡Compra realizada! Abriendo chat con el vendedor…', 'success');
      const convId = res?.conversation?.id;
      if (convId && window.DaleDeal?.chat) {
        setTimeout(() => window.DaleDeal.chat.openConversation(convId), 800);
      }
    } catch (err) {
      DaleDeal.error('Error en compra:', err);
      this.showNotification(err.message || 'Error al procesar la compra', 'error');
    } finally {
      this.setButtonLoading(button, false);
    }
  }

  // ── Modal de checkout (envío + retiro) ────────────────────────────────────
  openShippingCheckout() {
    const p = this.currentProduct;
    const subtotal = this.calculateUnitPrice() * (this.quantity || 1);

    // Determinar método inicial: si solo ofrece uno, lo elegimos solo;
    // si ofrece ambos, arrancamos con delivery por default.
    let defaultMethod;
    if (p.offers_delivery && p.offers_pickup) defaultMethod = 'delivery';
    else if (p.offers_delivery) defaultMethod = 'delivery';
    else if (p.offers_pickup)   defaultMethod = 'pickup';
    else {
      // El vendedor activó shipping_required pero no eligió métodos.
      this.showNotification('Este producto no tiene métodos de entrega configurados. Contactá al vendedor.', 'error');
      return;
    }

    // Construir el modal
    const modalHTML = `
      <div class="modal fade" id="shippingCheckoutModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title"><i class="bi bi-truck me-2"></i>Confirmar entrega</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
            </div>
            <div class="modal-body">

              <!-- Selector de método (solo si ofrece ambos) -->
              ${(p.offers_delivery && p.offers_pickup) ? `
                <div class="mb-3">
                  <label class="form-label fw-semibold">Método de entrega</label>
                  <div class="btn-group w-100" role="group">
                    <input type="radio" class="btn-check" name="ship-method" id="ship-method-delivery" value="delivery" checked>
                    <label class="btn btn-outline-primary" for="ship-method-delivery">
                      <i class="bi bi-box-seam me-1"></i> Envío a domicilio
                    </label>
                    <input type="radio" class="btn-check" name="ship-method" id="ship-method-pickup" value="pickup">
                    <label class="btn btn-outline-primary" for="ship-method-pickup">
                      <i class="bi bi-geo-alt me-1"></i> Retiro en persona
                    </label>
                  </div>
                </div>
              ` : ''}

              <!-- Bloque de retiro -->
              <div id="ship-pickup-block" style="${defaultMethod === 'pickup' ? '' : 'display:none;'}">
                <div class="alert alert-info mb-0">
                  <strong><i class="bi bi-geo-alt me-1"></i>Retiro en persona</strong>
                  <div class="mt-2 small">${p.pickup_address || 'Coordinar con el vendedor por chat'}</div>
                  <hr class="my-2">
                  <div class="small text-muted">El vendedor te va a contactar para coordinar día y hora.</div>
                </div>
              </div>

              <!-- Bloque de envío -->
              <div id="ship-delivery-block" style="${defaultMethod === 'delivery' ? '' : 'display:none;'}">
                <div class="row g-2">
                  <div class="col-12">
                    <label class="form-label small">Nombre completo del destinatario *</label>
                    <input type="text" class="form-control form-control-sm" id="ship-recipient" maxlength="150" />
                  </div>
                  <div class="col-12">
                    <label class="form-label small">Teléfono de contacto *</label>
                    <input type="tel" class="form-control form-control-sm" id="ship-phone" placeholder="11 1234-5678" maxlength="30" />
                  </div>
                  <div class="col-12">
                    <label class="form-label small">Calle y número *</label>
                    <input type="text" class="form-control form-control-sm" id="ship-street" placeholder="Av. Corrientes 1234, depto 5B" maxlength="255" />
                  </div>
                  <div class="col-7">
                    <label class="form-label small">Ciudad *</label>
                    <input type="text" class="form-control form-control-sm" id="ship-city" maxlength="100" />
                  </div>
                  <div class="col-5">
                    <label class="form-label small">CP</label>
                    <input type="text" class="form-control form-control-sm" id="ship-zip" maxlength="20" />
                  </div>
                  <div class="col-12">
                    <label class="form-label small">Provincia *</label>
                    <input type="text" class="form-control form-control-sm" id="ship-province" placeholder="Ej: Buenos Aires" maxlength="100" />
                  </div>
                  <div class="col-12">
                    <label class="form-label small">Notas para el envío (opcional)</label>
                    <textarea class="form-control form-control-sm" id="ship-notes" rows="2" maxlength="500"
                              placeholder="Ej: dejar con encargado, timbre roto, etc."></textarea>
                  </div>
                </div>
              </div>

              <!-- Resumen de precios -->
              <hr>
              <div class="d-flex justify-content-between small">
                <span>Producto (×${this.quantity || 1})</span>
                <span>${this.formatPrice(subtotal)}</span>
              </div>
              <div class="d-flex justify-content-between small mt-1">
                <span>Envío</span>
                <span id="ship-cost-display">
                  ${defaultMethod === 'delivery' ? this.formatPrice(p.shipping_cost || 0) : 'Sin costo'}
                </span>
              </div>
              <div class="d-flex justify-content-between fw-bold mt-2">
                <span>Total</span>
                <span id="ship-total-display">
                  ${this.formatPrice(subtotal + (defaultMethod === 'delivery' ? (p.shipping_cost || 0) : 0))}
                </span>
              </div>

              <div id="ship-error" class="alert alert-danger mt-3 d-none small mb-0"></div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="button" class="btn btn-primary" id="ship-confirm-btn">
                <i class="bi bi-credit-card me-1"></i> Pagar con Mercado Pago
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Insertar (o reemplazar) en el DOM
    document.getElementById('shippingCheckoutModal')?.remove();
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    const modalEl = document.getElementById('shippingCheckoutModal');
    const modal   = new bootstrap.Modal(modalEl);

    // Cambio de método (solo si ofrece ambos)
    modalEl.querySelectorAll('input[name="ship-method"]').forEach(input => {
      input.addEventListener('change', () => {
        const method = input.value;
        document.getElementById('ship-delivery-block').style.display = method === 'delivery' ? '' : 'none';
        document.getElementById('ship-pickup-block').style.display   = method === 'pickup'   ? '' : 'none';
        const cost = method === 'delivery' ? (p.shipping_cost || 0) : 0;
        document.getElementById('ship-cost-display').textContent =
          method === 'delivery' ? this.formatPrice(cost) : 'Sin costo';
        document.getElementById('ship-total-display').textContent = this.formatPrice(subtotal + cost);
      });
    });

    // Confirmar y pagar
    document.getElementById('ship-confirm-btn').addEventListener('click', async () => {
      await this.confirmShippingAndPay(modalEl, modal, defaultMethod);
    });

    modal.show();
  }

  async confirmShippingAndPay(modalEl, modal, defaultMethod) {
    const p = this.currentProduct;
    const errorEl = document.getElementById('ship-error');
    errorEl.classList.add('d-none');

    // Determinar método elegido
    const chosen = modalEl.querySelector('input[name="ship-method"]:checked');
    const method = chosen ? chosen.value : defaultMethod;

    let shipping_address_obj = null;
    if (method === 'delivery') {
      const recipient_name = document.getElementById('ship-recipient').value.trim();
      const phone          = document.getElementById('ship-phone').value.trim();
      const street         = document.getElementById('ship-street').value.trim();
      const city           = document.getElementById('ship-city').value.trim();
      const province       = document.getElementById('ship-province').value.trim();
      const postal_code    = document.getElementById('ship-zip').value.trim();
      const notes          = document.getElementById('ship-notes').value.trim();

      const missing = [];
      if (!recipient_name) missing.push('nombre');
      if (!phone)          missing.push('teléfono');
      if (!street)         missing.push('calle');
      if (!city)           missing.push('ciudad');
      if (!province)       missing.push('provincia');
      if (missing.length) {
        errorEl.textContent = `Completá los datos obligatorios: ${missing.join(', ')}`;
        errorEl.classList.remove('d-none');
        return;
      }
      shipping_address_obj = { recipient_name, phone, street, city, province, postal_code, notes };
    }

    const btn = document.getElementById('ship-confirm-btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Redirigiendo…';

    try {
      const payments = window.DaleDeal?.payments;
      if (!payments?.buyProductNow) throw new Error('Pagos no disponibles');

      await payments.buyProductNow({
        product_id: p.id,
        quantity:   this.quantity || 1,
        shipping_method: method,
        shipping_address_obj,
      });
      // redirige a MP — no se llega acá
    } catch (err) {
      DaleDeal.error('Error confirmando envío:', err);
      errorEl.textContent = err.message || 'No se pudo procesar la compra. Intentá nuevamente.';
      errorEl.classList.remove('d-none');
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-credit-card me-1"></i> Pagar con Mercado Pago';
    }
  }

  // ── Favorites ──────────────────────────────────────────────────────────────
  updateFavoriteButton() {
    setTimeout(() => {
      if (window.favoritesManager) window.favoritesManager.updateWishlistButton();
    }, 150);
  }

  // ── Similar products ───────────────────────────────────────────────────────
  async loadSimilarProducts() {
    const similarGrid = document.getElementById('similarProductsGrid');
    if (!similarGrid || !this.currentProduct) return;

    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      const allProducts = window.getAllProducts ? window.getAllProducts() : [];
      let similar = allProducts
        .filter(p => p.category === this.currentProduct.category && p.id !== this.currentProduct.id)
        .slice(0, 4);

      if (similar.length === 0) {
        similar = allProducts
          .filter(p => p.id !== this.currentProduct.id)
          .sort(() => 0.5 - Math.random())
          .slice(0, 4);
        this.renderSimilarProducts(similar, true);
      } else {
        this.renderSimilarProducts(similar, false);
      }
    } catch (err) {
      DaleDeal.error('Error cargando similares:', err);
      similarGrid.innerHTML = `
        <div class="carousel-item active">
          <div class="text-center py-5">
            <i class="bi bi-exclamation-triangle display-4 text-warning mb-3"></i>
            <p class="text-muted">Error cargando productos similares</p>
          </div>
        </div>`;
    }
  }

  renderSimilarProducts(products, isRandom = false) {
    const similarGrid = document.getElementById('similarProductsGrid');
    if (!similarGrid) return;

    const pps = window.innerWidth < 768 ? 1 : window.innerWidth < 1024 ? 2 : 4;
    const slides = [];
    for (let i = 0; i < products.length; i += pps) {
      const batch = products.slice(i, i + pps);
      slides.push(`
        <div class="carousel-item ${i === 0 ? 'active' : ''}">
          <div class="row justify-content-center">
            ${batch.map(p => this.renderProductCard(p)).join('')}
          </div>
          ${isRandom && i === 0 ? `
            <div class="text-center mt-3">
              <small class="text-muted">
                <i class="bi bi-info-circle me-1"></i>
                Productos recomendados
              </small>
            </div>` : ''}
        </div>`);
    }
    similarGrid.innerHTML = slides.join('');
    this._toggleCarouselControls('similarProductsCarousel', slides.length);
    setTimeout(() => window.favoritesManager?.updateFavoriteButtons(), 100);
  }

  // ── Reviews: carga real desde el backend ──────────────────────────────────
  async loadAndRenderReviews() {
    const reviewsTab = document.querySelector('#reviews .reviews-content');
    if (!reviewsTab || !this.currentProduct?.id) return;

    try {
      const api = window.DaleDeal?.api;
      if (!api?.fetchReviews) return; // si la API no está cargada, dejamos el mock

      const res = await api.fetchReviews('product', this.currentProduct.id, { limit: 20 });
      const reviews = res?.data || [];
      const total   = res?.total || 0;
      const avg     = res?.avgRating || 0;

      this.renderReviewsTab(reviews, total, avg);

      // Si el usuario está logueado, chequear si puede dejar una review
      if (window.authManager?.isAuthenticated()) {
        await this.checkReviewEligibility();
      }
    } catch (err) {
      DaleDeal.warn('No se pudieron cargar reseñas:', err.message);
      // Si falla, dejamos el contenido mock como fallback
    }
  }

  renderReviewsTab(reviews, total, avg) {
    const reviewsTab = document.querySelector('#reviews .reviews-content');
    if (!reviewsTab) return;

    // Calcular breakdown por estrellas
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => { breakdown[r.rating] = (breakdown[r.rating] || 0) + 1; });
    const pct = (n) => total > 0 ? Math.round((n / total) * 100) : 0;

    const stars = (rating) => {
      let html = '';
      for (let i = 1; i <= 5; i++) {
        if (i <= rating)            html += '<i class="bi bi-star-fill" aria-hidden="true"></i>';
        else if (i - 0.5 <= rating) html += '<i class="bi bi-star-half" aria-hidden="true"></i>';
        else                         html += '<i class="bi bi-star" aria-hidden="true"></i>';
      }
      return html;
    };

    // Escape de los 5 chars HTML, no solo &<>. Necesario porque algunos lugares
    // (ej. alt="${escape(name)}") usan el escape en atributos, donde " y ' rompen.
    // Delegamos al helper global de utils.js cuando está disponible.
    const escape = (s) => (
      window.DaleDeal?.utils?.escapeHtml
        ? DaleDeal.utils.escapeHtml(String(s ?? ''))
        : String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;')
    );
    const fmtDate = (d) => {
      if (!d) return '';
      const date = new Date(d);
      const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
      if (days === 0) return 'Hoy';
      if (days === 1) return 'Ayer';
      if (days < 30) return `Hace ${days} días`;
      return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const reviewsHTML = reviews.length === 0
      ? `<div class="text-center py-5 text-muted">
           <i class="bi bi-chat-dots" style="font-size:3rem;opacity:.3;"></i>
           <p class="mt-3 mb-1 fw-semibold">Todavía no hay reseñas</p>
           <p class="small">Sé el primero en dejar una opinión sobre este producto.</p>
         </div>`
      : reviews.map(r => `
          <div class="review-item">
            <div class="review-header">
              <img src="${r.reviewer_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(r.reviewer_name || 'U')}&background=D63031&color=fff&size=48`}"
                   alt="${escape(r.reviewer_name)}"
                   class="review-avatar" loading="lazy" decoding="async" width="48" height="48" />
              <div class="review-info">
                <h6>${escape(r.reviewer_name || 'Comprador')}</h6>
                <div class="review-meta">
                  <div class="review-rating">${stars(r.rating)}</div>
                  <span class="review-date">${fmtDate(r.created_at)}</span>
                </div>
              </div>
            </div>
            ${(r.title || r.body) ? `
              <div class="review-content">
                ${r.title ? `<h6 class="review-title">${escape(r.title)}</h6>` : ''}
                ${r.body ? `<p class="review-text">${escape(r.body)}</p>` : ''}
              </div>
            ` : ''}
          </div>
        `).join('');

    reviewsTab.innerHTML = `
      <div class="reviews-summary">
        <div class="rating-overview">
          <div class="overall-rating">
            <span class="rating-number">${avg ? avg.toFixed(1) : '—'}</span>
            <div class="rating-stars" role="img" aria-label="${avg} de 5 estrellas">
              ${stars(avg)}
            </div>
            <div class="rating-count">${total.toLocaleString('es-AR')} reseñas</div>
          </div>
          <div class="rating-breakdown">
            ${[5, 4, 3, 2, 1].map(n => `
              <div class="rating-bar">
                <span>${n}</span>
                <div class="progress">
                  <div class="progress-bar" style="width: ${pct(breakdown[n])}%"></div>
                </div>
                <span>${pct(breakdown[n])}%</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <div id="review-cta-block"></div>

      <div id="reviews-list">
        ${reviewsHTML}
      </div>
    `;
  }

  // Verifica si el usuario actual puede dejar una review:
  //  - tiene una orden 'delivered' del producto
  //  - no ha reseñado todavía
  async checkReviewEligibility() {
    try {
      const api = window.DaleDeal?.api;
      if (!api?.apiFetch) return;

      const myOrders = await api.apiFetch('/orders/my?status=delivered&limit=50').catch(() => null);
      const ordered = (myOrders?.data || []).some(o =>
        o.product_id === this.currentProduct.id || o.product_title === this.currentProduct.title
      );
      if (!ordered) return;

      // Chequear si ya dejé una reseña
      const me   = window.authManager?.getCurrentUser();
      const list = await api.fetchReviews('product', this.currentProduct.id, { limit: 100 }).catch(() => null);
      const alreadyReviewed = (list?.data || []).some(r => r.reviewer_id === me?.id);

      const ctaBlock = document.getElementById('review-cta-block');
      if (!ctaBlock) return;

      if (alreadyReviewed) {
        ctaBlock.innerHTML = `
          <div class="alert alert-success small mb-3">
            <i class="bi bi-check-circle me-2"></i>
            Ya dejaste una reseña sobre este producto. ¡Gracias!
          </div>`;
      } else {
        ctaBlock.innerHTML = `
          <div class="d-flex justify-content-between align-items-center mb-3 p-3 rounded"
               style="background: var(--gray-50, #f9fafb); border: 1px dashed var(--gray-300, #d1d5db);">
            <div>
              <strong><i class="bi bi-pencil-square me-1"></i> ¿Compraste este producto?</strong>
              <div class="small text-muted">Compartí tu experiencia con otros compradores.</div>
            </div>
            <button class="btn btn-primary btn-sm" id="btn-leave-review">
              Dejar reseña
            </button>
          </div>`;
        document.getElementById('btn-leave-review')?.addEventListener('click', () => this.openReviewModal());
      }
    } catch (err) {
      DaleDeal.warn('No se pudo verificar elegibilidad de review:', err.message);
    }
  }

  // ── Modal para dejar una review ──────────────────────────────────────────
  openReviewModal() {
    const p = this.currentProduct;
    document.getElementById('reviewModal')?.remove();

    const html = `
      <div class="modal fade" id="reviewModal" tabindex="-1">
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title"><i class="bi bi-pencil-square me-2"></i>Reseñar producto</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <p class="small text-muted mb-3">${p.title}</p>

              <div class="mb-3">
                <label class="form-label fw-semibold">Tu calificación *</label>
                <div id="review-stars" style="font-size:2rem; cursor:pointer; color:#fbbf24;">
                  ${[1, 2, 3, 4, 5].map(n => `
                    <i class="bi bi-star" data-rating="${n}"></i>
                  `).join('')}
                </div>
                <div class="form-text small">Hacé click en las estrellas para calificar.</div>
              </div>

              <div class="mb-3">
                <label class="form-label fw-semibold">Título <span class="text-muted fw-normal">(opcional)</span></label>
                <input type="text" class="form-control" id="review-title" maxlength="150"
                       placeholder="Ej: Excelente calidad" />
              </div>

              <div class="mb-3">
                <label class="form-label fw-semibold">Comentario <span class="text-muted fw-normal">(opcional)</span></label>
                <textarea class="form-control" id="review-body" rows="4" maxlength="2000"
                          placeholder="Contá tu experiencia: cómo llegó, si cumple las expectativas, etc."></textarea>
              </div>

              <div id="review-error" class="alert alert-danger d-none small mb-0"></div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="button" class="btn btn-primary" id="review-submit">
                <i class="bi bi-send me-1"></i> Publicar reseña
              </button>
            </div>
          </div>
        </div>
      </div>`;
    document.body.insertAdjacentHTML('beforeend', html);

    let selectedRating = 0;
    const starsContainer = document.getElementById('review-stars');
    starsContainer.querySelectorAll('i').forEach(star => {
      const n = parseInt(star.dataset.rating);
      star.addEventListener('mouseenter', () => this.paintStars(starsContainer, n));
      star.addEventListener('click', () => {
        selectedRating = n;
        this.paintStars(starsContainer, n, true);
      });
    });
    starsContainer.addEventListener('mouseleave', () => this.paintStars(starsContainer, selectedRating, true));

    document.getElementById('review-submit').addEventListener('click', async () => {
      await this.submitReview(selectedRating);
    });

    new bootstrap.Modal(document.getElementById('reviewModal')).show();
  }

  paintStars(container, n, fill = false) {
    container.querySelectorAll('i').forEach(star => {
      const r = parseInt(star.dataset.rating);
      star.className = (r <= n) ? 'bi bi-star-fill' : 'bi bi-star';
    });
  }

  async submitReview(rating) {
    const errEl = document.getElementById('review-error');
    errEl.classList.add('d-none');

    if (!rating || rating < 1 || rating > 5) {
      errEl.textContent = 'Tenés que elegir al menos una estrella.';
      errEl.classList.remove('d-none');
      return;
    }

    const title = document.getElementById('review-title').value.trim();
    const body  = document.getElementById('review-body').value.trim();
    const btn   = document.getElementById('review-submit');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Publicando…';

    try {
      await window.DaleDeal.api.createReview({
        item_type: 'product',
        item_id:   this.currentProduct.id,
        rating,
        title:     title || null,
        body:      body  || null,
      });
      bootstrap.Modal.getInstance(document.getElementById('reviewModal'))?.hide();
      this.showNotification('¡Gracias por tu reseña!', 'success');
      // Recargar las reviews para que aparezca la nueva
      await this.loadAndRenderReviews();
    } catch (err) {
      errEl.textContent = err.message || 'No se pudo publicar la reseña.';
      errEl.classList.remove('d-none');
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-send me-1"></i> Publicar reseña';
    }
  }

  // ── Recently viewed ────────────────────────────────────────────────────────
  loadRecentlyViewed() {
    const grid = document.getElementById('recentlyViewedGrid');
    if (!grid) return;
    try {
      const recentIds = this.getRecentlyViewed()
        .filter(id => id !== String(this.currentProduct.id))
        .slice(0, 4);

      if (!recentIds.length) return;

      const productsData = recentIds
        .map(id => window.getProductById ? window.getProductById(parseInt(id)) : null)
        .filter(Boolean);

      if (productsData.length) this.renderRecentlyViewed(productsData);
    } catch (err) {
      DaleDeal.error('Error cargando recientes:', err);
    }
  }

  renderRecentlyViewed(products) {
    const grid = document.getElementById('recentlyViewedGrid');
    if (!grid) return;

    const pps = window.innerWidth < 768 ? 1 : window.innerWidth < 1024 ? 2 : 4;
    const slides = [];
    for (let i = 0; i < products.length; i += pps) {
      const batch = products.slice(i, i + pps);
      slides.push(`
        <div class="carousel-item ${i === 0 ? 'active' : ''}">
          <div class="row justify-content-center">
            ${batch.map(p => this.renderProductCard(p, true)).join('')}
          </div>
        </div>`);
    }
    grid.innerHTML = slides.join('');
    this._toggleCarouselControls('recentlyViewedCarousel', slides.length);
    setTimeout(() => window.favoritesManager?.updateFavoriteButtons(), 100);
  }

  // ── Shared card renderer (similar & recent) ────────────────────────────────
  renderProductCard(product, isRecent = false) {
    // Escape de title/description (input vendedor). product.id casteado a
    // número porque va a data-id (atributo) y al onclick implícito.
    const esc = (s) => (window.DaleDeal?.utils?.escapeHtml ? DaleDeal.utils.escapeHtml(s) : String(s ?? ''));
    const titleSafe = esc(product.title);
    const pid = Number(product.id) || 0;
    const imgSrc = String(product.images?.main || '').replace(/['"<>]/g, '');
    const desc = product.description
      ? (product.description.length > 80 ? product.description.substring(0, 80) + '…' : product.description)
      : 'Producto de alta calidad.';
    const descSafe = esc(desc);
    return `
      <div class="col-12 col-md-6 col-lg-3 mb-4 d-flex">
        <div class="product-card ${isRecent ? 'recent-product-card' : 'similar-product-card'} w-100"
             data-id="${pid}" data-clickable="true">
          <div class="product-image-container">
            <img src="${imgSrc}" alt="${titleSafe}" class="product-image" loading="lazy" decoding="async" />
            ${product.discount ? `<div class="product-badges"><span class="badge-offer">-${Number(product.discount) || 0}%</span></div>` : ''}
            ${isRecent ? `<div class="recently-viewed-badge"><i class="bi bi-clock-history"></i></div>` : ''}
            <div class="product-actions">
              <button class="action-heart" title="Agregar a favoritos" data-product-id="${pid}">
                <i class="bi bi-heart"></i>
              </button>
            </div>
          </div>
          <div class="product-info">
            <h3 class="product-title">${titleSafe}</h3>
            <p class="product-description">${descSafe}</p>
            <div class="product-meta-group">
              <div class="product-rating">
                <div class="stars">${this.renderProductStars(product.rating)}</div>
                <span class="reviews-count">(${product.reviewCount.toLocaleString('es-AR')})</span>
              </div>
            </div>
            <div class="product-pricing-wrapper">
              <div class="product-pricing">
                <span class="product-current-price">${this.formatPrice(product.price)}</span>
                ${product.originalPrice ? `<span class="product-original-price">${this.formatPrice(product.originalPrice)}</span>` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>`;
  }

  _toggleCarouselControls(carouselId, slideCount) {
    const carousel = document.getElementById(carouselId);
    if (!carousel) return;
    const show = slideCount > 1;
    const prev = carousel.querySelector('.carousel-control-prev');
    const next = carousel.querySelector('.carousel-control-next');
    if (prev) prev.style.display = show ? 'flex' : 'none';
    if (next) next.style.display = show ? 'flex' : 'none';
  }

  // ── Recently viewed persistence ────────────────────────────────────────────
  saveToRecentlyViewed() {
    if (!this.currentProduct) return;
    try {
      const id = String(this.currentProduct.id);
      let recent = this.getRecentlyViewed().filter(x => x !== id);
      recent.unshift(id);
      localStorage.setItem('daledeal_recently_viewed', JSON.stringify(recent.slice(0, 10)));
    } catch (err) {
      DaleDeal.error('Error guardando reciente:', err);
    }
  }

  getRecentlyViewed() {
    try {
      const raw = localStorage.getItem('daledeal_recently_viewed');
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
