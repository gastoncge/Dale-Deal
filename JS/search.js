// =====================================================
// DALE DEAL - Buscador del header
// =====================================================
//
// Comportamiento según la página:
//  - /productos → filtra el catálogo en el lugar (el filtro de texto lo aplica
//    ProductFilters, JS/filters.js). Nunca recarga ni redirige.
//  - /servicios → no hace nada: esa página filtra con su propio listener.
//  - Cualquier otra → Enter lleva a /productos?q=…
//
// En prod las páginas se sirven con URL limpia (/productos) y en dev con .html
// (/HTML/productos.html), así que la detección acepta las dos formas. Antes se
// buscaba 'productos.html' en el path: en prod daba falso, redirigía a
// /productos?q=… y la página relanzaba la búsqueda → recarga infinita.

/**
 * ¿Estamos en la página `name`? Acepta /name, /name/, /name.html y
 * /HTML/name.html. "producto" (la ficha) no matchea "productos".
 */
function isPageNamed(name) {
  const path = window.location.pathname.toLowerCase().replace(/\/+$/, '');
  return path.endsWith('/' + name) || path.endsWith('/' + name + '.html');
}

function isProductosPage() {
  return isPageNamed('productos');
}

function isServiciosPage() {
  return isPageNamed('servicios');
}

class SearchManager {
  constructor() {
    this.searchInput = null;
    this.debounceTimer = null;
    // La versión anterior guardaba el término en localStorage y lo relanzaba
    // en la carga siguiente (era parte del bucle). Limpiamos lo que haya quedado.
    try { localStorage.removeItem('searchQuery'); } catch (_) {}
    this.init();
  }

  init() {
    // Esperar a que el DOM esté listo
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.bindEvents());
    } else {
      this.bindEvents();
    }
  }

  bindEvents() {
    // El input vive en el header: en el build viene inyectado, en dev lo carga
    // component-loader.js async → reintentamos un rato y después abandonamos.
    let attempts = 0;
    const checkSearchInput = () => {
      this.searchInput = document.getElementById('searchInput');

      if (this.searchInput) {
        this.searchInput.addEventListener('input', (e) => this.handleSearch(e));
        this.searchInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' && !e.isComposing) {
            e.preventDefault();
            clearTimeout(this.debounceTimer);
            this.performSearch(e.target.value);
          }
        });
        this.loadSearchFromURL();
        DaleDeal.log('✓ Search input initialized');
      } else if (++attempts < 10) {
        setTimeout(checkSearchInput, 500);
      }
    };

    checkSearchInput();
  }

  /**
   * Mientras se escribe solo se busca en /productos (ahí se filtra en el
   * lugar); en el resto de las páginas se busca con Enter.
   */
  handleSearch(e) {
    if (!isProductosPage()) return;
    const query = e.target.value;
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.performSearch(query), 300);
  }

  /**
   * Realiza la búsqueda según la página (ver cabecera del archivo).
   */
  performSearch(query) {
    const q = String(query || '').trim();
    DaleDeal.log(`🔍 Buscando: "${q}"`);

    if (isServiciosPage()) return;
    if (isProductosPage()) {
      this.filterInPlace(q);
      return;
    }
    if (q) this.redirectToProductsPage(q);
  }

  /**
   * Ya estamos en /productos: filtrar sin recargar. ProductFilters es el
   * dueño del filtro de texto (escucha el input); acá le pasamos el término
   * por si vino de Enter y dejamos la URL en sincronía con replaceState, que
   * no recarga ni suma entradas al historial.
   */
  filterInPlace(q) {
    const filters = window.productFilters;
    if (filters && typeof filters.setSearchQuery === 'function') {
      filters.setSearchQuery(q);
    }
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('search');
      if (q) url.searchParams.set('q', q);
      else url.searchParams.delete('q');
      history.replaceState(history.state, '', url.pathname + url.search + url.hash);
    } catch (_) { /* sin History API: el filtro igual quedó aplicado */ }
  }

  /**
   * Lleva a la página de productos con el término. No se guarda nada en
   * localStorage: /productos lee el término de la URL.
   */
  redirectToProductsPage(query) {
    window.location.href = `/productos?q=${encodeURIComponent(query)}`;
  }

  /**
   * Término de búsqueda de la URL: ?q= (buscador del header, 404) o ?search=
   * (SearchAction del JSON-LD y links del home).
   */
  getQueryFromURL() {
    const params = new URLSearchParams(window.location.search);
    return (params.get('q') || params.get('search') || '').trim();
  }

  /**
   * En /productos muestra en el input el término que vino en la URL. Solo
   * completa el campo: el filtro lo aplica ProductFilters, que lee la misma URL
   * al crearse. No dispara búsquedas ni navega (eso era lo que armaba el bucle).
   */
  loadSearchFromURL() {
    if (!isProductosPage() || !this.searchInput) return;
    const query = this.getQueryFromURL();
    if (query && !this.searchInput.value) this.searchInput.value = query;
  }
}

// Inicializar SearchManager globalmente
if (typeof window !== 'undefined') {
  window.searchManager = new SearchManager();
  window.SearchManager = SearchManager;
}

// Exportar para uso con módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SearchManager;
}
