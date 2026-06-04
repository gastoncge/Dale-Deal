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

  if (isRoot) {
    // Desde index.html, todos los links del header que apuntan a ./xxx.html
    // (excepto index.html) deben pasar a ./HTML/xxx.html
    document.querySelectorAll('#navbar-placeholder a[href]').forEach(link => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('./') && href.includes('.html') && !href.includes('index.html')) {
        link.setAttribute('href', './HTML/' + href.slice(2));
      }
    });
  }

  DaleDeal.log('✓ Header paths fixed');
}

/**
 * Corrige las rutas del footer según la ubicación
 */
function fixFooterPaths() {
  const currentPath = window.location.pathname;
  const isRoot = currentPath === '/' || currentPath.endsWith('index.html') || currentPath.split('/').pop() === '';

  // Always fix logo path explicitly
  const footerLogoImg = document.querySelector('#footer-placeholder .footer-logo-img');
  if (footerLogoImg) {
    footerLogoImg.src = isRoot ? './IMG/LOGO-2.png' : '../IMG/LOGO-2.png';
  }

  if (isRoot) {
    document.querySelectorAll('#footer-placeholder a[href]').forEach(link => {
      const href = link.getAttribute('href');
      if (href && href.startsWith('./') && href.includes('.html') && !href.includes('index.html')) {
        link.setAttribute('href', './HTML/' + href.slice(2));
      }
    });
  }
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
        window.notificationManager.loadNotifications();
        window.notificationManager.renderNotifications();
        window.notificationManager.updateBadge();
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

  // Botón Publicar: apuntar a sección según página actual
  fixPublicarLink();

  DaleDeal.log('✓ Header components inicializados');
}

/**
 * Ajusta el link del botón "Publicar" según la página actual.
 * En productos.html → publicar.html con tab=producto
 * En servicios.html → publicar.html con tab=servicio
 * En otras páginas → publicar.html sin parámetros
 */
