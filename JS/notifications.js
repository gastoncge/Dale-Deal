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
    const token = localStorage.getItem('daledeal_token');
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
      const raw = localStorage.getItem('daledeal_notif_dismissed');
      return new Set(raw ? JSON.parse(raw) : []);
    } catch { return new Set(); }
  }
  saveDismissedSet(set) {
    try { localStorage.setItem('daledeal_notif_dismissed', JSON.stringify([...set])); } catch {}
  }

  // IDs de notificaciones que ya marcó como leídas
  getSeenSet() {
    try {
      const raw = localStorage.getItem('daledeal_notif_seen');
      return new Set(raw ? JSON.parse(raw) : []);
    } catch { return new Set(); }
  }
  saveSeenSet(set) {
    try { localStorage.setItem('daledeal_notif_seen', JSON.stringify([...set])); } catch {}
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
      this.showToast('Seleccioná al menos una notificación', 'warning');
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
    window.location.href = isInHtmlFolder ? './notificaciones.html' : '/notificaciones';
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
});