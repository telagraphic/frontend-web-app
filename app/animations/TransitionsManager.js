import { PageTransition } from "./PageTransition.js";
import { ImageService } from "../utilities/ImageService.js";
import { whenDOMReady } from "../utilities/AsyncHelpers.js";
import { $ } from "../utilities/DOMHelpers.js";
import { SELECTORS, ATTRIBUTES } from "../utilities/Constants.js";
import { createError, ERROR_CODES } from "../utilities/ErrorRegistry.js";

/**
 * TransitionsManager class for managing the transition overlay
 * Handles the transition overlay templates and preloading of images
 * Manages the transition overlay elements
 */
export class TransitionsManager {
  /**
   * Creates a new TransitionsManager instance
   * @param {Object} options - Configuration options
   * @param {import("../config/SiteConfig.js").SiteConfig} options.siteConfig - Site configuration containing route and transition data
   * @param {Storage} [options.sessionStorage] - SessionStorage instance for persistence (defaults to window.sessionStorage)
   */
  constructor({ siteConfig, sessionStorage = window.sessionStorage }) {
    this.siteConfig = siteConfig;
    this.sessionStorage = sessionStorage;
    this.imageLoader = new ImageService();
    this.pageTransitionOverlay = null;
    this.transitionTemplates = null;
    this.pageTransitionOverlayAnimation = new PageTransition();
    // * Note: Don't call init() here - let App call it when DOM is ready
  }

