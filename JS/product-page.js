// =====================================================
// DALE DEAL - Página de Producto
// =====================================================

class ProductPage {
  constructor() {
    this.currentProduct = null;
    this.selectedColor = "blue";
    this.selectedStorage = "256GB";
    this.quantity = 1;
    this.currentImageIndex = 0;
    this.images = [
      "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1567581935884-3349723552ca?w=600&h=600&fit=crop",
    ];

    this.init();
  }

  init() {
    this.loadProductData();
    this.setupEventListeners();
    this.setupImageGallery();
    this.updatePrice();
    this.updateFavoriteButton();
    this.loadSimilarProducts();
    this.loadRecentlyViewed();
    this.saveToRecentlyViewed();
  }

  loadProductData() {
    // Get product ID from localStorage (set from index.html)
    const productId = parseInt(localStorage.getItem('selectedProductId')) || 1;
    
    // Load product data from the global PRODUCTS_DATA
    const productData = window.getProductById ? window.getProductById(productId) : null;
    
    if (!productData) {
      console.error('Product not found:', productId);
      // Redirect back to home page
      window.location.href = '../index.html';
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
      features: productData.features,
      specifications: productData.specifications,
      badges: productData.badges,
      colors: {},
      storage: {},
      images: productData.images
    };

    // Convert colors format
    productData.colors.forEach(color => {
      this.currentProduct.colors[color.value] = {
        name: color.name,
        price: 0,
        color: color.color
      };
    });

    // Convert storage format
    productData.storage.forEach(storage => {
      this.currentProduct.storage[storage.size] = {
        name: storage.size,
        price: storage.price
      };
    });

    // Update the page content
    this.updatePageContent();
  }

  setupEventListeners() {
    // Selectores de color
    document.querySelectorAll(".color-option").forEach((option) => {
      option.addEventListener("click", (e) => {
        this.selectColor(e.target.dataset.color);
      });
    });

    // Selectores de almacenamiento
    document.querySelectorAll(".storage-option").forEach((option) => {
      option.addEventListener("click", (e) => {
        this.selectStorage(e.target.dataset.storage);
      });
    });

    // Controles de cantidad
    document.getElementById("decreaseBtn")?.addEventListener("click", () => {
      this.changeQuantity(-1);
    });

    document.getElementById("increaseBtn")?.addEventListener("click", () => {
      this.changeQuantity(1);
    });

    document
      .getElementById("quantityInput")
      ?.addEventListener("change", (e) => {
        this.setQuantity(Number.parseInt(e.target.value) || 1);
      });

    // Botones de acción
    document.querySelector(".btn-buy-now")?.addEventListener("click", () => {
      this.buyNow();
    });

    document.querySelector(".btn-add-cart")?.addEventListener("click", () => {
      this.addToCart();
    });

    // El botón de wishlist se maneja ahora por el FavoritesManager
    // No necesitamos agregar un listener aquí ya que usa event delegation

    // Botón ver más productos similares
    document.getElementById('viewMoreSimilarBtn')?.addEventListener('click', () => {
      this.goToCategory();
    });
  }

