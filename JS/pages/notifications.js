/**
 * DALE DEAL - Centro de Notificaciones
 * Página completa de gestión de notificaciones
 */

class NotificationsCenterManager {
  constructor() {
    this.notifications = [];
    this.currentFilter = 'all';
    this.displayedCount = 10;
    this.itemsPerLoad = 10;
    this.init();
  }

  init() {
    this.loadNotifications();
    this.bindEvents();
    this.renderNotifications();
    this.updateFilterCounts();
  }

  // Cargar notificaciones desde localStorage o datos de ejemplo
  loadNotifications() {
    const stored = localStorage.getItem('daledeal_notifications');
    if (stored) {
      this.notifications = JSON.parse(stored);
    } else {
      // Datos de ejemplo más completos
      this.notifications = [
        {
          id: 1,
          type: 'orders',
          title: 'Pedido confirmado',
          message: 'Tu pedido #12345 ha sido confirmado y está siendo procesado. Recibirás una notificación cuando esté listo para el envío.',
          time: 'Hace 2 horas',
          timestamp: Date.now() - 2 * 60 * 60 * 1000,
          read: false,
          icon: 'bi-check-circle-fill',
          iconClass: 'icon-orders',
          actions: [
            { label: 'Ver detalles', action: 'view', isPrimary: true },
            { label: 'Rastrear envío', action: 'track', isPrimary: false }
          ]
        },
        {
          id: 2,
          type: 'services',
          title: 'Servicio agendado',
          message: 'Tu servicio de instalación técnica ha sido agendado para el 25 de octubre a las 14:00 hs.',
          time: 'Hace 3 horas',
          timestamp: Date.now() - 3 * 60 * 60 * 1000,
          read: false,
          icon: 'bi-tools',
          iconClass: 'icon-services',
          actions: [
            { label: 'Ver detalles', action: 'view', isPrimary: true },
            { label: 'Reagendar', action: 'reschedule', isPrimary: false }
          ]
        },
        {
          id: 3,
          type: 'messages',
          title: 'Nuevo mensaje del vendedor',
          message: 'El vendedor respondió tu consulta sobre el producto "iPhone 15 Pro Max".',
          time: 'Hace 5 horas',
          timestamp: Date.now() - 5 * 60 * 60 * 1000,
          read: false,
          icon: 'bi-chat-dots-fill',
          iconClass: 'icon-messages',
          actions: [
            { label: 'Ver mensaje', action: 'view', isPrimary: true },
            { label: 'Responder', action: 'reply', isPrimary: false }
          ]
        },
        {
          id: 4,
          type: 'orders',
          title: 'Pedido en camino',
          message: 'Tu pedido #12340 está en camino. Llegará aproximadamente el 24 de octubre.',
          time: 'Hace 8 horas',
          timestamp: Date.now() - 8 * 60 * 60 * 1000,
          read: false,
          icon: 'bi-truck',
          iconClass: 'icon-orders',
          actions: [
            { label: 'Rastrear', action: 'track', isPrimary: true },
            { label: 'Ver detalles', action: 'view', isPrimary: false }
          ]
        },
        {
          id: 5,
          type: 'payments',
          title: 'Pago confirmado',
          message: 'Recibimos el pago de $1.299.999 por tu pedido #12345. El envío será procesado pronto.',
          time: 'Hace 1 día',
          timestamp: Date.now() - 24 * 60 * 60 * 1000,
          read: true,
          icon: 'bi-credit-card-fill',
          iconClass: 'icon-payments',
          actions: [
            { label: 'Ver recibo', action: 'receipt', isPrimary: true }
          ]
        },
        {
          id: 6,
          type: 'system',
          title: 'Actualización de términos',
          message: 'Hemos actualizado nuestros términos y condiciones. Por favor, revísalos cuando puedas.',
          time: 'Hace 2 días',
          timestamp: Date.now() - 48 * 60 * 60 * 1000,
          read: true,
          icon: 'bi-gear-fill',
          iconClass: 'icon-system',
          actions: [
            { label: 'Leer términos', action: 'terms', isPrimary: true }
          ]
        },
        {
          id: 7,
          type: 'orders',
          title: 'Pedido entregado',
          message: 'Tu pedido #12330 fue entregado exitosamente. ¿Te gustaría calificar tu experiencia?',
          time: 'Hace 3 días',
          timestamp: Date.now() - 72 * 60 * 60 * 1000,
          read: true,
          icon: 'bi-box-seam',
          iconClass: 'icon-orders',
          actions: [
            { label: 'Calificar', action: 'rate', isPrimary: true },
            { label: 'Soporte', action: 'support', isPrimary: false }
          ]
        },
        {
          id: 8,
          type: 'services',
          title: 'Servicio completado',
          message: 'El servicio de instalación ha sido completado. ¿Cómo fue tu experiencia?',
          time: 'Hace 4 días',
          timestamp: Date.now() - 96 * 60 * 60 * 1000,
          read: true,
          icon: 'bi-check-circle',
          iconClass: 'icon-services',
          actions: [
            { label: 'Calificar servicio', action: 'rate', isPrimary: true }
          ]
        },
        {
          id: 9,
          type: 'messages',
          title: 'Pregunta respondida',
          message: 'Recibiste una respuesta a tu pregunta en el producto "Smart TV 55 pulgadas".',
          time: 'Hace 5 días',
          timestamp: Date.now() - 120 * 60 * 60 * 1000,
          read: true,
          icon: 'bi-chat-square-text',
          iconClass: 'icon-messages',
          actions: [
            { label: 'Ver respuesta', action: 'view', isPrimary: true }
          ]
        },
        {
          id: 10,
          type: 'payments',
          title: 'Reembolso procesado',
          message: 'Tu reembolso de $45.000 por el pedido #12320 ha sido procesado y estará disponible en 3-5 días hábiles.',
          time: 'Hace 6 días',
          timestamp: Date.now() - 144 * 60 * 60 * 1000,
          read: true,
          icon: 'bi-arrow-left-circle',
          iconClass: 'icon-payments',
          actions: [
            { label: 'Ver detalles', action: 'view', isPrimary: true }
          ]
        },
        {
          id: 11,
          type: 'orders',
          title: 'Promoción disponible',
          message: 'Tienes 20% de descuento en tu próxima compra. Válido hasta fin de mes.',
          time: 'Hace 1 semana',
          timestamp: Date.now() - 168 * 60 * 60 * 1000,
          read: true,
          icon: 'bi-gift',
          iconClass: 'icon-orders',
          actions: [
            { label: 'Ver promoción', action: 'view', isPrimary: true },
            { label: 'Usar ahora', action: 'use', isPrimary: false }
          ]
        },
        {
          id: 12,
          type: 'system',
          title: 'Nueva función disponible',
          message: 'Ahora puedes guardar tus productos favoritos y crear listas de deseos personalizadas.',
          time: 'Hace 1 semana',
          timestamp: Date.now() - 175 * 60 * 60 * 1000,
          read: true,
          icon: 'bi-star',
          iconClass: 'icon-system',
          actions: [
            { label: 'Explorar función', action: 'explore', isPrimary: true }
          ]
        }
      ];
      this.saveNotifications();
    }
  }

