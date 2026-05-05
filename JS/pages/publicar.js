// =====================================================
// DALE DEAL - Publicar Producto / Servicio
// =====================================================

// ── Editores Quill (descripción producto / servicio) ─────────────────
let pDescriptionEditor = null;
let sDescriptionEditor = null;

function initQuillEditors() {
  if (typeof Quill === 'undefined') {
    DaleDeal?.warn?.('Quill no se cargó — descripción no editable');
    return;
  }

  const toolbarOptions = [
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ header: [2, 3, false] }],
    ['link'],
    ['clean'],
  ];

  // Producto
  const pHost = document.getElementById('p-description-editor');
  const pHidden = document.getElementById('p-description');
  if (pHost && !pHost.classList.contains('ql-container')) {
    pDescriptionEditor = new Quill(pHost, {
      theme: 'snow',
      placeholder: 'Describí el producto: estado, características, accesorios incluidos…',
      modules: { toolbar: toolbarOptions },
    });
    // Mantener sincronizado el input hidden con el HTML del editor
    pDescriptionEditor.on('text-change', () => {
      const text = pDescriptionEditor.getText().trim();
      pHidden.value = text ? pDescriptionEditor.root.innerHTML : '';
    });
  }

  // Servicio
  const sHost = document.getElementById('s-description-editor');
  const sHidden = document.getElementById('s-description');
  if (sHost && !sHost.classList.contains('ql-container')) {
    sDescriptionEditor = new Quill(sHost, {
      theme: 'snow',
      placeholder: 'Describí el servicio: experiencia, herramientas, alcance…',
      modules: { toolbar: toolbarOptions },
    });
    sDescriptionEditor.on('text-change', () => {
      const text = sDescriptionEditor.getText().trim();
      sHidden.value = text ? sDescriptionEditor.root.innerHTML : '';
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {

  // ── Inicializar editores de descripción ──────────────────────────────
  initQuillEditors();

  // ── Verificar autenticación ──────────────────────────────────────────
  const authWarning = document.getElementById('authWarning');
  const isLogged    = !!localStorage.getItem('daledeal_token');

  if (!isLogged && authWarning) {
    authWarning.style.display = 'flex';
    // Deshabilitar botones de publicar
    document.getElementById('btn-publish-product')?.setAttribute('disabled', true);
    document.getElementById('btn-publish-service')?.setAttribute('disabled', true);
  }

  // ── Tabs: Producto / Servicio ────────────────────────────────────────
  document.querySelectorAll('#publishTabs .nav-link').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#publishTabs .nav-link').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const target = tab.dataset.tab;
      document.getElementById('form-producto').style.display = target === 'producto' ? 'block' : 'none';
      document.getElementById('form-servicio').style.display = target === 'servicio' ? 'block' : 'none';
    });
  });

  // ── Condición del producto ───────────────────────────────────────────
  document.querySelectorAll('.condition-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.condition-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('p-condition').value = btn.dataset.condition;
    });
  });

  // ── Tipo de precio del servicio ──────────────────────────────────────
  document.querySelectorAll('.price-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.price-type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const type = btn.dataset.type;
      document.getElementById('s-price-type').value = type;

      // Mostrar/ocultar campos de precio según tipo
      const priceFields = document.getElementById('price-range-fields');
      if (priceFields) {
        priceFields.style.display = type === 'quote' ? 'none' : 'flex';
      }
    });
  });

  // ── Toggles de envío ─────────────────────────────────────────────────
  const shipReq      = document.getElementById('p-shipping-required');
  const shipBlock    = document.getElementById('p-shipping-options');
  const offersDelv   = document.getElementById('p-offers-delivery');
  const delvFields   = document.getElementById('p-delivery-fields');
  const offersPick   = document.getElementById('p-offers-pickup');
  const pickFields   = document.getElementById('p-pickup-fields');

  shipReq?.addEventListener('change', () => {
    if (shipBlock) shipBlock.style.display = shipReq.checked ? 'block' : 'none';
    // Si se desactiva, limpiar todo
    if (!shipReq.checked) {
      if (offersDelv) offersDelv.checked = false;
      if (offersPick) offersPick.checked = false;
      if (delvFields) delvFields.style.display = 'none';
      if (pickFields) pickFields.style.display = 'none';
    }
  });
  offersDelv?.addEventListener('change', () => {
    if (delvFields) delvFields.style.display = offersDelv.checked ? 'block' : 'none';
  });
  offersPick?.addEventListener('change', () => {
    if (pickFields) pickFields.style.display = offersPick.checked ? 'block' : 'none';
  });

  // ── Cargar categorías ────────────────────────────────────────────────
  loadCategories();

  // ── Formulario de Producto ───────────────────────────────────────────
  document.getElementById('productForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!localStorage.getItem('daledeal_token')) {
      showError('product-error', 'Necesitás iniciar sesión para publicar.');
      return;
    }
    await submitProduct();
  });

  // ── Formulario de Servicio ───────────────────────────────────────────
  document.getElementById('serviceForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!localStorage.getItem('daledeal_token')) {
      showError('service-error', 'Necesitás iniciar sesión para publicar.');
      return;
    }
    await submitService();
  });

});

