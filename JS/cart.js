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
      DaleDeal.error("Error cargando carrito:", error);
      return [];
    }
  }

  // Guardar carrito en localStorage
  saveCart() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.items));
      this.updateCartBadge();
    } catch (error) {
      DaleDeal.error("Error guardando carrito:", error);
    }
  }

  // Agregar producto al carrito
  addItem(product) {
    try {
      const existingItem = this.items.find((item) => String(item.id) === String(product.id));

      if (existingItem) {
        existingItem.quantity += product.quantity || 1;
      } else {
        this.items.push({
          id: String(product.id),
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
      DaleDeal.error("Error agregando al carrito:", error);
      this.showNotification("Error al agregar producto", "error");
      return false;
    }
  }

  // Remover producto del carrito
  removeItem(productId) {
    try {
      const itemIndex = this.items.findIndex((item) => String(item.id) === String(productId));
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
      DaleDeal.error("Error removiendo del carrito:", error);
      return false;
    }
  }

  // Actualizar cantidad de producto
  updateQuantity(productId, newQuantity) {
    try {
      const item = this.items.find((item) => String(item.id) === String(productId));
      if (item && newQuantity > 0) {
        const oldQuantity = item.quantity;
        item.quantity = newQuantity;
        this.saveCart();
        this.updateCartDropdown();
        
        // Log para debug
        DaleDeal.log(`Cantidad actualizada para ${item.title}: ${oldQuantity} → ${newQuantity}`);
        
        return true;
      } else if (newQuantity <= 0) {
        return this.removeItem(productId);
      }
      return false;
    } catch (error) {
      DaleDeal.error("Error actualizando cantidad:", error);
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
      DaleDeal.log('Total calculado:', totalPrice); // Debug
      cartTotal.textContent = this.formatPrice(totalPrice);
    }

    if (this.items.length === 0) {
      // Detectar si estamos en HTML/* (path relativo a productos.html)
      // o en root (index.html). Sin esto el CTA navega a 404 desde root.
      const productosHref = window.location.pathname.includes('/HTML/')
        ? '/productos'
        : '/productos';
      cartDropdownBody.innerHTML = `
        <div class="empty-state" style="padding: var(--spacing-8) var(--spacing-4);">
          <div class="empty-state-icon"><i class="bi bi-cart-x"></i></div>
          <h6 class="empty-state-title" style="font-size: var(--font-size-base);">Tu carrito está vacío</h6>
          <p class="empty-state-text" style="font-size: var(--font-size-sm); margin-bottom: var(--spacing-4);">Agregá productos para empezar.</p>
          <a class="empty-state-cta btn btn-primary btn-sm" href="${productosHref}">
            <i class="bi bi-bag me-2"></i>Explorar productos
          </a>
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

    // El carrito vive en localStorage: todo lo que venga de ahí se escapa.
    const esc = (v) => DaleDeal.utils.escapeHtml(String(v ?? ""));
    const cartItemsHTML = this.items
      .map(
        (item) => `
      <div class="cart-item" data-id="${esc(item.id)}">
        <a href="/producto?id=${encodeURIComponent(item.id)}" class="cart-item-link" tabindex="-1" aria-hidden="true">
          <img src="${esc(item.image)}" alt="${esc(item.title)}" class="cart-item-image">
        </a>
        <div class="cart-item-info">
          <h6 class="cart-item-title"><a href="/producto?id=${encodeURIComponent(item.id)}" class="cart-item-link">${esc(item.title)}</a></h6>
          <div class="cart-item-price">${esc(item.priceText || this.formatPrice(item.price))}</div>
          <div class="cart-item-controls">
            <div class="quantity-control">
              <button class="quantity-btn btn-decrease" data-product-id="${esc(item.id)}" data-action="decrease" type="button">-</button>
              <span class="quantity-display">${esc(item.quantity)}</span>
              <button class="quantity-btn btn-increase" data-product-id="${esc(item.id)}" data-action="increase" type="button">+</button>
            </div>
          </div>
        </div>
        <button class="remove-item" data-product-id="${esc(item.id)}" data-action="remove" type="button" title="Eliminar">
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
      const isInHtmlFolder = window.location.pathname.includes('/HTML/');
      window.location.href = isInHtmlFolder ? '/notificaciones' : '/notificaciones';
    });

    document.getElementById('proceedToCheckout')?.addEventListener('click', async () => {
      if (this.items.length === 0) {
        DaleDeal.log('Carrito vacío');
        return;
      }
      // Chequear sesión
      if (!localStorage.getItem('daledeal_token')) {
        DaleDeal.utils?.showNotification?.('Tenés que iniciar sesión para comprar.', 'warning');
        const goTo = window.location.pathname.includes('/HTML/') ? '/login' : '/login';
        setTimeout(() => { window.location.href = goTo; }, 1200);
        return;
      }

      // Cada compra necesita elegir envío o retiro (y la dirección): el backend
      // rechaza una orden de un producto con envío sin esos datos. Antes se
      // creaban todas las órdenes desde acá y fallaban con "Faltan datos de
      // envío". Ahora vamos a la ficha del primer producto y se abre el mismo
      // checkout que "Comprar ahora"; el resto queda en el carrito.
      const item = this.items[0];
      const params = new URLSearchParams({ id: String(item.id), comprar: "1", cantidad: String(item.quantity || 1) });
      if (this.items.length > 1) {
        DaleDeal.utils?.showNotification?.("Pagás un producto por vez: el resto queda en tu carrito.", "info");
      }
      setTimeout(() => { window.location.href = `/producto?${params}`; }, this.items.length > 1 ? 900 : 0);
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
              const currentItem = this.items.find(item => String(item.id) === String(productId));
              if (currentItem) {
                DaleDeal.log(`Incrementando cantidad para ${currentItem.title}: ${currentItem.quantity} → ${currentItem.quantity + 1}`);
                this.updateQuantity(productId, currentItem.quantity + 1);
              }
              break;
              
            case 'decrease':
              const currentItemDec = this.items.find(item => String(item.id) === String(productId));
              if (currentItemDec && currentItemDec.quantity > 1) {
                DaleDeal.log(`Decrementando cantidad para ${currentItemDec.title}: ${currentItemDec.quantity} → ${currentItemDec.quantity - 1}`);
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
        image = './IMG/isotipo.png'; // Usar isotipo como imagen por defecto
      }

      if (!title || !priceText) {
        throw new Error("Datos del producto incompletos");
      }

      // Convertir precio a número
      const price = parseFloat(priceText.replace(/[^0-9]/g, '')) || 0;

      return { id, title, price: price, priceText: priceText, image, quantity: 1 };
    } catch (error) {
      DaleDeal.error("Error extrayendo datos del producto:", error);
      return null;
    }
  }

  // Mostrar notificación usando el sistema centralizado
  showNotification(message, type = "info") {
    // Usar el sistema de notificaciones global de DaleDeal.utils
    if (window.DaleDeal?.utils?.showNotification) {
      window.DaleDeal.utils.showNotification(message, type);
    } else {
      // Fallback si utils no está disponible
      DaleDeal.log(`[CART ${type.toUpperCase()}] ${message}`);
    }
  }
}

// Inicializar el sistema de carrito
const cartManager = new CartManager();

// Exportar para uso global
window.cartManager = cartManager;
