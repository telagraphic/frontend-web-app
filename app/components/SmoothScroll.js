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
    this._isLocked = false;
    this._lockedScrollY = 0;
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
   * Lock scrolling (idempotent)
   * - Stops Lenis
   * - Freezes native scroll via fixed body positioning
   */
  lock() {
    if (this._isLocked) return;

    this._isLocked = true;
    this._lockedScrollY = window.scrollY || 0;

    // Stop Lenis so it doesn't try to animate while locked
    this.lenis?.stop?.();

    const body = document.body;
    const html = document.documentElement;

    // Freeze scroll position
    body.style.position = "fixed";
    body.style.top = `-${this._lockedScrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";

    // Hardening: prevent smooth scroll behavior from interfering with unlock resets
    html.style.scrollBehavior = "auto";
  }

  /**
   * Unlock scrolling (idempotent)
   */
  unlock() {
    if (!this._isLocked) return;

    const body = document.body;
    const html = document.documentElement;

    // Clear mutated inline styles (we don't attempt to preserve prior inline values)
    body.style.position = "";
    body.style.top = "";
    body.style.left = "";
    body.style.right = "";
    body.style.width = "";
    html.style.scrollBehavior = "";
    this._isLocked = false;

    // Resume Lenis after position is restored
    this.lenis?.start?.();
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