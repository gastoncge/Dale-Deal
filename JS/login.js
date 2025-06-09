/**
 * DALE DEAL - Login Page JavaScript
 * Funcionalidad para la página de inicio de sesión de usuarios
 */

// Inicialización cuando el DOM está cargado
document.addEventListener("DOMContentLoaded", function () {
  initializeApp();
});

/**
 * Inicializa la aplicación
 */
function initializeApp() {
  // Configurar event listeners
  setupEventListeners();

  // Configurar validación del formulario
  setupFormValidation();

  // Configurar botones sociales
  setupSocialButtons();

  // Configurar funcionalidades adicionales
  setupAdditionalFeatures();

  console.log("✅ Aplicación de login inicializada correctamente");
}

/**
 * Configura todos los event listeners
 */
function setupEventListeners() {
  const form = document.getElementById("loginForm");
  const togglePassword = document.getElementById("togglePassword");

  // Event listener para el formulario
  if (form) {
    form.addEventListener("submit", handleFormSubmit);
  }

  // Event listener para mostrar/ocultar contraseña
  if (togglePassword) {
    togglePassword.addEventListener("click", () =>
      togglePasswordVisibility("password", "togglePassword")
    );
  }

  // Event listener para validación en tiempo real
  const inputs = form.querySelectorAll("input");
  inputs.forEach((input) => {
    input.addEventListener("blur", () => validateField(input));
    input.addEventListener("input", () => clearFieldError(input));
  });

  // Event listener para el enlace de "olvidé mi contraseña"
  const forgotPasswordLink = document.querySelector(".forgot-password-link");
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener("click", handleForgotPassword);
  }
}

/**
 * Configura la validación del formulario
 */
function setupFormValidation() {
  const form = document.getElementById("loginForm");

  // Validación personalizada para email
  const emailField = document.getElementById("email");
  if (emailField) {
    emailField.addEventListener("input", function () {
      if (!isValidEmail(this.value)) {
        this.setCustomValidity("Por favor, ingresá un email válido");
      } else {
        this.setCustomValidity("");
      }
    });
  }

  // Validación personalizada para contraseña
  const passwordField = document.getElementById("password");
  if (passwordField) {
    passwordField.addEventListener("input", function () {
      if (this.value.length < 1) {
        this.setCustomValidity("La contraseña es requerida");
      } else {
        this.setCustomValidity("");
      }
    });
  }
}

/**
 * Configura los botones sociales
 */
function setupSocialButtons() {
  const googleBtn = document.querySelector(".google-btn");
  const facebookBtn = document.querySelector(".facebook-btn");

  if (googleBtn) {
    googleBtn.addEventListener("click", function () {
      showAlert("Funcionalidad de Google en desarrollo.", "info");
    });
  }

  if (facebookBtn) {
    facebookBtn.addEventListener("click", function () {
      showAlert("Funcionalidad de Facebook en desarrollo.", "info");
    });
  }
}

/**
 * Configura funcionalidades adicionales
 */
function setupAdditionalFeatures() {
  // Recordar email si estaba guardado
  loadRememberedEmail();

  // Configurar accesibilidad
  setupAccessibility();

  // Auto-focus en el primer campo
  const emailField = document.getElementById("email");
  if (emailField && !isMobileDevice()) {
    setTimeout(() => emailField.focus(), 100);
  }
}

/**
 * Alterna la visibilidad de la contraseña
 * @param {string} inputId - ID del campo de contraseña
 * @param {string} toggleId - ID del botón de alternar
 */
function togglePasswordVisibility(inputId, toggleId) {
  const input = document.getElementById(inputId);
  const toggle = document.getElementById(toggleId);
  const icon = toggle.querySelector("i");

  if (input.type === "password") {
    input.type = "text";
    icon.className = "bi bi-eye-slash";
    toggle.setAttribute("aria-label", "Ocultar contraseña");
  } else {
    input.type = "password";
    icon.className = "bi bi-eye";
    toggle.setAttribute("aria-label", "Mostrar contraseña");
  }
}

/**
 * Valida un campo individual
 * @param {HTMLElement} field - El campo a validar
 * @returns {boolean} True si es válido, false si no
 */
function validateField(field) {
  const isValid = field.checkValidity();

  if (!isValid) {
    field.classList.add("is-invalid");
    field.classList.remove("is-valid");
    showFieldError(field);
  } else {
    field.classList.remove("is-invalid");
    field.classList.add("is-valid");
  }

  return isValid;
}

