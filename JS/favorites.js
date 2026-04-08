/**
 * DALE DEAL - Sistema de Favoritos
 * Maneja la funcionalidad de productos favoritos
 */

class FavoritesManager {
  constructor() {
    this.storageKey = 'daledealer_favorites';
    this.favorites = this.loadFavorites();
    this.init();
  }

  init() {
    this.bindEvents();
    this.updateFavoriteButtons();
    this.updateWishlistButton();
  }

  // Cargar favoritos desde localStorage
  loadFavorites() {
    try {
      const favorites = localStorage.getItem(this.storageKey);
      return favorites ? JSON.parse(favorites) : [];
    } catch (error) {
      DaleDeal.error('Error cargando favoritos:', error);
      return [];
    }
  }

  // Guardar favoritos en localStorage
  saveFavorites() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.favorites));
    } catch (error) {
      DaleDeal.error('Error guardando favoritos:', error);
    }
  }

  // Vincular eventos
  bindEvents() {
    // Event delegation para botones de corazón (productos y servicios)
    document.addEventListener('click', (e) => {
      if (e.target.closest('.action-heart')) {
        e.preventDefault();
        e.stopPropagation();
        this.handleFavoriteClick(e);
      }

      // Botón de wishlist en página de producto
      if (e.target.closest('.btn-wishlist')) {
        e.preventDefault();
        e.stopPropagation();
        this.handleProductWishlistClick(e);
      }

      // Event delegation para clics en product cards
      if (e.target.closest('.product-card[data-clickable="true"]') && !e.target.closest('.action-heart') && !e.target.closest('.carousel-control') && !e.target.closest('.indicator')) {
        const productCard = e.target.closest('.product-card');
        const productId = productCard.dataset.id;
        if (productId) {
          if (typeof window.goToProduct === 'function') {
            window.goToProduct(parseInt(productId));
          } else if (window.favoritesManager) {
            window.favoritesManager.goToProduct(parseInt(productId));
          }
        }
      }
    });

    // Enlace de favoritos en el menú
    document.addEventListener('click', (e) => {
      if (e.target.closest('#favoritesLink')) {
        e.preventDefault();
        const isHtmlSubdir = window.location.pathname.includes('/HTML/');
        window.location.href = isHtmlSubdir
          ? './notificaciones.html#favoritos'
          : './HTML/notificaciones.html#favoritos';
      }
    });

    // Botones del modal de favoritos
    document.addEventListener('click', (e) => {
      if (e.target.closest('#clearAllFavorites')) {
        this.clearFavorites();
      }
      if (e.target.closest('#addAllToCart')) {
        this.addAllToCart();
      }
      if (e.target.closest('#exploreProductsBtn')) {
        this.goToHome();
      }
    });
  }

  // Manejar clic en favorito (productos y servicios)
  handleFavoriteClick(e) {
    // Prevenir que se ejecute el onclick de la card
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    const button = e.target.closest('.action-heart');
    const productCard = button.closest('.product-card');
    const serviceCard = button.closest('.service-card');

    // Una card con data-type="service" o data-service-id se trata como servicio
    const isServiceCard = serviceCard ||
      (productCard && (productCard.dataset.type === 'service' || productCard.dataset.serviceId));
    const card = isServiceCard ? (serviceCard || productCard) : productCard;

    if (!card) return;

    if (isServiceCard) {
      const serviceId = card.dataset.id || card.dataset.serviceId;
      const serviceData = this.extractServiceData(card);

      if (this.isFavorite(serviceId)) {
        this.removeFromFavorites(serviceId);
        this.showToast(`${serviceData.title} eliminado de favoritos`, 'info');
      } else {
        this.addToFavorites(serviceData);
        this.showToast(`${serviceData.title} agregado a favoritos`, 'success');
      }

      this.updateFavoriteButton(button, this.isFavorite(serviceId));
      this.animateHeart(button);
    } else {
      const productId = card.dataset.id;
      const productData = this.extractProductData(card);

      if (this.isFavorite(productId)) {
        this.removeFromFavorites(productId);
        this.showToast(`${productData.title} eliminado de favoritos`, 'info');
      } else {
        this.addToFavorites(productData);
        this.showToast(`${productData.title} agregado a favoritos`, 'success');
      }

      this.updateFavoriteButton(button, this.isFavorite(productId));
      this.animateHeart(button);
    }
  }

  // Manejar clic en wishlist de producto
  handleProductWishlistClick(e) {
    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id') || localStorage.getItem('selectedProductId') || '1';
    
    if (!window.getProductById) {
      DaleDeal.error('Product data not available');
      return;
    }

    const productData = window.getProductById(parseInt(productId));
    if (!productData) return;

    const favoriteData = {
      id: productData.id.toString(),
      type: 'product',
      title: productData.title,
      priceText: this.formatPrice(productData.price),
      originalPriceText: productData.originalPrice ? this.formatPrice(productData.originalPrice) : '',
      imageUrl: productData.images.main,
      rating: productData.rating,
      ratingCount: `(${productData.reviewCount.toLocaleString()})`,
      dateAdded: Date.now()
    };

    const button = e.target.closest('.btn-wishlist');
    
    if (this.isFavorite(productId)) {
      this.removeFromFavorites(productId);
      this.showToast(`${productData.title} eliminado de favoritos`, 'info');
      button.classList.remove('active');
      button.innerHTML = '<i class="bi bi-heart"></i>';
      button.title = 'Agregar a favoritos';
    } else {
      this.addToFavorites(favoriteData);
      this.showToast(`${productData.title} agregado a favoritos`, 'success');
      button.classList.add('active');
      button.innerHTML = '<i class="bi bi-heart-fill" style="color: white !important;"></i>';
      button.title = 'Quitar de favoritos';
    }

    this.animateHeart(button);
  }

  // Formatear precio
  formatPrice(price) {
    return DaleDeal.utils.formatCurrency(price);
  }

  // Extraer datos del producto
  extractProductData(productCard) {
    const id = productCard.dataset.id;

    // Obtener datos reales del producto si está disponible
    if (window.getProductById) {
      const productData = window.getProductById(parseInt(id));
      if (productData) {
        return {
          id: id,
          type: 'product',
          title: productData.title,
          priceText: this.formatPrice(productData.price),
          originalPriceText: productData.originalPrice ? this.formatPrice(productData.originalPrice) : '',
          imageUrl: productData.images.main,
          rating: productData.rating,
          ratingCount: `(${productData.reviewCount.toLocaleString()})`,
          seller: productData.seller || null,
          description: productData.description || '',
          shipping: productData.shipping || null,
          badges: productData.badges || [],
          discount: productData.discount || 0,
          dateAdded: Date.now()
        };
      }
    }

    // Fallback para extraer datos del DOM
    const title = productCard.querySelector('.product-title')?.textContent || '';
    const priceText = productCard.querySelector('.product-current-price')?.textContent || '$0';
    const originalPriceText = productCard.querySelector('.product-original-price')?.textContent || '';
    const imageUrl = productCard.querySelector('.product-image')?.src || '';
    const rating = this.extractRating(productCard);
    const ratingCount = productCard.querySelector('.reviews-count')?.textContent || '(0)';

    return {
      id,
      type: 'product',
      title,
      priceText,
      originalPriceText,
      imageUrl,
      rating,
      ratingCount,
      dateAdded: Date.now()
    };
  }

  // Extraer datos del servicio
  // Soporta tanto .service-card (servicio.html) como .product-card[data-type="service"] (servicios.html)
  extractServiceData(serviceCard) {
    const id = serviceCard.dataset.id || serviceCard.dataset.serviceId;
    const title =
      serviceCard.querySelector('.service-title')?.textContent?.trim() ||
      serviceCard.querySelector('.product-title')?.textContent?.trim() || '';
    const priceText =
      serviceCard.querySelector('.service-price-badge')?.textContent?.trim() ||
      serviceCard.querySelector('.product-current-price')?.textContent?.trim() || '';
    const imageUrl =
      serviceCard.querySelector('.service-image')?.src ||
      serviceCard.querySelector('.product-image')?.src || '';
    const rating = this.extractRating(serviceCard);
    const ratingText =
      serviceCard.querySelector('.service-rating-text')?.textContent?.trim() ||
      serviceCard.querySelector('.reviews-count')?.textContent?.trim() || '(0)';
    const location =
      serviceCard.querySelector('.service-location span')?.textContent?.trim() ||
      serviceCard.querySelector('.product-location span')?.textContent?.trim() || '';
    const description =
      serviceCard.querySelector('.service-description')?.textContent?.trim() ||
      serviceCard.querySelector('.product-description')?.textContent?.trim() || '';

    // Provider
    const providerName = serviceCard.querySelector('.product-provider-name')?.textContent?.trim() || '';
    const providerAvatar = serviceCard.querySelector('.product-provider-avatar')?.src || '';
    const providerVerified = !!serviceCard.querySelector('.product-provider-verified');
    const provider = providerName ? { name: providerName, avatar: providerAvatar, verified: providerVerified } : null;

    // Badges — capturamos texto y color inline de cada badge
    const badges = Array.from(serviceCard.querySelectorAll('.service-badges span')).map(el => ({
      text: el.textContent.trim(),
      color: el.style.background || el.style.backgroundColor || ''
    })).filter(b => b.text);

    return {
      id: String(id || `service-${Date.now()}`),
      type: 'service',
      title,
      priceText,
      originalPriceText: '',
      imageUrl,
      rating,
      ratingCount: ratingText,
      location,
      description,
      provider,
      badges,
      dateAdded: Date.now()
    };
  }

  // Extraer rating
  extractRating(card) {
    const stars = card.querySelectorAll('.stars .bi-star-fill').length;
    const halfStars = card.querySelectorAll('.stars .bi-star-half').length;
    return stars + (halfStars * 0.5);
  }

  // Verificar si es favorito
  isFavorite(productId) {
    return this.favorites.some(fav => String(fav.id) === String(productId));
  }

  // Agregar a favoritos
  addToFavorites(productData) {
    if (!this.isFavorite(productData.id)) {
      this.favorites.unshift(productData);
      this.saveFavorites();
    }
  }

  // Remover de favoritos
  removeFromFavorites(productId) {
    this.favorites = this.favorites.filter(fav => String(fav.id) !== String(productId));
    this.saveFavorites();
  }

  // Actualizar todos los botones de favoritos (productos y servicios)
  updateFavoriteButtons() {
    document.querySelectorAll('.action-heart').forEach(button => {
      const productCard = button.closest('.product-card');
      const serviceCard = button.closest('.service-card');
      const isServiceCard = serviceCard ||
        (productCard && (productCard.dataset.type === 'service' || productCard.dataset.serviceId));
      const card = isServiceCard ? (serviceCard || productCard) : productCard;
      if (!card) return;
      const id = card.dataset.id || card.dataset.serviceId;
      if (id) this.updateFavoriteButton(button, this.isFavorite(id));
    });
  }

  // Actualizar estado visual del botón
  updateFavoriteButton(button, isFavorite) {
    const icon = button.querySelector('i');
    if (icon) {
      icon.className = isFavorite ? 'bi bi-heart-fill' : 'bi bi-heart';
      button.classList.toggle('active', isFavorite);
      // El color se maneja por CSS con la clase 'active'
    }
  }

  // Actualizar botón de wishlist en página de producto
  updateWishlistButton() {
    const wishlistBtn = document.querySelector('.btn-wishlist');
    if (!wishlistBtn) return;

    const params = new URLSearchParams(window.location.search);
    const productId = params.get('id') || localStorage.getItem('selectedProductId') || '1';
    const isFavorite = this.isFavorite(productId);
    
    wishlistBtn.classList.toggle('active', isFavorite);
    
    // Asegurar que el icono se vea correctamente
    if (isFavorite) {
      wishlistBtn.innerHTML = '<i class="bi bi-heart-fill" style="color: white !important;"></i>';
      wishlistBtn.title = 'Quitar de favoritos';
    } else {
      wishlistBtn.innerHTML = '<i class="bi bi-heart"></i>';
      wishlistBtn.title = 'Agregar a favoritos';
    }
  }

  // Animar corazón
  animateHeart(button) {
    button.classList.add('heart-animate');
    setTimeout(() => {
      button.classList.remove('heart-animate');
    }, 600);
  }

  // Obtener todos los favoritos
  getFavorites() {
    return this.favorites;
  }

  // Obtener cantidad de favoritos
  getFavoritesCount() {
    return this.favorites.length;
  }

  // Limpiar favoritos
  clearFavorites() {
    if (this.favorites.length === 0) return;
    
    this.favorites = [];
    this.saveFavorites();
    this.updateFavoriteButtons();
    this.renderFavoritesContent();
    this.showToast('Todos los favoritos han sido eliminados', 'info');
  }

  // Mostrar modal de favoritos
  showFavoritesModal() {
    const modalEl = document.getElementById('favoritesModal');
    if (!modalEl) return;
    const modal = new bootstrap.Modal(modalEl);
    this.renderFavoritesContent();
    modal.show();
  }

  // Renderizar contenido de favoritos
  renderFavoritesContent() {
    const favoritesEmpty = document.getElementById('favoritesEmpty');
    const favoritesGrid = document.getElementById('favoritesGrid');
    const favoritesTotal = document.getElementById('favoritesTotal');

    if (!favoritesGrid) return;

    if (this.favorites.length === 0) {
      if (favoritesEmpty) favoritesEmpty.style.display = 'block';
      favoritesGrid.style.display = 'none';
      if (favoritesTotal) favoritesTotal.textContent = '0';
      return;
    }

    if (favoritesEmpty) favoritesEmpty.style.display = 'none';
    favoritesGrid.style.display = 'block';
    if (favoritesTotal) favoritesTotal.textContent = this.favorites.length;

    // Separar productos y servicios
    const products = this.favorites.filter(fav => fav.type === 'product');
    const services = this.favorites.filter(fav => fav.type === 'service');

    let contentHTML = '';

    // Renderizar productos
    if (products.length > 0) {
      const productsHTML = products.map(favorite => this.renderFavoriteProduct(favorite)).join('');
      contentHTML += `
        <div class="favorites-section">
          <h3 class="favorites-section-title">
            <i class="bi bi-box-seam me-2"></i>
            Productos (${products.length})
          </h3>
          <div class="row">${productsHTML}</div>
        </div>
      `;
    }

    // Renderizar servicios
    if (services.length > 0) {
      const servicesHTML = services.map(favorite => this.renderFavoriteService(favorite)).join('');
      contentHTML += `
        <div class="favorites-section ${products.length > 0 ? 'mt-4' : ''}">
          <h3 class="favorites-section-title">
            <i class="bi bi-tools me-2"></i>
            Servicios (${services.length})
          </h3>
          <div class="row">${servicesHTML}</div>
        </div>
      `;
    }

    favoritesGrid.innerHTML = contentHTML;
  }

  // Renderizar tarjeta de producto favorito
  renderFavoriteProduct(favorite) {
    const fullProduct = (typeof window.getProductById === 'function')
      ? window.getProductById(parseInt(favorite.id))
      : null;

    const imageUrl = fullProduct?.images?.main || favorite.imageUrl || '';
    const title = fullProduct?.title || favorite.title || '';
    const rating = fullProduct?.rating ?? favorite.rating ?? 0;
    const ratingCount = fullProduct?.reviewCount
      ? `(${fullProduct.reviewCount.toLocaleString('es-AR')})`
      : (favorite.ratingCount || '(0)');
    const priceText = fullProduct
      ? (window.DaleDeal?.utils?.formatCurrency(fullProduct.price) || favorite.priceText)
      : favorite.priceText;
    const originalPriceText = fullProduct?.originalPrice
      ? (window.DaleDeal?.utils?.formatCurrency(fullProduct.originalPrice) || favorite.originalPriceText)
      : favorite.originalPriceText;
    const rawDesc = fullProduct?.description || favorite.description || '';
    const description = rawDesc.length > 80 ? rawDesc.substring(0, 80) + '...' : rawDesc;
    const seller = fullProduct?.seller || favorite.seller || null;
    const hasDiscount = (fullProduct?.discount || favorite.discount || 0) > 0;
    const discount = fullProduct?.discount || favorite.discount || 0;
    const shipping = fullProduct?.shipping || favorite.shipping || null;

    const badges = fullProduct?.badges || favorite.badges || [];
    const customBadges = badges.filter(b => typeof b === 'object' && b.text);
    const legacyBadges = badges.filter(b => typeof b === 'string');
    const legacyOfferBadges = hasDiscount ? [] : legacyBadges.filter(b => b.includes('OFF'));
    const platformBadges = legacyBadges.filter(b => !b.includes('OFF') && ['DESTACADO', 'MÁS VENDIDO', 'NUEVO', 'RECOMENDADO'].includes(b.toUpperCase()));
    const topLeftInner = [
      ...customBadges.map(b => `<span class="badge-custom" style="background:${b.color}">${b.text}</span>`),
      hasDiscount ? `<span class="badge-offer">-${discount}%</span>` : '',
      ...legacyOfferBadges.map(b => `<span class="badge-offer">${b}</span>`),
    ].filter(Boolean).join('');
    const topLeftHTML = topLeftInner ? `<div class="service-badges">${topLeftInner}</div>` : '';
    const bottomRightHTML = platformBadges.map(b => `<span class="badge-featured">${b}</span>`).join('');
    const badgesHTML = topLeftHTML + bottomRightHTML;

    return `
      <div class="col-md-6 col-lg-4 mb-4">
        <div class="product-card ${hasDiscount ? 'has-offer' : ''}" data-id="${favorite.id}" data-clickable="true">
          <div class="product-image-container">
            <img src="${imageUrl}" alt="${title}" class="product-image active" loading="lazy" width="400" height="300">
            ${badgesHTML}
            <div class="product-actions">
              <button class="action-heart active" title="Quitar de favoritos" data-product-id="${favorite.id}"
                onclick="event.stopPropagation(); window.favoritesManager.removeFromFavoritesModal('${favorite.id}')">
                <i class="bi bi-heart-fill"></i>
              </button>
            </div>
          </div>
          <div class="product-info">
            <h3 class="product-title">${title}</h3>
            ${seller ? `
            <div class="product-provider">
              <img src="${seller.avatar}" alt="${seller.name}" class="product-provider-avatar" loading="lazy" width="40" height="40" />
              <span class="product-provider-name">${seller.name}</span>
              ${seller.verified ? '<i class="bi bi-patch-check-fill product-provider-verified"></i>' : ''}
            </div>` : ''}
            ${description ? `<p class="product-description">${description}</p>` : ''}
            <div class="product-meta-group">
              <div class="product-rating">
                <div class="stars">${this.renderStars(rating)}</div>
                <span class="reviews-count">${ratingCount}</span>
                ${shipping?.free ? `<span class="shipping-badge"><i class="bi bi-truck"></i> Envío gratis</span>` : ''}
              </div>
              <div class="product-location">
                <i class="bi bi-geo-alt-fill"></i>
                <span>CABA</span>
                ${shipping?.speed === 'today' ? `<span class="shipping-badge"><i class="bi bi-lightning-charge-fill"></i> Llega hoy</span>` : ''}
                ${shipping?.speed === 'tomorrow' ? `<span class="shipping-badge"><i class="bi bi-clock-fill"></i> Llega mañana</span>` : ''}
              </div>
            </div>
            <div class="product-pricing-wrapper">
              <div class="product-pricing">
                <span class="product-current-price">${priceText}</span>
                ${originalPriceText ? `<span class="product-original-price">${originalPriceText}</span>` : ''}
              </div>
              <button class="btn-add-to-cart" onclick="event.stopPropagation(); window.favoritesManager.addFavoriteToCart('${favorite.id}')">
                <i class="bi bi-cart-plus me-1"></i>Agregar al carrito
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Renderizar tarjeta de servicio favorito
  renderFavoriteService(favorite) {
    const isInHtml = window.location.pathname.includes('/HTML/');
    const href = isInHtml
      ? `./servicio.html?id=${favorite.id}`
      : `./HTML/servicio.html?id=${favorite.id}`;

    // Intentar enriquecer con datos completos si services-data.js está cargado
    const fullService = (typeof getServiceById === 'function') ? getServiceById(favorite.id) : null;

    const imageUrl  = fullService?.image      || favorite.imageUrl  || '';
    const title     = fullService?.title      || favorite.title     || '';
    const location  = fullService?.location   || favorite.location  || '';
    const rating    = fullService?.rating     ?? favorite.rating    ?? 0;
    const ratingCount = fullService?.reviewCount
      ? `(${fullService.reviewCount.toLocaleString('es-AR')})`
      : (favorite.ratingCount || '(0)');
    const description = (() => {
      const raw = fullService?.description || favorite.description || '';
      return raw.length > 80 ? raw.substring(0, 80) + '...' : raw;
    })();
    const provider = fullService?.provider || favorite.provider || null;
    const badges   = fullService?.badges   || favorite.badges   || [];

    // Badges HTML
    const badgesInner = badges.map(b => {
      if (typeof b === 'object' && b.text) {
        const bg = b.color ? `style="background:${b.color}"` : '';
        return `<span class="badge-custom" ${bg}>${b.text.toUpperCase()}</span>`;
      }
      return `<span class="badge-featured">${String(b).toUpperCase()}</span>`;
    }).join('');
    const badgesHTML = badgesInner ? `<div class="service-badges">${badgesInner}</div>` : '';

    // Provider HTML
    const providerHTML = provider?.name ? `
      <div class="product-provider">
        <img src="${provider.avatar}" alt="${provider.name}" class="product-provider-avatar" />
        <span class="product-provider-name">${provider.name}</span>
        ${provider.verified ? '<i class="bi bi-patch-check-fill product-provider-verified"></i>' : ''}
      </div>` : '';

    return `
      <div class="col-md-6 col-lg-4 mb-4">
        <div class="product-card favorite-service-card" data-id="${favorite.id}" data-type="service"
             style="cursor:pointer;" onclick="window.location.href='${href}'">
          <div class="product-image-container">
            <img src="${imageUrl}" alt="${title}" class="product-image active" loading="lazy" width="400" height="300" />
            ${badgesHTML}
            <div class="product-actions">
              <button class="action-heart active" title="Quitar de favoritos" data-product-id="${favorite.id}"
                onclick="event.stopPropagation(); window.favoritesManager.removeFromFavoritesModal('${favorite.id}')">
                <i class="bi bi-heart-fill"></i>
              </button>
            </div>
          </div>
          <div class="product-info">
            <h3 class="product-title">${title}</h3>
            ${providerHTML}
            ${description ? `<p class="product-description">${description}</p>` : ''}
            <div class="product-meta-group">
              <div class="product-rating">
                <div class="stars">${this.renderStars(rating)}</div>
                <span class="reviews-count">${ratingCount}</span>
              </div>
              ${location ? `
                <div class="product-location">
                  <i class="bi bi-geo-alt-fill"></i>
                  <span>${location}</span>
                </div>
              ` : ''}
            </div>
            <div class="product-pricing-wrapper">
              <div class="product-pricing">
                <span class="product-current-price">${favorite.priceText || ''}</span>
              </div>
              <button class="btn-add-to-cart" onclick="event.stopPropagation(); window.favoritesManager.addFavoriteToCart('${favorite.id}')">
                <i class="bi bi-cart-plus me-1"></i>Agregar al carrito
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Agregar favorito al carrito
  addFavoriteToCart(id) {
    if (!window.cartManager) return;
    const favorite = this.favorites.find(fav => fav.id === String(id));
    if (!favorite) return;

    // Obtener precio numérico desde datos reales si están disponibles
    let price = 0;
    if (favorite.type === 'service') {
      const full = (typeof getServiceById === 'function') ? getServiceById(favorite.id) : null;
      price = full?.price ?? 0;
    } else {
      const full = (typeof window.getProductById === 'function') ? window.getProductById(parseInt(favorite.id)) : null;
      price = full?.price ?? 0;
    }

    // Fallback: parsear priceText si no hay precio numérico
    if (!price && favorite.priceText) {
      price = parseFloat(favorite.priceText.replace(/[^\d]/g, '')) || 0;
    }

    // Asegurar priceText formateado
    const priceText = favorite.priceText ||
      (price ? new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(price) : '');

    window.cartManager.addItem({
      id: favorite.id,
      title: favorite.title || 'Producto',
      price,
      priceText,
      image: favorite.imageUrl || '',
    });
  }

  // Remover desde el modal
  removeFromFavoritesModal(productId) {
    // Guardar título ANTES de eliminar
    const favorite = this.favorites.find(fav => fav.id === productId) || { title: 'Producto' };
    this.removeFromFavorites(productId);
    this.renderFavoritesContent();
    this.updateFavoriteButtons();
    this.showToast(`${favorite.title} eliminado de favoritos`, 'info');
  }

  // Ir al producto
  goToProduct(productId) {
    localStorage.setItem('selectedProductId', productId);
    const path = window.location.pathname;
    if (path.includes('producto.html')) {
      window.location.href = window.location.pathname + '?id=' + productId;
    } else if (path.includes('/HTML/')) {
      window.location.href = './producto.html?id=' + productId;
    } else {
      window.location.href = './HTML/producto.html?id=' + productId;
    }
  }

  // Ir al inicio
  goToHome() {
    if (window.location.pathname.includes('producto.html')) {
      window.location.href = '../index.html';
    } else {
      // Ya estamos en el inicio, solo cerrar el modal y hacer scroll a productos
      const modalEl = document.getElementById('favoritesModal');
      const modal = modalEl ? bootstrap.Modal.getInstance(modalEl) : null;
      if (modal) modal.hide();
      
      setTimeout(() => {
        const productsSection = document.querySelector('.products-section');
        if (productsSection) {
          productsSection.scrollIntoView({ behavior: 'smooth' });
        }
      }, 300);
    }
  }

  // Renderizar estrellas
  renderStars(rating) {
    return DaleDeal.utils.renderStars(rating);
  }

  // Agregar al carrito desde favoritos
  addToCartFromFavorites(productId) {
    const favorite = this.favorites.find(fav => fav.id === productId);
    
    if (!favorite) {
      this.showToast('Producto no encontrado en favoritos', 'error');
      return;
    }

    if (!window.cartManager) {
      this.showToast('Sistema de carrito no disponible', 'error');
      return;
    }

    try {
      // Extraer el precio numérico del texto formateado
      // Formato argentino usa '.' como separador de miles y ',' como decimal
      const price = favorite.priceText ? parseFloat(favorite.priceText.replace(/[^0-9,.]/g, '').replace(/\./g, '').replace(',', '.')) || 0 : 0;
      
      const product = {
        id: String(favorite.id),
        title: favorite.title,
        price: price,
        priceText: favorite.priceText,
        image: favorite.imageUrl,
        quantity: 1
      };

      window.cartManager.addItem(product);
      this.showToast(`${favorite.title} agregado al carrito`, 'success');
    } catch (error) {
      DaleDeal.error('Error agregando producto al carrito:', error);
      this.showToast('Error al agregar producto al carrito', 'error');
    }
  }

  // Agregar todos al carrito
  addAllToCart() {
    if (this.favorites.length === 0) {
      this.showToast('No hay productos en favoritos para agregar', 'info');
      return;
    }

    if (!window.cartManager) {
      this.showToast('Sistema de carrito no disponible', 'error');
      return;
    }

    let addedCount = 0;
    this.favorites.forEach(favorite => {
      try {
        // Parsear precio ARS: quitar símbolo/espacios, eliminar '.' (miles), reemplazar ',' por '.'
        const price = favorite.priceText
          ? parseFloat(
              favorite.priceText
                .replace(/[^0-9,.]/g, '')
                .replace(/\./g, '')
                .replace(',', '.')
            ) || 0
          : 0;

        const product = {
          id: String(favorite.id),
          title: favorite.title,
          price: price,
          priceText: favorite.priceText,
          image: favorite.imageUrl,
          quantity: 1
        };
        
        window.cartManager.addItem(product);
        addedCount++;
      } catch (error) {
        DaleDeal.error('Error agregando producto al carrito:', error);
      }
    });

    const modalEl = document.getElementById('favoritesModal');
    const modal = modalEl ? bootstrap.Modal.getInstance(modalEl) : null;
    if (modal) modal.hide();
    
    if (addedCount > 0) {
      this.showToast(`${addedCount} producto${addedCount > 1 ? 's' : ''} agregado${addedCount > 1 ? 's' : ''} al carrito`, 'success');
    } else {
      this.showToast('No se pudieron agregar productos al carrito', 'error');
    }
  }


  // Mostrar notificación usando el sistema centralizado
  showToast(message, type = 'info') {
    // Usar el sistema de notificaciones global de DaleDeal.utils
    if (window.DaleDeal?.utils?.showNotification) {
      window.DaleDeal.utils.showNotification(message, type);
    } else {
      // Fallback si utils no está disponible
      DaleDeal.log(`[FAVORITES ${type.toUpperCase()}] ${message}`);
    }
  }
}

