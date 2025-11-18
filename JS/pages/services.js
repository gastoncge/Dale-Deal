/**
 * DALE DEAL - Services Page Navigation
 * Handles navigation from home service cards to dedicated services page
 */

class ServicesNavigation {
  constructor() {
    this.init();
  }

  init() {
    this.setupServiceCardClicks();
    this.setupServicesCTAClick();
    this.handleURLParams();
  }

  /**
   * Setup click handlers for service cards on home page
   */
  setupServiceCardClicks() {
    const serviceCards = document.querySelectorAll('.service-card[data-service-category]');
    
    serviceCards.forEach(card => {
      // Make the entire card clickable
      card.style.cursor = 'pointer';
      
      card.addEventListener('click', (e) => {
        // Don't trigger if clicking on CTA buttons or favorite button
        if (e.target.closest('.service-cta') || e.target.closest('.action-heart')) {
          return;
        }

        const category = card.dataset.serviceCategory;
        const serviceId = card.dataset.id || null;

        this.navigateToServices(category, serviceId);
      });
    });
  }

  /**
   * Setup click handler for main services CTA
   */
  setupServicesCTAClick() {
    const servicesCTA = document.querySelector('.services-cta .btn');
    if (servicesCTA) {
      servicesCTA.addEventListener('click', () => {
        this.navigateToServices('all');
      });
    }

    // Handle "Ver todos los servicios" button if exists
    const viewAllBtn = document.getElementById('viewAllServicesBtn');
    if (viewAllBtn) {
      viewAllBtn.addEventListener('click', () => {
        this.navigateToServices('all');
      });
    }
  }

  /**
   * Navigate to services page with optional category and service filtering
   */
  navigateToServices(category = 'all', serviceId = null) {
    let url = './HTML/servicios.html';
    const params = new URLSearchParams();

    if (category && category !== 'all') {
      params.append('category', category);
    }

    if (serviceId) {
      params.append('service', serviceId);
    }

    if (params.toString()) {
      url += '?' + params.toString();
    }

    // Navigate to services page
    window.location.href = url;
  }

  /**
   * Handle URL parameters on services page
   */
  handleURLParams() {
    // Only run on services page
    if (!window.location.pathname.includes('servicios.html')) {
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    const serviceId = urlParams.get('service');

    if (category) {
      this.filterServicesByCategory(category);
    }

    if (serviceId) {
      this.highlightService(serviceId);
    }
  }

  /**
   * Filter services by category on services page
   */
  filterServicesByCategory(category) {
    // Wait for DOM to be ready
    setTimeout(() => {
      const filterTabs = document.querySelectorAll('.service-filter-tab');
      const targetTab = document.querySelector(`[data-service-category="${category}"]`);
      
      if (targetTab) {
        // Remove active class from all tabs
        filterTabs.forEach(tab => tab.classList.remove('active'));
        
        // Activate the target tab
        targetTab.classList.add('active');
        
        // Filter the service cards
        this.filterServices(category);
        
        // Scroll to services section
        const servicesSection = document.querySelector('.services-section');
        if (servicesSection) {
          servicesSection.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }, 500);
  }

  /**
   * Filter service cards based on category
   */
  filterServices(category) {
    const serviceCards = document.querySelectorAll('.service-card');
    
    serviceCards.forEach(card => {
      const cardCategory = card.dataset.serviceCategory;
      
      if (category === 'all' || cardCategory === category) {
        card.style.display = 'block';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
      } else {
        card.style.display = 'none';
      }
    });
  }

  /**
   * Highlight a specific service card
   */
  highlightService(serviceId) {
    setTimeout(() => {
      const serviceCard = document.querySelector(`[data-id="${serviceId}"]`);
      if (serviceCard) {
        // Add highlight effect
        serviceCard.classList.add('service-highlighted');
        
        // Scroll to the specific service
        serviceCard.scrollIntoView({ 
          behavior: 'smooth',
          block: 'center'
        });
        
        // Remove highlight after a few seconds
        setTimeout(() => {
          serviceCard.classList.remove('service-highlighted');
        }, 3000);
      }
    }, 800);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ServicesNavigation();
});

// Export for use in other scripts
window.ServicesNavigation = ServicesNavigation;