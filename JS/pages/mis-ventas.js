// =====================================================
// DALE DEAL - Mis ventas (dashboard del vendedor)
// =====================================================

(function () {
  'use strict';

  let currentOrders   = [];
  let trackingModal   = null;
  let activeOrderId   = null;

  document.addEventListener('DOMContentLoaded', async () => {
    if (!localStorage.getItem('daledeal:token')) {
      window.location.href = './login.html?redirect=mis-ventas';
      return;
    }

    trackingModal = new bootstrap.Modal(document.getElementById('trackingModal'));

    document.getElementById('tracking-save-btn')
      .addEventListener('click', saveTracking);

    await loadSales();
  });

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
          ${o.tracking_number ? `<div class="mt-1"><strong>Tracking:</strong> ${escape(o.tracking_number)}</div>` : ''}
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

  function openTrackingModal(orderId) {
    activeOrderId = orderId;
    const order = currentOrders.find(o => o.id === orderId);
    if (!order) return;

    document.getElementById('tracking-order-info').textContent =
      `Orden #${order.id} · ${order.product_title || 'Producto'} · ${formatPrice(order.total_price)}`;
    document.getElementById('tracking-input').value = order.tracking_number || '';
    document.getElementById('tracking-mark-shipped').checked = order.status === 'confirmed';
    document.getElementById('tracking-error').classList.add('d-none');
    trackingModal.show();
  }

  async function saveTracking() {
    if (!activeOrderId) return;
    const tracking = document.getElementById('tracking-input').value.trim();
    const markShipped = document.getElementById('tracking-mark-shipped').checked;
    const errorEl = document.getElementById('tracking-error');
    const btn     = document.getElementById('tracking-save-btn');

    errorEl.classList.add('d-none');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Guardando…';

    try {
      const apiFetch = window.DaleDeal?.api?.apiFetch;
      await apiFetch(`/orders/${activeOrderId}/shipping`, {
        method: 'PATCH',
        body: JSON.stringify({
          tracking_number: tracking || null,
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
