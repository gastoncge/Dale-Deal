// =====================================================
// DALE DEAL - Vistos recientemente (100% localStorage)
// =====================================================
// Guarda los últimos productos/servicios que el usuario abrió y los muestra
// en un carrusel en el home. No toca el backend.
// API: window.DDRecentlyViewed.track(item) y .render({excludeId, excludeType})
(function () {
  const KEY = 'dd_recently_viewed';
  const MAX = 12;

  function read() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch (_) { return []; }
  }
  function write(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX))); } catch (_) {}
  }

  /** Guarda un ítem visto. item = {id, type:'product'|'service', title, price, image,
   *  description, location, rating, reviewCount, postBadges} */
  function track(item) {
    if (!item || item.id == null || !item.type) return;
    const list = read().filter((x) => !(String(x.id) === String(item.id) && x.type === item.type));
    list.unshift({
      id: item.id,
      type: item.type,
      title: item.title || '',
      price: Number(item.price) || 0,
      image: item.image || '',
      description: String(item.description || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120),
      location: item.location || '',
      rating: Number(item.rating) || 0,
      reviewCount: Number(item.reviewCount) || 0,
      postBadges: Array.isArray(item.postBadges) ? item.postBadges.slice(0, 2) : [],
    });
    write(list);
  }

  function cardHTML(item) {
    const u = window.DaleDeal.utils;
    const page = item.type === 'service' ? 'servicio' : 'producto';
    const href = `/${page}?id=${encodeURIComponent(item.id)}`;
    const img = item.image || u.PLACEHOLDER_IMG;
    const inst = u.formatInstallments(item.price);
    const instHTML = inst.show
      ? `<div class="product-installments"><i class="bi bi-credit-card"></i> ${inst.count} cuotas sin interés de ${inst.monthlyFormatted}</div>`
      : '';
    // Ítems guardados antes de esta versión no tienen descripción/ubicación:
    // esas filas simplemente no se muestran.
    const desc = item.description ? (item.description.length > 80 ? item.description.slice(0, 80) + '…' : item.description) : '';
    const reviewCount = Number(item.reviewCount) || 0;
    const ratingHTML = `
          <div class="product-rating">
            <div class="stars">${u.renderStars ? u.renderStars(item.rating || 0) : ''}</div>
            <span class="reviews-count${reviewCount ? '' : ' text-muted'}">${reviewCount ? `(${reviewCount.toLocaleString('es-AR')})` : 'Sin reseñas aún'}</span>
          </div>`;
    return `
      <a class="product-card rv-card" href="${href}" data-clickable="true">
        <div class="product-image-container">
          <img src="${u.escapeHtml(String(img))}" alt="${u.escapeHtml(item.title)}" class="product-image" loading="lazy" />
          ${u.renderPostBadges ? u.renderPostBadges(item.postBadges) : ''}
        </div>
        <div class="product-info">
          <h3 class="product-title">${u.escapeHtml(item.title)}</h3>
          ${desc ? `<p class="product-description">${u.escapeHtml(desc)}</p>` : ''}
          <div class="product-meta-group">
            ${ratingHTML}
            ${item.location ? `<div class="product-location"><i class="bi bi-geo-alt-fill"></i><span>${u.escapeHtml(item.location)}</span></div>` : ''}
          </div>
          <div class="product-pricing-wrapper"><div class="product-pricing">
            <span class="product-current-price">${u.formatPrice(item.price)}</span>
            ${instHTML}
          </div></div>
        </div>
      </a>`;
  }

  /** Renderiza la sección si hay ítems. opts.excludeId/excludeType = el ítem actual. */
  function render(opts = {}) {
    const section = document.getElementById('recentlyViewedSection');
    const grid = document.getElementById('recentlyViewedGrid');
    if (!section || !grid || !window.DaleDeal?.utils) return;
    let list = read();
    if (opts.excludeId) {
      list = list.filter((x) => !(String(x.id) === String(opts.excludeId) && x.type === opts.excludeType));
    }
    if (!list.length) { section.style.display = 'none'; return; }
    grid.innerHTML = list.map(cardHTML).join('');
    section.style.display = '';
    if (!opts._refreshed) refreshStale(opts);
  }

  // Ítems guardados por versiones viejas (sin descripción/ubicación/carteles):
  // se completan una vez con los datos actuales de la API y se re-renderiza.
  async function refreshStale(opts) {
    const api = window.DaleDeal?.api;
    if (!api?.fetchProductById || !api?.fetchServiceById) return;
    const list = read();
    const stale = list.filter((x) => x.description === undefined);
    if (!stale.length) return;
    let changed = false;
    await Promise.all(stale.map(async (x) => {
      const fresh = x.type === 'service' ? await api.fetchServiceById(x.id) : await api.fetchProductById(x.id);
      if (!fresh) return;
      Object.assign(x, {
        title: fresh.title || x.title,
        price: Number(x.type === 'service' ? fresh.price : fresh.basePrice ?? fresh.price) || x.price,
        image: (x.type === 'service' ? fresh.image : fresh.images?.main) || x.image,
        description: String(fresh.description || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120),
        location: fresh.location || '',
        rating: Number(fresh.rating) || 0,
        reviewCount: Number(fresh.reviewCount) || 0,
        postBadges: fresh.postBadges || [],
      });
      changed = true;
    }));
    if (changed) {
      write(list);
      render({ ...opts, _refreshed: true });
    }
  }

  window.DDRecentlyViewed = { track, render, read };

  // Auto-render en cualquier página que tenga la sección (el home)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => render());
  } else {
    render();
  }
})();