// CSS para favoritos
const favoritesStyle = document.createElement('style');
favoritesStyle.textContent = `
  .action-heart {
    transition: all var(--transition-base);
  }

  .action-heart:hover {
    transform: scale(1.1);
  }

  .action-heart.active {
    background: var(--primary-red) !important;
    color: var(--white) !important;
    border-color: var(--primary-red) !important;
  }

  .heart-animate {
    animation: heartBeat 0.6s ease-in-out;
  }

  @keyframes heartBeat {
    0% { transform: scale(1); }
    25% { transform: scale(1.3); }
    50% { transform: scale(1.1); }
    75% { transform: scale(1.2); }
    100% { transform: scale(1); }
  }

  /* Estilos para secciones de favoritos */
  .favorites-section {
    width: 100%;
  }

  .favorites-section-title {
    font-size: var(--font-size-xl);
    font-weight: 700;
    color: var(--gray-900);
    margin-bottom: var(--spacing-4);
    padding-bottom: var(--spacing-3);
    border-bottom: 2px solid var(--gray-200);
    display: flex;
    align-items: center;
  }

  .favorites-section-title i {
    color: var(--primary-red);
  }

  .favorite-service-card {
    cursor: pointer;
  }

  /* Consistencia visual del modal de favoritos en todas las páginas */
  #favoritesGrid .product-card {
    transition: box-shadow var(--transition-base) !important;
    transform: none !important;
  }
  #favoritesGrid .product-card:hover {
    transform: none !important;
    box-shadow: var(--shadow-lg) !important;
    border-color: var(--gray-200) !important;
  }
  #favoritesGrid .product-card:hover .product-image {
    transform: none !important;
  }
  #favoritesGrid .product-image-container {
    height: 200px !important;
  }

`;

document.head.appendChild(favoritesStyle);

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  window.favoritesManager = new FavoritesManager();
});