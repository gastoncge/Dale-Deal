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

  if (uploadsInFlight > 0) {
    showError('product-error', 'Hay fotos subiéndose todavía — esperá unos segundos y volvé a intentar.');
    return;
  }
  if (!title || title.length < 3) {
    showError('product-error', 'El título debe tener al menos 3 caracteres.');
    return;
  }
  const priceNum = parseFloat(price);
  if (!Number.isFinite(priceNum) || priceNum <= 0) {
    showError('product-error', 'El precio debe ser un número mayor a 0.');
    return;
  }
  if (priceNum > 999_999_999) {
    showError('product-error', 'El precio supera el máximo permitido.');
    return;
  }
  const stockNum = parseInt(document.getElementById('p-stock').value, 10) || 1;
  if (stockNum < 0 || stockNum > 100_000) {
    showError('product-error', 'El stock debe estar entre 0 y 100.000.');
    return;
  }

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
    images: getProductImages(),
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
    resetImageList('p-photo-area');
    uploadedPhotos['p-photo-area'] = [];
    document.getElementById('p-photo-previews').innerHTML = '';
    document.getElementById('p-video-previews').innerHTML = '';
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

  if (uploadsInFlight > 0) {
    showError('service-error', 'Hay fotos subiéndose todavía — esperá unos segundos y volvé a intentar.');
    return;
  }
  if (!title || title.length < 3) {
    showError('service-error', 'El título debe tener al menos 3 caracteres.');
    return;
  }

  const priceFrom = parseFloat(document.getElementById('s-price-from').value);
  const priceTo   = parseFloat(document.getElementById('s-price-to').value);
  const priceType = document.getElementById('s-price-type').value;
  if (priceType !== 'quote') {
    if (Number.isFinite(priceFrom) && priceFrom <= 0) {
      showError('service-error', 'El precio "desde" debe ser mayor a 0.');
      return;
    }
    if (Number.isFinite(priceTo) && priceTo <= 0) {
      showError('service-error', 'El precio "hasta" debe ser mayor a 0.');
      return;
    }
    if (Number.isFinite(priceFrom) && Number.isFinite(priceTo) && priceTo < priceFrom) {
      showError('service-error', 'El precio "hasta" no puede ser menor al "desde".');
      return;
    }
  }

  const zonesRaw = document.getElementById('s-zones').value.trim();
  const zones = zonesRaw ? zonesRaw.split(',').map(z => z.trim()).filter(Boolean) : [];

  const serviceData = {
    title,
    description: document.getElementById('s-description').value.trim(),
    price_from: Number.isFinite(priceFrom) ? priceFrom : null,
    price_to:   Number.isFinite(priceTo)   ? priceTo   : null,
    price_type: priceType,
    category_id: document.getElementById('s-category').value || null,
    location: document.getElementById('s-location').value.trim(),
    zones_covered: zones,
    images: getServiceImages(),
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
    resetImageList('s-photo-area');
    uploadedPhotos['s-photo-area'] = [];
    document.getElementById('s-photo-previews').innerHTML = '';
    document.getElementById('s-video-previews').innerHTML = '';
    if (sDescriptionEditor) sDescriptionEditor.setText('');
  } catch (err) {
    showError('service-error', err.message || 'Error al publicar. Intentá nuevamente.');
  } finally {
    setLoading(btn, false, '<i class="bi bi-plus-circle me-2"></i>Publicar Servicio');
  }
}

// =====================================================
// HELPERS DE IMÁGENES — upload real
// =====================================================
//
// Al elegir archivos se suben de una a POST /api/upload (Worker del mismo
// dominio, guarda en Workers KV y devuelve la URL /img/<key>). El form
// publica esas URLs. Si una subida falla (sin conexión, sesión vencida,
// server local sin Worker), se abre el bloque de URLs pegadas como fallback.

const MAX_PHOTOS = 10;
const MAX_PHOTO_BYTES = 8 * 1024 * 1024; // espejo del límite del Worker

// URLs ya subidas, por área de upload
const uploadedPhotos = {
  'p-photo-area': [],
  's-photo-area': [],
};
let uploadsInFlight = 0;

function getProductImages() {
  return uploadedPhotos['p-photo-area']
    .concat(readImageUrlsFromExtra('p-photo-area'))
    .slice(0, MAX_PHOTOS);
}
function getServiceImages() {
  return uploadedPhotos['s-photo-area']
    .concat(readImageUrlsFromExtra('s-photo-area'))
    .slice(0, MAX_PHOTOS);
}

