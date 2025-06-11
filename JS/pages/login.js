// =====================================================
// DALE DEAL - Sistema de Login
// =====================================================

// Esperar a que el DOM esté cargado
document.addEventListener("DOMContentLoaded", () => {
  initializeLoginPage();
});

function initializeLoginPage() {
  setupFormHandlers();
  setupPasswordToggle();
  loadRememberedEmail();
  setupSocialLogin();
}

// =====================================================
// MANEJO DE FORMULARIOS
// =====================================================

function setupFormHandlers() {
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");

  if (loginForm) {
    loginForm.addEventListener("submit", handleLoginSubmit);
  }

  if (signupForm) {
    signupForm.addEventListener("submit", handleSignupSubmit);
  }

  // Alternar entre login y signup
  const showSignupBtn = document.getElementById("showSignup");
  const showLoginBtn = document.getElementById("showLogin");

  if (showSignupBtn) {
    showSignupBtn.addEventListener("click", (e) => {
      e.preventDefault();
      toggleForms("signup");
    });
  }

  if (showLoginBtn) {
    showLoginBtn.addEventListener("click", (e) => {
      e.preventDefault();
      toggleForms("login");
    });
  }
}

async function handleLoginSubmit(e) {
  e.preventDefault();

  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  const email = form.querySelector("#email").value;
  const password = form.querySelector("#password").value;
  const rememberMe = form.querySelector("#rememberMe")?.checked || false;

  // Validación básica
  if (!email || !password) {
    showAlert("Por favor completa todos los campos", "error");
    return;
  }

  // Mostrar loading
  setButtonLoading(submitBtn, true);

  try {
    // Simular autenticación
    await simulateLogin(email, password);

    // Guardar email si "recordarme" está marcado
    if (rememberMe) {
      localStorage.setItem("daledealer_remembered_email", email);
    } else {
      localStorage.removeItem("daledealer_remembered_email");
    }

    // Crear usuario simulado
    const user = {
      id: Date.now(),
      email: email,
      name: extractNameFromEmail(email),
      avatar: `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face`,
      loginTime: new Date().toISOString(),
    };

    // Guardar en localStorage
    localStorage.setItem("daledealer_user", JSON.stringify(user));

    showAlert("¡Bienvenido! Redirigiendo...", "success");

    // Redirigir después de un breve delay
    setTimeout(() => {
      window.location.href = "../index.html";
    }, 1500);
  } catch (error) {
    console.error("Error en login:", error);
    showAlert(error.message || "Error al iniciar sesión", "error");
  } finally {
    setButtonLoading(submitBtn, false);
  }
}

async function handleSignupSubmit(e) {
  e.preventDefault();

  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  const fullName = form.querySelector("#fullName").value;
  const email = form.querySelector("#signupEmail").value;
  const password = form.querySelector("#signupPassword").value;
  const confirmPassword = form.querySelector("#confirmPassword").value;
  const acceptTerms = form.querySelector("#acceptTerms")?.checked || false;

  // Validaciones
  if (!fullName || !email || !password || !confirmPassword) {
    showAlert("Por favor completa todos los campos", "error");
    return;
  }

  if (password !== confirmPassword) {
    showAlert("Las contraseñas no coinciden", "error");
    return;
  }

  if (password.length < 8) {
    showAlert("La contraseña debe tener al menos 8 caracteres", "error");
    return;
  }

  if (!acceptTerms) {
    showAlert("Debes aceptar los términos y condiciones", "error");
    return;
  }

  // Mostrar loading
  setButtonLoading(submitBtn, true);

  try {
    // Simular registro
    await simulateSignup(email, password);

    // Crear usuario
    const user = {
      id: Date.now(),
      email: email,
      name: fullName,
      avatar: `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face`,
      registrationTime: new Date().toISOString(),
    };

    // Guardar en localStorage
    localStorage.setItem("daledealer_user", JSON.stringify(user));

    showAlert("¡Cuenta creada exitosamente! Redirigiendo...", "success");

    // Redirigir después de un breve delay
    setTimeout(() => {
      window.location.href = "../index.html";
    }, 1500);
  } catch (error) {
    console.error("Error en registro:", error);
    showAlert(error.message || "Error al crear la cuenta", "error");
  } finally {
    setButtonLoading(submitBtn, false);
  }
}

// =====================================================
// FUNCIONES DE SIMULACIÓN
// =====================================================

