/**
 * ImageService - Unified image loading service
 * Consolidates image loading functionality from Images.js and ImageLoader.js
 * Handles loading images from data-src to src, decoding, progress tracking, and preloading
 * Provides a single source of truth for image loading across the application
 */

import { SELECTORS, ATTRIBUTES } from './Constants.js';

/**
 * ImageService class - Unified image loading with progress tracking and preloading
 */
export class ImageService {
  constructor() {
    this.preloadedUrls = new Set();
    this.loadingPromises = new Map(); // Track in-flight loads to avoid duplicates
  }

  /**
   * Normalizes various image input types into an array of image elements
   * @param {HTMLElement[]|NodeList|string|HTMLElement} images - Images as array, NodeList, selector, or single element
   * @param {HTMLElement|Document} container - Container to search in
   * @returns {HTMLImageElement[]} Array of image elements
   */
  normalizeImages(images, container = document) {
    if (typeof images === 'string') {
      return Array.from(container.querySelectorAll(images));
    }
    
    if (images instanceof NodeList) {
      return Array.from(images);
    }
    
    if (Array.isArray(images)) {
      return images;
    }
    
    if (images) {
      return [images];
    }
    
    // Default: find all images with data-src
    return Array.from(container.querySelectorAll(SELECTORS.LAZY_IMAGES));
  }

  /**
   * Filters out images inside preloader elements
   * @param {HTMLImageElement[]} images - Array of image elements
   * @returns {HTMLImageElement[]} Filtered array
   */
  excludePreloaderImages(images) {
    return images.filter(img => !img.closest(SELECTORS.PRELOADER));
  }

  /**
   * Checks if an image is already loaded (cached)
   * @param {HTMLImageElement} element - Image element to check
   * @returns {boolean} True if image is loaded
   */
  isImageLoaded(element) {
    return element.complete && element.naturalHeight > 0;
  }

  /**
   * Promise helper: Loads an image off-DOM and returns a Promise
   * @param {string} src - Image source URL
   * @returns {Promise<HTMLImageElement>} Resolves with loaded image element
   */
  loadImageOffDOM(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      // Set crossorigin to match preload links for CDN images
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  /**
   * Promise helper: Waits for a DOM element to load (or already complete)
   * @param {HTMLImageElement} element - Image element to wait for
   * @returns {Promise<void>} Resolves when element is loaded
   */
  waitForElementLoad(element) {
    if (element.complete) {
      return Promise.resolve();
    }
    return Promise.race([
      new Promise(resolve => element.addEventListener('load', resolve, { once: true })),
      new Promise(resolve => element.addEventListener('error', resolve, { once: true }))
    ]);
  }

  /**
   * Decodes an image to ensure it's layout-ready
   * See https://html.spec.whatwg.org/multipage/images.html#decoding-images
   * @param {HTMLImageElement} element - Image element to decode
   * @returns {Promise<HTMLImageElement>} Resolves when decoded
   */
  async decodeImage(element) {
    if (!element.decode) {
      return element; // decode() not supported, return as-is
    }
    
    try {
      await element.decode();
      return element;
    } catch (error) {
      // Decode failed, but image is loaded - continue anyway
      console.warn(`Image decode failed for ${element.src}:`, error);
      return element;
    }
  }

  /**
   * Check if an image URL has been preloaded
   * @param {string} url - Image URL to check
   * @returns {boolean} True if the image URL is in the preloaded set
   */
  isImagePreloaded(url) {
    return this.preloadedUrls.has(url);
  }

  /**
   * Ensure an image is ready (preloaded or currently loading)
   * Returns the loading promise if image is currently loading, or null if already loaded
   * @param {string} url - Image URL to check
   * @returns {Promise<HTMLImageElement>|null} Loading promise or null
   */
  ensureImageReady(url) {
    if (this.isImagePreloaded(url)) {
      return Promise.resolve(null); // Already loaded
    }
    
    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url); // Return existing promise
    }
    
