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
      DaleDeal.log('Ver carrito completo');
    });

    document.getElementById('proceedToCheckout')?.addEventListener('click', async () => {
      if (this.items.length === 0) {
        DaleDeal.log('Carrito vacío');
        return;
      }
      // Chequear sesión
      if (!localStorage.getItem('daledeal_token')) {
        DaleDeal.utils?.showNotification?.('Tenés que iniciar sesión para comprar.', 'warning');
        const goTo = window.location.pathname.includes('/HTML/') ? './login.html' : './HTML/login.html';
        setTimeout(() => { window.location.href = goTo; }, 1200);
        return;
      }

      const apiFetch  = window.DaleDeal?.api?.apiFetch;
      const payments  = window.DaleDeal?.payments;
      if (!apiFetch) {
        DaleDeal.utils?.showNotification?.('API no disponible.', 'error');
        return;
      }

      // Crear una orden por cada item — el backend abre una conversación
      // con cada vendedor (hook en createOrder).
      const createdOrders   = [];
      const pendingOrderIds = [];
      const errors          = [];
      for (const item of this.items) {
        try {
          const res = await apiFetch('/orders', {
            method: 'POST',
            body: JSON.stringify({
              product_id: parseInt(item.id, 10),
              quantity:   item.quantity || 1,
            }),
          });
          const orderId = res?.order?.id || res?.id;
          if (orderId) {
            createdOrders.push({
              order_id:        orderId,
              conversation_id: res?.conversation?.id || null,
              title:           item.title,
            });
            pendingOrderIds.push(orderId);
          }
        } catch (err) {
          errors.push(`${item.title || 'Producto'}: ${err.message}`);
        }
      }

      if (createdOrders.length === 0) {
        DaleDeal.utils?.showNotification?.(
          'No se pudo crear ninguna orden. ' + (errors[0] || ''),
          'error'
        );
        return;
      }

      if (errors.length > 0) {
        DaleDeal.utils?.showNotification?.(
          `Se crearon ${createdOrders.length} de ${this.items.length} órdenes. Vas a pagarlas una por una.`,
          'warning'
        );
      }

      // Vaciar carrito (las órdenes ya existen)
      this.items = [];
      this.saveCart?.();
      this.updateCartDropdown?.();

      // Si MP está disponible, empezamos el flujo de pago por la primera orden.
      // Las restantes quedan guardadas en localStorage para que, al volver
      // de pago-exitoso, el usuario vea las que le faltan.
      if (payments?.redirectToCheckout) {
        try {
          // El resto va a localStorage — pago-exitoso.html las muestra.
          const rest = pendingOrderIds.slice(1);
          if (rest.length > 0) {
            localStorage.setItem('dd_pending_orders', JSON.stringify(rest));
          } else {
            localStorage.removeItem('dd_pending_orders');
          }
          DaleDeal.utils?.showNotification?.('Redirigiendo a Mercado Pago…', 'info');
          await payments.redirectToCheckout(pendingOrderIds[0]);
          return; // redirect ya disparado
        } catch (err) {
          DaleDeal.error('Error al iniciar pago:', err);
          DaleDeal.utils?.showNotification?.(
            err.message || 'No pudimos iniciar el pago. Intentá desde el detalle de la orden.',
            'error'
          );
        }
      }

      // Fallback (sin MP): abrir la primera conversación creada
      const firstConv = createdOrders[0]?.conversation_id;
      if (firstConv && window.DaleDeal?.chat) {
        DaleDeal.utils?.showNotification?.('Abrimos el chat con el vendedor para coordinar el pago.', 'info');
        setTimeout(() => window.DaleDeal.chat.openConversation(firstConv), 800);
      }
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
        image = './IMG/LOGO.png'; // Usar logo como imagen por defecto
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
