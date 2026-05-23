/**
 * =====================================================
 * DALE DEAL - Sistema de Autenticación Unificado
 * =====================================================
 */

// Anti-flash: si no hay token al cargar, escondemos los elementos
// "logueado" (profile dropdown, mis-compras, etc.) ANTES de que se
// pinten. Si hay token, escondemos #loginLink. Esto evita que se
// vea por unos ms el navbar "logueado" cuando en realidad no lo estás
// (o viceversa). El updateUI() final reaplica la lógica completa.
(function preventNavbarFlash() {
  try {
    const hasToken = !!localStorage.getItem('daledeal_token')
                  && !!localStorage.getItem('daledealer_user');
    const css = hasToken
      ? `#loginLink { display: none !important; }`
      : `.profile-dropdown, #logoutBtn { display: none !important; }
         .profile-name { visibility: hidden; }`;
    const style = document.createElement('style');
    style.id = 'daledeal-auth-flash-fix';
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
  } catch (_) { /* localStorage no disponible — no hacemos nada */ }
})();

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

    DaleDeal.log("✅ AuthManager inicializado");
  }

  // ===== GESTIÓN DE USUARIO =====
  loadCurrentUser() {
    try {
      // Requiere que exista tanto el objeto usuario como el token JWT
      const token = localStorage.getItem('daledeal_token');
      const userData = localStorage.getItem(this.storageKey);
      this.currentUser = (token && userData) ? JSON.parse(userData) : null;
    } catch (error) {
      DaleDeal.error("Error cargando usuario:", error);
      this.currentUser = null;
    }
  }

  getCurrentUser() {
    return this.currentUser;
  }

  isAuthenticated() {
    return this.currentUser !== null && !!localStorage.getItem('daledeal_token');
  }

  // ===== AUTENTICACIÓN (conectada al backend real) =====
  async login(credentials) {
    try {
      this.validateLoginCredentials(credentials);

      // Llamada real a la API
      const data = await window.DaleDeal.api.loginUser(
        credentials.email,
        credentials.password
      );

      // Guardar token JWT
      localStorage.setItem('daledeal_token', data.token);

      // Normalizar objeto de usuario
      const user = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        avatar: data.user.avatar_url || this.generateAvatarUrl(),
        phone: data.user.phone,
        location: data.user.location,
        loginTime: new Date().toISOString(),
      };

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
      DaleDeal.error("Error en login:", error);
      const msg = error.message || "Error al iniciar sesión. Verificá tus credenciales.";
      this.showNotification(msg, "error");
      return { success: false, error: msg };
    }
  }

  async register(userData) {
    try {
      this.validateRegistrationData(userData);

      // Llamada real a la API
      const data = await window.DaleDeal.api.registerUser(
        userData.fullName,
        userData.email,
        userData.password
      );

      // Guardar token JWT
      localStorage.setItem('daledeal_token', data.token);

      // Normalizar objeto de usuario
      const user = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        avatar: data.user.avatar_url || this.generateAvatarUrl(),
        registrationTime: new Date().toISOString(),
      };

      this.currentUser = user;
      localStorage.setItem(this.storageKey, JSON.stringify(user));

      this.updateUI();
      this.showNotification("¡Cuenta creada exitosamente!", "success");

      return { success: true, user };
    } catch (error) {
      DaleDeal.error("Error en registro:", error);
      const msg = error.message || "Error al crear la cuenta. Intentá nuevamente.";
      this.showNotification(msg, "error");
      return { success: false, error: msg };
    }
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem(this.storageKey);
    localStorage.removeItem('daledeal_token');
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
    // Si llegamos al login con ?redirect=<path> (típicamente porque api.js
    // nos redirigió por session expired), después del login exitoso volvemos
    // a esa ruta en vez de mandar al home. Mejor UX: el user no se pierde
    // el contexto donde estaba (carrito, página de producto, etc.).
    try {
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect');
      // Validación: solo paths internos (empiezan con /) para evitar open
      // redirect a sitios externos vía ?redirect=https://evil.com
      if (redirect && redirect.startsWith('/') && !redirect.startsWith('//')) {
        window.location.href = redirect;
        return;
      }
    } catch (_) { /* ignore parse errors */ }

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
    // Espejado entre desktop (dropdown del avatar) y mobile (menú hamburguesa).
    // Antes solo manejaba los del desktop: usuario mobile loggeado seguía
    // viendo "Iniciar sesión" en el menú hamburguesa.
    const loginLink         = document.getElementById("loginLink");
    const logoutBtn         = document.getElementById("logoutBtn");
    const loginLinkMobile   = document.getElementById("loginLinkMobile");
    const logoutBtnMobile   = document.getElementById("logoutBtnMobile");
    const profileDropdown   = document.querySelector(".profile-dropdown");

    if (this.isAuthenticated()) {
      // Usuario autenticado
      if (loginLink)       loginLink.style.display       = "none";
      if (logoutBtn)       logoutBtn.style.display       = "block";
      if (loginLinkMobile) loginLinkMobile.style.display = "none";
      if (logoutBtnMobile) logoutBtnMobile.style.display = "flex";
      if (profileDropdown) profileDropdown.style.display = "block";
    } else {
      // Usuario no autenticado
      if (loginLink)       loginLink.style.display       = "block";
      if (logoutBtn)       logoutBtn.style.display       = "none";
      if (loginLinkMobile) loginLinkMobile.style.display = "flex";
      if (logoutBtnMobile) logoutBtnMobile.style.display = "none";
      if (profileDropdown) profileDropdown.style.display = "none";
    }

    // Una vez resuelto el estado real, sacamos el style del anti-flash
    // (si quedaba). Después de esto, las reglas display las maneja JS.
    const flashStyle = document.getElementById('daledeal-auth-flash-fix');
    if (flashStyle) flashStyle.remove();
    // Restaurar visibility del nombre si fue escondido
    document.querySelectorAll('.profile-name').forEach(el => el.style.visibility = '');
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
    // Logout button (desktop dropdown + mobile menu)
    document.addEventListener("click", (e) => {
      if (e.target.matches("#logoutBtn, #logoutBtn *, #logoutBtnMobile, #logoutBtnMobile *")) {
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

    // Login link (desktop dropdown + mobile menu)
    document.addEventListener("click", (e) => {
      if (e.target.matches("#loginLink, #loginLink *, #loginLinkMobile, #loginLinkMobile *")) {
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

  // Exportar inmediatamente para que component-loader y otros módulos
  // puedan llamar a updateUI() después de inyectar el header.
  window.authManager = authManager;

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

// Re-aplicar updateUI cuando el header termine de cargarse
// (caso típico: index.html, productos.html, etc. usan navbar-placeholder
// y component-loader.js inyecta el header después de DOMContentLoaded).
document.addEventListener('daledeal:header-loaded', () => {
  try { window.authManager?.updateUI(); } catch (_) {}
});

// =====================================================
// Newsletter footer — handler GLOBAL delegado
// =====================================================
// El componente footer.html aparece en (casi) todas las páginas; en algunas
// se inyecta vía component-loader, en otras está hardcodeado. Un listener
// delegado en `document` cubre todos los casos sin riesgo de doble-binding.
document.addEventListener('submit', function(e) {
  const form = e.target;
  if (!form || form.id !== 'newsletterForm') return;
  // Evitar que otro handler procese el mismo submit
  if (form.dataset.daledealNewsletterHandled === '1') return;
  form.dataset.daledealNewsletterHandled = '1';
  setTimeout(() => { form.dataset.daledealNewsletterHandled = ''; }, 1000);

  e.preventDefault();
  const emailInput = form.querySelector('#newsletterEmail') || form.querySelector('input[type="email"]');
  const email = (emailInput?.value || '').trim();
  if (!email) return;

  const btn = form.querySelector('.newsletter-btn, button[type="submit"]');
  const originalHTML = btn ? btn.innerHTML : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="bi bi-check-circle"></i>';
  }
  // TODO: hacer un POST real cuando exista /newsletter en el backend.
  // Por ahora, persistimos local y mostramos confirmación.
  try {
    const list = JSON.parse(localStorage.getItem('daledeal_newsletter_subs') || '[]');
    if (!list.includes(email)) list.push(email);
    localStorage.setItem('daledeal_newsletter_subs', JSON.stringify(list));
  } catch (_) {}

  setTimeout(() => {
    if (btn) {
      btn.innerHTML = originalHTML;
      btn.disabled = false;
    }
    form.reset();
    if (window.DaleDeal?.utils?.showNotification) {
      window.DaleDeal.utils.showNotification(
        '¡Gracias por suscribirte! Te vamos a avisar de las mejores ofertas.',
        'success'
      );
    }
  }, 1200);
}, true);

// Exportar clase
window.AuthManager = AuthManager;