    return null; // Not preloaded and not loading
  }

  /**
   * Wait for an image element to load
   * @param {HTMLImageElement} element - Image element to wait for
   * @returns {Promise<HTMLImageElement>} Resolves when image is loaded
   */
  async waitForImageLoad(element) {
    if (this.isImageLoaded(element)) {
      return element;
    }
    
    return this.waitForElementLoad(element).then(() => element);
  }

  /**
   * Handles progress tracking and callbacks
   * @param {Object} params
   * @param {number} params.loaded - Number of images loaded
   * @param {number} params.total - Total number of images
   * @param {HTMLImageElement} params.element - Current image element
   * @param {number} params.index - Index of current image
   * @param {Function} params.onProgress - Progress callback: (loaded, total, percentage) => void
   * @param {Function} params.onImageLoad - Per-image callback: (element, index) => void
   */
  handleImageProgress({ loaded, total, element, index, onProgress, onImageLoad }) {
    const percentage = Math.round((loaded / total) * 100);
    
    if (onProgress) {
      onProgress(loaded, total, percentage);
    }
    
    if (onImageLoad) {
      onImageLoad(element, index);
    }
  }

  /**
   * Creates a progress tracker function
   * @param {number} total - Total number of images
   * @param {Function} onProgress - Progress callback
   * @param {Function} onImageLoad - Per-image callback
   * @returns {Function} Progress tracker function: (element, index) => void
   */
  createProgressTracker(total, onProgress, onImageLoad) {
    let loadedCount = 0;
    
    return (element, index) => {
      loadedCount++;
      this.handleImageProgress({
        loaded: loadedCount,
        total,
        element,
        index,
        onProgress,
        onImageLoad
      });
    };
  }

  /**
   * Decodes an image off-DOM (for temporary images)
   * @param {HTMLImageElement} img - Image element to decode
   * @param {string} src - Image source URL (for error messages)
   * @returns {Promise<void>} Resolves when decoded (or silently fails)
   */
  async decodeImageOffDOM(img, src) {
    if (!img.decode) return;
    
    try {
      await img.decode();
    } catch (error) {
      // Decode failed, but image is loaded - continue anyway
      console.warn(`Image decode failed for ${src}, continuing with load:`, error);
    }
  }

  /**
   * Loads an image with decode support - decodes off-DOM before setting src to prevent flicker
   * @param {Object} params
   * @param {HTMLImageElement} params.element - Image element to load
   * @param {string} params.dataSrc - Source URL from data-src attribute
   * @param {Function} params.onLoad - Callback when image loads
   * @returns {Promise<HTMLImageElement|null>} Resolves when loaded and decoded
   */
  async loadImageWithDecode({ element, dataSrc, onLoad }) {
    try {
      // Load and decode image off-DOM
      const tempImg = await this.loadImageOffDOM(dataSrc);
      await this.decodeImageOffDOM(tempImg, dataSrc);
      
      // Image is now loaded and decoded - set src on DOM element (will be instant since cached)
      element.src = dataSrc;
      
      // Wait for DOM element's load event (should fire immediately since cached)
      await this.waitForElementLoad(element);
      
      onLoad?.(element);
      return element;
    } catch (error) {
      console.error(`Error loading image ${dataSrc}:`, error);
      onLoad?.(element); // Still call onLoad for progress tracking
      return null;
    }
  }

  /**
   * Loads an image using traditional approach (onload event, optional decode after)
   * @param {Object} params
   * @param {HTMLImageElement} params.element - Image element to load
   * @param {string} params.dataSrc - Source URL from data-src attribute
   * @param {boolean} params.useDecode - Whether to decode after load
   * @param {Function} params.onLoad - Callback when image loads
   * @returns {Promise<HTMLImageElement|null>} Resolves when loaded
   */
  async loadImageWithoutDecode({ element, dataSrc, useDecode, onLoad }) {
    return new Promise((resolve) => {
      const controller = new AbortController();
      const { signal } = controller;
      
      const handleLoad = async () => {
        controller.abort(); // Cleanup listeners
        
        const decodedElement = useDecode ? await this.decodeImage(element) : element;
        onLoad?.(decodedElement);
        resolve(decodedElement);
      };
      
      const handleError = () => {
        controller.abort(); // Cleanup listeners
        // Count failed images to prevent hanging
        onLoad?.(element);
        resolve(null);
      };
      
      element.addEventListener('load', handleLoad, { signal });
      element.addEventListener('error', handleError, { signal });
      
      // Start loading
      if (!element.src) {
        element.src = dataSrc;
      }
    });
  }

  /**
   * Gets the appropriate image loader strategy based on decode support
   * @param {boolean} useDecode - Whether decode is requested
   * @param {HTMLImageElement} element - Image element to check for decode support
   * @returns {Function} The appropriate loader function
   */
  getImageLoader(useDecode, element) {
    if (useDecode && element.decode) {
      return this.loadImageWithDecode.bind(this);
    }
    return this.loadImageWithoutDecode.bind(this);
  }

  /**
   * Handles image ready state (for already-loaded or missing data-src images)
   * @param {HTMLImageElement} element - Image element
   * @param {boolean} useDecode - Whether to decode
   * @param {Function} onLoad - Optional callback
   * @returns {Promise<HTMLImageElement>} Resolves with decoded element
   */
  async handleImageReady(element, useDecode, onLoad) {
    const decodedElement = useDecode ? await this.decodeImage(element) : element;
    onLoad?.(decodedElement);
    return decodedElement;
  }

  /**
   * Prepares and filters image elements
   * @param {HTMLElement[]|NodeList|string} images - Images input
   * @param {HTMLElement|Document} container - Container to search in
   * @param {boolean} excludePreloader - Whether to exclude preloader images
   * @returns {HTMLImageElement[]} Prepared image elements
   */
  prepareImages(images, container, excludePreloader) {
    let imageElements = this.normalizeImages(images, container);
    
    if (excludePreloader) {
      imageElements = this.excludePreloaderImages(imageElements);
    }
    
    return imageElements;
  }

  /**
   * Loads a single image with decode support
   * When useDecode is true, decodes the image off-DOM before setting src on the DOM element
   * to prevent flicker/repaint issues.
   * @param {Object} params
   * @param {HTMLImageElement} params.element - Image element to load
   * @param {number} [params.index] - Index of the image (optional, for progress tracking)
   * @param {boolean} [params.useDecode=true] - Whether to use decode() (decodes off-DOM before DOM insertion)
   * @param {Function} [params.onLoad] - Callback when image loads
   * @returns {Promise<HTMLImageElement|null>} Resolves when loaded
   */
  async loadSingleImage({ element, index, useDecode = true, onLoad }) {
    // Handle already-loaded images (cached)
    if (this.isImageLoaded(element)) {
      return this.handleImageReady(element, useDecode, onLoad);
    }
    
    const dataSrc = element.getAttribute(ATTRIBUTES.DATA_SRC);
    if (!dataSrc) {
      return this.handleImageReady(element, false, onLoad);
    }
    
    // Get appropriate loader strategy
    const loader = this.getImageLoader(useDecode, element);
    return loader({ element, dataSrc, useDecode, onLoad });
  }

  /**
   * Load a single image with decode support and state management
   * @param {Object} params
   * @param {HTMLImageElement} params.element - Image element to load
   * @param {number} [params.index] - Index of the image (optional, for progress tracking)
   * @param {boolean} [params.useDecode=true] - Whether to use decode() (decodes off-DOM before DOM insertion)
   * @param {Function} [params.onLoad] - Callback when image loads
   * @returns {Promise<HTMLImageElement|null>} Resolves when loaded
   */
  async loadImage({ element, index, useDecode = true, onLoad }) {
    // Handle already-loaded images (cached)
    if (this.isImageLoaded(element)) {
      return this.handleImageReady(element, useDecode, onLoad);
    }
    
    const dataSrc = element.getAttribute(ATTRIBUTES.DATA_SRC);
    if (!dataSrc) {
      return this.handleImageReady(element, false, onLoad);
    }

    // Track URL for preloading
    const url = dataSrc;
    
    // Check if already preloaded
    if (this.isImagePreloaded(url)) {
      // Image is cached, just set src and wait for load event
      element.src = url;
      await this.waitForElementLoad(element);
      onLoad?.(element);
      return element;
    }

    // Check if currently loading
    if (this.loadingPromises.has(url)) {
      // Wait for existing load to complete
      await this.loadingPromises.get(url);
      element.src = url;
      await this.waitForElementLoad(element);
      onLoad?.(element);
      return element;
    }

    // Get appropriate loader strategy
    const loader = this.getImageLoader(useDecode, element);
    
    // Create loading promise and track it
    const loadPromise = loader({ element, dataSrc, useDecode, onLoad })
      .then((result) => {
        // Mark as preloaded on success
        if (result) {
          this.preloadedUrls.add(url);
        }
        this.loadingPromises.delete(url);
        return result;
      })
      .catch((error) => {
        this.loadingPromises.delete(url);
        throw error;
      });
    
    this.loadingPromises.set(url, loadPromise);
    
    return loadPromise;
  }

  /**
   * Preload multiple images with support for progress tracking and decoding
   * 
   * @param {Object} options - Configuration options
   * @param {HTMLElement[]|NodeList|string} options.images - Array of image elements, NodeList, or CSS selector
   * @param {HTMLElement|Document} options.container - Container to search in (default: document)
   * @param {Function} options.onProgress - Callback fired when each image loads: (loaded, total, percentage) => void
   * @param {Function} options.onImageLoad - Callback fired per image: (imageElement, index) => void
   * @param {boolean} options.excludePreloader - Exclude images inside .preloader (default: false)
   * @param {boolean} options.useDecode - Use decode() for layout-ready images (default: true)
   * @returns {Promise<{loaded: number, total: number, images: HTMLElement[]}>} Resolves when all images are loaded
   * 
   * @example
   * // Router use case - simple wait
   * await imageService.preloadImages({ images: 'img[data-src]' });
   * 
   * @example
   * // Preloader use case - with progress tracking
   * await imageService.preloadImages({
   *   images: this.images,
   *   excludePreloader: true,
   *   onProgress: (loaded, total, percentage) => {
   *     this.updateProgress(loaded, total, percentage);
   *   }
   * });
   */
  async preloadImages({
    images,
    container = document,
    onProgress,
    onImageLoad,
    excludePreloader = false,
    useDecode = true,
  } = {}) {
    // Prepare and filter images
    const imageElements = this.prepareImages(images, container, excludePreloader);
    
    if (imageElements.length === 0) {
      return { loaded: 0, total: 0, images: [] };
    }
    
    // Create progress tracker
    const trackProgress = this.createProgressTracker(
      imageElements.length,
      onProgress,
      onImageLoad
    );
    
    // Load all images
    const imagePromises = imageElements.map((element, index) => {
      return this.loadImage({
        element,
        index,
        useDecode,
        onLoad: (img) => trackProgress(img, index)
      });
    });
    
    const results = await Promise.all(imagePromises);
    
    // Count successful loads (non-null results)
    const loadedCount = results.filter(result => result !== null).length;
    
    return {
      loaded: loadedCount,
      total: imageElements.length,
      images: imageElements
    };
  }

  /**
   * Preload a single image element (used when needed during transition)
   * Skips preloading if the image is already in the preloaded set
   * @param {HTMLImageElement} imgElement - Image element with data-src attribute to preload
   * @returns {Promise<HTMLImageElement|null>} Resolves when image is loaded or fails silently
   */
  async preloadSingleImage(imgElement) {
    if (!imgElement || !imgElement.dataset.src) {
      return null;
    }

    const url = imgElement.dataset.src;

    // Skip if already preloaded
    if (this.isImagePreloaded(url)) {
      return imgElement;
    }

    // Check if currently loading
    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url);
    }

    try {
      const result = await this.loadImage({
        element: imgElement,
        useDecode: true,
      });

      return result;
    } catch (error) {
      console.warn(`Failed to preload image: ${url}`, error);
      return null;
    }
  }

  /**
   * Ensures a transition image is preloaded and ready
   * 
   * Handles the complete preload lifecycle for transition images:
   * 1. Checks if image is already preloaded via TransitionsManager (if available)
   * 2. If not preloaded, creates temp img element and preloads off-DOM
   * 3. Sets crossOrigin = 'anonymous' to match HTML <link rel="preload"> crossorigin
   * 4. Uses TransitionsManager.preloadSingleImage() if available, otherwise ImageService.loadImage()
   * 
   * Why extract this?
   * - Centralizes preload check + preload logic (duplicated in updateTransitionOverlay and restoreTransitionData)
   * - Handles crossOrigin matching automatically
   * - Reusable across MPAPageTransition and TransitionsManager
   * - Reduces code duplication and complexity
   * 
   * @param {string} imageUrl - Image URL to ensure is ready
   * @param {Object} options - Configuration options
   * @param {Object|null} options.transitionsManager - Optional TransitionsManager instance for preload tracking
   * @returns {Promise<boolean>} True if image is ready (or preload attempted), false if preload failed
   */
  async ensureTransitionImageReady(imageUrl, { transitionsManager = null } = {}) {
    if (!imageUrl) {
      return false;
    }

    // Check if image is already preloaded via TransitionsManager
    // TransitionsManager tracks preloaded URLs in ImageService's preloadedUrls Set
    if (transitionsManager && transitionsManager.isImagePreloaded(imageUrl)) {
      // Image already preloaded and cached → ready to use
      return true;
    }

    // Image not preloaded → need to preload before use
    // Create temp img element off-DOM to preload without affecting layout
    try {
      const tempImg = document.createElement('img');
      tempImg.setAttribute('data-src', imageUrl);
      
      // CRITICAL: crossOrigin must match HTML <link rel="preload"> crossorigin attribute
      // If mismatch, browser treats preloaded image and <img> tag as different resources
      // Result: Preloaded image ignored, causing network request and flash
      tempImg.crossOrigin = 'anonymous';
      
      // Preload via TransitionsManager (preferred) or ImageService (fallback)
      // TransitionsManager uses ImageService internally but also tracks preloaded URLs
      if (transitionsManager) {
        await transitionsManager.preloadSingleImage(tempImg);
      } else {
        await this.loadImage({ element: tempImg });
      }
      
      return true;
    } catch (error) {
      // Preload failed → return false but don't throw
      // Caller can still set src on DOM element (browser will load it)
      console.warn(`Failed to preload transition image: ${imageUrl}`, error);
      return false;
    }
  }
}