/** Sube un archivo al Worker y devuelve la URL pública (/img/<key>). */
async function uploadImageFile(file) {
  const token = localStorage.getItem('daledeal_token');
  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token || ''}`,
      'Content-Type': file.type,
    },
    body: file,
  });
  let data = null;
  try { data = await res.json(); } catch (_) { /* respuesta no-JSON (p.ej. 404 en dev local) */ }
  if (!res.ok || !data?.ok || !data.url) {
    throw new Error(data?.error || 'No se pudo subir la imagen.');
  }
  return data.url;
}

/** Crea la card de preview y sube el archivo; refleja el estado en la card. */
function uploadOnePhoto(file, areaId, previews) {
  if (file.size > MAX_PHOTO_BYTES) {
    alert(`"${file.name}" supera los 8 MB y no se puede subir.`);
    return;
  }

  const objUrl = URL.createObjectURL(file);
  const card = document.createElement('div');
  card.className = 'media-preview-item';
  card.style.cssText = 'display:inline-block;margin:6px;position:relative;';
  card.innerHTML = `
    <img src="${objUrl}" alt="${escapeAttr(file.name)}" style="width:120px;height:120px;object-fit:cover;border-radius:8px;opacity:.5;" />
    <span class="upload-state spinner-border spinner-border-sm" style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:var(--primary-red,#d63031);"></span>
  `;
  previews.appendChild(card);

  uploadsInFlight++;
  uploadImageFile(file)
    .then((url) => {
      uploadedPhotos[areaId].push(url);
      card.dataset.url = url;
      const img = card.querySelector('img');
      if (img) img.style.opacity = '1';
      card.querySelector('.upload-state')?.remove();
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = '×';
      remove.setAttribute('aria-label', 'Quitar foto');
      remove.style.cssText = 'position:absolute;top:-6px;right:-6px;width:22px;height:22px;border-radius:50%;border:none;background:#d63031;color:#fff;font-weight:700;line-height:1;cursor:pointer;';
      remove.addEventListener('click', () => {
        uploadedPhotos[areaId] = uploadedPhotos[areaId].filter(u => u !== url);
        card.remove();
      });
      card.appendChild(remove);
    })
    .catch((err) => {
      card.remove();
      // Fallback: dejar pegar URLs públicas a mano
      ensureExtraUrlBlock(areaId);
      alert(`No pudimos subir "${file.name}": ${err.message}\nComo alternativa, pegá una URL pública de la foto en el campo de abajo.`);
    })
    .finally(() => {
      uploadsInFlight--;
    });
}

function readImageUrlsFromExtra(areaId) {
  // Buscamos un sub-bloque de URLs adicionales que se inyecta on-demand.
  const wrap = document.getElementById(`${areaId}-urls`);
  if (!wrap) return [];
  const inputs = wrap.querySelectorAll('input[type="url"]');
  return Array.from(inputs)
    .map(i => i.value.trim())
    .filter(url => /^https?:\/\/.+/i.test(url));
}

function ensureExtraUrlBlock(areaId) {
  const id = `${areaId}-urls`;
  let wrap = document.getElementById(id);
  if (wrap) return wrap;
  const area = document.getElementById(areaId);
  if (!area) return null;
  wrap = document.createElement('div');
  wrap.id = id;
  wrap.className = 'mt-3';
  wrap.innerHTML = `
    <label class="form-label small mb-1">URLs de fotos (alternativa)</label>
    <div class="image-url-list">
      <div class="image-url-row d-flex gap-2 align-items-center mb-2">
        <input type="url" class="form-control form-control-sm" placeholder="https://..." />
        <button type="button" class="btn btn-sm btn-outline-secondary" onclick="addImageUrlRow('${id}')">+</button>
      </div>
    </div>
    <div class="form-text">Si la subida directa falla, pegá acá la URL pública de tu foto (Imgur, Drive, etc.) — también se publica.</div>
  `;
  area.parentElement.appendChild(wrap);
  return wrap;
}

function addImageUrlRow(wrapId) {
  const wrap = document.getElementById(wrapId);
  if (!wrap) return;
  const list = wrap.querySelector('.image-url-list');
  const rows = list.querySelectorAll('.image-url-row').length;
  if (rows >= 20) return;
  const row = document.createElement('div');
  row.className = 'image-url-row d-flex gap-2 align-items-center mb-2';
  row.innerHTML = `
    <input type="url" class="form-control form-control-sm" placeholder="https://..." />
    <button type="button" class="btn btn-sm btn-outline-danger" onclick="this.parentElement.remove()">×</button>
  `;
  list.appendChild(row);
}
window.addImageUrlRow = addImageUrlRow;

function resetImageList(areaIdSuffix) {
  // No-op: el bloque se mantiene tras submit; queda al usuario.
  // Esta función se mantiene para no romper llamadas existentes.
  const wrap = document.getElementById(`${areaIdSuffix.replace(/-list$/, '-urls')}`)
            || document.getElementById(`${areaIdSuffix}-urls`);
  if (!wrap) return;
  const inputs = wrap.querySelectorAll('input[type="url"]');
  inputs.forEach(i => i.value = '');
}

// =====================================================
// HANDLERS INLINE QUE EL HTML INVOCA (handleMediaUpload, etc.)
// =====================================================

/**
 * Maneja la selección de archivos en un <input type="file">.
 * Fotos: las SUBE de verdad (POST /api/upload) y acumula las URLs que
 * después publica el form. Video: solo preview local (no se publica aún).
 */
function handleMediaUpload(input, previewId, type) {
  const previews = document.getElementById(previewId);
  if (!previews) return;
  const files = Array.from(input.files || []);

  // Video: preview local únicamente
  if (type === 'video') {
    previews.innerHTML = '';
    if (files.length > 1) alert('Solo podés subir 1 video.');
    const file = files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const el = document.createElement('div');
      el.className = 'media-preview-item';
      el.style.cssText = 'display:inline-block;margin:6px;position:relative;';
      el.innerHTML = `<video src="${url}" controls style="max-width:160px;max-height:120px;border-radius:8px;"></video>`;
      previews.appendChild(el);
    }
    return;
  }

  // Fotos: subida real
  const areaId = input.closest('.media-upload-area')?.id;
  if (!areaId || !uploadedPhotos[areaId]) return;

  if (!localStorage.getItem('daledeal_token')) {
    alert('Necesitás iniciar sesión para subir fotos.');
    input.value = '';
    return;
  }

  const room = MAX_PHOTOS - uploadedPhotos[areaId].length;
  const selected = files.filter(f => f.type && f.type.startsWith('image/'));
  const limited = selected.slice(0, Math.max(0, room));
  if (selected.length > limited.length) {
    alert(`Podés subir hasta ${MAX_PHOTOS} fotos por publicación.`);
  }
  limited.forEach(file => uploadOnePhoto(file, areaId, previews));
  input.value = ''; // permite volver a elegir los mismos archivos
}
window.handleMediaUpload = handleMediaUpload;

/**
 * Actualiza el preview visual del cartel (badge) cuando el usuario
 * cambia el texto o el color en publicar.
 */
function updateBadgePreview(badgeId) {
  const text  = document.getElementById(`${badgeId}-text`)?.value || 'VISTA';
  const color = document.getElementById(`${badgeId}-color`)?.value || '#ef4444';
  const prev  = document.getElementById(`${badgeId}-preview`);
  if (!prev) return;
  prev.textContent     = text || 'VISTA';
  prev.style.background = color;
}
window.updateBadgePreview = updateBadgePreview;

/**
 * Selección de plan en la grilla de planes (Estándar / Destacado / Pro).
 * Por ahora todos los planes se cobran después del MVP — guardamos la
 * elección y la mostramos en el modal de pago.
 */
function seleccionarPlan(nombrePlan, precio) {
  window.__daledealPlanSeleccionado = { nombre: nombrePlan, precio: Number(precio) || 0 };
  // Mostrar mensaje claro
  if (precio > 0) {
    const ok = confirm(`Plan "${nombrePlan}" ($${precio.toLocaleString('es-AR')}/mes).\n\nLa monetización de planes destacados está en activación. Por ahora podés seguir publicando con el plan Estándar (gratis). ¿Querés volver a la publicación gratuita?`);
    if (ok) document.querySelector('#publishTabs .nav-link.active')?.click();
  } else {
    alert(`Elegiste el plan "${nombrePlan}" — gratis. Completá el formulario y dale a "Publicar".`);
  }
}
window.seleccionarPlan = seleccionarPlan;

/** Confirmar pago del plan elegido (placeholder hasta que esté MP de planes). */
function confirmarPago() {
  const plan = window.__daledealPlanSeleccionado;
  if (!plan) {
    alert('Primero elegí un plan.');
    return;
  }
  alert(`El cobro de planes destacados se va a habilitar en breve. Te avisamos por email cuando "${plan.nombre}" esté disponible.`);
  // Cerrar el modal si Bootstrap está disponible
  const modal = document.getElementById('modalPago');
  if (modal && window.bootstrap) {
    bootstrap.Modal.getInstance(modal)?.hide();
  }
}
window.confirmarPago = confirmarPago;

function escapeAttr(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
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
