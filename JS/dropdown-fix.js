/**
 * =====================================================
 * DALE DEAL - Sistema de Dropdowns (Bootstrap)
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
    this.setupGlobalHandlers();
    this.isInitialized = true;

    DaleDeal.log("✅ DropdownManager inicializado");
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
        ["position", "top", "right", "left", "transform", "bottom"].forEach(
          (p) => menu.style.removeProperty(p)
        );
        menu.classList.remove("dropdown-fixed");
        this.activeDropdowns.delete(menu);
        this.removeBackdrop();
      }
    });
  }

  positionBootstrapDropdown(dropdown, menu) {
    const toggle =
      dropdown.querySelector('[data-bs-toggle="dropdown"]') || dropdown;
    const rect = toggle.getBoundingClientRect();

    const navbar = toggle.closest("nav") || document.querySelector("#mainNavbar, nav.navbar");
    const anchorBottom = navbar ? navbar.getBoundingClientRect().bottom : rect.bottom;

    const vw = window.innerWidth;
    const top = anchorBottom + 6;

    let right = vw - rect.right;
    if (right < 8) right = 8;

    menu.style.setProperty("position", "fixed", "important");
    menu.style.setProperty("top", `${top}px`, "important");
    menu.style.setProperty("right", `${right}px`, "important");
    menu.style.setProperty("left", "auto", "important");
    menu.style.setProperty("transform", "none", "important");
    menu.style.setProperty("bottom", "auto", "important");
    menu.classList.add("dropdown-fixed");
  }

  createBackdrop(dropdown, button) {
    this.removeBackdrop();

    const backdrop = document.createElement("div");
    backdrop.className = "dropdown-backdrop";
    backdrop.setAttribute("data-dropdown-backdrop", "true");
    const bgColor = window.innerWidth < 768 ? "rgba(0,0,0,0.45)" : "transparent";
    backdrop.style.cssText = `
      position: fixed !important;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 999;
      background: ${bgColor};
      cursor: default;
    `;

    document.body.appendChild(backdrop);

    backdrop.addEventListener("click", () => {
      const bsDropdown = bootstrap.Dropdown.getInstance(button);
      if (bsDropdown) {
        bsDropdown.hide();
      }
    });
  }

  removeBackdrop() {
    const backdrop = document.querySelector(".dropdown-backdrop");
    if (backdrop) {
      backdrop.remove();
    }
  }

  closeAllDropdowns() {
    const openBootstrapDropdowns = document.querySelectorAll(".dropdown-menu.show");
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
    window.addEventListener("resize", () => {
      this.closeAllDropdowns();
    });

    document.addEventListener("click", (e) => {
      if (e.target.matches("a[href], .nav-link, .navbar-brand")) {
        this.closeAllDropdowns();
      }
    });

    window.addEventListener("beforeunload", () => {
      this.closeAllDropdowns();
    });
  }

}

// ===== INICIALIZACIÓN AUTOMÁTICA =====
let dropdownManager;

function initializeDropdowns() {
  if (!dropdownManager) {
    dropdownManager = new DropdownManager();
    window.dropdownManager = dropdownManager;
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeDropdowns);
} else {
  initializeDropdowns();
}

window.DropdownManager = DropdownManager;
