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
    this.isMobile = window.innerWidth < 768;
    this.isLocked = false;
    // See https://github.com/darkroomengineering/lenis?tab=readme-ov-file#settings
    this.lenisSettings = {
      duration: this.isMobile ? 1 : 1.2, // The duration of scroll animation (in seconds). Useless if lerp defined.
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // The easing function applied to scroll animation.
      gestureDirection: "vertical",
      smooth: true,
      smoothWheel: true, // Smooth the scroll initiated by wheel events.
      touchMultiplier: this.isMobile ? 1.5 : 2, //The multiplier to use for touch events.
      infinite: false, // Enable infinite scrolling! syncTouch: true is required on touch devices 
      lerp: this.isMobile ? 0.05 : 0.1, // Linear interpolation (lerp) intensity (between 0 and 1).
      wheelMultiplier: 1, // The multiplier to use for mouse wheel events.
      orientation: "vertical", // The orientation of the scrolling. Can be vertical or horizontal.
      smoothWheel: true, // Smooth the scroll initiated by wheel events.
      syncTouch: true, // Mimic touch device scroll while allowing scroll sync (can be unstable on iOS<16).
    };
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
   * Toggle scroll locking (used during page transitions).
   * Stops/starts Lenis and locks/unlocks native scrolling styles.
   *
   * @param {boolean} shouldLock
   */
  toggleScrollLock(shouldLock) {
    if (shouldLock === this.isLocked) return;

    const html = document.documentElement;
    const body = document.body;

    if (shouldLock) {
      this.stop();
      html.style.overflow = "hidden";
      body.style.overflow = "hidden";

      this.isLocked = true;
      return;
    }

    html.style.overflow = "";
    body.style.overflow = "";

    this.start();

    this.isLocked = false;
  }

  lock() {
    this.toggleScrollLock(true);
  }

  unlock() {
    this.toggleScrollLock(false);
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
      this.resizeHandler,
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
        this.resizeHandler,
      );
      this.resizeHandler = null;
    }
  }
}
