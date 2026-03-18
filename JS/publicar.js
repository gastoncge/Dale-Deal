// =====================================================
// DALE DEAL - Publicar Producto / Servicio
// =====================================================

document.addEventListener('DOMContentLoaded', () => {

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
  function switchTab(target) {
    document.querySelectorAll('#publishTabs .nav-link').forEach(t => t.classList.remove('active'));
    const activeBtn = document.querySelector(`#publishTabs .nav-link[data-tab="${target}"]`);
    if (activeBtn) activeBtn.classList.add('active');
    document.getElementById('form-producto').style.display = target === 'producto' ? 'block' : 'none';
    document.getElementById('form-servicio').style.display = target === 'servicio' ? 'block' : 'none';
    document.getElementById('planes-producto').style.display = target === 'producto' ? 'block' : 'none';
    document.getElementById('planes-servicio').style.display = target === 'servicio' ? 'block' : 'none';
  }

  document.querySelectorAll('#publishTabs .nav-link').forEach(tab => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  // Leer parámetro ?tab= de la URL para abrir el tab correcto
  const urlTab = new URLSearchParams(window.location.search).get('tab');
  if (urlTab === 'servicio') switchTab('servicio');

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

  // ── Cargar categorías ────────────────────────────────────────────────
  loadCategories();

  // ── Campo "Otros" en productos ──────────────────────────────────────
  document.getElementById('p-category')?.addEventListener('change', function () {
    const otherWrap = document.getElementById('p-category-other-wrap');
    const selectedText = this.options[this.selectedIndex]?.text || '';
    if (selectedText.toLowerCase().includes('otros')) {
      otherWrap.classList.remove('d-none');
      document.getElementById('p-category-other').focus();
    } else {
      otherWrap.classList.add('d-none');
      document.getElementById('p-category-other').value = '';
    }
  });

  // ── Campo "Otros servicios" ──────────────────────────────────────────
  document.getElementById('s-category')?.addEventListener('change', function () {
    const otherWrap = document.getElementById('s-category-other-wrap');
    const selectedText = this.options[this.selectedIndex]?.text || '';
    if (selectedText.toLowerCase().includes('otros')) {
      otherWrap.classList.remove('d-none');
      document.getElementById('s-category-other').focus();
    } else {
      otherWrap.classList.add('d-none');
      document.getElementById('s-category-other').value = '';
    }
  });

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

  const productData = {
    title,
    description: document.getElementById('p-description').value.trim(),
    price: parseFloat(price),
    stock: parseInt(document.getElementById('p-stock').value) || 1,
    condition: document.getElementById('p-condition').value,
    category_id: document.getElementById('p-category').value || null,
    category_other: (() => {
      const sel = document.getElementById('p-category');
      const selectedText = sel.options[sel.selectedIndex]?.text || '';
      return selectedText.toLowerCase().includes('otros')
        ? document.getElementById('p-category-other').value.trim()
        : null;
    })(),
    location: document.getElementById('p-location').value.trim(),
    images: getImageUrls('p-image-list'),
    currency: 'ARS',
    badges: getBadges('p'),
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
    category_other: (() => {
      const sel = document.getElementById('s-category');
      const selectedText = sel.options[sel.selectedIndex]?.text || '';
      return selectedText.toLowerCase().includes('otros')
        ? document.getElementById('s-category-other').value.trim()
        : null;
    })(),
    location: document.getElementById('s-location').value.trim(),
    zones_covered: zones,
    images: getImageUrls('s-image-list'),
    currency: 'ARS',
    badges: getBadges('s'),
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
// CARTELES PERSONALIZADOS
// =====================================================
function updateBadgePreview(id) {
  const text = document.getElementById(id + '-text').value.trim();
  const color = document.getElementById(id + '-color').value;
  const preview = document.getElementById(id + '-preview');
  if (!preview) return;
  preview.style.background = color;
  preview.textContent = text || 'VISTA';
}

function getBadges(prefix) {
  return [1, 2]
    .map(n => ({
      text: document.getElementById(`${prefix}-badge-${n}-text`)?.value.trim() || '',
      color: document.getElementById(`${prefix}-badge-${n}-color`)?.value || '#ef4444',
    }))
    .filter(b => b.text);
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