// =====================================================
// CARGAR CATEGORÍAS DESDE LA API
// =====================================================
async function loadCategories() {
  try {
    const [productCats, serviceCats] = await Promise.all([
      window.DaleDeal.api.apiFetch('/products/categories'),
      window.DaleDeal.api.apiFetch('/services/categories'),
    ]);

    fillSelect('p-category', productCats);
    fillSelect('s-category', serviceCats);
  } catch (err) {
    // Fallback con categorías hardcodeadas si la API falla
    fillSelect('p-category', [
      { id: 1, name: 'Electrónica' }, { id: 2, name: 'Ropa y accesorios' },
      { id: 3, name: 'Hogar y jardín' }, { id: 4, name: 'Deportes' },
      { id: 5, name: 'Juguetes' }, { id: 6, name: 'Vehículos' }, { id: 8, name: 'Otros' }
    ]);
    fillSelect('s-category', [
      { id: 1, name: 'Plomería' }, { id: 2, name: 'Electricidad' },
      { id: 3, name: 'Gasista' }, { id: 4, name: 'Peluquería' },
      { id: 5, name: 'Limpieza' }, { id: 6, name: 'Pintura' },
      { id: 7, name: 'Carpintería' }, { id: 8, name: 'Mecánica' },
      { id: 9, name: 'Informática' }, { id: 10, name: 'Otros servicios' }
    ]);
  }
}

function fillSelect(selectId, items) {
  const select = document.getElementById(selectId);
  if (!select) return;
  select.innerHTML = '<option value="">Seleccioná una categoría</option>';
  items.forEach(item => {
    const opt = document.createElement('option');
    opt.value = item.id;
    opt.textContent = item.name;
    select.appendChild(opt);
  });
}

// =====================================================
// PUBLICAR PRODUCTO
// =====================================================
async function submitProduct() {
  const btn = document.getElementById('btn-publish-product');
  const title = document.getElementById('p-title').value.trim();
  const price = document.getElementById('p-price').value;

  if (!title) { showError('product-error', 'El título es obligatorio.'); return; }
  if (!price || price <= 0) { showError('product-error', 'El precio es obligatorio.'); return; }

  // Datos de envío
  const shippingRequired = !!document.getElementById('p-shipping-required')?.checked;
  const offersDelivery   = !!document.getElementById('p-offers-delivery')?.checked;
  const offersPickup     = !!document.getElementById('p-offers-pickup')?.checked;
  const shippingCostRaw  = document.getElementById('p-shipping-cost')?.value;
  const pickupAddress    = document.getElementById('p-pickup-address')?.value.trim() || '';

  // Validación cliente: si activó envío, al menos un método
  if (shippingRequired && !offersDelivery && !offersPickup) {
    showError('product-error', 'Activaste envío pero no marcaste ningún método (envío o retiro).');
    return;
  }
  if (shippingRequired && offersDelivery && (shippingCostRaw === '' || shippingCostRaw === null)) {
    showError('product-error', 'Ingresá el costo del envío (poné 0 si es gratis).');
    return;
  }
  if (shippingRequired && offersPickup && !pickupAddress) {
    showError('product-error', 'Ingresá la zona o dirección de retiro.');
    return;
  }

  const productData = {
    title,
    description: document.getElementById('p-description').value.trim(),
    price: parseFloat(price),
    stock: parseInt(document.getElementById('p-stock').value) || 1,
    condition: document.getElementById('p-condition').value,
    category_id: document.getElementById('p-category').value || null,
    location: document.getElementById('p-location').value.trim(),
    images: getImageUrls('p-image-list'),
    currency: 'ARS',
    shipping_required: shippingRequired,
    offers_delivery:   shippingRequired && offersDelivery,
    offers_pickup:     shippingRequired && offersPickup,
    shipping_cost:     shippingRequired && offersDelivery ? parseFloat(shippingCostRaw) || 0 : null,
    pickup_address:    shippingRequired && offersPickup ? pickupAddress : null,
  };

  setLoading(btn, true, 'Publicando...');
  hideError('product-error');

  try {
    const result = await window.DaleDeal.api.createProduct(productData);
    showSuccess('product-success', 'product-success-msg', `"${result.title}" publicado correctamente.`);
    document.getElementById('productForm').reset();
    document.getElementById('p-condition').value = 'new';
    document.querySelectorAll('.condition-btn').forEach((b, i) => {
      b.classList.toggle('active', i === 0);
    });
    resetImageList('p-image-list');
    // Limpiar editor Quill (el form.reset() no lo toca)
    if (pDescriptionEditor) pDescriptionEditor.setText('');
    // Reset estado del bloque de envío
    document.getElementById('p-shipping-required').checked = false;
    document.getElementById('p-shipping-options').style.display = 'none';
    ['p-offers-delivery', 'p-offers-pickup'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.checked = false;
    });
    document.getElementById('p-delivery-fields').style.display = 'none';
    document.getElementById('p-pickup-fields').style.display = 'none';
  } catch (err) {
    showError('product-error', err.message || 'Error al publicar. Intentá nuevamente.');
  } finally {
    setLoading(btn, false, '<i class="bi bi-plus-circle me-2"></i>Publicar Producto');
  }
}