/**
 * Muestra el error específico de un campo
 * @param {HTMLElement} field - El campo con error
 */
function showFieldError(field) {
  const errorDiv = field.parentNode.querySelector(".invalid-feedback");
  if (errorDiv) {
    let errorMessage = field.validationMessage;

    // Personalizar mensajes de error
    if (field.type === "email" && field.validity.valueMissing) {
      errorMessage = "El email es requerido";
    } else if (field.type === "email" && field.validity.typeMismatch) {
      errorMessage = "Por favor, ingresá un email válido";
    } else if (field.type === "password" && field.validity.valueMissing) {
      errorMessage = "La contraseña es requerida";
    }

    errorDiv.textContent = errorMessage;
  }
}

/**
 * Limpia los errores de un campo
 * @param {HTMLElement} field - El campo a limpiar
 */
function clearFieldError(field) {
  if (field.classList.contains("is-invalid")) {
    field.classList.remove("is-invalid");
  }
}

/**
 * Maneja el envío del formulario
 * @param {Event} event - El evento de envío
 */
async function handleFormSubmit(event) {
  event.preventDefault();

  const form = event.target;
  const submitBtn = document.getElementById("loginBtn");

  // Validar formulario
  if (!validateForm(form)) {
    showAlert("Por favor, corregí los errores en el formulario.", "danger");
    // Scroll al primer campo con error
    const firstError = form.querySelector(".is-invalid");
    if (firstError) {
      firstError.scrollIntoView({ behavior: "smooth", block: "center" });
      firstError.focus();
    }
    return;
  }

  // Mostrar estado de carga
  setLoadingState(submitBtn, true);

  try {
    // Recopilar datos del formulario
    const formData = collectFormData(form);

    // Validaciones adicionales
    if (!validateFormData(formData)) {
      return;
    }

    // Simular llamada a API (reemplazar con la implementación real)
    const loginResult = await simulateLogin(formData);

    // Guardar email si "recordarme" está marcado
    if (formData.rememberMe) {
      saveRememberedEmail(formData.email);
    } else {
      clearRememberedEmail();
    }

    // Mostrar éxito
    showAlert("¡Inicio de sesión exitoso! Redirigiendo...", "success");

    // Limpiar formulario
    form.reset();
    clearAllValidations(form);

    // Simular redirección después de un breve delay
    setTimeout(() => {
      // En una aplicación real, redirigir al dashboard o página principal
      window.location.href = "./inicio.html"; // Cambiar por la URL apropiada
    }, 1500);
  } catch (error) {
    console.error("Error al iniciar sesión:", error);
    showAlert(handleLoginError(error), "danger");
  } finally {
    setLoadingState(submitBtn, false);
  }
}

/**
 * Valida todo el formulario
 * @param {HTMLFormElement} form - El formulario a validar
 * @returns {boolean} True si es válido, false si no
 */
function validateForm(form) {
  let isValid = true;
  const fields = form.querySelectorAll("input[required]");

  fields.forEach((field) => {
    if (!validateField(field)) {
      isValid = false;
    }
  });

  return isValid;
}

/**
 * Valida los datos del formulario
 * @param {Object} formData - Los datos del formulario
 * @returns {boolean} True si es válido, false si no
 */
function validateFormData(formData) {
  // Validar email
  if (!isValidEmail(formData.email)) {
    showAlert("Por favor, ingresá un email válido.", "danger");
    return false;
  }

  // Validar contraseña
  if (!formData.password || formData.password.length < 1) {
    showAlert("La contraseña es requerida.", "danger");
    return false;
  }

  return true;
}

/**
 * Recopila los datos del formulario
 * @param {HTMLFormElement} form - El formulario
 * @returns {Object} Objeto con los datos del formulario
 */
function collectFormData(form) {
  const formData = new FormData(form);
  return {
    email: (formData.get("email") || "").trim().toLowerCase(),
    password: formData.get("password") || "",
    rememberMe: formData.get("rememberMe") === "on",
  };
}

/**
 * Simula el proceso de login (reemplazar con API real)
 * @param {Object} loginData - Datos de login
 */
