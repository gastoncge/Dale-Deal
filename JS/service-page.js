// =====================================================
// DALE DEAL - Página de Servicio
// =====================================================

class ServicePage {
  constructor() {
    this.currentService = null;
    this.currentImageIndex = 0;
    this.chatMessages = [];
    this.isSaved = false;

    this.init();
  }

  init() {
    this.loadServiceData();
    if (!this.currentService) return;
    this.setupImageGallery();
    this.setupChat();
    this.setupEventListeners();
    // Sincronizar botón guardar con el estado persisto en favoritos
    this.isSaved = window.favoritesManager?.isFavorite(String(this.currentService.id)) || false;
    this._updateSaveButton();
    this.loadRelatedServices();
    this.loadProviderServices();
  }

  // ── Cargar datos del servicio por ID (URL param o localStorage) ────────────
  loadServiceData() {
    const params = new URLSearchParams(window.location.search);
    const paramId = params.get('id');
    const storedId = localStorage.getItem('selectedServiceId');
    const serviceId = paramId || storedId || (typeof servicesData !== 'undefined' ? servicesData[0]?.id : null);

    if (paramId) localStorage.setItem('selectedServiceId', paramId);

    const service = typeof servicesData !== 'undefined'
      ? servicesData.find(s => s.id === serviceId) || servicesData[0]
      : null;

    if (!service) {
      if (window.DaleDeal?.utils?.showNotification) {
        window.DaleDeal.utils.showNotification('Servicio no encontrado. Redirigiendo…', 'error');
      }
      setTimeout(() => { window.location.href = './servicios.html'; }, 2000);
      return;
    }

    // Enriquecer con datos de prestador y galería si no existen
    this.currentService = this._enrichServiceData(service);
    this._updatePageContent();
  }

