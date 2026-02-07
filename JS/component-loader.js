// =====================================================
// DALE DEAL - Component Loader
// =====================================================

/**
 * Detecta la ruta base según la ubicación del archivo HTML
 * @returns {string} Ruta base para los componentes
 */
function getBasePath() {
  const currentPath = window.location.pathname;

  // Si estamos en la raíz (index.html o /)
  if (currentPath === '/' || currentPath.endsWith('index.html') || currentPath.split('/').pop() === '') {
    return './HTML/components/';
  }

  // Si estamos dentro de la carpeta HTML/
  if (currentPath.includes('/HTML/')) {
    return './components/';
  }

  // Por defecto, asumir que estamos en la raíz
  return './HTML/components/';
}

/**
 * Carga un componente HTML y lo inyecta en el elemento especificado
 * @param {string} componentPath - Ruta al archivo del componente
 * @param {string} targetId - ID del elemento donde inyectar el componente
 * @returns {Promise<void>}
 */
async function loadComponent(componentPath, targetId) {
  try {
    const response = await fetch(componentPath);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const html = await response.text();
    const targetElement = document.getElementById(targetId);

    if (targetElement) {
      targetElement.innerHTML = html;
      DaleDeal.log(`✓ Componente cargado: ${componentPath} → #${targetId}`);
    } else {
      DaleDeal.warn(`⚠ Elemento con ID "${targetId}" no encontrado en la página`);
    }

  } catch (error) {
    DaleDeal.error(`Error cargando componente ${componentPath}:`, error);

    // Mostrar mensaje de error en el placeholder si existe
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      targetElement.innerHTML = `
        <div style="padding: 20px; background: #fee; border: 1px solid #fcc; border-radius: 8px; color: #c00;">
          <strong>Error:</strong> No se pudo cargar el componente ${componentPath}
        </div>
      `;
    }
  }
}

/**
 * Corrige las rutas del header según la ubicación
 */
function fixHeaderPaths() {
  const currentPath = window.location.pathname;
  const isRoot = currentPath === '/' || currentPath.endsWith('index.html') || currentPath.split('/').pop() === '';

  // Corregir logo link
  const homeLink = document.getElementById('homeLink');
  if (homeLink) {
    homeLink.href = isRoot ? './index.html' : '../index.html';
  }

  // Corregir logo image
  const logoImage = document.getElementById('logoImage');
  if (logoImage) {
    logoImage.src = isRoot ? './IMG/LOGO-2.png' : '../IMG/LOGO-2.png';
  }

  // Corregir enlaces de navegación
  const productsLink = document.querySelector('a[href="./productos.html"]');
  if (productsLink) {
    productsLink.href = isRoot ? './HTML/productos.html' : './productos.html';
  }

  const servicesLink = document.querySelector('a[href="./servicios.html"]');
  if (servicesLink) {
    servicesLink.href = isRoot ? './HTML/servicios.html' : './servicios.html';
  }

  // Corregir login link
  const loginLink = document.getElementById('loginLink');
  if (loginLink) {
    loginLink.href = isRoot ? './HTML/login.html' : './login.html';
  }

  DaleDeal.log('✓ Header paths fixed');
}

/**
 * Reinitializa los event listeners del newsletter después de cargar el footer
 */
function initializeNewsletterForm() {
  const newsletterForm = document.getElementById('newsletterForm');

  if (newsletterForm) {
    newsletterForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const email = document.getElementById('newsletterEmail').value;

      if (email) {
        // Simular suscripción al newsletter
        const btn = this.querySelector('.newsletter-btn');
        const originalHTML = btn.innerHTML;

        btn.innerHTML = '<i class="bi bi-check-circle"></i>';
        btn.disabled = true;
        btn.style.background = 'var(--success-600)';

        setTimeout(() => {
          btn.innerHTML = originalHTML;
          btn.disabled = false;
          btn.style.background = '';
          this.reset();

          // Mostrar notificación si el sistema está disponible
          if (window.DaleDeal?.utils?.showNotification) {
            window.DaleDeal.utils.showNotification(
              '¡Gracias por suscribirte! Recibirás nuestras mejores ofertas.',
              'success'
            );
          }
        }, 2000);
      }
    });

    DaleDeal.log('✓ Newsletter form inicializado');
  }
}

/**
 * Reinitializa los dropdowns de notificaciones y carrito después de cargar el header
 */
function initializeHeaderComponents() {
  // Reinitializar dropdown de notificaciones
  const notificationBtn = document.getElementById('notificationBtn');
  if (notificationBtn) {
    notificationBtn.addEventListener('shown.bs.dropdown', () => {
      if (window.notificationManager) {
        window.notificationManager.renderNotifications();
      }
    });
  }

  // Reinitializar dropdown del carrito
  const cartBtn = document.getElementById('cartBtn');
  if (cartBtn && window.cartManager) {
    cartBtn.addEventListener('shown.bs.dropdown', () => {
      window.cartManager.updateCartDropdown();
    });
  }

  DaleDeal.log('✓ Header components inicializados');
}

/**
 * Carga todos los componentes de la página
 */
async function loadAllComponents() {
  const basePath = getBasePath();

  DaleDeal.log(`📁 Base path detectado: ${basePath}`);

  // Cargar header
  const navbarPlaceholder = document.getElementById('navbar-placeholder');
  if (navbarPlaceholder) {
    await loadComponent(`${basePath}header.html`, 'navbar-placeholder');
    // Esperar un poco para que el DOM se actualice
    setTimeout(() => {
      fixHeaderPaths();
      initializeHeaderComponents();
    }, 100);
  }

  // Cargar footer
  const footerPlaceholder = document.getElementById('footer-placeholder');
  if (footerPlaceholder) {
    await loadComponent(`${basePath}footer.html`, 'footer-placeholder');
    // Esperar un poco para que el DOM se actualice
    setTimeout(initializeNewsletterForm, 100);
  }

  DaleDeal.log('✓ Todos los componentes cargados');
}

/**
 * Inicializar cuando el DOM esté listo
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadAllComponents);
} else {
  // DOM ya está listo
  loadAllComponents();
}

// Exportar funciones para uso global
if (typeof window !== 'undefined') {
  window.ComponentLoader = {
    loadComponent,
    loadAllComponents,
    getBasePath,
    initializeNewsletterForm,
    initializeHeaderComponents
  };
}
