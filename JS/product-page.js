// =====================================================
// DALE DEAL - Página de Producto
// =====================================================

class ProductPage {
  constructor() {
    this.currentProduct = null;
    this.selectedColor = "blue";
    this.selectedStorage = "256GB";
    this.quantity = 1;
    this.currentImageIndex = 0;
    this.images = [
      "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600&h=600&fit=crop",
      "https://images.unsplash.com/photo-1567581935884-3349723552ca?w=600&h=600&fit=crop",
    ];

    this.init();
  }

  init() {
    this.loadProductData();
    this.setupEventListeners();
    this.setupImageGallery();
    this.updatePrice();
  }

  loadProductData() {
    // Datos del producto (normalmente vendrían de una API)
    this.currentProduct = {
      id: 1,
      title: "iPhone 15 Pro Max 256GB",
      basePrice: 1299999,
      originalPrice: 1499999,
      rating: 4.8,
      reviewCount: 2847,
      salesCount: 500,
      description:
        "El iPhone 15 Pro Max redefine lo que es posible en un smartphone. Con el revolucionario chip A17 Pro, el primer chip de 3 nanómetros en un smartphone, experimentarás un rendimiento sin precedentes y una eficiencia energética excepcional.",
      features: [
        "Chip A17 Pro con GPU de 6 núcleos para gráficos de nivel profesional",
        "Sistema de cámaras Pro con teleobjetivo de 120mm",
        'Pantalla Super Retina XDR de 6.7" con ProMotion',
        "Diseño en titanio de grado aeroespacial",
        "Botón de Acción personalizable",
        "USB-C con velocidades de transferencia hasta 10Gb/s",
      ],
      colors: {
        gold: { name: "Titanio Natural", price: 0 },
        blue: { name: "Titanio Azul", price: 0 },
        silver: { name: "Titanio Blanco", price: 0 },
        black: { name: "Titanio Negro", price: 0 },
      },
      storage: {
        "128GB": { name: "128GB", price: -100000 },
        "256GB": { name: "256GB", price: 0 },
        "512GB": { name: "512GB", price: 200000 },
        "1TB": { name: "1TB", price: 400000 },
      },
      stock: 15,
    };
  }

  setupEventListeners() {
    // Selectores de color
    document.querySelectorAll(".color-option").forEach((option) => {
      option.addEventListener("click", (e) => {
        this.selectColor(e.target.dataset.color);
      });
    });

    // Selectores de almacenamiento
    document.querySelectorAll(".storage-option").forEach((option) => {
      option.addEventListener("click", (e) => {
        this.selectStorage(e.target.dataset.storage);
      });
    });

    // Controles de cantidad
    document.querySelector(".quantity-minus")?.addEventListener("click", () => {
      this.changeQuantity(-1);
    });

    document.querySelector(".quantity-plus")?.addEventListener("click", () => {
      this.changeQuantity(1);
    });

    document
      .querySelector(".quantity-input")
      ?.addEventListener("change", (e) => {
        this.setQuantity(Number.parseInt(e.target.value) || 1);
      });

    // Botones de acción
    document.querySelector(".btn-buy-now")?.addEventListener("click", () => {
      this.buyNow();
    });

    document.querySelector(".btn-add-cart")?.addEventListener("click", () => {
      this.addToCart();
    });

    document.querySelector(".btn-favorite")?.addEventListener("click", () => {
      this.toggleFavorite();
    });

    // Navegación de imágenes
    document.querySelectorAll(".thumbnail-item").forEach((thumb, index) => {
      thumb.addEventListener("click", () => {
        this.changeMainImage(index);
      });
    });
  }

  setupImageGallery() {
    const mainImage = document.querySelector(".main-product-image");
    const thumbnails = document.querySelectorAll(".thumbnail-image");

    if (mainImage) {
      mainImage.src = this.images[0];
    }

    thumbnails.forEach((thumb, index) => {
      if (this.images[index]) {
        thumb.src = this.images[index];
      }
    });

    // Marcar primera miniatura como activa
    document.querySelector(".thumbnail-item")?.classList.add("active");
  }

  selectColor(color) {
    if (!this.currentProduct.colors[color]) return;

    this.selectedColor = color;

    // Actualizar UI
    document.querySelectorAll(".color-option").forEach((option) => {
      option.classList.remove("active");
    });
    document.querySelector(`[data-color="${color}"]`)?.classList.add("active");

    this.updatePrice();
    this.showNotification(
      `Color seleccionado: ${this.currentProduct.colors[color].name}`,
      "info"
    );
  }

  selectStorage(storage) {
    if (!this.currentProduct.storage[storage]) return;

    this.selectedStorage = storage;

    // Actualizar UI
    document.querySelectorAll(".storage-option").forEach((option) => {
      option.classList.remove("active");
    });
    document
      .querySelector(`[data-storage="${storage}"]`)
      ?.classList.add("active");

    this.updatePrice();
    this.showNotification(`Almacenamiento seleccionado: ${storage}`, "info");
  }

  changeQuantity(delta) {
    const newQuantity = this.quantity + delta;
    this.setQuantity(newQuantity);
  }

  setQuantity(quantity) {
    const maxQuantity = Math.min(this.currentProduct.stock, 10);
    this.quantity = Math.max(1, Math.min(quantity, maxQuantity));

    const input = document.querySelector(".quantity-input");
    if (input) {
      input.value = this.quantity;
    }

    this.updatePrice();
  }

