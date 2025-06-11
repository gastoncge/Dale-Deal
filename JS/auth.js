// =====================================================
// DALE DEAL - Sistema de Autenticación
// =====================================================

class AuthManager {
  constructor() {
    this.storageKey = "daledealer_user";
    this.init();
  }

  init() {
    this.updateUI();
    this.bindEvents();
  }

  // Verificar si el usuario está autenticado
  isAuthenticated() {
    const user = localStorage.getItem(this.storageKey);
    return user !== null;
  }

  // Obtener datos del usuario
  getCurrentUser() {
    const user = localStorage.getItem(this.storageKey);
    return user ? JSON.parse(user) : null;
  }

  // Iniciar sesión
  async login(credentials) {
    try {
      // Validar credenciales
      if (!this.validateCredentials(credentials)) {
        throw new Error("Credenciales inválidas");
      }

      // Simular llamada a API
      await this.simulateAPICall();

      // Crear objeto de usuario
      const user = {
        id: Date.now(),
        email: credentials.email,
        name: this.extractNameFromEmail(credentials.email),
        avatar: `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face`,
        loginTime: new Date().toISOString(),
      };

      // Guardar en localStorage
      localStorage.setItem(this.storageKey, JSON.stringify(user));

      // Actualizar UI
      this.updateUI();

      return { success: true, user };
    } catch (error) {
      console.error("Error en login:", error);
      return { success: false, error: error.message };
    }
  }

  // Registrar usuario
  async register(userData) {
    try {
      // Validar datos de registro
      if (!this.validateRegistrationData(userData)) {
        throw new Error("Datos de registro inválidos");
      }

      // Simular llamada a API
      await this.simulateAPICall();

      // Crear objeto de usuario
      const user = {
        id: Date.now(),
        email: userData.email,
        name: userData.fullName,
        avatar: `https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face`,
        registrationTime: new Date().toISOString(),
      };

      // Guardar en localStorage
      localStorage.setItem(this.storageKey, JSON.stringify(user));

      // Actualizar UI
      this.updateUI();

      return { success: true, user };
    } catch (error) {
      console.error("Error en registro:", error);
      return { success: false, error: error.message };
    }
  }

  // Cerrar sesión
  logout() {
    localStorage.removeItem(this.storageKey);
    this.updateUI();

    // Redirigir a la página principal si no estamos en ella
    if (
      !window.location.pathname.includes("index.html") &&
      window.location.pathname !== "/"
    ) {
      window.location.href = "../index.html";
    }
  }

  // Actualizar interfaz de usuario
  updateUI() {
    const user = this.getCurrentUser();
    const isAuthenticated = this.isAuthenticated();

    // Elementos del navbar
    const loginLink = document.getElementById("loginLink");
    const logoutBtn = document.getElementById("logoutBtn");
    const profileName = document.querySelector(".profile-name");
    const profileImage = document.querySelector(".profile-image");

    if (isAuthenticated && user) {
      // Usuario autenticado
      if (loginLink) loginLink.style.display = "none";
      if (logoutBtn) logoutBtn.style.display = "block";
      if (profileName) profileName.textContent = user.name;
      if (profileImage) profileImage.src = user.avatar;
    } else {
      // Usuario no autenticado
      if (loginLink) loginLink.style.display = "block";
      if (logoutBtn) logoutBtn.style.display = "none";
      if (profileName) profileName.textContent = "Usuario";
      if (profileImage) {
        profileImage.src =
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face";
      }
    }
  }

  // Vincular eventos
  bindEvents() {
    // Botón de logout
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", (e) => {
        e.preventDefault();
        this.logout();
      });
    }

    // Manejar navegación del logo
    const navbarBrand = document.querySelector(".navbar-brand");
    if (navbarBrand) {
      navbarBrand.addEventListener("click", (e) => {
        e.preventDefault();
        this.navigateToHome();
      });
    }
  }

  // Navegar a la página principal
  navigateToHome() {
    const currentPath = window.location.pathname;
    if (currentPath.includes("/HTML/")) {
      window.location.href = "../index.html";
    } else {
      window.location.href = "./index.html";
    }
  }

  // Validar credenciales de login
  validateCredentials(credentials) {
    if (!credentials.email || !credentials.password) {
      return false;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(credentials.email)) {
      return false;
    }

    // Validar longitud de contraseña
    if (credentials.password.length < 6) {
      return false;
    }

    return true;
  }

  // Validar datos de registro
  validateRegistrationData(userData) {
    if (
      !userData.fullName ||
      !userData.email ||
      !userData.password ||
      !userData.confirmPassword
    ) {
      return false;
    }

    // Validar nombre completo
    if (userData.fullName.trim().length < 2) {
      return false;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      return false;
    }

    // Validar contraseña
    if (userData.password.length < 8) {
      return false;
    }

    // Validar que las contraseñas coincidan
    if (userData.password !== userData.confirmPassword) {
      return false;
    }

    return true;
  }

  // Extraer nombre del email
  extractNameFromEmail(email) {
    const username = email.split("@")[0];
    return username.charAt(0).toUpperCase() + username.slice(1);
  }

  // Simular llamada a API
  simulateAPICall() {
    return new Promise((resolve) => {
      setTimeout(resolve, 1000 + Math.random() * 1000);
    });
  }

  // Mostrar alerta
  showAlert(message, type = "info") {
    const alertContainer = document.getElementById("alertContainer");
    if (!alertContainer) return;

    const alertId = `alert-${Date.now()}`;
    const alertHTML = `
      <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show" role="alert">
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
        const bsAlert = new bootstrap.Alert(alert);
        bsAlert.close();
      }
    }, 5000);
  }

  // Obtener ícono para alerta
  getAlertIcon(type) {
    const icons = {
      success: "check-circle",
      danger: "exclamation-triangle",
      warning: "exclamation-triangle",
      info: "info-circle",
    };
    return icons[type] || "info-circle";
  }
}

// Inicializar el sistema de autenticación
const authManager = new AuthManager();

// Exportar para uso global
window.authManager = authManager;
