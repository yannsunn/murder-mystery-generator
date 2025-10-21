/**
 * Lazy Loading Module
 * Efficient image and resource loading
 */

class LazyLoader {
  constructor() {
    this.imageObserver = null;
    this.init();
  }

  init() {
    // Check for IntersectionObserver support
    if (!('IntersectionObserver' in window)) {
      this.loadAllImages();
      return;
    }

    // Create intersection observer
    this.imageObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadImage(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.01
      }
    );

    // Start observing images
    this.observeImages();
  }

  observeImages() {
    const images = document.querySelectorAll('img[data-src]');
    images.forEach(img => this.imageObserver.observe(img));
  }

  loadImage(img) {
    const src = img.getAttribute('data-src');
    if (!src) {return;}

    // Create new image to preload
    const newImg = new Image();
    
    newImg.onload = () => {
      img.src = src;
      img.removeAttribute('data-src');
      img.classList.add('loaded');
      
      // Add fade-in effect
      requestAnimationFrame(() => {
        img.style.opacity = '1';
      });
    };

    newImg.onerror = () => {
      img.classList.add('error');
      img.alt = 'Image failed to load';
    };

    newImg.src = src;
  }

  loadAllImages() {
    const images = document.querySelectorAll('img[data-src]');
    images.forEach(img => {
      const src = img.getAttribute('data-src');
      if (src) {
        img.src = src;
        img.removeAttribute('data-src');
      }
    });
  }

  // Method to manually trigger loading
  loadImagesInContainer(container) {
    const images = container.querySelectorAll('img[data-src]');
    images.forEach(img => {
      if (this.imageObserver) {
        this.imageObserver.observe(img);
      } else {
        this.loadImage(img);
      }
    });
  }

  // Clean up observer
  disconnect() {
    if (this.imageObserver) {
      this.imageObserver.disconnect();
    }
  }
}

// Initialize lazy loader when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.lazyLoader = new LazyLoader();
  });
} else {
  window.lazyLoader = new LazyLoader();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LazyLoader;
}