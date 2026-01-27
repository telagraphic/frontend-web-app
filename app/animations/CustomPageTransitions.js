import { BaseTransitionStrategy } from './BaseTransitionStrategy.js';
import { PageTransition } from './PageTransition.js';
import { ImageService } from '../utilities/ImageService.js';
import { whenDOMReady } from '../utilities/AsyncHelpers.js';
import { $ } from '../utilities/DOMHelpers.js';
import { SELECTORS, ATTRIBUTES, STORAGE_KEYS } from '../utilities/Constants.js';
import { createError, ERROR_CODES } from '../utilities/ErrorRegistry.js';

/**
 * Custom page transition strategy
 * 
 * Handles complex image-based transitions with preloading, caching, and
 * sessionStorage persistence. Manages transition templates and ensures
 * images are ready before transitions start.
 * 
 * This strategy provides rich, image-based transitions suitable for
 * projects that want visual continuity between pages.
 */
export class CustomPageTransitions extends BaseTransitionStrategy {
  constructor(options) {
    super(options);
    this.imageLoader = new ImageService();
    this.pageTransition = new PageTransition();
    this.transitionTemplates = null;
    // Note: overlayElement is set by parent, but we also track it here for convenience
  }

  /**
   * Initialize custom transitions - call this when DOM is ready
   * Sets up transition templates and initializes image preloading strategy
   * @returns {Promise<void>} Resolves when initialization is complete
   */
  async init() {
    return new Promise((resolve) => {
      whenDOMReady(() => {
        if (!this.overlayElement) {
          this.overlayElement = $(SELECTORS.TRANSITION_OVERLAY);
        }
        this.transitionTemplates = $(SELECTORS.TRANSITION_TEMPLATES);

        this.setupTransitionTemplates();
        this.initializePreloading();
        resolve();
      });
    });
  }

  /**
   * Sets up transition templates from site configuration
   * Creates template elements for each route and adds them to the DOM
   * Templates are stored in the #page-transition-overlay-templates container
   * @returns {void}
   */
  setupTransitionTemplates() {
    let transitionTemplates = document.createDocumentFragment();

    for (const [route, data] of Object.entries(this.siteConfig.settings)) {
      let template = this.createTransitionTemplate(route, data);
      transitionTemplates.appendChild(
        new DOMParser()
          .parseFromString(template, "text/html")
          .querySelector(SELECTORS.TEMPLATE)
      );
    }

    // Replace all children with the templates from the fragment
    // Using spread operator to extract all children from the DocumentFragment
    // This explicitly moves all template elements into the DOM
    this.transitionTemplates.replaceChildren(...transitionTemplates.children);
  }

  /**
   * Creates a transition template HTML string for a given route
   * @param {string} route - The route identifier (e.g., "home", "section-1")
   * @param {Object} data - Route configuration data from siteConfig
   * @param {Object} data.transition - Transition configuration
   * @param {string} data.transition.image - Image URL for the transition
   * @param {string} data.transition.alt - Alt text for the transition image
   * @returns {string} HTML template string with transition markup
   */
  createTransitionTemplate(route, data) {
    return `<template ${ATTRIBUTES.DATA_ID}="${route}">
      <img
        class="page-transition-overlay__image"
        ${ATTRIBUTES.DATA_SRC}="${data.transition.image}"
        alt="${data.transition.alt}"
      />
    </template>`;
  }

