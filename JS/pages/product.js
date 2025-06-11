/**
 * =====================================================
 * DALE DEAL - Página de Producto
 * =====================================================
 */

document.addEventListener("DOMContentLoaded", () => {
  initializeProductPage();
});

function initializeProductPage() {
  setupImageGallery();
  setupProductOptions();
  setupQuantityControls();
  setupPurchaseActions();
  setupProductTabs();

  console.log("✅ Página de producto inicializada");
}

function setupImageGallery() {
  const thumbnails = document.querySelectorAll(".thumbnail");
  const mainImage = document.getElementById("mainProductImage");

  thumbnails.forEach((thumb) => {
    thumb.addEventListener("click", function () {
      // Actualizar thumbnail activo
      thumbnails.forEach((t) => t.classList.remove("active"));
      this.classList.add("active");

      // Cambiar imagen principal
      const newSrc = this.getAttribute("data-full");
      if (mainImage && newSrc) {
        mainImage.src = newSrc;
      }
    });
  });

  // Click en imagen principal para zoom (opcional)
  if (mainImage) {
    mainImage.addEventListener("click", () => {
      // Aquí podrías implementar un modal de zoom
      console.log("Zoom de imagen");
    });
  }
}

function setupProductOptions() {
  // Opciones de color
  const colorOptions = document.querySelectorAll(".color-option");
  colorOptions.forEach((option) => {
    option.addEventListener("click", function () {
      colorOptions.forEach((o) => o.classList.remove("active"));
      this.classList.add("active");
    });
  });

  // Opciones de almacenamiento
  const storageOptions = document.querySelectorAll(".storage-option");
  storageOptions.forEach((option) => {
    option.addEventListener("click", function () {
      storageOptions.forEach((o) => o.classList.remove("active"));
      this.classList.add("active");

      // Aquí podrías actualizar el precio según la opción seleccionada
      updatePriceBasedOnStorage(this.dataset.storage);
    });
  });
}

function setupQuantityControls() {
  const decreaseBtn = document.getElementById("decreaseBtn");
  const increaseBtn = document.getElementById("increaseBtn");
  const quantityInput = document.getElementById("quantityInput");

  if (decreaseBtn && increaseBtn && quantityInput) {
    decreaseBtn.addEventListener("click", () => {
      const value = Number.parseInt(quantityInput.value) || 1;
      if (value > 1) {
        quantityInput.value = value - 1;
      }
    });

    increaseBtn.addEventListener("click", () => {
      const value = Number.parseInt(quantityInput.value) || 1;
      const maxStock = 15; // Podrías obtener esto dinámicamente
      if (value < maxStock) {
        quantityInput.value = value + 1;
      }
    });

    // Validar input manual
    quantityInput.addEventListener("change", function () {
      let value = Number.parseInt(this.value) || 1;
      if (value < 1) value = 1;
      if (value > 15) value = 15;
      this.value = value;
    });
  }
}

function setupPurchaseActions() {
  const addToCartBtn = document.querySelector(".btn-add-cart");
  const buyNowBtn = document.querySelector(".btn-buy-now");
  const wishlistBtn = document.querySelector(".btn-wishlist");

  if (addToCartBtn) {
    addToCartBtn.addEventListener("click", handleAddToCart);
  }

  if (buyNowBtn) {
    buyNowBtn.addEventListener("click", handleBuyNow);
  }

  if (wishlistBtn) {
    wishlistBtn.addEventListener("click", handleWishlist);
  }
}

function handleAddToCart() {
  const quantity =
    Number.parseInt(document.getElementById("quantityInput").value) || 1;
  const selectedColor =
    document.querySelector(".color-option.active")?.dataset.color || "natural";
  const selectedStorage =
    document.querySelector(".storage-option.active")?.dataset.storage || "256";

  const options = {
    color: selectedColor,
    storage: selectedStorage,
  };

  // Usar el sistema de carrito global
  const success = window.DaleDeal.cart.addToCart(1, quantity, options); // ID del iPhone

  if (success) {
    // Opcional: mostrar modal de confirmación
    showAddedToCartModal();
  }
}

