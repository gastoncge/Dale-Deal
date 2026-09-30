// =====================================================
// DALE DEAL - Services Data
// =====================================================

// Sin servicios de ejemplo: antes había prestadores inventados ("Alejandro R.",
// 4.9 con 127 reseñas) que aparecían como relacionados en fichas reales.
// Se llena solo con la API (syncServicesFromAPI).
const servicesData = [];

// =====================================================
// SINCRONIZACIÓN CON LA API REAL
// Intenta cargar servicios desde el backend.
// Si la API falla, queda vacío (nunca datos inventados).
// =====================================================
async function syncServicesFromAPI() {
  try {
    if (!window.DaleDeal?.api?.fetchServices) return;
    const apiServices = await window.DaleDeal.api.fetchServices();
    if (apiServices && apiServices.length > 0) {
      // Reemplazar el array con datos reales de la API
      servicesData.length = 0;
      apiServices.forEach(s => servicesData.push(s));
      DaleDeal.log(`✅ services-data.js sincronizado: ${apiServices.length} servicios de la API`);
      // Avisar a la página que los datos están listos
      document.dispatchEvent(new CustomEvent('servicesDataUpdated', { detail: servicesData }));
    }
  } catch (err) {
    DaleDeal.warn('No se pudo sincronizar servicios con la API.', err.message);
  }
}

// Intentar sincronizar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', syncServicesFromAPI);
} else {
  syncServicesFromAPI();
}

// Exportar para uso en otros archivos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { servicesData };
}

window.syncServicesFromAPI = syncServicesFromAPI;
