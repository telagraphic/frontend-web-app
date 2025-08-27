import { gsap } from "gsap";
import { $, $$, setupHelpers } from "../utils/Helpers.js";
// Fix with web pack or vite
// import { normalizeWheel } from "../../node_modules/normalize-wheel-es/index.d.ts";

export class SmoothScroll {
  constructor({ container, wrapper }) {
    this.container = container;
    this.wrapper = wrapper;
    this.scroll = {
      current: 0,
      target: 0,
      limit: 0,
    };
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
     * scroll.target is updated on every mousewheel event
     * interpolate calculates the next value for scroll.current
     */
    this.scroll.current = gsap.utils.interpolate(
      this.scroll.current,
      this.scroll.target,
      0.1,
    );

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
      this.wrapper.style.transform = `translateY(-${this.scroll.current}px)`;
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
