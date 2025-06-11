// =====================================================
// DALE DEAL - Sistema de Carrito de Compras
// =====================================================

class CartManager {
  constructor() {
    this.storageKey = "daledealer_cart";
    this.items = this.loadCart();
    this.init();
  }

  init() {
    this.updateCartBadge();
    this.bindEvents();
  }

  // Cargar carrito desde localStorage
  loadCart() {
    try {
      const cart = localStorage.getItem(this.storageKey);
      return cart ? JSON.parse(cart) : [];
    } catch (error) {
      console.error("Error cargando carrito:", error);
      return [];
    }
  }

  // Guardar carrito en localStorage
  saveCart() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.items));
      this.updateCartBadge();
    } catch (error) {
      console.error("Error guardando carrito:", error);
    }
  }

  // Agregar producto al carrito
  addItem(product) {
    try {
      const existingItem = this.items.find((item) => item.id === product.id);

      if (existingItem) {
        existingItem.quantity += product.quantity || 1;
      } else {
        this.items.push({
          id: product.id,
          title: product.title,
          price: product.price,
          image: product.image,
          quantity: product.quantity || 1,
          addedAt: new Date().toISOString(),
        });
      }

      this.saveCart();
      this.showNotification(`${product.title} agregado al carrito`, "success");
      return true;
    } catch (error) {
      console.error("Error agregando al carrito:", error);
      this.showNotification("Error al agregar producto", "error");
      return false;
    }
  }

  // Remover producto del carrito
  removeItem(productId) {
    try {
      const itemIndex = this.items.findIndex((item) => item.id === productId);
      if (itemIndex > -1) {
        const removedItem = this.items.splice(itemIndex, 1)[0];
        this.saveCart();
        this.updateCartModal();
        this.showNotification(
          `${removedItem.title} eliminado del carrito`,
          "info"
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error removiendo del carrito:", error);
      return false;
    }
  }

  // Actualizar cantidad de producto
  updateQuantity(productId, newQuantity) {
    try {
      const item = this.items.find((item) => item.id === productId);
      if (item && newQuantity > 0) {
        item.quantity = newQuantity;
        this.saveCart();
        this.updateCartModal();
        return true;
      } else if (newQuantity <= 0) {
        return this.removeItem(productId);
      }
      return false;
    } catch (error) {
      console.error("Error actualizando cantidad:", error);
      return false;
    }
  }

  // Limpiar carrito
  clearCart() {
    this.items = [];
    this.saveCart();
    this.updateCartModal();
    this.showNotification("Carrito vaciado", "info");
  }

  // Obtener total de items
  getTotalItems() {
    return this.items.reduce((total, item) => total + item.quantity, 0);
  }

  // Obtener total del precio
  getTotalPrice() {
    return this.items.reduce((total, item) => {
      const price = Number.parseFloat(
        item.price.toString().replace(/[^0-9.-]+/g, "")
      );
      return total + price * item.quantity;
    }, 0);
  }

  // Actualizar badge del carrito
  updateCartBadge() {
    const cartBadge = document.getElementById("cartBadge");
    if (cartBadge) {
      const totalItems = this.getTotalItems();
      cartBadge.textContent = totalItems;
      cartBadge.style.display = totalItems > 0 ? "flex" : "none";
    }
  }

  // Actualizar modal del carrito
  updateCartModal() {
    const cartModalBody = document.getElementById("cartModalBody");
    if (!cartModalBody) return;

    if (this.items.length === 0) {
      cartModalBody.innerHTML = `
        <div class="cart-empty">
          <i class="bi bi-cart-x"></i>
          <h5>Tu carrito está vacío</h5>
          <p>¡Descubre productos increíbles y comienza a comprar!</p>
          <button class="btn btn-primary" data-bs-dismiss="modal">
            Seguir comprando
          </button>
        </div>
      `;
      return;
    }

    const cartItemsHTML = this.items
      .map(
        (item) => `
      <div class="cart-item" data-id="${item.id}">
        <img src="${item.image}" alt="${item.title}" class="cart-item-image">
        <div class="cart-item-info">
          <h6 class="cart-item-title">${item.title}</h6>
          <div class="cart-item-price">${this.formatPrice(item.price)}</div>
          <div class="cart-item-controls">
            <div class="quantity-control">
              <button class="quantity-btn" onclick="cartManager.updateQuantity('${
                item.id
              }', ${item.quantity - 1})">-</button>
              <span class="quantity-display">${item.quantity}</span>
              <button class="quantity-btn" onclick="cartManager.updateQuantity('${
                item.id
              }', ${item.quantity + 1})">+</button>
            </div>
          </div>
        </div>
        <button class="remove-item" onclick="cartManager.removeItem('${
          item.id
        }')" title="Eliminar">
          <i class="bi bi-trash"></i>
        </button>
      </div>
    `
      )
      .join("");

    const totalPrice = this.getTotalPrice();
    const shipping = totalPrice > 50000 ? 0 : 5000;
    const finalTotal = totalPrice + shipping;

    cartModalBody.innerHTML = `
      <div class="cart-items">
        ${cartItemsHTML}
      </div>
      <div class="cart-total">
        <div class="cart-total-row">
          <span class="cart-total-label">Subtotal:</span>
          <span class="cart-total-value">${this.formatPrice(totalPrice)}</span>
        </div>
        <div class="cart-total-row">
          <span class="cart-total-label">Envío:</span>
          <span class="cart-total-value">${
            shipping === 0 ? "Gratis" : this.formatPrice(shipping)
          }</span>
        </div>
        <div class="cart-total-row cart-total-final">
          <span class="cart-total-label">Total:</span>
          <span class="cart-total-value">${this.formatPrice(finalTotal)}</span>
        </div>
        <div class="cart-actions">
          <button class="btn-checkout">
            <i class="bi bi-credit-card me-2"></i>
            Finalizar Compra
          </button>
          <button class="btn-continue" data-bs-dismiss="modal">
            Seguir Comprando
          </button>
        </div>
      </div>
    `;
  }

  // Formatear precio
  formatPrice(price) {
    const numPrice =
      typeof price === "string"
        ? Number.parseFloat(price.replace(/[^0-9.-]+/g, ""))
        : price;

    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numPrice);
  }

  // Vincular eventos
  bindEvents() {
    // Botón del carrito
    const cartBtn = document.getElementById("cartBtn");
    if (cartBtn) {
      cartBtn.addEventListener("click", () => {
        this.updateCartModal();
        const cartModal = new bootstrap.Modal(
          document.getElementById("cartModal")
        );
        cartModal.show();
      });
    }

    // Botones de agregar al carrito en productos
    document.addEventListener("click", (e) => {
      if (e.target.matches(".btn-add-to-cart, .btn-add-to-cart *")) {
        e.preventDefault();
        const button = e.target.closest(".btn-add-to-cart");
        const productCard = button.closest(".product-card");

        if (productCard) {
          const product = this.extractProductData(productCard);
          if (product) {
            this.addItem(product);
          }
        }
      }
    });
  }

  // Extraer datos del producto desde la tarjeta
  extractProductData(productCard) {
    try {
      const id = productCard.dataset.id || Date.now().toString();
      const title = productCard
        .querySelector(".product-title")
        ?.textContent?.trim();
      const price = productCard
        .querySelector(".product-current-price")
        ?.textContent?.trim();
      const image = productCard.querySelector(".product-image")?.src;

      if (!title || !price || !image) {
        throw new Error("Datos del producto incompletos");
      }

      return { id, title, price, image, quantity: 1 };
    } catch (error) {
      console.error("Error extrayendo datos del producto:", error);
      return null;
    }
  }

  // Mostrar notificación
  showNotification(message, type = "info") {
    // Crear contenedor de notificaciones si no existe
    let notificationContainer = document.getElementById(
      "notificationContainer"
    );
    if (!notificationContainer) {
      notificationContainer = document.createElement("div");
      notificationContainer.id = "notificationContainer";
      notificationContainer.className = "position-fixed top-0 end-0 p-3";
      notificationContainer.style.zIndex = "1070";
      document.body.appendChild(notificationContainer);
    }

    const notificationId = `notification-${Date.now()}`;
    const iconMap = {
      success: "check-circle-fill",
      error: "exclamation-triangle-fill",
      info: "info-circle-fill",
    };

    const notification = document.createElement("div");
    notification.id = notificationId;
    notification.className = `toast align-items-center text-bg-${
      type === "error" ? "danger" : type
    } border-0`;
    notification.setAttribute("role", "alert");
    notification.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">
          <i class="bi bi-${iconMap[type]} me-2"></i>
          ${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    `;

    notificationContainer.appendChild(notification);

    const toast = new bootstrap.Toast(notification, { delay: 3000 });
    toast.show();

    // Limpiar después de que se oculte
    notification.addEventListener("hidden.bs.toast", () => {
      notification.remove();
    });
  }
}

// Inicializar el sistema de carrito
const cartManager = new CartManager();

// Exportar para uso global
window.cartManager = cartManager;
