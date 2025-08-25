import Component from "./Component.js";

/**
 * How It Works:
 * CSS reserves space with aspect ratios and placeholders
 * Intersection Observer detects when images enter viewport
 * Images load with loading states and fade-in effects
 * ResizeObserver detects size changes
 * Debounced updates trigger smooth scroll resize
 * No layout shifts because space is reserved upfront
 */


/**
 * AsyncLoad is a class that loads images asynchronously when they are in the viewport
 * and handles responsive layout changes with ResizeObserver
 * 
 * @extends Component
 */
export default class AsyncLoad extends Component {
  /**
   * Creates an AsyncLoad instance for lazy loading images
   * 
   * @param {HTMLElement} element - The img element to lazy load
   */
  constructor(element) {
    super({ element });
    
    // Track image dimensions for resize detection
    this.lastWidth = 0;
    this.lastHeight = 0;
    this.resizeTimeout = null;
    
    this.createIntersectionObserver();
    this.createResizeObserver();
  }

  /**
   * Creates and configures the Intersection Observer to detect when the image
   * enters the viewport and trigger loading
   * 
   * @private
   */
  createIntersectionObserver() {
    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          console.log("AsyncLoad: Image intersecting viewport");
          if (!this.element.src) {
            this.loadImage();
          }
        }
      });
    });
    
    // Start observing the element
    this.intersectionObserver.observe(this.element);
  }
  
  /**
   * Creates and configures the Resize Observer to detect when the image
   * changes size and trigger smooth scroll updates
   * 
   * @private
   */
  createResizeObserver() {
    // Only create ResizeObserver if supported
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.target === this.element) {
            const { width, height } = entry.contentRect;
            
            // Only trigger resize if size changed significantly (prevents thrashing)
            if (Math.abs(width - this.lastWidth) > 10 || 
                Math.abs(height - this.lastHeight) > 10) {
              
              this.lastWidth = width;
              this.lastHeight = height;
              
              console.log(`AsyncLoad: Image size changed to ${width}x${height}`);
              
              // Debounced resize update
              this.scheduleResizeUpdate();
            }
          }
        });
      });
      
      this.resizeObserver.observe(this.element);
    }
  }
  
  /**
   * Loads the image from the data-src attribute and sets up loading states
   * 
   * @private
   */
  loadImage() {
    const dataSrc = this.element.getAttribute("data-src");
    console.log(`AsyncLoad: Loading image from ${dataSrc}`);
    
    // Add loading class to container if it exists
    const container = this.element.closest('.image-container');
    if (container) {
      container.classList.add('loading');
    }
    
    this.element.src = dataSrc;
    this.element.onload = () => {
      console.log("AsyncLoad: Image loaded successfully");
      
      // Add loaded class for fade-in effect
      this.element.classList.add('loaded');
      
      // Remove loading state from container
      if (container) {
        container.classList.remove('loading');
        container.classList.add('loaded');
      }
      
      // Trigger smooth scroll resize after image loads
      this.scheduleResizeUpdate();
    };
    
    this.element.onerror = () => {
      console.error("AsyncLoad: Failed to load image", dataSrc);
      
      // Remove loading state on error
      if (container) {
        container.classList.remove('loading');
      }
    };
  }
  
  /**
   * Schedules a debounced resize update to prevent excessive smooth scroll updates
   * when multiple images are loading simultaneously
   * 
   * @private
   */
  scheduleResizeUpdate() {
    // Clear existing timeout
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    
    // Debounce resize updates to prevent excessive calls
    this.resizeTimeout = setTimeout(() => {
      console.log("AsyncLoad: Triggering smooth scroll resize");
      
      // Dispatch resize event for smooth scroll to handle
      window.dispatchEvent(new Event('resize'));
      
      // Alternative: if you have direct access to smooth scroll instance
      // if (window.smoothScroll && window.smoothScroll.onResize) {
      //   window.smoothScroll.onResize();
      // }
    }, 100); // Wait 100ms for any additional size changes
  }
  
  /**
   * Cleans up all observers and timeouts to prevent memory leaks
   * Should be called when the component is no longer needed
   * 
   * @public
   */
  destroy() {
    // Clean up observers
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    
    super.destroy();
  }
}