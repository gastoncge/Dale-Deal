/**
 * =====================================================
 * DALE DEAL — theme.js
 * Maneja: Dark Mode, Barra de Anuncios, Back to Top
 * =====================================================
 */

/* =====================================================
   DARK MODE
   ===================================================== */
(function () {
  const STORAGE_KEY = 'daledeal_theme';

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const icon = document.getElementById('themeIcon');
    if (!icon) return;
    if (theme === 'dark') {
      icon.className = 'bi bi-sun-fill';
    } else {
      icon.className = 'bi bi-moon-stars-fill';
    }
  }

  function getStoredTheme() {
    try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
  }

  function setStoredTheme(theme) {
    try { localStorage.setItem(STORAGE_KEY, theme); } catch {}
  }

  function getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function initTheme() {
    const stored = getStoredTheme();
    const theme  = stored || getSystemTheme();
    applyTheme(theme);
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next    = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    setStoredTheme(next);
  }

  // Aplicar tema antes del primer render (evita flash)
  initTheme();

  document.addEventListener('DOMContentLoaded', function () {
    initTheme(); // Re-aplicar cuando el DOM esté listo (el icon puede no existir aún)

    // Botón toggle en navbar
    const btn = document.getElementById('themeToggle');
    if (btn) btn.addEventListener('click', toggleTheme);

    // Escuchar cambios del sistema en tiempo real
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!getStoredTheme()) applyTheme(e.matches ? 'dark' : 'light');
    });
  });
})();


/* =====================================================
   BACK TO TOP
   ===================================================== */
(function () {
  function createBackToTopButton() {
    if (document.getElementById('backToTop')) return;
    const btn = document.createElement('button');
    btn.id    = 'backToTop';
    btn.title = 'Volver arriba';
    btn.innerHTML = '<i class="bi bi-arrow-up"></i>';
    document.body.appendChild(btn);

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    window.addEventListener('scroll', () => {
      if (window.scrollY > 400) {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }
    }, { passive: true });
  }

  document.addEventListener('DOMContentLoaded', createBackToTopButton);
})();


/* =====================================================
   SKELETON HELPERS — expuesto globalmente
   ===================================================== */
window.DaleDealTheme = window.DaleDealTheme || {};

/**
 * Genera N tarjetas skeleton para mostrar mientras cargan los productos.
 * @param {number} count - cantidad de skeletons
 * @returns {string} HTML de las tarjetas
 */
window.DaleDealTheme.renderSkeletons = function (count = 8) {
  return Array.from({ length: count }, () => `
    <div class="col">
      <div class="product-card-skeleton">
        <div class="sk-image skeleton"></div>
        <div class="sk-body">
          <div class="sk-title skeleton"></div>
          <div class="sk-price skeleton"></div>
          <div class="sk-stars skeleton"></div>
          <div class="sk-btn skeleton"></div>
        </div>
      </div>
    </div>
  `).join('');
};


/* =====================================================
   LAZY IMAGE FADE-IN
   ===================================================== */
(function () {
  function initLazyImages() {
    const images = document.querySelectorAll('img[loading="lazy"]');
    images.forEach(img => {
      if (img.complete) {
        img.classList.add('loaded');
      } else {
        img.addEventListener('load', () => img.classList.add('loaded'));
      }
    });
  }
  document.addEventListener('DOMContentLoaded', initLazyImages);
})();
