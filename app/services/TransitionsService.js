import { whenDOMReady } from "../utilities/AsyncHelpers.js";
import { $ } from "../utilities/DOMHelpers.js";
import { SELECTORS, TRANSITION_TYPES } from "../utilities/Constants.js";
import { GenericPageTransitions } from "../transitions/GenericPageTransitions.js";
import { CustomPageTransitions } from "../transitions/CustomPageTransitions.js";

/**
 * TransitionsService class for managing page transitions
 * 
 * Acts as a strategy coordinator that selects and delegates to the appropriate
 * transition strategy (generic or custom) based on project configuration.
 * 
 * Responsibilities:
 * - Strategy selection and initialization
 * - Delegating transition operations to the selected strategy
 * - Managing the transition overlay element
 */
export class TransitionsService {
  /**
   * Creates a new TransitionsService instance
   * @param {Object} options - Configuration options
   * @param {import("../config/SiteConfig.js").SiteConfig} options.siteConfig - Site configuration containing route and transition data
   * @param {string} [options.transitionType] - Transition type: 'generic' or 'custom' (defaults to 'custom')
   */
  constructor({ siteConfig, transitionType = TRANSITION_TYPES.CUSTOM }) {
    this.siteConfig = siteConfig;
    this.transitionType = transitionType;
    this.overlayElement = null;
    this.transitionStrategy = null;
    // * Note: Don't call init() here - let App call it when DOM is ready
  }

  /**
   * Create transition strategy instance based on transitionType
   * @param {string} type - Transition type ('generic' or 'custom')
   * @returns {BaseTransitionStrategy} Strategy instance
   * @private
   */
  createTransitionStrategy(type) {
    const options = {
      siteConfig: this.siteConfig,
      overlayElement: this.overlayElement,
    };

    switch (type) {
      case TRANSITION_TYPES.GENERIC:
        return new GenericPageTransitions(options);
      case TRANSITION_TYPES.CUSTOM:
        return new CustomPageTransitions(options);
      default:
        throw new Error(`Unknown transition type: ${type}`);
    }
  }

  /**
   * Initialize TransitionsManager - call this when DOM is ready
   * Sets up the overlay element and initializes the selected transition strategy
   * @returns {Promise<void>} Resolves when initialization is complete
   * @example
   * const transitionsManager = new TransitionsManager({ siteConfig, transitionType: 'custom' });
   * await transitionsManager.init();
   */
  async init() {
    return new Promise((resolve) => {
      whenDOMReady(() => {
        this.overlayElement = $(SELECTORS.TRANSITION_OVERLAY);
        
        // Create and initialize the selected strategy
        this.transitionStrategy = this.createTransitionStrategy(this.transitionType);
        
        // Initialize strategy-specific setup (e.g., templates for custom transitions)
        if (this.transitionStrategy.init) {
          this.transitionStrategy.init().then(() => resolve());
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Prepare transition for a route
   * Delegates to the selected transition strategy
   * @param {string} route - Route key from SiteConfig
   * @returns {Promise<void>}
   */
  async updateTransitionOverlay(route) {
    if (!this.transitionStrategy) {
      console.warn('TransitionsManager not initialized. Call init() first.');
      return;
    }
    return this.transitionStrategy.prepare(route);
  }

  /**
   * Show the transition overlay
   * Delegates to the selected transition strategy
   * @param {HTMLElement} [element] - Overlay element (defaults to this.overlayElement)
   * @returns {Promise<void>}
   */
  showPageTransition(element = this.overlayElement) {
    if (!this.transitionStrategy) {
      console.warn('TransitionsManager not initialized. Call init() first.');
      return Promise.resolve();
    }
    return this.transitionStrategy.show(element);
  }

  /**
   * Hide the transition overlay
   * Delegates to the selected transition strategy
   * @param {HTMLElement} [element] - Overlay element (defaults to this.overlayElement)
   * @returns {Promise<void>}
   */
  hidePageTransition(element = this.overlayElement) {
    if (!this.transitionStrategy) {
      console.warn('TransitionsManager not initialized. Call init() first.');
      return Promise.resolve();
    }
    return this.transitionStrategy.hide(element);
  }
}
