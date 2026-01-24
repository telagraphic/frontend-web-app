import { PageTransition } from "./PageTransition.js";
import { ImageService } from "../utilities/ImageService.js";
import { whenDOMReady } from "../utilities/AsyncHelpers.js";
import { $ } from "../utilities/DOMHelpers.js";
import { SELECTORS, ATTRIBUTES } from "../utilities/Constants.js";

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
   */
  constructor({ siteConfig }) {
    this.siteConfig = siteConfig;
    this.imageLoader = new ImageService();
    this.pageTransition = null;
    this.transitionTemplates = null;
    this.transitionAnimations = new PageTransition();
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
        this.pageTransition = $(SELECTORS.TRANSITION_OVERLAY);
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
      console.warn("Error preloading transition images:", error);
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
      console.warn(
        `Failed to preload transition image: ${imgElement.dataset.src}`,
        error
      );
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
      console.warn("TransitionsManager not initialized. Call init() first.");
      return;
    }

    route = this.normalizeRoute(route);

    // Fix: Add null check for querySelector result
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
      console.warn(`Failed to ensure cloned image is ready for transition: ${imageUrl}`, error);
      // Continue anyway - image may still display
    }

    // Guard: Check if pageTransition exists
    if (this.pageTransition) {
      this.pageTransition.replaceChildren(transitionData);
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
    return this.transitionAnimations.showPageTransition(element);
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
    return this.transitionAnimations.hidePageTransition(element);
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
}
