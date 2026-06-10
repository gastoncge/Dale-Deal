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

  /** Guarda un ítem visto. item = {id, type:'product'|'service', title, price, image} */
  function track(item) {
    if (!item || item.id == null || !item.type) return;
    const list = read().filter((x) => !(String(x.id) === String(item.id) && x.type === item.type));
    list.unshift({
      id: item.id,
      type: item.type,
      title: item.title || '',
      price: Number(item.price) || 0,
      image: item.image || '',
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
    return `
      <a class="product-card rv-card" href="${href}" data-clickable="true">
        <div class="product-image-container">
          <img src="${u.escapeHtml(String(img))}" alt="${u.escapeHtml(item.title)}" class="product-image" loading="lazy" />
        </div>
        <div class="product-info">
          <h3 class="product-title">${u.escapeHtml(item.title)}</h3>
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
  }

  window.DDRecentlyViewed = { track, render, read };

  // Auto-render en cualquier página que tenga la sección (el home)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => render());
  } else {
    render();
  }
})();
