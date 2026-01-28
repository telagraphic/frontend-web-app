import { BaseTransitionStrategy } from './BaseTransitionStrategy.js';
import { FadeInAndOut } from '../animations/FadeInAndOut.js';
import { ImageService } from '../utilities/ImageService.js';
import { whenDOMReady } from '../utilities/AsyncHelpers.js';
import { $ } from '../utilities/DOMHelpers.js';
import { SELECTORS, ATTRIBUTES } from '../utilities/Constants.js';

/**
 * Custom page transition strategy
 * 
 * Handles complex image-based transitions with preloading and caching.
 * Manages transition templates and ensures images are ready before transitions start.
 * 
 * This strategy provides rich, image-based transitions suitable for
 * projects that want visual continuity between pages.
 */
export class CustomPageTransitions extends BaseTransitionStrategy {
  constructor(options) {
    super(options);
    this.imageLoader = new ImageService();
    this.pageTransition = new FadeInAndOut();
    this.transitionTemplates = null;
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
      console.warn("Error preloading transition images:", error);
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
      console.warn(
        `Failed to preload transition image: ${imgElement.dataset.src}`,
        error
      );
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
   * Prepare transition for a route
   * Updates overlay with transition data from templates and ensures image is ready
   * 
   * @param {string} route - Route key (e.g., "/introduction", "/section-1")
   * @returns {Promise<void>} Resolves when overlay is updated and image is loaded
   */
  async prepare(route) {
    // Guard: Check if initialized
    if (!this.transitionTemplates) {
      console.warn("CustomPageTransitions not initialized. Call init() first.");
      return;
    }

    route = this.normalizeRoute(route);

    // Find transition template
    const transitionTemplate = this.transitionTemplates.querySelector(
      `${SELECTORS.TEMPLATE}[${ATTRIBUTES.DATA_ID}="${route}"]`
    );

    if (!transitionTemplate) {
      console.warn(`Transition template not found for route: ${route}`);
      return;
    }

    // Get the original image from the template (before cloning)
    const templateImg = transitionTemplate.content.querySelector(SELECTORS.IMG);
    
    if (!templateImg || !templateImg.dataset.src) {
      return;
    }

    const imageUrl = templateImg.dataset.src;

    // CRITICAL: Ensure image is preloaded/loaded before displaying
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
      console.warn(`Failed to ensure cloned image is ready for transition: ${imageUrl}`, error);
      // Continue anyway - image may still display
    }

    // Guard: Check if overlay element exists
    if (this.overlayElement) {
      this.overlayElement.replaceChildren(transitionData);
    }
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
   * Restore transition state - no-op for SPA context
   * SPA doesn't need sessionStorage restoration since transitions happen in same page context
   * @returns {Promise<void>}
   */
  async restore() {
    // No restoration needed for SPA transitions
    return Promise.resolve();
  }
}
