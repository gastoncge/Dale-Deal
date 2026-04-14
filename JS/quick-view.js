/**
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
    // Collect all gallery images already rendered in the card carousel
    const cardImages = [...productCard.querySelectorAll('.product-image')].map(img => img.src).filter(Boolean);
    const mainImage = cardImages[0] || '';
    const images = cardImages.length > 0 ? cardImages : [mainImage];
    const rating = this.extractRating(productCard);
    const ratingCount = productCard.querySelector('.reviews-count')?.textContent || '(0)';
    const features = this.extractFeatures(productCard);
    const badges = this.extractBadges(productCard);

    return {
      id,
      title,
      currentPrice,
      originalPrice,
      mainImage,
      images,
      rating,
      ratingCount,
      features,
      badges,
      description: '',
      specifications: []
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
    modal.id = 'quickViewModal';
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
          id: String(productId),
          type: 'product',
          title: this.currentProduct.title,
          priceText: this.currentProduct.currentPrice,
          originalPriceText: this.currentProduct.originalPrice || '',
          imageUrl: this.currentProduct.mainImage,
          rating: this.currentProduct.rating,
          ratingCount: this.currentProduct.ratingCount,
          dateAdded: Date.now()
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
      const price = DaleDeal.utils.parseARSPrice(this.currentProduct.currentPrice);
      
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
    return DaleDeal.utils.renderStars(rating);
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
    DaleDeal.utils.showNotification(message, type);
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  window.quickViewManager = new QuickViewManager();
});