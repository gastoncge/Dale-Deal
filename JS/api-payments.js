// =====================================================
// DALE DEAL - Cliente de API de Pagos (Mercado Pago)
// -----------------------------------------------------
// Depende de window.DaleDeal.api.apiFetch (api.js).
// =====================================================

(function () {
  'use strict';

  function getApiFetch() {
    const apiFetch = window.DaleDeal?.api?.apiFetch;
    if (!apiFetch) {
      throw new Error('API no disponible. ¿Cargaste api.js antes?');
    }
    return apiFetch;
  }

  // -------------------------------------------------------
  // POST /payments/preference
  // -------------------------------------------------------
  // Crea (o recupera) la preferencia de MP para una orden.
  // Devuelve: { ok, preference_id, init_point, sandbox_init_point,
  //             total, commission, net_to_seller }
  // -------------------------------------------------------
  async function createPreference(orderId) {
    if (!orderId) throw new Error('orderId es requerido');
    return getApiFetch()('/payments/preference', {
      method: 'POST',
      body: JSON.stringify({ order_id: Number(orderId) }),
    });
  }

  // -------------------------------------------------------
  // GET /payments/:orderId/status
  // -------------------------------------------------------
  async function getStatus(orderId) {
    if (!orderId) throw new Error('orderId es requerido');
    return getApiFetch()(`/payments/${Number(orderId)}/status`);
  }

  // -------------------------------------------------------
  // Helper: redirige al checkout de MP para una orden dada.
  //
  // En desarrollo (credenciales TEST) usa sandbox_init_point;
  // en producción usa init_point.
  //
  // Guarda la orden actual en localStorage para poder
  // recuperarla desde la página de retorno si hace falta.
  // -------------------------------------------------------
  async function redirectToCheckout(orderId, { preferSandbox = null } = {}) {
    const pref = await createPreference(orderId);

    if (!pref || !pref.ok) {
      throw new Error('No se pudo crear la preferencia de pago.');
    }

    // Recordar la orden en curso (para pago-exitoso/fallido/pendiente)
    try {
      localStorage.setItem('dd_current_payment_order', String(orderId));
    } catch (_) {}

    // Si el backend nos dijo explícitamente si es sandbox, priorizamos eso.
    // Si no, usamos preferSandbox si viene, o por default init_point.
    const useSandbox = preferSandbox !== null
      ? preferSandbox
      : (pref.is_sandbox === true);

    const url = useSandbox
      ? (pref.sandbox_init_point || pref.init_point)
      : (pref.init_point || pref.sandbox_init_point);

    if (!url) {
      throw new Error('Mercado Pago no devolvió un link de checkout.');
    }

    window.location.href = url;
  }

  // -------------------------------------------------------
  // Helper: flujo completo desde una acción "Comprar ahora".
  //   1) POST /orders con product_id + quantity
  //   2) POST /payments/preference con la order_id devuelta
  //   3) Redirige al checkout de MP
  //
  // Devuelve la Promise del redirect — no vuelve.
  // -------------------------------------------------------
  async function buyProductNow({ product_id, quantity = 1 }) {
    if (!product_id) throw new Error('product_id es requerido');

    const apiFetch = getApiFetch();

    // 1) Crear orden
    const orderRes = await apiFetch('/orders', {
      method: 'POST',
      body: JSON.stringify({
        product_id: Number(product_id),
        quantity:   Number(quantity) || 1,
      }),
    });

    const order = orderRes?.order || orderRes;
    const orderId = order?.id;
    if (!orderId) throw new Error('No se pudo crear la orden.');

    // Guardar conversation_id por si volvemos después de pagar
    try {
      const convId = orderRes?.conversation?.id;
      if (convId) localStorage.setItem('dd_current_payment_conv', String(convId));
    } catch (_) {}

    // 2) + 3) Crear preferencia y redirigir
    await redirectToCheckout(orderId);
  }

  // -------------------------------------------------------
  // Exportar
  // -------------------------------------------------------
  window.DaleDeal = window.DaleDeal || {};
  window.DaleDeal.payments = {
    createPreference,
    getStatus,
    redirectToCheckout,
    buyProductNow,
  };
})();