async function simulateLogin(loginData) {
  // Simular delay de red
  await new Promise((resolve) => setTimeout(resolve, 1200));

  // Simular credenciales de prueba
  const validCredentials = [
    { email: "admin@daledeal.com", password: "admin123" },
    { email: "test@test.com", password: "test123" },
    { email: "demo@demo.com", password: "demo123" },
  ];

  // Verificar credenciales
  const validUser = validCredentials.find(
    (cred) =>
      cred.email === loginData.email && cred.password === loginData.password
  );

  if (!validUser) {
    throw new Error("Email o contraseña incorrectos");
  }

  // Simular error aleatorio para testing (3% de probabilidad)
  if (Math.random() < 0.03) {
    throw new Error("Error del servidor. Por favor, intentá nuevamente.");
  }

  // Simular éxito
  console.log("Usuario logueado exitosamente:", {
    email: loginData.email,
    rememberMe: loginData.rememberMe,
    timestamp: new Date().toISOString(),
  });

  return {
    success: true,
    user: {
      email: loginData.email,
      name: "Usuario Demo", // En una app real vendría del servidor
    },
  };

  // Aquí iría la llamada real a la API
  /*
  const response = await fetch('/api/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: loginData.email,
      password: loginData.password
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al iniciar sesión');
  }

  return await response.json();
  */
}

/**
 * Maneja el clic en "olvidé mi contraseña"
 * @param {Event} event - El evento de clic
 */
function handleForgotPassword(event) {
  event.preventDefault();

  // Obtener email si está ingresado
  const emailField = document.getElementById("email");
  const email = emailField ? emailField.value.trim() : "";

  if (email && isValidEmail(email)) {
    showAlert(
      `Se enviaron las instrucciones de recuperación a ${email}`,
      "info"
    );
  } else {
    showAlert(
      "Por favor, ingresá tu email primero para recuperar tu contraseña.",
      "warning"
    );
    if (emailField) emailField.focus();
  }

  // En una aplicación real, aquí se abriría un modal o redirigir a una página de recuperación
}

/**
 * Limpia todas las validaciones del formulario
 * @param {HTMLFormElement} form - El formulario
 */
function clearAllValidations(form) {
  const fields = form.querySelectorAll("input");
  fields.forEach((field) => {
    field.classList.remove("is-valid", "is-invalid");
  });
}

/**
 * Guarda el email en localStorage para recordarlo
 * @param {string} email - El email a recordar
 */
function saveRememberedEmail(email) {
  try {
    // En el entorno de Claude.ai no podemos usar localStorage
    // pero dejamos el código para cuando se use en un entorno real
    if (typeof Storage !== "undefined") {
      localStorage.setItem("daleDealRememberedEmail", email);
    }
  } catch (error) {
    console.warn("No se pudo guardar el email:", error);
  }
}

/**
 * Carga el email recordado si existe
 */
function loadRememberedEmail() {
  try {
    if (typeof Storage !== "undefined") {
      const rememberedEmail = localStorage.getItem("daleDealRememberedEmail");
      if (rememberedEmail) {
        const emailField = document.getElementById("email");
        const rememberCheckbox = document.getElementById("rememberMe");

        if (emailField) {
          emailField.value = rememberedEmail;
        }
        if (rememberCheckbox) {
          rememberCheckbox.checked = true;
        }
      }
    }
  } catch (error) {
    console.warn("No se pudo cargar el email recordado:", error);
  }
}

/**
 * Elimina el email recordado
 */
function clearRememberedEmail() {
  try {
    if (typeof Storage !== "undefined") {
      localStorage.removeItem("daleDealRememberedEmail");
    }
  } catch (error) {
    console.warn("No se pudo eliminar el email recordado:", error);
  }
}

/**
 * Muestra una alerta
 * @param {string} message - El mensaje a mostrar
 * @param {string} type - El tipo de alerta (success, danger, warning, info)
 */
function showAlert(message, type = "info") {
  const alertContainer = document.getElementById("alertContainer");

  if (!alertContainer) {
    console.warn("Contenedor de alertas no encontrado");
    return;
  }

  // Crear elemento de alerta
  const alertElement = document.createElement("div");
  alertElement.className = `alert alert-${type} alert-dismissible fade show`;
  alertElement.setAttribute("role", "alert");
  alertElement.innerHTML = `
    <i class="bi bi-${getAlertIcon(type)} me-2"></i>
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
  `;

  // Limpiar alertas anteriores
  alertContainer.innerHTML = "";

  // Agregar nueva alerta
  alertContainer.appendChild(alertElement);

  // Scroll hacia la alerta
  alertElement.scrollIntoView({ behavior: "smooth", block: "nearest" });

  // Auto-remover después de 5 segundos para alertas de éxito
  if (type === "success") {
    setTimeout(() => {
      if (alertElement.parentNode) {
        const bsAlert = new bootstrap.Alert(alertElement);
        bsAlert.close();
      }
    }, 5000);
  }
}

