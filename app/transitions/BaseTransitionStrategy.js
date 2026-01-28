/**
 * Base class for page transition strategies
 * Defines the interface that all transition types must implement
 * 
 * This abstract class provides a common interface for different transition
 * implementations (generic fade, custom image-based, etc.)
 */
export class BaseTransitionStrategy {
  /**
   * @param {Object} options - Configuration options
   * @param {import("../config/SiteConfig.js").SiteConfig} options.siteConfig - Site configuration
   * @param {HTMLElement} options.overlayElement - Transition overlay DOM element
   */
  constructor({ siteConfig, overlayElement }) {
    this.siteConfig = siteConfig;
    this.overlayElement = overlayElement;
  }

  /**
   * Prepare transition for a route (preload images, setup data, etc.)
   * Called before showing the transition overlay
   * @param {string} route - Route key from SiteConfig
   * @returns {Promise<void>}
   */
  async prepare(route) {
    throw new Error('prepare() must be implemented by subclass');
  }

  /**
   * Show the transition overlay
   * @param {HTMLElement} element - Overlay element
   * @returns {Promise<void>}
   */
  async show(element) {
    throw new Error('show() must be implemented by subclass');
  }

  /**
   * Hide the transition overlay
   * @param {HTMLElement} element - Overlay element
   * @returns {Promise<void>}
   */
  async hide(element) {
    throw new Error('hide() must be implemented by subclass');
  }

  /**
   * Restore transition state after page navigation
   * Not used in SPA context, but included for interface consistency
   * @returns {Promise<void>}
   */
  async restore() {
    throw new Error('restore() must be implemented by subclass');
  }
}
