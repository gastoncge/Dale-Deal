/**
 * DALE DEAL - Registration Page JavaScript
 * Funcionalidad para la página de registro de usuarios
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

  // Configurar medidor de fuerza de contraseña
  setupPasswordStrength();

  // Configurar botones sociales
  setupSocialButtons();

  console.log("✅ Aplicación de registro inicializada correctamente");
}

/**
 * Configura todos los event listeners
 */
function setupEventListeners() {
  const form = document.getElementById("registrationForm");
  const togglePassword = document.getElementById("togglePassword");
  const toggleConfirmPassword = document.getElementById(
    "toggleConfirmPassword"
  );

  // Event listener para el formulario
  if (form) {
    form.addEventListener("submit", handleFormSubmit);
  }

  // Event listeners para mostrar/ocultar contraseñas
  if (togglePassword) {
    togglePassword.addEventListener("click", () =>
      togglePasswordVisibility("password", "togglePassword")
    );
  }

  if (toggleConfirmPassword) {
    toggleConfirmPassword.addEventListener("click", () =>
      togglePasswordVisibility("confirmPassword", "toggleConfirmPassword")
    );
  }

  // Event listener para validación en tiempo real
  const inputs = form.querySelectorAll("input");
  inputs.forEach((input) => {
    input.addEventListener("blur", () => validateField(input));
    input.addEventListener("input", () => clearFieldError(input));
  });

  // Event listener para el checkbox de términos
  const termsCheck = document.getElementById("termsCheck");
  if (termsCheck) {
    termsCheck.addEventListener("change", function () {
      if (this.checked) {
        this.classList.remove("is-invalid");
      }
    });
  }
}

/**
 * Configura la validación del formulario
 */
function setupFormValidation() {
  const form = document.getElementById("registrationForm");

  // Validación personalizada para confirmación de contraseña
  const passwordField = document.getElementById("password");
  const confirmPasswordField = document.getElementById("confirmPassword");

  if (confirmPasswordField && passwordField) {
    confirmPasswordField.addEventListener("input", function () {
      if (this.value !== passwordField.value) {
        this.setCustomValidity("Las contraseñas no coinciden");
      } else {
        this.setCustomValidity("");
      }
    });

    passwordField.addEventListener("input", function () {
      if (
        confirmPasswordField.value &&
        confirmPasswordField.value !== this.value
      ) {
        confirmPasswordField.setCustomValidity("Las contraseñas no coinciden");
      } else {
        confirmPasswordField.setCustomValidity("");
      }
    });
  }

  // Validación personalizada para nombre completo
  const fullNameField = document.getElementById("fullName");
  if (fullNameField) {
    fullNameField.addEventListener("input", function () {
      const value = this.value.trim();
      if (value.length < 2) {
        this.setCustomValidity("El nombre debe tener al menos 2 caracteres");
      } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(value)) {
        this.setCustomValidity(
          "El nombre solo puede contener letras y espacios"
        );
      } else {
        this.setCustomValidity("");
      }
    });
  }

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
}

/**
 * Configura el medidor de fuerza de contraseña
 */
