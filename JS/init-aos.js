// Shared AOS (Animate On Scroll) initialization
// Included by: index.html, HTML/productos.html, HTML/servicios.html, HTML/producto.html, HTML/servicio.html
// Note: HTML/publicar.html uses a different config (duration: 400) and initializes inline.
if (typeof AOS !== 'undefined') {
  AOS.init({ duration: 800, easing: 'ease-out-cubic', once: true, offset: 50 });
}
