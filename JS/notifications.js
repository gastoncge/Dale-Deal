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
    const stored = localStorage.getItem('daledealt_notifications');
    if (stored) {
      this.notifications = JSON.parse(stored);
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
    localStorage.setItem('daledealt_notifications', JSON.stringify(this.notifications));
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
    document.getElementById('notificationBtn')?.addEventListener('shown.bs.dropdown', () => this.renderNotifications());
  }

  // Manejar cambio de filtros
  handleFilterChange(e) {
    e.preventDefault();
    e.stopPropagation();
    document.querySelectorAll('.filter-chip').forEach(chip => chip.classList.remove('active'));
    e.target.classList.add('active');
    this.currentFilter = e.target.dataset.filter;
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

  // Descartar notificación
  dismissNotification(notificationId) {
    const index = this.notifications.findIndex(n => n.id === notificationId);
    if (index !== -1) {
      const notification = this.notifications[index];
      const confirmed = confirm(`¿Eliminar la notificación "${notification.title}"?`);
      
      if (confirmed) {
        this.notifications.splice(index, 1);
        this.selectedNotifications.delete(notificationId);
        this.saveNotifications();
        this.renderNotifications();
        this.updateBadge();
        
        this.showToast('Notificación eliminada', 'info');
      }
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
    // Redirigir a la página del centro de notificaciones
    window.location.href = './HTML/notificaciones.html';
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