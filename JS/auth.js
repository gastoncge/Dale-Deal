/**
 * =====================================================
 * DALE DEAL - Sistema de Autenticación Unificado
 * =====================================================
 */

class AuthManager {
  constructor() {
    this.storageKey = "daledealer_user";
    this.rememberedEmailKey = "daledealer_remembered_email";
    this.currentUser = null;
    this.isInitialized = false;

    this.init();
  }

  // ===== INICIALIZACIÓN =====
  init() {
    if (this.isInitialized) return;

    this.loadCurrentUser();
    this.updateUI();
    this.bindGlobalEvents();
    this.isInitialized = true;

    console.log("✅ AuthManager inicializado");
  }

  // ===== GESTIÓN DE USUARIO =====
  loadCurrentUser() {
    try {
      const userData = localStorage.getItem(this.storageKey);
      this.currentUser = userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error("Error cargando usuario:", error);
      this.currentUser = null;
    }
  }

  getCurrentUser() {
    return this.currentUser;
  }

  isAuthenticated() {
    return this.currentUser !== null;
  }

  // ===== AUTENTICACIÓN =====
  async login(credentials) {
    try {
      this.validateLoginCredentials(credentials);

      // Simular llamada a API
      await this.simulateAPICall();

      // Crear objeto de usuario
      const user = {
        id: Date.now(),
        email: credentials.email,
        name: this.extractNameFromEmail(credentials.email),
        avatar: this.generateAvatarUrl(),
        loginTime: new Date().toISOString(),
      };

      // Guardar usuario
      this.currentUser = user;
      localStorage.setItem(this.storageKey, JSON.stringify(user));

      // Manejar "recordarme"
      if (credentials.rememberMe) {
        localStorage.setItem(this.rememberedEmailKey, credentials.email);
      } else {
        localStorage.removeItem(this.rememberedEmailKey);
      }

      this.updateUI();
      this.showNotification("¡Bienvenido! Redirigiendo...", "success");

      return { success: true, user };
    } catch (error) {
      console.error("Error en login:", error);
      this.showNotification(error.message, "error");
      return { success: false, error: error.message };
    }
  }

  async register(userData) {
    try {
      this.validateRegistrationData(userData);

      // Simular llamada a API
      await this.simulateAPICall();

      // Crear objeto de usuario
      const user = {
        id: Date.now(),
        email: userData.email,
        name: userData.fullName,
        avatar: this.generateAvatarUrl(),
        registrationTime: new Date().toISOString(),
      };

      // Guardar usuario
      this.currentUser = user;
      localStorage.setItem(this.storageKey, JSON.stringify(user));

      this.updateUI();
      this.showNotification("¡Cuenta creada exitosamente!", "success");

      return { success: true, user };
    } catch (error) {
      console.error("Error en registro:", error);
      this.showNotification(error.message, "error");
      return { success: false, error: error.message };
    }
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem(this.storageKey);
    this.updateUI();
    this.showNotification("Sesión cerrada correctamente", "info");

    // Redirigir si no estamos en la página principal
    if (!this.isOnHomePage()) {
      this.navigateToHome();
    }
  }

  // ===== VALIDACIONES =====
  validateLoginCredentials(credentials) {
    if (!credentials.email || !credentials.password) {
      throw new Error("Email y contraseña son requeridos");
    }

    if (!this.isValidEmail(credentials.email)) {
      throw new Error("Formato de email inválido");
    }

    if (credentials.password.length < 6) {
      throw new Error("La contraseña debe tener al menos 6 caracteres");
    }
  }

  validateRegistrationData(userData) {
    if (
      !userData.fullName ||
      !userData.email ||
      !userData.password ||
      !userData.confirmPassword
    ) {
      throw new Error("Todos los campos son requeridos");
    }

    if (userData.fullName.trim().length < 2) {
      throw new Error("El nombre debe tener al menos 2 caracteres");
    }

    if (!this.isValidEmail(userData.email)) {
      throw new Error("Formato de email inválido");
    }

    if (userData.password.length < 8) {
      throw new Error("La contraseña debe tener al menos 8 caracteres");
    }

    if (userData.password !== userData.confirmPassword) {
      throw new Error("Las contraseñas no coinciden");
    }

    if (!userData.acceptTerms) {
      throw new Error("Debes aceptar los términos y condiciones");
    }
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  }

