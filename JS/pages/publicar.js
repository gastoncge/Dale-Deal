// =====================================================
// DALE DEAL - Publicar Producto / Servicio
// =====================================================

// =====================================================
// EDITORES QUILL — Descripción enriquecida
// =====================================================
let quillProduct = null;
let quillService = null;

function initQuillEditors() {
  if (typeof Quill === 'undefined') return;

  const toolbarOptions = [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ color: [] }, { background: [] }],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link', 'image'],
    ['clean'],
  ];

  function imageUrlHandler(quillInstance) {
    const url = prompt('Pegá la URL de la imagen o GIF:');
    if (url && url.trim()) {
      const range = quillInstance.getSelection(true);
      quillInstance.insertEmbed(range.index, 'image', url.trim());
      quillInstance.setSelection(range.index + 1);
    }
  }

  quillProduct = new Quill('#p-description-editor', {
    theme: 'snow',
    placeholder: 'Describí tu producto: características, estado, detalles importantes...',
    modules: {
      toolbar: {
        container: toolbarOptions,
        handlers: { image: () => imageUrlHandler(quillProduct) },
      },
    },
  });

  quillService = new Quill('#s-description-editor', {
    theme: 'snow',
    placeholder: 'Describí tu servicio: qué incluye, experiencia, cómo trabajás...',
    modules: {
      toolbar: {
        container: toolbarOptions,
        handlers: { image: () => imageUrlHandler(quillService) },
      },
    },
  });

  // Sincronizar contenido con inputs hidden al escribir
  quillProduct.on('text-change', () => {
    document.getElementById('p-description').value = quillProduct.root.innerHTML;
  });
  quillService.on('text-change', () => {
    document.getElementById('s-description').value = quillService.root.innerHTML;
  });
}

document.addEventListener('DOMContentLoaded', () => {
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

  // ── Opciones de entrega ──────────────────────────────────────────────
  document.querySelectorAll('input[name="p-delivery"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const val = radio.value;
      document.getElementById('p-delivery-type').value = val;
      const wrap  = document.getElementById('p-delivery-location-wrap');
      const label = document.getElementById('p-delivery-location-label');
      if (val === 'pickup' || val === 'meetup') {
        wrap.classList.remove('d-none');
        label.textContent = val === 'pickup' ? 'Dirección de retiro' : 'Punto de encuentro';
        document.getElementById('p-delivery-location').placeholder =
          val === 'pickup' ? 'Ej: Av. Corrientes 1234, CABA' : 'Ej: Obelisco, CABA';
      } else {
        wrap.classList.add('d-none');
        document.getElementById('p-delivery-location').value = '';
      }
    });
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
    opt.value = item.name.toLowerCase().includes('otro') ? 'otros' : item.id;
    opt.textContent = item.name;
    select.appendChild(opt);
  });

  // Toggle del campo "Otros" al cambiar la selección
  const otherId = selectId === 'p-category' ? 'p-category-other-wrap' : 's-category-other-wrap';
  select.addEventListener('change', () => {
    const wrap = document.getElementById(otherId);
    if (!wrap) return;
    if (select.value === 'otros') {
      wrap.classList.remove('d-none');
      wrap.querySelector('input').focus();
    } else {
      wrap.classList.add('d-none');
      wrap.querySelector('input').value = '';
    }
  });
}

