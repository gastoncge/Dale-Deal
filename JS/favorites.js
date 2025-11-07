/**
 * DALE DEAL - Sistema de Favoritos
 * Maneja la funcionalidad de productos favoritos
 */

class FavoritesManager {
  constructor() {
    this.storageKey = 'daledealt_favorites';
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
      console.error('Error cargando favoritos:', error);
      return [];
    }
  }

  // Guardar favoritos en localStorage
  saveFavorites() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.favorites));
    } catch (error) {
      console.error('Error guardando favoritos:', error);
    }
  }

  // Vincular eventos
  bindEvents() {
    // Event delegation para botones de corazón
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
          goToProduct(parseInt(productId));
        }
      }
    });

    // Enlace de favoritos en el menú
    document.addEventListener('click', (e) => {
      if (e.target.closest('#favoritesLink')) {
        e.preventDefault();
        this.showFavoritesModal();
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

  // Manejar clic en favorito
  handleFavoriteClick(e) {
    // Prevenir que se ejecute el onclick de la card
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    
    const button = e.target.closest('.action-heart');
    const productCard = button.closest('.product-card');
    
    if (!productCard) return;

    const productId = productCard.dataset.id;
    const productData = this.extractProductData(productCard);

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

  // Manejar clic en wishlist de producto
  handleProductWishlistClick(e) {
    const productId = localStorage.getItem('selectedProductId') || '1';
    
    if (!window.getProductById) {
      console.error('Product data not available');
      return;
    }

    const productData = window.getProductById(parseInt(productId));
    if (!productData) return;

    const favoriteData = {
      id: productData.id.toString(),
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
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
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
          title: productData.title,
          priceText: this.formatPrice(productData.price),
          originalPriceText: productData.originalPrice ? this.formatPrice(productData.originalPrice) : '',
          imageUrl: productData.images.main,
          rating: productData.rating,
          ratingCount: `(${productData.reviewCount.toLocaleString()})`,
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
    const ratingCount = productCard.querySelector('.rating-count')?.textContent || '(0)';

    return {
      id,
      title,
      priceText,
      originalPriceText,
      imageUrl,
      rating,
      ratingCount,
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
    return this.favorites.some(fav => fav.id === productId);
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
    this.favorites = this.favorites.filter(fav => fav.id !== productId);
    this.saveFavorites();
  }

  // Actualizar todos los botones de favoritos
  updateFavoriteButtons() {
    document.querySelectorAll('.action-heart').forEach(button => {
      const productCard = button.closest('.product-card');
      if (productCard) {
        const productId = productCard.dataset.id;
        this.updateFavoriteButton(button, this.isFavorite(productId));
      }
    });
  }

  // Actualizar estado visual del botón
  updateFavoriteButton(button, isFavorite) {
    const icon = button.querySelector('i');
    if (icon) {
      icon.className = isFavorite ? 'bi bi-heart-fill' : 'bi bi-heart';
      button.classList.toggle('active', isFavorite);
      button.style.color = isFavorite ? 'var(--primary-red)' : '';
    }
  }

  // Actualizar botón de wishlist en página de producto
  updateWishlistButton() {
    const wishlistBtn = document.querySelector('.btn-wishlist');
    if (!wishlistBtn) return;

    const productId = localStorage.getItem('selectedProductId') || '1';
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
    const modal = new bootstrap.Modal(document.getElementById('favoritesModal'));
    this.renderFavoritesContent();
    modal.show();
  }

  // Renderizar contenido de favoritos
  renderFavoritesContent() {
    const favoritesEmpty = document.getElementById('favoritesEmpty');
    const favoritesGrid = document.getElementById('favoritesGrid');
    const favoritesTotal = document.getElementById('favoritesTotal');

    if (this.favorites.length === 0) {
      favoritesEmpty.style.display = 'block';
      favoritesGrid.style.display = 'none';
      favoritesTotal.textContent = '0';
      return;
    }

    favoritesEmpty.style.display = 'none';
    favoritesGrid.style.display = 'block';
    favoritesTotal.textContent = this.favorites.length;

    const favoritesHTML = this.favorites.map(favorite => `
      <div class="col-md-6 col-lg-4 mb-4">
        <div class="product-card favorite-product-card" data-id="${favorite.id}">
          <div class="product-image-container">
            <img src="${favorite.imageUrl}" alt="${favorite.title}" class="product-image active">

            <div class="product-actions-favorite">
              <button class="action-remove-favorite" title="Eliminar de favoritos" onclick="event.stopPropagation(); window.favoritesManager.removeFromFavoritesModal('${favorite.id}')">
                <i class="bi bi-x"></i>
              </button>
            </div>
          </div>

          <div class="product-info">
            <h3 class="product-title">${favorite.title}</h3>

            <div class="product-meta-group">
              <div class="product-rating">
                <div class="stars">${this.renderStars(favorite.rating)}</div>
                <span class="reviews-count">${favorite.ratingCount}</span>
              </div>
            </div>

            <div class="product-pricing-wrapper">
              <div class="product-pricing">
                <span class="product-current-price">${favorite.priceText}</span>
                ${favorite.originalPriceText ? `<span class="product-original-price">${favorite.originalPriceText}</span>` : ''}
              </div>
              <div class="favorite-actions-buttons">
                <button class="btn-add-to-cart" onclick="event.stopPropagation(); window.favoritesManager.addToCartFromFavorites('${favorite.id}')">
                  <i class="bi bi-cart-plus me-2"></i>Agregar al carrito
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `).join('');

    favoritesGrid.innerHTML = `<div class="row">${favoritesHTML}</div>`;
  }

  // Remover desde el modal
  removeFromFavoritesModal(productId) {
    this.removeFromFavorites(productId);
    this.renderFavoritesContent();
    this.updateFavoriteButtons();
    
    const favorite = this.favorites.find(fav => fav.id === productId) || { title: 'Producto' };
    this.showToast(`${favorite.title} eliminado de favoritos`, 'info');
  }

  // Ir al producto
  goToProduct(productId) {
    localStorage.setItem('selectedProductId', productId);
    
    if (window.location.pathname.includes('producto.html')) {
      // Recargar la página de producto con el nuevo ID
      window.location.reload();
    } else {
      // Navegar a la página de producto desde index
      window.location.href = './HTML/producto.html';
    }
  }

  // Ir al inicio
  goToHome() {
    if (window.location.pathname.includes('producto.html')) {
      window.location.href = '../index.html';
    } else {
      // Ya estamos en el inicio, solo cerrar el modal y hacer scroll a productos
      const modal = bootstrap.Modal.getInstance(document.getElementById('favoritesModal'));
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
      const priceMatch = favorite.priceText.match(/[\d,]+/);
      const price = priceMatch ? parseFloat(priceMatch[0].replace(/,/g, '')) : 0;
      
      const product = {
        id: `favorite-${favorite.id}`,
        title: favorite.title,
        price: price,
        image: favorite.imageUrl,
        quantity: 1
      };
      
      window.cartManager.addItem(product);
      this.showToast(`${favorite.title} agregado al carrito`, 'success');
    } catch (error) {
      console.error('Error agregando producto al carrito:', error);
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
        // Extraer el precio numérico del texto formateado
        const priceMatch = favorite.priceText.match(/[\d,]+/);
        const price = priceMatch ? parseFloat(priceMatch[0].replace(/,/g, '')) : 0;
        
        const product = {
          id: `favorite-${favorite.id}`,
          title: favorite.title,
          price: price,
          image: favorite.imageUrl,
          quantity: 1
        };
        
        window.cartManager.addItem(product);
        addedCount++;
      } catch (error) {
        console.error('Error agregando producto al carrito:', error);
      }
    });

    const modal = bootstrap.Modal.getInstance(document.getElementById('favoritesModal'));
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
      console.log(`[FAVORITES ${type.toUpperCase()}] ${message}`);
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
    color: var(--primary-red) !important;
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

  /* Estilos para cards de favoritos - idénticos al catálogo principal */
  .favorite-product-card {
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    background: var(--white);
    border-radius: var(--radius-2xl);
    overflow: hidden;
    box-shadow: var(--shadow-sm);
    border: 1px solid var(--gray-100);
    position: relative;
    cursor: pointer;
    height: auto;
    min-height: 420px;
    display: flex;
    flex-direction: column;
  }

  /* Hover sin borde rojo - solo elevación y sombra */
  .favorite-product-card:hover {
    transform: translateY(-8px);
    box-shadow: var(--shadow-2xl);
  }

  .favorite-product-card .product-image-container {
    position: relative;
    width: 100%;
    height: 250px;
    overflow: hidden;
  }

  .favorite-product-card .product-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform var(--transition-slow);
  }

  .favorite-product-card:hover .product-image {
    transform: scale(1.05);
  }

  .favorite-product-card .product-info {
    padding: var(--spacing-4);
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    gap: var(--spacing-3);
  }

  .favorite-product-card .product-title {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--gray-900);
    margin-bottom: 0;
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .favorite-product-card .product-rating {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    font-size: var(--font-size-sm);
  }

  .favorite-product-card .product-rating .stars {
    display: flex;
    gap: 1px;
  }

  .favorite-product-card .product-rating .stars i {
    font-size: var(--font-size-sm);
    color: var(--primary-yellow);
  }

  .favorite-product-card .rating-text {
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--gray-700);
  }

  .favorite-product-card .reviews-count {
    font-size: var(--font-size-xs);
    color: var(--gray-500);
  }

  .favorite-product-card .product-pricing {
    display: flex;
    align-items: center;
    gap: var(--spacing-2);
    flex-wrap: wrap;
  }

  .favorite-product-card .product-current-price {
    font-size: var(--font-size-xl);
    font-weight: 700;
    color: var(--primary-red);
  }

  .favorite-product-card .product-original-price {
    font-size: var(--font-size-base);
    color: var(--gray-500);
    text-decoration: line-through;
  }

  /* Botón de eliminar en esquina superior derecha */
  .product-actions-favorite {
    position: absolute;
    top: var(--spacing-3);
    right: var(--spacing-3);
    z-index: 4;
  }

  .action-remove-favorite {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: none;
    background: rgba(220, 38, 38, 0.9);
    color: var(--white);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all var(--transition-base);
    backdrop-filter: blur(10px);
    box-shadow: var(--shadow-md);
  }

  .action-remove-favorite:hover {
    background: var(--error);
    transform: scale(1.1);
  }

  .action-remove-favorite i {
    font-size: var(--font-size-lg);
  }

  /* Botones de acción en la card */
  .favorite-actions-buttons {
    display: flex;
    margin-top: auto;
  }

  .favorite-actions-buttons .btn-add-to-cart {
    width: 100%;
    background: var(--gradient-primary);
    color: var(--white);
    border: none;
    padding: var(--spacing-2) var(--spacing-3);
    border-radius: var(--radius-lg);
    font-size: var(--font-size-sm);
    font-weight: 600;
    cursor: pointer;
    transition: all var(--transition-base);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .favorite-actions-buttons .btn-add-to-cart:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }

  @media (max-width: 768px) {
    .favorite-product-card {
      min-height: 380px;
    }

    .favorite-product-card .product-image-container {
      height: 200px;
    }
  }
`;

document.head.appendChild(favoritesStyle);

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  window.favoritesManager = new FavoritesManager();
});