  // ===== UTILIDADES =====
  extractNameFromEmail(email) {
    const username = email.split("@")[0];
    return username.charAt(0).toUpperCase() + username.slice(1);
  }

  generateAvatarUrl() {
    return `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face`;
  }

  async simulateAPICall() {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simular ocasionalmente errores de red
        if (Math.random() < 0.05) {
          reject(new Error("Error de conexión. Inténtalo nuevamente."));
        } else {
          resolve();
        }
      }, 1000 + Math.random() * 1000);
    });
  }

  // ===== NAVEGACIÓN =====
  isOnHomePage() {
    const path = window.location.pathname;
    return path === "/" || path.includes("index.html") || path === "";
  }

  navigateToHome() {
    const currentPath = window.location.pathname;
    if (currentPath.includes("/HTML/")) {
      window.location.href = "../index.html";
    } else {
      window.location.href = "./index.html";
    }
  }

  navigateToLogin() {
    const currentPath = window.location.pathname;
    if (currentPath.includes("/HTML/")) {
      window.location.href = "./login.html";
    } else {
      window.location.href = "./HTML/login.html";
    }
  }

  // ===== INTERFAZ DE USUARIO =====
  updateUI() {
    this.updateNavbar();
    this.updateProfileElements();
  }

  updateNavbar() {
    const loginLink = document.getElementById("loginLink");
    const logoutBtn = document.getElementById("logoutBtn");
    const profileDropdown = document.querySelector(".profile-dropdown");

    if (this.isAuthenticated()) {
      // Usuario autenticado
      if (loginLink) loginLink.style.display = "none";
      if (logoutBtn) logoutBtn.style.display = "block";
      if (profileDropdown) profileDropdown.style.display = "block";
    } else {
      // Usuario no autenticado
      if (loginLink) loginLink.style.display = "block";
      if (logoutBtn) logoutBtn.style.display = "none";
      if (profileDropdown) profileDropdown.style.display = "none";
    }
  }

  updateProfileElements() {
    if (!this.isAuthenticated()) return;

    const profileName = document.querySelector(".profile-name");
    const profileImage = document.querySelector(".profile-image");

    if (profileName) {
      profileName.textContent = this.currentUser.name;
    }

    if (profileImage) {
      profileImage.src = this.currentUser.avatar;
      profileImage.alt = `Avatar de ${this.currentUser.name}`;
    }
  }

  // ===== EVENTOS GLOBALES =====
  bindGlobalEvents() {
    // Logout button
    document.addEventListener("click", (e) => {
      if (e.target.matches("#logoutBtn, #logoutBtn *")) {
        e.preventDefault();
        this.logout();
      }
    });

    // Logo navigation
    document.addEventListener("click", (e) => {
      if (e.target.matches(".navbar-brand, .navbar-brand *")) {
        e.preventDefault();
        this.navigateToHome();
      }
    });

    // Login link
    document.addEventListener("click", (e) => {
      if (e.target.matches("#loginLink, #loginLink *")) {
        e.preventDefault();
        this.navigateToLogin();
      }
    });
  }

  // ===== FORMULARIOS =====
  setupLoginForm() {
    const form = document.getElementById("loginForm");
    if (!form) return;

    // Cargar email recordado
    this.loadRememberedEmail();

    // Setup password toggle
    this.setupPasswordToggle(form);

    // Setup form validation
    this.setupFormValidation(form);

    // Setup form submission
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      await this.handleLoginSubmit(e);
    });
  }

  setupSignupForm() {
    const form = document.getElementById("signupForm");
    if (!form) return;

    // Setup password toggles
    this.setupPasswordToggle(form);

    // Setup password strength
    this.setupPasswordStrength(form);

    // Setup form validation
    this.setupFormValidation(form);

    // Setup form submission
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      await this.handleSignupSubmit(e);
    });
  }

  loadRememberedEmail() {
    const rememberedEmail = localStorage.getItem(this.rememberedEmailKey);
    const emailInput = document.getElementById("email");
    const rememberCheckbox = document.getElementById("rememberMe");

    if (rememberedEmail && emailInput) {
      emailInput.value = rememberedEmail;
      if (rememberCheckbox) {
        rememberCheckbox.checked = true;
      }
    }
  }

  setupPasswordToggle(form) {
    const toggleButtons = form.querySelectorAll(".auth-password-toggle");

    toggleButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const input = button.parentElement.querySelector("input");
        const icon = button.querySelector("i");

        if (input.type === "password") {
          input.type = "text";
          icon.className = "bi bi-eye-slash";
          button.setAttribute("aria-label", "Ocultar contraseña");
        } else {
          input.type = "password";
          icon.className = "bi bi-eye";
          button.setAttribute("aria-label", "Mostrar contraseña");
        }
      });
    });
  }

  setupPasswordStrength(form) {
    const passwordField = form.querySelector("#password, #signupPassword");
    const strengthBar = form.querySelector(
      ".auth-password-strength .progress-bar"
    );
    const strengthText = form.querySelector(".auth-strength-text");

    if (passwordField && strengthBar && strengthText) {
      passwordField.addEventListener("input", () => {
        const strength = this.calculatePasswordStrength(passwordField.value);
        this.updatePasswordStrengthUI(strength, strengthBar, strengthText);
      });
    }
  }

  calculatePasswordStrength(password) {
    // Usar la función global de utils si está disponible
    if (window.DaleDeal?.utils?.calculatePasswordStrength) {
      return window.DaleDeal.utils.calculatePasswordStrength(password);
    }
    
    // Fallback simple si utils no está disponible
    const length = password.length;
    if (length === 0) return { score: 0, text: "Mínimo 8 caracteres", class: "" };
    if (length < 8) return { score: 20, text: "Débil", class: "weak" };
    if (length < 12) return { score: 60, text: "Media", class: "medium" };
    return { score: 90, text: "¡Excelente!", class: "strong" };
  }

  updatePasswordStrengthUI(strength, bar, text) {
    bar.style.width = `${strength.score}%`;
    bar.className = `progress-bar ${strength.class}`;

    text.textContent = strength.text;
    text.className = `auth-strength-text text-${
      strength.class === "strong"
        ? "success"
        : strength.class === "medium"
        ? "warning"
        : "danger"
    }`;
  }

  setupFormValidation(form) {
    const inputs = form.querySelectorAll("input[required]");

    inputs.forEach((input) => {
      input.addEventListener("blur", () => this.validateField(input));
      input.addEventListener("input", () => this.clearFieldError(input));
    });

    // Validación especial para confirmación de contraseña
    const password = form.querySelector("#password, #signupPassword");
    const confirmPassword = form.querySelector("#confirmPassword");

    if (password && confirmPassword) {
      confirmPassword.addEventListener("input", () => {
        if (confirmPassword.value !== password.value) {
          confirmPassword.setCustomValidity("Las contraseñas no coinciden");
        } else {
          confirmPassword.setCustomValidity("");
        }
        this.validateField(confirmPassword);
      });

      password.addEventListener("input", () => {
        if (confirmPassword.value && confirmPassword.value !== password.value) {
          confirmPassword.setCustomValidity("Las contraseñas no coinciden");
          this.validateField(confirmPassword);
        } else {
          confirmPassword.setCustomValidity("");
          this.clearFieldError(confirmPassword);
        }
      });
    }
  }

  validateField(field) {
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

  clearFieldError(field) {
    field.classList.remove("is-invalid");
  }

  async handleLoginSubmit(event) {
    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');

    // Recopilar datos
    const formData = new FormData(form);
    const credentials = {
      email: formData.get("email")?.trim().toLowerCase() || "",
      password: formData.get("password") || "",
      rememberMe: formData.get("rememberMe") === "on",
    };

    // Validar formulario
    if (!this.validateForm(form)) {
      this.showNotification(
        "Por favor, corrige los errores en el formulario",
        "error"
      );
      return;
    }

    // Mostrar loading
    this.setButtonLoading(submitBtn, true);

    try {
      const result = await this.login(credentials);

      if (result.success) {
        // Redirigir después de un breve delay
        setTimeout(() => {
          this.navigateToHome();
        }, 1500);
      }
    } finally {
      this.setButtonLoading(submitBtn, false);
    }
  }

  async handleSignupSubmit(event) {
    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');

    // Recopilar datos
    const formData = new FormData(form);
    const userData = {
      fullName: formData.get("fullName")?.trim() || "",
      email: formData.get("email")?.trim().toLowerCase() || "",
      password: formData.get("password") || "",
      confirmPassword: formData.get("confirmPassword") || "",
      acceptTerms: formData.get("acceptTerms") === "on",
    };

    // Validar formulario
    if (!this.validateForm(form)) {
      this.showNotification(
        "Por favor, corrige los errores en el formulario",
        "error"
      );
      return;
    }

    // Mostrar loading
    this.setButtonLoading(submitBtn, true);

    try {
      const result = await this.register(userData);

      if (result.success) {
        // Limpiar formulario
        form.reset();
        this.clearAllValidations(form);

        // Redirigir después de un breve delay
        setTimeout(() => {
          this.navigateToHome();
        }, 1500);
      }
    } finally {
      this.setButtonLoading(submitBtn, false);
    }
  }

  validateForm(form) {
    let isValid = true;
    const fields = form.querySelectorAll("input[required]");

    fields.forEach((field) => {
      if (!this.validateField(field)) {
        isValid = false;
      }
    });

    // Validación especial para términos
    const termsCheck = form.querySelector("#acceptTerms");
    if (termsCheck && !termsCheck.checked) {
      termsCheck.classList.add("is-invalid");
      isValid = false;
    }

    return isValid;
  }

  clearAllValidations(form) {
    const fields = form.querySelectorAll("input");
    fields.forEach((field) => {
      field.classList.remove("is-valid", "is-invalid");
    });

    // Limpiar medidor de contraseña
    const strengthBar = form.querySelector(
      ".auth-password-strength .progress-bar"
    );
    const strengthText = form.querySelector(".auth-strength-text");
    if (strengthBar && strengthText) {
      strengthBar.style.width = "0%";
      strengthBar.className = "progress-bar";
      strengthText.textContent = "Mínimo 8 caracteres";
      strengthText.className = "auth-strength-text";
    }
  }

  setButtonLoading(button, isLoading) {
    if (!button) return;

    if (isLoading) {
      button.disabled = true;
      button.innerHTML = `
        <span class="spinner-border spinner-border-sm me-2" role="status"></span>
        Procesando...
      `;
    } else {
      button.disabled = false;
      // Restaurar texto original
      const isLoginForm = button.closest("#loginForm");
      const isSignupForm = button.closest("#signupForm");

      if (isLoginForm) {
        button.innerHTML = "Iniciar Sesión";
      } else if (isSignupForm) {
        button.innerHTML = "Crear Cuenta";
      }
    }
  }

  // ===== NOTIFICACIONES =====
  showNotification(message, type = "info") {
    // Usar el sistema de notificaciones global si está disponible
    if (window.DaleDeal?.utils?.showNotification) {
      window.DaleDeal.utils.showNotification(message, type);
      return;
    }

    // Fallback simple
    this.showSimpleAlert(message, type);
  }

  showSimpleAlert(message, type) {
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
        <i class="bi bi-${this.getAlertIcon(type)} me-2"></i>
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

  getAlertIcon(type) {
    const icons = {
      success: "check-circle",
      error: "exclamation-triangle",
      danger: "exclamation-triangle",
      warning: "exclamation-triangle",
      info: "info-circle",
    };
    return icons[type] || "info-circle";
  }

  // ===== SOCIAL LOGIN =====
  setupSocialLogin() {
    document.addEventListener("click", (e) => {
      if (
        e.target.matches(".auth-social-btn.google, .auth-social-btn.google *")
      ) {
        e.preventDefault();
        this.showNotification("Login con Google no disponible en demo", "info");
      }

      if (
        e.target.matches(
          ".auth-social-btn.facebook, .auth-social-btn.facebook *"
        )
      ) {
        e.preventDefault();
        this.showNotification(
          "Login con Facebook no disponible en demo",
          "info"
        );
      }
    });
  }
}

// ===== INICIALIZACIÓN AUTOMÁTICA =====
let authManager;

function initializeAuth() {
  if (!authManager) {
    authManager = new AuthManager();
  }

  // Setup específico según la página
  const currentPage = window.location.pathname;

  if (currentPage.includes("login.html")) {
    authManager.setupLoginForm();
    authManager.setupSocialLogin();
  } else if (currentPage.includes("signup.html")) {
    authManager.setupSignupForm();
    authManager.setupSocialLogin();
  }
}

// Auto-inicializar
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeAuth);
} else {
  initializeAuth();
}

// Exportar para uso global
window.authManager = authManager;
window.AuthManager = AuthManager;
