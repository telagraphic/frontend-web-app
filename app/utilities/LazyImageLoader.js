import { ImageService } from './ImageService.js';

/**
 * LazyImageLoader - Loads images as they enter the viewport using Intersection Observer
 * 
 * This utility is designed for viewport-based lazy loading of images. It uses the
 * Intersection Observer API to detect when images enter the viewport (or approach it),
 * then automatically loads them using the shared image loading utilities.
 * 
 * Use cases:
 * - Lazy loading images on scroll for better initial page load performance
 * - Loading images only when they're about to be visible to the user
 * - Reducing bandwidth usage by deferring off-screen image loading
 * - Improving Core Web Vitals (LCP, CLS) by prioritizing visible content
 * 
 * @example
 * // Basic usage - automatically loads images when they enter viewport
 * const lazyLoader = new LazyImageLoader('img[data-src]');
 * 
 * @example
 * // With custom options - load images 200px before they enter viewport
 * const lazyLoader = new LazyImageLoader('img[data-src]', {
 *   rootMargin: '200px',
 *   useDecode: true
 * });
 * 
 * @example
 * // Load images in a specific container
 * const container = document.querySelector('.gallery');
 * const lazyLoader = new LazyImageLoader('img[data-src]', {
 *   container: container
 * });
 * 
 * @example
 * // Cleanup when done
 * lazyLoader.destroy();
 */
export class LazyImageLoader {
  /**
   * Creates a new LazyImageLoader instance
   * @param {string|HTMLElement[]|NodeList} selector - CSS selector, array of elements, or NodeList of images to lazy load
   * @param {Object} [options] - Configuration options
   * @param {HTMLElement|Document} [options.container=document] - Container to search for images in
   * @param {string} [options.rootMargin='0px'] - Margin around the root bounding box (e.g., '200px' loads images 200px before viewport)
   * @param {number|number[]} [options.threshold=0] - Threshold(s) for intersection (0 = trigger when any part visible, 1 = fully visible)
   * @param {boolean} [options.useDecode=true] - Whether to use decode() for layout-ready images
   * @param {Function} [options.onImageLoad] - Callback fired when each image loads: (imageElement) => void
   */
  constructor(selector, options = {}) {
    const {
      container = document,
      rootMargin = '0px',
      threshold = 0,
      useDecode = true,
      onImageLoad
    } = options;

    this.selector = selector;
    this.container = container;
    this.rootMargin = rootMargin;
    this.threshold = threshold;
    this.useDecode = useDecode;
    this.onImageLoad = onImageLoad;
    
    this.imageService = new ImageService();
    this.images = this.imageService.normalizeImages(selector, container);
    this.observer = null;
    this.loadedImages = new Set();
    
    // Start observing immediately
    this.observe();
  }

  /**
   * Starts observing images with Intersection Observer
   * Automatically called on instantiation
   * @returns {void}
   */
  observe() {
    if (!('IntersectionObserver' in window)) {
      console.warn('IntersectionObserver not supported. Loading all images immediately.');
      this.loadAllImages();
      return;
    }

    if (this.observer) {
      return; // Already observing
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadImage(entry.target);
            this.observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: this.rootMargin,
        threshold: this.threshold
      }
    );

    // Observe all images that haven't been loaded yet
    this.images.forEach(img => {
      if (!this.loadedImages.has(img) && !this.imageService.isImageLoaded(img)) {
        this.observer.observe(img);
      }
    });
  }

  /**
   * Loads a single image when it enters the viewport
   * @private
   * @param {HTMLImageElement} imgElement - Image element to load
   * @returns {Promise<void>}
   */
  async loadImage(imgElement) {
    if (this.loadedImages.has(imgElement) || this.imageService.isImageLoaded(imgElement)) {
      return; // Already loaded or loading
    }

    this.loadedImages.add(imgElement);

    try {
      await this.imageService.loadSingleImage({
        element: imgElement,
        useDecode: this.useDecode,
        onLoad: (img) => {
          this.onImageLoad?.(img);
        }
      });
    } catch (error) {
      console.warn(`Failed to load image: ${imgElement.dataset?.src || imgElement.src}`, error);
    }
  }

  /**
   * Loads all images immediately (fallback for browsers without IntersectionObserver)
   * @private
   * @returns {Promise<void>}
   */
  async loadAllImages() {
    const promises = this.images
      .filter(img => !this.imageService.isImageLoaded(img))
      .map(img => this.loadImage(img));
    
    await Promise.all(promises);
  }

  /**
   * Stops observing a specific image
   * @param {HTMLImageElement} imgElement - Image element to stop observing
   * @returns {void}
   */
  unobserve(imgElement) {
    if (this.observer) {
      this.observer.unobserve(imgElement);
    }
  }

  /**
   * Adds new images to observe (useful for dynamically added content)
   * @param {string|HTMLElement[]|NodeList} selector - New images to observe
   * @returns {void}
   */
  addImages(selector) {
    const newImages = this.imageService.normalizeImages(selector, this.container);
    newImages.forEach(img => {
      if (!this.images.includes(img)) {
        this.images.push(img);
        if (this.observer && !this.imageService.isImageLoaded(img)) {
          this.observer.observe(img);
        }
      }
    });
  }

  /**
   * Destroys the LazyImageLoader and cleans up resources
   * Disconnects the IntersectionObserver and clears references
   * @returns {void}
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    this.images = [];
    this.loadedImages.clear();
    this.onImageLoad = null;
  }
}

