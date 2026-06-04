// Local product cache — populated by syncProductsFromAPI() from the backend.
// The API is the single source of truth; no hardcoded products.
const PRODUCTS_DATA = {};

// Function to get product by ID (busca en cache local, incluyendo datos de la API)
function getProductById(id) {
  return PRODUCTS_DATA[id] || null;
}

// Function to get all products
function getAllProducts() {
  return Object.values(PRODUCTS_DATA);
}

// =====================================================
// SINCRONIZACIÓN CON LA API REAL
// Los datos del backend se mezclan con los hardcodeados.
// Los productos de la API tienen prioridad.
// =====================================================
async function syncProductsFromAPI() {
  try {
    if (!window.DaleDeal?.api?.fetchProducts) return;
    const products = await window.DaleDeal.api.fetchProducts();
    products.forEach(p => {
      PRODUCTS_DATA[p.id] = p;
    });
    window.PRODUCTS_DATA = PRODUCTS_DATA;
    DaleDeal.log(`✅ product-data.js sincronizado: ${products.length} productos de la API`);

    // Actualizar UI: el contador "Cargando productos..." del header se quedaba
    // pegado porque syncProductsFromAPI no avisaba a la página. Trigger
    // re-render si está disponible algún loader/filtro que conoce los nuevos.
    if (window.ProductsPageLoader?.loadProducts) {
      try { await window.ProductsPageLoader.loadProducts(); } catch (_) {}
    }
    if (window.productFilters?.renderProducts) {
      try { window.productFilters.renderProducts(); } catch (_) {}
    }
    // Update directo del contador como red de seguridad (si nadie más lo hizo).
    const resultsCount = document.getElementById('resultsCount');
    if (resultsCount && resultsCount.textContent.includes('Cargando')) {
      const n = products.length;
      resultsCount.textContent = `${n} producto${n !== 1 ? 's' : ''} encontrado${n !== 1 ? 's' : ''}`;
    }
  } catch (err) {
    DaleDeal.warn('No se pudo sincronizar con la API:', err.message);
  }
}

// Intentar sincronizar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', syncProductsFromAPI);
} else {
  syncProductsFromAPI();
}

// Make available globally
window.PRODUCTS_DATA = PRODUCTS_DATA;
window.getProductById = getProductById;
window.getAllProducts = getAllProducts;
window.syncProductsFromAPI = syncProductsFromAPI;// =====================================================
// DALE DEAL - Services Data
// =====================================================

// Local service cache — populated by syncServicesFromAPI() from the backend.
const servicesData = [];


// =====================================================
// SINCRONIZACIÓN CON LA API REAL
// Intenta cargar servicios desde el backend.
// Si la API falla, se usan los datos hardcodeados como fallback.
// =====================================================
async function syncServicesFromAPI() {
  try {
    if (!window.DaleDeal?.api?.fetchServices) return;
    const apiServices = await window.DaleDeal.api.fetchServices();
    if (apiServices && apiServices.length > 0) {
      // Reemplazar el array con datos reales de la API
      servicesData.length = 0;
      apiServices.forEach(s => servicesData.push(s));
      DaleDeal.log(`✅ services-data.js sincronizado: ${apiServices.length} servicios de la API`);
      // Avisar a la página que los datos están listos
      document.dispatchEvent(new CustomEvent('servicesDataUpdated', { detail: servicesData }));
    }
  } catch (err) {
    DaleDeal.warn('No se pudo sincronizar servicios con la API:', err.message);
  }
}

// Intentar sincronizar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', syncServicesFromAPI);
} else {
  syncServicesFromAPI();
}

// Exportar para uso en otros archivos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { servicesData };
}

window.syncServicesFromAPI = syncServicesFromAPI;
/**
 * =====================================================
 * DALE DEAL - Carrusel de Imágenes de Productos
 * =====================================================
 */

class ProductCarousel {
  constructor() {
    this.carousels = [];
    this.init();
  }

  init() {
    // Encontrar todos los carruseles de productos
    const carouselElements = document.querySelectorAll('.product-image-carousel');
    
    carouselElements.forEach((carousel, index) => {
      this.setupCarousel(carousel, index);
    });

    DaleDeal.log(`✅ ProductCarousel inicializado con ${this.carousels.length} carruseles`);
    DaleDeal.log('Carruseles encontrados:', carouselElements.length);
  }

