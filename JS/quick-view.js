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

  // Generar descripción
  generateDescription(title) {
    const descriptions = {
      'iPhone': 'El smartphone más avanzado de Apple con tecnología de vanguardia. Diseño elegante en titanio con sistema de cámaras profesional y el chip más potente de la industria.',
      'Samsung': 'Experimenta la innovación de Samsung con pantalla Dynamic AMOLED, cámaras de alta resolución y S Pen integrado para máxima productividad.',
      'MacBook': 'Potencia y portabilidad perfectamente equilibradas. Con chip Apple Silicon para un rendimiento excepcional y batería que dura todo el día.',
      'PlayStation': 'La consola de juegos más avanzada con gráficos 4K, audio 3D inmersivo y tiempos de carga ultrarrápidos con SSD personalizado.',
      'AirPods': 'Audio espacial personalizado con cancelación activa de ruido. Diseño ergonómico perfecto para uso prolongado.',
      'TV': 'Experimenta colores vibrantes y contrastes perfectos con tecnología HDR. Smart TV con acceso a todas tus apps favoritas.'
    };

    for (const [key, desc] of Object.entries(descriptions)) {
      if (title.includes(key)) return desc;
    }

    return 'Producto de alta calidad con las mejores características del mercado. Diseño premium y tecnología avanzada para satisfacer todas tus necesidades.';
  }

  // Generar especificaciones
  generateSpecifications(title) {
    const specs = {
      'iPhone 15 Pro Max': [
        { label: 'Pantalla', value: '6.7" Super Retina XDR OLED' },
        { label: 'Procesador', value: 'A17 Pro Bionic' },
        { label: 'Almacenamiento', value: '256GB / 512GB / 1TB' },
        { label: 'Cámara', value: '48MP Principal + 12MP Ultra Angular' },
        { label: 'Batería', value: 'Hasta 29 horas de video' },
        { label: 'Material', value: 'Titanio grado aeroespacial' }
      ],
      'Samsung Galaxy S24': [
        { label: 'Pantalla', value: '6.8" Dynamic AMOLED 2X' },
        { label: 'Procesador', value: 'Snapdragon 8 Gen 3' },
        { label: 'RAM', value: '12GB LPDDR5X' },
        { label: 'Cámara', value: '200MP + 50MP + 12MP' },
        { label: 'Batería', value: '5000mAh con carga rápida 45W' },
        { label: 'S Pen', value: 'Incluido con 4096 niveles de presión' }
      ],
      'MacBook Air M2': [
        { label: 'Pantalla', value: '13.6" Liquid Retina' },
        { label: 'Procesador', value: 'Apple M2 8-core CPU' },
        { label: 'Memoria', value: '8GB RAM unificada' },
        { label: 'Almacenamiento', value: '256GB SSD' },
        { label: 'Batería', value: 'Hasta 18 horas' },
        { label: 'Peso', value: '1.24 kg' }
      ]
    };

    return specs[title] || [
      { label: 'Garantía', value: '12 meses oficial' },
      { label: 'Origen', value: 'Importado oficial' },
      { label: 'Envío', value: 'Gratis a todo el país' },
      { label: 'Instalación', value: 'Disponible' }
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
    const mainImage = document.getElementById('mainQuickViewImage');
    const thumbnails = document.querySelectorAll('.thumbnail');
    const indicators = document.querySelectorAll('.image-indicators .indicator');

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
    color: var(--white);
    border: none;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--font-size-lg);
    transition: all var(--transition-fast);
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
    color: var(--white);
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
    color: var(--white);
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

  /* Responsive */
  @media (max-width: 768px) {
    .quick-view-content {
      width: 100%;
      height: 100vh;
      border-radius: 0;
      max-height: none;
    }

    .quick-view-body {
      grid-template-columns: 1fr;
      gap: var(--spacing-6);
      padding: var(--spacing-6) var(--spacing-4);
    }

    .thumbnail-grid {
      grid-template-columns: repeat(4, 1fr);
    }

    .action-buttons {
      grid-template-columns: 1fr;
    }

    .product-title {
      font-size: var(--font-size-xl);
    }

    .current-price {
      font-size: var(--font-size-2xl);
    }
  }
`;

document.head.appendChild(quickViewStyle);

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  window.quickViewManager = new QuickViewManager();
});