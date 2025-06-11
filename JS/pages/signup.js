/**
 * =====================================================
 * DALE DEAL - Página de Registro
 * =====================================================
 */

document.addEventListener("DOMContentLoaded", () => {
  initializeSignupPage();
});

function initializeSignupPage() {
  setupFormHandlers();
  setupPasswordToggles();
  setupPasswordStrength();
  setupSocialButtons();

  console.log("✅ Página de registro inicializada");
}

function setupFormHandlers() {
  const form = document.getElementById("registrationForm");
  if (!form) return;

  form.addEventListener("submit", handleSignupSubmit);

  // Validación en tiempo real
  const inputs = form.querySelectorAll("input");
  inputs.forEach((input) => {
    input.addEventListener("blur", () => DaleDeal.utils.validateField(input));
    input.addEventListener("input", () =>
      DaleDeal.utils.clearFieldError(input)
    );
  });

  // Validación de confirmación de contraseña
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

  // Checkbox de términos
  const termsCheck = document.getElementById("termsCheck");
  if (termsCheck) {
    termsCheck.addEventListener("change", function () {
      if (this.checked) {
        this.classList.remove("is-invalid");
      }
    });
  }
}

function setupPasswordToggles() {
  const togglePassword = document.getElementById("togglePassword");
  const toggleConfirmPassword = document.getElementById(
    "toggleConfirmPassword"
  );

  if (togglePassword) {
    togglePassword.addEventListener("click", () => {
      togglePasswordVisibility("password", "togglePassword");
    });
  }

  if (toggleConfirmPassword) {
    toggleConfirmPassword.addEventListener("click", () => {
      togglePasswordVisibility("confirmPassword", "toggleConfirmPassword");
    });
  }
}

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

function setupPasswordStrength() {
  const passwordField = document.getElementById("password");
  const strengthBar = document.getElementById("passwordStrengthBar");
  const strengthText = document.getElementById("passwordStrengthText");

  if (passwordField && strengthBar && strengthText) {
    passwordField.addEventListener("input", function () {
      const strength = DaleDeal.utils.calculatePasswordStrength(this.value);
      updatePasswordStrengthUI(strength, strengthBar, strengthText);
    });
  }
}

function updatePasswordStrengthUI(strength, bar, text) {
  // Actualizar barra
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

function setupSocialButtons() {
  const googleBtn = document.querySelector(".google-btn");
  const facebookBtn = document.querySelector(".facebook-btn");

  if (googleBtn) {
    googleBtn.addEventListener("click", () => {
      DaleDeal.utils.showNotification(
        "Funcionalidad de Google en desarrollo",
        "info"
      );
    });
  }

  if (facebookBtn) {
    facebookBtn.addEventListener("click", () => {
      DaleDeal.utils.showNotification(
        "Funcionalidad de Facebook en desarrollo",
        "info"
      );
    });
  }
}

async function handleSignupSubmit(event) {
  event.preventDefault();

  const form = event.target;
  const submitBtn = document.getElementById("submitBtn");

  // Validar formulario
  if (!validateSignupForm(form)) {
    DaleDeal.utils.showNotification(
      "Por favor, corregí los errores en el formulario",
      "error"
    );
    return;
  }

  // Mostrar loading
  DaleDeal.utils.setLoadingState(submitBtn, true);

  try {
    // Recopilar datos
    const formData = DaleDeal.utils.collectFormData(form);
    const userData = {
      fullName: DaleDeal.utils.sanitizeInput(formData.fullName || "").trim(),
      email: (formData.email || "").trim().toLowerCase(),
      password: formData.password || "",
      acceptTerms: formData.termsCheck === "on",
    };

    // Intentar registro
    await DaleDeal.auth.register(userData);

    // Mostrar éxito
    DaleDeal.utils.showNotification(
      "¡Cuenta creada exitosamente! Redirigiendo...",
      "success"
    );

    // Limpiar formulario
    form.reset();
    clearAllValidations(form);

    // Redirigir
    setTimeout(() => {
      window.location.href = "./login.html";
    }, 2000);
  } catch (error) {
    console.error("Error en registro:", error);
    DaleDeal.utils.showNotification(
      error.message || "Error al crear la cuenta",
      "error"
    );
  } finally {
    DaleDeal.utils.setLoadingState(submitBtn, false);
  }
}

function validateSignupForm(form) {
  let isValid = true;
  const fields = form.querySelectorAll("input[required]");

  fields.forEach((field) => {
    if (!DaleDeal.utils.validateField(field)) {
      isValid = false;
    }
  });

  // Validación de contraseñas
  const password = document.getElementById("password");
  const confirmPassword = document.getElementById("confirmPassword");

  if (password.value !== confirmPassword.value) {
    confirmPassword.setCustomValidity("Las contraseñas no coinciden");
    DaleDeal.utils.validateField(confirmPassword);
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