  /**
   * Initialize preloading strategy for transition images
   * Uses requestIdleCallback when available, otherwise falls back to setTimeout
   * Preloading happens during browser idle time to avoid blocking main thread
   * @returns {void}
   */
  initializePreloading() {
    // Preload during idle time
    if ("requestIdleCallback" in window) {
      requestIdleCallback(() => {
        this.preloadAllTransitionImages();
      });
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => {
        this.preloadAllTransitionImages();
      }, 2000);
    }
  }

  /**
   * Extract all image elements from transition templates
   * @returns {HTMLImageElement[]} Array of image elements with data-src attributes
   */
  getAllTransitionImageElements() {
    const images = [];

    if (!this.transitionTemplates) return images;

    const templates = this.transitionTemplates.querySelectorAll(SELECTORS.TEMPLATE);

    templates.forEach((template) => {
      const img = template.content.querySelector(SELECTORS.IMG);
      if (img && img.dataset.src) {
        images.push(img);
      }
    });

    return images;
  }

  /**
   * Preload all transition images during idle time using ImageService
   * Images are decoded for layout-ready rendering
   * @returns {Promise<void>} Resolves when all images are preloaded (or failed)
   */
  async preloadAllTransitionImages() {
    const imageElements = this.getAllTransitionImageElements();

    if (imageElements.length === 0) return;

    try {
      await this.imageLoader.preloadImages({
        images: imageElements,
        container: this.transitionTemplates,
        useDecode: true, // Use decode for layout-ready images
      });
    } catch (error) {
      const loadError = createError(ERROR_CODES.IMAGE_LOAD_ERROR, { message: 'Failed to preload transition images', originalError: error });
      console.warn(loadError.message, loadError);
    }
  }

  /**
   * Check if an image URL has been preloaded
   * @param {string} url - Image URL to check
   * @returns {boolean} True if the image URL is in the preloaded set
   */
  isImagePreloaded(url) {
    return this.imageLoader.isImagePreloaded(url);
  }

  /**
   * Preload a single image element (used when needed during transition)
   * Skips preloading if the image is already in the preloaded set
   * Uses ImageService for consistent behavior
   * @param {HTMLImageElement} imgElement - Image element with data-src attribute to preload
   * @returns {Promise<HTMLImageElement|null>} Resolves when image is loaded or fails silently
   */
  async preloadSingleImage(imgElement) {
    if (!imgElement || !imgElement.dataset.src) {
      return null;
    }

    try {
      return await this.imageLoader.preloadSingleImage(imgElement);
    } catch (error) {
      const loadError = createError(ERROR_CODES.IMAGE_LOAD_ERROR, { message: `Failed to preload transition image: ${imgElement.dataset.src}`, originalError: error });
      console.warn(loadError.message, loadError);
      return null;
    }
  }

  /**
   * Normalizes a route string by removing leading slash
   * Ensures consistent route format for template lookups
   * @param {string} route - Route string that may or may not start with "/"
   * @returns {string} Normalized route without leading slash
   */
  normalizeRoute(route) {
    if (route.startsWith("/")) {
      return route.substring(1);
    }
    return route;
  }

  /**
   * Store transition data in sessionStorage for persistence across page loads
   * @param {Object} transitionData - Transition data object with image, alt, copy
   */
  storeTransitionData(transitionData) {
    try {
      this.sessionStorage.setItem(STORAGE_KEYS.PAGE_TRANSITION_IMAGE, JSON.stringify(transitionData));
    } catch (error) {
      const storageError = createError(ERROR_CODES.STORAGE_ERROR, { message: 'Failed to store transition data in sessionStorage', originalError: error });
      console.warn(storageError.message, storageError);
    }
  }

  /**
   * Updates the overlay image element with transition image data
   * 
   * Handles DOM manipulation for transition overlay image:
   * - Sets crossOrigin to match preload link (critical for browser cache usage)
   * - Sets src to imageUrl (will use cached image if preloaded)
   * - Updates alt text if provided
   * - Waits for image to load (ensures DOM element is ready)
   * 
   * @param {HTMLImageElement} imageElement - The overlay image element to update
   * @param {string} imageUrl - Image URL to set as src
   * @param {string} [altText] - Optional alt text for the image
   * @returns {Promise<void>} Resolves when image element is updated and loaded
   */
  async updateOverlayImageElement(imageElement, imageUrl, altText) {
    if (!imageElement || !imageUrl) {
      return;
    }

    // CRITICAL: Set crossOrigin on DOM element to match preload link
    // This ensures browser uses the preloaded/cached image instead of re-downloading
    imageElement.crossOrigin = 'anonymous';
    
    // Set src on DOM element
    // If image was preloaded, this should be instant from cache
    // If not preloaded, browser will load it (may cause slight delay/flash)
    imageElement.src = imageUrl;
    
    // Update alt text if provided
    if (altText) {
      imageElement.alt = altText;
    }

    // Wait for DOM element to finish loading
    // Even if image was preloaded, we need to ensure the DOM element is ready
    // This prevents blank image flash when overlay becomes visible
    try {
      await this.imageLoader.waitForImageLoad(imageElement);
    } catch (error) {
      // Non-blocking error: log warning but continue
      // Transition will proceed even if image load verification fails
      const loadError = createError(ERROR_CODES.IMAGE_LOAD_ERROR, { message: 'Error waiting for transition image load', originalError: error });
      console.warn(loadError.message, loadError);
    }
  }

  /**
   * Prepare transition for a route
   * Updates overlay with transition data from SiteConfig and ensures image is ready
   * 
   * @param {string} route - SiteConfig route key (e.g., "/introduction", "/section-1")
   * @returns {Promise<void>} Resolves when overlay is updated and image is loaded
   */
  async prepare(route) {
    // Validate route and config
    if (!this.siteConfig || !route) {
      const error = createError(ERROR_CODES.VALIDATION_ERROR, { message: 'Cannot update transition overlay: missing siteConfig or route' });
      console.warn(error.message);
      return;
    }

    const routeConfig = this.siteConfig.get(route);
    if (!routeConfig || !routeConfig.transition) {
      const error = createError(ERROR_CODES.VALIDATION_ERROR, { message: `Transition data not found for route: ${route}` });
      console.warn(error.message);
      return;
    }

    const transitionData = routeConfig.transition;
    const imageUrl = transitionData.image;

    if (!imageUrl) {
      const error = createError(ERROR_CODES.VALIDATION_ERROR, { message: `No transition image URL for route: ${route}` });
      console.warn(error.message);
      return;
    }

    // Ensure image is preloaded
    // Pass this CustomPageTransitions instance so ImageService can use isImagePreloaded and preloadSingleImage
    await this.imageLoader.ensureTransitionImageReady(imageUrl, {
      transitionsManager: this
    });

    // Update DOM element
    const imageElement = this.overlayElement?.querySelector(SELECTORS.TRANSITION_IMAGE);
    if (imageElement) {
      await this.updateOverlayImageElement(imageElement, imageUrl, transitionData.alt);
    }

    // Store transition data for restoration on next page
    this.storeTransitionData(transitionData);
  }

  /**
   * Show transition overlay with fade-in animation
   * @param {HTMLElement} element - Overlay element to animate
   * @returns {Promise<void>} Resolves when animation completes
   */
  async show(element) {
    if (!element) return Promise.resolve();
    return this.pageTransition.showPageTransition(element);
  }

  /**
   * Hide transition overlay with fade-out animation
   * @param {HTMLElement} element - Overlay element to animate
   * @returns {Promise<void>} Resolves when animation completes
   */
  async hide(element) {
    if (!element) return Promise.resolve();
    return this.pageTransition.hidePageTransition(element);
  }

  /**
   * Restore transition data from sessionStorage and update overlay markup
   * 
   * Lifecycle Overview:
   * 1. Retrieves transition data from sessionStorage (stored before navigation)
   * 2. Checks if HTML already has correct image (prevents stale overwrites)
   * 3. If image needs updating, ensures it's preloaded via ensureTransitionImageReady()
   * 4. Updates DOM element via updateOverlayImageElement()
   * 
   * @returns {Promise<void>} Resolves when overlay is updated
   */
  async restore() {
    try {
      const storedData = this.sessionStorage.getItem(STORAGE_KEYS.PAGE_TRANSITION_IMAGE);
      if (!storedData) return;

      const transitionData = JSON.parse(storedData);
      const imageElement = this.overlayElement?.querySelector(SELECTORS.TRANSITION_IMAGE);
      
      if (imageElement && transitionData.image) {
        // CRITICAL: Prevent stale sessionStorage from overwriting correct HTML image
        // HTML may have correct image from build-time generation
        // sessionStorage might have stale image from previous navigation
        const fallbackImage = 'https://shea-memorandum-site.b-cdn.net/images/home-theme-desktop.webp';
        const htmlHasValidImage = imageElement.src && 
                                  imageElement.src !== '' && 
                                  imageElement.src !== fallbackImage;
        const imageMatchesSessionStorage = imageElement.src === transitionData.image;
        
        // If HTML has valid image that doesn't match sessionStorage, preserve HTML image
        // This prevents wrong image flash when navigating to unvisited pages
        if (htmlHasValidImage && !imageMatchesSessionStorage) {
          this.sessionStorage.removeItem(STORAGE_KEYS.PAGE_TRANSITION_IMAGE);
          return;
        }
        
        // Check if image is already correct and loaded
        // If so, skip unnecessary work (prevents redundant src assignment)
        const imageAlreadyCorrect = imageMatchesSessionStorage && 
                                   imageElement.complete && 
                                   imageElement.naturalHeight > 0;
        
        // Only update if image is not already correct
        if (!imageAlreadyCorrect) {
          // Ensure image is preloaded before updating DOM
          // Pass this CustomPageTransitions instance so ImageService can use isImagePreloaded and preloadSingleImage
          await this.imageLoader.ensureTransitionImageReady(transitionData.image, {
            transitionsManager: this
          });
          
          // Update DOM element with preloaded image
          await this.updateOverlayImageElement(imageElement, transitionData.image, transitionData.alt);
          
          // Force browser to paint the image before overlay animation
          // Even with image loaded, we need to ensure it's painted to prevent blank flash
          void imageElement.offsetHeight; // Force layout calculation
          await new Promise((resolve) => requestAnimationFrame(resolve)); // Ensure paint completes
        }
      }

      this.sessionStorage.removeItem(STORAGE_KEYS.PAGE_TRANSITION_IMAGE);
    } catch (error) {
      const storageError = createError(ERROR_CODES.STORAGE_ERROR, { message: 'Failed to restore transition data from sessionStorage', originalError: error });
      console.warn(storageError.message, storageError);
      this.sessionStorage.removeItem(STORAGE_KEYS.PAGE_TRANSITION_IMAGE);
    }
  }
}