  setupCarousel(carouselElement, index) {
    const images = carouselElement.querySelectorAll('.product-image');
    const indicators = carouselElement.querySelectorAll('.indicator');
    const prevBtn = carouselElement.querySelector('.carousel-prev');
    const nextBtn = carouselElement.querySelector('.carousel-next');

    DaleDeal.log(`🔧 Configurando carousel ${index}:`, {
      images: images.length,
      indicators: indicators.length,
      prevBtn: !!prevBtn,
      nextBtn: !!nextBtn
    });

    if (images.length <= 1) {
      // Si hay solo una imagen, ocultar controles
      prevBtn?.style.setProperty('display', 'none');
      nextBtn?.style.setProperty('display', 'none');
      carouselElement.querySelector('.carousel-indicators')?.style.setProperty('display', 'none');
      DaleDeal.log(`ℹ️ Carousel ${index} tiene solo 1 imagen, controles ocultos`);
      return;
    }

    const carouselData = {
      element: carouselElement,
      images: images,
      indicators: indicators,
      currentIndex: 0,
      totalImages: images.length
    };

    this.carousels.push(carouselData);

    // Event listeners para los controles
    prevBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      DaleDeal.log('🔄 Botón anterior clickeado - carrusel', index);
      this.prevImage(index);
    });

    nextBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      DaleDeal.log('🔄 Botón siguiente clickeado - carrusel', index);
      this.nextImage(index);
    });

    // Event listeners para los indicadores
    indicators.forEach((indicator, imgIndex) => {
      indicator.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.goToImage(index, imgIndex);
      });
    });

    // Auto-play cuando se hace hover (opcional)
    let autoplayInterval;
    carouselElement.addEventListener('mouseenter', () => {
      // Podríamos agregar auto-play aquí si se desea
    });

    carouselElement.addEventListener('mouseleave', () => {
      if (autoplayInterval) {
        clearInterval(autoplayInterval);
      }
    });
  }

  prevImage(carouselIndex) {
    const carousel = this.carousels[carouselIndex];
    if (!carousel) return;

    carousel.currentIndex = 
      carousel.currentIndex === 0 
        ? carousel.totalImages - 1 
        : carousel.currentIndex - 1;

    this.updateCarousel(carouselIndex);
  }

  nextImage(carouselIndex) {
    const carousel = this.carousels[carouselIndex];
    if (!carousel) return;

    carousel.currentIndex = 
      carousel.currentIndex === carousel.totalImages - 1 
        ? 0 
        : carousel.currentIndex + 1;

    this.updateCarousel(carouselIndex);
  }

  goToImage(carouselIndex, imageIndex) {
    const carousel = this.carousels[carouselIndex];
    if (!carousel || imageIndex >= carousel.totalImages) return;

    carousel.currentIndex = imageIndex;
    this.updateCarousel(carouselIndex);
  }

  updateCarousel(carouselIndex) {
    const carousel = this.carousels[carouselIndex];
    if (!carousel) return;

    // Actualizar imágenes
    carousel.images.forEach((img, index) => {
      if (index === carousel.currentIndex) {
        img.classList.add('active');
      } else {
        img.classList.remove('active');
      }
    });

    // Actualizar indicadores
    carousel.indicators.forEach((indicator, index) => {
      if (index === carousel.currentIndex) {
        indicator.classList.add('active');
      } else {
        indicator.classList.remove('active');
      }
    });

    // Actualizar data attribute
    carousel.element.setAttribute('data-current-image', carousel.currentIndex);
  }

  // Método público para reinicializar si se agregan nuevos productos dinámicamente
  reinitialize() {
    this.carousels = [];
    this.init();
  }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.productCarousel = new ProductCarousel();
  });
} else {
  window.productCarousel = new ProductCarousel();
}

// Exportar para uso global
window.ProductCarousel = ProductCarousel;/**
 * DALE DEAL - Vista Rápida de Productos
 * Modal con galería de imágenes y detalles del producto
 */

class QuickViewManager {
  constructor() {
    this.currentProduct = null;
    this.currentImageIndex = 0;
    this.init();
  }

  init() {
    this.bindEvents();
  }

  // Vincular eventos
  bindEvents() {
    // Event delegation para botones de vista rápida
    document.addEventListener('click', (e) => {
      if (e.target.closest('.action-quick-view')) {
        e.preventDefault();
        e.stopPropagation();
        this.handleQuickViewClick(e);
      }
    });
  }

  // Manejar clic en vista rápida
  handleQuickViewClick(e) {
    const button = e.target.closest('.action-quick-view');
    const productCard = button.closest('.product-card');
    
    if (!productCard) return;

    const productData = this.extractProductData(productCard);
    this.showQuickView(productData);
  }

  // Extraer datos del producto
  extractProductData(productCard) {
    const id = productCard.dataset.id;
    const title = productCard.querySelector('.product-title')?.textContent || '';
    const currentPrice = productCard.querySelector('.product-current-price')?.textContent || '$0';
    const originalPrice = productCard.querySelector('.product-original-price')?.textContent || '';
    const mainImage = productCard.querySelector('.product-image')?.src || '';
    const rating = this.extractRating(productCard);
    const ratingCount = productCard.querySelector('.rating-count')?.textContent || '(0)';
    const features = this.extractFeatures(productCard);
    const badges = this.extractBadges(productCard);

    // Generar imágenes adicionales simuladas
    const additionalImages = this.generateAdditionalImages(mainImage, id);

    return {
      id,
      title,
      currentPrice,
      originalPrice,
      mainImage,
      images: [mainImage, ...additionalImages],
      rating,
      ratingCount,
      features,
      badges,
      description: this.generateDescription(title),
      specifications: this.generateSpecifications(title)
    };
  }

  // Extraer rating
  extractRating(card) {
    const stars = card.querySelectorAll('.stars .bi-star-fill').length;
    const halfStars = card.querySelectorAll('.stars .bi-star-half').length;
    return stars + (halfStars * 0.5);
  }

  // Extraer características
  extractFeatures(card) {
    const features = [];
    const featureElements = card.querySelectorAll('.feature-item');
    featureElements.forEach(element => {
      const text = element.textContent.trim();
      if (text) features.push(text);
    });
    return features;
  }

  // Extraer badges
  extractBadges(card) {
    const badges = [];
    const badgeElements = card.querySelectorAll('[class*="badge-"]');
    badgeElements.forEach(badge => {
      badges.push({
        text: badge.textContent.trim(),
        class: badge.className
      });
    });
    return badges;
  }

  // Generar imágenes adicionales
  generateAdditionalImages(mainImage, productId) {
    // En una aplicación real, estas vendrían de la base de datos
    const baseImages = [
      'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600&h=600&fit=crop',
      'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600&h=600&fit=crop'
    ];

    // Seleccionar 3-4 imágenes basadas en el ID del producto
    const numImages = 3 + (parseInt(productId) % 2);
    const startIndex = parseInt(productId) % baseImages.length;
    const images = [];

    for (let i = 1; i < numImages; i++) {
      const index = (startIndex + i) % baseImages.length;
      images.push(baseImages[index]);
    }

    return images;
  }