  /**
   * Initialize TransitionsManager - call this when DOM is ready
   * Handles both cases: DOM already loaded (hard refresh) or loading dynamically
   * Sets up transition templates and initializes image preloading strategy
   * @returns {Promise<void>} Resolves when initialization is complete
   * @example
   * const transitionsManager = new TransitionsManager({ siteConfig });
   * await transitionsManager.init();
   */
  async init() {
    // Helper function to perform initialization
    return new Promise((resolve) => {
      whenDOMReady(() => {
        this.pageTransitionOverlay = $(SELECTORS.TRANSITION_OVERLAY);
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
   * @param {string} data.transition.copy - Text to display during transition
   * @param {string} data.transition.image - Image URL for the transition
   * @param {string} data.transition.alt - Alt text for the transition image
   * @returns {string} HTML template string with transition markup
   * 
   * Removed:
   * <p class="page-transition-overlay__copy">${data.transition.copy}</p>
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
   * @example
   * if (transitionsManager.isImagePreloaded(imageUrl)) {
   *   Image is already cached
   * }
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
   * @example
   * const img = document.querySelector('img[data-src]');
   * await transitionsManager.preloadSingleImage(img);
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
   * Queries the transition template and updates the page transition overlay with the custom transition markup
   * Normalizes the route, finds the matching template, ensures image is loaded,
   * and updates the DOM with the transition content
   * 
   * FIX: Ensures image is fully loaded before setting src and updating DOM to prevent race condition
   * 
   * @param {string} route - The route to get the transition for (e.g., "/home" or "home"), maps to the template data-id attribute
   * @returns {Promise<void>} Resolves when the transition overlay is updated and image is ready
   * @throws {Error} Logs warnings if TransitionsManager is not initialized or template is not found
   * @example
   * // Called in Page.hide()
   * await this.transitionsManager.updateTransitionOverlay("/section-1");
   */
  async updateTransitionOverlay(route) {
    // Guard: Check if initialized
    if (!this.transitionTemplates) {
      const error = createError(ERROR_CODES.INITIALIZATION_ERROR, { message: 'TransitionsManager not initialized. Call init() first.' });
      console.warn(error.message);
      return;
    }

    route = this.normalizeRoute(route);

    // Fix: Add null check for querySelector result
    const transitionTemplate = this.transitionTemplates.querySelector(
      `${SELECTORS.TEMPLATE}[${ATTRIBUTES.DATA_ID}="${route}"]`
    );

    if (!transitionTemplate) {
      const error = createError(ERROR_CODES.VALIDATION_ERROR, { message: `Transition template not found for route: ${route}` });
      console.warn(error.message);
      return;
    }

    // Get the original image from the template (before cloning)
    const templateImg = transitionTemplate.content.querySelector(SELECTORS.IMG);
    
    if (!templateImg || !templateImg.dataset.src) {
      return;
    }

    const imageUrl = templateImg.dataset.src;

    // CRITICAL FIX: Ensure image is preloaded/loaded before displaying
    // This prevents race condition where transition starts before image is ready
    // Preload using the template image (which is in the template DOM)
    if (!this.isImagePreloaded(imageUrl)) {
      // Preload the template image and wait for it to complete
      await this.preloadSingleImage(templateImg);
    }

    // Now clone the template (image should be cached at this point)
    const transitionData = transitionTemplate.content.cloneNode(true);
    const img = transitionData.querySelector(SELECTORS.IMG);

    if (!img) {
      return;
    }

    // Set src on cloned image (should be instant from cache)
    img.src = imageUrl;

    // Wait for cloned image to be ready (should be instant if cached, but ensures it's loaded)
    try {
      await this.imageLoader.waitForImageLoad(img);
    } catch (error) {
      const loadError = createError(ERROR_CODES.IMAGE_LOAD_ERROR, { message: `Failed to ensure cloned image is ready for transition: ${imageUrl}`, originalError: error });
      console.warn(loadError.message, loadError);
      // Continue anyway - image may still display
    }

    // Guard: Check if pageTransition exists
    if (this.pageTransitionOverlay) {
      this.pageTransitionOverlay.replaceChildren(transitionData);
    }
  }

  /**
   * Shows the page transition overlay with animation
   * Delegates to PageTransition.showPageTransition for the actual animation
   * @param {HTMLElement} element - The page transition overlay element to animate
   * @returns {Promise<void>} Resolves when the show animation is complete
   * @example
   * const overlay = document.querySelector('.page-transition-overlay');
   * await transitionsManager.showPageTransition(overlay);
   */
  showPageTransition(element) {
    return this.pageTransitionOverlayAnimation.showPageTransition(element);
  }

  /**
   * Hides the page transition overlay with animation
   * Delegates to PageTransition.hidePageTransition for the actual animation
   * @param {HTMLElement} element - The page transition overlay element to animate
   * @returns {Promise<void>} Resolves when the hide animation is complete
   * @example
   * const overlay = document.querySelector('.page-transition-overlay');
   * await transitionsManager.hidePageTransition(overlay);
   */
  hidePageTransition(element) {
    return this.pageTransitionOverlayAnimation.hidePageTransition(element);
  }

  /**
   * Normalizes a route string by removing leading slash
   * Ensures consistent route format for template lookups
   * @param {string} route - Route string that may or may not start with "/"
   * @returns {string} Normalized route without leading slash
   * @example
   * normalizeRoute("/home") // Returns "home"
   * normalizeRoute("section-1") // Returns "section-1"
   */
  normalizeRoute(route) {
    if (route.startsWith("/")) {
      return route.substring(1);
    }
    return route;
  }

  /**
   * Get the transition overlay element
   * @returns {HTMLElement|null} The transition overlay element or null if not found
   */
  getTransitionOverlayElement() {
    if (!this.pageTransitionOverlay) {
      this.pageTransitionOverlay = $(SELECTORS.TRANSITION_OVERLAY);
    }
    return this.pageTransitionOverlay;
  }

  /**
   * Store transition data in sessionStorage for persistence across page loads
   * @param {Object} transitionData - Transition data object with image, alt, copy
   */
  storeTransitionData(transitionData) {
    try {
      this.sessionStorage.setItem('pageTransitionImage', JSON.stringify(transitionData));
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
   * Restore transition data from sessionStorage and update overlay markup
   * 
   * Lifecycle Overview:
   * 1. Retrieves transition data from sessionStorage (stored before navigation)
   * 2. Checks if HTML already has correct image (prevents stale overwrites)
   * 3. If image needs updating, ensures it's preloaded via ensureTransitionImageReady()
   * 4. Updates DOM element via updateOverlayImageElement()
   * 
   * Why this complexity?
   * - HTML may have correct image from build-time generation
   * - sessionStorage might have stale image from previous navigation
   * - Prevents overwriting correct HTML image with stale sessionStorage data
   * - Ensures image is preloaded before setting src (smooth transition)
   * 
   * Edge Cases Handled:
   * - No sessionStorage data → return early
   * - HTML has valid image that doesn't match sessionStorage → preserve HTML image
   * - Image already correct and loaded → skip update
   * - Image needs updating → preload then update DOM
   * 
   * @returns {Promise<void>} Resolves when overlay is updated
   */
  async restoreTransitionData() {
    try {
      const storedData = this.sessionStorage.getItem('pageTransitionImage');
      if (!storedData) return;

      const transitionData = JSON.parse(storedData);
      const overlayElement = this.getTransitionOverlayElement();
      const imageElement = overlayElement?.querySelector('.page-transition-overlay__image');
      
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
          this.sessionStorage.removeItem('pageTransitionImage');
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
          // Uses extracted method to handle preload check + preload logic
          await this.imageLoader.ensureTransitionImageReady(transitionData.image, {
            transitionsManager: this
          });
          
          // Update DOM element with preloaded image
          // Uses extracted method to handle crossOrigin, src, alt, and load verification
          await this.updateOverlayImageElement(imageElement, transitionData.image, transitionData.alt);
        }
      }

      this.sessionStorage.removeItem('pageTransitionImage');
    } catch (error) {
      const storageError = createError(ERROR_CODES.STORAGE_ERROR, { message: 'Failed to restore transition data from sessionStorage', originalError: error });
      console.warn(storageError.message, storageError);
      this.sessionStorage.removeItem('pageTransitionImage');
    }
  }

  /**
   * Update overlay with transition data from SiteConfig (route-based approach)
   * 
   * This method is used by MPAPageTransition for direct route-based updates,
   * as opposed to the template-based updateTransitionOverlay() method.
   * 
   * Lifecycle Overview:
   * 1. Validates route and retrieves transition config from SiteConfig
   * 2. Ensures image is preloaded via ImageService.ensureTransitionImageReady()
   * 3. Updates DOM overlay image element via updateOverlayImageElement()
   * 
   * Why this approach?
   * - Preloading ensures smooth transitions without image loading delays
   * - crossOrigin matching is critical: must match HTML <link rel="preload"> crossorigin
   *   attribute for browser to use cached/preloaded image (otherwise treated as different resource)
   * - Off-DOM preloading prevents layout shifts and ensures image is decoded before display
   * - Waiting for DOM element load ensures image is painted before transition starts
   * 
   * Edge Cases Handled:
   * - Missing siteConfig or route → return early with warning
   * - Route not found in config → return early with warning
   * - No image URL in transition data → return early with warning
   * - Image already preloaded → skips preload step
   * - Preload fails → continues anyway (image may still load)
   * - DOM element not found → returns early
   * - Image load fails → logs warning but completes (non-blocking)
   * 
   * @param {string} route - SiteConfig route key (e.g., "/introduction", "/section-1")
   * @returns {Promise<void>} Resolves when overlay is updated and image is loaded
   */
  async updateTransitionOverlayFromRoute(route) {
    // ============================================
    // SECTION 1: Route & Config Validation
    // ============================================
    // Early validation prevents unnecessary work if route/config invalid
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

    // ============================================
    // SECTION 2: Ensure Image is Preloaded
    // ============================================
    // Uses extracted method to handle preload check + preload logic
    // Handles crossOrigin matching, temp img creation, and fallback logic
    await this.imageLoader.ensureTransitionImageReady(imageUrl, {
      transitionsManager: this
    });

    // ============================================
    // SECTION 3: Update DOM Element
    // ============================================
    // Find overlay image element and update it
    const overlayElement = this.getTransitionOverlayElement();
    const imageElement = overlayElement?.querySelector('.page-transition-overlay__image');
    if (imageElement) {
      await this.updateOverlayImageElement(imageElement, imageUrl, transitionData.alt);
    }
  }
}
