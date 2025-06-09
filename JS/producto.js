document.addEventListener("DOMContentLoaded", function () {
  // Cambiar imagen principal al hacer clic en una miniatura
  const thumbnails = document.querySelectorAll(".thumbnail");
  const mainImage = document.getElementById("mainProductImage");

  thumbnails.forEach((thumb) => {
    thumb.addEventListener("click", function () {
      thumbnails.forEach((t) => t.classList.remove("active"));
      this.classList.add("active");
      const newSrc = this.getAttribute("data-full");
      if (mainImage) {
        mainImage.src = newSrc;
      }
    });
  });

  // Selección de color
  const colorOptions = document.querySelectorAll(".color-option");
  colorOptions.forEach((option) => {
    option.addEventListener("click", function () {
      colorOptions.forEach((o) => o.classList.remove("active"));
      this.classList.add("active");
    });
  });

  // Selección de almacenamiento
  const storageOptions = document.querySelectorAll(".storage-option");
  storageOptions.forEach((option) => {
    option.addEventListener("click", function () {
      storageOptions.forEach((o) => o.classList.remove("active"));
      this.classList.add("active");
    });
  });

  // Control de cantidad
  const decreaseBtn = document.getElementById("decreaseBtn");
  const increaseBtn = document.getElementById("increaseBtn");
  const quantityInput = document.getElementById("quantityInput");

  if (decreaseBtn && increaseBtn && quantityInput) {
    decreaseBtn.addEventListener("click", () => {
      let value = parseInt(quantityInput.value) || 1;
      if (value > 1) quantityInput.value = value - 1;
    });

    increaseBtn.addEventListener("click", () => {
      let value = parseInt(quantityInput.value) || 1;
      quantityInput.value = value + 1;
    });
  }

  // Funcionalidad de carrito
  const addToCartBtn = document.querySelector(".btn-add-cart");
  if (addToCartBtn) {
    addToCartBtn.addEventListener("click", () => {
      const quantity = parseInt(quantityInput.value) || 1;
      const selectedColor =
        document.querySelector(".color-option.active")?.dataset.color ||
        "default";
      const selectedStorage =
        document.querySelector(".storage-option.active")?.dataset.storage ||
        "128";

      const product = {
        id: "iphone-14-pro",
        name: "iPhone 14 Pro 128GB",
        color: selectedColor,
        storage: selectedStorage,
        quantity: quantity,
        price: 899999,
      };

      let cart = JSON.parse(localStorage.getItem("daledealer_cart") || "[]");
      const existing = cart.find(
        (item) =>
          item.id === product.id &&
          item.color === product.color &&
          item.storage === product.storage
      );

      if (existing) {
        existing.quantity += product.quantity;
      } else {
        cart.push(product);
      }

      localStorage.setItem("daledealer_cart", JSON.stringify(cart));
      showNotification("Producto agregado al carrito");
      updateCartBadge(cart);
    });
  }

  // Notificación simple
  function showNotification(message) {
    const notification = document.createElement("div");
    notification.className =
      "toast align-items-center text-bg-primary border-0 position-fixed bottom-0 end-0 m-4 show";
    notification.setAttribute("role", "alert");
    notification.setAttribute("aria-live", "assertive");
    notification.setAttribute("aria-atomic", "true");
    notification.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  // Actualizar badge del carrito
  function updateCartBadge(cart) {
    const badge = document.getElementById("cartBadge");
    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
    if (badge) {
      badge.textContent = totalItems;
    }
  }

  // Cargar badge si hay datos
  const cart = JSON.parse(localStorage.getItem("daledealer_cart") || "[]");
  updateCartBadge(cart);
});
