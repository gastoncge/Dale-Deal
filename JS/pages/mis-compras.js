// =====================================================
// DALE DEAL - Mis compras (centro de mando → sección "Mis Compras")
//
// Lista las órdenes del comprador con:
//   - estado del pedido y datos de entrega
//   - seguimiento del envío: correo, número, link "Seguir envío", último
//     estado informado por el correo y el historial (GET /orders/:id/tracking)
//   - botón "Recibí el producto" (POST /orders/:id/confirm-delivery): es lo
//     que libera el pago retenido al vendedor (escrow).
// =====================================================

(function () {
  'use strict';

  const FILTERS = {
    all:        () => true,
    processing: o => ['pending', 'confirmed', 'shipped'].includes(o.status),
    delivered:  o => o.status === 'delivered',
    cancelled:  o => o.status === 'cancelled',
  };

  const STATUS_LABEL = {
    pending:   'Pendiente de pago',
    confirmed: 'Pago confirmado · en preparación',
    shipped:   'En camino',
    delivered: 'Entregado',
    cancelled: 'Cancelado',
  };

  let orders = [];
  let filter = 'all';
  let listEl = null;

  document.addEventListener('DOMContentLoaded', () => {
    listEl = document.getElementById('misComprasList');
    if (!listEl) return;

    document.querySelectorAll('[data-order-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        filter = btn.dataset.orderFilter || 'all';
        document.querySelectorAll('[data-order-filter]')
          .forEach(b => b.classList.toggle('active', b === btn));
        render();
      });
    });

    listEl.addEventListener('click', onListClick);
    load();
  });

  function api() {
    return window.DaleDeal?.api?.apiFetch || null;
  }

  async function load() {
    const apiFetch = api();
    if (!localStorage.getItem('daledeal_token') || !apiFetch) {
      listEl.innerHTML = emptyState('bi-person-lock', 'Iniciá sesión para ver tus compras',
        'Tus pedidos, el seguimiento del envío y la confirmación de recepción aparecen acá.',
        '<a href="./login.html?redirect=notificaciones" class="btn btn-primary"><i class="bi bi-box-arrow-in-right me-2"></i>Iniciar sesión</a>');
      return;
    }

    listEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon loading"><i class="bi bi-hourglass-split" aria-hidden="true"></i></div>
        <p class="empty-state-text">Cargando tus compras…</p>
      </div>`;

    try {
      const res = await apiFetch('/orders/my?limit=50');
      orders = Array.isArray(res?.data) ? res.data : [];
      render();
    } catch (err) {
      listEl.innerHTML = emptyState('bi-wifi-off', 'No pudimos cargar tus compras',
        err?.message || 'Probá de nuevo en un rato.',
        '<button type="button" class="btn btn-outline-secondary" data-action="reload"><i class="bi bi-arrow-clockwise me-2"></i>Reintentar</button>');
    }
  }

  function render() {
    const list = orders.filter(FILTERS[filter] || FILTERS.all);
    if (list.length === 0) {
      listEl.innerHTML = orders.length === 0
        ? emptyState('bi-bag', 'Todavía no tenés compras',
            'Cuando completes tu primera compra, va a aparecer acá con el estado de envío y los detalles del pedido.',
            '<a href="./productos.html" class="btn btn-primary"><i class="bi bi-search me-2"></i>Explorar productos</a>')
        : emptyState('bi-funnel', 'Nada por acá', 'No tenés compras en este estado.', '');
      return;
    }
    listEl.innerHTML = list.map(card).join('');
  }

  // ── Tarjeta de pedido ───────────────────────────────────────────────────
  function card(o) {
    const statusLabel = STATUS_LABEL[o.status] || o.status;
    const confirmed   = !!o.buyer_confirmed_at;
    const canConfirm  = !confirmed && (o.status === 'shipped' || o.status === 'delivered');
    const byCarrier   = o.status === 'delivered' && o.delivered_source === 'carrier';
    const carrierName = o.shipping_carrier_name || '';

    let ship = '';
    if (o.shipping_method === 'delivery') {
      const address = [o.shipping_street, o.shipping_city, o.shipping_province].filter(Boolean).map(escape).join(', ');
      const trackingLine = o.tracking_number
        ? `<div class="mt-1">
             ${carrierName ? `${escape(carrierName)} · ` : ''}<span class="tracking-number">${escape(o.tracking_number)}</span>
             ${o.tracking_url ? ` · <a href="${escape(o.tracking_url)}" target="_blank" rel="noopener">Seguir envío <i class="bi bi-box-arrow-up-right" aria-hidden="true"></i></a>` : ''}
           </div>`
        : (o.status === 'pending' || o.status === 'cancelled'
            ? ''
            : '<div class="mt-1 text-muted">El vendedor todavía no cargó el número de seguimiento.</div>');
      const statusLine = o.tracking_status_label
        ? `<div class="mt-1 tracking-status"><i class="bi bi-truck me-1" aria-hidden="true"></i>${escape(o.tracking_status_label)}${o.tracking_status_at ? ` · ${formatDate(o.tracking_status_at)}` : ''}</div>`
        : '';
      const timeline = o.tracking_number
        ? `<button type="button" class="btn btn-link btn-sm p-0 mt-1" data-action="timeline" data-order-id="${o.id}">Ver historial del envío</button>
           <div class="tracking-timeline" id="timeline-${o.id}" hidden></div>`
        : '';
      ship = `
        <div class="ship-block">
          <strong><i class="bi bi-box-seam me-1" aria-hidden="true"></i>Envío a domicilio</strong>
          ${address ? `<div>${address}</div>` : ''}
          ${trackingLine}${statusLine}${timeline}
        </div>`;
    } else if (o.shipping_method === 'pickup') {
      ship = `
        <div class="ship-block">
          <strong><i class="bi bi-geo-alt me-1" aria-hidden="true"></i>Retiro en persona</strong>
          <div class="text-muted">${escape(o.product_pickup_address || 'Coordiná la entrega con el vendedor por chat.')}</div>
        </div>`;
    }

    let actions = '';
    if (canConfirm) {
      actions = `
        <div class="order-actions">
          ${byCarrier ? `<span class="order-hint"><i class="bi bi-check2-circle me-1" aria-hidden="true"></i>${escape(carrierName || 'El correo')} informó que lo entregó.</span>` : ''}
          <button type="button" class="btn btn-success btn-sm" data-action="confirm" data-order-id="${o.id}">
            <i class="bi bi-check-circle me-1" aria-hidden="true"></i> Recibí el producto
          </button>
          <span class="order-hint">Al confirmar, el vendedor cobra. Si hubo un problema, no confirmes y escribinos.</span>
        </div>`;
    } else if (confirmed) {
      actions = `
        <div class="order-actions">
          <span class="order-hint text-success"><i class="bi bi-patch-check-fill me-1" aria-hidden="true"></i>Recepción confirmada el ${formatDate(o.buyer_confirmed_at)}</span>
        </div>`;
    }

    const img = productImage(o);
    return `
      <article class="order-card" data-order-id="${o.id}">
        <div class="order-head">
          <div>
            <div class="order-id">Orden #${o.id} · ${formatDate(o.created_at)}</div>
            <div class="order-seller"><i class="bi bi-shop me-1" aria-hidden="true"></i>${escape(o.seller_name || 'Vendedor')}</div>
          </div>
          <span class="badge-status status-${escape(o.status)}">${escape(statusLabel)}</span>
        </div>
        <div class="order-row">
          ${img ? `<img class="order-img" src="${escape(img)}" alt="" loading="lazy" decoding="async" onerror="this.style.visibility='hidden'" />` : '<div class="order-img" aria-hidden="true"></div>'}
          <div class="order-meta">
            <p class="order-title">${escape(o.product_title || 'Producto')}</p>
            <div class="text-muted small">Cantidad: ${parseInt(o.quantity, 10) || 1}</div>
            <div class="fw-bold mt-1">Total: ${formatPrice(o.total_price)}</div>
          </div>
        </div>
        ${ship}
        ${actions}
      </article>`;
  }

  // ── Acciones ────────────────────────────────────────────────────────────
  function onListClick(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const id = parseInt(btn.dataset.orderId, 10);
    if (btn.dataset.action === 'reload')   return load();
    if (btn.dataset.action === 'timeline') return toggleTimeline(id, btn);
    if (btn.dataset.action === 'confirm')  return confirmDelivery(id, btn);
  }

  async function toggleTimeline(orderId, btn) {
    const box = document.getElementById(`timeline-${orderId}`);
    if (!box) return;
    if (!box.hidden) { box.hidden = true; btn.textContent = 'Ver historial del envío'; return; }

    box.hidden = false;
    btn.textContent = 'Ocultar historial';
    box.innerHTML = '<div class="tl-meta">Cargando…</div>';
    try {
      const t = await api()(`/orders/${orderId}/tracking`);
      const events = Array.isArray(t?.events) ? t.events : [];
      if (events.length === 0) {
        box.innerHTML = `<div class="tl-meta">${t?.auto
          ? 'Todavía no hay novedades del correo. Te avisamos por email cuando haya cambios.'
          : 'El correo todavía no nos informa estados para este envío. Usá el link "Seguir envío".'}</div>`;
        return;
      }
      box.innerHTML = events.map(ev => `
        <div class="tl-item">
          <div class="tl-title">${escape(ev.label || ev.description || ev.status)}</div>
          ${ev.description && ev.label && ev.description !== ev.label ? `<div>${escape(ev.description)}</div>` : ''}
          <div class="tl-meta">${[ev.location ? escape(ev.location) : '', formatDateTime(ev.occurred_at)].filter(Boolean).join(' · ')}</div>
        </div>`).join('');
    } catch (err) {
      box.innerHTML = `<div class="tl-meta">No pudimos traer el historial (${escape(err?.message || 'error')}).</div>`;
    }
  }

  async function confirmDelivery(orderId, btn) {
    if (!window.confirm('¿Confirmás que recibiste el producto y está todo bien?\n\nCon esto el vendedor cobra. Si hubo un problema, cancelá y escribinos.')) return;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Confirmando…';
    try {
      const res = await api()(`/orders/${orderId}/confirm-delivery`, { method: 'POST' });
      const updated = res?.order;
      orders = orders.map(o => (o.id === orderId ? { ...o, ...(updated || {}), status: 'delivered', buyer_confirmed_at: updated?.buyer_confirmed_at || new Date().toISOString() } : o));
      render();
      if (window.DaleDeal?.toast) window.DaleDeal.toast('¡Gracias! Confirmaste la recepción.', 'success');
    } catch (err) {
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-check-circle me-1" aria-hidden="true"></i> Recibí el producto';
      window.alert('No pudimos confirmar la recepción: ' + (err?.message || 'probá de nuevo.'));
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────────
  function emptyState(icon, title, text, cta) {
    return `
      <div class="empty-state">
        <i class="bi ${icon} empty-state-icon" aria-hidden="true"></i>
        <h3 class="empty-state-title">${escape(title)}</h3>
        <p class="empty-state-text">${escape(text)}</p>
        ${cta || ''}
      </div>`;
  }

  function escape(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function formatPrice(n) {
    const v = parseFloat(n) || 0;
    return new Intl.NumberFormat('es-AR', {
      style: 'currency', currency: 'ARS', minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(v);
  }

  function formatDate(d) {
    if (!d) return '';
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function formatDateTime(d) {
    if (!d) return '';
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  }

  function productImage(order) {
    const imgs = order.product_images;
    if (Array.isArray(imgs) && imgs.length > 0) return imgs[0];
    if (typeof imgs === 'string') return imgs;
    return '';
  }
})();
