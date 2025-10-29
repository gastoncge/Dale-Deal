// =====================================================
// DALE DEAL - Home Page Product Loader
// =====================================================

/**
 * Renderiza las estrellas de rating
 */
function renderStars(rating) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  let starsHTML = '';

  // Estrellas llenas
  for (let i = 0; i < fullStars; i++) {
    starsHTML += '<i class="bi bi-star-fill"></i>';
  }

  // Media estrella
  if (hasHalfStar) {
    starsHTML += '<i class="bi bi-star-half"></i>';
  }

  // Estrellas vacías
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  for (let i = 0; i < emptyStars; i++) {
    starsHTML += '<i class="bi bi-star"></i>';
  }

  return starsHTML;
}

/**
 * Renderiza una tarjeta de producto
 */
function renderProductCard(product) {
  const hasDiscount = product.discount && product.discount > 0;
  const hasMultipleImages = product.images?.gallery?.length > 1;

  // Determinar badges
  const badges = product.badges || [];
  const badgesHTML = badges.map(badge => {
    if (badge.includes('OFF')) {
      return `<span class="badge-offer">${badge}</span>`;
    } else {
      return `<span class="badge-featured">${badge}</span>`;
    }
  }).join('');

  // Renderizar imágenes
  let imagesHTML = '';
  if (hasMultipleImages) {
    imagesHTML = `
      <div class="product-image-carousel" data-current-image="0">
        ${product.images.gallery.map((img, index) => `
          <img
            src="${img}"
            alt="${product.title} - Vista ${index + 1}"
            class="product-image ${index === 0 ? 'active' : ''}"
          />
        `).join('')}

        <!-- Controles de navegación -->
        <button class="carousel-control carousel-prev" data-direction="prev">
          <i class="bi bi-chevron-left"></i>
        </button>
        <button class="carousel-control carousel-next" data-direction="next">
          <i class="bi bi-chevron-right"></i>
        </button>

        <!-- Indicadores -->
        <div class="carousel-indicators">
          ${product.images.gallery.map((_, index) => `
            <span class="indicator ${index === 0 ? 'active' : ''}" data-index="${index}"></span>
          `).join('')}
        </div>
      </div>
    `;
  } else {
    imagesHTML = `
      <img
        src="${product.images.main}"
        alt="${product.title}"
        class="product-image"
      />
    `;
  }

  // Renderizar precio
  const priceHTML = hasDiscount ? `
    <span class="product-current-price">${window.DaleDeal.utils.formatCurrency(product.price)}</span>
    <span class="product-original-price">${window.DaleDeal.utils.formatCurrency(product.originalPrice)}</span>
  ` : `
    <span class="product-current-price">${window.DaleDeal.utils.formatCurrency(product.price)}</span>
  `;

  // Determinar si tiene envío gratis (productos con descuento o precio > 50000)
  const hasFreeShipping = product.freeShipping || hasDiscount || product.price > 50000;

  // Renderizar descripción corta (primeras 120 caracteres)
  const shortDescription = product.description
    ? (product.description.length > 120
        ? product.description.substring(0, 120) + '...'
        : product.description)
    : '';

  return `
    <div class="product-card ${hasDiscount ? 'has-offer' : ''}" data-id="${product.id}" data-clickable="true">
      <div class="product-image-container">
        ${imagesHTML}
        ${badgesHTML}
        <div class="product-actions">
          <button class="action-heart" title="Agregar a favoritos" data-product-id="${product.id}">
            <i class="bi bi-heart"></i>
          </button>
        </div>
      </div>
      <div class="product-info">
        <h3 class="product-title">${product.title}</h3>
        ${shortDescription ? `<p class="product-description">${shortDescription}</p>` : ''}
        <div class="product-meta">
          <div class="product-rating-location-row">
            <div class="product-rating">
              <div class="stars">
                ${renderStars(product.rating)}
              </div>
              <span class="rating-text">${product.rating}</span>
              <span class="reviews-count">(${product.reviewCount.toLocaleString('es-AR')})</span>
            </div>
            <div class="product-location">
              <i class="bi bi-geo-alt-fill"></i>
              <span>CABA</span>
            </div>
          </div>
          <div class="product-info-row">
            <div class="product-pricing">
              ${priceHTML}
            </div>
            ${hasFreeShipping ? `
              <div class="product-free-shipping">
                <i class="bi bi-truck"></i>
                <span>Envío gratis</span>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Carga y renderiza productos en el grid
 */
async function loadProducts() {
  try {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) {
      console.warn('Products grid container not found');
      return;
    }

    // Mostrar loading
    const loadingContainer = document.getElementById('loadingContainer');
    if (loadingContainer) {
      loadingContainer.style.display = 'flex';
    }

    // Cargar productos desde la API
    const products = await window.DaleDeal.api.fetchProducts();

    // Ocultar loading
    if (loadingContainer) {
      loadingContainer.style.display = 'none';
    }

    // Limpiar grid
    productsGrid.innerHTML = '';

    // Dividir productos en filas de 3
    const productsPerRow = 3;
    for (let i = 0; i < products.length; i += productsPerRow) {
      const rowProducts = products.slice(i, i + productsPerRow);

      const row = document.createElement('div');
      row.className = 'products-row';

      rowProducts.forEach(product => {
        row.innerHTML += renderProductCard(product);
      });

      productsGrid.appendChild(row);
    }

    // Reinicializar event listeners después de cargar productos
    initializeProductListeners();

    console.log(`✓ ${products.length} productos cargados en el home`);

  } catch (error) {
    console.error('Error al cargar productos:', error);

    const productsGrid = document.getElementById('productsGrid');
    if (productsGrid) {
      productsGrid.innerHTML = `
        <div class="col-12">
          <div class="alert alert-danger" role="alert">
            <i class="bi bi-exclamation-triangle me-2"></i>
            Error al cargar los productos. Por favor, intenta nuevamente más tarde.
          </div>
        </div>
      `;
    }
  }
}

/**
 * Inicializa los event listeners de los productos
 */
function initializeProductListeners() {
  // Click en productos para navegar
  document.querySelectorAll('.product-card[data-clickable="true"]').forEach(card => {
    card.addEventListener('click', (e) => {
      // Ignorar si se hizo click en botones o controles
      if (e.target.closest('.action-heart') ||
          e.target.closest('.carousel-control') ||
          e.target.closest('.carousel-indicators')) {
        return;
      }

      const productId = card.dataset.id;
      if (productId && typeof goToProduct === 'function') {
        goToProduct(productId);
      }
    });
  });

  // Reinicializar carruseles de imágenes
  if (typeof initializeProductCarousels === 'function') {
    initializeProductCarousels();
  }

  // Reinicializar favoritos
  if (window.favoriteManager) {
    window.favoriteManager.updateFavoriteButtons();
  }
}

/**
 * Inicializar cuando el DOM esté listo
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Esperar a que la API esté disponible
    if (window.DaleDeal?.api) {
      loadProducts();
    } else {
      console.error('API de productos no disponible');
    }
  });
} else {
  // DOM ya está listo
  if (window.DaleDeal?.api) {
    loadProducts();
  } else {
    console.error('API de productos no disponible');
  }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.HomePageLoader = {
    loadProducts,
    renderProductCard,
    initializeProductListeners
  };
}
