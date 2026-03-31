// =====================================================
// DALE DEAL – Demo Adapter
// Centraliza toda la lógica de simulación para que
// sea fácil de reemplazar cuando haya un backend real.
// =====================================================

const DemoAdapter = (() => {

  /**
   * Simula latencia de red sin errores aleatorios.
   * Reemplazar por la llamada real al backend.
   */
  function demoDelay(ms = 800) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Muestra una notificación usando el sistema centralizado de DaleDeal.
   * Fallback a un banner inline en #alertContainer.
   */
  function notify(message, type = 'info') {
    if (window.DaleDeal?.utils?.showNotification) {
      window.DaleDeal.utils.showNotification(message, type);
      return;
    }
    if (window.authManager?.showNotification) {
      window.authManager.showNotification(message, type);
      return;
    }
    // Last-resort: banner inline
    const container = document.getElementById('alertContainer');
    if (!container) return;
    const el = document.createElement('div');
    el.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show`;
    el.setAttribute('role', 'alert');
    el.innerHTML = `${message}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>`;
    container.appendChild(el);
    setTimeout(() => el.remove(), 6000);
  }

  /**
   * Notifica honestamente que una acción no está implementada en modo demo.
   * @param {string} label – Nombre legible de la acción o función.
   */
  function notifyUnimplemented(label = 'Esta función') {
    notify(`${label} no está disponible en la versión demo.`, 'warning');
  }

  return { demoDelay, notify, notifyUnimplemented };
})();

window.DemoAdapter = DemoAdapter;