function fixPublicarLink() {
  const path = window.location.pathname.toLowerCase();
  const isInHtml = path.includes('/html/');
  const base = isInHtml ? './publicar.html' : './HTML/publicar.html';

  let href = base;
  if (path.includes('productos')) {
    href = base + '?tab=producto';
  } else if (path.includes('servicios')) {
    href = base + '?tab=servicio';
  }

  // Actualizar todos los links de Publicar en el header (desktop + mobile)
  document.querySelectorAll('#navbar-placeholder a[href*="publicar"]').forEach(link => {
    link.setAttribute('href', href);
  });
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
      // Avisar a auth.js que ya tiene los elementos del navbar disponibles
      // (el header se carga async, después de que auth.js corrió updateUI()
      //  por primera vez con elementos inexistentes)
      try {
        if (window.authManager?.updateUI) {
          window.authManager.updateUI();
        }
      } catch (_) {}
      // Evento global por si otros módulos lo necesitan
      document.dispatchEvent(new CustomEvent('daledeal:header-loaded'));
    }, 100);
  }

  // Cargar footer
  const footerPlaceholder = document.getElementById('footer-placeholder');
  if (footerPlaceholder) {
    await loadComponent(`${basePath}footer.html`, 'footer-placeholder');
    // Esperar un poco para que el DOM se actualice
    setTimeout(() => {
      initializeNewsletterForm();
      fixFooterPaths();
      if (typeof window.onFooterLoaded === 'function') window.onFooterLoaded();
    }, 100);
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
/**
 * DALE DEAL - Sistema de Notificaciones
 * Maneja todas las funcionalidades relacionadas con notificaciones
 */

class NotificationManager {
  constructor() {
    this.notifications = [];
    this.currentFilter = 'all';
    this.selectedNotifications = new Set();
    this.init();
  }

  init() {
    this.loadNotifications();
    this.bindEvents();
    this.updateBadge();
    this.updateCounter();
    // Re-cargar cuando el header termine y haya token (login post-DOMContentLoaded)
    document.addEventListener('daledeal:header-loaded', () => this.loadNotifications());
  }

  // Cargar notificaciones reales desde el backend (órdenes del usuario).
  // Si no está logueado o falla la API, deja la lista vacía.
  async loadNotifications() {
    const token = localStorage.getItem('daledeal:token');
    if (!token || !window.DaleDeal?.api?.apiFetch) {
      this.notifications = [];
      this.renderNotifications();
      this.updateBadge();
      this.updateCounter();
      return;
    }

    try {
      const apiFetch = window.DaleDeal.api.apiFetch;

      // Traemos compras y ventas en paralelo
      const [myOrders, mySales] = await Promise.all([
        apiFetch('/orders/my?limit=20').catch(() => ({ data: [] })),
        apiFetch('/orders/sales?limit=20').catch(() => ({ data: [] })),
      ]);

      const dismissed = this.getDismissedSet();
      const seen      = this.getSeenSet();

      const notifs = [];

      // Como comprador
      (myOrders?.data || []).forEach(o => {
        const ev = this.buildBuyerNotification(o);
        if (ev) notifs.push(ev);
      });

      // Como vendedor
      (mySales?.data || []).forEach(o => {
        const ev = this.buildSellerNotification(o);
        if (ev) notifs.push(ev);
      });

      // Filtrar las descartadas, ordenar más nuevo primero, marcar leídas si ya las vio
      this.notifications = notifs
        .filter(n => !dismissed.has(n.id))
        .map(n => ({ ...n, read: seen.has(n.id) }))
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 20);

      this.renderNotifications();
      this.updateBadge();
      this.updateCounter();
    } catch (err) {
      if (typeof DaleDeal !== 'undefined') DaleDeal.warn('No se pudieron cargar notificaciones reales:', err.message);
      this.notifications = [];
      this.renderNotifications();
      this.updateBadge();
    }
  }

  // Construye la notificación según el estado de la orden, vista del comprador
  buildBuyerNotification(o) {
    const id = `buyer-${o.id}-${o.status}`;
    const ts = new Date(o.updated_at || o.created_at).getTime();
    const product = o.product_title || 'tu compra';
    const orderId = o.id;

    if (o.status === 'shipped') {
      return {
        id, type: 'orders', timestamp: ts, time: this.relativeTime(ts), read: false,
        title: 'Tu pedido fue despachado',
        message: `${product} (#${orderId}) está en camino${o.tracking_number ? ` · Tracking: ${o.tracking_number}` : ''}`,
        icon: 'bi-truck', iconColor: 'bg-info',
        actions: [{ label: 'Ver detalles', action: 'view', data: { orderId } }],
      };
    }
    if (o.status === 'delivered') {
      return {
        id, type: 'orders', timestamp: ts, time: this.relativeTime(ts), read: false,
        title: 'Pedido entregado',
        message: `${product} fue entregado. ¿Cómo fue tu experiencia?`,
        icon: 'bi-box-seam', iconColor: 'bg-success',
        actions: [{ label: 'Dejar reseña', action: 'rate', data: { orderId } }],
      };
    }
    if (o.status === 'confirmed' || o.payment_status === 'paid') {
      return {
        id, type: 'orders', timestamp: ts, time: this.relativeTime(ts), read: false,
        title: 'Compra confirmada',
        message: `${product} (#${orderId}) está siendo preparado por el vendedor`,
        icon: 'bi-check-circle', iconColor: 'bg-success',
        actions: [{ label: 'Ver detalles', action: 'view', data: { orderId } }],
      };
    }
    if (o.status === 'cancelled') {
      return {
        id, type: 'orders', timestamp: ts, time: this.relativeTime(ts), read: false,
        title: 'Pedido cancelado',
        message: `${product} (#${orderId}) fue cancelado`,
        icon: 'bi-x-circle', iconColor: 'bg-danger',
        actions: [],
      };
    }
    return null;
  }

  // Vista del vendedor
  buildSellerNotification(o) {
    const id = `seller-${o.id}-${o.status}`;
    const ts = new Date(o.updated_at || o.created_at).getTime();
    const product = o.product_title || 'tu producto';
    const orderId = o.id;
    const buyer   = o.buyer_name || 'un comprador';

    // Nueva venta (pago confirmado)
    if (o.status === 'confirmed' || o.payment_status === 'paid') {
      return {
        id, type: 'orders', timestamp: ts, time: this.relativeTime(ts), read: false,
        title: '¡Tenés una venta nueva!',
        message: `${buyer} compró "${product}". Preparalo para envío.`,
        icon: 'bi-cart-check', iconColor: 'bg-success',
        actions: [{ label: 'Ver venta', action: 'view-sale', data: { orderId } }],
      };
    }
    if (o.status === 'delivered') {
      return {
        id, type: 'orders', timestamp: ts, time: this.relativeTime(ts), read: false,
        title: 'Venta completada',
        message: `${buyer} recibió "${product}". Tu pago está liberado.`,
        icon: 'bi-cash-coin', iconColor: 'bg-success',
        actions: [],
      };
    }
    return null;
  }

  // Texto relativo "Hace X tiempo"
  relativeTime(ts) {
    const diff = Date.now() - ts;
    const m = Math.floor(diff / 60000);
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);
    if (m < 1) return 'Recién';
    if (m < 60) return `Hace ${m} min`;
    if (h < 24) return `Hace ${h} h`;
    if (d < 30) return `Hace ${d} día${d === 1 ? '' : 's'}`;
    return new Date(ts).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
  }

  // IDs de notificaciones que el usuario descartó (X)
  getDismissedSet() {
    try {
      const raw = localStorage.getItem('daledeal:notif:dismissed');
      return new Set(raw ? JSON.parse(raw) : []);
    } catch { return new Set(); }
  }
  saveDismissedSet(set) {
    try { localStorage.setItem('daledeal:notif:dismissed', JSON.stringify([...set])); } catch {}
  }

  // IDs de notificaciones que ya marcó como leídas
  getSeenSet() {
    try {
      const raw = localStorage.getItem('daledeal:notif:seen');
      return new Set(raw ? JSON.parse(raw) : []);
    } catch { return new Set(); }
  }
  saveSeenSet(set) {
    try { localStorage.setItem('daledeal:notif:seen', JSON.stringify([...set])); } catch {}
  }

  // Guardar estado (qué fueron leídas) en localStorage.
  // Como las notificaciones se generan dinámicamente desde el backend,
  // solo persistimos el estado: qué IDs el usuario ya vio o descartó.
  saveNotifications() {
    const seen = new Set();
    this.notifications.forEach(n => { if (n.read) seen.add(n.id); });
    this.saveSeenSet(seen);
  }

  // Vincular eventos
  bindEvents() {
    // Filtros
    document.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', (e) => this.handleFilterChange(e));
    });

    // Botones de acción principales
    document.getElementById('markAllAsRead')?.addEventListener('click', () => this.markAllAsRead());
    document.getElementById('markSelectedAsRead')?.addEventListener('click', () => this.markSelectedAsRead());
    document.getElementById('viewAllNotifications')?.addEventListener('click', () => this.viewAllNotifications());

    // Event delegation para notificaciones dinámicas (dropdown)
    document.getElementById('notificationsDropdownBody')?.addEventListener('click', (e) => this.handleNotificationClick(e));
    
    // Prevenir que el dropdown se cierre al hacer clic en filtros
    document.querySelector('.notifications-dropdown')?.addEventListener('click', (e) => {
      if (e.target.closest('.notifications-filter') || e.target.closest('.notifications-footer')) {
        e.stopPropagation();
      }
    });

    // Actualizar el dropdown cuando se abre
    document.getElementById('notificationBtn')?.addEventListener('shown.bs.dropdown', () => {
      this.loadNotifications();
      this.renderNotifications();
      this.updateBadge();
    });
  }

  // Manejar cambio de filtros
  handleFilterChange(e) {
    e.preventDefault();
    e.stopPropagation();
    document.querySelectorAll('.filter-chip').forEach(chip => chip.classList.remove('active'));
    const chip = e.target.closest('.filter-chip');
    if (chip) chip.classList.add('active');
    this.currentFilter = chip?.dataset.filter || e.target.dataset.filter;
    this.renderNotifications();
  }

  // Manejar clics en notificaciones
  handleNotificationClick(e) {
    const target = e.target;
    const notificationItem = target.closest('.notification-item');
    
    if (!notificationItem) return;

    const notificationId = parseInt(notificationItem.dataset.id);

    // Marcar notificación como seleccionada al hacer clic
    if (target.closest('.notification-content')) {
      this.toggleNotificationSelection(notificationId, notificationItem);
    }

    // Cerrar notificación
    if (target.closest('.notification-close')) {
      e.preventDefault();
      e.stopPropagation();
      this.dismissNotification(notificationId);
    }

    // Acciones de notificación
    if (target.classList.contains('notification-action-btn')) {
      e.preventDefault();
      e.stopPropagation();
      const action = target.dataset.action;
      this.handleNotificationAction(notificationId, action);
    }
  }

  // Alternar selección de notificación
  toggleNotificationSelection(notificationId, element) {
    if (this.selectedNotifications.has(notificationId)) {
      this.selectedNotifications.delete(notificationId);
      element.classList.remove('selected');
    } else {
      this.selectedNotifications.add(notificationId);
      element.classList.add('selected');
    }
    this.updateActionButtons();
  }

  // Actualizar botones de acción según selección
  updateActionButtons() {
    const selectedCount = this.selectedNotifications.size;
    const markSelectedBtn = document.getElementById('markSelectedAsRead');
    
    if (markSelectedBtn) {
      markSelectedBtn.disabled = selectedCount === 0;
      markSelectedBtn.innerHTML = selectedCount > 0 
        ? `<i class="bi bi-check me-2"></i>Marcar ${selectedCount} seleccionada${selectedCount > 1 ? 's' : ''}`
        : '<i class="bi bi-check me-2"></i>Marcar seleccionadas';
    }
  }

  // Marcar todas las notificaciones como leídas
  markAllAsRead() {
    const unreadNotifications = this.notifications.filter(n => !n.read);
    
    if (unreadNotifications.length === 0) {
      this.showToast('No hay notificaciones sin leer', 'info');
      return;
    }

    // Marcar directamente sin confirmación
    this.notifications.forEach(notification => {
      notification.read = true;
    });
    
    this.selectedNotifications.clear();
    this.saveNotifications();
    this.renderNotifications();
    this.updateBadge();
    
    this.showToast(`${unreadNotifications.length} notificaciones marcadas como leídas`, 'success');
    
    // Agregar animación visual
    this.animateMarkAsRead();
  }

  // Marcar notificaciones seleccionadas como leídas
  markSelectedAsRead() {
    if (this.selectedNotifications.size === 0) {
      this.showToast('Selecciona al menos una notificación', 'warning');
      return;
    }

    const selectedIds = Array.from(this.selectedNotifications);
    let markedCount = 0;

    selectedIds.forEach(id => {
      const notification = this.notifications.find(n => n.id === id);
      if (notification && !notification.read) {
        notification.read = true;
        markedCount++;
      }
    });

    this.selectedNotifications.clear();
    this.saveNotifications();
    this.renderNotifications();
    this.updateBadge();
    
    this.showToast(`${markedCount} notificación${markedCount > 1 ? 'es' : ''} marcada${markedCount > 1 ? 's' : ''} como leída${markedCount > 1 ? 's' : ''}`, 'success');
  }

  // Descartar notificación: la agregamos al set de "dismissed" para que
  // no vuelva a aparecer aunque la API la siga devolviendo.
  dismissNotification(notificationId) {
    const index = this.notifications.findIndex(n => n.id === notificationId);
    if (index === -1) return;

    this.notifications.splice(index, 1);
    this.selectedNotifications.delete(notificationId);

    const dismissed = this.getDismissedSet();
    dismissed.add(notificationId);
    this.saveDismissedSet(dismissed);

    this.renderNotifications();
    this.updateBadge();
    this.showToast('Notificación eliminada', 'info');
  }

  // Manejar acciones de notificación
  handleNotificationAction(notificationId, action) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (!notification) return;

    // Marcar como leída al interactuar
    if (!notification.read) {
      notification.read = true;
      this.saveNotifications();
      this.updateBadge();
    }

    // Resolver navegación según acción + datos
    const data = notification.actions?.find(a => a.action === action)?.data || {};
    const isInHtmlFolder = window.location.pathname.includes('/HTML/');
    const prefix = isInHtmlFolder ? './' : './HTML/';

    switch (action) {
      case 'view':         // Comprador ve detalle de su orden
      case 'track':
        // Centro de mando, sección "mis compras"
        window.location.href = `${prefix}notificaciones.html#mis-compras`;
        break;
      case 'view-sale':    // Vendedor ve la venta
        window.location.href = `${prefix}mis-ventas.html`;
        break;
      case 'rate':         // Dejar reseña: ir al producto, scrollear al tab
        if (data.orderId) {
          window.location.href = `${prefix}notificaciones.html#mis-compras`;
        }
        break;
      case 'support':
        window.location.href = `${prefix}centro-ayuda.html`;
        break;
      default:
        this.showToast(`Acción: ${action}`, 'info');
    }

    this.renderNotifications();
  }

  // Ver todas las notificaciones
  viewAllNotifications() {
    const isInHtmlFolder = window.location.pathname.includes('/HTML/');
    window.location.href = isInHtmlFolder ? './notificaciones.html' : './HTML/notificaciones.html';
  }

  // Renderizar notificaciones
  renderNotifications() {
    const container = document.getElementById('notificationsDropdownBody');
    if (!container) return;

    const filteredNotifications = this.getFilteredNotifications();

    if (filteredNotifications.length === 0) {
      container.innerHTML = this.getEmptyState();
      return;
    }

    container.innerHTML = filteredNotifications.map(notification => 
      this.createNotificationHTML(notification)
    ).join('');

    this.updateCounter();
    this.updateActionButtons();
  }

  // Obtener notificaciones filtradas
  getFilteredNotifications() {
    return this.notifications.filter(notification => {
      switch (this.currentFilter) {
        case 'unread':
          return !notification.read;
        case 'orders':
          return notification.type === 'orders';
        case 'offers':
          return notification.type === 'offers';
        default:
          return true;
      }
    });
  }

  // Crear HTML de notificación
  createNotificationHTML(notification) {
    const isSelected = this.selectedNotifications.has(notification.id);
    
    return `
      <div class="notification-item ${!notification.read ? 'unread' : ''} ${isSelected ? 'selected' : ''}" 
           data-id="${notification.id}" data-type="${notification.type}">
        <div class="notification-icon ${notification.iconColor}">
          <i class="${notification.icon} text-white"></i>
        </div>
        <div class="notification-content">
          <h6>${notification.title}</h6>
          <p>${notification.message}</p>
          <small>${notification.time}</small>
          <div class="notification-actions">
            ${notification.actions.map(action => 
              `<button class="notification-action-btn" data-action="${action.action}">${action.label}</button>`
            ).join('')}
          </div>
        </div>
        <button class="notification-close" data-action="dismiss">
          <i class="bi bi-x"></i>
        </button>
      </div>
    `;
  }

  // Estado vacío
  getEmptyState() {
    // Voseo argentino: "tenés" en lugar de "tienes". Una sola frase corta —
    // el filtro activo ya es visible en los chips, no hace falta repetirlo.
    const messages = {
      all:    'No tenés notificaciones nuevas',
      unread: 'No tenés notificaciones sin leer',
      orders: 'No tenés notificaciones de pedidos',
      offers: 'No tenés notificaciones de ofertas'
    };

    return `
      <div class="notifications-empty">
        <i class="bi bi-bell-slash"></i>
        <p>${messages[this.currentFilter] || messages.all}</p>
      </div>
    `;
  }

  // Actualizar contador
  updateCounter() {
    const counter = document.getElementById('notificationsCount');
    if (counter) {
      const unreadCount = this.notifications.filter(n => !n.read).length;
      counter.textContent = unreadCount;
      counter.style.display = unreadCount > 0 ? 'inline' : 'none';
    }
  }

  // Actualizar badge del navbar
  updateBadge() {
    const badge = document.getElementById('notificationBadge');
    if (badge) {
      const unreadCount = this.notifications.filter(n => !n.read).length;
      badge.textContent = unreadCount;
      badge.style.display = unreadCount > 0 ? 'flex' : 'none';
    }
  }

  // Animación para marcar como leído
  animateMarkAsRead() {
    const items = document.querySelectorAll('.notification-item.unread');
    items.forEach((item, index) => {
      setTimeout(() => {
        item.classList.add('marking-read');
        setTimeout(() => {
          item.classList.remove('unread', 'marking-read');
        }, 300);
      }, index * 100);
    });
  }

  // Mostrar toast de notificación
  showToast(message, type = 'info') {
    // Crear toast dinámicamente
    const toastId = 'toast_' + Date.now();
    const toastHTML = `
      <div class="toast align-items-center text-white bg-${type === 'success' ? 'success' : type === 'warning' ? 'warning' : type === 'error' ? 'danger' : 'primary'} border-0" 
           role="alert" aria-live="assertive" aria-atomic="true" id="${toastId}">
        <div class="d-flex">
          <div class="toast-body">
            <i class="bi bi-${type === 'success' ? 'check-circle' : type === 'warning' ? 'exclamation-triangle' : type === 'error' ? 'x-circle' : 'info-circle'} me-2"></i>
            ${message}
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
      </div>
    `;

    // Agregar toast al DOM
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
      toastContainer.style.zIndex = '9999';
      document.body.appendChild(toastContainer);
    }

    toastContainer.insertAdjacentHTML('beforeend', toastHTML);

    // Mostrar toast
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
    toast.show();

    // Eliminar del DOM después de ocultarse
    toastElement.addEventListener('hidden.bs.toast', () => {
      toastElement.remove();
    });
  }

  // Agregar nueva notificación (método público)
  addNotification(notification) {
    const newNotification = {
      id: Date.now(),
      timestamp: Date.now(),
      read: false,
      ...notification
    };

    this.notifications.unshift(newNotification);
    this.saveNotifications();
    this.updateBadge();

    // Mostrar toast si el dropdown no está abierto
    const dropdown = document.querySelector('.notifications-dropdown');
    if (!dropdown || !dropdown.classList.contains('show')) {
      this.showToast(`Nueva notificación: ${notification.title}`, 'info');
    }
  }

  // Obtener estadísticas
  getStats() {
    return {
      total: this.notifications.length,
      unread: this.notifications.filter(n => !n.read).length,
      orders: this.notifications.filter(n => n.type === 'orders').length,
      offers: this.notifications.filter(n => n.type === 'offers').length
    };
  }
}

