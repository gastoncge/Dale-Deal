/**
 * =====================================================
 * DALE DEAL - Carrusel de Imágenes de Productos
 * =====================================================
 */

class ProductCarousel {
  constructor() {
    this.carousels = [];
    this.init();
  }

  init() {
    // Encontrar todos los carruseles de productos
    const carouselElements = document.querySelectorAll('.product-image-carousel');
    
    carouselElements.forEach((carousel, index) => {
      this.setupCarousel(carousel, index);
    });

    DaleDeal.log(`✅ ProductCarousel inicializado con ${this.carousels.length} carruseles`);
    DaleDeal.log('Carruseles encontrados:', carouselElements.length);
  }

  setupCarousel(carouselElement, index) {
    const images = carouselElement.querySelectorAll('.product-image');
    const indicators = carouselElement.querySelectorAll('.indicator');
    const prevBtn = carouselElement.querySelector('.carousel-prev');
    const nextBtn = carouselElement.querySelector('.carousel-next');

    DaleDeal.log(`🔧 Configurando carousel ${index}:`, {
      images: images.length,
      indicators: indicators.length,
      prevBtn: !!prevBtn,
      nextBtn: !!nextBtn
    });

    if (images.length <= 1) {
      // Si hay solo una imagen, ocultar controles
      prevBtn?.style.setProperty('display', 'none');
      nextBtn?.style.setProperty('display', 'none');
      carouselElement.querySelector('.carousel-indicators')?.style.setProperty('display', 'none');
      DaleDeal.log(`ℹ️ Carousel ${index} tiene solo 1 imagen, controles ocultos`);
      return;
    }

    const carouselData = {
      element: carouselElement,
      images: images,
      indicators: indicators,
      currentIndex: 0,
      totalImages: images.length
    };

    this.carousels.push(carouselData);

    // Event listeners para los controles
    prevBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      DaleDeal.log('🔄 Botón anterior clickeado - carrusel', index);
      this.prevImage(index);
    });

    nextBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      DaleDeal.log('🔄 Botón siguiente clickeado - carrusel', index);
      this.nextImage(index);
    });

    // Event listeners para los indicadores
    indicators.forEach((indicator, imgIndex) => {
      indicator.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.goToImage(index, imgIndex);
      });
    });

    // Auto-play cuando se hace hover (opcional)
    let autoplayInterval;
    carouselElement.addEventListener('mouseenter', () => {
      // Podríamos agregar auto-play aquí si se desea
    });

    carouselElement.addEventListener('mouseleave', () => {
      if (autoplayInterval) {
        clearInterval(autoplayInterval);
      }
    });
  }

  prevImage(carouselIndex) {
    const carousel = this.carousels[carouselIndex];
    if (!carousel) return;

    carousel.currentIndex = 
      carousel.currentIndex === 0 
        ? carousel.totalImages - 1 
        : carousel.currentIndex - 1;

    this.updateCarousel(carouselIndex);
  }

  nextImage(carouselIndex) {
    const carousel = this.carousels[carouselIndex];
    if (!carousel) return;

    carousel.currentIndex = 
      carousel.currentIndex === carousel.totalImages - 1 
        ? 0 
        : carousel.currentIndex + 1;

    this.updateCarousel(carouselIndex);
  }

  goToImage(carouselIndex, imageIndex) {
    const carousel = this.carousels[carouselIndex];
    if (!carousel || imageIndex >= carousel.totalImages) return;

    carousel.currentIndex = imageIndex;
    this.updateCarousel(carouselIndex);
  }

  updateCarousel(carouselIndex) {
    const carousel = this.carousels[carouselIndex];
    if (!carousel) return;

    // Actualizar imágenes
    carousel.images.forEach((img, index) => {
      if (index === carousel.currentIndex) {
        img.classList.add('active');
      } else {
        img.classList.remove('active');
      }
    });

    // Actualizar indicadores
    carousel.indicators.forEach((indicator, index) => {
      if (index === carousel.currentIndex) {
        indicator.classList.add('active');
      } else {
        indicator.classList.remove('active');
      }
    });

    // Actualizar data attribute
    carousel.element.setAttribute('data-current-image', carousel.currentIndex);
  }

  // Método público para reinicializar si se agregan nuevos productos dinámicamente
  reinitialize() {
    this.carousels = [];
    this.init();
  }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.productCarousel = new ProductCarousel();
  });
} else {
  window.productCarousel = new ProductCarousel();
}

// Exportar para uso global
window.ProductCarousel = ProductCarousel;