function simulateLogin(email, password) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        reject(new Error("Formato de email inválido"));
        return;
      }

      // Validar contraseña
      if (password.length < 6) {
        reject(new Error("La contraseña debe tener al menos 6 caracteres"));
        return;
      }

      // Simular éxito
      resolve();
    }, 1000 + Math.random() * 1000);
  });
}

function simulateSignup(email, password) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        reject(new Error("Formato de email inválido"));
        return;
      }

      // Simular email ya registrado (ocasionalmente)
      if (Math.random() < 0.1) {
        reject(new Error("Este email ya está registrado"));
        return;
      }

      // Simular éxito
      resolve();
    }, 1000 + Math.random() * 1000);
  });
}

// =====================================================
// UTILIDADES
// =====================================================

function toggleForms(formType) {
  const loginContainer = document.getElementById("loginContainer");
  const signupContainer = document.getElementById("signupContainer");

  if (formType === "signup") {
    loginContainer?.classList.add("d-none");
    signupContainer?.classList.remove("d-none");
  } else {
    signupContainer?.classList.add("d-none");
    loginContainer?.classList.remove("d-none");
  }
}

function setupPasswordToggle() {
  const toggleButtons = document.querySelectorAll(".password-toggle");

  toggleButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const input = this.parentElement.querySelector("input");
      const icon = this.querySelector("i");

      if (input.type === "password") {
        input.type = "text";
        icon.className = "bi bi-eye-slash";
      } else {
        input.type = "password";
        icon.className = "bi bi-eye";
      }
    });
  });
}

function loadRememberedEmail() {
  const rememberedEmail = localStorage.getItem("daledealer_remembered_email");
  const emailInput = document.getElementById("email");
  const rememberCheckbox = document.getElementById("rememberMe");

  if (rememberedEmail && emailInput) {
    emailInput.value = rememberedEmail;
    if (rememberCheckbox) {
      rememberCheckbox.checked = true;
    }
  }
}

function setupSocialLogin() {
  const googleBtn = document.getElementById("googleLogin");
  const facebookBtn = document.getElementById("facebookLogin");

  if (googleBtn) {
    googleBtn.addEventListener("click", (e) => {
      e.preventDefault();
      showAlert("Login con Google no disponible en demo", "info");
    });
  }

  if (facebookBtn) {
    facebookBtn.addEventListener("click", (e) => {
      e.preventDefault();
      showAlert("Login con Facebook no disponible en demo", "info");
    });
  }
}

function extractNameFromEmail(email) {
  const username = email.split("@")[0];
  return username.charAt(0).toUpperCase() + username.slice(1);
}

function setButtonLoading(button, isLoading) {
  if (!button) return;

  if (isLoading) {
    button.disabled = true;
    button.innerHTML = `
      <span class="spinner-border spinner-border-sm me-2" role="status"></span>
      Procesando...
    `;
  } else {
    button.disabled = false;
    // Restaurar texto original basado en el contexto
    if (button.closest("#loginForm")) {
      button.innerHTML = "Iniciar Sesión";
    } else if (button.closest("#signupForm")) {
      button.innerHTML = "Crear Cuenta";
    }
  }
}

function showAlert(message, type = "info") {
  // Crear contenedor de alertas si no existe
  let alertContainer = document.getElementById("alertContainer");
  if (!alertContainer) {
    alertContainer = document.createElement("div");
    alertContainer.id = "alertContainer";
    alertContainer.className =
      "position-fixed top-0 start-50 translate-middle-x";
    alertContainer.style.zIndex = "1070";
    alertContainer.style.marginTop = "20px";
    document.body.appendChild(alertContainer);
  }

  const alertId = `alert-${Date.now()}`;
  const alertHTML = `
    <div id="${alertId}" class="alert alert-${
    type === "error" ? "danger" : type
  } alert-dismissible fade show" role="alert">
      <i class="bi bi-${getAlertIcon(type)} me-2"></i>
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>
  `;

  alertContainer.insertAdjacentHTML("beforeend", alertHTML);

  // Auto-remover después de 5 segundos
  setTimeout(() => {
    const alert = document.getElementById(alertId);
    if (alert) {
      alert.remove();
    }
  }, 5000);
}

function getAlertIcon(type) {
  const icons = {
    success: "check-circle",
    error: "exclamation-triangle",
    danger: "exclamation-triangle",
    warning: "exclamation-triangle",
    info: "info-circle",
  };
  return icons[type] || "info-circle";
}