  // ── Enriquecer datos del servicio con defaults ─────────────────────────────
  _enrichServiceData(service) {
    const providerDefaults = {
      'installation': { name: 'Alejandro R.', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face', memberSince: '2021', responseTime: '< 30 min', completedJobs: 312 },
      'consultation': { name: 'Valentina G.', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face', memberSince: '2020', responseTime: '< 1h', completedJobs: 189 },
      'catering': { name: 'Carlos M.', avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=80&h=80&fit=crop&crop=face', memberSince: '2019', responseTime: '< 2h', completedJobs: 456 },
      'construction': { name: 'Roberto L.', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&crop=face', memberSince: '2018', responseTime: '< 3h', completedJobs: 278 },
      'repair': { name: 'Miguel S.', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face', memberSince: '2020', responseTime: '< 1h', completedJobs: 534 },
      'maintenance': { name: 'Lucía P.', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face', memberSince: '2022', responseTime: '< 2h', completedJobs: 145 },
    };

    const galleryDefaults = {
      'installation': [
        'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=700&h=500&fit=crop',
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700&h=500&fit=crop',
        'https://images.unsplash.com/photo-1609692814858-f7cd2f0afa4f?w=700&h=500&fit=crop',
        'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=700&h=500&fit=crop',
      ],
      'consultation': [
        'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=700&h=500&fit=crop',
        'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=700&h=500&fit=crop',
        'https://images.unsplash.com/photo-1600518464441-9154a4dea21b?w=700&h=500&fit=crop',
        'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=700&h=500&fit=crop',
      ],
      'catering': [
        'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=700&h=500&fit=crop',
        'https://images.unsplash.com/photo-1547592180-85f173990554?w=700&h=500&fit=crop',
        'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=700&h=500&fit=crop',
        'https://images.unsplash.com/photo-1555244162-803834f70033?w=700&h=500&fit=crop',
      ],
      'construction': [
        'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=700&h=500&fit=crop',
        'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=700&h=500&fit=crop',
        'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=700&h=500&fit=crop',
        'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=700&h=500&fit=crop',
      ],
      'repair': [
        'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=700&h=500&fit=crop',
        'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=700&h=500&fit=crop',
        'https://images.unsplash.com/photo-1631545804657-2c2f0b4122bf?w=700&h=500&fit=crop',
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700&h=500&fit=crop',
      ],
      'maintenance': [
        'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=700&h=500&fit=crop',
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700&h=500&fit=crop',
        'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=700&h=500&fit=crop',
        'https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?w=700&h=500&fit=crop',
      ],
    };

    const provider = service.provider || providerDefaults[service.category] || providerDefaults['consultation'];
    const gallery = service.gallery || galleryDefaults[service.category] || galleryDefaults['consultation'];
    const thumbnails = gallery.map(img => img.replace('w=700&h=500', 'w=120&h=120'));

    return {
      ...service,
      provider: {
        name: provider.name,
        avatar: provider.avatar,
        memberSince: provider.memberSince,
        responseTime: provider.responseTime,
        completedJobs: provider.completedJobs,
        verified: true,
      },
      images: {
        main: gallery[0],
        gallery,
        thumbnails,
      },
    };
  }

  // ── Actualizar contenido de la página ─────────────────────────────────────
  _updatePageContent() {
    const s = this.currentService;
    const p = s.provider;

    // SEO
    document.title = `${s.title} - DALE DEAL`;
    document.querySelector('meta[name="description"]')?.setAttribute('content',
      `${s.title} – ${s.description?.substring(0, 120) || ''} Contratá en Dale Deal.`
    );

    // Breadcrumb
    const bcActive = document.getElementById('breadcrumbServiceName');
    if (bcActive) bcActive.textContent = s.title;

    // Provider card
    const providerAvatar = document.getElementById('providerAvatar');
    if (providerAvatar) { providerAvatar.src = p.avatar; providerAvatar.alt = p.name; }

    document.querySelectorAll('.provider-name-text').forEach(el => el.textContent = p.name);

    const providerStatEl = document.getElementById('providerStats');
    if (providerStatEl) {
      providerStatEl.innerHTML = `
        <span class="stars">${this._renderStars(s.rating)}</span>
        <strong>${s.rating}</strong> · ${s.reviewCount?.toLocaleString('es-AR') || 0} reseñas`;
    }

    const responseTimeEl = document.getElementById('providerResponseTime');
    if (responseTimeEl) responseTimeEl.textContent = `Responde en ${p.responseTime || '< 1h'}`;

    const locationEl = document.getElementById('providerLocation');
    if (locationEl) locationEl.textContent = s.location || 'CABA';

    const memberSinceEl = document.getElementById('providerMemberSince');
    if (memberSinceEl) memberSinceEl.textContent = `Miembro desde ${p.memberSince || '2021'}`;

    const completedJobsEl = document.getElementById('providerCompletedJobs');
    if (completedJobsEl) completedJobsEl.textContent = `${p.completedJobs || 0} trabajos`;

    // Service title + meta
    const titleEl = document.querySelector('.svc-title');
    if (titleEl) titleEl.textContent = s.title;

    const ratingTextEl = document.querySelector('.service-rating .rating-text');
    if (ratingTextEl) ratingTextEl.textContent = `${s.rating} (${s.reviewCount?.toLocaleString('es-AR') || 0} reseñas)`;

    const ratingStarsEl = document.querySelector('.service-rating .stars');
    if (ratingStarsEl) ratingStarsEl.innerHTML = this._renderStars(s.rating);

    const contractedEl = document.querySelector('.service-contracted span');
    if (contractedEl) contractedEl.textContent = `+${s.reviewCount || 0} servicios prestados`;

    // Badges/tags
    const tagsContainer = document.querySelector('.service-tags');
    if (tagsContainer && s.badges?.length) {
      tagsContainer.innerHTML = s.badges
        .map(b => {
          const label = typeof b === 'object' ? b.text : b;
          return `<span class="service-tag"><i class="bi bi-check-circle-fill me-1"></i>${label}</span>`;
        })
        .join('');
    }

    // Availability
    const availEl = document.getElementById('serviceAvailability');
    if (availEl) {
      availEl.innerHTML = `<span class="availability-dot available"></span> Disponible esta semana · Responde en ${p.responseTime || '< 1h'}`;
    }

    // Price
    const priceEl = document.querySelector('.service-current-price');
    if (priceEl) priceEl.textContent = this._formatPrice(s.price);

    const priceTypeEl = document.querySelector('.service-price-type');
    if (priceTypeEl) priceTypeEl.textContent = this._getPriceTypeLabel(s.priceType);

    const installmentsEl = document.querySelector('.service-installments');
    if (installmentsEl) {
      installmentsEl.innerHTML = `Hasta <strong>6 cuotas sin interés</strong> de ${this._formatPrice(s.price / 6)}`;
    }

    // Description tab
    const descEl = document.querySelector('.service-description-text');
    if (descEl) {
      const isHTML = /<[a-z][\s\S]*>/i.test(s.description || '');
      descEl.innerHTML = isHTML
        ? s.description
        : `<p style="white-space:pre-line;line-height:1.8;color:var(--gray-700)">${s.description || ''}</p>`;
    }

    // Reviews summary
    const ratingNumEl = document.querySelector('.overall-rating .rating-number');
    if (ratingNumEl) ratingNumEl.textContent = s.rating;
    const reviewCountEl = document.querySelector('.overall-rating .rating-count');
    if (reviewCountEl) reviewCountEl.textContent = `${s.reviewCount?.toLocaleString('es-AR') || 0} reseñas`;
    const reviewStarsEl = document.querySelector('.overall-rating .rating-stars');
    if (reviewStarsEl) reviewStarsEl.innerHTML = this._renderStars(s.rating);
  }

  // ── Galería de imágenes/videos ─────────────────────────────────────────────
  setupImageGallery() {
    const s = this.currentService;
    if (!s?.images) return;

    const mainImage = document.getElementById('mainServiceImage');
    const thumbnailContainer = document.querySelector('.thumbnail-container');

    if (mainImage) {
      mainImage.src = s.images.main;
      mainImage.alt = s.title;
    }

    if (thumbnailContainer && s.images.thumbnails?.length) {
      thumbnailContainer.innerHTML = '';
      s.images.thumbnails.forEach((thumb, i) => {
        const img = document.createElement('img');
        img.src = thumb;
        img.alt = `${s.title} – Trabajo ${i + 1}`;
        img.className = `thumbnail ${i === 0 ? 'active' : ''}`;
        img.dataset.full = s.images.gallery[i] || thumb;

        img.addEventListener('click', () => {
          if (mainImage) mainImage.src = s.images.gallery[i] || thumb;
          thumbnailContainer.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
          img.classList.add('active');
          this.currentImageIndex = i;
        });
        thumbnailContainer.appendChild(img);
      });
    }
  }

  // ── Chat flotante ──────────────────────────────────────────────────────────
  setupChat() {
    const s = this.currentService;
    if (!s?.provider) return;

    // Info del prestador en el panel
    const chatNameEl = document.getElementById('chatProviderName');
    if (chatNameEl) chatNameEl.textContent = s.provider.name;
    const chatAvatar = document.getElementById('providerChatAvatar');
    if (chatAvatar) { chatAvatar.src = s.provider.avatar; chatAvatar.alt = s.provider.name; }

    // Badge
    const floatBadge = document.getElementById('chatFloatBadge');
    if (floatBadge) floatBadge.style.display = 'flex';

    // Mensajes iniciales
    const initialMessages = [
      { from: 'provider', text: `¡Hola! Soy ${s.provider.name}. Estoy disponible para ayudarte con ${s.title}. ¿En qué puedo ayudarte?`, time: this._chatTimeAgo(45) },
      { from: 'provider', text: 'Podés contarme tu proyecto y te doy un presupuesto personalizado sin compromiso.', time: this._chatTimeAgo(44) },
    ];
    initialMessages.forEach(msg => this._addChatMessage(msg.from, msg.text, msg.time));

    // Elementos
    const chatInput   = document.getElementById('chatInput');
    const sendBtn     = document.getElementById('chatSendBtn');
    const attachBtn   = document.getElementById('chatAttachBtn');
    const fileInput   = document.getElementById('chatFileInput');
    const emojiBtn    = document.getElementById('chatEmojiBtn');
    const emojiPicker = document.getElementById('chatEmojiPicker');
    const attachPreview = document.getElementById('chatAttachPreview');

    let pendingFile = null;

    // ── Actualizar estado del botón enviar ──
    const updateSendBtn = () => {
      if (sendBtn) sendBtn.disabled = !chatInput?.value.trim() && !pendingFile;
    };

    // ── Indicador "está escribiendo" ──
    const showTyping = () => {
      const messagesEl = document.getElementById('chatMessages');
      if (!messagesEl) return null;
      const el = document.createElement('div');
      el.className = 'chat-message received chat-typing-indicator';
      el.innerHTML = `
        <div class="chat-bubble chat-typing-bubble">
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
        </div>`;
      messagesEl.appendChild(el);
      messagesEl.scrollTop = messagesEl.scrollHeight;
      return el;
    };

    const hideTyping = (el) => el?.remove();

    // ── Progresión de estado: enviado → entregado → leído ──
    const animateMessageStatus = (msgEl) => {
      const statusEl = msgEl?.querySelector('.chat-msg-status');
      if (!statusEl) return;
      setTimeout(() => {
        statusEl.textContent = 'Entregado';
        statusEl.className = 'chat-msg-status chat-status-delivered';
      }, 800);
      setTimeout(() => {
        statusEl.textContent = 'Leído';
        statusEl.className = 'chat-msg-status chat-status-read';
      }, 2500);
    };

    // ── Enviar mensaje ──
    const sendMessage = () => {
      const text = chatInput?.value.trim();
      if (!text && !pendingFile) return;

      let msgEl = null;
      if (pendingFile) {
        msgEl = this._addChatFile('user', pendingFile);
        pendingFile = null;
        if (attachPreview) attachPreview.style.display = 'none';
      }
      if (text) {
        msgEl = this._addChatMessage('user', text);
        chatInput.value = '';
        chatInput.style.height = 'auto';
      }
      updateSendBtn();
      if (emojiPicker) emojiPicker.style.display = 'none';

      // Animar estado del mensaje enviado
      animateMessageStatus(msgEl);

      // Mostrar "está escribiendo..." y luego responder
      const delay = 1200 + Math.random() * 800;
      const typingEl = showTyping();
      setTimeout(() => {
        hideTyping(typingEl);
        const responses = [
          '¡Perfecto! Con gusto te ayudo. ¿Me podés dar más detalles sobre lo que necesitás?',
          'Entendido. Puedo organizarme para visitarte y darte un presupuesto detallado esta semana.',
          'Claro, trabajo en esa zona. ¿Cuándo sería conveniente para vos?',
          'Excelente. Basándome en lo que describís, el trabajo estaría listo en 2 a 3 días.',
          'No hay problema. Tengo disponibilidad para el próximo lunes o martes. ¿Cuál te viene mejor?',
          '¡Recibí tu archivo! Lo reviso y te respondo enseguida.',
        ];
        this._addChatMessage('provider', responses[Math.floor(Math.random() * responses.length)]);
      }, delay);
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

    // ── Adjuntar archivo ──
    attachBtn?.addEventListener('click', () => {
      if (emojiPicker) emojiPicker.style.display = 'none';
      fileInput?.click();
    });

    fileInput?.addEventListener('change', () => {
      const file = fileInput.files[0];
      if (!file) return;
      pendingFile = file;
      fileInput.value = '';

      // Preview
      const isImage = file.type.startsWith('image/');
      if (attachPreview) {
        attachPreview.style.display = 'flex';
        if (isImage) {
          const reader = new FileReader();
          reader.onload = e => {
            attachPreview.innerHTML = `
              <img src="${e.target.result}" class="chat-attach-thumb" alt="${DaleDeal.utils.escapeHtml(file.name)}" />
              <span class="chat-attach-name">${DaleDeal.utils.escapeHtml(file.name)}</span>
              <button class="chat-attach-remove"><i class="bi bi-x"></i></button>`;
            attachPreview.querySelector('.chat-attach-remove')?.addEventListener('click', () => {
              pendingFile = null;
              attachPreview.style.display = 'none';
              updateSendBtn();
            });
          };
          reader.readAsDataURL(file);
        } else {
          attachPreview.innerHTML = `
            <i class="bi bi-file-earmark-text chat-attach-file-icon"></i>
            <span class="chat-attach-name">${DaleDeal.utils.escapeHtml(file.name)}</span>
            <button class="chat-attach-remove"><i class="bi bi-x"></i></button>`;
          attachPreview.querySelector('.chat-attach-remove')?.addEventListener('click', () => {
            pendingFile = null;
            attachPreview.style.display = 'none';
            updateSendBtn();
          });
        }
      }
      updateSendBtn();
    });

    // ── Emoji picker ──
    const EMOJIS = [
      '😀','😂','😊','😍','🥰','😎','🤩','😅','😭','😤',
      '👍','👎','👏','🙌','🤝','💪','🙏','❤️','🔥','⭐',
      '✅','❌','📷','📎','💬','📞','🏠','🔧','⚡','🎉',
      '🚀','💡','📋','🗓️','💰','🏆','👨‍🔧','🛠️','📐','🔑',
    ];

    if (emojiPicker) {
      emojiPicker.innerHTML = EMOJIS.map(e =>
        `<button class="emoji-item" type="button">${e}</button>`
      ).join('');
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

    emojiBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!emojiPicker) return;
      emojiPicker.style.display = emojiPicker.style.display === 'none' ? 'grid' : 'none';
    });

    document.addEventListener('click', (e) => {
      if (emojiPicker && !emojiPicker.contains(e.target) && e.target !== emojiBtn) {
        emojiPicker.style.display = 'none';
      }
    });

    // ── Abrir / cerrar panel ──
    const panel           = document.getElementById('chatFloatPanel');
    const floatBtn        = document.getElementById('chatFloatBtn');
    const closeBtn        = document.getElementById('chatFloatClose');
    const badge           = document.getElementById('chatFloatBadge');
    const backBtn         = document.getElementById('chatBackBtn');
    const listView        = document.getElementById('chatListView');
    const conversationView= document.getElementById('chatConversationView');
    const listClose       = document.getElementById('chatListClose');

    const openChat = () => {
      panel?.classList.add('chat-float-open');
      if (badge) badge.style.display = 'none';
      if (listView) listView.style.display = 'none';
      if (conversationView) conversationView.style.display = 'flex';
      setTimeout(() => chatInput?.focus(), 250);
    };

    const closeChat = () => {
      panel?.classList.remove('chat-float-open');
      if (emojiPicker) emojiPicker.style.display = 'none';
    };

    const showChatList = () => {
      if (emojiPicker) emojiPicker.style.display = 'none';
      if (listView) listView.style.display = 'flex';
      if (conversationView) conversationView.style.display = 'none';
      this._renderChatList();
    };

    const showConversation = () => {
      if (listView) listView.style.display = 'none';
      if (conversationView) conversationView.style.display = 'flex';
      setTimeout(() => chatInput?.focus(), 150);
    };

    floatBtn?.addEventListener('click', () => {
      panel?.classList.contains('chat-float-open') ? closeChat() : openChat();
    });
    closeBtn?.addEventListener('click', closeChat);
    listClose?.addEventListener('click', closeChat);
    backBtn?.addEventListener('click', showChatList);
    document.querySelector('.btn-chat-provider')?.addEventListener('click', openChat);
    this._showConversation = showConversation;
  }

  _addChatFile(from, file) {
    const messagesEl = document.getElementById('chatMessages');
    if (!messagesEl) return null;
    const isProvider = from === 'provider';
    const isImage = file.type.startsWith('image/');
    const timeStr = this._chatTimeNow();
    const statusHTML = !isProvider
      ? `<span class="chat-msg-status chat-status-sent">Enviado</span>`
      : '';
    const msgEl = document.createElement('div');
    msgEl.className = `chat-message ${isProvider ? 'received' : 'sent'}`;

    if (isImage) {
      const reader = new FileReader();
      reader.onload = e => {
        msgEl.innerHTML = `
          <div class="chat-bubble chat-bubble-image">
            <img src="${e.target.result}" class="chat-img-preview" alt="${DaleDeal.utils.escapeHtml(file.name)}" />
          </div>
          <div class="chat-time">${timeStr} ${statusHTML}</div>`;
        messagesEl.scrollTop = messagesEl.scrollHeight;
      };
      reader.readAsDataURL(file);
    } else {
      msgEl.innerHTML = `
        <div class="chat-bubble chat-bubble-file">
          <i class="bi bi-file-earmark-text"></i>
          <span>${DaleDeal.utils.escapeHtml(file.name)}</span>
        </div>
        <div class="chat-time">${timeStr} ${statusHTML}</div>`;
    }
    messagesEl.appendChild(msgEl);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    this.chatMessages.push({ from, file: file.name, time: timeStr });
    return msgEl;
  }

  _addChatMessage(from, text, time = null) {
    const messagesEl = document.getElementById('chatMessages');
    if (!messagesEl) return null;

    const isProvider = from === 'provider';
    const timeStr = time || this._chatTimeNow();
    const senderName = isProvider ? this.currentService.provider.name : 'Vos';

    const msgEl = document.createElement('div');
    msgEl.className = `chat-message ${isProvider ? 'received' : 'sent'}`;
    msgEl.innerHTML = `
      ${isProvider ? `<div class="chat-sender-name">${senderName}</div>` : ''}
      <div class="chat-bubble">${this._escapeHtml(text)}</div>
      <div class="chat-time">
        ${timeStr}
        ${!isProvider ? `<span class="chat-msg-status chat-status-sent">Enviado</span>` : ''}
      </div>
    `;
    messagesEl.appendChild(msgEl);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    this.chatMessages.push({ from, text, time: timeStr });
    return msgEl;
  }

  _chatTimeAgo(minutesAgo) {
    const d = new Date(Date.now() - minutesAgo * 60 * 1000);
    return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  }

  _chatTimeNow() {
    return new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  }

  // ── Event listeners ────────────────────────────────────────────────────────
  setupEventListeners() {
    // Contratar ahora
    document.querySelector('.btn-hire-now')?.addEventListener('click', () => {
      this._showNotification('¡Solicitud enviada! El prestador te contactará pronto.', 'success');
    });

    // Guardar servicio
    document.querySelector('.btn-save-service')?.addEventListener('click', () => {
      this._toggleSaveService();
    });

    // Ver todos relacionados
    document.getElementById('viewAllRelatedBtn')?.addEventListener('click', () => {
      window.location.href = `./servicios.html?category=${encodeURIComponent(this.currentService.category)}`;
    });

  }

  // ── Guardar/quitar servicio en favoritos ───────────────────────────────────
  _toggleSaveService() {
    const s = this.currentService;
    if (!s) return;
    const fm = window.favoritesManager;
    if (!fm) { this._showNotification('Sistema de favoritos no disponible', 'error'); return; }

    const serviceId = String(s.id);
    const favoriteData = {
      id: serviceId,
      type: 'service',
      title: s.title,
      priceText: this._formatPrice(s.price),
      originalPriceText: '',
      imageUrl: s.images?.main || '',
      rating: s.rating,
      ratingCount: `(${s.reviewCount?.toLocaleString('es-AR') || 0})`,
      location: s.location || '',
      dateAdded: Date.now()
    };

    if (fm.isFavorite(serviceId)) {
      fm.removeFromFavorites(serviceId);
      this._showNotification('Servicio eliminado de favoritos', 'info');
    } else {
      fm.addToFavorites(favoriteData);
      this._showNotification('Servicio guardado en favoritos', 'success');
    }

    this.isSaved = fm.isFavorite(serviceId);
    this._updateSaveButton();
  }

  // ── Sincronizar estado visual del botón guardar ────────────────────────────
  _updateSaveButton() {
    const btn = document.querySelector('.btn-save-service');
    if (!btn) return;
    const saved = this.isSaved;
    btn.classList.toggle('active', saved);
    btn.querySelector('i').className = saved ? 'bi bi-heart-fill' : 'bi bi-heart';
    btn.title = saved ? 'Quitar de favoritos' : 'Guardar en favoritos';
  }

  // ── Cargar servicios relacionados (misma categoría) ───────────────────────
  async loadRelatedServices() {
    const section = document.getElementById('relatedServicesSection');
    const grid = document.getElementById('relatedServicesGrid');
    if (!section || !grid || !this.currentService) return;

    try {
      await new Promise(r => setTimeout(r, 500));
      const all = typeof servicesData !== 'undefined' ? servicesData : [];
      const related = all
        .filter(s => s.category === this.currentService.category && s.id !== this.currentService.id)
        .slice(0, 8);

      const items = related.length >= 2
        ? related
        : all.filter(s => s.id !== this.currentService.id).sort(() => 0.5 - Math.random()).slice(0, 8);

      if (items.length === 0) { section.style.display = 'none'; return; }
      section.style.display = '';
      this._buildCarousel('relatedServicesCarousel', 'relatedServicesGrid', items, 'relatedPrev', 'relatedNext');
    } catch (err) {
      console.error('Error cargando servicios relacionados:', err);
    }
  }

  // ── Cargar otros servicios del prestador ──────────────────────────────────
  async loadProviderServices() {
    const section = document.getElementById('providerServicesSection');
    const grid = document.getElementById('providerServicesGrid');
    if (!section || !grid || !this.currentService) return;

    try {
      await new Promise(r => setTimeout(r, 300));
      const all = typeof servicesData !== 'undefined' ? servicesData : [];
      // Simular otros servicios del prestador por categorías relacionadas
      const catMap = {
        'installation': ['installation', 'repair'],
        'repair': ['repair', 'installation', 'maintenance'],
        'construction': ['construction', 'maintenance'],
        'maintenance': ['maintenance', 'construction'],
        'catering': ['catering'],
        'consultation': ['consultation'],
      };
      const cats = catMap[this.currentService.category] || [this.currentService.category];
      const providerServices = all
        .filter(s => cats.includes(s.category) && s.id !== this.currentService.id)
        .slice(0, 8);

      if (providerServices.length === 0) { section.style.display = 'none'; return; }
      section.style.display = '';
      this._buildCarousel('providerServicesCarousel', 'providerServicesGrid', providerServices, 'providerPrev', 'providerNext');
    } catch (err) {
      console.error('Error cargando servicios del prestador:', err);
    }
  }

  // ── Construir carrusel de tarjetas de servicio ─────────────────────────────
  _buildCarousel(carouselId, gridId, services, prevId, nextId) {
    const carousel = document.getElementById(carouselId);
    const grid = document.getElementById(gridId);
    if (!carousel || !grid || !services.length) return;

    const visible = window.innerWidth < 768 ? 1 : window.innerWidth < 1024 ? 2 : 3;
    const cardPct = 100 / visible;
    let current = 0;
    const maxIndex = Math.max(0, services.length - visible);

    const track = document.createElement('div');
    track.className = 'carousel-track';
    track.innerHTML = services.map(s =>
      `<div class="carousel-slide-item" style="width:${cardPct}%">${this._renderServiceCard(s)}</div>`
    ).join('');
    grid.innerHTML = '';
    grid.appendChild(track);

    track.querySelectorAll('.product-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.action-heart')) return;
        const id = card.dataset.serviceId;
        if (id) window.location.href = `servicio.html?id=${id}`;
      });
    });

    const updateTrack = () => {
      track.style.transform = `translateX(-${current * cardPct}%)`;
    };

    const container = carousel.parentElement;
    const prev = container?.querySelector(`#${prevId}`) || container?.querySelector('.section-nav-prev');
    const next = container?.querySelector(`#${nextId}`) || container?.querySelector('.section-nav-next');
    if (prev) prev.onclick = () => { current = Math.max(0, current - 1); updateTrack(); };
    if (next) next.onclick = () => { current = Math.min(maxIndex, current + 1); updateTrack(); };
  }

