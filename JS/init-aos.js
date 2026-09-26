// Shared AOS (Animate On Scroll) initialization
// Included by: index.html, /productos, /servicios, HTML/producto.html, HTML/servicio.html
// Note: /publicar uses a different config (duration: 400) and initializes inline.
//
// disable en viewports angostos — los elementos data-aos="fade-left"/"fade-right"
// arrancan con translateX(100px) y opacity:0 hasta entrar al viewport. En
// pantallas chicas eso causa overflow horizontal (el elemento queda corrido
// afuera del viewport) y bloquea visibilidad de contenido above-the-fold.
// Uso una función basada en ancho (≤768px) en vez del preset 'mobile' que se
// basa en user-agent y falla en navegadores que no se identifican como móviles.
if (typeof AOS !== 'undefined') {
  AOS.init({
    duration: 800,
    easing: 'ease-out-cubic',
    once: true,
    offset: 50,
    disable: () => window.matchMedia('(max-width: 768px)').matches,
  });
}
