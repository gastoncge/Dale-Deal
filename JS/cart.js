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
          priceText: product.priceText,
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
        this.updateCartDropdown();
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
        const oldQuantity = item.quantity;
        item.quantity = newQuantity;
        this.saveCart();
        this.updateCartDropdown();
        
        // Log para debug
        console.log(`Cantidad actualizada para ${item.title}: ${oldQuantity} → ${newQuantity}`);
        
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
    this.updateCartDropdown();
    this.showNotification("Carrito vaciado", "info");
  }

  // Obtener total de items
  getTotalItems() {
    return this.items.reduce((total, item) => total + item.quantity, 0);
  }

  // Obtener total del precio
  getTotalPrice() {
    return this.items.reduce((total, item) => {
      // Si item.price es un número, usarlo directamente
      let price = item.price;
      
      // Si es string, intentar parsearlo
      if (typeof price === 'string') {
        price = parseFloat(price.replace(/[^0-9.-]+/g, "")) || 0;
      }
      
      // Si no es un número válido, usar 0
      if (typeof price !== 'number' || isNaN(price)) {
        price = 0;
      }
      
      return total + (price * item.quantity);
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

  // Actualizar dropdown del carrito
  updateCartDropdown() {
    const cartDropdownBody = document.getElementById("cartDropdownBody");
    const cartCount = document.getElementById("cartCount");
    const cartTotal = document.getElementById("cartTotal");
    
    if (!cartDropdownBody) return;

    // Actualizar contador
    if (cartCount) {
      const totalItems = this.getTotalItems();
      cartCount.textContent = totalItems;
      cartCount.style.display = totalItems > 0 ? 'inline' : 'none';
    }

    // Actualizar total
    if (cartTotal) {
      const totalPrice = this.getTotalPrice();
      console.log('Total calculado:', totalPrice); // Debug
      cartTotal.textContent = this.formatPrice(totalPrice);
    }

    if (this.items.length === 0) {
      cartDropdownBody.innerHTML = `
        <div class="cart-empty-dropdown">
          <i class="bi bi-cart-x"></i>
          <h6>Tu carrito está vacío</h6>
          <p>¡Descubre productos increíbles!</p>
        </div>
      `;
      
      // Ocultar footer del carrito cuando está vacío
      const cartFooter = document.querySelector('.cart-footer');
      if (cartFooter) {
        cartFooter.style.display = 'none';
      }
      return;
    }

    // Mostrar footer del carrito cuando hay items
    const cartFooter = document.querySelector('.cart-footer');
    if (cartFooter) {
      cartFooter.style.display = 'block';
    }

    const cartItemsHTML = this.items
      .map(
        (item) => `
      <div class="cart-item" data-id="${item.id}">
        <img src="${item.image}" alt="${item.title}" class="cart-item-image">
        <div class="cart-item-info">
          <h6 class="cart-item-title">${item.title}</h6>
          <div class="cart-item-price">${item.priceText || this.formatPrice(item.price)}</div>
          <div class="cart-item-controls">
            <div class="quantity-control">
              <button class="quantity-btn btn-decrease" data-product-id="${item.id}" data-action="decrease" type="button">-</button>
              <span class="quantity-display">${item.quantity}</span>
              <button class="quantity-btn btn-increase" data-product-id="${item.id}" data-action="increase" type="button">+</button>
            </div>
          </div>
        </div>
        <button class="remove-item" data-product-id="${item.id}" data-action="remove" type="button" title="Eliminar">
          <i class="bi bi-trash"></i>
        </button>
      </div>
    `
      )
      .join("");

    const totalPrice = this.getTotalPrice();
    const shipping = totalPrice > 50000 ? 0 : 5000;
    const finalTotal = totalPrice + shipping;

    cartDropdownBody.innerHTML = `
      <div class="cart-items">
        ${cartItemsHTML}
      </div>
    `;
  }

  // Formatear precio
  formatPrice(price) {
    // Usar la función global de utils si está disponible
    if (window.DaleDeal?.utils?.formatPrice) {
      const numPrice = typeof price === "string" 
        ? Number.parseFloat(price.replace(/[^0-9.-]+/g, "")) 
        : price;
      return window.DaleDeal.utils.formatPrice(numPrice);
    }

    // Fallback
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
      cartBtn.addEventListener("shown.bs.dropdown", () => {
        this.updateCartDropdown();
      });
    }

    // Eventos para botones del dropdown del carrito
    document.getElementById('viewFullCart')?.addEventListener('click', () => {
      // Aquí podrías redirigir a una página completa del carrito
      console.log('Ver carrito completo');
    });

    document.getElementById('proceedToCheckout')?.addEventListener('click', () => {
      if (this.items.length === 0) {
        console.log('Carrito vacío');
        return;
      }
      // Aquí podrías redirigir al checkout
      console.log('Proceder al checkout');
    });

    // Manejar clics en el dropdown del carrito
    document.addEventListener('click', (e) => {
      // Si el clic es dentro del dropdown del carrito
      if (e.target.closest('.cart-dropdown')) {
        const target = e.target.closest('[data-action]');
        
        if (target) {
          e.stopPropagation();
          e.preventDefault();
          
          const productId = target.dataset.productId;
          const action = target.dataset.action;
          
          switch (action) {
            case 'increase':
              const currentItem = this.items.find(item => item.id === productId);
              if (currentItem) {
                console.log(`Incrementando cantidad para ${currentItem.title}: ${currentItem.quantity} → ${currentItem.quantity + 1}`);
                this.updateQuantity(productId, currentItem.quantity + 1);
              }
              break;
              
            case 'decrease':
              const currentItemDec = this.items.find(item => item.id === productId);
              if (currentItemDec && currentItemDec.quantity > 1) {
                console.log(`Decrementando cantidad para ${currentItemDec.title}: ${currentItemDec.quantity} → ${currentItemDec.quantity - 1}`);
                this.updateQuantity(productId, currentItemDec.quantity - 1);
              } else if (currentItemDec && currentItemDec.quantity === 1) {
                // Si la cantidad es 1, preguntar si quiere eliminar
                this.removeItem(productId);
              }
              break;
              
            case 'remove':
              this.removeItem(productId);
              break;
          }
        }
        
        // Prevenir cierre para cualquier clic en el cuerpo del carrito
        if (e.target.closest('.cart-body')) {
          e.stopPropagation();
        }
      }
    });

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
      const priceText = productCard
        .querySelector(".product-current-price")
        ?.textContent?.trim();
      let image = productCard.querySelector(".product-image")?.src;

      // Imagen por defecto si no hay imagen
      if (!image || image === '') {
        image = './IMG/LOGO.png'; // Usar logo como imagen por defecto
      }

      if (!title || !priceText) {
        throw new Error("Datos del producto incompletos");
      }

      // Convertir precio a número
      const price = parseFloat(priceText.replace(/[^0-9]/g, '')) || 0;

      return { id, title, price: price, priceText: priceText, image, quantity: 1 };
    } catch (error) {
      console.error("Error extrayendo datos del producto:", error);
      return null;
    }
  }

  // Mostrar notificación
  showNotification(message, type = "info") {
    try {
      // Usar el sistema de notificaciones global si está disponible
      if (window.DaleDeal?.utils?.showNotification) {
        window.DaleDeal.utils.showNotification(message, type);
        return;
      }

      // Fallback con toast de Bootstrap si está disponible
      if (window.bootstrap?.Toast) {
        this.showBootstrapToast(message, type);
        return;
      }

      // Fallback simple para consola
      console.log(`[CART ${type.toUpperCase()}] ${message}`);
    } catch (error) {
      console.error('Error mostrando notificación:', error);
      console.log(`[CART ${type.toUpperCase()}] ${message}`);
    }
  }

  // Crear toast de Bootstrap como fallback
  showBootstrapToast(message, type) {
    const toastContainer = document.querySelector('.toast-container') || this.createToastContainer();
    
    const toast = document.createElement('div');
    toast.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'primary'} border-0`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    `;
    
    toastContainer.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    // Remover después de ocultar
    toast.addEventListener('hidden.bs.toast', () => {
      toast.remove();
    });
  }

  // Crear contenedor de toasts si no existe
  createToastContainer() {
    const container = document.createElement('div');
    container.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    document.body.appendChild(container);
    return container;
  }
}

// Inicializar el sistema de carrito
const cartManager = new CartManager();

// Exportar para uso global
window.cartManager = cartManager;
