// =====================================================
// DALE DEAL — Reviews form (inyectable en producto/servicio)
// =====================================================
//
// Uso: en producto.html o servicio.html, después de cargar la página,
// llamar a `window.DaleDealReviews.mount(containerSelector, { itemType, itemId })`.
//
// Lógica:
//   - Si el user NO está logueado → muestra link "Iniciá sesión para reseñar"
//   - Si está logueado → muestra form con estrellas + título + body
//   - POST al backend → maneja respuestas:
//      • 201 → mostrar review nueva optimistic + esconder form
//      • 403 "tenés que comprar" → mensaje claro
//      • 409 "ya reseñaste" → mensaje claro
//   - Backend hace verified-purchase check para productos (no para servicios)
//
// HTML que necesita en el padre:
//   <div id="reviews-form-container"></div>
//
// API helpers usados: window.DaleDeal.api.createReview / fetchReviews

(function () {
  'use strict';

  const STAR_LABELS = ['Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'];

  function getToken() {
    return localStorage.getItem('daledeal_token') || sessionStorage.getItem('daledeal_token');
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /**
   * Render del form completo. El user puede:
   *   - Si NO logueado: ver mensaje + link a /login
   *   - Si logueado: rating con estrellas + title (opcional) + body (opcional)
   */
  function renderForm({ itemType, itemId, container }) {
    const isLogged = !!getToken();

    if (!isLogged) {
      container.innerHTML = `
        <div class="review-prompt" style="background: var(--gray-50, #f8f9fa); border: 1px dashed var(--gray-300, #dee2e6); border-radius: 12px; padding: 24px; text-align: center; margin: 16px 0;">
          <i class="bi bi-pencil-square" style="font-size: 32px; color: var(--primary-red, #d63031); margin-bottom: 12px;"></i>
          <h5 style="margin: 8px 0;">¿Probaste este ${itemType === 'service' ? 'servicio' : 'producto'}?</h5>
          <p class="text-muted mb-3" style="font-size: 14px;">Compartí tu experiencia con otros usuarios.</p>
          <a href="./login.html?redirect=${encodeURIComponent(location.pathname + location.search)}" class="btn btn-primary">
            <i class="bi bi-box-arrow-in-right me-1"></i>Iniciá sesión para reseñar
          </a>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="review-form-card" style="background: var(--white, #fff); border: 1px solid var(--gray-200, #e9ecef); border-radius: 12px; padding: 20px; margin: 16px 0;">
        <h5 style="margin: 0 0 16px;">
          <i class="bi bi-pencil-square me-2"></i>Dejar una reseña
        </h5>
        <form id="reviewForm" novalidate>
          <!-- Rating con estrellas clickeables -->
          <div class="mb-3">
            <label class="form-label fw-bold">Tu calificación <span class="text-danger">*</span></label>
            <div class="rating-input" id="ratingInput" style="display:flex; gap:6px; align-items:center;">
              ${[1,2,3,4,5].map(n => `
                <button type="button" class="rating-star" data-rating="${n}"
                        aria-label="${n} ${n === 1 ? 'estrella' : 'estrellas'}"
                        style="background:none; border:none; cursor:pointer; padding:4px; font-size:28px; color: var(--gray-400, #ced4da); transition: color .15s;">
                  <i class="bi bi-star-fill"></i>
                </button>
              `).join('')}
              <span class="rating-label text-muted ms-2" id="ratingLabel" style="font-size:14px;">Elegí una calificación</span>
            </div>
            <input type="hidden" id="reviewRating" name="rating" required value="">
          </div>

          <div class="mb-3">
            <label for="reviewTitle" class="form-label">Título <small class="text-muted">(opcional)</small></label>
            <input type="text" class="form-control" id="reviewTitle" name="title"
                   maxlength="150" placeholder="Resumen en una línea (ej: 'Excelente servicio, súper recomendado')">
          </div>

          <div class="mb-3">
            <label for="reviewBody" class="form-label">Tu experiencia <small class="text-muted">(opcional)</small></label>
            <textarea class="form-control" id="reviewBody" name="body" rows="4"
                      maxlength="2000" placeholder="Contanos qué tal fue tu experiencia. ¿Recomendarías a otros usuarios?"></textarea>
            <small class="text-muted">Máx. 2000 caracteres.</small>
          </div>

          <div id="reviewFormError" class="alert alert-danger d-none" role="alert" style="border-radius:8px;"></div>

          <button type="submit" class="btn btn-primary" id="reviewSubmitBtn" disabled>
            <i class="bi bi-send me-1"></i>Publicar reseña
          </button>
        </form>
      </div>
    `;

    bindFormBehavior({ itemType, itemId, container });
  }

  function bindFormBehavior({ itemType, itemId, container }) {
    const form     = container.querySelector('#reviewForm');
    const stars    = container.querySelectorAll('.rating-star');
    const ratingInput = container.querySelector('#reviewRating');
    const ratingLabel = container.querySelector('#ratingLabel');
    const submitBtn = container.querySelector('#reviewSubmitBtn');
    const errorBox = container.querySelector('#reviewFormError');

    let selected = 0;

    // Hover preview de estrellas
    stars.forEach((star, i) => {
      const n = i + 1;
      star.addEventListener('mouseenter', () => paintStars(n));
      star.addEventListener('focus',      () => paintStars(n));
      star.addEventListener('click',      () => {
        selected = n;
        ratingInput.value = n;
        ratingLabel.textContent = STAR_LABELS[n - 1];
        submitBtn.disabled = false;
        paintStars(n);
      });
    });
    container.querySelector('#ratingInput').addEventListener('mouseleave', () => paintStars(selected));

    function paintStars(n) {
      stars.forEach((s, i) => {
        s.style.color = i < n ? '#f5a623' : 'var(--gray-400, #ced4da)';
      });
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errorBox.classList.add('d-none');

      if (!selected) {
        errorBox.textContent = 'Tenés que elegir una calificación con las estrellas.';
        errorBox.classList.remove('d-none');
        return;
      }

      const title = container.querySelector('#reviewTitle').value.trim();
      const body  = container.querySelector('#reviewBody').value.trim();

      const originalHTML = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Publicando…';

      try {
        const res = await window.DaleDeal.api.createReview({
          item_type: itemType,
          item_id:   parseInt(itemId, 10),
          rating:    selected,
          title:     title || undefined,
          body:      body || undefined,
        });

        // Éxito: reemplazar el form por mensaje de gracias + insertar review en la lista
        container.innerHTML = `
          <div class="alert alert-success" role="alert" style="border-radius:12px;">
            <i class="bi bi-check-circle-fill me-2"></i>
            <strong>¡Gracias por tu reseña!</strong> Ya está publicada y otros usuarios pueden verla.
          </div>
        `;

        // Insertar la review nueva al inicio de la lista (optimistic UI)
        insertNewReviewIntoList(res.review || res, container);
      } catch (err) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHTML;

        // Mensajes específicos según el error del backend
        const msg = err?.message || '';
        let userMsg = 'No pudimos publicar tu reseña. Probá de nuevo en unos minutos.';
        if (/compr[áa]/i.test(msg))   userMsg = 'Solo podés reseñar productos que hayas comprado y recibido.';
        else if (/ya reseñ/i.test(msg)) userMsg = 'Ya publicaste una reseña para este ítem.';
        else if (/401|403|token/i.test(msg)) userMsg = 'Tu sesión expiró. Iniciá sesión de nuevo.';
        else if (msg) userMsg = msg;

        errorBox.textContent = userMsg;
        errorBox.classList.remove('d-none');
      }
    });
  }

  // Inserta la review recién creada al INICIO de la lista visible.
  // Busca el primer .review-item del DOM y le pone la nueva antes.
  // Si no encuentra ninguna, no hace nada (el user verá la review al refrescar).
  function insertNewReviewIntoList(review, container) {
    if (!review) return;

    const reviewsContent = document.querySelector('.reviews-content, #reviews .reviews-content');
    if (!reviewsContent) return;

    const stars = '★'.repeat(review.rating || 5) + '☆'.repeat(5 - (review.rating || 5));
    const dateStr = 'Recién ahora';
    const userName = review.reviewer_name || 'Vos';
    const avatar = review.reviewer_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=D63031&color=fff&size=48`;

    const html = `
      <div class="review-item" style="animation: fadeIn .4s; border-left: 3px solid var(--primary-red, #d63031); padding-left: 12px;">
        <div class="review-header">
          <img src="${esc(avatar)}" alt="${esc(userName)}" class="review-avatar" loading="lazy" width="48" height="48">
          <div class="review-info">
            <h6>${esc(userName)} <small class="text-muted">(tu reseña)</small></h6>
            <div class="review-meta">
              <div class="review-rating" style="color:#f5a623; letter-spacing:2px;">${stars}</div>
              <span class="review-date">${dateStr}</span>
            </div>
          </div>
        </div>
        <div class="review-content">
          ${review.title ? `<h6 class="review-title">${esc(review.title)}</h6>` : ''}
          ${review.body  ? `<p class="review-text">${esc(review.body)}</p>` : ''}
        </div>
      </div>
    `;

    // Insertar después del header del summary, antes del primer .review-item existente
    const firstExisting = reviewsContent.querySelector('.review-item');
    if (firstExisting) {
      firstExisting.insertAdjacentHTML('beforebegin', html);
    } else {
      reviewsContent.insertAdjacentHTML('beforeend', html);
    }
  }

  // API pública
  window.DaleDealReviews = {
    mount(selector, { itemType, itemId }) {
      const container = typeof selector === 'string'
        ? document.querySelector(selector)
        : selector;
      if (!container) {
        console.warn('[reviews-form] container no encontrado:', selector);
        return;
      }
      if (!itemType || !itemId) {
        console.warn('[reviews-form] mount requiere itemType + itemId');
        return;
      }
      if (!window.DaleDeal?.api?.createReview) {
        console.warn('[reviews-form] window.DaleDeal.api no cargado');
        return;
      }
      renderForm({ itemType, itemId, container });
    },
  };
})();
