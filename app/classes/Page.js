import { Animations } from "./Animations.js";
import { SmoothScroll } from "./SmoothScroll.js";

export default class Page {
  constructor({ id, element, elements, transitionOverlay }) {
    this.selector = element;
    this.selectorChildren = { ...elements };
    this.id = id;
    this.transitionOverlay =
      transitionOverlay || document.querySelector(".transition-overlay");
    this.animations = new Animations();
  }

  /**
   * Create a page object of elements
   * Initalize any other components for the page
   */
  create() {
    /**
     * Changing the markup structure might break the first two elements
     */
    this.element = document.querySelector("[data-template]");
    this.elements = {};

    Object.entries(this.selectorChildren).forEach(([key, selector]) => {
      if (
        selector instanceof window.HTMLElement ||
        selector instanceof window.NodeList
      ) {
        this.elements[key] = selector;
      } else if (Array.isArray(selector)) {
        this.elements[key] = selector;
      } else {
        this.elements[key] = document.querySelectorAll(selector);
        if (this.elements[key].length === 0) {
          this.elements[key] = null;
        } else if (this.elements[key].length === 1) {
          this.elements[key] = document.querySelector(selector);
        }
      }
    });

    this.setupSmoothScroll();
  }

  /**
   * Show the page
   */
  async show() {
    /**
     * Execute a CSS Animation Keyframe
     * @param {*} element
     */
    const animationCallback = (element) => {
      element.classList.add("show-element");
      element.classList.remove("hide-element");
    };

    await this.animations.onCSSAnimation(this.element, animationCallback);
  }

  /**
   * Hide the page
   */
  async hide() {
    this.removeEventListeners();

    /**
     * Executes CSS Animation Keyframe
     * @param {*} element
     */
    const callback = (element) => {
      element.classList.remove("show-element");
      element.classList.add("hide-element");
    };
    await this.animations.onCSSAnimation(this.element, callback);
  }

  /**
   * Initalizes the smoothScroll object for the page
   */
  setupSmoothScroll() {
    this.smoothScroll = new SmoothScroll({
      container: document.body,
      wrapper: this.elements.wrapper,
    });
    this.smoothScroll.create();
    this.smoothScroll.setupEventListeners();
  }

  /**
   * Setup page event listeners
   */
  setupEventListeners() {
    this.smoothScroll.setupEventListeners();
  }

  /**
   * Remove page event listeners
   */
  removeEventListeners() {
    this.smoothScroll.removeEventListeners();
  }
}
