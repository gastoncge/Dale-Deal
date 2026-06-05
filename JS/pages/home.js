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
 * Renderiza los badges de envío según los datos del producto
 */
function renderShippingBadges(shipping) {
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

/**
 * Renderiza una tarjeta de producto
 */
function renderProductCard(product) {
  // Normalizar imágenes tanto para datos de API como para datos estáticos
  if (!product.images || typeof product.images !== 'object') {
    const src = Array.isArray(product.images) ? product.images[0] : (product.images || 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=600&h=600&fit=crop');
    product.images = { main: src, gallery: [src] };
  } else if (!product.images.main && Array.isArray(product.images)) {
    product.images = { main: product.images[0], gallery: product.images };
  } else if (!product.images.main) {
    product.images.main = 'https://images.unsplash.com/photo-1560393464-5c69a73c5770?w=600&h=600&fit=crop';
  }

  const hasDiscount = product.discount && product.discount > 0;
  const hasMultipleImages = product.images?.gallery?.length > 1;

  // Solo mostrar badges de oferta/descuento/más vendido — en rojo
  const BADGE_KEYWORDS = ['off', 'oferta', 'descuento', 'más vendido', 'mas vendido'];
  const badges = (product.badges || []).filter(b =>
    BADGE_KEYWORDS.some(kw => b.toLowerCase().includes(kw))
  );
  const badgesHTML = badges.map(badge =>
    `<span class="badge-offer">${badge}</span>`
  ).join('');

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
            loading="lazy"
          />
        `).join('')}

        <!-- Controles de navegación -->
        <button class="carousel-control carousel-prev" data-direction="prev" aria-label="Categoría anterior">
          <i class="bi bi-chevron-left" aria-hidden="true"></i>
        </button>
        <button class="carousel-control carousel-next" data-direction="next" aria-label="Categoría siguiente">
          <i class="bi bi-chevron-right" aria-hidden="true"></i>
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
        loading="lazy"
      />
    `;
  }

  // Renderizar precio
  const priceHTML = `<span class="product-current-price">${window.DaleDeal.utils.formatCurrency(product.price)}</span>`;

  // Cuotas sin interés — solo mostrar si la cuota mensual >= $1.000 (evita "12 cuotas de $42")
  // 12 cuotas sin interés es el estándar de MercadoPago para vendedores en Argentina.
  const installments = 12;
  const monthlyAmount = product.price / installments;
  const installmentsHTML = monthlyAmount >= 1000
    ? `<div class="product-installments"><i class="bi bi-credit-card"></i> ${installments} cuotas sin interés de ${window.DaleDeal.utils.formatCurrency(Math.round(monthlyAmount))}</div>`
    : '';

  // Reseñas: si no hay reviews, mostrar "Sin reseñas aún" en lugar de "(0)"
  const reviewCount = product.reviewCount || 0;
  const reviewsHTML = reviewCount > 0
    ? `<span class="reviews-count">(${reviewCount.toLocaleString('es-AR')})</span>`
    : `<span class="reviews-count text-muted">Sin reseñas aún</span>`;

  // WhatsApp share — el link contiene URL del producto + título
  const shareUrl = `${window.location.origin}/HTML/producto.html?id=${product.id}`;
  const shareText = encodeURIComponent(`Mirá esto en Dale Deal: ${product.title} — ${shareUrl}`);
  const whatsappHref = `https://wa.me/?text=${shareText}`;

  // Renderizar descripción corta (primeras 80 caracteres)
  const shortDescription = product.description
    ? (product.description.length > 80
        ? product.description.substring(0, 80) + '...'
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
          <a href="${whatsappHref}"
             class="action-share"
             title="Compartir por WhatsApp"
             target="_blank"
             rel="noopener noreferrer"
             onclick="event.stopPropagation()"
             aria-label="Compartir ${product.title} por WhatsApp">
            <i class="bi bi-whatsapp"></i>
          </a>
        </div>
      </div>
      <div class="product-info">
        <h3 class="product-title">${product.title}</h3>
        <p class="product-description">${shortDescription}</p>

        <div class="product-meta-group">
          <div class="product-rating">
            <div class="stars">${renderStars(product.rating || 0)}</div>
            ${reviewsHTML}
          </div>
          <div class="product-location">
            <i class="bi bi-geo-alt-fill"></i>
            <span>CABA</span>
          </div>
        </div>

        <div class="product-pricing-wrapper">
          <div class="product-pricing">
            ${priceHTML}
            ${installmentsHTML}
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Carga y renderiza productos en el grid
 */
/**
 * Carga sección "Lo más visto esta semana".
 * Usa el endpoint /products?sort=views&order=desc&limit=4 (que ya existe).
 * Si falla o no hay items con views > 0, oculta la sección entera.
 * Se renderiza ANTES de loadProducts() para que aparezca arriba.
 */
async function loadTrending() {
  const section = document.getElementById('trendingSection');
  const grid    = document.getElementById('trendingGrid');
  if (!section || !grid) return;

  try {
    // 4 productos = 1 fila completa de 4 columnas en desktop
    const apiBase = (window.DaleDeal?.CONFIG?.API_BASE_URL || 'https://daledeal-backend-production.up.railway.app').replace(/\/$/, '');
    const res = await fetch(`${apiBase}/products?sort=views&order=desc&limit=4`);
    const data = await res.json().catch(() => ({}));
    const items = (data.data || []).filter(p => (p.views || 0) > 0);

    if (items.length === 0) {
      // No hay items con views — no mostramos la sección (default hidden)
      return;
    }

    // Render con la misma función que usamos para destacados (consistencia visual)
    grid.innerHTML = '';
    const row = document.createElement('div');
    row.className = 'products-row';
    row.innerHTML = items.map(p => {
      // El backend devuelve campos planos (images: [URL], views: N).
      // renderProductCard espera el shape de api.js transformProduct →
      // hacemos un mini-transform inline para no acoplar.
      const product = {
        id: p.id,
        title: p.title,
        description: p.description,
        price: parseFloat(p.price) || 0,
        images: { main: (p.images && p.images[0]) || '', gallery: p.images || [] },
        rating: p.avg_rating || 0,
        reviewCount: p.review_count || 0,
        badges: [],
      };
      return renderProductCard(product);
    }).join('');
    grid.appendChild(row);
    section.style.display = '';
    initializeProductListeners();
    DaleDeal.log(`✓ Trending cargado: ${items.length} items`);
  } catch (err) {
    DaleDeal.warn('No se pudo cargar trending:', err.message);
    // Mantenemos section hidden — no es crítico, los destacados siguen mostrándose
  }
}

async function loadProducts() {
  try {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) {
      DaleDeal.warn('Products grid container not found');
      return;
    }

    // Cargar trending en paralelo (no bloqueamos los destacados)
    loadTrending();

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

      row.innerHTML = rowProducts.map(product => renderProductCard(product)).join('');

      productsGrid.appendChild(row);
    }

    // Reinicializar event listeners después de cargar productos
    initializeProductListeners();

    // Notificar a otros sistemas (ej: filters.js) que los productos
    // están renderizados y disponibles en el DOM. Sirve para que filtros
    // pasivos puedan re-escanear cards sin pisar lo que acabamos de pintar.
    document.dispatchEvent(new CustomEvent('products:loaded', {
      detail: { count: products.length, source: 'api' }
    }));

    DaleDeal.log(`✓ ${products.length} productos cargados en el home`);

  } catch (error) {
    DaleDeal.warn('API no disponible, usando datos locales:', error.message);

    const loadingContainer = document.getElementById('loadingContainer');
    if (loadingContainer) loadingContainer.style.display = 'none';

    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;

    // Fallback: datos estáticos de product-data.js
    const fallbackProducts = typeof window.getAllProducts === 'function'
      ? window.getAllProducts()
      : [];

    if (!fallbackProducts.length) {
      productsGrid.innerHTML = `
        <div class="col-12">
          <div class="alert alert-warning" role="alert">
            <i class="bi bi-exclamation-triangle me-2"></i>
            No se pudo conectar con el servidor. Intentá de nuevo más tarde.
          </div>
        </div>
      `;
      return;
    }

    productsGrid.innerHTML = '';
    const productsPerRow = 3;
    for (let i = 0; i < Math.min(fallbackProducts.length, 6); i += productsPerRow) {
      const row = document.createElement('div');
      row.className = 'products-row';
      row.innerHTML = fallbackProducts
        .slice(i, i + productsPerRow)
        .map(p => renderProductCard(p))
        .join('');
      productsGrid.appendChild(row);
    }

    initializeProductListeners();
    document.dispatchEvent(new CustomEvent('products:loaded', {
      detail: { count: Math.min(fallbackProducts.length, 6), source: 'fallback' }
    }));
    DaleDeal.log(`✓ ${Math.min(fallbackProducts.length, 6)} productos locales cargados como fallback`);
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
  setTimeout(() => {
    if (window.productCarousel) {
      window.productCarousel.reinitialize();
      DaleDeal.log('✅ Carruseles reinicializados en home');
    } else if (window.ProductCarousel) {
      window.productCarousel = new window.ProductCarousel();
      DaleDeal.log('✅ ProductCarousel creado en home');
    }
  }, 200);

  // Reinicializar favoritos
  if (window.favoritesManager) {
    window.favoritesManager.updateFavoriteButtons();
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
      DaleDeal.error('API de productos no disponible');
    }
  });
} else {
  // DOM ya está listo
  if (window.DaleDeal?.api) {
    loadProducts();
  } else {
    DaleDeal.error('API de productos no disponible');
  }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.HomePageLoader = {
    loadProducts,
    renderProductCard,
    initializeProductListeners,
    renderStars,
    renderShippingBadges
  };
}

