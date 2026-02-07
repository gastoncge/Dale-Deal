// =====================================================
// DALE DEAL - Product Detail Page Loader
// =====================================================

class ProductDetailLoader {
  constructor() {
    this.product = null;
    this.selectedColor = null;
    this.selectedStorage = null;
    this.currentImageIndex = 0;
    this.init();
  }

  async init() {
    try {
      // Obtener ID del producto desde localStorage
      const productId = localStorage.getItem('selectedProductId');

      if (!productId) {
        this.showError('No se especificó un producto');
        return;
      }

      // Cargar producto
      await this.loadProduct(productId);

      // Renderizar producto
      if (this.product) {
        this.renderProduct();
        this.bindEvents();
      }

      console.log('✓ Product detail page initialized');

    } catch (error) {
      console.error('Error initializing product page:', error);
      this.showError('Error al cargar el producto');
    }
  }

  /**
   * Carga el producto desde la API
   */
  async loadProduct(productId) {
    try {
      this.product = await window.DaleDeal.api.fetchProductById(productId);

      if (!this.product) {
        this.showError('Producto no encontrado');
        return;
      }

      // Establecer valores por defecto
      if (this.product.colors && this.product.colors.length > 0) {
        this.selectedColor = this.product.colors[0].value;
      }

      if (this.product.storage && this.product.storage.length > 0) {
        this.selectedStorage = this.product.storage[0].size;
      }

      console.log('✓ Product loaded:', this.product.title);

    } catch (error) {
      console.error('Error loading product:', error);
      throw error;
    }
  }

  /**
   * Renderiza el producto en la página
   */
  renderProduct() {
    // Actualizar título de la página
    document.title = `${this.product.title} - DALE DEAL`;

    // Actualizar meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.content = this.product.description;
    }

    // Actualizar breadcrumb
    this.updateBreadcrumb();

    // Actualizar galería de imágenes
    this.updateGallery();

    // Actualizar información del producto
    this.updateProductInfo();

    // Actualizar opciones (colores, almacenamiento)
    this.updateProductOptions();

    // Actualizar especificaciones
    this.updateSpecifications();

