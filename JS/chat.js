/**
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
    return !!localStorage.getItem('daledeal_token');
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

  // Si quedó el DOM del widget flotante de una carga anterior, lo limpiamos
  // para evitar el bug de render cortado que aparecía en el feed.
  function cleanupLegacyWidget() {
    const legacy = document.getElementById('chatFloatWidget');
    if (legacy && legacy.parentNode) legacy.parentNode.removeChild(legacy);
  }

  function init() {
    if (window._chatInitialized) return;
    window._chatInitialized = true;
    cleanupLegacyWidget();
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