function setupPasswordStrength() {
  const passwordField = document.getElementById("password");
  const strengthBar = document.getElementById("passwordStrengthBar");
  const strengthText = document.getElementById("passwordStrengthText");

  if (passwordField && strengthBar && strengthText) {
    passwordField.addEventListener("input", function () {
      const strength = calculatePasswordStrength(this.value);
      updatePasswordStrengthUI(strength, strengthBar, strengthText);
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
 * Calcula la fuerza de la contraseña
 * @param {string} password - La contraseña a evaluar
 * @returns {Object} Objeto con score y texto de la fuerza
 */
function calculatePasswordStrength(password) {
  let score = 0;
  let feedback = [];

  if (password.length === 0) {
    return { score: 0, text: "Mínimo 8 caracteres", class: "" };
  }

  if (password.length >= 8) score += 25;
  else feedback.push("mínimo 8 caracteres");

  if (password.match(/[a-z]/)) score += 20;
  else feedback.push("letras minúsculas");

  if (password.match(/[A-Z]/)) score += 20;
  else feedback.push("letras mayúsculas");

  if (password.match(/[0-9]/)) score += 20;
  else feedback.push("números");

  if (password.match(/[^A-Za-z0-9]/)) score += 15;
  else feedback.push("símbolos especiales");

  // Bonificaciones
  if (password.length >= 12) score += 10;
  if (password.match(/[!@#$%^&*(),.?":{}|<>]/)) score += 5;

  // Penalizaciones
  if (password.match(/(.)\1{2,}/)) score -= 15; // Penalizar repeticiones
  if (password.match(/123|abc|qwe|password/i)) score -= 20; // Patrones comunes

  let strengthClass = "";
  let strengthText = "";

  if (score < 40) {
    strengthClass = "weak";
    strengthText = "Débil";
    if (feedback.length > 0) {
      strengthText += ` - Falta: ${feedback.slice(0, 2).join(", ")}`;
    }
  } else if (score < 70) {
    strengthClass = "medium";
    strengthText = "Media";
    if (feedback.length > 0) {
      strengthText += ` - Sugerencia: ${feedback[0]}`;
    }
  } else {
    strengthClass = "strong";
    strengthText = "¡Excelente!";
  }

  return {
    score: Math.min(score, 100),
    text: strengthText,
    class: strengthClass,
  };
}

/**
 * Actualiza la UI del medidor de fuerza de contraseña
 * @param {Object} strength - Objeto con información de la fuerza
 * @param {HTMLElement} bar - Elemento de la barra de progreso
 * @param {HTMLElement} text - Elemento del texto
 */
function updatePasswordStrengthUI(strength, bar, text) {
  // Actualizar barra de progreso
  bar.style.width = `${strength.score}%`;
  bar.className = `progress-bar ${strength.class}`;

  // Actualizar texto
  text.textContent = strength.text;
  text.className = `strength-text text-${
    strength.class === "strong"
      ? "success"
      : strength.class === "medium"
      ? "warning"
      : "danger"
  }`;
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
  } else {
    field.classList.remove("is-invalid");
    field.classList.add("is-valid");
  }

  return isValid;
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
  const submitBtn = document.getElementById("submitBtn");

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
    await simulateRegistration(formData);

    // Mostrar éxito
    showAlert("¡Cuenta creada exitosamente! Redirigiendo...", "success");

    // Limpiar formulario
    form.reset();
    clearAllValidations(form);

    // Simular redirección después de un breve delay
    setTimeout(() => {
      window.location.href = "./index.html";
    }, 2000);
  } catch (error) {
    console.error("Error al crear cuenta:", error);
    showAlert(handleNetworkError(error), "danger");
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

  // Validación adicional para contraseñas
  const password = document.getElementById("password");
  const confirmPassword = document.getElementById("confirmPassword");

  if (password.value !== confirmPassword.value) {
    confirmPassword.setCustomValidity("Las contraseñas no coinciden");
    validateField(confirmPassword);
    isValid = false;
  }

  // Validar checkbox de términos
  const termsCheck = document.getElementById("termsCheck");
  if (!termsCheck.checked) {
    termsCheck.classList.add("is-invalid");
    isValid = false;
  }

  return isValid;
}

/**
 * Valida los datos del formulario
 * @param {Object} formData - Los datos del formulario
 * @returns {boolean} True si es válido, false si no
 */
function validateFormData(formData) {
  // Validar nombre completo
  if (!formData.fullName || formData.fullName.trim().length < 2) {
    showAlert("El nombre completo debe tener al menos 2 caracteres.", "danger");
    return false;
  }

  // Validar email
  if (!isValidEmail(formData.email)) {
    showAlert("Por favor, ingresá un email válido.", "danger");
    return false;
  }

  // Validar contraseña
  if (formData.password.length < 8) {
    showAlert("La contraseña debe tener al menos 8 caracteres.", "danger");
    return false;
  }

  // Validar términos
  if (!formData.acceptTerms) {
    showAlert("Debes aceptar los términos y condiciones.", "danger");
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
    fullName: sanitizeInput(formData.get("fullName") || "").trim(),
    email: (formData.get("email") || "").trim().toLowerCase(),
    password: formData.get("password") || "",
    acceptTerms: formData.get("termsCheck") === "on",
  };
}

/**
 * Simula el proceso de registro (reemplazar con API real)
 * @param {Object} userData - Datos del usuario
 */
async function simulateRegistration(userData) {
  // Simular delay de red
  await new Promise((resolve) => setTimeout(resolve, 1500));

  // Simular validación de email duplicado (ejemplo)
  const existingEmails = [
    "test@test.com",
    "admin@daledeal.com",
    "ejemplo@ejemplo.com",
  ];
  if (existingEmails.includes(userData.email)) {
    throw new Error(
      "Este email ya está registrado. Usá otro email o iniciá sesión."
    );
  }

  // Simular error aleatorio para testing (5% de probabilidad)
  if (Math.random() < 0.05) {
    throw new Error("Error del servidor. Por favor, intentá nuevamente.");
  }

  // Simular éxito
  console.log("Usuario registrado exitosamente:", {
    ...userData,
    password: "[PROTECTED]", // No loggear la contraseña real
  });

  // Aquí iría la llamada real a la API
  /*
  const response = await fetch('/api/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData)
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al crear la cuenta');
  }

  return await response.json();
  */
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

  // Limpiar medidor de contraseña
  const strengthBar = document.getElementById("passwordStrengthBar");
  const strengthText = document.getElementById("passwordStrengthText");
  if (strengthBar && strengthText) {
    strengthBar.style.width = "0%";
    strengthBar.className = "progress-bar";
    strengthText.textContent = "Mínimo 8 caracteres";
    strengthText.className = "strength-text";
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

// Función para sanitizar texto de entrada
function sanitizeInput(input) {
  if (typeof input !== "string") return "";
  const div = document.createElement("div");
  div.textContent = input;
  return div.innerHTML;
}

// Función para manejar errores de red
function handleNetworkError(error) {
  if (!navigator.onLine) {
    return "No hay conexión a internet. Verificá tu conexión y volvé a intentar.";
  }

  if (error.name === "TypeError" && error.message.includes("fetch")) {
    return "Error de conexión. Verificá tu conexión a internet.";
  }

  return (
    error.message ||
    "Ha ocurrido un error inesperado. Por favor, intentá nuevamente."
  );
}

// Event listener para detectar cambios en la conectividad
window.addEventListener("online", function () {
  showAlert("Conexión restablecida.", "success");
});

window.addEventListener("offline", function () {
  showAlert("Se perdió la conexión a internet.", "warning");
});

// Prevenir envío accidental del formulario con Enter en campos que no sean submit
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

// Función para mejorar la accesibilidad
function setupAccessibility() {
  // Agregar ARIA labels a los campos de contraseña
  const passwordToggles = document.querySelectorAll(".password-toggle");
  passwordToggles.forEach((toggle) => {
    toggle.setAttribute("aria-label", "Mostrar contraseña");
    toggle.setAttribute("type", "button");
  });

  // Agregar descripciones ARIA para el medidor de contraseña
  const passwordField = document.getElementById("password");
  const strengthText = document.getElementById("passwordStrengthText");
  if (passwordField && strengthText) {
    strengthText.setAttribute("aria-live", "polite");
    passwordField.setAttribute("aria-describedby", "passwordStrengthText");
  }
}

// Inicializar mejoras de accesibilidad cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", setupAccessibility);

// Debug information
console.log("🚀 DALE DEAL Registration System v2.0 - Cargado correctamente");

// Exponer funciones útiles para debugging (solo en desarrollo)
if (
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
) {
  window.DaleDealDebug = {
    validateEmail: isValidEmail,
    calculatePasswordStrength,
    showAlert,
    validateForm: () =>
      validateForm(document.getElementById("registrationForm")),
  };
}