  updatePageContent() {
    // Update title
    const titleEl = document.querySelector('.product-title');
    if (titleEl) titleEl.textContent = this.currentProduct.title;

    // Update breadcrumb
    const breadcrumbCategory = document.querySelector('.breadcrumb-item:nth-child(2) a');
    const breadcrumbSubcategory = document.querySelector('.breadcrumb-item:nth-child(3) a');
    const breadcrumbProduct = document.querySelector('.breadcrumb-item.active');
    if (breadcrumbCategory) breadcrumbCategory.textContent = this.currentProduct.category;
    if (breadcrumbSubcategory) breadcrumbSubcategory.textContent = this.currentProduct.subcategory;
    if (breadcrumbProduct) breadcrumbProduct.textContent = this.currentProduct.title;

    // Update meta title
    document.title = `${this.currentProduct.title} - DALE DEAL`;

    // Update rating
    const ratingText = document.querySelector('.rating-text');
    if (ratingText) {
      ratingText.textContent = `${this.currentProduct.rating} (${this.currentProduct.reviewCount.toLocaleString()} reseñas)`;
    }

    // Update sold count
    const soldCount = document.querySelector('.product-sold span');
    if (soldCount) {
      soldCount.textContent = `+${this.currentProduct.salesCount} vendidos`;
    }

    // Update prices
    const currentPriceEl = document.querySelector('.current-price');
    const originalPriceEl = document.querySelector('.original-price');
    const discountBadgeEl = document.querySelector('.discount-badge');
    
    if (currentPriceEl) currentPriceEl.textContent = this.formatPrice(this.currentProduct.basePrice);
    
    if (this.currentProduct.originalPrice && originalPriceEl) {
      originalPriceEl.textContent = this.formatPrice(this.currentProduct.originalPrice);
      originalPriceEl.style.display = 'inline';
    } else if (originalPriceEl) {
      originalPriceEl.style.display = 'none';
    }

    if (this.currentProduct.discount && discountBadgeEl) {
      discountBadgeEl.textContent = `${this.currentProduct.discount}% OFF`;
      discountBadgeEl.style.display = 'inline';
    } else if (discountBadgeEl) {
      discountBadgeEl.style.display = 'none';
    }

    // Update installments
    const installmentPrice = this.currentProduct.basePrice / 12;
    const installmentsEl = document.querySelector('.installments strong');
    if (installmentsEl) {
      installmentsEl.textContent = this.formatPrice(installmentPrice);
    }

    // Update stock info
    const stockInfo = document.querySelector('.stock-info');
    if (stockInfo) {
      stockInfo.textContent = `Stock disponible: ${this.currentProduct.stock} unidades`;
    }

    // Update color options
    this.updateColorOptions();

    // Update storage options
    this.updateStorageOptions();

    // Update description and features
    this.updateDescriptionTab();
    
    // Update specifications
    this.updateSpecificationsTab();
  }

  updateColorOptions() {
    const colorContainer = document.querySelector('.color-options');
    if (!colorContainer) return;

    colorContainer.innerHTML = '';
    Object.keys(this.currentProduct.colors).forEach((colorKey, index) => {
      const color = this.currentProduct.colors[colorKey];
      const colorDiv = document.createElement('div');
      colorDiv.className = `color-option ${index === 0 ? 'active' : ''}`;
      colorDiv.dataset.color = colorKey;
      colorDiv.style.background = color.color;
      colorDiv.title = color.name;
      
      colorContainer.appendChild(colorDiv);
      
      if (index === 0) {
        this.selectedColor = colorKey;
      }
    });
  }

  updateStorageOptions() {
    const storageContainer = document.querySelector('.storage-options');
    if (!storageContainer) return;

    storageContainer.innerHTML = '';
    Object.keys(this.currentProduct.storage).forEach((storageKey, index) => {
      const storage = this.currentProduct.storage[storageKey];
      const storageDiv = document.createElement('div');
      storageDiv.className = `storage-option ${index === 1 ? 'active' : ''}`; // Make second option active by default
      storageDiv.dataset.storage = storageKey;
      
      const priceText = storage.price === 0 ? 'Base' : 
                       storage.price > 0 ? `+${this.formatPrice(storage.price)}` : 
                       this.formatPrice(storage.price);
      
      storageDiv.innerHTML = `
        ${storageKey}
        <span class="extra-cost">${priceText}</span>
      `;
      
      storageContainer.appendChild(storageDiv);
      
      if (index === 1) { // Select second option by default
        this.selectedStorage = storageKey;
      }
    });
  }

  updateDescriptionTab() {
    // Update main description
    const descriptionEl = document.querySelector('.description-content p');
    if (descriptionEl) {
      descriptionEl.textContent = this.currentProduct.description;
    }

    // Update features list
    const featuresList = document.querySelector('.description-content ul');
    if (featuresList && this.currentProduct.features) {
      featuresList.innerHTML = '';
      this.currentProduct.features.forEach(feature => {
        const li = document.createElement('li');
        li.textContent = feature;
        featuresList.appendChild(li);
      });
    }
  }