// ===== INICIALIZACIÓN HOME PAGE =====
// Handlers específicos de index.html (servicios, newsletter, hero, notifications)
(function initHomeHandlers() {
  function run() {
    // Notificaciones dropdown
    document.getElementById('notificationBtn')?.addEventListener('shown.bs.dropdown', () => {
      window.notificationManager?.renderNotifications();
    });

    // heroProductBtn obsoleto — antes agregaba un iPhone fake (id=1) al carrito
    // que no existía en backend → fallaba el checkout. Reemplazamos el botón
    // por links honestos a productos.html en el HTML del hero.

    // Botón ver todos los productos
    document.getElementById('viewAllProductsBtn')?.addEventListener('click', () => {
      window.location.href = './HTML/productos.html';
    });

    // Botón ver todos los servicios (faltaba handler — el botón existía
    // en index.html pero no hacía nada al click)
    document.getElementById('viewAllServicesBtn')?.addEventListener('click', () => {
      window.location.href = './HTML/servicios.html';
    });

    // Service cards estáticas del home — cada card tiene data-id con el slug
    // del servicio (`installation-tech`, `tech-support`, etc.) que SÍ existe
    // en servicesData (mock data local). El detalle de servicio busca primero
    // en backend (si el id es numérico) y luego en local (el caso de estos).
    //
    // Antes: las cards no eran clickeables ni los botones "Reservar cita"
    //        tenían handler. Click → nada pasaba.
    // Ahora: todo el card es clickeable, excepto el corazón (favoritos).
    document.querySelectorAll('.service-card[data-id]').forEach(card => {
      const id = card.dataset.id;
      if (!id) return;
      card.style.cursor = 'pointer';
      card.addEventListener('click', (e) => {
        if (e.target.closest('.action-heart')) return; // no robar el click del corazón
        window.location.href = `./HTML/servicio.html?id=${encodeURIComponent(id)}`;
      });
    });

    // Newsletter forms — POST real al backend (antes era animación fake).
    // Si el backend falla o está caído, mostramos error visible.
    // Si funciona, transiciona el botón a check verde por 2 segundos.
    const handleNewsletterSubmit = async function(e) {
      e.preventDefault();
      const input = this.querySelector('input[type="email"]');
      const email = input?.value?.trim();
      if (!email) return;

      const btn = this.querySelector('.newsletter-btn');
      const originalHTML = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';

      const apiBase = (window.DaleDeal?.CONFIG?.API_BASE_URL || 'https://daledeal-backend-production.up.railway.app').replace(/\/$/, '');

      try {
        const res = await fetch(`${apiBase}/newsletter/subscribe`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, source: 'footer' }),
        });
        const data = await res.json().catch(() => ({}));

        if (!res.ok || data.ok === false) {
          // Error visible
          btn.innerHTML = '<i class="bi bi-x-circle"></i>';
          btn.style.background = 'var(--danger-600, #dc3545)';
          input.setCustomValidity(data.error || 'Error al suscribirse');
          input.reportValidity();
          setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.disabled = false;
            btn.style.background = '';
            input.setCustomValidity('');
          }, 3000);
          return;
        }

        // Éxito
        btn.innerHTML = '<i class="bi bi-check-circle"></i>';
        btn.style.background = 'var(--success-600, #28a745)';
        this.reset();
        setTimeout(() => {
          btn.innerHTML = originalHTML;
          btn.disabled = false;
          btn.style.background = '';
        }, 2500);
      } catch (err) {
        // Error de red — backend caído o sin internet
        console.error('[newsletter] Error:', err);
        btn.innerHTML = '<i class="bi bi-x-circle"></i>';
        btn.style.background = 'var(--danger-600, #dc3545)';
        setTimeout(() => {
          btn.innerHTML = originalHTML;
          btn.disabled = false;
          btn.style.background = '';
        }, 3000);
      }
    };
    document.getElementById('newsletterForm')?.addEventListener('submit', handleNewsletterSubmit);
    document.getElementById('footerNewsletterForm')?.addEventListener('submit', handleNewsletterSubmit);

    // Filtros de servicios en la home
    class ServiceFilters {
      constructor() {
        this.currentCategory = 'all';
        this.currentSort = 'featured';
        this.services = [];
        this.loadServices();
        this.bindEvents();
      }

      loadServices() {
        this.services = Array.from(document.querySelectorAll('.service-card')).map(card => ({
          element: card,
          category: card.dataset.serviceCategory,
          price: parseInt(card.dataset.servicePrice) || 0,
          title: card.querySelector('.service-title')?.textContent || ''
        }));
      }

      bindEvents() {
        document.querySelectorAll('.service-filter-tab').forEach(tab => {
          tab.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.service-filter-tab').forEach(t => t.classList.remove('active'));
            e.currentTarget.classList.add('active');
            this.currentCategory = e.currentTarget.dataset.serviceCategory;
            this.filterAndRender();
          });
        });
        document.getElementById('serviceSortBtn')?.addEventListener('click', () => {
          this.currentSort = this.currentSort === 'price-asc' ? 'price-desc' : 'price-asc';
          this.filterAndRender();
        });
      }

      filterAndRender() {
        let filtered = [...this.services];
        if (this.currentCategory && this.currentCategory !== 'all') {
          filtered = filtered.filter(s => s.category === this.currentCategory);
        }
        if (this.currentSort === 'price-asc') filtered.sort((a, b) => a.price - b.price);
        else if (this.currentSort === 'price-desc') filtered.sort((a, b) => b.price - a.price);
        this.services.forEach(s => { s.element.style.display = 'none'; });
        filtered.forEach((s, i) => {
          s.element.style.display = 'block';
          s.element.style.animationDelay = `${i * 0.1}s`;
        });
      }
    }

    new ServiceFilters();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
