// =====================================================
// DALE DEAL - Mis ventas (dashboard del vendedor)
// =====================================================

(function () {
  'use strict';

  let currentOrders   = [];
  let trackingModal   = null;
  let activeOrderId   = null;
  let carriers        = [];

  // Compra Protegida: días desde la entrega hasta que el pago es liberable.
  const RELEASE_DAYS  = 7;

  // Por si el backend todavía no expone GET /shipping/carriers.
  const FALLBACK_CARRIERS = [
    { slug: 'correo_argentino', name: 'Correo Argentino' },
    { slug: 'andreani',         name: 'Andreani' },
    { slug: 'oca',              name: 'OCA' },
    { slug: 'via_cargo',        name: 'Vía Cargo' },
    { slug: 'other',            name: 'Otro correo' },
  ];

  document.addEventListener('DOMContentLoaded', async () => {
    if (!localStorage.getItem('daledeal_token')) {
      window.location.href = './login.html?redirect=mis-ventas';
      return;
    }

    trackingModal = new bootstrap.Modal(document.getElementById('trackingModal'));

    document.getElementById('tracking-save-btn')
      .addEventListener('click', saveTracking);

    await Promise.all([loadCarriers(), loadSales()]);
  });

  async function loadCarriers() {
    const sel = document.getElementById('tracking-carrier');
    if (!sel) return;
    try {
      const res = await window.DaleDeal?.api?.apiFetch('/shipping/carriers');
      carriers = Array.isArray(res?.data) && res.data.length ? res.data : FALLBACK_CARRIERS;
    } catch (_) {
      carriers = FALLBACK_CARRIERS;
    }
    sel.innerHTML = '<option value="">Elegí el correo…</option>'
      + carriers.map(c => `<option value="${escape(c.slug)}">${escape(c.name)}</option>`).join('');
  }

  async function loadSales() {
    const loadingEl = document.getElementById('ventas-loading');
    const emptyEl   = document.getElementById('ventas-empty');
    const errorEl   = document.getElementById('ventas-error');
    const listEl    = document.getElementById('ventas-list');

    loadingEl.style.display = '';
    emptyEl.style.display   = 'none';
    errorEl.style.display   = 'none';
    listEl.innerHTML = '';

    try {
      const apiFetch = window.DaleDeal?.api?.apiFetch;
      if (!apiFetch) throw new Error('API no disponible');

      const res = await apiFetch('/orders/sales?limit=50');
      currentOrders = res?.data || [];

      loadingEl.style.display = 'none';

      if (currentOrders.length === 0) {
        emptyEl.style.display = '';
        return;
      }

      listEl.innerHTML = currentOrders.map(renderOrderCard).join('');
      checkPayoutAccount();

      // Wire-up de botones por orden
      listEl.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', () => {
          const action  = btn.dataset.action;
          const orderId = parseInt(btn.dataset.orderId, 10);
          if (action === 'tracking') openTrackingModal(orderId);
          if (action === 'delivered') markDelivered(orderId);
        });
      });
    } catch (err) {
      loadingEl.style.display = 'none';
      errorEl.style.display = '';
      document.getElementById('ventas-error-msg').textContent = err.message || '';
      console.error('[mis-ventas] error:', err);
    }
  }

  function renderOrderCard(o) {
    const statusLabel = {
      pending:    'Pendiente de pago',
      confirmed:  'Pagado · listo para preparar',
      shipped:    'Despachado',
      delivered:  'Entregado',
      cancelled:  'Cancelado',
    }[o.status] || o.status;

    const paid = o.payment_status === 'paid';
    const showShipActions = paid && o.shipping_method === 'delivery'
      && (o.status === 'confirmed' || o.status === 'shipped');
    const showMarkDelivered = paid && o.status === 'shipped';

    let shipBlock = '';
    if (o.shipping_method === 'delivery') {
      shipBlock = `
        <div class="ship-block">
          <strong><i class="bi bi-box-seam me-1"></i>Envío a domicilio</strong>
          <div>${escape(o.shipping_recipient_name || '—')} · ${escape(o.shipping_phone || '')}</div>
          <div>${escape(o.shipping_street || '')}, ${escape(o.shipping_city || '')}, ${escape(o.shipping_province || '')} ${o.shipping_postal_code ? `(CP ${escape(o.shipping_postal_code)})` : ''}</div>
          ${o.shipping_notes ? `<div class="text-muted mt-1">Nota: ${escape(o.shipping_notes)}</div>` : ''}
          ${o.tracking_number ? `<div class="mt-1"><strong>Seguimiento</strong>${o.shipping_carrier_name ? escape(o.shipping_carrier_name) + ' · ' : ''}${escape(o.tracking_number)}${o.tracking_url ? ` · <a href="${escape(o.tracking_url)}" target="_blank" rel="noopener">Seguir envío <i class="bi bi-box-arrow-up-right"></i></a>` : ''}</div>` : ''}
          ${o.tracking_status_label ? `<div class="mt-1"><i class="bi bi-truck me-1"></i>${escape(o.tracking_status_label)}${o.tracking_status_at ? ' · ' + formatDate(o.tracking_status_at) : ''}${o.delivered_source === 'carrier' ? ' (confirmado por el correo)' : ''}</div>` : ''}
          <div class="text-muted mt-1">
            Costo del envío cobrado: ${formatPrice(o.shipping_cost || 0)}
          </div>
        </div>
      `;
    } else if (o.shipping_method === 'pickup') {
      shipBlock = `
        <div class="ship-block">
          <strong><i class="bi bi-geo-alt me-1"></i>Retiro en persona</strong>
          <div class="text-muted">El comprador retira en la zona acordada. Coordiná por chat.</div>
        </div>
      `;
    }

    return `
      <div class="order-card">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <div>
            <div class="order-id">Orden #${o.id} · ${formatDate(o.created_at)}</div>
            <div class="order-buyer"><i class="bi bi-person me-1"></i>${escape(o.buyer_name || 'Comprador')}</div>
          </div>
          <span class="badge-status status-${o.status}">${statusLabel}</span>
        </div>
        <div class="order-row">
          <img class="order-img" src="${getProductImage(o)}" alt="" loading="lazy" decoding="async" onerror="this.style.visibility='hidden'" />
          <div class="order-meta">
            <p class="order-title">${escape(o.product_title || 'Producto')}</p>
            <div class="text-muted small">Cantidad: ${o.quantity}</div>
            <div class="fw-bold mt-1">Total: ${formatPrice(o.total_price)}</div>
          </div>
        </div>
        ${shipBlock}
        ${payoutBlock(o)}
        ${(showShipActions || showMarkDelivered) ? `
          <div class="order-actions">
            ${showShipActions ? `
              <button class="btn btn-primary btn-sm" data-action="tracking" data-order-id="${o.id}">
                <i class="bi bi-truck me-1"></i>
                ${o.tracking_number ? 'Editar tracking' : 'Cargar tracking / despachar'}
              </button>
            ` : ''}
            ${showMarkDelivered ? `
              <button class="btn btn-success btn-sm" data-action="delivered" data-order-id="${o.id}">
                <i class="bi bi-check-circle me-1"></i> Marcar como entregada
              </button>
            ` : ''}
          </div>
        ` : ''}
      </div>
    `;
  }

  // ── Cobro (Compra Protegida / escrow) ──────────────────────────────────
  // En qué quedó la plata de la venta. Si el backend todavía no manda
  // release_status (versión vieja) no se muestra nada.
  function payoutBlock(o) {
    if (o.payment_status === 'refunded' || o.release_status === 'refunded') {
      return `
        <div class="payout-block payout-refunded">
          <strong><i class="bi bi-arrow-counterclockwise me-1"></i>Reembolsado al comprador</strong>
          <div>Esta venta se devolvió y no se cobra.</div>
        </div>`;
    }
    if (o.payment_status !== 'paid' || !o.release_status) return '';

    const total      = parseFloat(o.total_price) || 0;
    const commission = parseFloat(o.commission_amount) || 0;
    const net = o.payout_net != null
      ? parseFloat(o.payout_net)
      : Math.round((total - commission) * 100) / 100;
    const breakdown = `<div class="payout-sub">Neto: <strong>${formatPrice(net)}</strong>${commission ? ` · total ${formatPrice(total)} menos comisión ${formatPrice(commission)}` : ''}</div>`;

    if (o.release_status === 'released') {
      return `
        <div class="payout-block payout-released">
          <strong><i class="bi bi-cash-coin me-1"></i>Pago liberado${o.released_at ? ' el ' + formatDate(o.released_at) : ''}</strong>
          <div>Te transferimos <strong>${formatPrice(net)}</strong> por Mercado Pago.${o.payout_reference ? ` Comprobante: <span class="payout-ref">${escape(o.payout_reference)}</span>` : ''}</div>
        </div>`;
    }
    if (o.release_status === 'held') {
      return `
        <div class="payout-block payout-held">
          <strong><i class="bi bi-pause-circle me-1"></i>Pago frenado por un reclamo</strong>
          <div>Lo estamos revisando con el comprador y te vamos a contactar.</div>
          ${breakdown}
        </div>`;
    }
    if (o.releasable) {
      return `
        <div class="payout-block payout-ready">
          <strong><i class="bi bi-check2-circle me-1"></i>Listo para liberar</strong>
          <div>${o.buyer_confirmed_at ? 'El comprador confirmó que lo recibió.' : `Pasaron ${RELEASE_DAYS} días de la entrega sin reclamos.`} Te lo transferimos a la brevedad y te avisamos por mail.</div>
          ${breakdown}
        </div>`;
    }
    const releaseFrom = o.delivered_at
      ? new Date(new Date(o.delivered_at).getTime() + RELEASE_DAYS * 86400000)
      : null;
    return `
      <div class="payout-block payout-retained">
        <strong><i class="bi bi-shield-lock me-1"></i>Pago protegido por Compra Protegida</strong>
        <div>${releaseFrom
          ? `Se libera cuando el comprador confirme que lo recibió o, si no hay reclamos, desde el ${formatDate(releaseFrom)}.`
          : `Se libera cuando el comprador confirme que lo recibió, o a los ${RELEASE_DAYS} días de la entrega.`}</div>
        ${breakdown}
      </div>`;
  }

  // Si vende y todavía no cargó a dónde cobrar, se lo pedimos arriba de todo.
  async function checkPayoutAccount() {
    if (document.getElementById('payout-banner')) return;
    try {
      const d = await window.DaleDeal?.api?.apiFetch('/users/me/payout-account');
      if (!d || !d.available || d.account) return;
      const html = `
        <div class="alert alert-warning d-flex align-items-start gap-2" id="payout-banner" role="alert">
          <i class="bi bi-bank2" style="font-size:1.2rem;line-height:1.2;"></i>
          <div><strong>Cargá tus datos de cobro.</strong> Necesitamos tu alias, CVU o CBU para transferirte cuando se libere el pago de una venta.
            <a href="./mi-cuenta.html#datos-cobro" class="alert-link">Cargarlos ahora</a></div>
        </div>`;
      const header = document.querySelector('.ventas-header');
      if (header) header.insertAdjacentHTML('afterend', html);
      else document.getElementById('ventas-list')?.insertAdjacentHTML('beforebegin', html);
    } catch (_) { /* sin datos de cobro no bloqueamos la página */ }
  }

  function openTrackingModal(orderId) {
    activeOrderId = orderId;
    const order = currentOrders.find(o => o.id === orderId);
    if (!order) return;

    document.getElementById('tracking-order-info').textContent =
      `Orden #${order.id} · ${order.product_title || 'Producto'} · ${formatPrice(order.total_price)}`;
    document.getElementById('tracking-input').value = order.tracking_number || '';
    const carrierSel = document.getElementById('tracking-carrier');
    if (carrierSel) carrierSel.value = order.shipping_carrier || '';
    document.getElementById('tracking-mark-shipped').checked = order.status === 'confirmed';
    document.getElementById('tracking-error').classList.add('d-none');
    trackingModal.show();
  }

  async function saveTracking() {
    if (!activeOrderId) return;
    const tracking = document.getElementById('tracking-input').value.trim();
    const markShipped = document.getElementById('tracking-mark-shipped').checked;
    const carrier  = document.getElementById('tracking-carrier')?.value || '';
    const errorEl = document.getElementById('tracking-error');
    const btn     = document.getElementById('tracking-save-btn');

    errorEl.classList.add('d-none');
    if (tracking && !carrier) {
      errorEl.textContent = 'Elegí con qué correo lo mandaste, así el comprador puede seguir el envío.';
      errorEl.classList.remove('d-none');
      return;
    }
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Guardando…';

    try {
      const apiFetch = window.DaleDeal?.api?.apiFetch;
      await apiFetch(`/orders/${activeOrderId}/shipping`, {
        method: 'PATCH',
        body: JSON.stringify({
          tracking_number: tracking || null,
          carrier:         carrier || null,
          mark_shipped:    markShipped,
        }),
      });
      trackingModal.hide();
      await loadSales();
    } catch (err) {
      errorEl.textContent = err.message || 'Error al guardar el envío';
      errorEl.classList.remove('d-none');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-save me-1"></i> Guardar';
    }
  }

  async function markDelivered(orderId) {
    if (!confirm('¿Confirmás que el comprador recibió el producto? Esta acción cierra la orden.')) return;

    try {
      const apiFetch = window.DaleDeal?.api?.apiFetch;
      await apiFetch(`/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'delivered' }),
      });
      await loadSales();
    } catch (err) {
      alert('Error: ' + (err.message || 'No se pudo marcar como entregada'));
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────
  function escape(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function formatPrice(n) {
    const v = parseFloat(n) || 0;
    return new Intl.NumberFormat('es-AR', {
      style: 'currency', currency: 'ARS',
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(v);
  }

  function formatDate(d) {
    if (!d) return '';
    const date = new Date(d);
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function getProductImage(order) {
    const imgs = order.product_images;
    if (Array.isArray(imgs) && imgs.length > 0) return imgs[0];
    if (typeof imgs === 'string') return imgs;
    return '';
  }
})();
