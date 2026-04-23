/**
 * DALE DEAL - Widget flotante de soporte / ayuda
 *
 * Botón chiquito siempre visible abajo a la derecha. El "popup saludando"
 * se abre solo:
 *   - Primera visita del usuario (no hay estado guardado)
 *   - O si pasaron más de REMIND_AFTER_DAYS desde el último "X" (dismiss)
 *
 * Si el usuario lo abre manualmente al menos una vez, nunca más se
 * auto-abre (asumimos que ya sabe que está ahí).
 *
 * Contenido: FAQ canned + botón para ir al centro de contacto.
 */
(function () {
  'use strict';

  const STORAGE_KEY         = 'dd_support_widget_state';
  const AUTO_OPEN_DELAY_MS  = 8000;   // esperar 8s después del load
  const AUTO_CLOSE_DELAY_MS = 15000;  // si el usuario no interactúa, se cierra solo
  const REMIND_AFTER_DAYS   = 7;

  const isHtmlSubdir = window.location.pathname.includes('/HTML/');
  const contactUrl = isHtmlSubdir
    ? './notificaciones.html#contacto'
    : './HTML/notificaciones.html#contacto';
  const reportUrl = isHtmlSubdir
    ? './notificaciones.html#reportar-problema'
    : './HTML/notificaciones.html#reportar-problema';
  const helpUrl = isHtmlSubdir
    ? './notificaciones.html#centro-ayuda'
    : './HTML/notificaciones.html#centro-ayuda';

  // ── Estado persistente ────────────────────────────────────────────────────
  function getState() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch { return {}; }
  }
  function saveState(patch) {
    const cur = getState();
    const next = { ...cur, ...patch };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
  }

  function shouldAutoOpen() {
    const s = getState();
    if (s.hasOpenedEver) return false;
    if (s.dismissedAt) {
      const days = (Date.now() - s.dismissedAt) / 86400000;
      if (days < REMIND_AFTER_DAYS) return false;
    }
    return true;
  }

  // ── FAQ canned ────────────────────────────────────────────────────────────
  const FAQ = [
    {
      q: '¿Cómo publico un producto o servicio?',
      a: 'Hacé clic en <b>Publicar</b> arriba a la derecha y completá el formulario con título, fotos, descripción y precio. Es gratis.'
    },
    {
      q: '¿Cuánto cuesta usar Dale Deal?',
      a: 'Publicar es <b>gratis</b>. Solo cobramos una comisión del <b>5%</b> sobre las ventas concretadas.'
    },
    {
      q: '¿Cómo funcionan los pagos?',
      a: 'Los cobros se procesan por <b>Mercado Pago</b>. Recibís el dinero en tu cuenta 7 días después de que el comprador confirme la recepción.'
    },
    {
      q: '¿Cómo coordino el envío?',
      a: 'Chateás directo con el comprador desde la sección <b>Mensajes</b> de tu perfil. También podés ofrecer retiro en persona.'
    },
    {
      q: 'Tengo un problema con una compra',
      a: `Podés <a href="${reportUrl}" style="color:var(--primary-red);font-weight:700;">reportar el problema acá</a> y te respondemos en menos de 24hs.`
    }
  ];

  // ── CSS inyectado ────────────────────────────────────────────────────────
  const CSS = `
    .dd-support-widget { position: fixed; bottom: 24px; right: 40px; z-index: 9998; font-family: var(--font-family-base, system-ui, sans-serif); }
    .dd-support-btn { width: 56px; height: 56px; border-radius: 50%; border: none; background: var(--gradient-primary, linear-gradient(135deg,#e53e3e,#f97316)); color: #fff; cursor: pointer; box-shadow: 0 10px 25px rgba(229,62,62,0.35); display: flex; align-items: center; justify-content: center; font-size: 22px; transition: transform .2s ease, box-shadow .2s ease; }
    .dd-support-btn:hover { transform: scale(1.08); box-shadow: 0 14px 32px rgba(229,62,62,0.45); }
    .dd-support-btn i { line-height: 1; }
    .dd-support-pulse::after { content:''; position:absolute; inset:-6px; border-radius:50%; border:2px solid rgba(229,62,62,0.5); animation: dd-pulse 1.8s ease-out infinite; pointer-events:none; }
    @keyframes dd-pulse { 0% { transform: scale(1); opacity: .8; } 100% { transform: scale(1.4); opacity: 0; } }

    .dd-support-tooltip { position: absolute; bottom: 72px; right: 0; background: #fff; color: #1f2937; border-radius: 14px; padding: 14px 44px 14px 16px; box-shadow: 0 12px 30px rgba(0,0,0,0.15); max-width: 280px; font-size: 14px; font-weight: 500; opacity: 0; transform: translateY(8px); pointer-events: none; transition: all .25s ease; }
    .dd-support-tooltip::after { content: ''; position: absolute; bottom: -6px; right: 22px; width: 12px; height: 12px; background: #fff; transform: rotate(45deg); box-shadow: 3px 3px 6px rgba(0,0,0,0.04); }
    .dd-support-tooltip.show { opacity: 1; transform: translateY(0); pointer-events: auto; }
    .dd-support-tooltip-x { position: absolute; top: 6px; right: 8px; background: none; border: none; color: #9ca3af; cursor: pointer; font-size: 14px; padding: 4px; line-height: 1; border-radius: 50%; width: 22px; height: 22px; display:flex; align-items:center; justify-content:center; }
    .dd-support-tooltip-x:hover { color: #e53e3e; background: #fef2f2; }

    .dd-support-panel { position: absolute; bottom: 72px; right: 0; width: 340px; max-width: calc(100vw - 40px); max-height: 520px; background: #fff; border-radius: 18px; box-shadow: 0 20px 50px rgba(0,0,0,0.22); display: none; flex-direction: column; overflow: hidden; }
    .dd-support-panel.show { display: flex; animation: dd-slide-up .25s ease; }
    @keyframes dd-slide-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .dd-support-header { padding: 18px 18px 14px; background: var(--gradient-primary, linear-gradient(135deg,#e53e3e,#f97316)); color: #fff; }
    .dd-support-header h4 { margin: 0 0 4px 0; font-size: 17px; font-weight: 800; }
    .dd-support-header p { margin: 0; font-size: 13px; opacity: .9; }
    .dd-support-header-close { position: absolute; top: 12px; right: 12px; background: rgba(255,255,255,0.2); border: none; color: #fff; cursor: pointer; width: 28px; height: 28px; border-radius: 50%; display:flex; align-items:center; justify-content:center; font-size: 14px; transition: background .15s; }
    .dd-support-header-close:hover { background: rgba(255,255,255,0.35); }
    .dd-support-body { flex: 1; overflow-y: auto; padding: 12px 14px; background: #f9fafb; }
    .dd-faq-item { background: #fff; border: 1px solid #e5e7eb; border-radius: 12px; margin-bottom: 8px; overflow: hidden; }
    .dd-faq-q { width: 100%; text-align: left; background: none; border: none; padding: 12px 14px; font-size: 13px; font-weight: 600; color: #1f2937; cursor: pointer; display: flex; justify-content: space-between; align-items: center; gap: 8px; }
    .dd-faq-q:hover { background: #fef2f2; color: #e53e3e; }
    .dd-faq-q i { transition: transform .2s; font-size: 12px; color: #9ca3af; flex-shrink: 0; }
    .dd-faq-item.open .dd-faq-q i { transform: rotate(180deg); }
    .dd-faq-a { max-height: 0; overflow: hidden; transition: max-height .25s ease, padding .25s ease; font-size: 12.5px; line-height: 1.5; color: #4b5563; padding: 0 14px; }
    .dd-faq-item.open .dd-faq-a { max-height: 200px; padding: 0 14px 12px; }
    .dd-support-footer { padding: 12px 14px; border-top: 1px solid #e5e7eb; background: #fff; display: flex; flex-direction: column; gap: 8px; }
    .dd-support-cta { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px; border-radius: 10px; font-size: 13px; font-weight: 700; text-decoration: none; transition: all .15s; border: none; cursor: pointer; }
    .dd-support-cta-primary { background: var(--gradient-primary, linear-gradient(135deg,#e53e3e,#f97316)); color: #fff; }
    .dd-support-cta-primary:hover { transform: translateY(-1px); box-shadow: 0 6px 14px rgba(229,62,62,0.3); color: #fff; }
    .dd-support-cta-ghost { background: transparent; color: #6b7280; font-weight: 600; font-size: 12px; }
    .dd-support-cta-ghost:hover { color: #e53e3e; }

    /* Dark mode */
    [data-theme="dark"] .dd-support-tooltip { background: #1e293b; color: #f1f5f9; }
    [data-theme="dark"] .dd-support-tooltip::after { background: #1e293b; }
    [data-theme="dark"] .dd-support-panel { background: #0f172a; }
    [data-theme="dark"] .dd-support-body { background: #1e293b; }
    [data-theme="dark"] .dd-faq-item { background: #0f172a; border-color: rgba(255,255,255,0.08); }
    [data-theme="dark"] .dd-faq-q { color: #f1f5f9; }
    [data-theme="dark"] .dd-faq-q:hover { background: rgba(229,62,62,0.12); }
    [data-theme="dark"] .dd-faq-a { color: #cbd5e1; }
    [data-theme="dark"] .dd-support-footer { background: #0f172a; border-top-color: rgba(255,255,255,0.08); }

    @media (max-width: 480px) {
      .dd-support-widget { bottom: 16px; right: 16px; }
      .dd-support-panel { width: calc(100vw - 32px); max-height: 70vh; }
    }
  `;

  // ── Inyectar DOM + estilos ────────────────────────────────────────────────
  function inject() {
    if (document.getElementById('dd-support-widget')) return;

    const style = document.createElement('style');
    style.id = 'dd-support-widget-styles';
    style.textContent = CSS;
    document.head.appendChild(style);

    const faqHtml = FAQ.map((f, i) => `
      <div class="dd-faq-item" data-idx="${i}">
        <button class="dd-faq-q" type="button">
          <span>${f.q}</span>
          <i class="bi bi-chevron-down"></i>
        </button>
        <div class="dd-faq-a">${f.a}</div>
      </div>
    `).join('');

    const wrap = document.createElement('div');
    wrap.className = 'dd-support-widget';
    wrap.id = 'dd-support-widget';
    wrap.innerHTML = `
      <div class="dd-support-tooltip" id="ddSupportTooltip" role="status">
        <button class="dd-support-tooltip-x" id="ddSupportTooltipX" title="Cerrar" aria-label="Cerrar">
          <i class="bi bi-x"></i>
        </button>
        <b>¿Necesitás ayuda?</b><br/>
        <span style="font-weight:400; color:#6b7280; font-size:13px;">Estamos acá para lo que necesites.</span>
      </div>

      <div class="dd-support-panel" id="ddSupportPanel" role="dialog" aria-label="Soporte Dale Deal">
        <div class="dd-support-header" style="position:relative;">
          <button class="dd-support-header-close" id="ddSupportClose" aria-label="Cerrar">
            <i class="bi bi-x-lg"></i>
          </button>
          <h4><i class="bi bi-headset me-1"></i> Soporte Dale Deal</h4>
          <p>Respuestas rápidas y contacto directo.</p>
        </div>
        <div class="dd-support-body">
          ${faqHtml}
        </div>
        <div class="dd-support-footer">
          <a href="${contactUrl}" class="dd-support-cta dd-support-cta-primary">
            <i class="bi bi-chat-dots-fill"></i> Contactar soporte
          </a>
          <a href="${helpUrl}" class="dd-support-cta dd-support-cta-ghost">
            Ver centro de ayuda completo
          </a>
        </div>
      </div>

      <button class="dd-support-btn" id="ddSupportBtn" aria-label="Abrir soporte" title="¿Necesitás ayuda?">
        <i class="bi bi-question-lg"></i>
      </button>
    `;
    document.body.appendChild(wrap);
  }

  // ── Lógica ────────────────────────────────────────────────────────────────
  let autoCloseTimer = null;

  function showTooltip() {
    const tip = document.getElementById('ddSupportTooltip');
    const btn = document.getElementById('ddSupportBtn');
    if (!tip) return;
    tip.classList.add('show');
    btn?.classList.add('dd-support-pulse');
    // auto cerrar el tooltip si no hay interacción
    clearTimeout(autoCloseTimer);
    autoCloseTimer = setTimeout(hideTooltip, AUTO_CLOSE_DELAY_MS);
  }

  function hideTooltip(persistDismiss) {
    const tip = document.getElementById('ddSupportTooltip');
    const btn = document.getElementById('ddSupportBtn');
    tip?.classList.remove('show');
    btn?.classList.remove('dd-support-pulse');
    clearTimeout(autoCloseTimer);
    if (persistDismiss) saveState({ dismissedAt: Date.now() });
  }

  function openPanel() {
    hideTooltip(false);
    document.getElementById('ddSupportPanel')?.classList.add('show');
    saveState({ hasOpenedEver: true });
  }

  function closePanel() {
    document.getElementById('ddSupportPanel')?.classList.remove('show');
  }

  function wire() {
    document.getElementById('ddSupportBtn')?.addEventListener('click', () => {
      const panel = document.getElementById('ddSupportPanel');
      if (panel?.classList.contains('show')) closePanel();
      else openPanel();
    });
    document.getElementById('ddSupportClose')?.addEventListener('click', closePanel);
    document.getElementById('ddSupportTooltipX')?.addEventListener('click', e => {
      e.stopPropagation();
      hideTooltip(true);
    });
    document.getElementById('ddSupportTooltip')?.addEventListener('click', e => {
      if (e.target.id === 'ddSupportTooltipX' || e.target.closest('#ddSupportTooltipX')) return;
      openPanel();
    });

    // FAQ accordion
    document.querySelectorAll('.dd-faq-item').forEach(item => {
      item.querySelector('.dd-faq-q')?.addEventListener('click', () => {
        document.querySelectorAll('.dd-faq-item.open').forEach(o => {
          if (o !== item) o.classList.remove('open');
        });
        item.classList.toggle('open');
      });
    });

    // ESC cierra panel
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') closePanel();
    });
  }

  function init() {
    if (window._ddSupportInitialized) return;
    window._ddSupportInitialized = true;

    inject();
    wire();

    // primera visita: marcar en el estado (para telemetría futura)
    const s = getState();
    if (!s.firstVisitAt) saveState({ firstVisitAt: Date.now() });

    if (shouldAutoOpen()) {
      setTimeout(showTooltip, AUTO_OPEN_DELAY_MS);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
