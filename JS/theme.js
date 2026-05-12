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
    const iconClass = theme === 'dark' ? 'bi bi-sun-fill' : 'bi bi-moon-stars-fill';
    const icon = document.getElementById('themeIcon');
    if (icon) icon.className = iconClass;
    const iconMobile = document.getElementById('themeIconMobile');
    if (iconMobile) iconMobile.className = iconClass;
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

    // Botón toggle en navbar desktop
    const btn = document.getElementById('themeToggle');
    if (btn) btn.addEventListener('click', toggleTheme);

    // Botón toggle en menú mobile — delegación porque el header se carga dinámicamente
    document.addEventListener('click', function(e) {
      if (e.target.closest('#themeToggleMobile')) toggleTheme();
    });

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
  function markLoaded(img) {
    if (img.classList.contains('loaded')) return;
    if (img.complete && img.naturalWidth > 0) {
      img.classList.add('loaded');
    } else {
      img.addEventListener('load', () => img.classList.add('loaded'), { once: true });
      img.addEventListener('error', () => img.classList.add('loaded'), { once: true });
    }
  }

  function initLazyImages(root = document) {
    root.querySelectorAll('img[loading="lazy"]').forEach(markLoaded);
  }

  function observeNewLazyImages() {
    const mo = new MutationObserver(mutations => {
      for (const m of mutations) {
        m.addedNodes.forEach(node => {
          if (node.nodeType !== 1) return;
          if (node.tagName === 'IMG' && node.getAttribute('loading') === 'lazy') {
            markLoaded(node);
          } else if (node.querySelectorAll) {
            node.querySelectorAll('img[loading="lazy"]').forEach(markLoaded);
          }
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initLazyImages();
    observeNewLazyImages();
  });
})();
