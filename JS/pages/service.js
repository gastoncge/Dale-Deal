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

  async init() {
    await this.loadServiceData();
    if (!this.currentService) return;
    this.setupImageGallery();
    // setupChat() está obsoleto: la mensajería real la maneja JS/chat.js
    // usando el backend (/messages). Se mantiene el método como no-op por
    // compatibilidad, pero no hacemos nada con el panel mock.
    this.setupEventListeners();
    // Sincronizar botón guardar con el estado persisto en favoritos
    this.isSaved = window.favoritesManager?.isFavorite(String(this.currentService.id)) || false;
    this._updateSaveButton();
    this.loadRelatedServices();
    this.loadProviderServices();
    this.loadAndRenderReviews();
  }

  async loadAndRenderReviews() {
    if (!this.currentService?.id || !window.DaleDealReviews?.loadList) return;
    const s = this.currentService;
    await window.DaleDealReviews.loadList({
      itemType: 'service',
      itemId: s.id,
      fallbackAvg: s.rating || 0,
      fallbackTotal: s.reviewCount || 0,
    });
  }

  // ── Cargar datos del servicio por ID (URL param o localStorage) ────────────
  //
  // Lookup order:
  //   1. URL `?id=X` → si está → intentar resolver vía:
  //      a. Backend API (fetchServiceById) — para servicios reales del prod DB
  //      b. servicesData local (mock IDs como 'installation-tech') — fallback
  //   2. localStorage `selectedServiceId` (memoria del último que abriste)
  //   3. NO hacer fallback a servicesData[0] — antes esto causaba que
  //      cualquier servicio inexistente llevara al electricista (installation-tech),
  //      el primer item de la data mock. Ahora redirige a /servicios.html.
  async loadServiceData() {
    const params = new URLSearchParams(window.location.search);
    const paramId = params.get('id');
    const storedId = localStorage.getItem('selectedServiceId');
    const serviceId = paramId || storedId;

    if (paramId) localStorage.setItem('selectedServiceId', paramId);

    // INSTANT IMAGE: si venimos de una card que guardó su imagen en
    // sessionStorage, la mostramos YA como placeholder mientras el backend
    // responde. Cero "gris" de carga — el user ve la misma foto que clickeó.
    try {
      const previewImg = sessionStorage.getItem('dd_preview_img_service_' + serviceId);
      const mainImg = document.getElementById('mainServiceImage');
      if (previewImg && mainImg) {
        mainImg.addEventListener('load', () => mainImg.classList.remove('is-loading'), { once: true });
        mainImg.src = previewImg;
      }
    } catch (_) {}

    let service = null;

    if (serviceId != null && serviceId !== '') {
      // 1.a — Intentar API si el id es numérico (los del backend lo son).
      //       Los IDs mock como 'installation-tech' son strings con guiones,
      //       no pasan el chequeo de número y van directo a fallback local.
      const looksLikeBackendId = /^\d+$/.test(String(serviceId));
      if (looksLikeBackendId && window.DaleDeal?.api?.fetchServiceById) {
        try {
          service = await window.DaleDeal.api.fetchServiceById(serviceId);
        } catch (err) {
          console.warn('[service] fetchServiceById falló:', err?.message);
        }
      }
      // Sin fallback a servicesData: esa data de ejemplo mostraba fichas
      // inventadas ("Alejandro R.", 4.9 con 127 reseñas) como si fueran reales.
    }

    if (!service) {
      if (window.DaleDeal?.utils?.showNotification) {
        window.DaleDeal.utils.showNotification('Servicio no encontrado. Redirigiendo…', 'error');
      } else {
        // utils.js puede no estar cargado todavía — mostrar algo igual
        const main = document.querySelector('main');
        if (main) {
          main.innerHTML = '<div style="text-align:center;padding:80px 24px;"><h2>Servicio no encontrado</h2><p>Te llevamos al listado en un segundo…</p></div>';
        }
      }
      setTimeout(() => { window.location.href = '/servicios'; }, 2000);
      return;
    }

    // Enriquecer con datos de prestador y galería si no existen
    this.currentService = this._enrichServiceData(service);
    this._updatePageContent();
  }

  // ── Enriquecer datos del servicio con defaults ─────────────────────────────
  _enrichServiceData(service) {
    // Solo datos reales del prestador. Antes, a un prestador real se le
    // completaban campos con datos de ejemplo ("312 trabajos", "Responde en
    // < 30 min", "Miembro desde 2021") y, sin prestador, se inventaba uno.
    const real = service.provider || {};
    const provider = {
      name:          real.name || service.provider_name || 'Prestador',
      avatar:        real.avatar || null,
      memberSince:   real.memberSince || null,
      responseTime:  null,   // el backend todavía no lo mide
      completedJobs: null,   // ídem
      verifiedIdentity:     !!real.verifiedIdentity,
      verifiedProfessional: !!real.verifiedProfessional,
      verifiedBackground:   !!real.verifiedBackground,
      phone:         real.phone,
      location:      real.location,
    };

    // Galería: solo fotos del servicio. Antes, sin galería, se mostraban fotos
    // de ejemplo de otros trabajos con la nota "Fotos reales de trabajos".
    const gallery = Array.isArray(service.gallery) && service.gallery.length > 0
      ? service.gallery
      : [service.image];
    const thumbnails = gallery.slice();

    return {
      ...service,
      provider,
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
    // Canonical por servicio (el HTML trae uno fijo sin id y Google no indexaba
    // cada servicio por separado).
    document.querySelector('link[rel="canonical"]')
      ?.setAttribute('href', `https://daledeal.com.ar/servicio?id=${encodeURIComponent(s.id)}`);
    document.querySelector('meta[name="description"]')?.setAttribute('content',
      `${s.title} – ${DaleDeal.utils.htmlToText(s.description).substring(0, 120)} Contratá en Dale Deal.`
    );

    // Breadcrumb
    const bcActive = document.getElementById('breadcrumbServiceName');
    if (bcActive) bcActive.textContent = s.title;

    // Provider card
    const providerAvatar = document.getElementById('providerAvatar');
    if (providerAvatar) {
      // Sin foto: queda el placeholder gris del HTML (no una cara de stock).
      if (p.avatar) providerAvatar.src = p.avatar;
      providerAvatar.alt = p.name;
    }

    document.querySelectorAll('.provider-name-text').forEach(el => el.textContent = p.name);

    // Insignias de verificación reales (identidad / profesional). Solo aparecen
    // si el equipo aprobó la verificación del prestador (no inventamos confianza).
    const badgesEl = document.getElementById('providerBadges');
    if (badgesEl) {
      let bhtml = '';
      if (p.verifiedIdentity)     bhtml += '<span class="verif-badge verif-identity" title="Identidad verificada por Dale Deal"><i class="bi bi-patch-check-fill"></i> Identidad</span>';
      if (p.verifiedProfessional) bhtml += '<span class="verif-badge verif-pro" title="Matrícula o título verificado"><i class="bi bi-mortarboard-fill"></i> Profesional</span>';
      if (p.verifiedBackground)   bhtml += '<span class="verif-badge verif-bg" title="Certificado de antecedentes penales validado contra la fuente oficial"><i class="bi bi-shield-check"></i> Antecedentes</span>';
      badgesEl.innerHTML = bhtml;
    }

    const providerStatEl = document.getElementById('providerStats');
    if (providerStatEl) {
      providerStatEl.innerHTML = `
        <span class="stars">${this._renderStars(s.rating)}</span>
        <strong>${s.rating}</strong> · ${s.reviewCount?.toLocaleString('es-AR') || 0} reseñas`;
    }

    // Solo si hay un dato real (antes se inventaba "Responde en < 1h").
    const responseTimeEl = document.getElementById('providerResponseTime');
    if (responseTimeEl) {
      if (p.responseTime) responseTimeEl.textContent = `Responde en ${p.responseTime}`;
      else responseTimeEl.closest('.provider-response-time')?.setAttribute('hidden', '');
    }

    // Ubicación · miembro desde · trabajos: solo lo que es real.
    const locationRow = document.querySelector('.provider-location');
    if (locationRow) {
      const parts = [
        s.location || p.location,
        p.memberSince ? `Miembro desde ${p.memberSince}` : null,
        p.completedJobs ? `${p.completedJobs} trabajos` : null,
      ].filter(Boolean);
      const span = document.createElement('span');
      span.id = 'providerLocation';
      span.textContent = parts.join(' · ');
      locationRow.innerHTML = '<i class="bi bi-geo-alt-fill" aria-hidden="true"></i> ';
      locationRow.appendChild(span);
      locationRow.hidden = parts.length === 0;
    }

    // WhatsApp directo al prestador (solo si tiene teléfono). Normalización AR best-effort.
    const waBtn = document.getElementById('svcWhatsapp');
    if (waBtn) {
      const digits = (p.phone || '').replace(/\D/g, '');
      if (digits.length >= 8) {
        const intl = digits.startsWith('54') ? digits : `549${digits.replace(/^0/, '')}`;
        const txt = encodeURIComponent(`Hola${p.name ? ' ' + p.name : ''}, te contacto desde Dale Deal por el servicio "${s.title}".`);
        waBtn.href = `https://wa.me/${intl}?text=${txt}`;
        waBtn.classList.remove('d-none');
      } else {
        waBtn.classList.add('d-none');
      }
    }

    // Service title + meta
    const titleEl = document.querySelector('.svc-title');
    if (titleEl) titleEl.textContent = s.title;

    const ratingTextEl = document.querySelector('.service-rating .rating-text');
    if (ratingTextEl) ratingTextEl.textContent = `${s.rating} (${s.reviewCount?.toLocaleString('es-AR') || 0} reseñas)`;

    const ratingStarsEl = document.querySelector('.service-rating .stars');
    if (ratingStarsEl) ratingStarsEl.innerHTML = this._renderStars(s.rating);

    // Solo si hay reseñas (cada una es un servicio prestado); antes "+0 servicios prestados".
    const contractedEl = document.querySelector('.service-contracted span');
    if (contractedEl) {
      if (s.reviewCount > 0) contractedEl.textContent = `+${s.reviewCount} servicios prestados`;
      else contractedEl.closest('.service-contracted')?.setAttribute('hidden', '');
    }

    // Badges/tags
    const tagsContainer = document.querySelector('.service-tags');
    if (tagsContainer && s.badges?.length) {
      const esc = (v) => window.DaleDeal.utils.escapeHtml(String(v ?? ''));
      tagsContainer.innerHTML = s.badges
        .map(b => {
          const label = typeof b === 'object' ? b.text : b;
          return `<span class="service-tag"><i class="bi bi-check-circle-fill me-1"></i>${esc(label)}</span>`;
        })
        .join('');
    }

    // Availability
    const availEl = document.getElementById('serviceAvailability');
    if (availEl) {
      // Sin agenda real del prestador no prometemos disponibilidad.
      availEl.innerHTML = `<span class="availability-dot available"></span> Consultale disponibilidad por chat`;
    }

    // Price
    const priceEl = document.querySelector('.service-current-price');
    if (priceEl) priceEl.textContent = this._formatPrice(s.price);

    const priceTypeEl = document.querySelector('.service-price-type');
    if (priceTypeEl) priceTypeEl.textContent = this._getPriceTypeLabel(s.priceType);

    const installmentsEl = document.querySelector('.service-installments');
    if (installmentsEl) {
      const inst = window.DaleDeal.utils.formatInstallments(s.price);
      installmentsEl.innerHTML = inst.show
        ? `Hasta <strong>${inst.count} cuotas sin interés</strong> de ${inst.monthlyFormatted}`
        : '';
    }

    // Guardar en "vistos recientemente" (localStorage, para el carrusel del home)
    window.DDRecentlyViewed?.track({ id: s.id, type: 'service', title: s.title, price: s.price, image: s.images?.main });

    // Description tab
    const descEl = document.querySelector('.service-description-text');
    if (descEl) {
      // Sanitizar SIEMPRE: la descripción viene del editor Quill del prestador (HTML no confiable).
      // DOMPurify preserva el formato seguro y elimina <script>/onerror/etc. Fallback: escapar.
      // La API la devuelve con las entidades escapadas: renderRichText las
      // decodifica antes de sanitizar (si no, se veían las etiquetas como texto).
      DaleDeal.utils.renderRichText(descEl, s.description || '');
    }
  }

  // ── Galería de imágenes/videos ─────────────────────────────────────────────
  setupImageGallery() {
    const s = this.currentService;
    if (!s?.images) return;

    const mainImage = document.getElementById('mainServiceImage');
    const thumbnailContainer = document.querySelector('.thumbnail-container');
    const galleryNote = document.querySelector('.service-gallery .text-muted');

    if (mainImage) {
      // Remover skeleton shimmer cuando la imagen REAL termina de descargar.
      // Esto evita el "flash" de la imagen placeholder antes de la del backend.
      mainImage.addEventListener('load', () => {
        mainImage.classList.remove('is-loading');
      }, { once: true });
      mainImage.addEventListener('error', () => {
        // Si la imagen falla (404, red), igual sacamos el skeleton — el alt
        // se ve como fallback. Mejor eso que skeleton forever.
        mainImage.classList.remove('is-loading');
      }, { once: true });
      mainImage.src = s.images.main;
      mainImage.alt = s.title;
    }

    if (!thumbnailContainer) return;

    const galleryArr = Array.isArray(s.images.gallery) ? s.images.gallery : [];
    const thumbsArr  = Array.isArray(s.images.thumbnails) ? s.images.thumbnails : galleryArr;

    // Si hay UNA SOLA imagen (o ninguna), ocultar el container de thumbnails
    // y la nota "Fotos reales de trabajos realizados" — sino quedaba una
    // única thumb huérfana debajo de la imagen principal. UX más limpia.
    if (galleryArr.length < 2) {
      thumbnailContainer.style.display = 'none';
      if (galleryNote) galleryNote.style.display = 'none';
      return;
    }

    // Si hay 2+ imágenes, renderizar grid de thumbnails clickeables
    thumbnailContainer.style.display = '';
    if (galleryNote) galleryNote.style.display = '';
    thumbnailContainer.innerHTML = '';

    thumbsArr.forEach((thumb, i) => {
      const img = document.createElement('img');
      img.src = thumb;
      img.alt = `${s.title} – Trabajo ${i + 1}`;
      img.className = `thumbnail ${i === 0 ? 'active' : ''}`;
      img.dataset.full = galleryArr[i] || thumb;

      img.addEventListener('click', () => {
        if (mainImage) mainImage.src = galleryArr[i] || thumb;
        thumbnailContainer.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
        img.classList.add('active');
        this.currentImageIndex = i;
      });
      thumbnailContainer.appendChild(img);
    });
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
              <img src="${e.target.result}" class="chat-attach-thumb" alt="${file.name}" />
              <span class="chat-attach-name">${file.name}</span>
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
            <span class="chat-attach-name">${file.name}</span>
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
            <img src="${e.target.result}" class="chat-img-preview" alt="${file.name}" />
          </div>
          <div class="chat-time">${timeStr} ${statusHTML}</div>`;
        messagesEl.scrollTop = messagesEl.scrollHeight;
      };
      reader.readAsDataURL(file);
    } else {
      msgEl.innerHTML = `
        <div class="chat-bubble chat-bubble-file">
          <i class="bi bi-file-earmark-text"></i>
          <span>${file.name}</span>
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
    // Contratar ahora — crea una conversación real con el prestador
    document.querySelector('.btn-hire-now')?.addEventListener('click', async () => {
      const serviceId = this.currentService?.id;
      const title     = this.currentService?.title || 'tu servicio';
      if (!serviceId) return;
      if (!window.DaleDeal?.chat) {
        this._showNotification('El sistema de mensajería no está disponible.', 'error');
        return;
      }
      try {
        await window.DaleDeal.chat.startWith(
          'service',
          serviceId,
          `¡Hola! Estoy interesado en contratar "${title}". ¿Podés contarme más?`
        );
      } catch (err) {
        this._showNotification(err.message || 'No pudimos iniciar la conversación.', 'error');
      }
    });

    // Contactar al prestador — abre el chat sin mensaje predefinido
    document.querySelector('.btn-chat-provider')?.addEventListener('click', async (e) => {
      e.preventDefault();
      const serviceId = this.currentService?.id;
      if (!serviceId || !window.DaleDeal?.chat) return;
      try {
        await window.DaleDeal.chat.startWith('service', serviceId);
      } catch (err) {
        this._showNotification(err.message || 'No pudimos iniciar la conversación.', 'error');
      }
    });

    // Guardar servicio
    document.querySelector('.btn-save-service')?.addEventListener('click', () => {
      this._toggleSaveService();
    });

    // Ver todos relacionados
    document.getElementById('viewAllRelatedBtn')?.addEventListener('click', () => {
      window.location.href = `/servicios?category=${encodeURIComponent(this.currentService.category)}`;
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
      // Servicios reales de la API (antes salían de servicesData, con servicios
      // y prestadores de ejemplo mezclados).
      const all = await window.DaleDeal.api.fetchServices();
      const others = all.filter(s => String(s.id) !== String(this.currentService.id));
      const related = others.filter(s => s.category === this.currentService.category).slice(0, 8);
      const items = related.length >= 2 ? related : others.slice(0, 8);

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
      // Otros servicios REALES del mismo prestador (antes se "simulaban" con
      // servicios de ejemplo de categorías parecidas).
      const providerId = this.currentService.provider_id;
      if (!providerId) { section.style.display = 'none'; return; }
      const all = await window.DaleDeal.api.fetchServices();
      const providerServices = all
        .filter(s => String(s.provider_id) === String(providerId) && String(s.id) !== String(this.currentService.id))
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
    // El padre `.custom-carousel .carousel-inner` define `display: grid` con
    // minmax(220px, 1fr) en product.css. Eso comprimía el `.carousel-track`
    // (flex container) a 220px y todas las cards salían como tiritas verticales
    // angostas. Forzamos display:block para que el track ocupe todo el ancho.
    grid.style.display = 'block';

    track.querySelectorAll('.product-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.action-heart')) return;
        const id = card.dataset.serviceId;
        if (id) window.location.href = `/servicio?id=${id}`;
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
    // Si entran todas las tarjetas no hay nada que correr: sin flechas.
    [prev, next].forEach(btn => { if (btn) btn.style.display = maxIndex > 0 ? '' : 'none'; });
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

    // Badges overlay — escape de b.text, b.color y badge porque son input
    // del prestador (vienen de la API y se renderizan en innerHTML).
    const esc = (s) => (window.DaleDeal?.utils?.escapeHtml ? DaleDeal.utils.escapeHtml(s) : String(s ?? ''));
    // Para b.color, además de escapar, validamos que sea un color CSS razonable
    // (hex, nombre, hsl/rgb/rgba) para evitar CSS injection del estilo:
    //   background:red; } html { background:url('...
    const safeColor = (c) => {
      if (typeof c !== 'string') return '#999';
      const trimmed = c.trim();
      // Whitelist permisivo pero seguro: hex, palabra, o función css
      if (/^(#[0-9a-f]{3,8}|[a-z]+|(rgb|rgba|hsl|hsla)\([0-9.,%\s]+\))$/i.test(trimmed)) {
        return trimmed;
      }
      return '#999';
    };
    const customBadges = (service.badges || []).filter(b => typeof b === 'object' && b.text);
    const legacyBadges = (service.badges || []).filter(b => typeof b === 'string');
    const allBadgesInner = [
      ...customBadges.map(b => `<span class="badge-custom" style="background:${safeColor(b.color)}">${esc(b.text)}</span>`),
      ...legacyBadges.map(badge => {
        const cls = service.emergency || badge.includes('Premium') || badge.includes('Emergencia')
          ? 'badge-emergency' : 'badge-featured';
        return `<span class="${cls}">${esc(badge)}</span>`;
      }),
    ].join('');
    const badgesHTML = allBadgesInner ? `<div class="service-badges">${allBadgesInner}</div>` : '';

    // Extra indicators
    let extraBadges = '';
    if (service.topRated) extraBadges += '<span class="shipping-badge"><i class="bi bi-star-fill"></i> Top rated</span>';
    if (service.emergency) extraBadges += ' <span class="shipping-badge"><i class="bi bi-lightning-charge-fill"></i> Urgencias</span>';
    if (service.nationwide) extraBadges += ' <span class="shipping-badge"><i class="bi bi-truck"></i> Cobertura nacional</span>';

    const plainDesc = DaleDeal.utils.htmlToText(service.description);
    const shortDesc = plainDesc.length > 80 ? plainDesc.substring(0, 80) + '...' : plainDesc;

    // Igual que en el catálogo: sin reseñas dice "Sin reseñas aún", no "(0)".
    const reviewCount = service.reviewCount || 0;
    const reviewsHTML = reviewCount > 0
      ? `<span class="reviews-count">(${reviewCount.toLocaleString('es-AR')})</span>`
      : '<span class="reviews-count text-muted">Sin reseñas aún</span>';

    const provider = service.provider || {};
    // Sin foto cargada van las iniciales (antes quedaba una imagen rota).
    const providerAvatar = provider.avatar || DaleDeal.utils.initialsAvatar(provider.name);
    const providerHTML = provider.name ? `
      <div class="product-provider">
        <img src="${esc(providerAvatar)}" alt="" class="product-provider-avatar" loading="lazy" />
        <span class="product-provider-name">${esc(provider.name)}</span>
        ${provider.verified ? '<i class="bi bi-patch-check-fill product-provider-verified"></i>' : ''}
      </div>` : '';

    return `
      <div class="product-card w-100" data-id="${service.id}" data-service-id="${service.id}" data-type="service" style="cursor:pointer;">
          <div class="product-image-container">
            <img src="${esc(service.image)}" alt="${esc(service.title)}" class="product-image active" loading="lazy" />
            ${badgesHTML}
            <div class="product-actions">
              <button class="action-heart" title="Guardar">
                <i class="bi bi-heart"></i>
              </button>
            </div>
          </div>
          <div class="product-info">
            <h3 class="product-title">${esc(service.title)}</h3>
            ${providerHTML}
            <p class="product-description">${esc(shortDesc)}</p>
            <div class="product-meta-group">
              <div class="product-rating">
                <div class="stars">${starsHTML}</div>
                ${reviewsHTML}
                ${extraBadges}
              </div>
              <div class="product-location">
                <i class="bi bi-geo-alt-fill"></i>
                <span>${esc(service.location || 'CABA')}</span>
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

  // ── Lista de chats (deprecated) ────────────────────────────────────────────
  // Antes mostraba contactos mock. Ahora la lista real la renderiza
  // JS/chat.js consumiendo /messages/conversations.
  _renderChatList() { /* no-op */ }

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