  // Guardar notificaciones en localStorage
  saveNotifications() {
    localStorage.setItem('daledeal_notifications', JSON.stringify(this.notifications));
  }

  // Vincular eventos
  bindEvents() {
    // Filtros del dropdown (mobile)
    document.querySelectorAll('.filter-option').forEach(option => {
      option.addEventListener('click', (e) => this.handleFilterChange(e, 'dropdown'));
    });

    // Filtros de chips (mobile/tablet)
    document.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', (e) => this.handleFilterChange(e, 'chip'));
    });

    // Filtros de sidebar (desktop)
    document.querySelectorAll('.filter-item').forEach(item => {
      item.addEventListener('click', (e) => this.handleFilterChange(e, 'sidebar'));
    });

    // Marcar todas como leídas (botón principal + botón del dropdown del navbar)
    document.getElementById('markAllReadBtn')?.addEventListener('click', () => this.markAllAsRead());
    document.getElementById('markAllAsRead')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.markAllAsRead();
    });
    document.getElementById('deleteAllBtn')?.addEventListener('click', () => this.deleteAllNotifications());

    // Cargar más notificaciones
    document.getElementById('loadMoreBtn')?.addEventListener('click', () => this.loadMore());

    // Event delegation para notificaciones dinámicas
    document.getElementById('notificationsContainer')?.addEventListener('click', (e) => {
      this.handleNotificationClick(e);
    });

    // ===== SIDEBAR TOGGLE FOR MOBILE =====
    const toggleFiltersBtn = document.getElementById('toggleFilters');
    const filtersSidebar = document.getElementById('filtersSidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');

    const openSidebar = () => {
      filtersSidebar?.classList.add('active');
      sidebarOverlay?.classList.add('active');
      document.body.style.overflow = 'hidden';
    };

    const closeSidebar = () => {
      filtersSidebar?.classList.remove('active');
      sidebarOverlay?.classList.remove('active');
      document.body.style.overflow = '';
    };

    toggleFiltersBtn?.addEventListener('click', openSidebar);
    sidebarOverlay?.addEventListener('click', closeSidebar);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && filtersSidebar?.classList.contains('active')) {
        closeSidebar();
      }
    });
  }

  // Manejar cambio de filtros
  handleFilterChange(e, type) {
    e.preventDefault();
    const target = e.currentTarget;
    const filter = target.dataset.filter;

    // Actualizar filtro actual
    this.currentFilter = filter;
    this.displayedCount = this.itemsPerLoad;

    // Actualizar clases activas según el tipo
    if (type === 'dropdown') {
      document.querySelectorAll('.filter-option').forEach(opt => opt.classList.remove('active'));
      target.classList.add('active');
      const labelEl = document.getElementById('currentFilterLabel');
      if (labelEl) labelEl.textContent = target.textContent.trim();
    } else if (type === 'chip') {
      document.querySelectorAll('.filter-chip').forEach(chip => chip.classList.remove('active'));
      target.classList.add('active');
    } else if (type === 'sidebar') {
      document.querySelectorAll('.filter-item').forEach(item => item.classList.remove('active'));
      target.classList.add('active');
    }

    // Sincronizar todos los filtros
    this.syncFilters(filter);

    // Renderizar notificaciones
    this.renderNotifications();
  }

  // Sincronizar todos los filtros
  syncFilters(filter) {
    // Sincronizar dropdown
    document.querySelectorAll('.filter-option').forEach(opt => {
      if (opt.dataset.filter === filter) {
        opt.classList.add('active');
      } else {
        opt.classList.remove('active');
      }
    });

    // Sincronizar chips
    document.querySelectorAll('.filter-chip').forEach(chip => {
      if (chip.dataset.filter === filter) {
        chip.classList.add('active');
      } else {
        chip.classList.remove('active');
      }
    });

    // Sincronizar sidebar
    document.querySelectorAll('.filter-item').forEach(item => {
      if (item.dataset.filter === filter) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  // Manejar clics en notificaciones
  handleNotificationClick(e) {
    const target = e.target;
    const card = target.closest('.notification-card');

    if (!card) return;

    const notificationId = parseInt(card.dataset.id);

    // Cerrar notificación
    if (target.closest('.notification-close')) {
      e.preventDefault();
      e.stopPropagation();
      this.dismissNotification(notificationId, card);
      return;
    }

    // Acciones de notificación
    if (target.classList.contains('notification-action-btn')) {
      e.preventDefault();
      e.stopPropagation();
      const action = target.dataset.action;
      this.handleNotificationAction(notificationId, action);
      return;
    }
  }

  // Descartar notificación
  dismissNotification(notificationId, cardElement) {
    const notification = this.notifications.find(n => n.id === notificationId);

    if (!notification) return;

    // Animar salida y eliminar sin confirmación
    cardElement.classList.add('removing');

    setTimeout(() => {
      const index = this.notifications.findIndex(n => n.id === notificationId);
      if (index !== -1) {
        this.notifications.splice(index, 1);
        this.saveNotifications();
        this.updateFilterCounts();
        this.renderNotifications(false);

        // Sincronizar dropdown
        if (window.notificationManager) {
          window.notificationManager.notifications = [...this.notifications];
          window.notificationManager.renderNotifications();
          window.notificationManager.updateCounter();
          window.notificationManager.updateBadge();
        }
      }
    }, 300);
  }

  // Manejar acciones de notificación
  handleNotificationAction(notificationId, action) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (!notification) return;

    // Marcar como leída al interactuar
    if (!notification.read) {
      notification.read = true;
      this.saveNotifications();
      this.renderNotifications();
      this.updateFilterCounts();
    }

    // Ejecutar acción específica
    const actionMessages = {
      view: 'Abriendo detalles...',
      track: 'Abriendo rastreo de envío...',
      reschedule: 'Abriendo calendario...',
      reply: 'Abriendo mensajería...',
      receipt: 'Descargando recibo...',
      terms: 'Abriendo términos y condiciones...',
      rate: 'Abriendo calificaciones...',
      support: 'Contactando con soporte...',
      use: 'Aplicando promoción...',
      explore: 'Explorando nueva función...'
    };

    const message = actionMessages[action] || `Ejecutando acción: ${action}`;
    this.showToast(message, 'info');
  }

  // Marcar todas como leídas
  markAllAsRead() {
    const unreadNotifications = this.notifications.filter(n => !n.read);

    if (unreadNotifications.length === 0) {
      this.showToast('No hay notificaciones sin leer', 'info');
      return;
    }

    unreadNotifications.forEach(notification => {
      notification.read = true;
    });

    this.saveNotifications();
    this.renderNotifications();
    this.updateFilterCounts();

    this.showToast(`${unreadNotifications.length} notificación${unreadNotifications.length > 1 ? 'es' : ''} marcada${unreadNotifications.length > 1 ? 's' : ''} como leída${unreadNotifications.length > 1 ? 's' : ''}`, 'success');
  }

  // Borrar todas las notificaciones
  deleteAllNotifications() {
    if (this.notifications.length === 0) {
      this.showToast('No hay notificaciones para borrar', 'info');
      return;
    }

    const deletedCount = this.notifications.length;
    this.notifications = [];
    this.displayedCount = this.itemsPerLoad;

    this.saveNotifications();
    this.updateFilterCounts();
    this.renderNotifications(false);

    // Sincronizar dropdown si está disponible en la misma página
    if (window.notificationManager) {
      window.notificationManager.notifications = [];
      window.notificationManager.renderNotifications();
      window.notificationManager.updateCounter();
      window.notificationManager.updateBadge();
    }

    this.showToast(`${deletedCount} notificación${deletedCount > 1 ? 'es' : ''} eliminada${deletedCount > 1 ? 's' : ''}`, 'success');
  }

  // Cargar más notificaciones
  loadMore() {
    this.displayedCount += this.itemsPerLoad;
    this.renderNotifications();
  }

  // Obtener notificaciones filtradas
  getFilteredNotifications() {
    return this.notifications.filter(notification => {
      if (this.currentFilter === 'all') return true;
      return notification.type === this.currentFilter;
    });
  }

  // Renderizar notificaciones
  renderNotifications(showLoading = true) {
    const container = document.getElementById('notificationsContainer');
    const loadingState = document.getElementById('loadingState');
    const emptyState = document.getElementById('emptyState');
    const loadMoreContainer = document.getElementById('loadMoreContainer');

    if (!container) return;

    const doRender = () => {
      const filteredNotifications = this.getFilteredNotifications();
      const displayNotifications = filteredNotifications.slice(0, this.displayedCount);

      // Update results count pill
      const resultsEl = document.getElementById('resultsCount');
      if (resultsEl) {
        const total = filteredNotifications.length;
        const unread = filteredNotifications.filter(n => !n.read).length;
        resultsEl.textContent = unread > 0
          ? `${total} notificación${total !== 1 ? 'es' : ''} · ${unread} sin leer`
          : `${total} notificación${total !== 1 ? 'es' : ''}`;
      }

      if (filteredNotifications.length === 0) {
        if (emptyState) emptyState.style.display = 'block';
        container.innerHTML = '';
        if (loadMoreContainer) loadMoreContainer.style.display = 'none';
        return;
      }

      if (emptyState) emptyState.style.display = 'none';
      container.innerHTML = displayNotifications.map(notification =>
        this.createNotificationHTML(notification)
      ).join('');

      // Mostrar botón de cargar más si hay más notificaciones
      if (displayNotifications.length < filteredNotifications.length) {
        if (loadMoreContainer) loadMoreContainer.style.display = 'block';
        const remaining = filteredNotifications.length - displayNotifications.length;
        document.getElementById('loadMoreBtn').innerHTML = `
          <i class="bi bi-arrow-down-circle me-2"></i>Cargar más notificaciones (${remaining})
        `;
      } else if (loadMoreContainer) {
        loadMoreContainer.style.display = 'none';
      }
    };

    if (showLoading) {
      if (loadingState) loadingState.style.display = 'flex';
      container.innerHTML = '';
      if (emptyState) emptyState.style.display = 'none';
      if (loadMoreContainer) loadMoreContainer.style.display = 'none';

      setTimeout(() => {
        if (loadingState) loadingState.style.display = 'none';
        doRender();
      }, 500);
      return;
    }

    if (loadingState) loadingState.style.display = 'none';
    doRender();
  }

  // Crear HTML de notificación
  createNotificationHTML(notification) {
    const actionsHTML = notification.actions.map(action => `
      <button class="notification-action-btn ${action.isPrimary ? 'primary' : ''}"
              data-action="${action.action}">
        ${action.label}
      </button>
    `).join('');

    return `
      <div class="notification-card ${!notification.read ? 'unread' : ''}"
           data-id="${notification.id}"
           data-type="${notification.type}">
        <div class="notification-header">
          <div class="notification-icon ${notification.iconClass}">
            <i class="${notification.icon}"></i>
          </div>
          <div class="notification-content">
            <div class="notification-title">
              ${notification.title}
              ${!notification.read ? '<span class="notification-badge">Nueva</span>' : ''}
            </div>
            <div class="notification-message">${notification.message}</div>
            <div class="notification-meta">
              <div class="notification-time">
                <i class="bi bi-clock"></i>
                ${notification.time}
              </div>
            </div>
            ${notification.actions.length > 0 ? `
              <div class="notification-actions">
                ${actionsHTML}
              </div>
            ` : ''}
          </div>
        </div>
        <button class="notification-close">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>
    `;
  }

  // Actualizar contadores de filtros
  updateFilterCounts() {
    const counts = {
      all: this.notifications.length,
      orders: this.notifications.filter(n => n.type === 'orders').length,
      services: this.notifications.filter(n => n.type === 'services').length,
      messages: this.notifications.filter(n => n.type === 'messages').length,
      payments: this.notifications.filter(n => n.type === 'payments').length,
      system: this.notifications.filter(n => n.type === 'system').length
    };

    Object.keys(counts).forEach(key => {
      const countElement = document.getElementById(`count${key.charAt(0).toUpperCase() + key.slice(1)}`);
      if (countElement) {
        countElement.textContent = counts[key];
      }
    });

    // Update header badge with unread count
    const headerBadge = document.getElementById('headerUnreadCount');
    if (headerBadge) {
      const unreadAll = this.notifications.filter(n => !n.read).length;
      headerBadge.textContent = `${unreadAll} sin leer`;
    }

    // Update navbar notification badge bubble
    const unreadAll = this.notifications.filter(n => !n.read).length;
    const navbarBadge = document.getElementById('notificationBadge');
    if (navbarBadge) {
      navbarBadge.textContent = unreadAll;
      navbarBadge.style.display = unreadAll > 0 ? 'flex' : 'none';
    }

    // Update dropdown header counter in navbar
    const dropdownCount = document.getElementById('notificationsCount');
    if (dropdownCount) {
      dropdownCount.textContent = unreadAll;
      dropdownCount.style.display = unreadAll > 0 ? 'inline-flex' : 'none';
    }
  }

  // Mostrar toast de notificación
  showToast(message, type = 'info') {
    const toastId = 'toast_' + Date.now();
    const bgColors = {
      success: 'bg-success',
      warning: 'bg-warning',
      error: 'bg-danger',
      info: 'bg-primary'
    };

    const icons = {
      success: 'check-circle',
      warning: 'exclamation-triangle',
      error: 'x-circle',
      info: 'info-circle'
    };

    const toastHTML = `
      <div class="toast align-items-center text-white ${bgColors[type]} border-0"
           role="alert" aria-live="assertive" aria-atomic="true" id="${toastId}">
        <div class="d-flex">
          <div class="toast-body">
            <i class="bi bi-${icons[type]} me-2"></i>
            ${message}
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
      </div>
    `;

    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toast-container';
      toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
      toastContainer.style.zIndex = '9999';
      document.body.appendChild(toastContainer);
    }

    toastContainer.insertAdjacentHTML('beforeend', toastHTML);

    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
    toast.show();

    toastElement.addEventListener('hidden.bs.toast', () => {
      toastElement.remove();
    });
  }
}