// Inicializar el sistema de notificaciones cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  window.notificationManager = new NotificationManager();
  
  // Agregar estilos adicionales para las animaciones
  const style = document.createElement('style');
  style.textContent = `
    .notification-item.selected {
      background: var(--primary-red-light) !important;
      border-color: var(--primary-red) !important;
    }
    
    .notification-item.marking-read {
      animation: markAsRead 0.3s ease-out;
    }
    
    @keyframes markAsRead {
      0% { background: var(--primary-red-light); }
      100% { background: var(--white); }
    }
    
    .toast-container {
      z-index: 9999;
    }
  `;
  document.head.appendChild(style);
});/**
 * DALE DEAL - Shim del chat global.
 *
 * El chat real vive en la sección "Mensajes" del perfil
 * (HTML/notificaciones.html#mensajes). Este archivo ya NO inyecta
 * un widget flotante en el feed; sólo expone `DaleDeal.chat` con
 * funciones que redirigen al perfil y un badge global opcional.
 *
 * Requiere api.js + api-messages.js cargados previamente.
 */
(function () {
  'use strict';

  function isLoggedIn() {
    return !!localStorage.getItem('daledeal:token');
  }

  function messagesApi() {
    return window.DaleDeal?.api?.messages || null;
  }

  // Path al perfil > Mensajes, dependiendo de desde qué carpeta se llama
  function mensajesUrl(convId) {
    const isHtmlSubdir = window.location.pathname.includes('/HTML/');
    const base = isHtmlSubdir ? './notificaciones.html' : './HTML/notificaciones.html';
    const hash = '#mensajes';
    // usamos un query-param que la página del perfil puede leer para abrir
    // directamente la conversación
    const qs = convId ? `?conv=${encodeURIComponent(convId)}` : '';
    return base + qs + hash;
  }

  async function refreshUnreadBadge() {
    const api = messagesApi();
    const badge =
      document.getElementById('chatFloatBadge') ||
      document.getElementById('profileMensajesBadge');
    if (!badge) return;
    if (!api || !isLoggedIn()) {
      badge.style.display = 'none';
      return;
    }
    try {
      const unread = await api.getUnreadCount();
      if (unread > 0) {
        badge.textContent = unread > 99 ? '99+' : String(unread);
        badge.style.display = '';
      } else {
        badge.style.display = 'none';
      }
    } catch {
      /* silencioso */
    }
  }

  function init() {
    if (window._chatInitialized) return;
    window._chatInitialized = true;
    refreshUnreadBadge();
    setInterval(refreshUnreadBadge, 30000);
  }

  // API pública — redirige al perfil en vez de abrir un widget flotante
  window.DaleDeal = window.DaleDeal || {};
  window.DaleDeal.chat = {
    /**
     * Abre una conversación existente: navega al perfil > Mensajes y
     * deja que esa página auto-seleccione la conversación.
     */
    openConversation(conversationId) {
      window.location.href = mensajesUrl(conversationId);
    },

    /**
     * Inicia (o recupera) una conversación con el dueño de un item y
     * redirige al perfil para continuarla.
     */
    async startWith(item_type, item_id, initialMessage) {
      const api = messagesApi();
      if (!api) {
        alert('No se pudo iniciar la conversación (API no disponible).');
        return;
      }
      if (!isLoggedIn()) {
        alert('Tenés que iniciar sesión para enviar mensajes.');
        return;
      }
      try {
        const res = await api.startConversation(item_type, item_id, initialMessage);
        const convId = res?.conversation?.id;
        if (convId) window.location.href = mensajesUrl(convId);
        return convId;
      } catch (err) {
        console.error('[chat] startWith error:', err);
        alert('No se pudo iniciar la conversación: ' + (err.message || 'error'));
      }
    },

    refreshBadge: refreshUnreadBadge,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
/**
 * DALE DEAL - Widget flotante de soporte / ayuda
 *
 * Botón chiquito siempre visible abajo a la derecha. El "popup saludando"
 * se abre solo:
 *   - Primera visita del usuario (no hay estado guardado)
 *   - O si pasaron más de REMIND_AFTER_DAYS desde el último "X" (dismiss)
 *
 * Si el usuario lo abre manualmente al menos una vez, nunca más se
 * auto-abre (asumimos que ya sabe que está ahí).
 *
 * Contenido: FAQ canned + botón para ir al centro de contacto.
 */
(function () {
  'use strict';

  const STORAGE_KEY         = 'dd_support_widget_state';
  const AUTO_OPEN_DELAY_MS  = 3000;   // esperar 3s después del load (cuando AUTO_OPEN_ENABLED=true)
  const AUTO_CLOSE_DELAY_MS = 20000;  // si el usuario no interactúa, se cierra solo
  const REMIND_AFTER_DAYS   = 7;
  // Auto-abrir el tooltip a los 3s de cargar la página se sentía "amateur" —
  // tapaba contenido en cada primera visita sin que el usuario lo pidiera.
  // Plataformas pro (Stripe, Linear, Notion) NUNCA interrumpen así.
  // El botón flotante sigue visible y clickeable, solo no se abre solo.
  const AUTO_OPEN_ENABLED   = false;
  const DEBUG               = false;  // logs en prod desactivados
  const log = (...a) => DEBUG && console.log('[dd-support]', ...a);

  const isHtmlSubdir = window.location.pathname.includes('/HTML/');
  const contactUrl = isHtmlSubdir
    ? './notificaciones.html#contacto'
    : './HTML/notificaciones.html#contacto';
  const reportUrl = isHtmlSubdir
    ? './notificaciones.html#reportar-problema'
    : './HTML/notificaciones.html#reportar-problema';
  const helpUrl = isHtmlSubdir
    ? './notificaciones.html#centro-ayuda'
    : './HTML/notificaciones.html#centro-ayuda';

  // ── Estado persistente ────────────────────────────────────────────────────
  function getState() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch { return {}; }
  }
  function saveState(patch) {
    const cur = getState();
    const next = { ...cur, ...patch };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  }

  function shouldAutoOpen() {
    if (!AUTO_OPEN_ENABLED) return false;
    const s = getState();
    if (s.hasOpenedEver) return false;
    if (s.dismissedAt) {
      const days = (Date.now() - s.dismissedAt) / 86400000;
      if (days < REMIND_AFTER_DAYS) return false;
    }
    return true;
  }

  // ── FAQ canned ────────────────────────────────────────────────────────────
  const FAQ = [
    {
      q: '¿Cómo publico un producto o servicio?',
      a: 'Hacé clic en <b>Publicar</b> arriba a la derecha y completá el formulario con título, fotos, descripción y precio. Es gratis.'
    },
    {
      q: '¿Cuánto cuesta usar Dale Deal?',
      a: 'Publicar es <b>gratis</b>. Solo cobramos una comisión del <b>5%</b> sobre las ventas concretadas.'
    },
    {
      q: '¿Cómo funcionan los pagos?',
      a: 'Los cobros se procesan por <b>Mercado Pago</b>. Recibís el dinero en tu cuenta 7 días después de que el comprador confirme la recepción.'
    },
    {
      q: '¿Cómo coordino el envío?',
      a: 'Chateás directo con el comprador desde la sección <b>Mensajes</b> de tu perfil. También podés ofrecer retiro en persona.'
    },
    {
      q: 'Tengo un problema con una compra',
      a: `Podés <a href="${reportUrl}" style="color:var(--primary-red);font-weight:700;">reportar el problema acá</a> y te respondemos en menos de 24hs.`
    }
  ];

  // ── CSS inyectado ────────────────────────────────────────────────────────
  const CSS = `
    .dd-support-widget { position: fixed; bottom: 24px; right: 40px; z-index: 9998; font-family: var(--font-family-base, system-ui, sans-serif); }
    .dd-support-btn { width: 56px; height: 56px; border-radius: 50%; border: none; background: var(--gradient-primary, linear-gradient(135deg,#e53e3e,#f97316)); color: #fff; cursor: pointer; box-shadow: 0 10px 25px rgba(229,62,62,0.35); display: flex; align-items: center; justify-content: center; font-size: 22px; transition: transform .2s ease, box-shadow .2s ease; }
    .dd-support-btn:hover { transform: scale(1.08); box-shadow: 0 14px 32px rgba(229,62,62,0.45); }
    .dd-support-btn i { line-height: 1; }
    .dd-support-pulse::after { content:''; position:absolute; inset:-6px; border-radius:50%; border:2px solid rgba(229,62,62,0.5); animation: dd-pulse 1.8s ease-out infinite; pointer-events:none; }
    @keyframes dd-pulse { 0% { transform: scale(1); opacity: .8; } 100% { transform: scale(1.4); opacity: 0; } }

    /* visibility: hidden además de opacity 0 — defense-in-depth: algunas reglas
     * globales (lazy fade-in, AOS, etc.) pueden re-aplicar opacity:1 sin querer.
     * visibility no se ve afectada por esas reglas, así que el tooltip queda
     * oculto hasta que se le agrega explícitamente la clase .show. */
    .dd-support-tooltip { position: absolute; bottom: 72px; right: 0; background: #fff; color: #1f2937; border-radius: 14px; padding: 14px 44px 14px 16px; box-shadow: 0 12px 30px rgba(0,0,0,0.15); max-width: 280px; font-size: 14px; font-weight: 500; opacity: 0; visibility: hidden; transform: translateY(8px); pointer-events: none; transition: opacity .25s ease, transform .25s ease, visibility .25s; }
    .dd-support-tooltip::after { content: ''; position: absolute; bottom: -6px; right: 22px; width: 12px; height: 12px; background: #fff; transform: rotate(45deg); box-shadow: 3px 3px 6px rgba(0,0,0,0.04); }
    .dd-support-tooltip.show { opacity: 1; visibility: visible; transform: translateY(0); pointer-events: auto; }
    .dd-support-tooltip-x { position: absolute; top: 6px; right: 8px; background: none; border: none; color: #9ca3af; cursor: pointer; font-size: 14px; padding: 4px; line-height: 1; border-radius: 50%; width: 22px; height: 22px; display:flex; align-items:center; justify-content:center; }
    .dd-support-tooltip-x:hover { color: #e53e3e; background: #fef2f2; }

    .dd-support-panel { position: absolute; bottom: 72px; right: 0; width: 340px; max-width: calc(100vw - 40px); max-height: 520px; background: #fff; border-radius: 18px; box-shadow: 0 20px 50px rgba(0,0,0,0.22); display: none; flex-direction: column; overflow: hidden; }
    .dd-support-panel.show { display: flex; animation: dd-slide-up .25s ease; }
    @keyframes dd-slide-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .dd-support-header { padding: 18px 18px 14px; background: var(--gradient-primary, linear-gradient(135deg,#e53e3e,#f97316)); color: #fff; }
    .dd-support-header h4 { margin: 0 0 4px 0; font-size: 17px; font-weight: 800; }
    .dd-support-header p { margin: 0; font-size: 13px; opacity: .9; }
    .dd-support-header-close { position: absolute; top: 12px; right: 12px; background: rgba(255,255,255,0.2); border: none; color: #fff; cursor: pointer; width: 28px; height: 28px; border-radius: 50%; display:flex; align-items:center; justify-content:center; font-size: 14px; transition: background .15s; }
    .dd-support-header-close:hover { background: rgba(255,255,255,0.35); }
    .dd-support-body { flex: 1; overflow-y: auto; padding: 12px 14px; background: #f9fafb; }
    .dd-faq-item { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; margin-bottom: 8px; overflow: hidden; }
    .dd-faq-q { width: 100%; text-align: left; background: none; border: none; padding: 12px 14px; font-size: 13px; font-weight: 600; color: #1f2937; cursor: pointer; display: flex; justify-content: space-between; align-items: center; gap: 8px; }
    .dd-faq-q:hover { background: #fef2f2; color: #e53e3e; }
    .dd-faq-q i { transition: transform .2s; font-size: 12px; color: #9ca3af; flex-shrink: 0; }
    .dd-faq-item.open .dd-faq-q i { transform: rotate(180deg); }
    .dd-faq-a { max-height: 0; overflow: hidden; transition: max-height .25s ease, padding .25s ease; font-size: 12.5px; line-height: 1.5; color: #4b5563; padding: 0 14px; }
    .dd-faq-item.open .dd-faq-a { max-height: 200px; padding: 0 14px 12px; }
    .dd-support-footer { padding: 12px 14px; border-top: 1px solid #e5e7eb; background: #fff; display: flex; flex-direction: column; gap: 8px; }
    .dd-support-cta { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px; border-radius: 10px; font-size: 13px; font-weight: 700; text-decoration: none; transition: all .15s; border: none; cursor: pointer; }
    .dd-support-cta-primary { background: var(--gradient-primary, linear-gradient(135deg,#e53e3e,#f97316)); color: #fff; }
    .dd-support-cta-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 14px rgba(229,62,62,0.3); color: #fff; }
    .dd-support-cta-ghost { background: transparent; color: #6b7280; font-weight: 600; font-size: 12px; }
    .dd-support-cta-ghost:hover { color: #e53e3e; }

    /* Dark mode */
    [data-theme="dark"] .dd-support-tooltip { background: #1e293b; color: #f1f5f9; }
    [data-theme="dark"] .dd-support-tooltip::after { background: #1e293b; }
    [data-theme="dark"] .dd-support-panel { background: #0f172a; }
    [data-theme="dark"] .dd-support-body { background: #1e293b; }
    [data-theme="dark"] .dd-faq-item { background: #0f172a; border-color: rgba(255,255,255,0.08); }
    [data-theme="dark"] .dd-faq-q { color: #f1f5f9; }
    [data-theme="dark"] .dd-faq-q:hover { background: rgba(229,62,62,0.12); }
    [data-theme="dark"] .dd-faq-a { color: #cbd5e1; }
    [data-theme="dark"] .dd-support-footer { background: #0f172a; border-top-color: rgba(255,255,255,0.08); }

    @media (max-width: 480px) {
      .dd-support-widget { bottom: 16px; right: 16px; }
      .dd-support-panel { width: calc(100vw - 32px); max-height: 70vh; }
    }
  `;

  // ── Inyectar DOM + estilos ────────────────────────────────────────────────
  function inject() {
    if (document.getElementById('dd-support-widget')) return;

    const style = document.createElement('style');
    style.id = 'dd-support-widget-styles';
    style.textContent = CSS;
    document.head.appendChild(style);

    const faqHtml = FAQ.map((f, i) => `
      <div class="dd-faq-item" data-idx="${i}">
        <button class="dd-faq-q" type="button">
          <span>${f.q}</span>
          <i class="bi bi-chevron-down"></i>
        </button>
        <div class="dd-faq-a">${f.a}</div>
      </div>
    `).join('');

    const wrap = document.createElement('div');
    wrap.className = 'dd-support-widget';
    wrap.id = 'dd-support-widget';
    wrap.innerHTML = `
      <div class="dd-support-tooltip" id="ddSupportTooltip" role="status">
        <button class="dd-support-tooltip-x" id="ddSupportTooltipX" title="Cerrar" aria-label="Cerrar">
          <i class="bi bi-x"></i>
        </button>
        <b>¿Necesitás ayuda?</b><br/>
        <span style="font-weight:400; color:#6b7280; font-size:13px;">Estamos acá para lo que necesites.</span>
      </div>

      <div class="dd-support-panel" id="ddSupportPanel" role="dialog" aria-label="Soporte Dale Deal">
        <div class="dd-support-header" style="position:relative;">
          <button class="dd-support-header-close" id="ddSupportClose" aria-label="Cerrar">
            <i class="bi bi-x-lg"></i>
          </button>
          <h4><i class="bi bi-headset me-1"></i> Soporte Dale Deal</h4>
          <p>Respuestas rápidas y contacto directo.</p>
        </div>
        <div class="dd-support-body">
          ${faqHtml}
        </div>
        <div class="dd-support-footer">
          <a href="${contactUrl}" class="dd-support-cta dd-support-cta-primary">
            <i class="bi bi-chat-dots-fill"></i> Contactar soporte
          </a>
          <a href="${helpUrl}" class="dd-support-cta dd-support-cta-ghost">
            Ver centro de ayuda completo
          </a>
        </div>
      </div>

      <button class="dd-support-btn" id="ddSupportBtn" aria-label="Abrir soporte" title="¿Necesitás ayuda?">
        <i class="bi bi-question-lg"></i>
      </button>
    `;
    document.body.appendChild(wrap);
  }

  // ── Lógica ────────────────────────────────────────────────────────────────
  let autoCloseTimer = null;

  function showTooltip() {
    const tip = document.getElementById('ddSupportTooltip');
    const btn = document.getElementById('ddSupportBtn');
    if (!tip) return;
    tip.classList.add('show');
    btn?.classList.add('dd-support-pulse');
    // auto cerrar el tooltip si no hay interacción
    clearTimeout(autoCloseTimer);
    autoCloseTimer = setTimeout(hideTooltip, AUTO_CLOSE_DELAY_MS);
  }

  function hideTooltip(persistDismiss) {
    const tip = document.getElementById('ddSupportTooltip');
    const btn = document.getElementById('ddSupportBtn');
    tip?.classList.remove('show');
    btn?.classList.remove('dd-support-pulse');
    clearTimeout(autoCloseTimer);
    if (persistDismiss) saveState({ dismissedAt: Date.now() });
  }

  function openPanel() {
    hideTooltip(false);
    document.getElementById('ddSupportPanel')?.classList.add('show');
    saveState({ hasOpenedEver: true });
  }

  function closePanel() {
    document.getElementById('ddSupportPanel')?.classList.remove('show');
  }

  function wire() {
    document.getElementById('ddSupportBtn')?.addEventListener('click', () => {
      const panel = document.getElementById('ddSupportPanel');
      if (panel?.classList.contains('show')) closePanel();
      else openPanel();
    });
    document.getElementById('ddSupportClose')?.addEventListener('click', closePanel);
    document.getElementById('ddSupportTooltipX')?.addEventListener('click', e => {
      e.stopPropagation();
      hideTooltip(true);
    });
    document.getElementById('ddSupportTooltip')?.addEventListener('click', e => {
      if (e.target.id === 'ddSupportTooltipX' || e.target.closest('#ddSupportTooltipX')) return;
      openPanel();
    });

    // FAQ accordion
    document.querySelectorAll('.dd-faq-item').forEach(item => {
      item.querySelector('.dd-faq-q')?.addEventListener('click', () => {
        document.querySelectorAll('.dd-faq-item.open').forEach(o => {
          if (o !== item) o.classList.remove('open');
        });
        item.classList.toggle('open');
      });
    });

    // ESC cierra panel
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closePanel();
    });
  }

  function init() {
    if (window._ddSupportInitialized) { log('ya inicializado'); return; }
    window._ddSupportInitialized = true;

    log('init()');
    inject();
    wire();
    log('DOM inyectado. Botón:', !!document.getElementById('ddSupportBtn'));

    // primera visita: marcar en el estado (para telemetría futura)
    const s = getState();
    log('estado actual:', s);
    if (!s.firstVisitAt) saveState({ firstVisitAt: Date.now() });

    if (shouldAutoOpen()) {
      log('programando auto-open en', AUTO_OPEN_DELAY_MS, 'ms');
      setTimeout(() => { log('mostrando tooltip'); showTooltip(); }, AUTO_OPEN_DELAY_MS);
    } else {
      log('no se auto-abre (hasOpenedEver o dismissedAt reciente)');
    }
  }

  // Utilidad pública para debugging desde consola:
  //   DaleDealSupport.reset()  → limpia estado y recarga
  //   DaleDealSupport.open()   → abre el panel manualmente
  //   DaleDealSupport.tooltip() → muestra el tooltip
  window.DaleDealSupport = {
    reset() { try { localStorage.removeItem(STORAGE_KEY); } catch {} location.reload(); },
    open()  { openPanel(); },
    tooltip() { showTooltip(); },
    state() { return getState(); },
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
