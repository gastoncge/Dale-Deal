// =====================================================
// DALE DEAL - Corrección de Dropdown de Ordenamiento
// =====================================================

// Assuming ProductManager is defined elsewhere, but for the sake of this isolated code, we'll define it as an empty object.
// This resolves the "noUndeclaredVariables" error.
var ProductManager = ProductManager || {};

/**
 * =====================================================
 * DALE DEAL - Corrección de Dropdown de Ordenamiento
 * =====================================================
 */

// Esperar a que el DOM esté cargado
document.addEventListener("DOMContentLoaded", () => {
  initializeDropdownFixes();
});

function initializeDropdownFixes() {
  // Reemplazar la función showSortOptions existente
  if (typeof ProductManager !== "undefined" && ProductManager.showSortOptions) {
    ProductManager.showSortOptions = showSortOptionsFixed;
  }

  // Configurar event listeners globales
  setupGlobalDropdownHandlers();

  console.log("✅ Dropdown fixes inicializados correctamente");
}

/**
 * Versión corregida de showSortOptions con z-index apropiado
 */
function showSortOptionsFixed() {
  const sortBtn = document.getElementById("sortBtn");
  if (!sortBtn) return;

  // Cerrar cualquier dropdown existente
  closeAllDropdowns();

  // Crear el dropdown
  const dropdown = createSortDropdown();

  // Posicionar el dropdown
  positionDropdown(sortBtn, dropdown);

  // Agregar al DOM
  document.body.appendChild(dropdown);

  // Marcar como activo
  sortBtn.classList.add("dropdown-open");
  document.body.classList.add("dropdown-active");

  // Configurar cierre automático
  setupDropdownAutoClose(dropdown, sortBtn);

  // Auto-cerrar después de 10 segundos
  setTimeout(() => {
    if (dropdown.parentNode) {
      closeDropdown(dropdown, sortBtn);
    }
  }, 10000);
}

/**
 * Crear el elemento dropdown con estilos apropiados
 */
function createSortDropdown() {
  const dropdown = document.createElement("div");
  dropdown.className = "sort-dropdown dynamic-dropdown";
  dropdown.setAttribute("role", "menu");
  dropdown.setAttribute("aria-label", "Opciones de ordenamiento");

  // Crear backdrop
  const backdrop = document.createElement("div");
  backdrop.className = "dropdown-backdrop";
  backdrop.setAttribute("data-dropdown-backdrop", "true");
  document.body.appendChild(backdrop);

  dropdown.innerHTML = `
    <button class="dropdown-item" data-sort="relevance" role="menuitem">
      <i class="bi bi-star"></i>
      Más relevantes
    </button>
    <button class="dropdown-item" data-sort="price-low" role="menuitem">
      <i class="bi bi-arrow-up"></i>
      Menor precio
    </button>
    <button class="dropdown-item" data-sort="price-high" role="menuitem">
      <i class="bi bi-arrow-down"></i>
      Mayor precio
    </button>
    <button class="dropdown-item" data-sort="rating" role="menuitem">
      <i class="bi bi-star-fill"></i>
      Mejor valorados
    </button>
    <button class="dropdown-item" data-sort="newest" role="menuitem">
      <i class="bi bi-clock"></i>
      Más nuevos
    </button>
  `;

  // Agregar event listeners a los items
  dropdown.querySelectorAll(".dropdown-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const sortType = item.getAttribute("data-sort");

      // Llamar a la función de ordenamiento original
      if (
        typeof ProductManager !== "undefined" &&
        ProductManager.sortProducts
      ) {
        ProductManager.sortProducts(sortType);
      }

      // Cerrar dropdown
      closeDropdown(dropdown, document.getElementById("sortBtn"));

      // Mostrar feedback visual
      showSortFeedback(item.textContent.trim());
    });

    // Soporte para teclado
    item.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        item.click();
      }
    });
  });

  return dropdown;
}

/**
 * Posicionar el dropdown relativo al botón
 */
