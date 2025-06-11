const HomePage = {
  showSortOptions: () => {
    const sortBtn = document.getElementById("sortBtn");
    if (!sortBtn) return;

    // Remover dropdown existente si existe
    const existingDropdown = sortBtn.querySelector(".dropdown-menu");
    if (existingDropdown) {
      existingDropdown.remove();
      return;
    }

    // Crear dropdown dinámicamente
    const dropdown = document.createElement("div");
    dropdown.className = "dropdown-menu show";
    dropdown.style.cssText = `
      position: absolute !important;
      top: 100% !important;
      left: 0 !important;
      right: auto !important;
      z-index: 1000 !important;
      margin-top: 8px;
      min-width: 200px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
      padding: 8px;
    `;

    dropdown.innerHTML = `
      <a class="dropdown-item" href="#" data-sort="relevance">
        <i class="bi bi-star me-2"></i>Más relevantes
      </a>
      <a class="dropdown-item" href="#" data-sort="price-low">
        <i class="bi bi-arrow-up me-2"></i>Menor precio
      </a>
      <a class="dropdown-item" href="#" data-sort="price-high">
        <i class="bi bi-arrow-down me-2"></i>Mayor precio
      </a>
      <a class="dropdown-item" href="#" data-sort="rating">
        <i class="bi bi-star-fill me-2"></i>Mejor valorados
      </a>
      <a class="dropdown-item" href="#" data-sort="newest">
        <i class="bi bi-clock me-2"></i>Más nuevos
      </a>
    `;

    // Posicionar dropdown
    sortBtn.style.position = "relative";
    sortBtn.style.zIndex = "10";
    sortBtn.appendChild(dropdown);

    // Event listeners para opciones
    dropdown.querySelectorAll(".dropdown-item").forEach((item) => {
      item.addEventListener("click", (e) => {
        e.preventDefault();
        const sortType = item.getAttribute("data-sort");
        ProductManager.sortProducts(sortType);
        dropdown.remove();
      });
    });

    // Crear backdrop para cerrar al hacer clic fuera
    const backdrop = document.createElement("div");
    backdrop.className = "dropdown-backdrop";
    backdrop.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 999;
      background: transparent;
    `;
    document.body.appendChild(backdrop);

    // Cerrar al hacer clic en el backdrop
    backdrop.addEventListener("click", () => {
      dropdown.remove();
      backdrop.remove();
    });

    // Cerrar con Escape
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        dropdown.remove();
        backdrop.remove();
        document.removeEventListener("keydown", handleEscape);
      }
    };
    document.addEventListener("keydown", handleEscape);

    // Auto-remover después de 10 segundos
    setTimeout(() => {
      if (dropdown.parentNode) {
        dropdown.remove();
      }
      if (backdrop.parentNode) {
        backdrop.remove();
      }
    }, 10000);
  },
};
