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
  // Coacciona a string primero: escapeHtml() devuelve '' para no-strings (ej. id numérico),
  // lo que vaciaría data-id y rompería navegación/favoritos.
  const esc = (v) => window.DaleDeal.utils.escapeHtml(String(v ?? ''));
  const badgesHTML = badges.map(badge =>
    `<span class="badge-offer">${esc(badge)}</span>`
  ).join('');

  // Renderizar imágenes
  let imagesHTML = '';
  if (hasMultipleImages) {
    imagesHTML = `
      <div class="product-image-carousel" data-current-image="0">
        ${product.images.gallery.map((img, index) => `
          <img
            src="${esc(img)}"
            alt="${esc(product.title)} - Vista ${index + 1}"
            class="product-image ${index === 0 ? 'active' : ''}"
            loading="lazy"
          />
        `).join('')}

        <!-- Controles de navegación -->
        <button class="carousel-control carousel-prev" data-direction="prev" aria-label="Foto anterior">
          <i class="bi bi-chevron-left" aria-hidden="true"></i>
        </button>
        <button class="carousel-control carousel-next" data-direction="next" aria-label="Foto siguiente">
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
        src="${esc(product.images.main)}"
        alt="${esc(product.title)}"
        class="product-image"
        loading="lazy"
      />
    `;
  }

  // Renderizar precio
  const priceHTML = `<span class="product-current-price">${window.DaleDeal.utils.formatCurrency(product.price)}</span>`;

  // Cuotas sin interés — helper único en utils.js (elige el mejor plan y evita "12 cuotas de $42")
  const inst = window.DaleDeal.utils.formatInstallments(product.price);
  const installmentsHTML = inst.show
    ? `<div class="product-installments"><i class="bi bi-credit-card"></i> ${inst.count} cuotas sin interés de ${inst.monthlyFormatted}</div>`
    : '';

  // Stock bajo / urgencia honesta — solo con stock real entre 1 y 5 (sin inventar urgencia)
  const lowStock = product.stock > 0 && product.stock <= 5;
  const stockHTML = lowStock
    ? `<div class="product-stock-low"><i class="bi bi-fire"></i> ${product.stock === 1 ? '¡Última unidad!' : `¡Quedan ${product.stock}!`}</div>`
    : '';

  // Reseñas: si no hay reviews, mostrar "Sin reseñas aún" en lugar de "(0)"
  const reviewCount = product.reviewCount || 0;
  const reviewsHTML = reviewCount > 0
    ? `<span class="reviews-count">(${reviewCount.toLocaleString('es-AR')})</span>`
    : `<span class="reviews-count text-muted">Sin reseñas aún</span>`;

  // WhatsApp share — el link contiene URL del producto + título
  const shareUrl = `${window.location.origin}/producto?id=${product.id}`;
  const shareText = encodeURIComponent(`Mirá esto en Dale Deal: ${product.title} — ${shareUrl}`);
  const whatsappHref = `https://wa.me/?text=${shareText}`;

  // Renderizar descripción corta (primeras 80 caracteres)
  const shortDescription = product.description
    ? (product.description.length > 80
        ? product.description.substring(0, 80) + '...'
        : product.description)
    : '';

  return `
    <div class="product-card ${hasDiscount ? 'has-offer' : ''}" data-id="${esc(product.id)}" data-clickable="true">
      <div class="product-image-container">
        ${imagesHTML}
        ${badgesHTML}
        <div class="product-actions">
          <button class="action-heart" title="Agregar a favoritos" data-product-id="${esc(product.id)}">
            <i class="bi bi-heart"></i>
          </button>
          <a href="${whatsappHref}"
             class="action-share"
             title="Compartir por WhatsApp"
             target="_blank"
             rel="noopener noreferrer"
             onclick="event.stopPropagation()"
             aria-label="Compartir ${esc(product.title)} por WhatsApp">
            <i class="bi bi-whatsapp"></i>
          </a>
        </div>
      </div>
      <div class="product-info">
        <h3 class="product-title">${esc(product.title)}</h3>
        <p class="product-description">${esc(shortDescription)}</p>

        <div class="product-meta-group">
          <div class="product-rating">
            <div class="stars">${renderStars(product.rating || 0)}</div>
            ${reviewsHTML}
          </div>
          <div class="product-location">
            <i class="bi bi-geo-alt-fill"></i>
            <span>${esc(product.location || 'Argentina')}</span>
          </div>
        </div>

        <div class="product-pricing-wrapper">
          <div class="product-pricing">
            ${priceHTML}
            ${installmentsHTML}
            ${stockHTML}
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
        location: p.location,
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
    // Sin API avisamos. Antes se pintaban los productos de ejemplo de
    // product-data.js (iPhones, precios y descuentos que no existen) como si
    // fueran publicaciones reales.
    DaleDeal.warn('No se pudieron cargar los productos:', error.message);

    const loadingContainer = document.getElementById('loadingContainer');
    if (loadingContainer) loadingContainer.style.display = 'none';

    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;

    productsGrid.innerHTML = `
      <div class="col-12">
        <div class="alert alert-warning" role="alert">
          <i class="bi bi-exclamation-triangle me-2"></i>
          No pudimos cargar los productos. Revisá tu conexión y probá de nuevo.
          <button type="button" class="btn btn-sm btn-outline-secondary ms-2" onclick="window.HomePageLoader.loadProducts()">
            <i class="bi bi-arrow-clockwise me-1"></i>Reintentar
          </button>
        </div>
      </div>
    `;
  }
}

/**
 * Renderiza una tarjeta de servicio de la home con datos reales de la API
 * (transformService de api.js). Solo muestra lo que el backend confirma: las
 * insignias salen de la verificación aprobada del prestador y la calificación
 * de sus reseñas; sin reseñas dice "Sin reseñas aún".
 */
function renderServiceCard(service) {
  const esc = (v) => window.DaleDeal.utils.escapeHtml(String(v ?? ''));
  const provider = service.provider || {};

  const badges = [];
  if (provider.verifiedIdentity) badges.push('<span class="badge-certified">Identidad verificada</span>');
  if (provider.verifiedProfessional) badges.push('<span class="badge-certified">Profesional verificado</span>');
  const badgesHTML = badges.length ? `<div class="service-badges">${badges.join('')}</div>` : '';

  const reviewCount = service.reviewCount || 0;
  const ratingHTML = reviewCount > 0
    ? `<div class="stars">${renderStars(service.rating || 0)}</div>
       <span class="service-rating-text">${(service.rating || 0).toFixed(1)} (${reviewCount.toLocaleString('es-AR')})</span>`
    : '<span class="service-rating-text text-muted">Sin reseñas aún</span>';

  // price_from del backend: por eso "Desde"
  const priceText = service.price > 0
    ? `Desde ${window.DaleDeal.utils.formatCurrency(service.price)}`
    : 'Consultar precio';

  const shortDescription = service.description && service.description.length > 90
    ? service.description.substring(0, 90) + '...'
    : (service.description || '');

  const href = `/servicio?id=${encodeURIComponent(service.id)}`;

  // El título es un link real (teclado / lectores de pantalla); el resto de
  // la card navega por JS. El overlay "Reservar cita" de las cards viejas
  // no va: components.css lo oculta y no hay sistema de reservas.
  return `
    <div class="service-card" data-id="${esc(service.id)}">
      <div class="service-image-container">
        <img src="${esc(service.image)}" alt="${esc(service.title)}" class="service-image" loading="lazy" />
        ${badgesHTML}
      </div>
      <div class="service-info">
        <h3 class="service-title"><a href="${esc(href)}" class="text-reset text-decoration-none">${esc(service.title)}</a></h3>
        <p class="service-description">${esc(shortDescription)}</p>
        <div class="service-meta">
          <div class="service-rating">${ratingHTML}</div>
          <div class="service-info-row">
            <div class="service-location">
              <i class="bi bi-geo-alt-fill"></i>
              <span>${esc(service.location)}</span>
            </div>
            <span class="service-price-badge">${esc(priceText)}</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Servicios de la home: los últimos publicados (GET /services, mismo patrón
 * y escape que los productos). Si la API falla o no hay servicios, la
 * sección queda oculta: nunca mostramos servicios de ejemplo.
 */
