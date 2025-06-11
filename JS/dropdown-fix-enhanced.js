// =====================================================
// DALE DEAL - Corrección Mejorada de Dropdowns
// =====================================================

document.addEventListener("DOMContentLoaded", () => {
  initializeDropdownFixes();
});

function initializeDropdownFixes() {
  // Configurar dropdowns de Bootstrap
  setupBootstrapDropdowns();

  // Configurar dropdown de ordenamiento personalizado
  setupSortDropdown();

  // Configurar event listeners globales
  setupGlobalDropdownHandlers();

  console.log("✅ Dropdown fixes mejorados inicializados");
}

/**
 * Configurar dropdowns de Bootstrap con posicionamiento fijo
 */
function setupBootstrapDropdowns() {
  // Interceptar todos los dropdowns de Bootstrap
  document.addEventListener("show.bs.dropdown", (event) => {
    const dropdown = event.target;
    const menu = dropdown.querySelector(".dropdown-menu");

    if (menu) {
      // Calcular posición
      const rect = dropdown.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      // Posición inicial
      let top = rect.bottom + 8;
      let right = viewportWidth - rect.right;

      // Ajustar si se sale de la pantalla verticalmente
      if (top + 300 > viewportHeight) {
        top = rect.top - 300 - 8;
      }

      // Ajustar si se sale de la pantalla horizontalmente
      if (right < 16) {
        right = 16;
      }

      // Aplicar posicionamiento fijo
      menu.style.position = "fixed";
      menu.style.top = `${top}px`;
      menu.style.right = `${right}px`;
      menu.style.left = "auto";
      menu.style.zIndex = "1000";
      menu.style.transform = "none";

      // Agregar clase para identificar
      menu.classList.add("dropdown-fixed");

      // Crear backdrop
      createDropdownBackdrop(menu, dropdown);
    }
  });

  // Limpiar al cerrar
  document.addEventListener("hide.bs.dropdown", (event) => {
    const dropdown = event.target;
    const menu = dropdown.querySelector(".dropdown-menu");

    if (menu) {
      menu.classList.remove("dropdown-fixed");
      removeDropdownBackdrop();
    }
  });
}

/**
 * Configurar dropdown de ordenamiento personalizado
 */
function setupSortDropdown() {
  const sortBtn = document.getElementById("sortBtn");
  if (!sortBtn) return;

  sortBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Cerrar otros dropdowns
    closeAllCustomDropdowns();

    // Crear dropdown personalizado
    showSortDropdown(sortBtn);
  });
}

/**
 * Mostrar dropdown de ordenamiento
 */
function showSortDropdown(button) {
  const dropdown = createSortDropdownElement();

  // Posicionar dropdown
  positionDropdown(button, dropdown);

  // Agregar al DOM
  document.body.appendChild(dropdown);

  // Marcar como activo
  button.classList.add("dropdown-open");
  document.body.classList.add("dropdown-active");

  // Crear backdrop
  createDropdownBackdrop(dropdown, button);

  // Auto-cerrar después de 10 segundos
  setTimeout(() => {
    if (dropdown.parentNode) {
      closeCustomDropdown(dropdown, button);
    }
  }, 10000);
}

/**
 * Crear elemento dropdown de ordenamiento
 */
