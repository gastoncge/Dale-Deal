// =====================================================
// DALE DEAL - Documentos de verificación (registro y Mi Centro)
// =====================================================
// DNI (frente y dorso) + foto de la cara → verificación de identidad.
// Título (opcional, para prestadores) → insignia de título verificado.
// Las fotos se achican en el navegador (JPEG, máx. 1600px) y viajan al
// backend (POST /verifications/documents), que las guarda en privado: solo
// las ve un admin para aprobar. Nunca quedan en una URL pública.
(function () {
  const MAX_SIDE = 1600;
  const MAX_PDF_BYTES = 4 * 1024 * 1024;

  const DOCS = {
    dni_front: { label: 'DNI de frente', icon: 'bi-person-vcard', hint: 'Que se lean bien todos los datos, sin reflejos.' },
    dni_back:  { label: 'DNI de dorso',  icon: 'bi-person-vcard-fill', hint: 'La otra cara del DNI, en una foto aparte.' },
    selfie:    { label: 'Foto de tu cara', icon: 'bi-person-bounding-box', hint: 'Tipo foto carnet: de frente, con buena luz.', capture: 'user' },
    title:     { label: 'Título o matrícula', icon: 'bi-mortarboard', hint: 'Opcional, si ofrecés servicios. Los datos tienen que coincidir con tu DNI.', pdf: true },
  };

  /** Archivo → data URL. Imágenes: JPEG achicado. PDF (solo título): tal cual. */
  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      if (!file) return resolve(null);
      if (file.type === 'application/pdf') {
        if (file.size > MAX_PDF_BYTES) return reject(new Error('El PDF puede pesar hasta 4 MB.'));
        const fr = new FileReader();
        fr.onload = () => resolve(fr.result);
        fr.onerror = () => reject(new Error('No pudimos leer el archivo.'));
        return fr.readAsDataURL(file);
      }
      if (!/^image\//.test(file.type)) return reject(new Error('Subí una foto (JPG, PNG o WEBP).'));
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('No pudimos leer la foto. Probá con otra.')); };
      img.src = url;
    });
  }

  /** Campos de archivo para los documentos pedidos (kinds) con vista previa. */
  function fieldsHTML(prefix, kinds, { required = [] } = {}) {
    return kinds.map((k) => {
      const d = DOCS[k];
      const req = required.includes(k);
      return `
        <label class="vdoc-field" for="${prefix}-${k}">
          <span class="vdoc-thumb" id="${prefix}-${k}-thumb"><i class="bi ${d.icon}" aria-hidden="true"></i></span>
          <span class="vdoc-text">
            <strong>${d.label}${req ? '' : ' <small class="text-muted fw-normal">(opcional)</small>'}</strong>
            <small>${d.hint}</small>
            <span class="vdoc-status" id="${prefix}-${k}-status">Tocá para elegir o sacar una foto</span>
          </span>
          <input type="file" id="${prefix}-${k}" data-vdoc="${k}" class="visually-hidden"
                 accept="image/*${d.pdf ? ',application/pdf' : ''}" ${d.capture ? `capture="${d.capture}"` : ''} ${req ? 'data-required="1"' : ''}>
        </label>`;
    }).join('');
  }

  /** Vista previa al elegir archivo (delegado: sirve para campos creados después). */
  document.addEventListener('change', (e) => {
    const input = e.target.closest('input[data-vdoc]');
    if (!input) return;
    const file = input.files?.[0];
    const thumb = document.getElementById(`${input.id}-thumb`);
    const status = document.getElementById(`${input.id}-status`);
    input.closest('.vdoc-field')?.classList.toggle('is-done', !!file);
    input.closest('.vdoc-field')?.classList.remove('is-invalid');
    const err = input.closest('.vdoc-section, #verifDocsBox')?.querySelector('.vdoc-error');
    if (err) err.textContent = '';
    if (!file) return;
    if (status) status.textContent = file.name;
    if (thumb && /^image\//.test(file.type)) {
      const url = URL.createObjectURL(file);
      thumb.innerHTML = `<img src="${url}" alt="">`;
    } else if (thumb) {
      thumb.innerHTML = '<i class="bi bi-file-earmark-pdf" aria-hidden="true"></i>';
    }
  });

  /** Lee los campos de un contenedor. Marca los obligatorios que faltan. */
  async function collect(container) {
    const out = {};
    let missing = false;
    for (const input of container.querySelectorAll('input[data-vdoc]')) {
      const file = input.files?.[0];
      if (!file) {
        if (input.dataset.required) { missing = true; input.closest('.vdoc-field')?.classList.add('is-invalid'); }
        continue;
      }
      out[input.dataset.vdoc] = await fileToDataUrl(file);
    }
    if (missing) throw new Error('Falta subir el DNI de frente, de dorso y la foto de tu cara.');
    return out;
  }

  async function upload(docs) {
    const api = window.DaleDeal?.api;
    return api.apiFetch('/verifications/documents', {
      method: 'POST',
      body: JSON.stringify({ ...docs, consent: true }),
    });
  }

  window.DDVerificationDocs = { DOCS, fieldsHTML, collect, upload, fileToDataUrl };
})();