function positionDropdown(button, dropdown) {
  const rect = button.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;

  // Posición inicial
  let top = rect.bottom + 8;
  let left = rect.left;

  // Ajustar si se sale de la pantalla verticalmente
  if (top + 200 > viewportHeight) {
    top = rect.top - 200 - 8;
  }

  // Ajustar si se sale de la pantalla horizontalmente
  if (left + 200 > viewportWidth) {
    left = viewportWidth - 200 - 16;
  }

  // Asegurar que no se salga por la izquierda
  if (left < 16) {
    left = 16;
  }

  dropdown.style.position = "fixed";
  dropdown.style.top = `${top}px`;
  dropdown.style.left = `${left}px`;
  dropdown.style.zIndex = "1000";
}

/**
 * Configurar cierre automático del dropdown
 */
function setupDropdownAutoClose(dropdown, button) {
  const backdrop = document.querySelector(".dropdown-backdrop");

  // Cerrar al hacer clic en el backdrop
  if (backdrop) {
    backdrop.addEventListener("click", () => {
      closeDropdown(dropdown, button);
    });
  }

  // Cerrar con Escape
  const escapeHandler = (e) => {
    if (e.key === "Escape") {
      closeDropdown(dropdown, button);
      document.removeEventListener("keydown", escapeHandler);
    }
  };
  document.addEventListener("keydown", escapeHandler);

  // Cerrar al hacer scroll
  const scrollHandler = () => {
    closeDropdown(dropdown, button);
    window.removeEventListener("scroll", scrollHandler);
  };
  window.addEventListener("scroll", scrollHandler);
}

/**
 * Cerrar un dropdown específico
 */
function closeDropdown(dropdown, button) {
  if (!dropdown || !dropdown.parentNode) return;

  // Animación de cierre
  dropdown.classList.add("dropdown-closing");

  setTimeout(() => {
    // Remover dropdown
    if (dropdown.parentNode) {
      dropdown.remove();
    }

    // Remover backdrop
    const backdrop = document.querySelector(".dropdown-backdrop");
    if (backdrop) {
      backdrop.remove();
    }

    // Limpiar clases
    if (button) {
      button.classList.remove("dropdown-open");
    }
    document.body.classList.remove("dropdown-active");
  }, 150);
}

/**
 * Cerrar todos los dropdowns abiertos
 */
function closeAllDropdowns() {
  const dropdowns = document.querySelectorAll(".dynamic-dropdown");
  const backdrops = document.querySelectorAll(".dropdown-backdrop");
  const openButtons = document.querySelectorAll(".dropdown-open");

  dropdowns.forEach((dropdown) => dropdown.remove());
  backdrops.forEach((backdrop) => backdrop.remove());
  openButtons.forEach((button) => button.classList.remove("dropdown-open"));
  document.body.classList.remove("dropdown-active");
}

/**
 * Configurar manejadores globales
 */
function setupGlobalDropdownHandlers() {
  // Cerrar dropdowns al cambiar el tamaño de la ventana
  window.addEventListener("resize", closeAllDropdowns);

  // Cerrar dropdowns al hacer clic en enlaces de navegación
  document.addEventListener("click", (e) => {
    if (e.target.matches("a[href], .nav-link, .navbar-brand")) {
      closeAllDropdowns();
    }
  });
}

/**
 * Mostrar feedback visual del ordenamiento seleccionado
 */
function showSortFeedback(sortText) {
  // Usar el sistema de notificaciones existente si está disponible
  if (typeof NotificationManager !== "undefined" && NotificationManager.show) {
    NotificationManager.show(
      {
        id: Date.now().toString(),
        type: "info",
        title: "Ordenamiento aplicado",
        message: `Productos ordenados por: ${sortText}`,
        timestamp: new Date().toISOString(),
      },
      3000
    );
  } else {
    // Fallback simple
    console.log(`Productos ordenados por: ${sortText}`);
  }
}

/**
 * Función de utilidad para debugging
 */
function debugDropdownZIndex() {
  document.body.classList.toggle("debug-zindex");
}

// Exponer funciones para debugging en desarrollo
if (
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
) {
  window.debugDropdown = debugDropdownZIndex;
  window.closeAllDropdowns = closeAllDropdowns;
}

// Define NotificationManager as an empty object to avoid the "noUndeclaredVariables" error.
var NotificationManager = NotificationManager || {};
