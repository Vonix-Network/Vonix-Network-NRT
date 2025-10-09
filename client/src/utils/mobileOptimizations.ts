import React from 'react';

// Mobile performance optimizations and utilities

export class MobileOptimizer {
  private static instance: MobileOptimizer;
  private observers: Map<string, IntersectionObserver> = new Map();
  private imageCache: Map<string, HTMLImageElement> = new Map();

  static getInstance(): MobileOptimizer {
    if (!MobileOptimizer.instance) {
      MobileOptimizer.instance = new MobileOptimizer();
    }
    return MobileOptimizer.instance;
  }

  // Lazy loading for images
  public setupLazyLoading(selector: string = 'img[data-src]') {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset.src;
            
            if (src) {
              this.loadImage(src).then((loadedImg) => {
                img.src = loadedImg.src;
                img.classList.add('loaded');
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
              }).catch(() => {
                img.classList.add('error');
                imageObserver.unobserve(img);
              });
            }
          }
        });
      }, {
        rootMargin: '50px 0px',
        threshold: 0.01
      });

      document.querySelectorAll(selector).forEach((img) => {
        imageObserver.observe(img);
      });

      this.observers.set('images', imageObserver);
    }
  }

  // Preload critical images
  private async loadImage(src: string): Promise<HTMLImageElement> {
    if (this.imageCache.has(src)) {
      return this.imageCache.get(src)!;
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.imageCache.set(src, img);
        resolve(img);
      };
      img.onerror = reject;
      img.src = src;
    });
  }

  // Optimize touch scrolling
  public optimizeScrolling() {
    // Add momentum scrolling for iOS
    (document.body.style as any).webkitOverflowScrolling = 'touch';
    
    // Prevent bounce scrolling on iOS
    document.addEventListener('touchmove', (e) => {
      if (e.target === document.body) {
        e.preventDefault();
      }
    }, { passive: false });

    // Optimize scroll performance
    let ticking = false;
    const updateScrollPosition = () => {
      // Update scroll-dependent elements
      ticking = false;
    };

    document.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(updateScrollPosition);
        ticking = true;
      }
    }, { passive: true });
  }

  // Reduce memory usage by cleaning up unused elements
  public setupMemoryOptimization() {
    // Clean up observers when elements are removed
    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.removedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            // Clean up any observers attached to removed elements
            this.cleanupElement(element);
          }
        });
      });
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  private cleanupElement(element: Element) {
    // Remove from image cache if it's an image
    if (element.tagName === 'IMG') {
      const src = (element as HTMLImageElement).src;
      if (src && this.imageCache.has(src)) {
        this.imageCache.delete(src);
      }
    }
  }

  // Optimize font loading
  public optimizeFonts() {
    // Use font-display: swap for better perceived performance
    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-family: system-ui;
        font-display: swap;
      }
    `;
    document.head.appendChild(style);
  }

  // Reduce layout thrashing
  public batchDOMUpdates(callback: () => void) {
    requestAnimationFrame(() => {
      callback();
    });
  }

  // Optimize animations for mobile
  public setupAnimationOptimizations() {
    // Reduce motion for users who prefer it
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const style = document.createElement('style');
      style.textContent = `
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }
      `;
      document.head.appendChild(style);
    }

    // Use transform instead of changing layout properties
    const optimizeTransforms = () => {
      document.querySelectorAll('[data-animate]').forEach((element) => {
        (element as HTMLElement).style.willChange = 'transform';
      });
    };

    // Apply optimizations after DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', optimizeTransforms);
    } else {
      optimizeTransforms();
    }
  }

  // Network-aware loading
  public setupNetworkOptimizations() {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      if (connection) {
        // Reduce quality for slow connections
        if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
          document.documentElement.classList.add('slow-connection');
        }

        // Listen for connection changes
        connection.addEventListener('change', () => {
          if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
            document.documentElement.classList.add('slow-connection');
          } else {
            document.documentElement.classList.remove('slow-connection');
          }
        });
      }
    }
  }

  // Initialize all optimizations
  public initialize() {
    this.setupLazyLoading();
    this.optimizeScrolling();
    this.setupMemoryOptimization();
    this.optimizeFonts();
    this.setupAnimationOptimizations();
    this.setupNetworkOptimizations();
  }

  // Cleanup method
  public cleanup() {
    this.observers.forEach((observer) => {
      observer.disconnect();
    });
    this.observers.clear();
    this.imageCache.clear();
  }
}

// React hook for mobile optimizations
export const useMobileOptimizations = () => {
  React.useEffect(() => {
    const optimizer = MobileOptimizer.getInstance();
    optimizer.initialize();

    return () => {
      optimizer.cleanup();
    };
  }, []);
};

// Utility functions for mobile-specific optimizations
export const preloadCriticalResources = (resources: string[]) => {
  resources.forEach((resource) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource;
    
    if (resource.endsWith('.css')) {
      link.as = 'style';
    } else if (resource.endsWith('.js')) {
      link.as = 'script';
    } else if (resource.match(/\.(jpg|jpeg|png|webp|svg)$/)) {
      link.as = 'image';
    }
    
    document.head.appendChild(link);
  });
};

export const optimizeImages = () => {
  // Convert images to WebP if supported
  const supportsWebP = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  };

  if (supportsWebP()) {
    document.documentElement.classList.add('webp-support');
  }
};

// Debounce utility for performance
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(null, args), wait);
  };
};

// Throttle utility for performance
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};