  updateSpecificationsTab() {
    const specsContainer = document.querySelector('.specifications-content');
    if (!specsContainer || !this.currentProduct.specifications) return;

    specsContainer.innerHTML = '';
    
    Object.keys(this.currentProduct.specifications).forEach(groupKey => {
      const group = this.currentProduct.specifications[groupKey];
      const groupDiv = document.createElement('div');
      groupDiv.className = 'spec-group';
      
      const groupTitle = document.createElement('h4');
      groupTitle.textContent = this.getSpecGroupTitle(groupKey);
      groupDiv.appendChild(groupTitle);
      
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
    const titles = {
      screen: 'Pantalla',
      display: 'Pantalla',
      performance: 'Rendimiento',
      camera: 'Cámara',
      memory: 'Memoria',
      audio: 'Audio',
      battery: 'Batería',
      connectivity: 'Conectividad',
      video: 'Video',
      smart: 'Smart TV'
    };
    return titles[key] || key.charAt(0).toUpperCase() + key.slice(1);
  }

  getSpecLabel(key) {
    const labels = {
      size: 'Tamaño',
      technology: 'Tecnología',
      resolution: 'Resolución',
      density: 'Densidad',
      chip: 'Chip',
      cpu: 'CPU',
      gpu: 'GPU',
      neuralEngine: 'Neural Engine',
      ram: 'RAM',
      storage: 'Almacenamiento',
      main: 'Principal',
      ultraWide: 'Ultra gran angular',
      telephoto: 'Teleobjetivo',
      opticalZoom: 'Zoom óptico',
      telephoto1: 'Teleobjetivo 1',
      telephoto2: 'Teleobjetivo 2',
      drivers: 'Controladores',
      frequency: 'Frecuencia',
      impedance: 'Impedancia',
      sensitivity: 'Sensibilidad',
      listening: 'Escucha',
      withCase: 'Con estuche',
      talkTime: 'Tiempo de llamada',
      charging: 'Carga rápida',
      bluetooth: 'Bluetooth',
      compatibility: 'Compatibilidad',
      memory: 'Memoria',
      frameRate: 'Tasa de frames',
      rayTracing: 'Ray Tracing',
      hdr: 'HDR',
      output: 'Salida',
      os: 'Sistema operativo',
      wifi: 'Wi-Fi',
      apps: 'Aplicaciones',
      hdmi: 'HDMI',
      usb: 'USB',
      ethernet: 'Ethernet'
    };
    return labels[key] || key.charAt(0).toUpperCase() + key.slice(1);
  }

  setupImageGallery() {
    if (!this.currentProduct.images) return;

    const mainImage = document.querySelector(".main-product-image");
    const thumbnailContainer = document.querySelector(".thumbnail-container");

    // Update main image
    if (mainImage && this.currentProduct.images.main) {
      mainImage.src = this.currentProduct.images.main;
    }

    // Update thumbnails
    if (thumbnailContainer && this.currentProduct.images.thumbnails) {
      thumbnailContainer.innerHTML = '';
      
      this.currentProduct.images.thumbnails.forEach((thumb, index) => {
        const imgEl = document.createElement('img');
        imgEl.src = thumb;
        imgEl.alt = `${this.currentProduct.title} - Vista ${index + 1}`;
        imgEl.className = `thumbnail ${index === 0 ? 'active' : ''}`;
        imgEl.dataset.full = this.currentProduct.images.gallery[index];
        
        imgEl.addEventListener('click', () => {
          // Update main image
          mainImage.src = this.currentProduct.images.gallery[index];
          
          // Update active thumbnail
          thumbnailContainer.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
          imgEl.classList.add('active');
        });
        
        thumbnailContainer.appendChild(imgEl);
      });
    }

    // Update product badge if there's a discount
    const badgeEl = document.querySelector('.product-badge');
    if (badgeEl && this.currentProduct.discount) {
      badgeEl.textContent = `${this.currentProduct.discount}% OFF`;
    } else if (badgeEl) {
      badgeEl.style.display = 'none';
    }
  }

  selectColor(color) {
    if (!this.currentProduct.colors[color]) return;

    this.selectedColor = color;

    // Actualizar UI
    document.querySelectorAll(".color-option").forEach((option) => {
      option.classList.remove("active");
    });
    document.querySelector(`[data-color="${color}"]`)?.classList.add("active");

    this.updatePrice();
    this.showNotification(
      `Color seleccionado: ${this.currentProduct.colors[color].name}`,
      "info"
    );
  }

  selectStorage(storage) {
    if (!this.currentProduct.storage[storage]) return;

    this.selectedStorage = storage;

    // Actualizar UI
    document.querySelectorAll(".storage-option").forEach((option) => {
      option.classList.remove("active");
    });
    document
      .querySelector(`[data-storage="${storage}"]`)
      ?.classList.add("active");

    this.updatePrice();
    this.showNotification(`Almacenamiento seleccionado: ${storage}`, "info");
  }

  changeQuantity(delta) {
    const newQuantity = this.quantity + delta;
    this.setQuantity(newQuantity);
  }

  setQuantity(quantity) {
    const maxQuantity = Math.min(this.currentProduct.stock, 10);
    this.quantity = Math.max(1, Math.min(quantity, maxQuantity));

    const input = document.getElementById("quantityInput");
    if (input) {
      input.value = this.quantity;
    }

    this.updatePrice();
  }

  updatePrice() {
    const basePrice = this.currentProduct.basePrice;
    const storagePrice =
      this.currentProduct.storage[this.selectedStorage].price;
    const colorPrice = this.currentProduct.colors[this.selectedColor].price;
    const totalPrice = (basePrice + storagePrice + colorPrice) * this.quantity;

    // Actualizar precio actual
    const currentPriceEl = document.querySelector(".current-price");
    if (currentPriceEl) {
      currentPriceEl.textContent = this.formatPrice(totalPrice);
    }

    // Actualizar cuotas
    const installmentPrice = totalPrice / 12;
    const installmentsEl = document.querySelector(".installments .highlight");
    if (installmentsEl) {
      installmentsEl.textContent = this.formatPrice(installmentPrice);
    }
  }

  changeMainImage(index) {
    if (index < 0 || index >= this.images.length) return;

    this.currentImageIndex = index;

    // Actualizar imagen principal
    const mainImage = document.querySelector(".main-product-image");
    if (mainImage) {
      mainImage.style.opacity = "0";
      setTimeout(() => {
        mainImage.src = this.images[index];
        mainImage.style.opacity = "1";
      }, 150);
    }

    // Actualizar miniaturas activas
    document.querySelectorAll(".thumbnail-item").forEach((thumb, i) => {
      thumb.classList.toggle("active", i === index);
    });
  }

  async addToCart() {
    const button = document.querySelector(".btn-add-cart");
    this.setButtonLoading(button, true);

    try {
      // Simular delay de API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const productData = {
        id: `${this.currentProduct.id}-${this.selectedColor}-${this.selectedStorage}`,
        title: `${this.currentProduct.title} - ${
          this.currentProduct.colors[this.selectedColor].name
        }`,
        price: this.calculateUnitPrice(),
        image: this.images[this.currentImageIndex],
        quantity: this.quantity,
        color: this.selectedColor,
        storage: this.selectedStorage,
      };

      // Usar el CartManager global
      if (window.cartManager) {
        window.cartManager.addItem(productData);
      } else {
        // Fallback si no está disponible
        this.showNotification("Producto agregado al carrito", "success");
      }
    } catch (error) {
      console.error("Error agregando al carrito:", error);
      this.showNotification("Error al agregar al carrito", "error");
    } finally {
      this.setButtonLoading(button, false);
    }
  }

  async buyNow() {
    const button = document.querySelector(".btn-buy-now");
    this.setButtonLoading(button, true);

    try {
      // Simular proceso de compra
      await new Promise((resolve) => setTimeout(resolve, 1500));

      this.showNotification("Redirigiendo al checkout...", "info");

      // En una app real, aquí redirigirías al checkout
      setTimeout(() => {
        console.log("¡Gracias por tu compra! En una implementación real, aquí se procesaría el pago.");
      }, 1000);
    } catch (error) {
      console.error("Error en compra:", error);
      this.showNotification("Error al procesar la compra", "error");
    } finally {
      this.setButtonLoading(button, false);
    }
  }

  updateFavoriteButton() {
    // Esperar a que el FavoritesManager esté disponible
    setTimeout(() => {
      if (window.favoritesManager) {
        window.favoritesManager.updateWishlistButton();
      }
    }, 100);
  }

  calculateUnitPrice() {
    const basePrice = this.currentProduct.basePrice;
    const storagePrice =
      this.currentProduct.storage[this.selectedStorage].price;
    const colorPrice = this.currentProduct.colors[this.selectedColor].price;
    return basePrice + storagePrice + colorPrice;
  }

  formatPrice(price) {
    // Usar la función global de utils si está disponible
    if (window.DaleDeal?.utils?.formatPrice) {
      return window.DaleDeal.utils.formatPrice(price);
    }
    
    // Fallback
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  }

  setButtonLoading(button, isLoading) {
    if (!button) return;

    if (isLoading) {
      button.classList.add("btn-loading");
      button.disabled = true;
    } else {
      button.classList.remove("btn-loading");
      button.disabled = false;
    }
  }

  showNotification(message, type = "info") {
    // Usar el sistema de notificaciones global si está disponible
    if (window.DaleDeal?.utils?.showNotification) {
      window.DaleDeal.utils.showNotification(message, type);
      return;
    }

    // Fallback simple
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // Mostrar en consola como último recurso
    if (type === "error") {
      console.error(`Error: ${message}`);
    }
  }

  // Cargar productos similares
  async loadSimilarProducts() {
    const similarGrid = document.getElementById('similarProductsGrid');
    if (!similarGrid || !this.currentProduct) return;

    try {
      // Simular delay de carga
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Obtener productos de la misma categoría
      const allProducts = window.getAllProducts ? window.getAllProducts() : [];
      const similarProducts = allProducts
        .filter(product => 
          product.category === this.currentProduct.category && 
          product.id !== this.currentProduct.id
        )
        .slice(0, 4); // Mostrar máximo 4 productos

      if (similarProducts.length === 0) {
        // Si no hay productos de la misma categoría, mostrar productos aleatorios
        const randomProducts = allProducts
          .filter(product => product.id !== this.currentProduct.id)
          .sort(() => 0.5 - Math.random())
          .slice(0, 4);
        
        this.renderSimilarProducts(randomProducts, true);
      } else {
        this.renderSimilarProducts(similarProducts, false);
      }
    } catch (error) {
      console.error('Error cargando productos similares:', error);
      similarGrid.innerHTML = `
        <div class="error-similar-products text-center py-5">
          <i class="bi bi-exclamation-triangle display-4 text-warning mb-3"></i>
          <h5 class="text-muted">Error cargando productos similares</h5>
          <p class="text-muted">Inténtalo de nuevo más tarde</p>
        </div>
      `;
    }
  }

  renderSimilarProducts(products, isRandom = false) {
    const similarGrid = document.getElementById('similarProductsGrid');
    if (!similarGrid) return;

    // Crear slides de carrusel - cada slide muestra múltiples productos
    const productsPerSlide = window.innerWidth < 768 ? 1 : window.innerWidth < 1024 ? 2 : 4;
    const slides = [];
    
    for (let i = 0; i < products.length; i += productsPerSlide) {
      const slideProducts = products.slice(i, i + productsPerSlide);
      const slideHTML = `
        <div class="carousel-item ${i === 0 ? 'active' : ''}">
          <div class="row justify-content-center">
            ${slideProducts.map(product => `
              <div class="col-12 col-md-6 col-lg-3 mb-4 d-flex">
                <div class="product-card similar-product-card w-100" data-id="${product.id}" data-clickable="true">
                  <div class="product-image-container">
                    <img
                      src="${product.images.main}"
                      alt="${product.title}"
                      class="product-image"
                    />
                    ${product.discount ? `<div class="product-badges"><span class="badge-offer">-${product.discount}%</span></div>` : ''}
                    <div class="product-actions">
                      <button class="action-heart" title="Agregar a favoritos" data-product-id="${product.id}">
                        <i class="bi bi-heart"></i>
                      </button>
                    </div>
                  </div>
                  <div class="product-info">
                    <h3 class="product-title">${product.title}</h3>
                    <p class="product-description">${product.description ? (product.description.length > 80 ? product.description.substring(0, 80) + '...' : product.description) : 'Producto de alta calidad con excelentes características.'}</p>

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
                      <div class="product-pricing">
                        <span class="product-current-price">${this.formatPrice(product.price)}</span>
                        ${product.originalPrice ? `<span class="product-original-price">${this.formatPrice(product.originalPrice)}</span>` : ''}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
          ${isRandom && i === 0 ? `
            <div class="random-products-notice text-center mt-4">
              <small class="text-muted">
                <i class="bi bi-info-circle me-1"></i>
                Mostrando productos recomendados ya que no hay productos similares disponibles
              </small>
            </div>
          ` : ''}
        </div>
      `;
      slides.push(slideHTML);
    }

    similarGrid.innerHTML = slides.join('');

    // Mostrar/ocultar controles según la cantidad de slides
    const carousel = document.getElementById('similarProductsCarousel');
    const prevBtn = carousel.querySelector('.carousel-control-prev');
    const nextBtn = carousel.querySelector('.carousel-control-next');
    
    if (slides.length <= 1) {
      prevBtn.style.display = 'none';
      nextBtn.style.display = 'none';
    } else {
      prevBtn.style.display = 'flex';
      nextBtn.style.display = 'flex';
    }

    // Actualizar botones de favoritos
    setTimeout(() => {
      if (window.favoritesManager) {
        window.favoritesManager.updateFavoriteButtons();
      }
    }, 100);
  }

  renderProductStars(rating) {
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

  renderShippingBadges(shipping) {
    if (!shipping) return '';

    let badgesHTML = '';

    // Badge de envío gratis
    if (shipping.free) {
      badgesHTML += `
        <div class="shipping-badge shipping-free">
          <i class="bi bi-truck"></i>
          <span>Envío gratis</span>
        </div>
      `;
    }

    // Badge de velocidad de entrega
    if (shipping.speed === 'today') {
      badgesHTML += `
        <div class="shipping-badge shipping-fast">
          <i class="bi bi-lightning-charge-fill"></i>
          <span>Llega hoy</span>
        </div>
      `;
    } else if (shipping.speed === 'tomorrow') {
      badgesHTML += `
        <div class="shipping-badge shipping-fast">
          <i class="bi bi-clock-fill"></i>
          <span>Llega mañana</span>
        </div>
      `;
    }

    return badgesHTML ? `<div class="shipping-badges">${badgesHTML}</div>` : '';
  }

  // Cargar productos vistos recientemente
  loadRecentlyViewed() {
    const recentlyViewedGrid = document.getElementById('recentlyViewedGrid');
    if (!recentlyViewedGrid) return;

    try {
      const recentProducts = this.getRecentlyViewed()
        .filter(productId => productId !== this.currentProduct.id.toString()) // Excluir el producto actual
        .slice(0, 4); // Mostrar máximo 4 productos

      if (recentProducts.length === 0) {
        return; // Mantener el mensaje por defecto
      }

      const productsData = recentProducts
        .map(productId => window.getProductById ? window.getProductById(parseInt(productId)) : null)
        .filter(product => product !== null);

      if (productsData.length === 0) return;

      this.renderRecentlyViewed(productsData);
    } catch (error) {
      console.error('Error cargando productos vistos recientemente:', error);
    }
  }

  renderRecentlyViewed(products) {
    const recentlyViewedGrid = document.getElementById('recentlyViewedGrid');
    if (!recentlyViewedGrid) return;

    // Crear slides de carrusel - cada slide muestra múltiples productos
    const productsPerSlide = window.innerWidth < 768 ? 1 : window.innerWidth < 1024 ? 2 : 4;
    const slides = [];
    
    for (let i = 0; i < products.length; i += productsPerSlide) {
      const slideProducts = products.slice(i, i + productsPerSlide);
      const slideHTML = `
        <div class="carousel-item ${i === 0 ? 'active' : ''}">
          <div class="row justify-content-center">
            ${slideProducts.map(product => `
              <div class="col-12 col-md-6 col-lg-3 mb-4 d-flex">
                <div class="product-card recent-product-card w-100" data-id="${product.id}" data-clickable="true">
                  <div class="product-image-container">
                    <img
                      src="${product.images.main}"
                      alt="${product.title}"
                      class="product-image"
                    />
                    <div class="recently-viewed-badge">
                      <i class="bi bi-clock-history"></i>
                    </div>
                    <div class="product-actions">
                      <button class="action-heart" title="Agregar a favoritos" data-product-id="${product.id}">
                        <i class="bi bi-heart"></i>
                      </button>
                    </div>
                  </div>
                  <div class="product-info">
                    <h3 class="product-title">${product.title}</h3>
                    <p class="product-description">${product.description ? (product.description.length > 80 ? product.description.substring(0, 80) + '...' : product.description) : 'Producto de alta calidad con excelentes características.'}</p>

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
                      <div class="product-pricing">
                        <span class="product-current-price">${this.formatPrice(product.price)}</span>
                        ${product.originalPrice ? `<span class="product-original-price">${this.formatPrice(product.originalPrice)}</span>` : ''}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `;
      slides.push(slideHTML);
    }

    recentlyViewedGrid.innerHTML = slides.join('');

    // Mostrar/ocultar controles según la cantidad de slides
    const carousel = document.getElementById('recentlyViewedCarousel');
    const prevBtn = carousel.querySelector('.carousel-control-prev');
    const nextBtn = carousel.querySelector('.carousel-control-next');
    
    if (slides.length <= 1) {
      prevBtn.style.display = 'none';
      nextBtn.style.display = 'none';
    } else {
      prevBtn.style.display = 'flex';
      nextBtn.style.display = 'flex';
    }

    // Actualizar botones de favoritos
    setTimeout(() => {
      if (window.favoritesManager) {
        window.favoritesManager.updateFavoriteButtons();
      }
    }, 100);
  }

  // Guardar producto actual en productos vistos recientemente
  saveToRecentlyViewed() {
    if (!this.currentProduct) return;

    try {
      const productId = this.currentProduct.id.toString();
      let recentProducts = this.getRecentlyViewed();
      
      // Remover el producto si ya existe
      recentProducts = recentProducts.filter(id => id !== productId);
      
      // Agregar al inicio
      recentProducts.unshift(productId);
      
      // Mantener solo los últimos 10 productos
      recentProducts = recentProducts.slice(0, 10);
      
      localStorage.setItem('daledealt_recently_viewed', JSON.stringify(recentProducts));
    } catch (error) {
      console.error('Error guardando producto en vistos recientemente:', error);
    }
  }

  // Obtener productos vistos recientemente
  getRecentlyViewed() {
    try {
      const recent = localStorage.getItem('daledealt_recently_viewed');
      return recent ? JSON.parse(recent) : [];
    } catch (error) {
      console.error('Error cargando productos vistos recientemente:', error);
      return [];
    }
  }

  // Ir a la página de categoría
  goToCategory() {
    // En una implementación real, esto navegar a una página de categoría
    // Por ahora, vamos al inicio y podríamos filtrar por categoría
    localStorage.setItem('filterCategory', this.currentProduct.category);
    window.location.href = '../index.html';
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  new ProductPage();
});
