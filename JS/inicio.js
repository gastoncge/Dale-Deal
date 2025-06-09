/**
 * =====================================================
 * DALE DEAL - Main JavaScript File
 * Funcionalidades completas del marketplace
 * =====================================================
 */

// =====================================================
// CONFIGURACIÓN Y VARIABLES GLOBALES
// =====================================================

const CONFIG = {
  PRODUCTS_PER_PAGE: 12,
  SEARCH_DELAY: 300,
  API_BASE_URL: "https://fakestoreapi.com", // API de ejemplo
  ANIMATIONS: {
    FADE_DURATION: 300,
    SLIDE_DURATION: 400,
  },
};

// Estado global de la aplicación
const AppState = {
  products: [],
  filteredProducts: [],
  currentCategory: "all",
  currentPage: 1,
  isLoading: false,
  cart: JSON.parse(localStorage.getItem("daledealer_cart") || "[]"),
  notifications: JSON.parse(
    localStorage.getItem("daledealer_notifications") || "[]"
  ),
  searchQuery: "",
  sortBy: "relevance",
};

// =====================================================
// DATOS DE EJEMPLO (PRODUCTOS MOCK)
// =====================================================

const MOCK_PRODUCTS = [
  {
    id: 1,
    title: "iPhone 15 Pro Max 256GB",
    description:
      "El iPhone más avanzado con chip A17 Pro, cámara de 48MP y pantalla Super Retina XDR de 6.7 pulgadas.",
    price: 1299999,
    originalPrice: 1499999,
    image:
      "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&h=400&fit=crop",
    category: "electronics",
    badge: "sale",
    rating: 4.8,
    reviewCount: 2847,
    inStock: true,
    discount: 13,
  },
  {
    id: 2,
    title: 'MacBook Air M2 13" 256GB',
    description:
      "Ultrabook con chip M2, pantalla Liquid Retina de 13.6 pulgadas y hasta 18 horas de batería.",
    price: 1199999,
    originalPrice: null,
    image:
      "https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400&h=400&fit=crop",
    category: "electronics",
    badge: "new",
    rating: 4.9,
    reviewCount: 1523,
    inStock: true,
    discount: 0,
  },
  {
    id: 3,
    title: "Zapatillas Nike Air Max 270",
    description:
      "Zapatillas deportivas con tecnología Air Max, diseño moderno y máxima comodidad para el día a día.",
    price: 89999,
    originalPrice: 109999,
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop",
    category: "fashion",
    badge: "sale",
    rating: 4.6,
    reviewCount: 892,
    inStock: true,
    discount: 18,
  },
  {
    id: 4,
    title: 'Samsung 65" QLED 4K Smart TV',
    description:
      "Smart TV 65 pulgadas con tecnología QLED, resolución 4K y sistema operativo Tizen con apps integradas.",
    price: 799999,
    originalPrice: 899999,
    image:
      "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=400&fit=crop",
    category: "electronics",
    badge: "sale",
    rating: 4.7,
    reviewCount: 1245,
    inStock: true,
    discount: 11,
  },
  {
    id: 5,
    title: "Silla Ergonómica de Oficina",
    description:
      "Silla de oficina con soporte lumbar, reposabrazos ajustables y base de aluminio. Perfecta para trabajo remoto.",
    price: 149999,
    originalPrice: null,
    image:
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop",
    category: "home",
    badge: null,
    rating: 4.4,
    reviewCount: 567,
    inStock: true,
    discount: 0,
  },
  {
    id: 6,
    title: "Auriculares Sony WH-1000XM5",
    description:
      "Auriculares inalámbricos con cancelación de ruido líder en la industria y 30 horas de batería.",
    price: 299999,
    originalPrice: 349999,
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop",
    category: "electronics",
    badge: "sale",
    rating: 4.9,
    reviewCount: 1876,
    inStock: true,
    discount: 14,
  },
  {
    id: 7,
    title: "Pelota de Fútbol FIFA Quality",
    description:
      "Pelota oficial de fútbol con certificación FIFA Quality, perfecta para partidos profesionales y amateur.",
    price: 25999,
    originalPrice: null,
    image:
      "https://images.unsplash.com/photo-1575077915200-a9e4da2b6e1e?w=400&h=400&fit=crop",
    category: "sports",
    badge: null,
    rating: 4.3,
    reviewCount: 234,
    inStock: true,
    discount: 0,
  },
  {
    id: 8,
    title: "El Arte de la Guerra - Sun Tzu",
    description:
      "Libro clásico de estrategia militar y empresarial. Edición especial con comentarios modernos.",
    price: 12999,
    originalPrice: 15999,
    image:
      "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=400&fit=crop",
    category: "books",
    badge: "sale",
    rating: 4.8,
    reviewCount: 456,
    inStock: true,
    discount: 19,
  },
  {
    id: 9,
    title: "Campera de Cuero Genuino",
    description:
      "Campera de cuero 100% genuino, diseño clásico atemporal. Disponible en negro y marrón.",
    price: 189999,
    originalPrice: null,
    image:
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop",
    category: "fashion",
    badge: "new",
    rating: 4.7,
    reviewCount: 328,
    inStock: true,
    discount: 0,
  },
  {
    id: 10,
    title: "Cafetera Espresso Automática",
    description:
      "Cafetera espresso con molinillo integrado, vaporizador de leche y pantalla táctil. 15 bares de presión.",
    price: 459999,
    originalPrice: 519999,
    image:
      "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400&h=400&fit=crop",
    category: "home",
    badge: "sale",
    rating: 4.6,
    reviewCount: 789,
    inStock: true,
    discount: 12,
  },
  {
    id: 11,
    title: "Bicicleta Mountain Bike 21V",
    description:
      "Bicicleta todo terreno con 21 velocidades, frenos de disco y suspensión delantera. Rodado 26.",
    price: 299999,
    originalPrice: 349999,
    image:
      "https://images.unsplash.com/photo-1558618047-dcd1c4c6a4f3?w=400&h=400&fit=crop",
    category: "sports",
    badge: "sale",
    rating: 4.5,
    reviewCount: 445,
    inStock: true,
    discount: 14,
  },
  {
    id: 12,
    title: "Colección Harry Potter (7 libros)",
    description:
      "Colección completa de Harry Potter en español. Edición especial con tapas duras y ilustraciones.",
    price: 89999,
    originalPrice: 109999,
    image:
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=400&fit=crop",
    category: "books",
    badge: "sale",
    rating: 4.9,
    reviewCount: 1234,
    inStock: true,
    discount: 18,
  },
];