function handleBuyNow() {
  // Primero agregar al carrito
  handleAddToCart();

  // Luego proceder al checkout
  setTimeout(() => {
    window.DaleDeal.cart.proceedToCheckout();
  }, 500);
}

function handleWishlist() {
  const wishlistBtn = document.querySelector(".btn-wishlist");
  const isActive = wishlistBtn.classList.contains("active");

  if (isActive) {
    wishlistBtn.classList.remove("active");
    wishlistBtn.innerHTML = '<i class="bi bi-heart"></i>';
    window.DaleDeal.utils.showNotification("Eliminado de favoritos", "info");
  } else {
    wishlistBtn.classList.add("active");
    wishlistBtn.innerHTML = '<i class="bi bi-heart-fill"></i>';
    window.DaleDeal.utils.showNotification("Agregado a favoritos", "success");
  }
}

function setupProductTabs() {
  // Los tabs ya funcionan con Bootstrap, pero podemos agregar funcionalidad extra
  const tabLinks = document.querySelectorAll(".nav-tabs .nav-link");

  tabLinks.forEach((link) => {
    link.addEventListener("shown.bs.tab", (e) => {
      const targetTab = e.target.getAttribute("href");

      // Cargar contenido dinámico según el tab
      if (targetTab === "#reviews") {
        loadReviews();
      } else if (targetTab === "#questions") {
        loadQuestions();
      }
    });
  });

  // Setup question form
  const questionForm = document.querySelector(".question-form");
  if (questionForm) {
    questionForm.addEventListener("submit", handleQuestionSubmit);
  }
}

function updatePriceBasedOnStorage(storage) {
  const basePrice = 1299999;
  const priceElement = document.querySelector(".current-price");

  let finalPrice = basePrice;

  switch (storage) {
    case "128":
      finalPrice = basePrice - 100000;
      break;
    case "256":
      finalPrice = basePrice;
      break;
    case "512":
      finalPrice = basePrice + 200000;
      break;
    case "1024":
      finalPrice = basePrice + 400000;
      break;
  }

  if (priceElement) {
    priceElement.textContent = window.DaleDeal.utils.formatPrice(finalPrice);
  }
}

function showAddedToCartModal() {
  // Crear modal simple de confirmación
  const modal = document.createElement("div");
  modal.className = "modal fade";
  modal.innerHTML = `
    <div class="modal-dialog modal-sm">
      <div class="modal-content">
        <div class="modal-body text-center p-4">
          <i class="bi bi-check-circle-fill text-success display-4 mb-3"></i>
          <h5>¡Producto agregado!</h5>
          <p class="text-muted">El producto se agregó correctamente a tu carrito</p>
          <div class="d-grid gap-2">
            <button class="btn btn-primary" onclick="window.DaleDeal.cart.showCartModal()">Ver carrito</button>
            <button class="btn btn-outline-secondary" data-bs-dismiss="modal">Continuar comprando</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  const bsModal = new bootstrap.Modal(modal);
  bsModal.show();

  // Remover modal después de cerrarlo
  modal.addEventListener("hidden.bs.modal", () => {
    modal.remove();
  });
}

function loadReviews() {
  // Simular carga de reseñas adicionales
  console.log("Cargando reseñas...");
}

function loadQuestions() {
  // Simular carga de preguntas adicionales
  console.log("Cargando preguntas...");
}

function handleQuestionSubmit(event) {
  event.preventDefault();

  const textarea = event.target.querySelector("textarea");
  const question = textarea.value.trim();

  if (!question) {
    window.DaleDeal.utils.showNotification(
      "Por favor, escribe tu pregunta",
      "warning"
    );
    return;
  }

  // Simular envío de pregunta
  window.DaleDeal.utils.showNotification(
    "Tu pregunta fue enviada correctamente",
    "success"
  );
  textarea.value = "";
}

function navigateToHome() {
  // Desde HTML/ hacia la raíz
  window.location.href = "../index.html";
}

function navigateToLogin() {
  // Desde HTML/ hacia HTML/
  window.location.href = "./login.html";
}