/**
 * Obtiene el icono apropiado para el tipo de alerta
 * @param {string} type - El tipo de alerta
 * @returns {string} El nombre del icono
 */
function getAlertIcon(type) {
  const icons = {
    success: "check-circle-fill",
    danger: "exclamation-triangle-fill",
    warning: "exclamation-triangle-fill",
    info: "info-circle-fill",
  };
  return icons[type] || "info-circle-fill";
}

/**
 * Establece el estado de carga del botón
 * @param {HTMLElement} button - El botón
 * @param {boolean} loading - Si está cargando o no
 */
function setLoadingState(button, loading) {
  const btnText = button.querySelector(".btn-text");
  const btnLoading = button.querySelector(".btn-loading");

  if (loading) {
    btnText.classList.add("d-none");
    btnLoading.classList.remove("d-none");
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
  } else {
    btnText.classList.remove("d-none");
    btnLoading.classList.add("d-none");
    button.disabled = false;
    button.removeAttribute("aria-busy");
  }
}

/**
 * Utilidades adicionales
 */

// Función para validar email con regex más estricta
function isValidEmail(email) {
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email) && email.length <= 254;
}

// Función para manejar errores de login específicos
function handleLoginError(error) {
  if (!navigator.onLine) {
    return "No hay conexión a internet. Verificá tu conexión y volvé a intentar.";
  }

  if (error.message.includes("Email o contraseña incorrectos")) {
    return "Email o contraseña incorrectos. Verificá tus datos e intentá nuevamente.";
  }

  if (error.name === "TypeError" && error.message.includes("fetch")) {
    return "Error de conexión. Verificá tu conexión a internet.";
  }

  return (
    error.message ||
    "Ha ocurrido un error inesperado. Por favor, intentá nuevamente."
  );
}

// Función para detectar si es un dispositivo móvil
function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

// Función para mejorar la accesibilidad
function setupAccessibility() {
  // Agregar ARIA labels al botón de mostrar/ocultar contraseña
  const passwordToggle = document.getElementById("togglePassword");
  if (passwordToggle) {
    passwordToggle.setAttribute("aria-label", "Mostrar contraseña");
    passwordToggle.setAttribute("type", "button");
  }

  // Mejorar accesibilidad del formulario
  const form = document.getElementById("loginForm");
  if (form) {
    form.setAttribute("novalidate", "");
    form.setAttribute("aria-label", "Formulario de inicio de sesión");
  }
}

// Event listener para detectar cambios en la conectividad
window.addEventListener("online", function () {
  showAlert("Conexión restablecida.", "success");
});

window.addEventListener("offline", function () {
  showAlert("Se perdió la conexión a internet.", "warning");
});

// Prevenir envío accidental del formulario con Enter
document.addEventListener("keydown", function (event) {
  if (
    event.key === "Enter" &&
    event.target.tagName !== "BUTTON" &&
    event.target.type !== "submit" &&
    !event.target.classList.contains("btn-close")
  ) {
    const form = event.target.closest("form");
    if (form && event.target.form) {
      event.preventDefault();
      // Enfocar el siguiente campo o el botón de envío
      const formElements = Array.from(form.elements).filter(
        (el) => !el.disabled && el.type !== "hidden" && el.tabIndex !== -1
      );
      const currentIndex = formElements.indexOf(event.target);
      const nextElement = formElements[currentIndex + 1];

      if (nextElement) {
        nextElement.focus();
      } else {
        // Si no hay siguiente elemento, enviar el formulario
        form.requestSubmit();
      }
    }
  }
});

// Debug information
console.log("🚀 DALE DEAL Login System v2.0 - Cargado correctamente");

// Exponer funciones útiles para debugging (solo en desarrollo)
if (
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
) {
  window.DaleDealLoginDebug = {
    validateEmail: isValidEmail,
    showAlert,
    validateForm: () => validateForm(document.getElementById("loginForm")),
    simulateLogin,
    loadRememberedEmail,
    clearRememberedEmail,
  };
}

// Mensaje de bienvenida en consola
console.log(
  "%c🏪 DALE DEAL - Sistema de Login",
  "color: #d63031; font-size: 16px; font-weight: bold;"
);
console.log("%cCredenciales de prueba:", "color: #ff8000; font-weight: bold;");
console.log("📧 admin@daledeal.com | 🔑 admin123");
console.log("📧 test@test.com | 🔑 test123");
console.log("📧 demo@demo.com | 🔑 demo123");
