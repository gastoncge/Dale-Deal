/**
 * =====================================================
 * DALE DEAL - Sistema de Dropdowns Unificado
 * =====================================================
 */

class DropdownManager {
  constructor() {
    this.activeDropdowns = new Set();
    this.isInitialized = false;

    this.init();
  }

  // ===== INICIALIZACIÓN =====
  init() {
    if (this.isInitialized) return;

    this.setupBootstrapDropdowns();
    this.setupCustomDropdowns();
    this.setupGlobalHandlers();
    this.isInitialized = true;

    console.log("✅ DropdownManager inicializado");
  }

  // ===== BOOTSTRAP DROPDOWNS =====
  setupBootstrapDropdowns() {
    document.addEventListener("show.bs.dropdown", (event) => {
      const dropdown = event.target;
      const menu = dropdown.querySelector(".dropdown-menu");

      if (menu) {
        this.positionBootstrapDropdown(dropdown, menu);
        this.createBackdrop(menu, dropdown);
        this.activeDropdowns.add(menu);
      }
    });

    document.addEventListener("hide.bs.dropdown", (event) => {
      const dropdown = event.target;
      const menu = dropdown.querySelector(".dropdown-menu");

      if (menu) {
        menu.classList.remove("dropdown-fixed");
        this.activeDropdowns.delete(menu);
        this.removeBackdrop();
      }
    });
  }

  positionBootstrapDropdown(dropdown, menu) {
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

    menu.classList.add("dropdown-fixed");
  }

  // ===== CUSTOM DROPDOWNS =====
  setupCustomDropdowns() {
    // Filter dropdowns
    document.addEventListener("click", (e) => {
      if (
        e.target.matches(".filter-dropdown-trigger, .filter-dropdown-trigger *")
      ) {
        e.preventDefault();
        e.stopPropagation();
        const trigger = e.target.closest(".filter-dropdown-trigger");
        this.toggleFilterDropdown(trigger);
      }
    });
  }


  toggleFilterDropdown(button) {
    // Cerrar otros dropdowns
    this.closeAllCustomDropdowns();

    // Crear dropdown específico según el tipo
    const filterType = button.dataset.filter || "generic";
    const dropdown = this.createFilterDropdown(filterType);
    this.positionDropdown(button, dropdown);
    document.body.appendChild(dropdown);

    // Marcar como activo
    button.classList.add("dropdown-open");
    document.body.classList.add("dropdown-active");
    this.activeDropdowns.add(dropdown);

    // Configurar cierre automático
    this.setupAutoClose(dropdown, button);
  }

  // ===== CREACIÓN DE DROPDOWNS =====