  // Generar descripción genérica cuando la API no provee una
  generateDescription(title) {
    return title
      ? `${title} — consultá el vendedor para más detalles.`
      : 'Consultá al vendedor para más información sobre este producto.';
  }

  // Generar especificaciones genéricas cuando la API no provee ninguna
  generateSpecifications(_title) {
    return [
      { label: 'Garantía', value: '12 meses' },
      { label: 'Envío', value: 'Según descripción del vendedor' },
    ];
  }

  // Mostrar vista rápida
  showQuickView(productData) {
    this.currentProduct = productData;
    this.currentImageIndex = 0;

    const modal = this.createQuickViewModal();
    this.updateGallery();
  }

  // Crear modal de vista rápida
  createQuickViewModal() {
    this.closeQuickView();

    const modal = document.createElement('div');
    modal.className = 'quick-view-modal';
    modal.innerHTML = `
      <div class="quick-view-backdrop"></div>
      <div class="quick-view-content">
        <button class="btn-close-quick-view">
          <i class="bi bi-x"></i>
        </button>
        
        <div class="quick-view-body">
          <div class="product-gallery">
            <div class="main-image-container">
              <img id="mainQuickViewImage" src="${this.currentProduct.mainImage}" alt="${this.currentProduct.title}" class="main-image">
              <div class="image-navigation">
                <button class="nav-btn nav-prev" onclick="quickViewManager.previousImage()">
                  <i class="bi bi-chevron-left"></i>
                </button>
                <button class="nav-btn nav-next" onclick="quickViewManager.nextImage()">
                  <i class="bi bi-chevron-right"></i>
                </button>
              </div>
              <div class="image-indicators" id="imageIndicators">
                ${this.currentProduct.images.map((_, index) => `
                  <button class="indicator ${index === 0 ? 'active' : ''}" 
                          onclick="quickViewManager.goToImage(${index})"></button>
                `).join('')}
              </div>
            </div>
            
            <div class="thumbnail-grid">
              ${this.currentProduct.images.map((image, index) => `
                <img src="${image}" alt="Vista ${index + 1}" 
                     class="thumbnail ${index === 0 ? 'active' : ''}"
                     onclick="quickViewManager.goToImage(${index})">
              `).join('')}
            </div>
          </div>
          
          <div class="product-details">
            <div class="product-badges">
              ${this.currentProduct.badges.map(badge => `
                <span class="${badge.class}">${badge.text}</span>
              `).join('')}
            </div>
            
            <h2 class="product-title">${this.currentProduct.title}</h2>
            
            <div class="product-rating">
              <div class="stars">
                ${this.renderStars(this.currentProduct.rating)}
              </div>
              <span class="rating-count">${this.currentProduct.ratingCount}</span>
            </div>
            
            <div class="product-price">
              <span class="current-price">${this.currentProduct.currentPrice}</span>
              ${this.currentProduct.originalPrice ? `<span class="original-price">${this.currentProduct.originalPrice}</span>` : ''}
            </div>
            
            <div class="product-description">
              <p>${this.currentProduct.description}</p>
            </div>
            
            <div class="product-specifications">
              <h4>Especificaciones</h4>
              <div class="specs-list">
                ${this.currentProduct.specifications.map(spec => `
                  <div class="spec-item">
                    <span class="spec-label">${spec.label}:</span>
                    <span class="spec-value">${spec.value}</span>
                  </div>
                `).join('')}
              </div>
            </div>
            
            <div class="product-actions">
              <div class="quantity-selector">
                <label>Cantidad:</label>
                <div class="quantity-control">
                  <button class="quantity-btn" onclick="quickViewManager.changeQuantity(-1)">-</button>
                  <span class="quantity-display" id="quickViewQuantity">1</span>
                  <button class="quantity-btn" onclick="quickViewManager.changeQuantity(1)">+</button>
                </div>
              </div>
              
              <div class="action-buttons">
                <button class="btn btn-outline-danger btn-favorite" onclick="quickViewManager.toggleFavorite()">
                  <i class="bi bi-heart"></i>
                  <span>Favorito</span>
                </button>
                <button class="btn btn-primary btn-add-cart" onclick="quickViewManager.addToCart()">
                  <i class="bi bi-cart-plus me-2"></i>
                  Agregar al carrito
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Eventos para cerrar
    modal.querySelector('.btn-close-quick-view').addEventListener('click', () => this.closeQuickView());
    modal.querySelector('.quick-view-backdrop').addEventListener('click', () => this.closeQuickView());

    // Actualizar estado de favorito
    this.updateFavoriteButton();

    return modal;
  }

  // Navegación de imágenes
  nextImage() {
    this.currentImageIndex = (this.currentImageIndex + 1) % this.currentProduct.images.length;
    this.updateGallery();
  }

  previousImage() {
    this.currentImageIndex = (this.currentImageIndex - 1 + this.currentProduct.images.length) % this.currentProduct.images.length;
    this.updateGallery();
  }

  goToImage(index) {
    this.currentImageIndex = index;
    this.updateGallery();
  }

  // Actualizar galería
  updateGallery() {
    const modal = document.getElementById('quickViewModal');
    const mainImage = document.getElementById('mainQuickViewImage');
    const thumbnails = modal ? modal.querySelectorAll('.thumbnail') : [];
    const indicators = modal ? modal.querySelectorAll('.image-indicators .indicator') : [];

    if (mainImage) {
      mainImage.src = this.currentProduct.images[this.currentImageIndex];
    }

    thumbnails.forEach((thumb, index) => {
      thumb.classList.toggle('active', index === this.currentImageIndex);
    });

    indicators.forEach((indicator, index) => {
      indicator.classList.toggle('active', index === this.currentImageIndex);
    });
  }

  // Cambiar cantidad
  changeQuantity(delta) {
    const quantityDisplay = document.getElementById('quickViewQuantity');
    if (quantityDisplay) {
      let quantity = parseInt(quantityDisplay.textContent) + delta;
      quantity = Math.max(1, Math.min(10, quantity));
      quantityDisplay.textContent = quantity;
    }
  }

  // Alternar favorito
  toggleFavorite() {
    if (window.favoritesManager) {
      const productId = this.currentProduct.id;
      const isFavorite = window.favoritesManager.isFavorite(productId);
      
      if (isFavorite) {
        window.favoritesManager.removeFromFavorites(productId);
      } else {
        const productData = {
          id: productId,
          title: this.currentProduct.title,
          priceText: this.currentProduct.currentPrice,
          originalPriceText: this.currentProduct.originalPrice,
          imageUrl: this.currentProduct.mainImage,
          rating: this.currentProduct.rating,
          ratingCount: this.currentProduct.ratingCount
        };
        window.favoritesManager.addToFavorites(productData);
      }
      
      this.updateFavoriteButton();
      window.favoritesManager.updateFavoriteButtons();
    }
  }

  // Actualizar botón de favorito
  updateFavoriteButton() {
    const favoriteBtn = document.querySelector('.btn-favorite');
    if (favoriteBtn && window.favoritesManager) {
      const isFavorite = window.favoritesManager.isFavorite(this.currentProduct.id);
      const icon = favoriteBtn.querySelector('i');
      const text = favoriteBtn.querySelector('span');
      
      icon.className = isFavorite ? 'bi bi-heart-fill' : 'bi bi-heart';
      text.textContent = isFavorite ? 'Quitar' : 'Favorito';
      favoriteBtn.classList.toggle('btn-outline-danger', !isFavorite);
      favoriteBtn.classList.toggle('btn-danger', isFavorite);
    }
  }

  // Agregar al carrito
  addToCart() {
    if (window.cartManager && this.currentProduct) {
      const quantity = parseInt(document.getElementById('quickViewQuantity')?.textContent || 1);
      const price = parseFloat(this.currentProduct.currentPrice.replace(/[^0-9]/g, '')) || 0;
      
      const product = {
        id: this.currentProduct.id,
        title: this.currentProduct.title,
        price: price,
        image: this.currentProduct.mainImage,
        quantity: quantity
      };
      
      window.cartManager.addItem(product);
      this.showToast(`${quantity} ${this.currentProduct.title} agregado${quantity > 1 ? 's' : ''} al carrito`, 'success');
    }
  }

  // Renderizar estrellas
  renderStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
      if (i <= rating) {
        stars += '<i class="bi bi-star-fill"></i>';
      } else if (i - 0.5 <= rating) {
        stars += '<i class="bi bi-star-half"></i>';
      } else {
        stars += '<i class="bi bi-star"></i>';
      }
    }
    return stars;
  }

  // Cerrar vista rápida
  closeQuickView() {
    const modal = document.querySelector('.quick-view-modal');
    if (modal) {
      modal.remove();
    }
    this.currentProduct = null;
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

// CSS para vista rápida
const quickViewStyle = document.createElement('style');
quickViewStyle.textContent = `
  .quick-view-modal {
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

  .quick-view-backdrop {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(4px);
  }

  .quick-view-content {
    position: relative;
    background: var(--white);
    border-radius: var(--radius-2xl);
    box-shadow: var(--shadow-2xl);
    width: 95%;
    max-width: 1200px;
    max-height: 90vh;
    overflow: hidden;
  }

  .btn-close-quick-view {
    position: absolute;
    top: var(--spacing-4);
    right: var(--spacing-4);
    z-index: 10;
    background: rgba(0, 0, 0, 0.7);
    color: #ffffff;
    border: none;
    /* 44px mínimo táctil — WCAG 2.5.5 */
    min-width: 44px;
    min-height: 44px;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--font-size-xl);
    transition: all var(--transition-fast);
    /* Asegurar que el botón siempre sea visible sobre el contenido */
    backdrop-filter: blur(4px);
  }

  .btn-close-quick-view:hover {
    background: rgba(0, 0, 0, 0.9);
    transform: scale(1.1);
  }

  .quick-view-body {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-8);
    padding: var(--spacing-8);
    max-height: 85vh;
    overflow-y: auto;
  }