// =====================================================
// PUBLICAR SERVICIO
// =====================================================
async function submitService() {
  const btn = document.getElementById('btn-publish-service');
  const title = document.getElementById('s-title').value.trim();

  if (!title) { showError('service-error', 'El título es obligatorio.'); return; }

  const zonesRaw = document.getElementById('s-zones').value.trim();
  const zones = zonesRaw ? zonesRaw.split(',').map(z => z.trim()).filter(Boolean) : [];

  const serviceData = {
    title,
    description: document.getElementById('s-description').value.trim(),
    price_from: parseFloat(document.getElementById('s-price-from').value) || null,
    price_to: parseFloat(document.getElementById('s-price-to').value) || null,
    price_type: document.getElementById('s-price-type').value,
    category_id: document.getElementById('s-category').value || null,
    location: document.getElementById('s-location').value.trim(),
    zones_covered: zones,
    images: getImageUrls('s-image-list'),
    currency: 'ARS',
  };

  setLoading(btn, true, 'Publicando...');
  hideError('service-error');

  try {
    const result = await window.DaleDeal.api.createService(serviceData);
    showSuccess('service-success', 'service-success-msg', `"${result.title}" publicado correctamente.`);
    document.getElementById('serviceForm').reset();
    document.getElementById('s-price-type').value = 'fixed';
    document.querySelectorAll('.price-type-btn').forEach((b, i) => {
      b.classList.toggle('active', i === 0);
    });
    resetImageList('s-image-list');
    if (sDescriptionEditor) sDescriptionEditor.setText('');
  } catch (err) {
    showError('service-error', err.message || 'Error al publicar. Intentá nuevamente.');
  } finally {
    setLoading(btn, false, '<i class="bi bi-plus-circle me-2"></i>Publicar Servicio');
  }
}

// =====================================================
// HELPERS DE IMÁGENES
// =====================================================
function getImageUrls(listId) {
  const inputs = document.querySelectorAll(`#${listId} input[type="url"]`);
  return Array.from(inputs)
    .map(i => i.value.trim())
    .filter(url => url.length > 0);
}

function addImageRow(listId) {
  const list = document.getElementById(listId);
  const row = document.createElement('div');
  row.className = 'image-url-row';
  row.innerHTML = `
    <input type="url" class="form-control" placeholder="https://..." />
    <button type="button" class="btn-remove-image" onclick="removeImageRow(this)">
      <i class="bi bi-x-circle"></i>
    </button>
  `;
  list.appendChild(row);
}

function removeImageRow(btn) {
  const list = btn.closest('.image-url-list');
  if (list.querySelectorAll('.image-url-row').length > 1) {
    btn.closest('.image-url-row').remove();
  } else {
    btn.closest('.image-url-row').querySelector('input').value = '';
  }
}

function resetImageList(listId) {
  const list = document.getElementById(listId);
  list.innerHTML = `
    <div class="image-url-row">
      <input type="url" class="form-control" placeholder="https://..." />
      <button type="button" class="btn-remove-image" onclick="removeImageRow(this)">
        <i class="bi bi-x-circle"></i>
      </button>
    </div>
  `;
}

// =====================================================
// HELPERS DE UI
// =====================================================
function setLoading(btn, loading, text) {
  if (!btn) return;
  btn.disabled = loading;
  btn.innerHTML = loading
    ? '<span class="spinner-border spinner-border-sm me-2"></span>Publicando...'
    : text;
}

function showError(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('d-none');
  setTimeout(() => el.classList.add('d-none'), 5000);
}

function hideError(id) {
  document.getElementById(id)?.classList.add('d-none');
}

function showSuccess(containerId, msgId, msg) {
  const container = document.getElementById(containerId);
  const msgEl = document.getElementById(msgId);
  if (container) container.style.display = 'flex';
  if (msgEl) msgEl.textContent = msg;
  setTimeout(() => {
    if (container) container.style.display = 'none';
  }, 6000);
}
