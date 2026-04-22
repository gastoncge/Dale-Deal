// =====================================================
// DALE DEAL - Cliente de API para Mensajería
// Extiende window.DaleDeal.api con los métodos de /messages
// Requiere que api.js se haya cargado antes (para apiFetch).
// =====================================================

(function () {
  'use strict';

  if (typeof window === 'undefined') return;
  if (!window.DaleDeal || !window.DaleDeal.api || !window.DaleDeal.api.apiFetch) {
    console.warn('[api-messages] api.js no está cargado todavía — los métodos de mensajería no estarán disponibles');
    return;
  }

  const apiFetch = window.DaleDeal.api.apiFetch;

  // ============================================================
  // CONVERSACIONES
  // ============================================================

  /**
   * Lista las conversaciones del usuario.
   * @returns {Promise<Array>} array de conversaciones con metadata
   */
  async function listConversations() {
    const data = await apiFetch('/messages/conversations');
    return data.data || [];
  }

  /**
   * Inicia (o recupera) una conversación con el dueño de un item.
   * @param {'product'|'service'} item_type
   * @param {number} item_id
   * @param {string} [initial_message]
   */
  async function startConversation(item_type, item_id, initial_message) {
    return apiFetch('/messages/conversations', {
      method: 'POST',
      body:   JSON.stringify({ item_type, item_id, initial_message }),
    });
  }

  /**
   * Devuelve los mensajes de una conversación en orden cronológico.
   * @param {number} conversationId
   * @param {object} [opts]
   * @param {string} [opts.before] — ISO date para paginar mensajes anteriores
   * @param {number} [opts.limit]  — default 50, max 100
   */
  async function getMessages(conversationId, { before, limit } = {}) {
    const qs = new URLSearchParams();
    if (before) qs.append('before', before);
    if (limit)  qs.append('limit',  limit);
    const path = `/messages/conversations/${conversationId}/messages${qs.toString() ? '?' + qs.toString() : ''}`;
    const data = await apiFetch(path);
    return data.data || [];
  }

  /**
   * Envía un mensaje en una conversación.
   * @param {number} conversationId
   * @param {string} body
   * @returns {Promise<object>} mensaje creado
   */
  async function sendMessage(conversationId, body) {
    const res = await apiFetch(`/messages/conversations/${conversationId}/messages`, {
      method: 'POST',
      body:   JSON.stringify({ body }),
    });
    return res.message;
  }

  /**
   * Marca como leídos todos los mensajes recibidos en esta conversación.
   * @param {number} conversationId
   * @returns {Promise<number>} cantidad marcados
   */
  async function markConversationRead(conversationId) {
    const res = await apiFetch(`/messages/conversations/${conversationId}/read`, {
      method: 'POST',
    });
    return res.updated || 0;
  }

  /**
   * Total de mensajes no leídos del usuario (para badge global).
   */
  async function getUnreadCount() {
    try {
      const res = await apiFetch('/messages/unread-count');
      return res.unread || 0;
    } catch (e) {
      return 0;
    }
  }

  // ============================================================
  // Exportar
  // ============================================================
  window.DaleDeal.api.messages = {
    listConversations,
    startConversation,
    getMessages,
    sendMessage,
    markConversationRead,
    getUnreadCount,
  };
})();