// =====================================================
// UTILIDADES
// =====================================================

const Utils = {
  // Formatear precio en pesos argentinos
  formatPrice: (price) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  },

  // Debounce para optimizar búsquedas
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Generar estrellas de rating
  generateStars: (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let starsHTML = "";

    for (let i = 0; i < fullStars; i++) {
      starsHTML += '<i class="bi bi-star-fill"></i>';
    }

    if (hasHalfStar) {
      starsHTML += '<i class="bi bi-star-half"></i>';
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      starsHTML += '<i class="bi bi-star"></i>';
    }

    return starsHTML;
  },

  // Animaciones suaves
  fadeIn: (element, duration = CONFIG.ANIMATIONS.FADE_DURATION) => {
    element.style.opacity = "0";
    element.style.display = "block";

    let opacity = 0;
    const timer = setInterval(() => {
      opacity += 50 / duration;
      if (opacity >= 1) {
        clearInterval(timer);
        opacity = 1;
      }
      element.style.opacity = opacity;
    }, 50);
  },

  fadeOut: (element, duration = CONFIG.ANIMATIONS.FADE_DURATION) => {
    let opacity = 1;
    const timer = setInterval(() => {
      opacity -= 50 / duration;
      if (opacity <= 0) {
        clearInterval(timer);
        element.style.display = "none";
        opacity = 0;
      }
      element.style.opacity = opacity;
    }, 50);
  },

  // Scroll suave
  smoothScrollTo: (element) => {
    element.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  },

  // Generar ID único
  generateId: () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },
};

// =====================================================
// MANEJO DE PRODUCTOS
// =====================================================

