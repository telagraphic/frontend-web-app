import { BaseTransitionStrategy } from './BaseTransitionStrategy.js';
import { FadeInOutAnimation } from '../animations/FadeInOutAnimation.js';

/**
 * Generic page transition strategy
 * 
 * Simple fade in/out with overlay - no images, no complex logic.
 * Suitable for projects that want minimal, fast transitions.
 * 
 * This strategy provides a lightweight alternative to custom image-based
 * transitions, using only opacity animations on the overlay element.
 */
export class GenericPageTransitions extends BaseTransitionStrategy {
  constructor(options) {
    super(options);
    this.pageTransition = new FadeInOutAnimation();
  }

  /**
   * Prepare transition - no-op for generic transitions
   * Generic transitions don't need preloading or data setup
   * @param {string} route - Route key (unused for generic transitions)
   * @returns {Promise<void>}
   */
  async prepare(route) {
    // No preparation needed for generic transitions
    return Promise.resolve();
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
   * Restore transition state - no-op for generic transitions
   * Generic transitions don't need state restoration
   * @returns {Promise<void>}
   */
  async restore() {
    // No restoration needed for generic transitions
    return Promise.resolve();
  }
}
