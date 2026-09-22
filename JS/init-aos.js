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
  const initAos = () => AOS.init({
    duration: 800,
    easing: 'ease-out-cubic',
    once: true,
    offset: 50,
    disable: () => window.matchMedia('(max-width: 768px)').matches,
  });

  // El navbar se inyecta async — component-loader.js hace fetch() de
  // header.html y recién lo mete en el DOM cuando resuelve. Si AOS.init()
  // corre antes (lo normal, porque este script no espera I/O), nunca
  // escanea los [data-aos] del header (p.ej. el logo) y quedan atascados
  // en su estado pre-animación para siempre — invisibles. Un AOS.refresh()
  // posterior no alcanza (solo recalcula posiciones de lo que ya conocía) y
  // refreshHard() sí los encuentra pero de paso resetea la animación de
  // TODO lo demás en la página (vuelve a ocultar contenido ya visible).
  // La solución de raíz es esperar a que el navbar exista antes de que AOS
  // corra por primera vez — así solo hay un init, limpio, con el DOM final.
  if (document.getElementById('navbar-placeholder')) {
    document.addEventListener('daledeal:header-loaded', initAos, { once: true });
  } else {
    initAos();
  }
}