const ProductManager = {
  // Inicializar productos
  init: () => {
    AppState.products = [...MOCK_PRODUCTS];
    AppState.filteredProducts = [...MOCK_PRODUCTS];
    ProductManager.renderProducts();
    ProductManager.setupFilters();
  },

  // Renderizar productos en el grid
  renderProducts: (products = AppState.filteredProducts, append = false) => {
    const grid = document.getElementById("productsGrid");
    const loadingContainer = document.getElementById("loadingContainer");
    const loadMoreContainer = document.getElementById("loadMoreContainer");

    // Ocultar loading
    if (loadingContainer) {
      loadingContainer.style.display = "none";
    }

    // Si no es append, limpiar grid
    if (!append) {
      grid.innerHTML = "";
    }

    // Si no hay productos
    if (products.length === 0) {
      if (!append) {
        grid.innerHTML = `
          <div class="col-12 text-center py-5">
            <i class="bi bi-search display-1 text-muted mb-3"></i>
            <h3 class="text-muted">No se encontraron productos</h3>
            <p class="text-muted">Intenta cambiar los filtros o términos de búsqueda</p>
          </div>
        `;
      }
      if (loadMoreContainer) {
        loadMoreContainer.style.display = "none";
      }
      return;
    }

    // Renderizar productos con paginación
    const startIndex = append
      ? AppState.currentPage * CONFIG.PRODUCTS_PER_PAGE
      : 0;
    const endIndex = startIndex + CONFIG.PRODUCTS_PER_PAGE;
    const productsToShow = products.slice(startIndex, endIndex);

    productsToShow.forEach((product, index) => {
      const productCard = ProductManager.createProductCard(product);
      productCard.style.animationDelay = `${index * 0.1}s`;
      grid.appendChild(productCard);
    });

    // Mostrar/ocultar botón "Cargar más"
    if (loadMoreContainer) {
      const hasMore = endIndex < products.length;
      loadMoreContainer.style.display = hasMore ? "block" : "none";
    }

    // Actualizar página actual si es append
    if (append) {
      AppState.currentPage++;
    }
  },

  // Crear card de producto
  createProductCard: (product) => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.setAttribute("data-aos", "fade-up");

    const discountPercent = product.originalPrice
      ? Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) *
            100
        )
      : 0;

    card.innerHTML = `
      <div class="product-image-container">
        <img src="${product.image}" alt="${
      product.title
    }" class="product-image" loading="lazy">
        ${
          product.badge
            ? `<span class="product-badge ${product.badge}">${
                product.badge === "sale" ? `${discountPercent}% OFF` : "NUEVO"
              }</span>`
            : ""
        }
        <div class="product-overlay">
          <button class="quick-view" onclick="ProductManager.showProductModal(${
            product.id
          })">
            Vista rápida
          </button>
        </div>
      </div>
      <div class="product-info">
        <h3 class="product-title">${product.title}</h3>
        <p class="product-description">${product.description}</p>
        <div class="product-price">
          <span class="current-price">${Utils.formatPrice(product.price)}</span>
          ${
            product.originalPrice
              ? `<span class="original-price">${Utils.formatPrice(
                  product.originalPrice
                )}</span>`
              : ""
          }
        </div>
        <div class="product-rating">
          ${Utils.generateStars(product.rating)}
          <span class="rating-count">(${product.reviewCount})</span>
        </div>
      </div>
    `;

    // Event listener para abrir modal
    card.addEventListener("click", (e) => {
      if (!e.target.closest(".quick-view")) {
        // Si el producto es el iPhone (por su ID, nombre o ambos), redirige
        if (product.id === 1 || product.title.includes("iPhone")) {
          window.location.href = "../HTML/producto.html";
        } else {
          ProductManager.showProductModal(product.id);
        }
      }
    });

    return card;
  },

  // Mostrar modal de producto
  showProductModal: (productId) => {
    const product = AppState.products.find((p) => p.id === productId);
    if (!product) return;

    const modalBody = document.getElementById("productModalBody");
    const modal = new bootstrap.Modal(document.getElementById("productModal"));

    modalBody.innerHTML = `
      <div class="row">
        <div class="col-md-6">
          <div class="product-image-container mb-3">
            <img src="${product.image}" alt="${
      product.title
    }" class="img-fluid rounded-3">
            ${
              product.badge
                ? `<span class="product-badge ${product.badge}">${
                    product.badge === "sale" ? "OFERTA" : "NUEVO"
                  }</span>`
                : ""
            }
          </div>
        </div>
        <div class="col-md-6">
          <div class="product-details">
            <h2 class="product-title mb-3">${product.title}</h2>
            <div class="product-rating mb-3">
              ${Utils.generateStars(product.rating)}
              <span class="rating-count ms-2">(${
                product.reviewCount
              } reseñas)</span>
            </div>
            <div class="product-price mb-4">
              <span class="current-price display-6 text-primary fw-bold">${Utils.formatPrice(
                product.price
              )}</span>
              ${
                product.originalPrice
                  ? `
                <div class="mt-2">
                  <span class="original-price text-muted text-decoration-line-through">${Utils.formatPrice(
                    product.originalPrice
                  )}</span>
                  <span class="badge bg-success ms-2">${Math.round(
                    ((product.originalPrice - product.price) /
                      product.originalPrice) *
                      100
                  )}% OFF</span>
                </div>
              `
                  : ""
              }
            </div>
            <div class="product-description mb-4">
              <h5>Descripción</h5>
              <p class="text-muted">${product.description}</p>
            </div>
            <div class="product-actions">
              <div class="d-flex gap-3 mb-3">
                <div class="quantity-selector">
                  <label class="form-label">Cantidad</label>
                  <div class="input-group" style="width: 120px;">
                    <button class="btn btn-outline-secondary" type="button" onclick="ProductManager.changeQuantity(-1)">-</button>
                    <input type="number" class="form-control text-center" value="1" min="1" id="productQuantity">
                    <button class="btn btn-outline-secondary" type="button" onclick="ProductManager.changeQuantity(1)">+</button>
                  </div>
                </div>
              </div>
              <div class="d-grid gap-2">
                <button class="btn btn-primary btn-lg" onclick="CartManager.addToCart(${
                  product.id
                })">
                  <i class="bi bi-cart-plus me-2"></i>Agregar al carrito
                </button>
                <button class="btn btn-outline-primary">
                  <i class="bi bi-heart me-2"></i>Agregar a favoritos
                </button>
              </div>
            </div>
            <div class="product-info mt-4">
              <div class="d-flex align-items-center mb-2">
                <i class="bi bi-truck text-success me-2"></i>
                <span class="text-success">Envío gratis a todo el país</span>
              </div>
              <div class="d-flex align-items-center mb-2">
                <i class="bi bi-shield-check text-primary me-2"></i>
                <span>Garantía oficial del fabricante</span>
              </div>
              <div class="d-flex align-items-center">
                <i class="bi bi-arrow-return-left text-info me-2"></i>
                <span>30 días para devoluciones</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    modal.show();
  },

  // Cambiar cantidad en modal
  changeQuantity: (change) => {
    const input = document.getElementById("productQuantity");
    if (!input) return;

    const currentValue = parseInt(input.value) || 1;
    const newValue = Math.max(1, currentValue + change);
    input.value = newValue;
  },

  // Configurar filtros
  setupFilters: () => {
    // Filtros por categoría
    const filterTabs = document.querySelectorAll(".filter-tab");
    filterTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        // Actualizar estado activo
        filterTabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");

        // Filtrar productos
        const category = tab.getAttribute("data-category");
        ProductManager.filterByCategory(category);
      });
    });

    // Botón de ordenar
    const sortBtn = document.getElementById("sortBtn");
    if (sortBtn) {
      sortBtn.addEventListener("click", ProductManager.showSortOptions);
    }

    // Botón de filtros adicionales
    const filterBtn = document.getElementById("filterBtn");
    if (filterBtn) {
      filterBtn.addEventListener("click", ProductManager.showFilterOptions);
    }
  },

  // Filtrar por categoría
  filterByCategory: (category) => {
    AppState.currentCategory = category;
    AppState.currentPage = 1;

    if (category === "all") {
      AppState.filteredProducts = [...AppState.products];
    } else {
      AppState.filteredProducts = AppState.products.filter(
        (product) => product.category === category
      );
    }

    // Aplicar búsqueda si existe
    if (AppState.searchQuery) {
      ProductManager.applySearch();
    } else {
      ProductManager.renderProducts();
    }
  },

  // Mostrar opciones de ordenamiento
  showSortOptions: () => {
    const sortBtn = document.getElementById("sortBtn");

    // Crear dropdown dinámicamente
    const dropdown = document.createElement("div");
    dropdown.className = "dropdown-menu show";
    dropdown.style.position = "absolute";
    dropdown.style.top = "100%";
    dropdown.style.left = "0";
    dropdown.style.zIndex = "1000";

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

    // Cerrar al hacer clic fuera
    setTimeout(() => {
      document.addEventListener("click", function closeDropdown(e) {
        if (!sortBtn.contains(e.target)) {
          dropdown.remove();
          document.removeEventListener("click", closeDropdown);
        }
      });
    }, 100);
  },

  // Ordenar productos
  sortProducts: (sortType) => {
    AppState.sortBy = sortType;

    switch (sortType) {
      case "price-low":
        AppState.filteredProducts.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        AppState.filteredProducts.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        AppState.filteredProducts.sort((a, b) => b.rating - a.rating);
        break;
      case "newest":
        AppState.filteredProducts.sort((a, b) => b.id - a.id);
        break;
      default:
        // Mantener orden original (relevancia)
        break;
    }

    AppState.currentPage = 1;
    ProductManager.renderProducts();
  },

  // Aplicar búsqueda
  applySearch: () => {
    const query = AppState.searchQuery.toLowerCase();

    let baseProducts =
      AppState.currentCategory === "all"
        ? AppState.products
        : AppState.products.filter(
            (p) => p.category === AppState.currentCategory
          );

    if (query) {
      AppState.filteredProducts = baseProducts.filter(
        (product) =>
          product.title.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query) ||
          product.category.toLowerCase().includes(query)
      );
    } else {
      AppState.filteredProducts = baseProducts;
    }

    AppState.currentPage = 1;
    ProductManager.renderProducts();
  },
};

// =====================================================
// MANEJO DE BÚSQUEDA
// =====================================================

const SearchManager = {
  init: () => {
    const searchInput = document.getElementById("searchInput");
    if (!searchInput) return;

    // Debounced search
    const debouncedSearch = Utils.debounce(
      SearchManager.performSearch,
      CONFIG.SEARCH_DELAY
    );

    searchInput.addEventListener("input", (e) => {
      AppState.searchQuery = e.target.value;
      debouncedSearch();
    });

    // Enter key support
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        SearchManager.performSearch();
      }
    });
  },

  performSearch: () => {
    ProductManager.applySearch();
  },

  // Sugerencias de búsqueda (opcional)
  showSuggestions: (query) => {
    const suggestions = document.getElementById("searchSuggestions");
    if (!suggestions || !query) {
      if (suggestions) suggestions.style.display = "none";
      return;
    }

    // Generar sugerencias basadas en productos
    const matches = AppState.products
      .filter(
        (product) =>
          product.title.toLowerCase().includes(query.toLowerCase()) ||
          product.category.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 5);

    if (matches.length > 0) {
      suggestions.innerHTML = matches
        .map(
          (product) => `
        <div class="suggestion-item" onclick="SearchManager.selectSuggestion('${
          product.title
        }')">
          <img src="${product.image}" alt="${
            product.title
          }" class="suggestion-image">
          <div class="suggestion-content">
            <div class="suggestion-title">${product.title}</div>
            <div class="suggestion-price">${Utils.formatPrice(
              product.price
            )}</div>
          </div>
        </div>
      `
        )
        .join("");

      suggestions.style.display = "block";
    } else {
      suggestions.style.display = "none";
    }
  },

  selectSuggestion: (title) => {
    const searchInput = document.getElementById("searchInput");
    const suggestions = document.getElementById("searchSuggestions");

    if (searchInput) {
      searchInput.value = title;
      AppState.searchQuery = title;
    }

    if (suggestions) {
      suggestions.style.display = "none";
    }

    SearchManager.performSearch();
  },
};

// =====================================================
// MANEJO DEL CARRITO
// =====================================================

const CartManager = {
  init: () => {
    CartManager.updateCartBadge();
    CartManager.setupCartModal();
  },

  addToCart: (productId, quantity = 1) => {
    // Obtener cantidad del modal si existe
    const quantityInput = document.getElementById("productQuantity");
    if (quantityInput) {
      quantity = parseInt(quantityInput.value) || 1;
    }

    const product = AppState.products.find((p) => p.id === productId);
    if (!product) return;

    // Verificar si el producto ya está en el carrito
    const existingItem = AppState.cart.find((item) => item.id === productId);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      AppState.cart.push({
        ...product,
        quantity: quantity,
        addedAt: new Date().toISOString(),
      });
    }

    // Guardar en localStorage
    localStorage.setItem("daledealer_cart", JSON.stringify(AppState.cart));

    // Actualizar UI
    CartManager.updateCartBadge();
    CartManager.showAddedToCartNotification(product);

    // Cerrar modal si está abierto
    const productModal = bootstrap.Modal.getInstance(
      document.getElementById("productModal")
    );
    if (productModal) {
      productModal.hide();
    }
  },

  removeFromCart: (productId) => {
    AppState.cart = AppState.cart.filter((item) => item.id !== productId);
    localStorage.setItem("daledealer_cart", JSON.stringify(AppState.cart));
    CartManager.updateCartBadge();
    CartManager.updateCartModal();
  },

  updateQuantity: (productId, newQuantity) => {
    if (newQuantity <= 0) {
      CartManager.removeFromCart(productId);
      return;
    }

    const item = AppState.cart.find((item) => item.id === productId);
    if (item) {
      item.quantity = newQuantity;
      localStorage.setItem("daledealer_cart", JSON.stringify(AppState.cart));
      CartManager.updateCartBadge();
      CartManager.updateCartModal();
    }
  },

  // Continuación del código desde donde se cortó...

  updateCartBadge: () => {
    const badge = document.getElementById("cartBadge");
    const totalItems = AppState.cart.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    if (badge) {
      if (totalItems > 0) {
        badge.textContent = totalItems;
        badge.style.display = "inline-block";
      } else {
        badge.style.display = "none";
      }
    }

    // Actualizar título del botón carrito
    const cartBtn = document.getElementById("cartBtn");
    if (cartBtn) {
      cartBtn.setAttribute("title", `Carrito (${totalItems} items)`);
    }
  },

  setupCartModal: () => {
    const cartModal = document.getElementById("cartModal");
    if (!cartModal) return;

    cartModal.addEventListener("show.bs.modal", () => {
      CartManager.updateCartModal();
    });
  },

  updateCartModal: () => {
    const cartModalBody = document.getElementById("cartModalBody");
    if (!cartModalBody) return;

    if (AppState.cart.length === 0) {
      cartModalBody.innerHTML = `
        <div class="text-center py-5">
          <i class="bi bi-cart-x display-1 text-muted mb-3"></i>
          <h4 class="text-muted">Tu carrito está vacío</h4>
          <p class="text-muted">¡Agrega algunos productos para comenzar!</p>
          <button class="btn btn-primary" data-bs-dismiss="modal">
            Continuar comprando
          </button>
        </div>
      `;
      return;
    }

    const cartItems = AppState.cart
      .map((item) => {
        const itemTotal = item.price * item.quantity;
        return `
        <div class="cart-item border-bottom pb-3 mb-3">
          <div class="row align-items-center">
            <div class="col-2">
              <img src="${item.image}" alt="${
          item.title
        }" class="img-fluid rounded">
            </div>
            <div class="col-6">
              <h6 class="mb-1">${item.title}</h6>
              <small class="text-muted">${item.category}</small>
              <div class="text-primary fw-bold">${Utils.formatPrice(
                item.price
              )}</div>
            </div>
            <div class="col-2">
              <div class="input-group input-group-sm">
                <button class="btn btn-outline-secondary" onclick="CartManager.updateQuantity(${
                  item.id
                }, ${item.quantity - 1})">-</button>
                <input type="text" class="form-control text-center" value="${
                  item.quantity
                }" readonly>
                <button class="btn btn-outline-secondary" onclick="CartManager.updateQuantity(${
                  item.id
                }, ${item.quantity + 1})">+</button>
              </div>
            </div>
            <div class="col-2 text-end">
              <div class="fw-bold">${Utils.formatPrice(itemTotal)}</div>
              <button class="btn btn-sm btn-outline-danger mt-1" onclick="CartManager.removeFromCart(${
                item.id
              })">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
        </div>
      `;
      })
      .join("");

    const total = AppState.cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const totalItems = AppState.cart.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    cartModalBody.innerHTML = `
      <div class="cart-items">
        ${cartItems}
      </div>
      <div class="cart-summary border-top pt-3">
        <div class="row">
          <div class="col-6">
            <h5>Total (${totalItems} items):</h5>
          </div>
          <div class="col-6 text-end">
            <h4 class="text-primary">${Utils.formatPrice(total)}</h4>
          </div>
        </div>
        <div class="d-grid gap-2 mt-3">
          <button class="btn btn-primary btn-lg" onclick="CartManager.proceedToCheckout()">
            <i class="bi bi-credit-card me-2"></i>Proceder al pago
          </button>
          <button class="btn btn-outline-secondary" data-bs-dismiss="modal">
            Continuar comprando
          </button>
        </div>
      </div>
    `;
  },

  showAddedToCartNotification: (product) => {
    const notification = {
      id: Utils.generateId(),
      type: "success",
      title: "Producto agregado",
      message: `${product.title} se agregó al carrito`,
      timestamp: new Date().toISOString(),
    };

    NotificationManager.show(notification);
  },

  proceedToCheckout: () => {
    // Simular proceso de checkout
    NotificationManager.show({
      id: Utils.generateId(),
      type: "info",
      title: "Redirigiendo...",
      message: "Te estamos llevando al proceso de pago",
      timestamp: new Date().toISOString(),
    });

    // Cerrar modal
    const cartModal = bootstrap.Modal.getInstance(
      document.getElementById("cartModal")
    );
    if (cartModal) {
      cartModal.hide();
    }

    // Simular redirección (aquí irías a una página de checkout real)
    setTimeout(() => {
      alert(
        "¡Gracias por tu compra! En una implementación real, aquí se procesaría el pago."
      );
    }, 1000);
  },

  clearCart: () => {
    AppState.cart = [];
    localStorage.removeItem("daledealer_cart");
    CartManager.updateCartBadge();
    CartManager.updateCartModal();
  },
};

// =====================================================
// MANEJO DE NOTIFICACIONES
// =====================================================

const NotificationManager = {
  init: () => {
    NotificationManager.createContainer();
    NotificationManager.loadStoredNotifications();
  },

  createContainer: () => {
    if (document.getElementById("notificationContainer")) return;

    const container = document.createElement("div");
    container.id = "notificationContainer";
    container.className = "notification-container position-fixed";
    container.style.cssText = `
      top: 20px;
      right: 20px;
      z-index: 1055;
      max-width: 350px;
    `;

    document.body.appendChild(container);
  },

  show: (notification, duration = 5000) => {
    const container = document.getElementById("notificationContainer");
    if (!container) return;

    const notificationElement = document.createElement("div");
    notificationElement.className = `alert alert-${notification.type} alert-dismissible fade show notification-item`;
    notificationElement.style.cssText = `
      margin-bottom: 10px;
      animation: slideInRight 0.3s ease-out;
    `;

    notificationElement.innerHTML = `
      <div class="d-flex align-items-center">
        <i class="bi bi-${NotificationManager.getIcon(
          notification.type
        )} me-2"></i>
        <div class="flex-grow-1">
          <strong>${notification.title}</strong>
          <div class="small">${notification.message}</div>
        </div>
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
      </div>
    `;

    container.appendChild(notificationElement);

    // Auto-dismiss
    if (duration > 0) {
      setTimeout(() => {
        if (notificationElement.parentNode) {
          notificationElement.classList.add("fade");
          setTimeout(() => {
            if (notificationElement.parentNode) {
              notificationElement.remove();
            }
          }, 150);
        }
      }, duration);
    }

    // Almacenar notificación
    AppState.notifications.unshift(notification);
    if (AppState.notifications.length > 50) {
      AppState.notifications = AppState.notifications.slice(0, 50);
    }
    localStorage.setItem(
      "daledealer_notifications",
      JSON.stringify(AppState.notifications)
    );
  },

  getIcon: (type) => {
    const icons = {
      success: "check-circle-fill",
      error: "exclamation-triangle-fill",
      warning: "exclamation-triangle-fill",
      info: "info-circle-fill",
    };
    return icons[type] || "info-circle-fill";
  },

  loadStoredNotifications: () => {
    // Cargar notificaciones desde localStorage si es necesario
    const stored = localStorage.getItem("daledealer_notifications");
    if (stored) {
      AppState.notifications = JSON.parse(stored);
    }
  },
};

// =====================================================
// MANEJO DE NAVEGACIÓN Y UI
// =====================================================

const NavigationManager = {
  init: () => {
    NavigationManager.setupMobileMenu();
    NavigationManager.setupScrollEffects();
    NavigationManager.setupBackToTop();
  },

  setupMobileMenu: () => {
    const navToggle = document.querySelector(".navbar-toggler");
    const navCollapse = document.querySelector(".navbar-collapse");

    if (navToggle && navCollapse) {
      navToggle.addEventListener("click", () => {
        navCollapse.classList.toggle("show");
      });

      // Cerrar menú al hacer clic en un enlace
      navCollapse.addEventListener("click", (e) => {
        if (e.target.classList.contains("nav-link")) {
          navCollapse.classList.remove("show");
        }
      });
    }
  },

  setupScrollEffects: () => {
    const navbar = document.querySelector(".navbar");
    if (!navbar) return;

    let lastScrollTop = 0;
    const scrollThreshold = 100;

    window.addEventListener("scroll", () => {
      const scrollTop =
        window.pageYOffset || document.documentElement.scrollTop;

      // Efecto de transparencia
      if (scrollTop > scrollThreshold) {
        navbar.classList.add("navbar-scrolled");
      } else {
        navbar.classList.remove("navbar-scrolled");
      }

      // Ocultar/mostrar navbar en mobile
      if (window.innerWidth <= 768) {
        if (scrollTop > lastScrollTop && scrollTop > scrollThreshold) {
          navbar.style.transform = "translateY(-100%)";
        } else {
          navbar.style.transform = "translateY(0)";
        }
      }

      lastScrollTop = scrollTop;
    });
  },

  setupBackToTop: () => {
    const backToTopBtn = document.getElementById("backToTop");
    if (!backToTopBtn) return;

    window.addEventListener("scroll", () => {
      if (window.pageYOffset > 300) {
        backToTopBtn.style.display = "block";
      } else {
        backToTopBtn.style.display = "none";
      }
    });

    backToTopBtn.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    });
  },
};

// =====================================================
// MANEJO DE FAVORITOS
// =====================================================

const FavoritesManager = {
  favorites: JSON.parse(localStorage.getItem("daledealer_favorites") || "[]"),

  init: () => {
    FavoritesManager.updateFavoriteButtons();
  },

  toggleFavorite: (productId) => {
    const index = FavoritesManager.favorites.indexOf(productId);

    if (index > -1) {
      FavoritesManager.favorites.splice(index, 1);
      NotificationManager.show({
        id: Utils.generateId(),
        type: "info",
        title: "Eliminado de favoritos",
        message: "El producto se eliminó de tu lista de favoritos",
        timestamp: new Date().toISOString(),
      });
    } else {
      FavoritesManager.favorites.push(productId);
      NotificationManager.show({
        id: Utils.generateId(),
        type: "success",
        title: "Agregado a favoritos",
        message: "El producto se agregó a tu lista de favoritos",
        timestamp: new Date().toISOString(),
      });
    }

    localStorage.setItem(
      "daledealer_favorites",
      JSON.stringify(FavoritesManager.favorites)
    );
    FavoritesManager.updateFavoriteButtons();
  },

  updateFavoriteButtons: () => {
    const favoriteButtons = document.querySelectorAll("[data-favorite-id]");
    favoriteButtons.forEach((button) => {
      const productId = parseInt(button.getAttribute("data-favorite-id"));
      const isFavorite = FavoritesManager.favorites.includes(productId);

      button.innerHTML = isFavorite
        ? '<i class="bi bi-heart-fill text-danger"></i>'
        : '<i class="bi bi-heart"></i>';
    });
  },

  getFavoriteProducts: () => {
    return AppState.products.filter((product) =>
      FavoritesManager.favorites.includes(product.id)
    );
  },
};
// =====================================================
// MANEJO DE AUTENTICACIÓN
// =====================================================

const AuthManager = {
  init: () => {
    AuthManager.setupLogoutButton();
    AuthManager.checkAuthStatus();
  },

  setupLogoutButton: () => {
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        AuthManager.logout();
      });
    }
  },

  logout: () => {
    // Mostrar confirmación
    if (confirm("¿Estás seguro de que quieres cerrar sesión?")) {
      // Limpiar datos del usuario
      localStorage.removeItem("daledealer_user");
      localStorage.removeItem("daledealer_session");

      // Opcional: limpiar carrito y favoritos si quieres
      //localStorage.removeItem("daledealer_cart");
      //localStorage.removeItem("daledealer_favorites");

      // Mostrar notificación
      NotificationManager.show({
        id: Utils.generateId(),
        type: "success",
        title: "Sesión cerrada",
        message: "Has cerrado sesión correctamente",
        timestamp: new Date().toISOString(),
      });

      // Redirigir al login después de un breve delay
      setTimeout(() => {
        window.location.href = "./index.html";
      }, 1500);
    }
  },

  checkAuthStatus: () => {
    // Verificar si el usuario está logueado
    const user = localStorage.getItem("daledealer_user");
    if (!user) {
      // Si no hay usuario logueado, redirigir al login
      // window.location.href = 'login.html';
    }
  },
};

// =====================================================
// MANEJO DE EVENTOS GLOBALES
// =====================================================

const EventManager = {
  init: () => {
    EventManager.setupGlobalEvents();
    EventManager.setupKeyboardShortcuts();
  },

  setupGlobalEvents: () => {
    // Manejar errores de imágenes
    document.addEventListener(
      "error",
      (e) => {
        if (e.target.tagName === "IMG") {
          e.target.src =
            "https://via.placeholder.com/400x400?text=Imagen+no+disponible";
        }
      },
      true
    );

    // Manejar clic en overlay
    document.addEventListener("click", (e) => {
      if (e.target.classList.contains("modal-overlay")) {
        const modal = e.target.closest(".modal");
        if (modal) {
          const bsModal = bootstrap.Modal.getInstance(modal);
          if (bsModal) bsModal.hide();
        }
      }
    });

    // Manejar resize de ventana
    window.addEventListener(
      "resize",
      Utils.debounce(() => {
        // Reajustar elementos si es necesario
        if (window.innerWidth > 768) {
          const navbar = document.querySelector(".navbar");
          if (navbar) {
            navbar.style.transform = "translateY(0)";
          }
        }
      }, 250)
    );
  },

  setupKeyboardShortcuts: () => {
    document.addEventListener("keydown", (e) => {
      // Ctrl/Cmd + K para abrir búsqueda
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        const searchInput = document.getElementById("searchInput");
        if (searchInput) {
          searchInput.focus();
        }
      }

      // Escape para cerrar modales
      if (e.key === "Escape") {
        const openModals = document.querySelectorAll(".modal.show");
        openModals.forEach((modal) => {
          const bsModal = bootstrap.Modal.getInstance(modal);
          if (bsModal) bsModal.hide();
        });
      }
    });
  },
};

// =====================================================
// INICIALIZACIÓN DE LA APLICACIÓN
// =====================================================

document.addEventListener("DOMContentLoaded", () => {
  // Inicializar todos los managers
  ProductManager.init();
  SearchManager.init();
  CartManager.init();
  NotificationManager.init();
  NavigationManager.init();
  FavoritesManager.init();
  EventManager.init();
  AuthManager.init();

  // Configurar botón "Cargar más"
  const loadMoreBtn = document.getElementById("loadMoreBtn");
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", () => {
      AppState.currentPage++;
      ProductManager.renderProducts(AppState.filteredProducts, true);
    });
  }

  // Mostrar notificación de bienvenida
  setTimeout(() => {
    NotificationManager.show({
      id: Utils.generateId(),
      type: "success",
      title: "¡Bienvenido a Dale Deal!",
      message: "Descubre las mejores ofertas y productos",
      timestamp: new Date().toISOString(),
    });
  }, 1000);

  // Inicializar AOS (Animate On Scroll) si está disponible
  if (typeof AOS !== "undefined") {
    AOS.init({
      duration: 600,
      easing: "ease-in-out",
      once: true,
      offset: 100,
    });
  }

  console.log("Dale Deal - Marketplace inicializado correctamente");
});

// =====================================================
// EXPORT PARA TESTING (OPCIONAL)
// =====================================================

// Si necesitas exportar para testing, descomenta las siguientes líneas:
/*
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ProductManager,
    CartManager,
    SearchManager,
    NotificationManager,
    Utils,
    AppState
  };
}
*/