  updatePrice() {
    const basePrice = this.currentProduct.basePrice;
    const storagePrice =
      this.currentProduct.storage[this.selectedStorage].price;
    const colorPrice = this.currentProduct.colors[this.selectedColor].price;
    const totalPrice = (basePrice + storagePrice + colorPrice) * this.quantity;

    // Actualizar precio actual
    const currentPriceEl = document.querySelector(".current-price");
    if (currentPriceEl) {
      currentPriceEl.textContent = this.formatPrice(totalPrice);
    }

    // Actualizar cuotas
    const installmentPrice = totalPrice / 12;
    const installmentsEl = document.querySelector(".installments .highlight");
    if (installmentsEl) {
      installmentsEl.textContent = this.formatPrice(installmentPrice);
    }
  }

  changeMainImage(index) {
    if (index < 0 || index >= this.images.length) return;

    this.currentImageIndex = index;

    // Actualizar imagen principal
    const mainImage = document.querySelector(".main-product-image");
    if (mainImage) {
      mainImage.style.opacity = "0";
      setTimeout(() => {
        mainImage.src = this.images[index];
        mainImage.style.opacity = "1";
      }, 150);
    }

    // Actualizar miniaturas activas
    document.querySelectorAll(".thumbnail-item").forEach((thumb, i) => {
      thumb.classList.toggle("active", i === index);
    });
  }

  async addToCart() {
    const button = document.querySelector(".btn-add-cart");
    this.setButtonLoading(button, true);

    try {
      // Simular delay de API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const productData = {
        id: `${this.currentProduct.id}-${this.selectedColor}-${this.selectedStorage}`,
        title: `${this.currentProduct.title} - ${
          this.currentProduct.colors[this.selectedColor].name
        }`,
        price: this.calculateUnitPrice(),
        image: this.images[this.currentImageIndex],
        quantity: this.quantity,
        color: this.selectedColor,
        storage: this.selectedStorage,
      };

      // Usar el CartManager global
      if (window.cartManager) {
        window.cartManager.addItem(productData);
      } else {
        // Fallback si no está disponible
        this.showNotification("Producto agregado al carrito", "success");
      }
    } catch (error) {
      console.error("Error agregando al carrito:", error);
      this.showNotification("Error al agregar al carrito", "error");
    } finally {
      this.setButtonLoading(button, false);
    }
  }

  async buyNow() {
    const button = document.querySelector(".btn-buy-now");
    this.setButtonLoading(button, true);

    try {
      // Simular proceso de compra
      await new Promise((resolve) => setTimeout(resolve, 1500));

      this.showNotification("Redirigiendo al checkout...", "info");

      // En una app real, aquí redirigirías al checkout
      setTimeout(() => {
        alert(
          "¡Gracias por tu compra! En una implementación real, aquí se procesaría el pago."
        );
      }, 1000);
    } catch (error) {
      console.error("Error en compra:", error);
      this.showNotification("Error al procesar la compra", "error");
    } finally {
      this.setButtonLoading(button, false);
    }
  }

  toggleFavorite() {
    const button = document.querySelector(".btn-favorite");
    const isActive = button.classList.contains("active");

    button.classList.toggle("active");

    if (isActive) {
      button.innerHTML = '<i class="bi bi-heart"></i>';
      this.showNotification("Eliminado de favoritos", "info");
    } else {
      button.innerHTML = '<i class="bi bi-heart-fill"></i>';
      this.showNotification("Agregado a favoritos", "success");
    }
  }

  calculateUnitPrice() {
    const basePrice = this.currentProduct.basePrice;
    const storagePrice =
      this.currentProduct.storage[this.selectedStorage].price;
    const colorPrice = this.currentProduct.colors[this.selectedColor].price;
    return basePrice + storagePrice + colorPrice;
  }

  formatPrice(price) {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  }

  setButtonLoading(button, isLoading) {
    if (!button) return;

    if (isLoading) {
      button.classList.add("btn-loading");
      button.disabled = true;
    } else {
      button.classList.remove("btn-loading");
      button.disabled = false;
    }
  }

  showNotification(message, type = "info") {
    // Crear contenedor si no existe
    let container = document.getElementById("notificationContainer");
    if (!container) {
      container = document.createElement("div");
      container.id = "notificationContainer";
      container.className = "position-fixed top-0 end-0 p-3";
      container.style.zIndex = "1070";
      document.body.appendChild(container);
    }

    const notification = document.createElement("div");
    notification.className = `toast align-items-center text-bg-${
      type === "error" ? "danger" : type
    } border-0`;
    notification.setAttribute("role", "alert");

    notification.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">
          <i class="bi bi-${this.getNotificationIcon(type)} me-2"></i>
          ${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    `;

    container.appendChild(notification);

    const toast = new bootstrap.Toast(notification, { delay: 3000 });
    toast.show();

    notification.addEventListener("hidden.bs.toast", () => {
      notification.remove();
    });
  }

  getNotificationIcon(type) {
    const icons = {
      success: "check-circle-fill",
      error: "exclamation-triangle-fill",
      info: "info-circle-fill",
      warning: "exclamation-triangle-fill",
    };
    return icons[type] || "info-circle-fill";
  }
}

// Inicializar cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  new ProductPage();
});