// Navegación de secciones y mensajería manejadas por el script
// inline de notificaciones.html (showSection / initMensajesSection)

/*
class SectionNavigator {
  constructor() {
    this.currentSection = null;
    this.init();
  }

  init() {
    document.querySelectorAll('[data-section]').forEach(el => {
      el.addEventListener('click', e => {
        e.preventDefault();
        this.goTo(el.dataset.section);
      });
    });

    // Leer hash de URL al cargar (#mensajes, #mi-perfil, etc.)
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      this.goTo(hash);
    } else {
      // Sección por defecto: notificaciones
      const defaultSection = document.querySelector('[data-section]')?.dataset.section;
      if (defaultSection) this.goTo(defaultSection);
    }
  }

  goTo(section) {
    // Ocultar todas las secciones
    document.querySelectorAll('.centro-section').forEach(el => {
      el.style.display = 'none';
    });

    // Mostrar la sección pedida
    const target = document.getElementById(`view-${section}`);
    if (target) target.style.display = '';

    // Marcar nav item activo
    document.querySelectorAll('[data-section]').forEach(el => {
      el.classList.toggle('active', el.dataset.section === section);
    });

    this.currentSection = section;
    window.location.hash = section;

    // Si es mensajes, inicializar/refrescar
    if (section === 'mensajes' && window.messagesManager) {
      window.messagesManager.onSectionOpen();
    }
  }
}

// =====================================================
// MENSAJES MANAGER
// Conecta la UI de mensajes con api-messages.js
// =====================================================
class MessagesManager {
  constructor() {
    this.conversations = [];
    this.activeConvId = null;
    this.searchQuery = '';
    this.sending = false;
    this.listBody = document.getElementById('mensajesListBody');
    this.chatActive = document.getElementById('mensajesChatActive');
    this.emptyState = document.getElementById('mensajesEmptyState');
    this.chatMessages = document.getElementById('mensajesChatMessages');
    this.chatInput = document.getElementById('mensajesChatInput');
    this.chatSend = document.getElementById('mensajesChatSend');
    this.chatAvatar = document.getElementById('mensajesChatAvatar');
    this.chatName = document.getElementById('mensajesChatName');
    this.chatItem = document.getElementById('mensajesChatItem');
    this.searchInput = document.getElementById('mensajesSearchInput');
    this.bindEvents();
  }

  api() {
    return window.DaleDeal?.api?.messages || null;
  }

  isLoggedIn() {
    return !!localStorage.getItem('daledeal_token');
  }

  bindEvents() {
    this.chatSend?.addEventListener('click', () => this.sendMessage());
    this.chatInput?.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
    this.chatInput?.addEventListener('input', () => {
      this.updateSendBtn();
      // Auto-resize
      this.chatInput.style.height = 'auto';
      this.chatInput.style.height = Math.min(this.chatInput.scrollHeight, 120) + 'px';
    });

    let searchTimer;
    this.searchInput?.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        this.searchQuery = this.searchInput.value.trim().toLowerCase();
        this.renderConversations();
      }, 250);
    });

    // Delegación de eventos para items de la lista
    this.listBody?.addEventListener('click', e => {
      const item = e.target.closest('.mensajes-list-item');
      if (item) this.openConversation(Number(item.dataset.convId));
    });
  }

  updateSendBtn() {
    if (this.chatSend) {
      this.chatSend.disabled = !this.chatInput?.value.trim() || this.sending;
    }
  }

  // Llamado cuando el usuario navega a la sección mensajes
  async onSectionOpen() {
    await this.loadConversations();

    // Auto-abrir conversación desde URL ?conv=ID
    const convId = new URLSearchParams(window.location.search).get('conv');
    if (convId) {
      const id = Number(convId);
      if (this.conversations.find(c => c.id === id)) {
        this.openConversation(id);
      }
    }
  }

  async loadConversations() {
    if (!this.listBody) return;
    const api = this.api();

    if (!api || !this.isLoggedIn()) {
      this.listBody.innerHTML = `
        <div class="mensajes-empty">
          <i class="bi bi-lock"></i>
          <p>Iniciá sesión para ver tus mensajes.</p>
        </div>`;
      return;
    }

    this.listBody.innerHTML = `
      <div class="mensajes-empty">
        <i class="bi bi-hourglass-split"></i>
        <p>Cargando…</p>
      </div>`;

    try {
      this.conversations = await api.listConversations();
      this.renderConversations();
      this.updateMensajesBadge();
    } catch (err) {
      this.listBody.innerHTML = `
        <div class="mensajes-empty">
          <i class="bi bi-wifi-off"></i>
          <p>No se pudieron cargar las conversaciones.</p>
        </div>`;
    }
  }

  renderConversations() {
    if (!this.listBody) return;
    const filtered = this.conversations.filter(c => {
      if (!this.searchQuery) return true;
      const name = (c.other_user?.name || '').toLowerCase();
      const preview = (c.last_message?.body || '').toLowerCase();
      return name.includes(this.searchQuery) || preview.includes(this.searchQuery);
    });

    if (!filtered.length) {
      this.listBody.innerHTML = `
        <div class="mensajes-empty">
          <i class="bi bi-chat-square"></i>
          <p>${this.searchQuery ? 'Sin resultados.' : 'No tenés conversaciones aún.'}</p>
        </div>`;
      return;
    }

    this.listBody.innerHTML = filtered.map(c => this.conversationItemHTML(c)).join('');
  }

  conversationItemHTML(conv) {
    const user = conv.other_user || {};
    const initials = (user.name || '?').charAt(0).toUpperCase();
    const avatar = user.avatar_url
      ? `<img src="${user.avatar_url}" alt="${initials}" class="mensajes-list-item-avatar" style="object-fit:cover;">`
      : `<div class="mensajes-list-item-avatar">${initials}</div>`;
    const preview = conv.last_message?.body || 'Sin mensajes';
    const unread = conv.unread_count || 0;
    const time = conv.last_message?.created_at
      ? this.relativeTime(conv.last_message.created_at) : '';
    const isActive = conv.id === this.activeConvId ? 'active' : '';

    return `
      <div class="mensajes-list-item ${isActive}" data-conv-id="${conv.id}">
        ${avatar}
        <div class="mensajes-list-item-info">
          <p class="mensajes-list-item-name">${this.escapeHtml(user.name || 'Usuario')}</p>
          <p class="mensajes-list-item-preview">${this.escapeHtml(preview.substring(0, 60))}</p>
        </div>
        <div class="mensajes-list-item-meta">
          <span class="mensajes-list-item-time">${time}</span>
          ${unread > 0 ? `<span class="mensajes-list-item-unread">${unread}</span>` : ''}
        </div>
      </div>`;
  }

  async openConversation(convId) {
    this.activeConvId = convId;
    this.renderConversations();

    const conv = this.conversations.find(c => c.id === convId);
    if (!conv) return;

    // Mostrar panel de chat
    if (this.emptyState) this.emptyState.style.display = 'none';
    if (this.chatActive) this.chatActive.style.display = 'flex';

    // Header de la conversación
    const user = conv.other_user || {};
    if (this.chatName) this.chatName.textContent = user.name || 'Usuario';
    if (this.chatItem) this.chatItem.textContent = conv.item?.title || '';
    if (this.chatAvatar) {
      if (user.avatar_url) {
        this.chatAvatar.src = user.avatar_url;
        this.chatAvatar.style.display = '';
      } else {
        this.chatAvatar.style.display = 'none';
      }
    }

    // Cargar mensajes
    if (this.chatMessages) {
      this.chatMessages.innerHTML = `<div class="mensajes-empty"><i class="bi bi-hourglass-split"></i><p>Cargando…</p></div>`;
    }

    try {
      const api = this.api();
      const messages = api ? await api.getMessages(convId) : [];
      this.renderMessages(messages);
      // Marcar como leídos
      if (api) {
        api.markConversationRead(convId).catch(() => {});
        // Quitar badge del item
        const convObj = this.conversations.find(c => c.id === convId);
        if (convObj) convObj.unread_count = 0;
        this.renderConversations();
        this.updateMensajesBadge();
      }
    } catch {
      if (this.chatMessages) {
        this.chatMessages.innerHTML = `<div class="mensajes-empty"><i class="bi bi-wifi-off"></i><p>No se pudieron cargar los mensajes.</p></div>`;
      }
    }

    // Enfocar input
    this.chatInput?.focus();
  }

  renderMessages(messages) {
    if (!this.chatMessages) return;
    if (!messages.length) {
      this.chatMessages.innerHTML = `<div class="mensajes-empty"><i class="bi bi-chat-square"></i><p>No hay mensajes aún. ¡Escribí el primero!</p></div>`;
      return;
    }

    const myId = this.myUserId();
    this.chatMessages.innerHTML = messages.map(m => {
      const isSent = m.sender_id === myId;
      const time = m.created_at ? this.relativeTime(m.created_at) : '';
      return `
        <div class="mensajes-msg ${isSent ? 'mensajes-msg-sent' : 'mensajes-msg-received'}">
          <div class="mensajes-bubble">${this.escapeHtml(m.body)}</div>
          <span class="mensajes-msg-time">${time}</span>
        </div>`;
    }).join('');

    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }

  async sendMessage() {
    const body = this.chatInput?.value.trim();
    if (!body || !this.activeConvId || this.sending) return;
    const api = this.api();
    if (!api) return;

    this.sending = true;
    this.updateSendBtn();

    try {
      const msg = await api.sendMessage(this.activeConvId, body);
      if (this.chatInput) {
        this.chatInput.value = '';
        this.chatInput.style.height = 'auto';
      }
      // Agregar mensaje a la UI sin recargar todo
      const myId = this.myUserId();
      const isSent = !msg?.sender_id || msg.sender_id === myId;
      const time = msg?.created_at ? this.relativeTime(msg.created_at) : 'Ahora';
      const msgEl = document.createElement('div');
      msgEl.className = `mensajes-msg ${isSent ? 'mensajes-msg-sent' : 'mensajes-msg-received'}`;
      msgEl.innerHTML = `<div class="mensajes-bubble">${this.escapeHtml(body)}</div><span class="mensajes-msg-time">${time}</span>`;
      // Quitar empty state si existe
      this.chatMessages?.querySelector('.mensajes-empty')?.remove();
      this.chatMessages?.appendChild(msgEl);
      this.chatMessages && (this.chatMessages.scrollTop = this.chatMessages.scrollHeight);

      // Actualizar preview en la lista
      const conv = this.conversations.find(c => c.id === this.activeConvId);
      if (conv) {
        conv.last_message = { body, created_at: new Date().toISOString() };
        this.renderConversations();
      }
    } catch (err) {
      alert('No se pudo enviar el mensaje. Intentá de nuevo.');
    } finally {
      this.sending = false;
      this.updateSendBtn();
    }
  }

  updateMensajesBadge() {
    const badge = document.getElementById('profileMensajesBadge');
    if (!badge) return;
    const total = this.conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);
    badge.textContent = total > 99 ? '99+' : String(total);
    badge.style.display = total > 0 ? '' : 'none';
  }

  myUserId() {
    try {
      const u = JSON.parse(localStorage.getItem('daledealer_user') || '{}');
      return u.id || null;
    } catch { return null; }
  }

  relativeTime(isoString) {
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Ahora';
    if (mins < 60) return `Hace ${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `Hace ${hrs}h`;
    const days = Math.floor(hrs / 24);
    return `Hace ${days}d`;
  }

  escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

*/

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
  window.notificationsCenterManager = new NotificationsCenterManager();
});