    // Actualizar características
    this.updateFeatures();
  }

  /**
   * Actualiza el breadcrumb
   */
  updateBreadcrumb() {
    const breadcrumb = document.querySelector('.breadcrumb');
    if (breadcrumb) {
      breadcrumb.innerHTML = `
        <li class="breadcrumb-item"><a href="../index.html">Inicio</a></li>
        <li class="breadcrumb-item"><a href="./productos.html">${this.product.category}</a></li>
        <li class="breadcrumb-item"><a href="./productos.html">${this.product.subcategory}</a></li>
        <li class="breadcrumb-item active">${this.product.title}</li>
      `;
    }
  }

  /**
   * Actualiza la galería de imágenes
   */
  updateGallery() {
    const mainImage = document.getElementById('mainProductImage');
    const thumbnailContainer = document.querySelector('.thumbnail-container');

    if (mainImage && this.product.images?.main) {
      mainImage.src = this.product.images.main;
      mainImage.alt = this.product.title;
    }

    if (thumbnailContainer && this.product.images?.thumbnails) {
      thumbnailContainer.innerHTML = this.product.images.thumbnails.map((thumb, index) => `
        <img
          src="${thumb}"
          alt="${this.product.title} - Vista ${index + 1}"
          class="thumbnail ${index === 0 ? 'active' : ''}"
          data-full="${this.product.images.gallery[index]}"
          data-index="${index}"
        />
      `).join('');
    }

    // Actualizar badge de descuento
    const badge = document.querySelector('.product-badge.sale');
    if (badge) {
      if (this.product.discount && this.product.discount > 0) {
        badge.textContent = `-${this.product.discount}%`;
        badge.style.display = 'block';
      } else {
        badge.style.display = 'none';
      }
    }
  }

  /**
   * Actualiza la información del producto
   */
  updateProductInfo() {
    // Título
    const titleElement = document.querySelector('.product-title, h1');
    if (titleElement) {
      titleElement.textContent = this.product.title;
    }

    // Rating
    const ratingElement = document.querySelector('.product-rating .rating-value');
    if (ratingElement) {
      ratingElement.textContent = this.product.rating;
    }

    const reviewsElement = document.querySelector('.product-rating .reviews-count');
    if (reviewsElement) {
      reviewsElement.textContent = `(${this.product.reviewCount.toLocaleString('es-AR')} reseñas)`;
    }

    // Precio
    const priceElement = document.querySelector('.product-price');
    if (priceElement) {
      const formattedPrice = window.DaleDeal.utils.formatCurrency(this.product.price);

      if (this.product.discount && this.product.discount > 0) {
        const originalPrice = window.DaleDeal.utils.formatCurrency(this.product.originalPrice);
        priceElement.innerHTML = `
          <span class="current-price">${formattedPrice}</span>
          <span class="original-price">${originalPrice}</span>
          <span class="discount-badge">-${this.product.discount}%</span>
        `;
      } else {
        priceElement.innerHTML = `<span class="current-price">${formattedPrice}</span>`;
      }
    }

    // Descripción
    const descElement = document.querySelector('.product-description');
    if (descElement) {
      descElement.textContent = this.product.description;
    }

    // Stock
    const stockElement = document.querySelector('.product-stock');
    if (stockElement) {
      const stockStatus = this.product.stock > 0 ?
        `<i class="bi bi-check-circle text-success"></i> ${this.product.stock} unidades disponibles` :
        `<i class="bi bi-x-circle text-danger"></i> Sin stock`;
      stockElement.innerHTML = stockStatus;
    }
  }

  /**
   * Actualiza las opciones del producto (colores, almacenamiento)
   */
  updateProductOptions() {
    // Colores
    const colorsContainer = document.querySelector('.product-colors');
    if (colorsContainer && this.product.colors && this.product.colors.length > 0) {
      colorsContainer.innerHTML = `
        <h6>Color:</h6>
        <div class="color-options">
          ${this.product.colors.map(color => `
            <button
              class="color-option ${color.value === this.selectedColor ? 'active' : ''}"
              data-color="${color.value}"
              title="${color.name}"
              style="background-color: ${color.color}"
            >
              ${color.value === this.selectedColor ? '<i class="bi bi-check"></i>' : ''}
            </button>
          `).join('')}
        </div>
        <p class="selected-color-name">${this.product.colors.find(c => c.value === this.selectedColor)?.name || ''}</p>
      `;
    }

    // Almacenamiento
    const storageContainer = document.querySelector('.product-storage');
    if (storageContainer && this.product.storage && this.product.storage.length > 1) {
      storageContainer.innerHTML = `
        <h6>Almacenamiento:</h6>
        <div class="storage-options">
          ${this.product.storage.map(storage => `
            <button
              class="storage-option ${storage.size === this.selectedStorage ? 'active' : ''}"
              data-storage="${storage.size}"
            >
              <span class="storage-size">${storage.size}</span>
              ${storage.price > 0 ? `<span class="storage-price">${storage.label}</span>` : ''}
            </button>
          `).join('')}
        </div>
      `;
    }
  }

  /**
   * Actualiza las especificaciones técnicas
   */
  updateSpecifications() {
    const specsContainer = document.querySelector('.product-specifications');
    if (!specsContainer || !this.product.specifications) return;

    let specsHTML = '<h5>Especificaciones Técnicas</h5><div class="specs-grid">';

    // Iterar sobre cada sección de especificaciones
    Object.keys(this.product.specifications).forEach(category => {
      const specs = this.product.specifications[category];

      specsHTML += `<div class="spec-category">`;
      specsHTML += `<h6>${this.capitalizeFirst(category)}</h6>`;
      specsHTML += `<ul class="spec-list">`;

      Object.keys(specs).forEach(key => {
        const label = this.formatLabel(key);
        const value = specs[key];
        specsHTML += `<li><span class="spec-label">${label}:</span> <span class="spec-value">${value}</span></li>`;
      });

      specsHTML += `</ul></div>`;
    });

    specsHTML += '</div>';
    specsContainer.innerHTML = specsHTML;
  }

  /**
   * Actualiza las características destacadas
   */
  updateFeatures() {
    const featuresContainer = document.querySelector('.product-features-list');
    if (!featuresContainer || !this.product.features) return;

    featuresContainer.innerHTML = this.product.features.map(feature => `
      <li><i class="bi bi-check-circle-fill text-success"></i> ${feature}</li>
    `).join('');
  }

  /**
   * Bind eventos de interacción
   */
  bindEvents() {
    // Thumbnails de galería
    document.querySelectorAll('.thumbnail').forEach(thumb => {
      thumb.addEventListener('click', (e) => {
        const fullImage = e.target.dataset.full;
        const mainImage = document.getElementById('mainProductImage');

        if (mainImage && fullImage) {
          mainImage.src = fullImage;
        }

        // Actualizar thumbnail activo
        document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
      });
    });

    // Selector de colores
    document.querySelectorAll('.color-option').forEach(option => {
      option.addEventListener('click', (e) => {
        this.selectedColor = e.currentTarget.dataset.color;
        this.updateProductOptions();
      });
    });

    // Selector de almacenamiento
    document.querySelectorAll('.storage-option').forEach(option => {
      option.addEventListener('click', (e) => {
        this.selectedStorage = e.currentTarget.dataset.storage;
        this.updateProductOptions();
        this.updatePrice();
      });
    });

    // Botón agregar al carrito
    const addToCartBtn = document.getElementById('addToCartBtn');
    if (addToCartBtn) {
      addToCartBtn.addEventListener('click', () => this.addToCart());
    }

    // Botón agregar a favoritos
    const addToFavBtn = document.getElementById('addToFavoritesBtn');
    if (addToFavBtn) {
      addToFavBtn.addEventListener('click', () => this.addToFavorites());
    }
  }

  /**
   * Actualiza el precio según las opciones seleccionadas
   */
  updatePrice() {
    const selectedStorageOption = this.product.storage?.find(s => s.size === this.selectedStorage);
    if (!selectedStorageOption) return;

    const basePrice = this.product.price;
    const additionalPrice = selectedStorageOption.price || 0;
    const totalPrice = basePrice + additionalPrice;

    const priceElement = document.querySelector('.product-price .current-price');
    if (priceElement) {
      priceElement.textContent = window.DaleDeal.utils.formatCurrency(totalPrice);
    }
  }

  /**
   * Agrega el producto al carrito
   */
  addToCart() {
    if (!window.cartManager) {
      console.error('Cart manager not available');
      return;
    }

    const cartItem = {
      id: this.product.id,
      title: this.product.title,
      price: this.calculateFinalPrice(),
      image: this.product.images.main,
      quantity: 1,
      color: this.selectedColor,
      storage: this.selectedStorage
    };

    window.cartManager.addItem(cartItem);

    // Notificación
    if (window.DaleDeal?.utils?.showNotification) {
      window.DaleDeal.utils.showNotification('Producto agregado al carrito', 'success');
    }
  }

  /**
   * Agrega el producto a favoritos
   */
  addToFavorites() {
    if (!window.favoriteManager) {
      console.error('Favorite manager not available');
      return;
    }

    window.favoriteManager.toggleFavorite(this.product.id);
  }

  /**
   * Calcula el precio final con opciones seleccionadas
   */
  calculateFinalPrice() {
    const selectedStorageOption = this.product.storage?.find(s => s.size === this.selectedStorage);
    const additionalPrice = selectedStorageOption?.price || 0;
    return this.product.price + additionalPrice;
  }

  /**
   * Capitaliza la primera letra
   */
  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Formatea labels (camelCase a Title Case)
   */
  formatLabel(str) {
    return str.replace(/([A-Z])/g, ' $1')
              .replace(/^./, s => s.toUpperCase())
              .trim();
  }

  /**
   * Muestra error
   */
  showError(message) {
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.innerHTML = `
        <div class="container py-5">
          <div class="alert alert-danger text-center" role="alert">
            <i class="bi bi-exclamation-triangle display-1 mb-3"></i>
            <h4>${message}</h4>
            <p>Por favor, intenta nuevamente o <a href="../index.html">vuelve al inicio</a></p>
          </div>
        </div>
      `;
    }
  }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (window.DaleDeal?.api && window.location.pathname.includes('producto.html')) {
      window.productDetailLoader = new ProductDetailLoader();
    }
  });
} else {
  if (window.DaleDeal?.api && window.location.pathname.includes('producto.html')) {
    window.productDetailLoader = new ProductDetailLoader();
  }
}

// Exportar
if (typeof window !== 'undefined') {
  window.ProductDetailLoader = ProductDetailLoader;
}