function createSortDropdownElement() {
  const dropdown = document.createElement("div");
  dropdown.className = "sort-dropdown custom-dropdown";
  dropdown.setAttribute("role", "menu");
  dropdown.setAttribute("aria-label", "Opciones de ordenamiento");

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

  // Agregar event listeners
  dropdown.querySelectorAll(".dropdown-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();

      const sortType = item.getAttribute("data-sort");

      // Llamar función de ordenamiento si existe
      if (
        typeof ProductManager !== "undefined" &&
        ProductManager.sortProducts
      ) {
        ProductManager.sortProducts(sortType);
      }

      // Cerrar dropdown
      closeCustomDropdown(dropdown, document.getElementById("sortBtn"));

      // Mostrar feedback
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
 * Posicionar dropdown relativo al botón
 */
function positionDropdown(button, dropdown) {
  const rect = button.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;

  // Posición inicial
  let top = rect.bottom + 8;
  let left = rect.left;

  // Ajustar si se sale de la pantalla verticalmente
  if (top + 250 > viewportHeight) {
    top = rect.top - 250 - 8;
  }

  // Ajustar si se sale de la pantalla horizontalmente
  if (left + 220 > viewportWidth) {
    left = viewportWidth - 220 - 16;
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
 * Crear backdrop para cerrar dropdown
 */
function createDropdownBackdrop(dropdown, button) {
  // Remover backdrop existente
  removeDropdownBackdrop();

  const backdrop = document.createElement("div");
  backdrop.className = "dropdown-backdrop";
  backdrop.setAttribute("data-dropdown-backdrop", "true");

  document.body.appendChild(backdrop);

  // Cerrar al hacer clic en el backdrop
  backdrop.addEventListener("click", () => {
    if (dropdown.classList.contains("custom-dropdown")) {
      closeCustomDropdown(dropdown, button);
    } else {
      // Para dropdowns de Bootstrap
      const bsDropdown = bootstrap.Dropdown.getInstance(button);
      if (bsDropdown) {
        bsDropdown.hide();
      }
    }
  });

  // Cerrar con Escape
  const escapeHandler = (e) => {
    if (e.key === "Escape") {
      if (dropdown.classList.contains("custom-dropdown")) {
        closeCustomDropdown(dropdown, button);
      } else {
        const bsDropdown = bootstrap.Dropdown.getInstance(button);
        if (bsDropdown) {
          bsDropdown.hide();
        }
      }
      document.removeEventListener("keydown", escapeHandler);
    }
  };
  document.addEventListener("keydown", escapeHandler);

  // Cerrar al hacer scroll
  const scrollHandler = () => {
    if (dropdown.classList.contains("custom-dropdown")) {
      closeCustomDropdown(dropdown, button);
    } else {
      const bsDropdown = bootstrap.Dropdown.getInstance(button);
      if (bsDropdown) {
        bsDropdown.hide();
      }
    }
    window.removeEventListener("scroll", scrollHandler);
  };
  window.addEventListener("scroll", scrollHandler);
}

/**
 * Remover backdrop
 */
function removeDropdownBackdrop() {
  const backdrop = document.querySelector(".dropdown-backdrop");
  if (backdrop) {
    backdrop.remove();
  }
}

/**
 * Cerrar dropdown personalizado
 */
function closeCustomDropdown(dropdown, button) {
  if (!dropdown || !dropdown.parentNode) return;

  // Animación de cierre
  dropdown.classList.add("dropdown-closing");

  setTimeout(() => {
    // Remover dropdown
    if (dropdown.parentNode) {
      dropdown.remove();
    }

    // Remover backdrop
    removeDropdownBackdrop();

    // Limpiar clases
    if (button) {
      button.classList.remove("dropdown-open");
    }
    document.body.classList.remove("dropdown-active");
  }, 150);
}

/**
 * Cerrar todos los dropdowns personalizados
 */
function closeAllCustomDropdowns() {
  const dropdowns = document.querySelectorAll(".custom-dropdown");
  const openButtons = document.querySelectorAll(".dropdown-open");

  dropdowns.forEach((dropdown) => dropdown.remove());
  openButtons.forEach((button) => button.classList.remove("dropdown-open"));
  document.body.classList.remove("dropdown-active");
  removeDropdownBackdrop();
}

/**
 * Configurar manejadores globales
 */
function setupGlobalDropdownHandlers() {
  // Cerrar dropdowns al cambiar el tamaño de la ventana
  window.addEventListener("resize", () => {
    closeAllCustomDropdowns();
    // También cerrar dropdowns de Bootstrap
    const openDropdowns = document.querySelectorAll(".dropdown-menu.show");
    openDropdowns.forEach((menu) => {
      const button = menu
        .closest(".dropdown")
        .querySelector('[data-bs-toggle="dropdown"]');
      if (button) {
        const bsDropdown = bootstrap.Dropdown.getInstance(button);
        if (bsDropdown) {
          bsDropdown.hide();
        }
      }
    });
  });

  // Cerrar dropdowns al hacer clic en enlaces de navegación
  document.addEventListener("click", (e) => {
    if (e.target.matches("a[href], .nav-link, .navbar-brand")) {
      closeAllCustomDropdowns();
    }
  });
}

/**
 * Mostrar feedback del ordenamiento
 */
function showSortFeedback(sortText) {
  // Usar sistema de notificaciones si está disponible
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

// Exponer funciones para debugging
if (
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
) {
  window.debugDropdowns = {
    closeAll: closeAllCustomDropdowns,
    showSort: () => showSortDropdown(document.getElementById("sortBtn")),
  };
}

// Definir variables globales para evitar errores
window.ProductManager = window.ProductManager || {};
window.NotificationManager = window.NotificationManager || {};
window.bootstrap = window.bootstrap || {};
