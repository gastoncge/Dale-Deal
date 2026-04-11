/**
 * DALE DEAL - Chat Flotante Global
 * Inyecta el widget de chat en páginas que no tienen uno específico.
 * En servicio.html / producto.html el HTML ya existe inline — este script
 * sólo agrega el comportamiento genérico de soporte.
 */
(function () {
  'use strict';

  const isHtmlSubdir = window.location.pathname.includes('/HTML/');
  const logoSrc = isHtmlSubdir ? '../IMG/LOGO.png' : './IMG/LOGO.png';

  // ── Inyectar HTML si el widget aún no existe ──────────────────────────────
  if (!document.getElementById('chatFloatWidget')) {
    const widget = document.createElement('div');
    widget.className = 'chat-float-widget';
    widget.id = 'chatFloatWidget';
    widget.innerHTML = `
      <button class="chat-float-btn" id="chatFloatBtn" title="Soporte Dale Deal">
        <img class="chat-float-logo" src="${logoSrc}" alt="Dale Deal" />
        <span class="chat-float-badge" id="chatFloatBadge">1</span>
      </button>

      <div class="chat-float-panel" id="chatFloatPanel">

        <!-- Lista de chats -->
        <div class="chat-list-view" id="chatListView" style="display:none;">
          <div class="chat-list-header">
            <span class="chat-list-title">Mensajes</span>
            <button class="chat-float-close" id="chatListClose" title="Cerrar">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
          <div class="chat-list-body" id="chatListBody"></div>
        </div>

        <!-- Conversación -->
        <div class="chat-conversation-view" id="chatConversationView">
          <div class="chat-header">
            <button class="chat-back-btn" id="chatBackBtn" title="Volver">
              <i class="bi bi-arrow-left"></i>
            </button>
            <img id="providerChatAvatar"
              src="${logoSrc}"
              alt="Soporte Dale Deal" class="chat-header-avatar" />
            <div class="chat-header-info">
              <p class="chat-header-name" id="chatProviderName">Soporte Dale Deal</p>
              <div class="chat-header-status">
                <span class="chat-status-dot"></span> En línea
              </div>
            </div>
            <button class="chat-float-close" id="chatFloatClose" title="Cerrar">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>

          <div class="chat-messages" id="chatMessages">
            <div class="chat-date-separator">Hoy</div>
          </div>

          <div class="chat-emoji-picker" id="chatEmojiPicker" style="display:none;"></div>
          <div class="chat-attach-preview" id="chatAttachPreview" style="display:none;"></div>

          <div class="chat-input-area">
            <input type="file" id="chatFileInput"
              accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
              style="display:none;" />
            <div class="chat-input-wrapper">
              <button class="chat-attach-btn" id="chatAttachBtn" title="Adjuntar">
                <i class="bi bi-paperclip"></i>
              </button>
              <textarea id="chatInput" class="chat-input"
                placeholder="Escribí tu mensaje…" rows="1"></textarea>
              <button class="chat-attach-btn" id="chatEmojiBtn" title="Emoji">
                <i class="bi bi-emoji-smile"></i>
              </button>
            </div>
            <button class="chat-send-btn" id="chatSendBtn" disabled title="Enviar">
              <i class="bi bi-send-fill"></i>
            </button>
          </div>
        </div>

      </div>
    `;
    document.body.appendChild(widget);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────
  function timeNow() {
    return new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  }

  function timeAgo(minutes) {
    return new Date(Date.now() - minutes * 60000)
      .toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  }

  function addMessage(from, text, time) {
    const el = document.getElementById('chatMessages');
    if (!el) return null;
    const t = time || timeNow();
    const isSent = from === 'user';
    const div = document.createElement('div');
    div.className = `chat-message ${isSent ? 'sent' : 'received'}`;
    div.innerHTML = isSent
      ? `<div class="chat-bubble"><p class="chat-text">${DaleDeal.utils.escapeHtml(text)}</p><div class="chat-meta"><span class="chat-time">${t}</span><span class="chat-msg-status chat-status-sent">Enviado</span></div></div>`
      : `<div class="chat-bubble"><p class="chat-text">${DaleDeal.utils.escapeHtml(text)}</p><span class="chat-time">${t}</span></div>`;
    el.appendChild(div);
    el.scrollTop = el.scrollHeight;
    return div;
  }

  function addFile(from, file) {
    const el = document.getElementById('chatMessages');
    if (!el) return null;
    const isImage = file.type.startsWith('image/');
    const div = document.createElement('div');
    div.className = `chat-message ${from === 'user' ? 'sent' : 'received'}`;
    if (isImage) {
      const reader = new FileReader();
      reader.onload = e => {
        div.innerHTML = `<div class="chat-bubble"><img src="${e.target.result}" class="chat-img-preview" alt="${file.name}" /><div class="chat-meta"><span class="chat-time">${timeNow()}</span><span class="chat-msg-status chat-status-sent">Enviado</span></div></div>`;
      };
      reader.readAsDataURL(file);
    } else {
      div.innerHTML = `<div class="chat-bubble chat-bubble-file"><i class="bi bi-file-earmark-text"></i><span>${file.name}</span><div class="chat-meta"><span class="chat-time">${timeNow()}</span><span class="chat-msg-status chat-status-sent">Enviado</span></div></div>`;
    }
    el.appendChild(div);
    el.scrollTop = el.scrollHeight;
    return div;
  }

  function animateStatus(msgEl) {
    const statusEl = msgEl?.querySelector('.chat-msg-status');
    if (!statusEl) return;
    setTimeout(() => { statusEl.textContent = 'Entregado'; statusEl.className = 'chat-msg-status chat-status-delivered'; }, 800);
    setTimeout(() => { statusEl.textContent = 'Leído'; statusEl.className = 'chat-msg-status chat-status-read'; }, 2500);
  }

  function showTyping() {
    const el = document.getElementById('chatMessages');
    if (!el) return null;
    const div = document.createElement('div');
    div.className = 'chat-message received chat-typing-indicator';
    div.innerHTML = `<div class="chat-bubble chat-typing-bubble"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div>`;
    el.appendChild(div);
    el.scrollTop = el.scrollHeight;
    return div;
  }

  // ── Conversaciones demo ───────────────────────────────────────────────────
  const conversations = [
    {
      id: 'support',
      name: 'Soporte Dale Deal',
      avatar: isHtmlSubdir ? '../IMG/LOGO.png' : './IMG/LOGO.png',
      preview: 'Podés consultarme sobre pedidos, publicaciones o cualquier duda.',
      time: 'Ahora',
      unread: 1,
      online: true
    }
  ];

  // ── Inicializar lógica ────────────────────────────────────────────────────
  function initChat() {
    // Si service-page.js o product-page.js ya inicializaron el chat, no volver a hacerlo
    if (window._chatInitialized) return;
    window._chatInitialized = true;

    const panel            = document.getElementById('chatFloatPanel');
    const floatBtn         = document.getElementById('chatFloatBtn');
    const closeBtn         = document.getElementById('chatFloatClose');
    const badge            = document.getElementById('chatFloatBadge');
    const backBtn          = document.getElementById('chatBackBtn');
    const listView         = document.getElementById('chatListView');
    const conversationView = document.getElementById('chatConversationView');
    const listClose        = document.getElementById('chatListClose');
    const chatInput        = document.getElementById('chatInput');
    const sendBtn          = document.getElementById('chatSendBtn');
    const attachBtn        = document.getElementById('chatAttachBtn');
    const fileInput        = document.getElementById('chatFileInput');
    const emojiBtn         = document.getElementById('chatEmojiBtn');
    const emojiPicker      = document.getElementById('chatEmojiPicker');
    const attachPreview    = document.getElementById('chatAttachPreview');

    // Mensaje inicial de soporte
    if (badge) badge.style.display = 'flex';
    addMessage('provider', '¡Hola! Soy el soporte de Dale Deal. ¿En qué puedo ayudarte hoy?', timeAgo(5));
    addMessage('provider', 'Podés consultarme sobre pedidos, publicaciones o cualquier duda sobre la plataforma.', timeAgo(4));

    // Renderizar lista de chats
    function renderChatList() {
      const body = document.getElementById('chatListBody');
      if (!body) return;

      if (conversations.length === 0) {
        body.innerHTML = `
          <div class="chat-list-empty">
            <i class="bi bi-chat-dots"></i>
            <p>No tenés chats todavía</p>
          </div>`;
        return;
      }

      body.innerHTML = conversations.map(c => `
        <div class="chat-list-item" data-chat-id="${c.id}">
          <div class="chat-list-avatar-wrap">
            <img src="${c.avatar}" alt="${c.name}" class="chat-list-avatar" />
            ${c.online ? '<span class="chat-list-online"></span>' : ''}
          </div>
          <div class="chat-list-info">
            <div class="chat-list-name">${c.name}</div>
            <div class="chat-list-preview">${c.preview}</div>
          </div>
          <div class="chat-list-meta">
            <span class="chat-list-time">${c.time}</span>
            ${c.unread ? `<span class="chat-list-unread">${c.unread}</span>` : ''}
          </div>
        </div>
      `).join('');

      body.querySelectorAll('.chat-list-item').forEach(item => {
        item.addEventListener('click', () => {
          if (listView) listView.style.display = 'none';
          if (conversationView) conversationView.style.display = 'flex';
          setTimeout(() => chatInput?.focus(), 250);
        });
      });
    }

    // Open / Close
    const openChat = () => {
      panel?.classList.add('chat-float-open');
      if (badge) badge.style.display = 'none';
      renderChatList();
      if (listView) listView.style.display = 'flex';
      if (conversationView) conversationView.style.display = 'none';
    };
    const closeChat = () => {
      panel?.classList.remove('chat-float-open');
      if (emojiPicker) emojiPicker.style.display = 'none';
    };

    floatBtn?.addEventListener('click', () =>
      panel?.classList.contains('chat-float-open') ? closeChat() : openChat());
    closeBtn?.addEventListener('click', closeChat);
    listClose?.addEventListener('click', closeChat);
    backBtn?.addEventListener('click', () => {
      if (emojiPicker) emojiPicker.style.display = 'none';
      renderChatList();
      if (listView) listView.style.display = 'flex';
      if (conversationView) conversationView.style.display = 'none';
    });

    // Send
    let pendingFile = null;
    const updateSendBtn = () => {
      if (sendBtn) sendBtn.disabled = !chatInput?.value.trim() && !pendingFile;
    };

    const RESPONSES = [
      '¡Entendido! Voy a revisar tu consulta y te respondo a la brevedad.',
      'Gracias por contactarnos. ¿Podés darme más detalles para ayudarte mejor?',
      'Claro, con gusto te ayudo. ¿Cuál es tu número de pedido o publicación?',
      'Tomé nota. Te enviamos un mail con la resolución en las próximas horas.',
      '¡Perfecto! El equipo de soporte está al tanto de tu caso.',
    ];

    const sendMessage = () => {
      const text = chatInput?.value.trim();
      if (!text && !pendingFile) return;
      let msgEl = null;
      if (pendingFile) {
        msgEl = addFile('user', pendingFile);
        pendingFile = null;
        if (attachPreview) attachPreview.style.display = 'none';
      }
      if (text) {
        msgEl = addMessage('user', text);
        chatInput.value = '';
        chatInput.style.height = 'auto';
      }
      updateSendBtn();
      if (emojiPicker) emojiPicker.style.display = 'none';
      animateStatus(msgEl);
      const typingEl = showTyping();
      setTimeout(() => {
        typingEl?.remove();
        addMessage('provider', RESPONSES[Math.floor(Math.random() * RESPONSES.length)]);
      }, 1200 + Math.random() * 800);
    };

    sendBtn?.addEventListener('click', sendMessage);
    chatInput?.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });
    chatInput?.addEventListener('input', () => {
      updateSendBtn();
      chatInput.style.height = 'auto';
      chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
    });

    // File attach
    attachBtn?.addEventListener('click', () => {
      if (emojiPicker) emojiPicker.style.display = 'none';
      fileInput?.click();
    });
    fileInput?.addEventListener('change', () => {
      const file = fileInput.files[0];
      if (!file) return;
      pendingFile = file;
      fileInput.value = '';
      if (attachPreview) {
        attachPreview.style.display = 'flex';
        const isImage = file.type.startsWith('image/');
        if (isImage) {
          const reader = new FileReader();
          reader.onload = e => {
            attachPreview.innerHTML = `<img src="${e.target.result}" class="chat-attach-thumb" alt="${file.name}" /><span class="chat-attach-name">${file.name}</span><button class="chat-attach-remove"><i class="bi bi-x"></i></button>`;
            attachPreview.querySelector('.chat-attach-remove')?.addEventListener('click', () => { pendingFile = null; attachPreview.style.display = 'none'; updateSendBtn(); });
          };
          reader.readAsDataURL(file);
        } else {
          attachPreview.innerHTML = `<i class="bi bi-file-earmark-text chat-attach-file-icon"></i><span class="chat-attach-name">${file.name}</span><button class="chat-attach-remove"><i class="bi bi-x"></i></button>`;
          attachPreview.querySelector('.chat-attach-remove')?.addEventListener('click', () => { pendingFile = null; attachPreview.style.display = 'none'; updateSendBtn(); });
        }
      }
      updateSendBtn();
    });

    // Emoji
    const EMOJIS = ['😀','😂','😊','😍','🥰','😎','🤩','😅','😭','😤','👍','👎','👏','🙌','🤝','💪','🙏','❤️','🔥','⭐','✅','❌','📷','📎','💬','📞','🏠','🔧','⚡','🎉','🚀','💡','📋','🗓️','💰','🏆','🛍️','📦','🎁','💳'];
    if (emojiPicker) {
      emojiPicker.innerHTML = EMOJIS.map(e => `<button class="emoji-item" type="button">${e}</button>`).join('');
      emojiPicker.querySelectorAll('.emoji-item').forEach(btn => {
        btn.addEventListener('click', () => {
          if (!chatInput) return;
          const pos = chatInput.selectionStart ?? chatInput.value.length;
          chatInput.value = chatInput.value.slice(0, pos) + btn.textContent + chatInput.value.slice(pos);
          chatInput.focus();
          chatInput.selectionStart = chatInput.selectionEnd = pos + btn.textContent.length;
          updateSendBtn();
        });
      });
    }
    emojiBtn?.addEventListener('click', e => {
      e.stopPropagation();
      if (!emojiPicker) return;
      emojiPicker.style.display = emojiPicker.style.display === 'none' ? 'grid' : 'none';
    });
    document.addEventListener('click', e => {
      if (emojiPicker && !emojiPicker.contains(e.target) && e.target !== emojiBtn) {
        emojiPicker.style.display = 'none';
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChat);
  } else {
    initChat();
  }
})();