  .product-gallery {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
  }

  .main-image-container {
    position: relative;
    border-radius: var(--radius-xl);
    overflow: hidden;
    aspect-ratio: 1;
  }

  .main-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform var(--transition-base);
  }

  .image-navigation {
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    display: flex;
    justify-content: space-between;
    padding: 0 var(--spacing-4);
    transform: translateY(-50%);
    pointer-events: none;
  }

  .nav-btn {
    background: rgba(0, 0, 0, 0.7);
    color: #ffffff;
    border: none;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--font-size-lg);
    transition: all var(--transition-fast);
    pointer-events: auto;
  }

  .nav-btn:hover {
    background: rgba(0, 0, 0, 0.9);
    transform: scale(1.1);
  }

  .image-indicators {
    position: absolute;
    bottom: var(--spacing-4);
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: var(--spacing-2);
  }

  .indicator {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.5);
    border: none;
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .indicator.active {
    background: var(--white);
    transform: scale(1.2);
  }

  .thumbnail-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
    gap: var(--spacing-2);
  }

  .thumbnail {
    aspect-ratio: 1;
    object-fit: cover;
    border-radius: var(--radius-lg);
    cursor: pointer;
    border: 2px solid transparent;
    transition: all var(--transition-fast);
  }

  .thumbnail:hover {
    border-color: var(--primary-red-light);
  }

  .thumbnail.active {
    border-color: var(--primary-red);
  }

  .product-details {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-6);
  }

  .product-badges {
    display: flex;
    flex-wrap: wrap;
    gap: var(--spacing-2);
  }

  .product-title {
    font-size: var(--font-size-2xl);
    font-weight: 700;
    color: var(--gray-900);
    margin: 0;
    line-height: 1.3;
  }

  .product-rating {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
  }

  .product-rating .stars {
    display: flex;
    gap: 2px;
  }

  .product-rating .stars i {
    font-size: var(--font-size-base);
    color: var(--primary-yellow);
  }

  .product-price {
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
  }

  .current-price {
    font-size: var(--font-size-3xl);
    font-weight: 800;
    color: var(--primary-red);
  }

  .original-price {
    font-size: var(--font-size-lg);
    color: var(--gray-500);
    text-decoration: line-through;
  }

  .product-description p {
    font-size: var(--font-size-base);
    line-height: 1.6;
    color: var(--gray-700);
    margin: 0;
  }

  .product-specifications h4 {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--gray-900);
    margin-bottom: var(--spacing-4);
  }

  .specs-list {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
  }

  .spec-item {
    display: flex;
    justify-content: space-between;
    padding: var(--spacing-3);
    background: var(--gray-50);
    border-radius: var(--radius-lg);
  }

  .spec-label {
    font-weight: 600;
    color: var(--gray-700);
  }

  .spec-value {
    color: var(--gray-900);
    text-align: right;
  }

  .product-actions {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
    margin-top: auto;
  }

  .quantity-selector {
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
  }

  .quantity-selector label {
    font-weight: 600;
    color: var(--gray-700);
  }

  .quantity-control {
    display: flex;
    align-items: center;
    background: var(--gray-100);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }

  .quantity-btn {
    width: 40px;
    height: 40px;
    border: none;
    background: var(--white);
    color: var(--gray-700);
    font-size: var(--font-size-lg);
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .quantity-btn:hover {
    background: var(--primary-red);
    color: #ffffff;
  }

  .quantity-display {
    width: 60px;
    text-align: center;
    font-size: var(--font-size-base);
    font-weight: 600;
    color: var(--gray-900);
  }

  .action-buttons {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: var(--spacing-3);
  }

  .btn-favorite {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    padding: var(--spacing-3) var(--spacing-4);
  }

  .btn-add-cart {
    font-size: var(--font-size-lg);
    font-weight: 600;
    padding: var(--spacing-4) var(--spacing-6);
  }

  /* ===== RESPONSIVE — MÓVIL (< 768px) ===== */
  @media (max-width: 767px) {
    /*
     * El modal NO ocupa toda la pantalla: 95% del viewport
     * con bordes redondeados y scroll interno en el contenido.
     * El backdrop cierra el modal si se toca afuera.
     */
    .quick-view-content {
      width: 95%;
      max-width: 100%;
      /* Altura máxima: deja espacio para ver que hay un backdrop */
      max-height: 92vh;
      height: auto;
      border-radius: var(--radius-2xl);
      overflow: hidden;
      /* Centrado vertical con margen superior */
      margin-top: 4vh;
    }

    /*
     * El cuerpo es el área scrollable.
     * -webkit-overflow-scrolling: touch para inercia en iOS.
     */
    .quick-view-body {
      grid-template-columns: 1fr;
      gap: var(--spacing-4);
      padding: var(--spacing-5) var(--spacing-4) var(--spacing-6);
      /* Restar la altura del botón cerrar del scroll disponible */
      max-height: calc(92vh - 56px);
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      overscroll-behavior: contain;
    }

    /* Imagen principal: altura fija para que el info se vea sin scroll */
    .main-image-container {
      aspect-ratio: auto;
      height: 240px;
    }

    /* Thumbnails: 4 en fila usando el ancho completo */
    .thumbnail-grid {
      grid-template-columns: repeat(4, 1fr);
    }

    /* Botones de acción apilados verticalmente */
    .action-buttons {
      grid-template-columns: 1fr;
    }

    /* Tipografía ajustada al ancho de 95vw */
    .product-title {
      font-size: var(--font-size-lg);
    }

    .current-price {
      font-size: var(--font-size-2xl);
    }

    /* Botón cerrar: mayor visibilidad y accesibilidad */
    .btn-close-quick-view {
      top: var(--spacing-3);
      right: var(--spacing-3);
    }

    /* Specs: texto más pequeño para caber en el ancho */
    .spec-item {
      flex-direction: column;
      gap: var(--spacing-1);
      padding: var(--spacing-2);
    }

    .spec-value {
      text-align: left;
    }
  }

  /* Extra pequeño (< 480px): ajustes adicionales */
  @media (max-width: 479px) {
    .quick-view-content {
      width: 96%;
      max-height: 94vh;
      margin-top: 3vh;
    }

    .quick-view-body {
      padding: var(--spacing-4) var(--spacing-3) var(--spacing-5);
      max-height: calc(94vh - 56px);
      gap: var(--spacing-3);
    }

    .main-image-container {
      height: 200px;
    }

    .product-title {
      font-size: var(--font-size-base);
    }

    .current-price {
      font-size: var(--font-size-xl);
    }

    .product-details {
      gap: var(--spacing-4);
    }
  }
`;

document.head.appendChild(quickViewStyle);

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  window.quickViewManager = new QuickViewManager();
});/**
 * DALE DEAL - Sistema de Filtros de Productos
 * Maneja el filtrado y búsqueda de productos
 */

class ProductFilters {
  constructor() {
    this.currentCategory = 'all';
    this.currentSort = 'featured';
    this.searchQuery = '';
    this.onlyOffers = false;
    this.products = [];
    this.originalProducts = [];
    this.init();
  }

  init() {
    this.loadProducts();
    this.bindEvents();

    // Bailout: si no hay product-cards en el DOM al cargar, asumimos que
    // un loader API (HomePageLoader / ProductsPageLoader) está manejando
    // el grid. Si renderizáramos acá, mostraríamos "No encontramos productos"
    // tapando los productos que el loader trae async desde la API.
    //
    // Antes filters.js corría siempre y peleaba con los loaders, ganando
    // a veces y dejando al user con el empty state aunque hubiera 20 productos.
    if (this.products.length === 0 &&
        (window.HomePageLoader || window.ProductsPageLoader)) {
      DaleDeal.log('ProductFilters: delegando al loader API (no DOM cards aún)');
      // Listener pasivo: si el loader dispara products:loaded, re-cargamos
      // por si después el user activa filtros que necesiten la lista.
      document.addEventListener('products:loaded', () => {
        this.loadProducts();
      });
      return;
    }

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
    DaleDeal.log('Productos cargados:', this.products.length);
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

    // Listener para resize de ventana (debounced para no re-renderizar en cada pixel)
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => this.renderProducts(), 200);
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
    const tab = e.target.closest('.filter-tab');
    if (tab) tab.classList.add('active');

    // Actualizar categoría actual
    this.currentCategory = tab?.dataset.category || e.target.dataset.category;
    
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

    // Filtro solo ofertas
    if (this.onlyOffers) {
      filtered = filtered.filter(p => p.isOffer);
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

  // Mostrar mensaje sin resultados — usa el componente .empty-state global
  // (definido en components.css) para consistencia visual con el resto de
  // empty states de la app (cart, favoritos, etc.). is-search le da el
  // tinte gris neutro apropiado para "no hay resultados de búsqueda".
  // El CTA "Limpiar filtros" recupera al user del estado vacío.
  showNoResults() {
    const container = document.getElementById('productsGrid');
    container.innerHTML = `
      <div class="empty-state is-search" id="noResults" style="grid-column: 1 / -1;">
        <div class="empty-state-icon"><i class="bi bi-search"></i></div>
        <h3 class="empty-state-title">No encontramos productos</h3>
        <p class="empty-state-text">Probá con otros términos de búsqueda o cambiá los filtros.</p>
        <button type="button" class="empty-state-cta btn btn-primary" id="clearAllFiltersFromEmpty">
          <i class="bi bi-arrow-clockwise me-2"></i>Limpiar filtros
        </button>
      </div>
    `;
    // Cablear el botón de "Limpiar filtros" para reusar el flujo existente
    const clearBtn = document.getElementById('clearAllFiltersFromEmpty');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        const existingClearBtn = document.getElementById('clearAllFilters');
        if (existingClearBtn) existingClearBtn.click();
        else if (typeof this.clearAllFilters === 'function') this.clearAllFilters();
      });
    }
  }

  // Ocultar mensaje sin resultados
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
        const sortBtn = e.target.closest('.sort-option');
        this.currentSort = sortBtn?.dataset.sort || e.target.dataset.sort;
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
      DaleDeal.log('La geolocalización no está soportada en este navegador');
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

    }, 800);
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

  // Mostrar notificación usando el sistema centralizado
  showToast(message, type = 'info') {
    // Usar el sistema de notificaciones global de DaleDeal.utils
    if (window.DaleDeal?.utils?.showNotification) {
      window.DaleDeal.utils.showNotification(message, type);
    } else {
      // Fallback si utils no está disponible
      DaleDeal.log(`[FILTERS ${type.toUpperCase()}] ${message}`);
    }
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
// IMPORTANTE: TODOS los selectores acá adentro deben estar scopeados con
// .advanced-filters o .filter-modal. Antes se filtraban globalmente y
// rompían layouts de otros componentes — el caso más visible: .section-header
// arrancaba con display:flex y empujaba el h2 "Productos destacados" a la
// izquierda del container en lugar de centrarlo (test-center quedaba sin
// efecto porque flex le da ancho intrínseco al hijo block).
const advancedFiltersStyle = document.createElement('style');
advancedFiltersStyle.textContent = `
  .advanced-filters {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-6);
  }

  .advanced-filters .filter-section {
    background: var(--gray-50);
    border-radius: var(--radius-xl);
    padding: var(--spacing-5);
    border: 1px solid var(--gray-200);
  }

  .advanced-filters .section-header {
    display: flex;
    align-items: center;
    margin-bottom: var(--spacing-4);
  }

  .advanced-filters .section-header h5 {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--gray-900);
    margin: 0;
  }

  .advanced-filters .section-header i {
    color: var(--primary-red);
    font-size: var(--font-size-lg);
  }

  .advanced-filters .filter-group {
    margin-bottom: var(--spacing-4);
  }

  .advanced-filters .filter-group:last-child {
    margin-bottom: 0;
  }

  .advanced-filters .filter-group label {
    display: block;
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--gray-700);
    margin-bottom: var(--spacing-2);
  }

  .advanced-filters .location-search-container {
    display: flex;
    gap: var(--spacing-2);
    align-items: center;
  }

  .advanced-filters .location-search-container input {
    flex: 1;
  }

  .advanced-filters .location-suggestions {
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

  .advanced-filters .location-suggestions.active {
    display: block;
  }

  .advanced-filters .location-suggestion {
    display: flex;
    align-items: center;
    padding: var(--spacing-3);
    cursor: pointer;
    border-bottom: 1px solid var(--gray-100);
    transition: all var(--transition-fast);
  }

  .advanced-filters .location-suggestion:last-child {
    border-bottom: none;
  }

  .advanced-filters .location-suggestion:hover {
    background: var(--gray-50);
    color: var(--primary-red);
  }

  .advanced-filters .location-suggestion i {
    color: var(--gray-400);
  }

  .advanced-filters .location-suggestion:hover i {
    color: var(--primary-red);
  }

  .advanced-filters .no-suggestions {
    padding: var(--spacing-4);
    text-align: center;
    color: var(--gray-500);
    font-style: italic;
  }

  .advanced-filters .delivery-options,
  .advanced-filters .feature-options {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
  }

  .advanced-filters .option-checkbox {
    display: flex;
    align-items: center;
    cursor: pointer;
    font-size: var(--font-size-sm);
    color: var(--gray-700);
    position: relative;
    padding: var(--spacing-2) var(--spacing-2) var(--spacing-2) var(--spacing-8);
    transition: color var(--transition-fast), background var(--transition-fast);
  }

  .advanced-filters .option-checkbox input[type="checkbox"] {
    position: absolute;
    opacity: 0;
    cursor: pointer;
    height: 0;
    width: 0;
  }

  .advanced-filters .checkmark {
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

  .advanced-filters .option-checkbox:hover {
    color: var(--primary-red);
    background: rgba(214, 48, 49, 0.07);
    border-radius: var(--radius-md);
  }

  .advanced-filters .option-checkbox:hover .checkmark {
    border-color: var(--primary-red);
  }

  .advanced-filters .option-checkbox input:checked ~ .checkmark {
    background: var(--primary-red);
    border-color: var(--primary-red);
  }

  .advanced-filters .checkmark:after {
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

  .advanced-filters .option-checkbox input:checked ~ .checkmark:after {
    display: block;
  }

  .advanced-filters .price-range-container {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-4);
  }

  .advanced-filters .price-inputs {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--spacing-4);
  }

  .advanced-filters .price-input-group {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-1);
  }

  .advanced-filters .price-input-group label {
    font-size: var(--font-size-xs);
    color: var(--gray-600);
    margin-bottom: 0;
  }

  .advanced-filters .price-range-sliders {
    position: relative;
    height: 24px;
  }

  .advanced-filters .price-range-sliders input[type="range"] {
    position: absolute;
    width: 100%;
    height: 6px;
    background: transparent;
    outline: none;
    pointer-events: none;
  }

  .advanced-filters .price-range-sliders input[type="range"]::-webkit-slider-thumb {
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

  .advanced-filters .price-range-sliders input[type="range"]::-moz-range-thumb {
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: var(--primary-red);
    cursor: pointer;
    pointer-events: auto;
    border: 2px solid var(--white);
    box-shadow: var(--shadow-md);
  }

  .advanced-filters .price-labels {
    display: flex;
    justify-content: space-between;
    font-size: var(--font-size-sm);
    color: var(--gray-600);
    font-weight: 600;
  }

  .advanced-filters .rating-filter {
    display: flex;
    flex-direction: column;
    gap: var(--spacing-2);
  }

  .advanced-filters .rating-option {
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

  .advanced-filters .rating-option:hover {
    border-color: var(--primary-red);
    background: rgba(214, 48, 49, 0.12);
    color: var(--primary-red);
  }

  .advanced-filters .rating-option.active {
    border-color: var(--primary-red);
    background: var(--primary-red);
    color: #ffffff;
  }

  .advanced-filters .rating-option .stars {
    display: flex;
    gap: 2px;
  }

  .advanced-filters .rating-option .stars i {
    font-size: var(--font-size-sm);
    color: var(--primary-yellow);
  }

  .advanced-filters .rating-option:hover .stars i {
    color: var(--primary-yellow);
  }

  .advanced-filters .rating-option.active .stars i {
    color: #ffffff;
  }

  .advanced-filters .filter-actions {
    display: flex;
    justify-content: space-between;
    gap: var(--spacing-3);
    padding-top: var(--spacing-4);
    border-top: 1px solid var(--gray-200);
    margin-top: var(--spacing-2);
  }

  .advanced-filters .btn-clear-filters {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-3) var(--spacing-4);
    font-weight: 600;
    font-size: var(--font-size-sm);
    flex: 0 0 auto;
    min-width: 120px;
  }

  .advanced-filters .btn-apply-filters {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: var(--spacing-3) var(--spacing-5);
    font-weight: 600;
    font-size: var(--font-size-base);
    flex: 1;
  }

  /* Estos sí son selectores legítimos del modal (clases propias) */
  .filter-modal-content {
    max-width: 600px;
    max-height: 85vh;
  }

  .filter-modal-body {
    max-height: 70vh;
  }

  .advanced-filters .spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @media (max-width: 768px) {
    .advanced-filters .price-inputs {
      grid-template-columns: 1fr;
    }

    .advanced-filters .filter-actions {
      grid-template-columns: 1fr;
    }

    .advanced-filters .location-search-container {
      flex-direction: column;
    }

    .advanced-filters .location-search-container button {
      align-self: stretch;
    }
  }
`;

document.head.appendChild(advancedFiltersStyle);

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  window.productFilters = new ProductFilters();
});// =====================================================
// DALE DEAL - Product Search System
// =====================================================

class SearchManager {
  constructor() {
    this.searchInput = null;
    this.searchResults = [];
    this.isSearching = false;
    this.debounceTimer = null;
    this.init();
  }

  init() {
    // Esperar a que el DOM esté listo
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.bindEvents());
    } else {
      this.bindEvents();
    }
  }

  bindEvents() {
    // Buscar el input de búsqueda (puede estar en el componente header)
    const checkSearchInput = () => {
      this.searchInput = document.getElementById('searchInput');

      if (this.searchInput) {
        this.searchInput.addEventListener('input', (e) => this.handleSearch(e));
        this.searchInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            this.performSearch(e.target.value);
          }
        });
        DaleDeal.log('✓ Search input initialized');
      } else {
        // Reintentar después de que se cargue el header
        setTimeout(checkSearchInput, 500);
      }
    };

    checkSearchInput();
  }

  /**
   * Maneja el evento de búsqueda con debounce
   */
  handleSearch(e) {
    const query = e.target.value.trim();

    // Limpiar el timer anterior
    clearTimeout(this.debounceTimer);

    // Si el query está vacío, limpiar resultados
    if (query.length === 0) {
      this.clearSearchResults();
      return;
    }

    // Esperar 300ms antes de buscar
    this.debounceTimer = setTimeout(() => {
      if (query.length >= 2) {
        this.performSearch(query);
      }
    }, 300);
  }

  /**
   * Realiza la búsqueda. Comportamiento contextual:
   *  - En productos.html → busca productos y filtra el grid
   *  - En servicios.html → busca servicios (delega al input nativo de la página)
   *  - En cualquier otra página → redirige a productos.html?q=…
   */
  async performSearch(query) {
    try {
      this.isSearching = true;
      DaleDeal.log(`🔍 Buscando: "${query}"`);
      const path = window.location.pathname;

      // Si estamos en servicios.html, dejamos que el manager interno
      // de esa página filtre vía su searchTerm. Solo disparamos el input event.
      if (path.includes('servicios.html')) {
        // No hacemos nada extra: el input #searchInput tiene listener nativo
        // en servicios.html que filtra el grid de servicios.
        return;
      }

      if (!window.DaleDeal?.api) {
        DaleDeal.error('API no disponible para búsqueda');
        return;
      }

      this.searchResults = await window.DaleDeal.api.searchProducts(query);

      if (path.includes('productos.html')) {
        this.renderSearchResults();
      } else {
        // Cualquier otra página → redirigir a productos
        this.redirectToProductsPage(query);
      }
    } catch (error) {
      DaleDeal.error('Error al buscar productos:', error);
      this.showSearchError();
    } finally {
      this.isSearching = false;
    }
  }

  /**
   * Renderiza los resultados de búsqueda en la página de productos
   */
  renderSearchResults() {
    const productsGrid = document.getElementById('productsGrid');
    const resultsCount = document.getElementById('resultsCount');

    if (!productsGrid) return;

    // Actualizar contador
    if (resultsCount) {
      resultsCount.textContent = `${this.searchResults.length} producto${this.searchResults.length !== 1 ? 's' : ''} encontrado${this.searchResults.length !== 1 ? 's' : ''}`;
    }

    // Si no hay resultados → sugerir buscar en servicios
    if (this.searchResults.length === 0) {
      const query = encodeURIComponent(this.searchInput?.value || '');
      productsGrid.innerHTML = `
        <div class="col-12">
          <div class="no-results-container text-center py-5">
            <i class="bi bi-search display-1 text-muted mb-3"></i>
            <h4 class="text-muted">No se encontraron productos</h4>
            <p class="text-muted">Probá con otros términos o buscá entre los servicios profesionales.</p>
            <div class="d-flex gap-2 justify-content-center flex-wrap mt-3">
              <button class="btn btn-outline-secondary" onclick="window.searchManager.clearSearchResults()">
                <i class="bi bi-arrow-left me-2"></i>Ver todos los productos
              </button>
              <a class="btn btn-primary" href="./servicios.html?q=${query}">
                <i class="bi bi-tools me-2"></i>Buscar en servicios
              </a>
            </div>
          </div>
        </div>
      `;
      return;
    }

    // Renderizar productos encontrados
    if (window.HomePageLoader?.renderProductCard) {
      productsGrid.innerHTML = '';

      // Dividir en filas de 3
      const productsPerRow = 3;
      for (let i = 0; i < this.searchResults.length; i += productsPerRow) {
        const rowProducts = this.searchResults.slice(i, i + productsPerRow);

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
    }
  }

  /**
   * Redirige a la página de productos con el query de búsqueda
   */
  redirectToProductsPage(query) {
    // Guardar query en localStorage
    localStorage.setItem('daledeal:search:query', query);

    // Redirigir
    const isRoot = window.location.pathname.endsWith('index.html') ||
                   window.location.pathname.endsWith('/') ||
                   !window.location.pathname.includes('HTML/');

    const productsUrl = isRoot ? './HTML/productos.html' : './productos.html';
    window.location.href = `${productsUrl}?q=${encodeURIComponent(query)}`;
  }

  /**
   * Limpia los resultados de búsqueda y recarga todos los productos
   */
  clearSearchResults() {
    this.searchResults = [];

    if (this.searchInput) {
      this.searchInput.value = '';
    }

    // Recargar productos
    if (window.HomePageLoader?.loadProducts) {
      window.HomePageLoader.loadProducts();
    } else if (window.ProductsPageLoader?.loadProducts) {
      window.ProductsPageLoader.loadProducts();
    }
  }

  /**
   * Muestra un error de búsqueda
   */
  showSearchError() {
    if (window.DaleDeal?.utils?.showNotification) {
      window.DaleDeal.utils.showNotification(
        'Error al buscar productos. Por favor, intenta nuevamente.',
        'error'
      );
    }
  }

  /**
   * Obtiene el query desde la URL
   */
  getQueryFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('q');
  }

  /**
   * Carga búsqueda desde URL si existe
   */
  loadSearchFromURL() {
    const query = this.getQueryFromURL();
    const storedQuery = localStorage.getItem('daledeal:search:query');

    if (query || storedQuery) {
      const searchQuery = query || storedQuery;

      // Establecer el valor en el input
      if (this.searchInput) {
        this.searchInput.value = searchQuery;
      }

      // Realizar búsqueda
      this.performSearch(searchQuery);

      // Limpiar localStorage
      localStorage.removeItem('daledeal:search:query');
    }
  }
}

// Inicializar SearchManager globalmente
if (typeof window !== 'undefined') {
  window.searchManager = new SearchManager();
}

// Exportar para uso con módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SearchManager;
}
