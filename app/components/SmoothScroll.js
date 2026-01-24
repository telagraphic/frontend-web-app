import { EventManager } from "../utilities/EventManager.js";
/**
 * SmoothScroll class
 * @param {Object} options
 * @param {boolean} options.autoRaf
 * @param {number} options.duration
 * @returns {SmoothScroll}
 */

export class SmoothScroll {
  constructor(options = {}) {
    this.lenis = null;
    this.options = {
      autoRaf: options.autoRaf ?? true,
      duration: options.duration ?? 1,
    };
    this.resizeHandler = null;
    this.eventManager = new EventManager();
  }

  /**
   * Create the Lenis instance
   */
  create() {
    if (this.lenis) {
      this.lenis.destroy();
    }

    this.lenis = new Lenis({
      autoRaf: this.options.autoRaf,
      duration: this.options.duration,
    });

    // Setup resize listener when Lenis is created
    this.setupResizeListener();
  }

  /**
   * Destroy the Lenis instance
   */
  destroy() {
    // Remove resize listener when Lenis is destroyed
    this.removeResizeListener();

    if (this.lenis) {
      this.lenis.destroy();
      this.lenis = null;
    }
  }

  /**
   * Wrapper for Lenis.start()
   */
  start() {
    if (this.lenis) {
      this.lenis.start();
    }
  }

  /**
   * Wrapper for Lenis.stop()
   */
  stop() {
    if (this.lenis) {
      this.lenis.stop();
    }
  }

  /**
   * Check if the Lenis instance is enabled
   * @returns {boolean}
   */
  isEnabled() {
    return this.lenis ? true : false;
  }


  /**
   * Check if the Lenis instance is stopped
   * @returns {boolean}
   */
  isStopped() {
    return this.lenis ? this.lenis.isStopped : false;
  }


  /**
   * Get the Lenis instance
   * @returns {Lenis | null}
   */
  getInstance() {
    if (this.isEnabled()) {
      return this.lenis;
    }
    return null;
  }

  /**
   * Scroll to a target
   * @param {number} target
   * @param {Object} options
   */
  scrollTo(target, options) {
    if (this.lenis) {
      this.lenis.scrollTo(target, options);
    }
  }

  /**
   * Setup resize event listener (idempotent - safe to call multiple times)
   * The listener is bound to the instance so it can be properly removed
   */
  setupResizeListener() {
    // Only setup if not already set up and Lenis exists
    if (this.resizeHandler || !this.lenis) {
      return;
    }

    // Store the bound handler so we can remove it later
    this.resizeHandler = () => {
      if (this.lenis) {
        this.lenis.resize();
      }
    };

    this.eventManager.addListenerAndRegister(
      window,
      "resize",
      this.resizeHandler
    );
  }

  /**
   * Remove resize event listener
   */
  removeResizeListener() {
    if (this.resizeHandler) {
      this.eventManager.removeListenerAndDeregister(
        window,
        "resize",
        this.resizeHandler
      );
      this.resizeHandler = null;
    }
  }
}