  // ── Renderizar tarjeta de servicio ─────────────────────────────────────────
  _renderServiceCard(service) {
    const priceTypeLabel = this._getPriceTypeLabel(service.priceType);
    const starsHTML = this._renderStars(service.rating);

    // Price text
    let priceText = this._formatPrice(service.price);
    if (service.priceType === 'monthly') priceText += '/mes';
    else if (service.priceType === 'per_m2') priceText += '/m²';
    else if (service.priceType === 'per_room') priceText += '/amb';

    // Badges overlay
    const customBadges = (service.badges || []).filter(b => typeof b === 'object' && b.text);
    const legacyBadges = (service.badges || []).filter(b => typeof b === 'string');
    const allBadgesInner = [
      ...customBadges.map(b => `<span class="badge-custom" style="background:${b.color}">${b.text}</span>`),
      ...legacyBadges.map(badge => {
        const cls = service.emergency || badge.includes('Premium') || badge.includes('Emergencia')
          ? 'badge-emergency' : 'badge-featured';
        return `<span class="${cls}">${badge}</span>`;
      }),
    ].join('');
    const badgesHTML = allBadgesInner ? `<div class="service-badges">${allBadgesInner}</div>` : '';

    // Extra indicators
    let extraBadges = '';
    if (service.topRated) extraBadges += '<span class="shipping-badge"><i class="bi bi-star-fill"></i> Top rated</span>';
    if (service.emergency) extraBadges += ' <span class="shipping-badge"><i class="bi bi-lightning-charge-fill"></i> Urgencias</span>';
    if (service.nationwide) extraBadges += ' <span class="shipping-badge"><i class="bi bi-truck"></i> Cobertura nacional</span>';

    const shortDesc = service.description
      ? (service.description.length > 80 ? service.description.substring(0, 80) + '...' : service.description)
      : '';

    const provider = service.provider || {};
    const providerHTML = provider.name ? `
      <div class="product-provider">
        <img src="${provider.avatar}" alt="${provider.name}" class="product-provider-avatar" />
        <span class="product-provider-name">${provider.name}</span>
        ${provider.verified ? '<i class="bi bi-patch-check-fill product-provider-verified"></i>' : ''}
      </div>` : '';

    return `
      <div class="product-card w-100" data-id="${service.id}" data-service-id="${service.id}" data-type="service" style="cursor:pointer;">
          <div class="product-image-container">
            <img src="${service.image}" alt="${service.title}" class="product-image active" loading="lazy" />
            ${badgesHTML}
            <div class="product-actions">
              <button class="action-heart" title="Guardar">
                <i class="bi bi-heart"></i>
              </button>
            </div>
          </div>
          <div class="product-info">
            <h3 class="product-title">${service.title}</h3>
            ${providerHTML}
            <p class="product-description">${shortDesc}</p>
            <div class="product-meta-group">
              <div class="product-rating">
                <div class="stars">${starsHTML}</div>
                <span class="reviews-count">(${(service.reviewCount || 0).toLocaleString('es-AR')})</span>
                ${extraBadges}
              </div>
              <div class="product-location">
                <i class="bi bi-geo-alt-fill"></i>
                <span>${service.location || 'CABA'}</span>
              </div>
            </div>
            <div class="product-pricing-wrapper">
              <div class="product-pricing">
                <span class="product-current-price">${priceText}</span>
              </div>
            </div>
          </div>
        </div>`;
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  _renderStars(rating) {
    return DaleDeal.utils.renderStars(rating);
  }

  _formatPrice(price) {
    if (window.DaleDeal?.utils?.formatPrice) return window.DaleDeal.utils.formatPrice(price);
    return new Intl.NumberFormat('es-AR', {
      style: 'currency', currency: 'ARS',
      minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(price);
  }

  _getPriceTypeLabel(priceType) {
    const map = {
      'per_hour': '/ hora',
      'per_m2': '/ m²',
      'per_room': '/ ambiente',
      'monthly': '/ mes',
      'per_day': '/ día',
    };
    return map[priceType] || '/ visita';
  }

  _getCategoryLabel(category) {
    const map = {
      'installation': 'Instalaciones',
      'consultation': 'Consultoría',
      'catering': 'Gastronomía',
      'construction': 'Construcción',
      'repair': 'Reparaciones',
      'maintenance': 'Mantenimiento',
    };
    return map[category] || 'Servicios';
  }

  // ── Lista de chats ─────────────────────────────────────────────────────────
  _renderChatList() {
    const listBody = document.getElementById('chatListBody');
    if (!listBody) return;

    const s = this.currentService;
    const contacts = [
      {
        name: s?.provider?.name || 'Prestador',
        avatar: s?.provider?.avatar || '',
        preview: 'Podés contarme tu proyecto y te doy un presupuesto…',
        time: 'Ahora',
        unread: 0,
        online: true,
        isCurrent: true,
      },
      {
        name: 'Carlos M.',
        avatar: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=80&h=80&fit=crop&crop=face',
        preview: 'Perfecto, quedamos para el lunes entonces.',
        time: 'Ayer',
        unread: 0,
        online: false,
        isCurrent: false,
      },
      {
        name: 'Lucía P.',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face',
        preview: 'Gracias por contratar el servicio.',
        time: 'Lun',
        unread: 2,
        online: true,
        isCurrent: false,
      },
    ];

    listBody.innerHTML = contacts.map((c, i) => `
      <div class="chat-list-item" data-index="${i}">
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
          ${c.unread > 0 ? `<span class="chat-list-unread">${c.unread}</span>` : ''}
        </div>
      </div>
    `).join('');

    listBody.querySelectorAll('.chat-list-item').forEach(item => {
      item.addEventListener('click', () => {
        if (this._showConversation) this._showConversation();
      });
    });
  }

  _escapeHtml(text) {
    return DaleDeal.utils.escapeHtml(text);
  }

  _showNotification(message, type = 'info') {
    if (window.DaleDeal?.utils?.showNotification) {
      window.DaleDeal.utils.showNotification(message, type);
    }
  }
}

// ── Bootstrap ─────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  new ServicePage();

  const notificationBtn = document.getElementById('notificationBtn');
  if (notificationBtn) {
    notificationBtn.addEventListener('shown.bs.dropdown', () => {
      if (window.notificationManager) window.notificationManager.renderNotifications();
    });
  }

  // Keyboard accessibility for thumbnails (Enter/Space triggers click)
  document.querySelectorAll('.thumbnail[role="button"]').forEach(thumb => {
    thumb.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        thumb.click();
      }
    });
  });
});
