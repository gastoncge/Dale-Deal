// =====================================================
// DALE DEAL - Panel de Admin (frontend)
// =====================================================
// Verifica permisos al cargar (haciendo GET /admin/stats),
// renderiza tabs de dashboard, usuarios, productos, órdenes y reseñas,
// y maneja las acciones administrativas.
// =====================================================

(function () {
  'use strict';

  let currentTab = 'dashboard';
  const state = {
    users:    { page: 1, search: '', role: '', status: '', loading: false },
    products: { page: 1, search: '', status: '', loading: false },
    orders:   { page: 1, status: '', payment_status: '', loading: false },
    reviews:  { page: 1, loading: false },
    reports:  { page: 1, status: '', category: '', loading: false },
    leads:    { page: 1, status: '', loading: false },
  };

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    if (!localStorage.getItem('daledeal_token')) {
      showDenied('No estás logueado. Iniciá sesión con una cuenta admin.');
      return;
    }

    const apiFetch = window.DaleDeal?.api?.apiFetch;
    if (!apiFetch) {
      showDenied('No se pudo conectar con el servidor.');
      return;
    }

    // Probar permisos hitting /admin/stats. Si rebota con 403/401, no es admin.
    try {
      const stats = await apiFetch('/admin/stats');
      revealAdmin();
      renderStats(stats);
    } catch (err) {
      const msg = err?.message || 'Acceso denegado';
      showDenied(msg.includes('admin') ? msg : 'No tenés permisos de admin.');
      return;
    }

    bindTabs();
    bindToolbars();
    document.getElementById('btn-refresh-stats')?.addEventListener('click', loadStats);
    // Cargar badge de reportes pendientes apenas entra al panel
    updateReportsBadge();
  }

  function revealAdmin() {
    document.getElementById('admin-loading').style.display = 'none';
    document.getElementById('admin-denied').style.display  = 'none';
    document.getElementById('admin-content').style.display = 'grid';
  }

  function showDenied(msg) {
    document.getElementById('admin-loading').style.display = 'none';
    document.getElementById('admin-content').style.display = 'none';
    const el = document.getElementById('admin-denied');
    el.style.display = 'flex';
    if (msg) el.querySelector('p').textContent = msg;
  }

  // ── Tabs ─────────────────────────────────────────────────────────────────
  function bindTabs() {
    document.querySelectorAll('.admin-nav-item[data-tab]').forEach(item => {
      item.addEventListener('click', e => {
        e.preventDefault();
        const tab = item.dataset.tab;
        switchTab(tab);
      });
    });
  }

  function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.admin-nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.tab === tab);
    });
    document.querySelectorAll('.admin-section').forEach(s => {
      s.classList.toggle('active', s.id === `section-${tab}`);
    });

    // Lazy-load on first switch
    switch (tab) {
      case 'users':    if (!state.users.loaded)    loadUsers();    break;
      case 'products': if (!state.products.loaded) loadProducts(); break;
      case 'orders':   if (!state.orders.loaded)   loadOrders();   break;
      case 'reviews':  if (!state.reviews.loaded)  loadReviews();  break;
      case 'reports':  if (!state.reports.loaded)  loadReports();  break;
      case 'leads':    if (!state.leads.loaded)    loadLeads();    break;
    }
  }

  // ── Toolbars ─────────────────────────────────────────────────────────────
  function bindToolbars() {
    let usersTimer;
    document.getElementById('users-search')?.addEventListener('input', e => {
      clearTimeout(usersTimer);
      usersTimer = setTimeout(() => {
        state.users.search = e.target.value;
        state.users.page = 1;
        loadUsers();
      }, 250);
    });
    document.getElementById('users-status')?.addEventListener('change', e => {
      state.users.status = e.target.value;
      state.users.page = 1;
      loadUsers();
    });
    document.getElementById('users-role')?.addEventListener('change', e => {
      state.users.role = e.target.value;
      state.users.page = 1;
      loadUsers();
    });

    let prodTimer;
    document.getElementById('products-search')?.addEventListener('input', e => {
      clearTimeout(prodTimer);
      prodTimer = setTimeout(() => {
        state.products.search = e.target.value;
        state.products.page = 1;
        loadProducts();
      }, 250);
    });
    document.getElementById('products-status')?.addEventListener('change', e => {
      state.products.status = e.target.value;
      state.products.page = 1;
      loadProducts();
    });

    document.getElementById('orders-status')?.addEventListener('change', e => {
      state.orders.status = e.target.value;
      state.orders.page = 1;
      loadOrders();
    });
    document.getElementById('orders-payment')?.addEventListener('change', e => {
      state.orders.payment_status = e.target.value;
      state.orders.page = 1;
      loadOrders();
    });

    document.getElementById('reports-status')?.addEventListener('change', e => {
      state.reports.status = e.target.value;
      state.reports.page = 1;
      loadReports();
    });
    document.getElementById('reports-category')?.addEventListener('change', e => {
      state.reports.category = e.target.value;
      state.reports.page = 1;
      loadReports();
    });

    document.getElementById('leads-status')?.addEventListener('change', e => {
      state.leads.status = e.target.value;
      state.leads.page = 1;
      loadLeads();
    });
  }

  // ── DASHBOARD ────────────────────────────────────────────────────────────
  async function loadStats() {
    document.getElementById('stats-loading').style.display = '';
    document.getElementById('stats-content').style.display = 'none';
    try {
      const stats = await window.DaleDeal.api.apiFetch('/admin/stats');
      renderStats(stats);
    } catch (err) {
      console.error('Error stats:', err);
    }
  }

  function renderStats(s) {
    document.getElementById('stats-loading').style.display = 'none';
    document.getElementById('stats-content').style.display = '';

    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    const fmt   = n => Number(n || 0).toLocaleString('es-AR');
    const money = n => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n || 0);

    set('stat-users',         fmt(s.users));
    set('stat-users-7d',      fmt(s.new_users_7d));
    set('stat-products',      fmt(s.products_active));
    set('stat-services',      fmt(s.services_active));
    set('stat-orders',        fmt(s.orders_total));
    set('stat-orders-7d',     fmt(s.new_orders_7d));
    set('stat-orders-paid',   fmt(s.orders_paid));
    set('stat-gmv',           money(s.gmv_ars));
    set('stat-commission',    money(s.commission_ars));
    set('stat-reviews',       fmt(s.reviews_total));
  }

  // ── USUARIOS ─────────────────────────────────────────────────────────────
  async function loadUsers() {
    state.users.loading = true;
    const params = new URLSearchParams({
      page: state.users.page,
      limit: 20,
      search: state.users.search,
      status: state.users.status,
      role: state.users.role,
    });
    try {
      const res = await window.DaleDeal.api.apiFetch(`/admin/users?${params}`);
      state.users.loaded = true;
      renderUsers(res);
    } catch (err) {
      document.getElementById('users-content').innerHTML = errorHTML(err);
    }
  }

  function renderUsers(res) {
    const c = document.getElementById('users-content');
    if (!res.data || res.data.length === 0) {
      c.innerHTML = emptyHTML('No hay usuarios para mostrar');
      return;
    }
    c.innerHTML = `
      <div style="overflow-x:auto;">
        <table class="admin-table">
          <thead>
            <tr>
              <th>ID</th><th>Nombre</th><th>Email</th><th>Rol</th><th>Estado</th>
              <th>Pubs</th><th>Compras</th><th>Alta</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${res.data.map(u => userRow(u)).join('')}
          </tbody>
        </table>
      </div>
      ${paginatorHTML('users', res)}
    `;
    bindUserActions();
    bindPagination('users', loadUsers);
  }

  function userRow(u) {
    const pubs = (u.product_count || 0) + (u.service_count || 0);
    const status = u.is_active
      ? '<span class="admin-pill admin-pill-success">Activo</span>'
      : '<span class="admin-pill admin-pill-danger">Suspendido</span>';
    const rolePill = u.role === 'admin'
      ? '<span class="admin-pill admin-pill-info">Admin</span>'
      : '<span class="admin-pill admin-pill-muted">Usuario</span>';
    return `
      <tr data-user-id="${u.id}">
        <td>#${u.id}</td>
        <td>${esc(u.name)}</td>
        <td>${esc(u.email)}</td>
        <td>${rolePill}</td>
        <td>${status}</td>
        <td>${pubs}</td>
        <td>${u.purchase_count || 0}</td>
        <td>${formatDate(u.created_at)}</td>
        <td>
          <div class="admin-actions">
            <button class="btn btn-sm btn-outline-${u.is_active ? 'danger' : 'success'}" data-action="toggle-active" data-id="${u.id}" data-active="${u.is_active}">
              <i class="bi bi-${u.is_active ? 'pause' : 'play'}-fill"></i>
              ${u.is_active ? 'Suspender' : 'Reactivar'}
            </button>
            ${u.role !== 'admin'
              ? `<button class="btn btn-sm btn-outline-primary" data-action="promote" data-id="${u.id}"><i class="bi bi-shield-check"></i> Hacer admin</button>`
              : `<button class="btn btn-sm btn-outline-secondary" data-action="demote" data-id="${u.id}"><i class="bi bi-shield-slash"></i> Quitar admin</button>`}
          </div>
        </td>
      </tr>
    `;
  }

  function bindUserActions() {
    document.querySelectorAll('#users-content [data-action]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const action = btn.dataset.action;
        let payload = null;
        let confirmMsg = '';

        if (action === 'toggle-active') {
          const wasActive = btn.dataset.active === 'true';
          payload = { is_active: !wasActive };
          confirmMsg = wasActive ? '¿Suspender este usuario?' : '¿Reactivar este usuario?';
        } else if (action === 'promote') {
          payload = { role: 'admin' };
          confirmMsg = '¿Promover a admin? Tendrá acceso total al panel.';
        } else if (action === 'demote') {
          payload = { role: 'user' };
          confirmMsg = '¿Quitarle el rol admin?';
        }

        if (!confirm(confirmMsg)) return;
        try {
          await window.DaleDeal.api.apiFetch(`/admin/users/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
          });
          loadUsers();
        } catch (err) {
          alert('Error: ' + (err.message || 'no se pudo actualizar'));
        }
      });
    });
  }

  // ── PRODUCTOS ────────────────────────────────────────────────────────────
  async function loadProducts() {
    const params = new URLSearchParams({
      page: state.products.page,
      limit: 20,
      search: state.products.search,
      status: state.products.status,
    });
    try {
      const res = await window.DaleDeal.api.apiFetch(`/admin/products?${params}`);
      state.products.loaded = true;
      renderProducts(res);
    } catch (err) {
      document.getElementById('products-content').innerHTML = errorHTML(err);
    }
  }

  function renderProducts(res) {
    const c = document.getElementById('products-content');
    if (!res.data || res.data.length === 0) {
      c.innerHTML = emptyHTML('No hay productos para mostrar');
      return;
    }
    c.innerHTML = `
      <div style="overflow-x:auto;">
        <table class="admin-table">
          <thead>
            <tr>
              <th>ID</th><th>Imagen</th><th>Título</th><th>Precio</th>
              <th>Stock</th><th>Estado</th><th>Vendedor</th><th>Creado</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${res.data.map(p => productRow(p)).join('')}
          </tbody>
        </table>
      </div>
      ${paginatorHTML('products', res)}
    `;
    bindProductActions();
    bindPagination('products', loadProducts);
  }

  function productRow(p) {
    const img = (p.images && p.images[0]) || '';
    const statusClass = {
      active:   'admin-pill-success',
      paused:   'admin-pill-warning',
      sold:     'admin-pill-info',
      deleted:  'admin-pill-danger',
    }[p.status] || 'admin-pill-muted';

    return `
      <tr>
        <td>#${p.id}</td>
        <td>${img ? `<img src="${esc(img)}" alt="" loading="lazy" decoding="async" style="width:48px;height:48px;object-fit:cover;border-radius:6px;">` : '—'}</td>
        <td><a href="./producto.html?id=${p.id}" target="_blank" style="color:inherit;text-decoration:none;font-weight:500;">${esc(p.title)}</a></td>
        <td>${money(p.price, p.currency)}</td>
        <td>${p.stock || 0}</td>
        <td><span class="admin-pill ${statusClass}">${p.status}</span></td>
        <td>${esc(p.seller_name || '—')}</td>
        <td>${formatDate(p.created_at)}</td>
        <td>
          <div class="admin-actions">
            ${p.status !== 'deleted'
              ? `<button class="btn btn-sm btn-outline-warning" data-action="pause" data-id="${p.id}"><i class="bi bi-pause-fill"></i> Pausar</button>
                 <button class="btn btn-sm btn-outline-danger" data-action="delete" data-id="${p.id}"><i class="bi bi-trash"></i> Eliminar</button>`
              : `<button class="btn btn-sm btn-outline-success" data-action="restore" data-id="${p.id}"><i class="bi bi-arrow-counterclockwise"></i> Restaurar</button>`}
          </div>
        </td>
      </tr>
    `;
  }

  function bindProductActions() {
    document.querySelectorAll('#products-content [data-action]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const action = btn.dataset.action;
        const map = { pause: 'paused', delete: 'deleted', restore: 'active' };
        const newStatus = map[action];
        const confirmMsg = action === 'delete'
          ? '¿Eliminar este producto? Quedará oculto del catálogo (no se borra físicamente).'
          : action === 'pause'
          ? '¿Pausar este producto?'
          : '¿Restaurar este producto?';
        if (!confirm(confirmMsg)) return;
        try {
          await window.DaleDeal.api.apiFetch(`/admin/products/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: newStatus }),
          });
          loadProducts();
        } catch (err) {
          alert('Error: ' + (err.message || 'no se pudo actualizar'));
        }
      });
    });
  }

  // ── ÓRDENES ──────────────────────────────────────────────────────────────
  async function loadOrders() {
    const params = new URLSearchParams({
      page: state.orders.page,
      limit: 20,
      status: state.orders.status,
      payment_status: state.orders.payment_status,
    });
    try {
      const res = await window.DaleDeal.api.apiFetch(`/admin/orders?${params}`);
      state.orders.loaded = true;
      renderOrders(res);
    } catch (err) {
      document.getElementById('orders-content').innerHTML = errorHTML(err);
    }
  }

  function renderOrders(res) {
    const c = document.getElementById('orders-content');
    if (!res.data || res.data.length === 0) {
      c.innerHTML = emptyHTML('No hay órdenes para mostrar');
      return;
    }
    c.innerHTML = `
      <div style="overflow-x:auto;">
        <table class="admin-table">
          <thead>
            <tr>
              <th>ID</th><th>Producto</th><th>Comprador</th><th>Vendedor</th>
              <th>Total</th><th>Comisión</th><th>Pago</th><th>Estado</th>
              <th>Envío</th><th>Fecha</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${res.data.map(o => orderRow(o)).join('')}
          </tbody>
        </table>
      </div>
      ${paginatorHTML('orders', res)}
    `;
    bindPagination('orders', loadOrders);
    bindOrderActions();
  }

  function orderRow(o) {
    const payClass = {
      paid:      'admin-pill-success',
      pending:   'admin-pill-warning',
      rejected:  'admin-pill-danger',
      refunded:  'admin-pill-info',
    }[o.payment_status] || 'admin-pill-muted';
    const stClass = {
      delivered:  'admin-pill-success',
      shipped:    'admin-pill-info',
      confirmed:  'admin-pill-info',
      pending:    'admin-pill-warning',
      cancelled:  'admin-pill-danger',
    }[o.status] || 'admin-pill-muted';

    // Solo se pueden reembolsar órdenes pagadas
    const canRefund = o.payment_status === 'paid';
    const actionsHTML = canRefund
      ? `<button class="btn btn-sm btn-outline-danger refund-btn"
                 data-order-id="${o.id}"
                 data-total="${o.total_price}"
                 data-currency="${o.currency || 'ARS'}"
                 data-product="${esc(o.product_title || '—')}"
                 data-buyer="${esc(o.buyer_email || '')}">
           <i class="bi bi-arrow-counterclockwise"></i> Reembolsar
         </button>`
      : `<small class="text-muted">—</small>`;

    return `
      <tr>
        <td>#${o.id}</td>
        <td>${esc(o.product_title || '—')}</td>
        <td><small>${esc(o.buyer_name || '')}</small><br><small class="text-muted">${esc(o.buyer_email || '')}</small></td>
        <td><small>${esc(o.seller_name || '')}</small><br><small class="text-muted">${esc(o.seller_email || '')}</small></td>
        <td>${money(o.total_price, o.currency)}</td>
        <td>${money(o.commission_amount, o.currency)}</td>
        <td><span class="admin-pill ${payClass}">${o.payment_status || '—'}</span></td>
        <td><span class="admin-pill ${stClass}">${o.status}</span></td>
        <td>${o.shipping_method ? `<small>${o.shipping_method}</small>` : '—'}</td>
        <td>${formatDate(o.created_at)}</td>
        <td>${actionsHTML}</td>
      </tr>
    `;
  }

  // Bindea click en botones "Reembolsar" → abre modal Bootstrap → POST
  // Antes usaba prompt() + confirm() nativos (UX feo). Ahora un modal con
  // form: motivo + checkbox de confirmación + warning rojo claro.
  function bindOrderActions() {
    document.querySelectorAll('.refund-btn').forEach(btn => {
      btn.addEventListener('click', () => openRefundModal(btn));
    });
  }

  let refundModalInstance = null;
  function openRefundModal(btn) {
    const orderId  = btn.dataset.orderId;
    const total    = parseFloat(btn.dataset.total);
    const currency = btn.dataset.currency;
    const product  = btn.dataset.product;
    const buyer    = btn.dataset.buyer;
    const totalFmt = money(total, currency);

    // Crea el modal si no existe (singleton — un modal reutilizado entre clicks)
    let modal = document.getElementById('refundModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'refundModal';
      modal.className = 'modal fade';
      modal.tabIndex = -1;
      modal.setAttribute('aria-labelledby', 'refundModalLabel');
      modal.setAttribute('aria-hidden', 'true');
      modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="refundModalLabel">
                <i class="bi bi-arrow-counterclockwise text-danger me-2"></i>Reembolsar orden
              </h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Cerrar"></button>
            </div>
            <div class="modal-body">
              <div class="alert alert-danger d-flex align-items-start gap-2" role="alert">
                <i class="bi bi-exclamation-triangle-fill" style="font-size:20px;"></i>
                <div>
                  <strong>Acción irreversible.</strong>
                  Vas a reembolsar <strong id="refundAmount">—</strong> en la orden
                  <strong id="refundOrderId">#—</strong> al comprador.
                  El dinero se acredita en 1-5 días hábiles.
                </div>
              </div>
              <dl class="row small mb-3">
                <dt class="col-sm-4 text-muted">Producto:</dt><dd class="col-sm-8" id="refundProduct">—</dd>
                <dt class="col-sm-4 text-muted">Comprador:</dt><dd class="col-sm-8" id="refundBuyer">—</dd>
              </dl>
              <div class="mb-3">
                <label for="refundReason" class="form-label">Motivo del reembolso <small class="text-muted">(opcional)</small></label>
                <textarea id="refundReason" class="form-control" rows="3" maxlength="500"
                          placeholder="Ej: Pedido del comprador, producto defectuoso, error en el envío…"></textarea>
                <small class="text-muted">Se incluye en el email al comprador (visible para él) y queda en logs.</small>
              </div>
              <div class="form-check">
                <input class="form-check-input" type="checkbox" id="refundConfirmCheck">
                <label class="form-check-label" for="refundConfirmCheck">
                  Confirmo que entiendo que esta acción <strong>no se puede deshacer</strong>.
                </label>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="button" class="btn btn-danger" id="refundConfirmBtn" disabled>
                <i class="bi bi-arrow-counterclockwise me-1"></i>Reembolsar
              </button>
            </div>
          </div>
        </div>`;
      document.body.appendChild(modal);

      // Habilitar el botón solo cuando se chequea el checkbox
      modal.querySelector('#refundConfirmCheck').addEventListener('change', e => {
        modal.querySelector('#refundConfirmBtn').disabled = !e.target.checked;
      });
    }

    // Rellenar datos del request actual
    modal.querySelector('#refundAmount').textContent  = totalFmt;
    modal.querySelector('#refundOrderId').textContent = '#' + orderId;
    modal.querySelector('#refundProduct').textContent = product;
    modal.querySelector('#refundBuyer').textContent   = buyer;
    modal.querySelector('#refundReason').value        = '';
    modal.querySelector('#refundConfirmCheck').checked = false;
    modal.querySelector('#refundConfirmBtn').disabled = true;

    // Re-bind del confirm (puede ser nuevo orderId cada vez)
    const confirmBtn = modal.querySelector('#refundConfirmBtn');
    const newConfirmBtn = confirmBtn.cloneNode(true);
    newConfirmBtn.disabled = true;
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

    // El listener del checkbox se rompe al clonar — rebind también
    modal.querySelector('#refundConfirmCheck').addEventListener('change', e => {
      newConfirmBtn.disabled = !e.target.checked;
    });

    newConfirmBtn.addEventListener('click', async () => {
      const reason = modal.querySelector('#refundReason').value.trim();
      const originalHTML = newConfirmBtn.innerHTML;
      newConfirmBtn.disabled = true;
      newConfirmBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Procesando…';

      try {
        const res = await window.DaleDeal.api.apiFetch(`/admin/orders/${orderId}/refund`, {
          method: 'POST',
          body: JSON.stringify({ reason: reason || undefined }),
          headers: { 'Content-Type': 'application/json' },
        });
        refundModalInstance.hide();
        // Toast simple después de cerrar el modal (alert sigue siendo bloqueante
        // pero es informativo, no destructivo)
        setTimeout(() => {
          alert(`✅ Reembolso procesado correctamente.\n\nMP refund id: ${res.refund_id || '—'}\nEl dinero se acreditará al comprador en 1-5 días hábiles. Le mandamos un email.`);
        }, 300);
        loadOrders();
      } catch (err) {
        console.error('[refund] error:', err);
        newConfirmBtn.disabled = false;
        newConfirmBtn.innerHTML = originalHTML;
        const errAlert = modal.querySelector('.modal-body').querySelector('.alert-error-runtime');
        if (errAlert) errAlert.remove();
        const e = document.createElement('div');
        e.className = 'alert alert-danger alert-error-runtime mt-3 mb-0';
        e.textContent = '❌ ' + (err.message || err.details || 'No se pudo procesar el reembolso. Revisá los logs.');
        modal.querySelector('.modal-body').appendChild(e);
      }
    });

    // Abrir el modal con Bootstrap
    refundModalInstance = bootstrap.Modal.getOrCreateInstance(modal);
    refundModalInstance.show();
  }

  // ── RESEÑAS ──────────────────────────────────────────────────────────────
  async function loadReviews() {
    const params = new URLSearchParams({ page: state.reviews.page, limit: 20 });
    try {
      const res = await window.DaleDeal.api.apiFetch(`/admin/reviews?${params}`);
      state.reviews.loaded = true;
      renderReviews(res);
    } catch (err) {
      document.getElementById('reviews-content').innerHTML = errorHTML(err);
    }
  }

  function renderReviews(res) {
    const c = document.getElementById('reviews-content');
    if (!res.data || res.data.length === 0) {
      c.innerHTML = emptyHTML('No hay reseñas para mostrar');
      return;
    }
    c.innerHTML = `
      <div style="overflow-x:auto;">
        <table class="admin-table">
          <thead>
            <tr>
              <th>ID</th><th>Rating</th><th>Reseña</th><th>Producto/Servicio</th>
              <th>Autor</th><th>Fecha</th><th></th>
            </tr>
          </thead>
          <tbody>
            ${res.data.map(r => reviewRow(r)).join('')}
          </tbody>
        </table>
      </div>
      ${paginatorHTML('reviews', res)}
    `;
    document.querySelectorAll('#reviews-content [data-action="delete-review"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('¿Eliminar esta reseña? Esta acción es irreversible.')) return;
        try {
          await window.DaleDeal.api.apiFetch(`/admin/reviews/${btn.dataset.id}`, { method: 'DELETE' });
          loadReviews();
        } catch (err) {
          alert('Error: ' + (err.message || 'no se pudo eliminar'));
        }
      });
    });
    bindPagination('reviews', loadReviews);
  }

  function reviewRow(r) {
    const stars = '★'.repeat(r.rating) + '☆'.repeat(5 - r.rating);
    return `
      <tr>
        <td>#${r.id}</td>
        <td style="color:#fbbf24;font-size:1rem;">${stars}</td>
        <td>
          ${r.title ? `<strong>${esc(r.title)}</strong><br>` : ''}
          <small>${esc((r.body || '').substring(0, 200))}</small>
        </td>
        <td><small>${esc(r.item_title || '—')} <span class="text-muted">(${r.item_type})</span></small></td>
        <td><small>${esc(r.reviewer_name || '')}</small></td>
        <td>${formatDate(r.created_at)}</td>
        <td>
          <button class="btn btn-sm btn-outline-danger" data-action="delete-review" data-id="${r.id}">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `;
  }

  // ── REPORTES DE PROBLEMAS ────────────────────────────────────────────────
  async function loadReports() {
    const params = new URLSearchParams({
      page: state.reports.page,
      limit: 20,
      status: state.reports.status,
      category: state.reports.category,
    });
    try {
      const res = await window.DaleDeal.api.apiFetch(`/admin/reports?${params}`);
      state.reports.loaded = true;
      renderReports(res);
      // Actualizar badge en el sidebar con cantidad de reportes abiertos
      updateReportsBadge();
    } catch (err) {
      document.getElementById('reports-content').innerHTML = errorHTML(err);
    }
  }

  async function updateReportsBadge() {
    try {
      const res = await window.DaleDeal.api.apiFetch('/admin/reports?status=open&limit=1');
      const badge = document.getElementById('reports-badge');
      if (badge) {
        if (res.total > 0) {
          badge.textContent = res.total > 99 ? '99+' : res.total;
          badge.style.display = '';
        } else {
          badge.style.display = 'none';
        }
      }
    } catch (_) { /* silencioso */ }
  }

  function renderReports(res) {
    const c = document.getElementById('reports-content');
    if (!res.data || res.data.length === 0) {
      c.innerHTML = emptyHTML('No hay reportes para mostrar');
      return;
    }
    c.innerHTML = `
      <div style="overflow-x:auto;">
        <table class="admin-table">
          <thead>
            <tr>
              <th>ID</th><th>Categoría</th><th>Reporte</th><th>Reportador</th>
              <th>Estado</th><th>Fecha</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${res.data.map(r => reportRow(r)).join('')}
          </tbody>
        </table>
      </div>
      ${paginatorHTML('reports', res)}
    `;
    bindReportActions();
    bindPagination('reports', loadReports);
  }

  function reportRow(r) {
    const stClass = {
      open:       'admin-pill-warning',
      in_review:  'admin-pill-info',
      resolved:   'admin-pill-success',
      dismissed:  'admin-pill-muted',
    }[r.status] || 'admin-pill-muted';
    const stLabel = {
      open: 'Abierto', in_review: 'En revisión',
      resolved: 'Resuelto', dismissed: 'Descartado',
    }[r.status] || r.status;
    const catLabel = {
      technical: 'Técnico', payment: 'Pago', content: 'Contenido',
      fraud: 'Fraude', account: 'Cuenta', shipping: 'Envío', other: 'Otro',
    }[r.category] || r.category;

    const reporter = r.user_name
      ? `<small><strong>${esc(r.user_name)}</strong><br><span class="text-muted">${esc(r.reporter_email || '')}</span></small>`
      : `<small class="text-muted">${esc(r.reporter_email || 'Anónimo')}</small>`;

    return `
      <tr>
        <td>#${r.id}</td>
        <td><span class="admin-pill admin-pill-info">${catLabel}</span></td>
        <td style="max-width:380px;">
          ${r.subject ? `<strong>${esc(r.subject)}</strong><br>` : ''}
          <small>${esc((r.body || '').substring(0, 200))}${r.body && r.body.length > 200 ? '…' : ''}</small>
          ${r.url ? `<br><small class="text-muted"><i class="bi bi-link-45deg"></i> <a href="${esc(r.url)}" target="_blank" style="color:inherit;">${esc(r.url.substring(0, 60))}</a></small>` : ''}
        </td>
        <td>${reporter}</td>
        <td><span class="admin-pill ${stClass}">${stLabel}</span></td>
        <td>${formatDate(r.created_at)}</td>
        <td>
          <div class="admin-actions">
            ${r.status === 'open' ? `<button class="btn btn-sm btn-outline-info" data-action="report-status" data-id="${r.id}" data-status="in_review"><i class="bi bi-eye"></i> En revisión</button>` : ''}
            ${r.status !== 'resolved' ? `<button class="btn btn-sm btn-outline-success" data-action="report-status" data-id="${r.id}" data-status="resolved"><i class="bi bi-check-lg"></i> Resolver</button>` : ''}
            ${r.status !== 'dismissed' && r.status !== 'resolved' ? `<button class="btn btn-sm btn-outline-secondary" data-action="report-status" data-id="${r.id}" data-status="dismissed"><i class="bi bi-x-lg"></i> Descartar</button>` : ''}
          </div>
        </td>
      </tr>
    `;
  }

  function bindReportActions() {
    document.querySelectorAll('#reports-content [data-action="report-status"]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        const newStatus = btn.dataset.status;
        try {
          await window.DaleDeal.api.apiFetch(`/admin/reports/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: newStatus }),
          });
          loadReports();
        } catch (err) {
          alert('Error: ' + (err.message || 'no se pudo actualizar'));
        }
      });
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────
  function paginatorHTML(scope, res) {
    if (!res.totalPages || res.totalPages <= 1) return '';
    return `
      <div class="d-flex justify-content-between align-items-center mt-3">
        <small class="text-muted">${res.total} resultados · Página ${res.page} de ${res.totalPages}</small>
        <div class="btn-group btn-group-sm">
          <button class="btn btn-outline-secondary" data-page="prev" data-scope="${scope}" ${res.page === 1 ? 'disabled' : ''}>
            <i class="bi bi-chevron-left"></i>
          </button>
          <button class="btn btn-outline-secondary" data-page="next" data-scope="${scope}" ${res.page >= res.totalPages ? 'disabled' : ''}>
            <i class="bi bi-chevron-right"></i>
          </button>
        </div>
      </div>
    `;
  }

  function bindPagination(scope, loader) {
    document.querySelectorAll(`[data-scope="${scope}"]`).forEach(btn => {
      btn.addEventListener('click', () => {
        const dir = btn.dataset.page;
        if (dir === 'prev' && state[scope].page > 1) state[scope].page--;
        if (dir === 'next') state[scope].page++;
        loader();
      });
    });
  }

  // ── LEADS B2B ────────────────────────────────────────────────────────────
  // GET /admin/leads — leads que vienen del form de contacto con tipo=empresa.
  // Requiere migration 010 corrida (sino el endpoint devuelve 503 con un
  // mensaje claro y mostramos un "instructions card" al admin).
  async function loadLeads() {
    const c = document.getElementById('leads-content');
    if (!c) return;
    const params = new URLSearchParams({ page: state.leads.page, limit: 20 });
    if (state.leads.status) params.set('status', state.leads.status);
    try {
      const res = await window.DaleDeal.api.apiFetch(`/admin/leads?${params}`);
      state.leads.loaded = true;
      renderLeads(res);
    } catch (err) {
      // 503 cuando la tabla no existe → mostrar instrucciones de migration
      if (err?.message?.includes('migration')) {
        c.innerHTML = `
          <div class="admin-empty">
            <i class="bi bi-database-exclamation text-warning" style="font-size:48px;"></i>
            <p class="mt-3 fw-bold">Falta correr migration 010</p>
            <p class="text-muted">La tabla <code>company_leads</code> todavía no existe en la DB.
              Correr <code>db/migrations/010_company_leads.sql</code> desde Railway dashboard.</p>
          </div>`;
      } else {
        c.innerHTML = errorHTML(err);
      }
    }
  }

  function renderLeads(res) {
    const c = document.getElementById('leads-content');
    if (!res.data || res.data.length === 0) {
      c.innerHTML = emptyHTML('No hay leads B2B todavía. Cuando alguien escriba desde el form de contacto con "Soy una empresa", aparecen acá.');
      return;
    }
    c.innerHTML = `
      <div style="overflow-x:auto;">
        <table class="admin-table">
          <thead>
            <tr>
              <th>ID</th><th>Nombre</th><th>Email</th><th>Tel</th>
              <th>Asunto</th><th>Mensaje</th><th>Status</th><th>Fecha</th><th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            ${res.data.map(l => leadRow(l)).join('')}
          </tbody>
        </table>
      </div>
      ${paginatorHTML('leads', res)}
    `;
    bindPagination('leads', loadLeads);
    bindLeadActions();
  }

  function leadRow(l) {
    const stClass = {
      new:        'admin-pill-warning',
      contacted:  'admin-pill-info',
      qualified:  'admin-pill-info',
      customer:   'admin-pill-success',
      lost:       'admin-pill-muted',
    }[l.status] || 'admin-pill-muted';

    const stLabel = {
      new: 'Nuevo', contacted: 'Contactado', qualified: 'Calificado',
      customer: 'Cliente', lost: 'Perdido',
    }[l.status] || l.status;

    const mensajeCorto = l.mensaje
      ? esc(l.mensaje.length > 80 ? l.mensaje.slice(0, 80) + '…' : l.mensaje)
      : '—';

    return `
      <tr>
        <td>#${l.id}</td>
        <td><strong>${esc(l.nombre)} ${esc(l.apellido)}</strong></td>
        <td><a href="mailto:${esc(l.email)}">${esc(l.email)}</a></td>
        <td><small>${esc(l.telefono || '—')}</small></td>
        <td><small>${esc(l.asunto || '—')}</small></td>
        <td><small title="${esc(l.mensaje || '')}">${mensajeCorto}</small></td>
        <td><span class="admin-pill ${stClass}">${stLabel}</span></td>
        <td>${formatDate(l.created_at)}</td>
        <td>
          <select class="form-select form-select-sm lead-status-select"
                  data-lead-id="${l.id}" style="width:auto;display:inline-block;">
            <option value="" disabled selected>Cambiar…</option>
            <option value="new">Nuevo</option>
            <option value="contacted">Contactado</option>
            <option value="qualified">Calificado</option>
            <option value="customer">Cliente</option>
            <option value="lost">Perdido</option>
          </select>
        </td>
      </tr>
    `;
  }

  function bindLeadActions() {
    document.querySelectorAll('.lead-status-select').forEach(sel => {
      sel.addEventListener('change', async () => {
        const leadId = sel.dataset.leadId;
        const newStatus = sel.value;
        if (!newStatus) return;
        try {
          await window.DaleDeal.api.apiFetch(`/admin/leads/${leadId}`, {
            method: 'PATCH',
            body: JSON.stringify({ status: newStatus }),
            headers: { 'Content-Type': 'application/json' },
          });
          loadLeads(); // refresca
        } catch (err) {
          alert('No se pudo actualizar el lead: ' + (err.message || err));
          sel.value = ''; // reset
        }
      });
    });
  }

  function emptyHTML(msg) {
    return `<div class="admin-empty"><i class="bi bi-inbox"></i><p class="mt-3">${msg}</p></div>`;
  }
  function errorHTML(err) {
    return `<div class="admin-empty"><i class="bi bi-exclamation-triangle text-warning"></i><p class="mt-3">${esc(err?.message || 'Error al cargar')}</p></div>`;
  }
  function esc(s) {
    if (s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
  }
  function money(n, currency = 'ARS') {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency, minimumFractionDigits: 0 }).format(parseFloat(n) || 0);
  }
})();
