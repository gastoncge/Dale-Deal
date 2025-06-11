// Archivo adicional para mejorar la navegación dinámica
// Agregar este script al final de index.html

document.addEventListener("DOMContentLoaded", () => {
  // Verificar estado de autenticación y mostrar/ocultar elementos apropiados
  const user = localStorage.getItem("daledealer_user")
  const loginLink = document.getElementById("loginLink")
  const logoutBtn = document.getElementById("logoutBtn")

  if (user) {
    // Usuario logueado
    if (loginLink) loginLink.style.display = "none"
    if (logoutBtn) logoutBtn.style.display = "block"
  } else {
    // Usuario no logueado
    if (loginLink) loginLink.style.display = "block"
    if (logoutBtn) logoutBtn.style.display = "none"
  }

  // Manejar clics en el logo para ir al inicio
  const navbarBrand = document.querySelector(".navbar-brand")
  if (navbarBrand) {
    navbarBrand.addEventListener("click", (e) => {
      e.preventDefault()
      // Determinar la ruta correcta según la página actual
      const currentPath = window.location.pathname
      if (currentPath.includes("/HTML/")) {
        window.location.href = "../index.html"
      } else {
        window.location.href = "./index.html"
      }
    })
  }
})