  createFilterDropdown(filterType) {
    const dropdown = document.createElement("div");
    dropdown.className = "filter-dropdown custom-dropdown";
    dropdown.setAttribute("role", "menu");
    dropdown.setAttribute("aria-label", `Opciones de filtro: ${filterType}`);

    // Contenido específico según el tipo de filtro
    const content = this.getFilterContent(filterType);
    dropdown.innerHTML = content;

    // Agregar event listeners
    dropdown.querySelectorAll(".dropdown-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        const filterValue = item.getAttribute("data-filter");
        this.handleFilterSelection(
          filterType,
          filterValue,
          item.textContent.trim()
        );
        this.closeCustomDropdown(
          dropdown,
          document.querySelector(`[data-filter="${filterType}"]`)
        );
      });
    });

    return dropdown;
  }

  getFilterContent(filterType) {
    const filterContents = {
      category: `
        <button class="dropdown-item" data-filter="all" role="menuitem">
          <i class="bi bi-grid"></i>
          Todas las categorías
        </button>
        <button class="dropdown-item" data-filter="electronics" role="menuitem">
          <i class="bi bi-phone"></i>
          Electrónicos
        </button>
        <button class="dropdown-item" data-filter="clothing" role="menuitem">
          <i class="bi bi-bag"></i>
          Ropa
        </button>
        <button class="dropdown-item" data-filter="home" role="menuitem">
          <i class="bi bi-house"></i>
          Hogar
        </button>
      `,
      price: `
        <button class="dropdown-item" data-filter="all" role="menuitem">
          <i class="bi bi-currency-dollar"></i>
          Todos los precios
        </button>
        <button class="dropdown-item" data-filter="0-50000" role="menuitem">
          <i class="bi bi-1-circle"></i>
          Hasta $50.000
        </button>
        <button class="dropdown-item" data-filter="50000-100000" role="menuitem">
          <i class="bi bi-2-circle"></i>
          $50.000 - $100.000
        </button>
        <button class="dropdown-item" data-filter="100000+" role="menuitem">
          <i class="bi bi-3-circle"></i>
          Más de $100.000
        </button>
      `,
      brand: `
        <button class="dropdown-item" data-filter="all" role="menuitem">
          <i class="bi bi-tags"></i>
          Todas las marcas
        </button>
        <button class="dropdown-item" data-filter="apple" role="menuitem">
          <i class="bi bi-apple"></i>
          Apple
        </button>
        <button class="dropdown-item" data-filter="samsung" role="menuitem">
          <i class="bi bi-phone"></i>
          Samsung
        </button>
        <button class="dropdown-item" data-filter="nike" role="menuitem">
          <i class="bi bi-lightning"></i>
          Nike
        </button>
      `,
    };

    return filterContents[filterType] || filterContents.category;
  }

  // ===== POSICIONAMIENTO =====
  positionDropdown(button, dropdown) {
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

  // ===== BACKDROP Y CIERRE =====
  createBackdrop(dropdown, button) {
    this.removeBackdrop();

    const backdrop = document.createElement("div");
    backdrop.className = "dropdown-backdrop";
    backdrop.setAttribute("data-dropdown-backdrop", "true");
    backdrop.style.cssText = `
      position: fixed !important;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 999;
      background: transparent;
      cursor: default;
    `;

    document.body.appendChild(backdrop);

    // Cerrar al hacer clic en el backdrop
    backdrop.addEventListener("click", () => {
      if (dropdown.classList.contains("custom-dropdown")) {
        this.closeCustomDropdown(dropdown, button);
      } else {
        const bsDropdown = bootstrap.Dropdown.getInstance(button);
        if (bsDropdown) {
          bsDropdown.hide();
        }
      }
    });
  }

  removeBackdrop() {
    const backdrop = document.querySelector(".dropdown-backdrop");
    if (backdrop) {
      backdrop.remove();
    }
  }

  setupAutoClose(dropdown, button) {
    this.createBackdrop(dropdown, button);

    // Cerrar con Escape
    const escapeHandler = (e) => {
      if (e.key === "Escape") {
        this.closeCustomDropdown(dropdown, button);
        document.removeEventListener("keydown", escapeHandler);
      }
    };
    document.addEventListener("keydown", escapeHandler);

    // Cerrar al hacer scroll
    const scrollHandler = () => {
      this.closeCustomDropdown(dropdown, button);
      window.removeEventListener("scroll", scrollHandler);
    };
    window.addEventListener("scroll", scrollHandler);

    // Auto-cerrar después de 10 segundos
    setTimeout(() => {
      if (dropdown.parentNode) {
        this.closeCustomDropdown(dropdown, button);
      }
    }, 10000);
  }

  // ===== CIERRE DE DROPDOWNS =====
  closeCustomDropdown(dropdown, button) {
    if (!dropdown || !dropdown.parentNode) return;

    // Animación de cierre
    dropdown.classList.add("dropdown-closing");

    setTimeout(() => {
      // Remover dropdown
      if (dropdown.parentNode) {
        dropdown.remove();
      }

      // Remover backdrop
      this.removeBackdrop();

      // Limpiar clases
      if (button) {
        button.classList.remove("dropdown-open");
      }
      document.body.classList.remove("dropdown-active");

      // Remover de activos
      this.activeDropdowns.delete(dropdown);
    }, 150);
  }

  closeAllCustomDropdowns() {
    const dropdowns = document.querySelectorAll(".custom-dropdown");
    const openButtons = document.querySelectorAll(".dropdown-open");

    dropdowns.forEach((dropdown) => {
      this.activeDropdowns.delete(dropdown);
      dropdown.remove();
    });

    openButtons.forEach((button) => button.classList.remove("dropdown-open"));
    document.body.classList.remove("dropdown-active");
    this.removeBackdrop();
  }

  closeAllDropdowns() {
    // Cerrar dropdowns personalizados
    this.closeAllCustomDropdowns();

    // Cerrar dropdowns de Bootstrap
    const openBootstrapDropdowns = document.querySelectorAll(
      ".dropdown-menu.show"
    );
    openBootstrapDropdowns.forEach((menu) => {
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
  }

  // ===== MANEJADORES GLOBALES =====
  setupGlobalHandlers() {
    // Cerrar dropdowns al cambiar el tamaño de la ventana
    window.addEventListener("resize", () => {
      this.closeAllDropdowns();
    });

    // Cerrar dropdowns al hacer clic en enlaces de navegación
    document.addEventListener("click", (e) => {
      if (e.target.matches("a[href], .nav-link, .navbar-brand")) {
        this.closeAllDropdowns();
      }
    });

    // Cerrar dropdowns al cambiar de página
    window.addEventListener("beforeunload", () => {
      this.closeAllDropdowns();
    });
  }

  // ===== MANEJADORES DE SELECCIÓN =====
  handleSortSelection(sortType, sortText) {
    // Llamar función de ordenamiento si existe
    if (window.ProductManager?.sortProducts) {
      window.ProductManager.sortProducts(sortType);
    } else if (window.HomePage?.sortProducts) {
      window.HomePage.sortProducts(sortType);
    }

    // Mostrar feedback
    this.showFeedback(`Productos ordenados por: ${sortText}`, "info");
  }

  handleFilterSelection(filterType, filterValue, filterText) {
    // Llamar función de filtrado si existe
    if (window.ProductManager?.applyFilter) {
      window.ProductManager.applyFilter(filterType, filterValue);
    } else if (window.HomePage?.applyFilter) {
      window.HomePage.applyFilter(filterType, filterValue);
    }

    // Mostrar feedback
    this.showFeedback(`Filtro aplicado: ${filterText}`, "info");
  }

  // ===== FEEDBACK =====
  showFeedback(message, type = "info") {
    // Usar sistema de notificaciones global si está disponible
    if (window.DaleDeal?.utils?.showNotification) {
      window.DaleDeal.utils.showNotification(message, type);
    } else if (window.authManager?.showNotification) {
      window.authManager.showNotification(message, type);
    } else {
      console.log(message);
    }
  }

  // ===== UTILIDADES PÚBLICAS =====
  isDropdownOpen() {
    return this.activeDropdowns.size > 0;
  }

  getActiveDropdowns() {
    return Array.from(this.activeDropdowns);
  }
}

// ===== INICIALIZACIÓN AUTOMÁTICA =====
let dropdownManager;

function initializeDropdowns() {
  if (!dropdownManager) {
    dropdownManager = new DropdownManager();
  }
}

// Auto-inicializar
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeDropdowns);
} else {
  initializeDropdowns();
}

// Exportar para uso global
window.dropdownManager = dropdownManager;
window.DropdownManager = DropdownManager;

// Exponer funciones para debugging
if (
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
) {
  window.debugDropdowns = {
    closeAll: () => dropdownManager?.closeAllDropdowns(),
    getActive: () => dropdownManager?.getActiveDropdowns(),
  };
}