// =====================================================
// PUBLICAR PRODUCTO
// =====================================================
async function submitProduct() {
  const btn = document.getElementById('btn-publish-product');
  const title = document.getElementById('p-title').value.trim();
  const price = document.getElementById('p-price').value;
  const categoryVal = document.getElementById('p-category').value;
  const isCustomCategory = categoryVal === 'otros';
  const customCategory = isCustomCategory
    ? document.getElementById('p-category-other').value.trim()
    : '';

  if (!title) { showError('product-error', 'El título es obligatorio.'); return; }
  if (!price || price <= 0) { showError('product-error', 'El precio es obligatorio.'); return; }
  if (isCustomCategory && !customCategory) {
    showError('product-error', 'Escribí el nombre de tu categoría.');
    document.getElementById('p-category-other').focus();
    return;
  }

  const deliveryType     = document.getElementById('p-delivery-type').value;
  const deliveryLocation = document.getElementById('p-delivery-location').value.trim();

  if ((deliveryType === 'pickup' || deliveryType === 'meetup') && !deliveryLocation) {
    showError('product-error',
      deliveryType === 'pickup'
        ? 'Indicá la dirección de retiro.'
        : 'Indicá el punto de encuentro.');
    document.getElementById('p-delivery-location').focus();
    return;
  }

  const productData = {
    title,
    description: document.getElementById('p-description').value.trim(),
    price: parseFloat(price),
    stock: parseInt(document.getElementById('p-stock').value) || 1,
    condition: document.getElementById('p-condition').value,
    category_id: isCustomCategory ? null : (categoryVal || null),
    custom_category: isCustomCategory ? customCategory : undefined,
    status: isCustomCategory ? 'pending_approval' : 'active',
    location: document.getElementById('p-location').value.trim(),
    delivery_type: deliveryType,
    delivery_location: (deliveryType === 'pickup' || deliveryType === 'meetup') ? deliveryLocation : undefined,
    images: getImageUrls('p-image-list'),
    currency: 'ARS',
  };

  setLoading(btn, true, 'Publicando...');
  hideError('product-error');

  try {
    const result = await window.DaleDeal.api.createProduct(productData);
    const successMsg = isCustomCategory
      ? `"${result.title || title}" enviado. Quedará visible una vez que aprobemos la categoría "${customCategory}".`
      : `"${result.title || title}" publicado correctamente.`;
    showSuccess('product-success', 'product-success-msg', successMsg);
    document.getElementById('productForm').reset();
    document.getElementById('p-condition').value = 'new';
    document.querySelectorAll('.condition-btn').forEach((b, i) => {
      b.classList.toggle('active', i === 0);
    });
    document.getElementById('p-category-other-wrap').classList.add('d-none');
    document.getElementById('p-delivery-location-wrap').classList.add('d-none');
    document.getElementById('p-delivery-type').value = 'buyer_pays';
    document.querySelector('input[name="p-delivery"][value="buyer_pays"]').checked = true;
    if (quillProduct) { quillProduct.setContents([]); document.getElementById('p-description').value = ''; }
    resetImageList('p-image-list');
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
  const categoryVal = document.getElementById('s-category').value;
  const isCustomCategory = categoryVal === 'otros';
  const customCategory = isCustomCategory
    ? document.getElementById('s-category-other').value.trim()
    : '';

  if (!title) { showError('service-error', 'El título es obligatorio.'); return; }
  if (isCustomCategory && !customCategory) {
    showError('service-error', 'Escribí el nombre de tu categoría.');
    document.getElementById('s-category-other').focus();
    return;
  }

  const zonesRaw = document.getElementById('s-zones').value.trim();
  const zones = zonesRaw ? zonesRaw.split(',').map(z => z.trim()).filter(Boolean) : [];

  const serviceData = {
    title,
    description: document.getElementById('s-description').value.trim(),
    price_from: parseFloat(document.getElementById('s-price-from').value) || null,
    price_to: parseFloat(document.getElementById('s-price-to').value) || null,
    price_type: document.getElementById('s-price-type').value,
    category_id: isCustomCategory ? null : (categoryVal || null),
    custom_category: isCustomCategory ? customCategory : undefined,
    status: isCustomCategory ? 'pending_approval' : 'active',
    location: document.getElementById('s-location').value.trim(),
    zones_covered: zones,
    images: getImageUrls('s-image-list'),
    currency: 'ARS',
  };

  setLoading(btn, true, 'Publicando...');
  hideError('service-error');

  try {
    const result = await window.DaleDeal.api.createService(serviceData);
    const successMsg = isCustomCategory
      ? `"${result.title || title}" enviado. Quedará visible una vez que aprobemos la categoría "${customCategory}".`
      : `"${result.title || title}" publicado correctamente.`;
    showSuccess('service-success', 'service-success-msg', successMsg);
    document.getElementById('serviceForm').reset();
    document.getElementById('s-price-type').value = 'fixed';
    document.querySelectorAll('.price-type-btn').forEach((b, i) => {
      b.classList.toggle('active', i === 0);
    });
    document.getElementById('s-category-other-wrap').classList.add('d-none');
    if (quillService) { quillService.setContents([]); document.getElementById('s-description').value = ''; }
    resetImageList('s-image-list');
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
