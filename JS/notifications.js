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
  }

  // Cargar notificaciones desde localStorage o datos por defecto
  loadNotifications() {
    const stored = localStorage.getItem('daledealer_notifications');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        this.notifications = Array.isArray(parsed) ? parsed : [];
        if (!Array.isArray(parsed)) {
          localStorage.removeItem('daledealer_notifications');
        }
      } catch (e) {
        console.error('Error al parsear notificaciones del localStorage:', e);
        localStorage.removeItem('daledealer_notifications');
        this.notifications = [];
      }
    } else {
      // Datos de ejemplo
      this.notifications = [
        {
          id: 1,
          type: 'orders',
          title: 'Pedido confirmado',
          message: 'Tu pedido #12345 ha sido confirmado y está siendo procesado',
          time: 'Hace 2 horas',
          timestamp: Date.now() - 2 * 60 * 60 * 1000,
          read: false,
          icon: 'bi-check-circle',
          iconColor: 'bg-success',
          actions: [
            { label: 'Ver detalles', action: 'view', data: { orderId: '12345' } },
            { label: 'Rastrear', action: 'track', data: { orderId: '12345' } }
          ]
        },
        {
          id: 2,
          type: 'orders',
          title: 'Envío en camino',
          message: 'Tu pedido #12340 está siendo preparado para el envío',
          time: 'Hace 1 día',
          timestamp: Date.now() - 24 * 60 * 60 * 1000,
          read: false,
          icon: 'bi-truck',
          iconColor: 'bg-info',
          actions: [
            { label: 'Ver detalles', action: 'view', data: { orderId: '12340' } },
            { label: 'Rastrear', action: 'track', data: { orderId: '12340' } }
          ]
        },
        {
          id: 3,
          type: 'offers',
          title: 'Nueva oferta disponible',
          message: 'Hasta 20% de descuento en toda la categoría electrónicos',
          time: 'Hace 2 días',
          timestamp: Date.now() - 48 * 60 * 60 * 1000,
          read: false,
          icon: 'bi-star',
          iconColor: 'bg-warning',
          actions: [
            { label: 'Ver ofertas', action: 'view', data: { category: 'electronics' } },
            { label: 'Guardar', action: 'save', data: { offerId: 'promo2024' } }
          ]
        },
        {
          id: 4,
          type: 'orders',
          title: 'Pedido entregado',
          message: 'Tu pedido #12330 ha sido entregado exitosamente',
          time: 'Hace 3 días',
          timestamp: Date.now() - 72 * 60 * 60 * 1000,
          read: true,
          icon: 'bi-box-seam',
          iconColor: 'bg-success',
          actions: [
            { label: 'Calificar', action: 'rate', data: { orderId: '12330' } },
            { label: 'Soporte', action: 'support', data: { orderId: '12330' } }
          ]
        }
      ];
      this.saveNotifications();
    }
  }

  // Guardar notificaciones en localStorage
  saveNotifications() {
    localStorage.setItem('daledealer_notifications', JSON.stringify(this.notifications));
  }

  // Vincular eventos
  bindEvents() {
    // Cuando el dropdown se abre, registrar el handler de clicks en el propio menú.
    // Al estar en un nodo hijo de document, dispara ANTES que el listener de Bootstrap
    // en document, y stopPropagation() impide que Bootstrap cierre el dropdown.
    document.addEventListener('shown.bs.dropdown', (e) => {
      if (e.target && e.target.id === 'notificationBtn') {
        const menu = document.querySelector('.notifications-dropdown');
        if (menu && !menu._hasClickGuard) {
          menu.addEventListener('click', (ev) => {
            ev.stopPropagation();
            this._handleMenuClick(ev);
          });
          menu._hasClickGuard = true;
        }
        this.loadNotifications();
        this.renderNotifications();
        this.updateBadge();
      }
    });
  }

  // Maneja todos los clicks dentro del menú de notificaciones
  _handleMenuClick(e) {
    // Filtros
    const filterChip = e.target.closest('.filter-chip');
    if (filterChip) {
      this.handleFilterChange(e);
      return;
    }

    // Items de notificación (X, contenido, acciones)
    if (e.target.closest('.notification-item')) {
      this.handleNotificationClick(e);
      return;
    }

    // Botones del footer
    if (e.target.closest('#markAllAsRead')) {
      this.markAllAsRead();
      return;
    }
    if (e.target.closest('#markSelectedAsRead')) {
      this.markSelectedAsRead();
      return;
    }
    if (e.target.closest('#viewAllNotifications')) {
      this.viewAllNotifications();
      return;
    }
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

  // Descartar notificación
  dismissNotification(notificationId) {
    const index = this.notifications.findIndex(n => n.id === notificationId);
    if (index !== -1) {
      this.notifications.splice(index, 1);
      this.selectedNotifications.delete(notificationId);
      this.saveNotifications();
      this.renderNotifications();
      this.updateBadge();
    }
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

    // Ejecutar acción específica
    switch (action) {
      case 'view':
        this.showToast(`Abriendo detalles...`, 'info');
        break;
      case 'track':
        this.showToast(`Abriendo rastreo...`, 'info');
        break;
      case 'save':
        this.showToast(`Oferta guardada`, 'success');
        break;
      case 'rate':
        this.showToast(`Abriendo calificaciones...`, 'info');
        break;
      case 'support':
        this.showToast(`Contactando soporte...`, 'info');
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
      this.updateCounter();
      this.updateActionButtons();
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
        </div>
        <button class="notification-close" data-action="dismiss">
          <i class="bi bi-x"></i>
        </button>
      </div>
    `;
  }

  // Estado vacío
  getEmptyState() {
    const messages = {
      all: 'No tienes notificaciones',
      unread: 'No tienes notificaciones sin leer',
      orders: 'No tienes notificaciones de pedidos',
      offers: 'No tienes notificaciones de ofertas'
    };

    return `
      <div class="notifications-empty">
        <i class="bi bi-bell-slash"></i>
        <h5>${messages[this.currentFilter]}</h5>
        <p>Te notificaremos cuando tengas nuevas actualizaciones</p>
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
    DaleDeal.utils.showNotification(message, type);
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