async function loadHomeServices() {
  const section = document.getElementById('servicesSection');
  const grid = document.getElementById('servicesGrid');
  if (!section || !grid || !window.DaleDeal?.api?.fetchServices) return;

  try {
    // 6 = dos filas de 3 en desktop
    const services = (await window.DaleDeal.api.fetchServices({ limit: 6 })).slice(0, 6);
    if (services.length === 0) return;

    grid.innerHTML = services.map(renderServiceCard).join('');

    // Toda la card es clickeable (el título es un link real, para teclado)
    grid.querySelectorAll('.service-card[data-id]').forEach(card => {
      card.style.cursor = 'pointer';
      card.addEventListener('click', (e) => {
        if (e.target.closest('a')) return;
        window.location.href = `/servicio?id=${encodeURIComponent(card.dataset.id)}`;
      });
    });

    section.style.display = '';
    DaleDeal.log(`✓ ${services.length} servicios cargados en el home`);
  } catch (err) {
    DaleDeal.warn('No se pudieron cargar los servicios del home:', err.message);
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
 * Inicializar cuando el DOM esté listo.
 * productos.html también carga este archivo, pero solo por renderProductCard:
 * ahí el grid es del catálogo de la página (isProductosPage, de search.js) y
 * si lo cargáramos acá lo pisaríamos con otra copia de los productos.
 */
function startHomeProducts() {
  if (typeof isProductosPage === 'function' && isProductosPage()) return;
  // Esperar a que la API esté disponible
  if (window.DaleDeal?.api) {
    loadProducts();
    loadHomeServices();
  } else {
    DaleDeal.error('API de productos no disponible');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startHomeProducts);
} else {
  // DOM ya está listo
  startHomeProducts();
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
      window.location.href = '/productos';
    });

    // Botón ver todos los servicios (faltaba handler — el botón existía
    // en index.html pero no hacía nada al click)
    document.getElementById('viewAllServicesBtn')?.addEventListener('click', () => {
      window.location.href = '/servicios';
    });

    // Las service cards ya no son estáticas: las pinta loadHomeServices()
    // con servicios reales y ahí mismo les pone el click.

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

    // (ServiceFilters se fue con las service cards estáticas: filtraba por
    // tabs .service-filter-tab que no existen en index.html.)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    run();
  }
})();
