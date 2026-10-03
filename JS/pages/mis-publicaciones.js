/**
 * Mis publicaciones — el vendedor ve y administra lo que publicó:
 * pausar / reactivar, editar título, precio y stock, y eliminar.
 *
 * API: GET /users/me/products y /users/me/services (filas crudas del backend),
 *      PUT y DELETE /products/:id y /services/:id.
 */
(function () {
  'use strict';

  const STATUS = {
    active: { label: 'Activa',    cls: 'status-active' },
    paused: { label: 'Pausada',   cls: 'status-paused' },
    sold:   { label: 'Sin stock', cls: 'status-sold' },
  };

  let items = [];      // filas de producto/servicio + kind ('product' | 'service')
  let filter = 'all';
  let editing = null;  // item abierto en el modal
  let editModal = null;

  const $ = (id) => document.getElementById(id);
  const apiFetch = (path, opts) => window.DaleDeal.api.apiFetch(path, opts);
  // El texto viene escapado de la API: decodeEntities para inputs, escape para innerHTML.
  const decode = (v) => window.DaleDeal.utils.decodeEntities(v);
  const escape = (v) => window.DaleDeal.utils.escapeHtml(String(v ?? ''));
  const notify = (msg, type) => window.DaleDeal.utils.showNotification(msg, type);
  const endpoint = (it) => `/${it.kind === 'product' ? 'products' : 'services'}/${it.id}`;
  const keyOf = (it) => `${it.kind}-${it.id}`;

  document.addEventListener('DOMContentLoaded', async () => {
    if (!localStorage.getItem('daledeal_token')) {
      window.location.href = './login.html?redirect=%2Fmis-publicaciones';
      return;
    }

    editModal = new bootstrap.Modal($('editModal'));
    $('pub-list').addEventListener('click', onListClick);
    $('pub-filters').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-filter]');
      if (btn) setFilter(btn.dataset.filter);
    });
    $('pub-retry').addEventListener('click', load);
    $('edit-form').addEventListener('submit', saveEdit);

    await load();
  });

  function show(state) {
    $('pub-loading').style.display = state === 'loading' ? '' : 'none';
    $('pub-empty').style.display   = state === 'empty'   ? '' : 'none';
    $('pub-error').style.display   = state === 'error'   ? '' : 'none';
    $('pub-list').style.display    = state === 'list'    ? '' : 'none';
    $('pub-filters').hidden        = state !== 'list';
  }

  async function load() {
    show('loading');
    try {
      const [products, services] = await Promise.all([
        apiFetch('/users/me/products'),
        apiFetch('/users/me/services'),
      ]);
      items = [
        ...(Array.isArray(products) ? products : []).map(p => ({ ...p, kind: 'product' })),
        ...(Array.isArray(services) ? services : []).map(s => ({ ...s, kind: 'service' })),
      ]
        .filter(it => it.status !== 'deleted')
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      render();
    } catch (err) {
      $('pub-error-msg').textContent = err.message || '';
      show('error');
    }
  }

  function setFilter(next) {
    filter = next;
    document.querySelectorAll('#pub-filters [data-filter]').forEach(btn => {
      const on = btn.dataset.filter === filter;
      btn.classList.toggle('btn-primary', on);
      btn.classList.toggle('btn-outline-secondary', !on);
    });
    render();
  }

  function render() {
    if (items.length === 0) { show('empty'); return; }

    const count = (s) => items.filter(it => s === 'all' || it.status === s).length;
    document.querySelectorAll('#pub-filters [data-count]').forEach(el => {
      el.textContent = `(${count(el.dataset.count)})`;
    });

    const visible = items.filter(it => filter === 'all' || it.status === filter);
    $('pub-list').innerHTML = visible.length
      ? visible.map(card).join('')
      : '<div class="empty-state"><p class="mb-0">No tenés publicaciones en este estado.</p></div>';
    show('list');
  }

  // Solo http(s) o rutas del sitio: lo que venga raro no se usa como src.
  function imageOf(it) {
    const first = Array.isArray(it.images) ? it.images[0] : null;
    return typeof first === 'string' && /^(https?:\/\/|\/)/i.test(first) ? first : '';
  }

  function priceOf(it) {
    const fmt = window.DaleDeal.utils.formatPrice;
    if (it.kind === 'product') return fmt(parseFloat(it.price) || 0);
    const from = parseFloat(it.price_from);
    return Number.isFinite(from) && from > 0 ? `Desde ${fmt(from)}` : 'A convenir';
  }

  function card(it) {
    const status = STATUS[it.status] || { label: it.status, cls: 'status-sold' };
    const isProduct = it.kind === 'product';
    const date = it.created_at
      ? new Date(it.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
      : '';
    const facts = [
      priceOf(it),
      isProduct ? `Stock: ${parseInt(it.stock, 10) || 0}` : null,
      `${parseInt(it.views, 10) || 0} visitas`,
    ].filter(Boolean).map(escape).join(' · ');
    const img = imageOf(it);
    const url = `/${isProduct ? 'producto' : 'servicio'}?id=${encodeURIComponent(it.id)}`;
    // Un producto sin stock se reactiva cargándole stock (se abre el editor).
    const canActivate = it.status === 'paused' || it.status === 'sold';

    return `
      <article class="pub-card" data-key="${escape(keyOf(it))}">
        <div class="pub-row">
          ${img
            ? `<img class="pub-img" src="${escape(img)}" alt="" loading="lazy" decoding="async" onerror="this.style.visibility='hidden'" />`
            : '<div class="pub-img" aria-hidden="true"></div>'}
          <div class="pub-meta">
            <div class="pub-kind">${isProduct ? 'Producto' : 'Servicio'}${date ? ` · Publicada el ${escape(date)}` : ''}</div>
            <p class="pub-title">${escape(it.title)}</p>
            <div class="pub-facts">${facts}</div>
          </div>
          <span class="badge-status ${status.cls}">${escape(status.label)}</span>
        </div>
        <div class="pub-actions">
          <a class="btn btn-outline-secondary btn-sm" href="${url}"><i class="bi bi-eye me-1" aria-hidden="true"></i>Ver</a>
          <button type="button" class="btn btn-outline-secondary btn-sm" data-action="edit"><i class="bi bi-pencil me-1" aria-hidden="true"></i>Editar</button>
          ${it.status === 'active'
            ? '<button type="button" class="btn btn-outline-secondary btn-sm" data-action="pause"><i class="bi bi-pause-circle me-1" aria-hidden="true"></i>Pausar</button>'
            : ''}
          ${canActivate
            ? '<button type="button" class="btn btn-outline-success btn-sm" data-action="activate"><i class="bi bi-play-circle me-1" aria-hidden="true"></i>Reactivar</button>'
            : ''}
          <button type="button" class="btn btn-outline-danger btn-sm" data-action="delete"><i class="bi bi-trash me-1" aria-hidden="true"></i>Eliminar</button>
          <button type="button" class="btn btn-outline-warning btn-sm" disabled title="Muy pronto vas a poder darle publicidad a tu publicación para aparecer más arriba"><i class="bi bi-megaphone me-1" aria-hidden="true"></i>Promocionar · Próximamente</button>
        </div>
      </article>`;
  }

  // ── Acciones ────────────────────────────────────────────────────────────
  function onListClick(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const key = btn.closest('[data-key]')?.dataset.key;
    const it = items.find(x => keyOf(x) === key);
    if (!it) return;

    if (btn.dataset.action === 'edit')     return openEdit(it);
    if (btn.dataset.action === 'pause')    return setStatus(it, 'paused', btn);
    if (btn.dataset.action === 'activate') return activate(it, btn);
    if (btn.dataset.action === 'delete')   return remove(it, btn);
  }

  function activate(it, btn) {
    if (it.kind === 'product' && (parseInt(it.stock, 10) || 0) === 0) {
      openEdit(it, 'Cargá el stock disponible para volver a publicarlo.');
      return;
    }
    return setStatus(it, 'active', btn);
  }

  async function setStatus(it, status, btn) {
    btn.disabled = true;
    try {
      const updated = await apiFetch(endpoint(it), { method: 'PUT', body: JSON.stringify({ status }) });
      Object.assign(it, updated || { status });
      render();
      notify(status === 'paused' ? 'Publicación pausada: ya no se ve en el catálogo.' : 'Publicación reactivada.', 'success');
    } catch (err) {
      btn.disabled = false;
      notify(err.message || 'No pudimos cambiar el estado.', 'error');
    }
  }

  async function remove(it, btn) {
    if (!window.confirm(`¿Eliminás "${decode(it.title)}"?\n\nDeja de verse en el sitio. Las ventas que ya tuviste no se pierden.`)) return;
    btn.disabled = true;
    try {
      await apiFetch(endpoint(it), { method: 'DELETE' });
      items = items.filter(x => x !== it);
      render();
      notify('Publicación eliminada.', 'success');
    } catch (err) {
      btn.disabled = false;
      notify(err.message || 'No pudimos eliminar la publicación.', 'error');
    }
  }

  // ── Editar ──────────────────────────────────────────────────────────────
  // La descripción se guarda como HTML del editor de Publicar (un <p> por
  // renglón). Acá se edita en un campo de texto simple: se muestra sin
  // etiquetas y, solo si el vendedor la cambia, se vuelve a guardar con el
  // mismo formato de párrafos. Si no la toca no se manda, así no pierde las
  // negritas ni las listas que haya puesto al publicar.
  let editDescOriginal = '';

  function descToText(html) {
    if (!/<[a-z/!]/i.test(html)) return html.trim();
    // Documento inerte: no ejecuta scripts ni carga imágenes.
    const doc = new DOMParser().parseFromString(
      html.replace(/<br\s*\/?>/gi, '\n').replace(/<li[^>]*>/gi, '• ').replace(/<\/(p|div|li|h[1-6]|blockquote)>/gi, '$&\n'),
      'text/html');
    return (doc.body.textContent || '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  }

  function textToDesc(text) {
    if (!text) return '';
    return text.split('\n').map((line) => `<p>${line.trim() ? escape(line.trim()) : '<br>'}</p>`).join('');
  }

  function openEdit(it, hint) {
    editing = it;
    const isProduct = it.kind === 'product';
    $('edit-title').value = decode(it.title);
    $('edit-price').value = parseFloat(isProduct ? it.price : it.price_from) || '';
    $('edit-price-label').textContent = isProduct ? 'Precio' : 'Precio desde';
    $('edit-stock-group').hidden = !isProduct;
    $('edit-stock').value = isProduct ? (parseInt(it.stock, 10) || 0) : '';
    $('edit-features-group').hidden = isProduct;
    $('edit-warranty').checked = !isProduct && !!it.has_warranty;
    $('edit-247').checked = !isProduct && !!it.available_24_7;
    editDescOriginal = descToText(decode(it.description || ''));
    $('edit-description').value = editDescOriginal;
    const badges = Array.isArray(it.badges) ? it.badges : [];
    [1, 2].forEach((n) => {
      const b = badges[n - 1];
      $(`edit-badge-${n}-text`).value = b ? decode(b.text) : '';
      $(`edit-badge-${n}-color`).value = b?.color || (n === 1 ? '#ef4444' : '#10b981');
    });
    showEditError(hint || '');
    editModal.show();
  }

  function showEditError(msg) {
    const box = $('edit-error');
    box.textContent = msg;
    box.classList.toggle('d-none', !msg);
  }

  async function saveEdit(e) {
    e.preventDefault();
    if (!editing) return;
    const it = editing;
    const isProduct = it.kind === 'product';

    const title = $('edit-title').value.trim();
    const price = parseFloat($('edit-price').value);
    if (title.length < 3) return showEditError('El título tiene que tener al menos 3 caracteres.');
    if (!Number.isFinite(price) || price <= 0) return showEditError('El precio tiene que ser mayor a 0.');

    const body = { title };
    // La descripción solo viaja si el vendedor la cambió (ver descToText).
    const descText = $('edit-description').value.trim();
    if (descText !== editDescOriginal) body.description = textToDesc(descText);
    body.badges = [1, 2]
      .map((n) => ({ text: $(`edit-badge-${n}-text`).value.trim(), color: $(`edit-badge-${n}-color`).value }))
      .filter((b) => b.text);
    if (isProduct) {
      const stock = parseInt($('edit-stock').value, 10);
      if (!Number.isInteger(stock) || stock < 0) return showEditError('El stock tiene que ser 0 o más.');
      body.price = price;
      body.stock = stock;
      // El estado acompaña al stock: sin stock no se vende, con stock vuelve al catálogo.
      if (stock === 0 && it.status === 'active') body.status = 'sold';
      if (stock > 0 && it.status === 'sold')     body.status = 'active';
    } else {
      body.price_from = price;
      body.has_warranty = $('edit-warranty').checked;
      body.available_24_7 = $('edit-247').checked;
    }

    const btn = $('edit-save-btn');
    btn.disabled = true;
    showEditError('');
    try {
      const updated = await apiFetch(endpoint(it), { method: 'PUT', body: JSON.stringify(body) });
      Object.assign(it, updated || body);
      editModal.hide();
      render();
      notify('Publicación actualizada.', 'success');
    } catch (err) {
      showEditError(err.message || 'No pudimos guardar los cambios.');
    } finally {
      btn.disabled = false;
    }
  }
})();
