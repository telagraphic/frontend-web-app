import { gsap } from "gsap";
import { $, $$, setupHelpers } from "../utils/Helpers.js";
import { Easings } from "../utils/Easings.js";
// Fix with web pack or vite
// import { normalizeWheel } from "../../node_modules/normalize-wheel-es/index.d.ts";

export class SmoothScroll {
  constructor({ container, wrapper, easingType = "linear" }) {
    this.container = container;
    this.wrapper = wrapper;
    this.scroll = {
      current: 0,
      target: 0,
      limit: 0,
    };
    this.options = {
      momentum: 0.95,
      maxSpeed: 50,
    };

    // Initialize easing system
    this.easings = new Easings(easingType);
    this.easingType = easingType;

    setupHelpers();
  }

  /**
   * Sets up functionality for smooth scrolling
   */
  create() {
    if (!this.container.classList.contains("smooth-scroll-container")) {
      this.container.classList.add("smooth-scroll-container");
    }
    this.updateAnimationFrame();
    this.onResize();
  }

  /**
   * Call RAF for every frame and execute updateSmoothScroll for smooth scroll effect
   */
  updateAnimationFrame() {
    if (this.updateSmoothScroll) {
      this.updateSmoothScroll();
    }

    this.animationFrame = window.requestAnimationFrame(
      this.updateAnimationFrame.bind(this),
    );
  }

  /**
   * Captures the deltaY change of the mousewheel for the mousewheel event
   * @param {*} event
   */
  onMouseWheel(event) {
    const { deltaY } = event;
    this.scroll.target += deltaY;
  }

  /**
   * Removes extra white space at the bottom due to the position: fixed of the container element
   */
  onResize() {
    this.scroll.limit = this.wrapper.clientHeight - window.innerHeight;
  }

  /**
   * Updates the wrapper element with the scroll.current values for animating the scroll
   * This is called every frame via updateAnimationFrame and uses the updates from onMouseWheel to scroll
   * Uses interpolate and clamp for the lerp effect
   */
  updateSmoothScroll(event) {
    /**
     * Set different ease for touch devices
     */
    const isTouch = "ontouchstart" in window;
    const ease = isTouch ? 0.12 : 0.08;

    // Update easing parameters for touch devices
    this.easings.updateParams({ ease });

    /**
     * Apply the selected easing function
     */
    const easingFunction = this.easings.getCurrentEasingFunction();
    if (easingFunction) {
      if (this.easingType === "spring") {
        // Spring easing returns an object with current and velocity
        const result = easingFunction(this.scroll.current, this.scroll.target);
        this.scroll.current = result.current;
        this.easings.velocity = result.velocity;
      } else {
        // Other easing functions return the new current value
        this.scroll.current = easingFunction(
          this.scroll.current,
          this.scroll.target,
          this.options.maxSpeed,
        );
      }
    } else {
      // Fallback to linear if something goes wrong
      this.scroll.current = this.easings.linearEasing(
        this.scroll.current,
        this.scroll.target,
        this.options.maxSpeed,
      );
    }

    /**
     * Ensures scroll.current is not less than 0
     */
    if (this.scroll.current < 0.01) {
      this.scroll.current = 0;
    }

    /**
     * Ensures scroll.current does not add extra white space at the bottom of the page
     */
    this.scroll.current = gsap.utils.clamp(
      0,
      this.scroll.limit,
      this.scroll.current,
    );

    /**
     * Animates the wrapper element within the .smooth-scroll-container parent for smooth scroll effect
     */
    if (this.wrapper) {
      this.wrapper.style.transform = `translate3d(0, -${this.scroll.current}px, 0)`;
    }
  }

  /**
   * Setup event listeners for mousewheel and browser resize
   * Need to bound to the class via 'this' to ensure only one listener is attached and removed
   * Using window will create duplicate event listeners on page changes
   */
  setupEventListeners() {
    if (this.onMouseWheel) {
      this.onMouseWheelEvent = (event) => {
        this.onMouseWheel(event);
      };
      window.addEventListener("mousewheel", this.onMouseWheelEvent);
    }

    if (this.onResize) {
      this.onResizeEvent = this.onResize.bind(this);
      window.addEventListener("resize", this.onResizeEvent);
    }
  }

  /**
   * Remove event listeners for mousewheel and browser resize
   */
  removeEventListeners() {
    if (this.onMouseWheelEvent) {
      window.removeEventListener("mousewheel", this.onMouseWheelEvent);
    }

    if (this.onResizeEvent) {
      window.removeEventListener("resize", this.onResizeEvent);
    }
  }

  destroy() {
    this.wrapper.style.transform = "none";
    this.container.classList.remove("smooth-scroll-container");
  }
}
