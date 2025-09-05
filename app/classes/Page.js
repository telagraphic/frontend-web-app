import { SmoothScroll } from "./SmoothScroll.js";
import { Animation } from "./Animation.js";
import Titles from "../animation/Titles.js";
import { $, $$, setupHelpers } from "../utils/Helpers.js";

export default class Page {
  constructor({ id, element, elements, transitionOverlay }) {
    this.selector = element;
    this.selectorChildren = {
      titleAnimations: '[data-animation="title"]',
      ...elements,
    };
    this.id = id;
    this.transitionOverlay =
      transitionOverlay || document.querySelector(".transition-overlay");
    this.animation = new Animation();
    this.preloadImagesSelector = "img[data-src]";
    setupHelpers();
  }

  /**
   * Create a page object of elements
   * Initalize any other components for the page
   */
  async create({ isScrollSmooth = true }) {
    /**
     * Changing the markup structure might break the first two elements
     */
    this.element = $(this.selector);
    this.elements = {};

    Object.entries(this.selectorChildren).forEach(([key, selector]) => {
      // Handle pre-selected elements (HTMLElement, NodeList, or Array)
      if (
        selector instanceof window.HTMLElement ||
        selector instanceof window.NodeList ||
        Array.isArray(selector)
      ) {
        this.elements[key] = selector;
        return;
      }

      // Handle selector strings
      const elements = $$(selector);
      if (elements.length === 0) {
        this.elements[key] = null;
      } else if (elements.length === 1) {
        this.elements[key] = $(selector);
      } else {
        this.elements[key] = Array.from(elements);
      }
    });

    if (isScrollSmooth) {
      await this.setupSmoothScroll();
    }
    this.createAnimations();
  }

  /**
   * Remove page state to avoid memory leaks (duplicate animations on page return, etc...)
   * Acts like an automatic "event" for child classes
   */
  destroy() {}

  /**
   * Create the title animations the page
   */
  createAnimations() {
    this.animations = [];

    if (this.elements.titleAnimations) {
      this.titleAnimations = [];

      this.elements.titleAnimations.forEach((element) => {
        this.titleAnimations.push(new Titles(element));
      });
    }

    // Hold all animations in an array for future use
    if (this.titleAnimations?.length > 0) {
      this.animations.push(...this.titleAnimations);
    }
  }

  /**
   * Show the page
   */
  async show() {
    this.setupEventListeners();
    await this.animation.GSAPHideTransition(this.transitionOverlay);
  }

  /**
   * Hide the page
   */
  async hide() {
    this.removeEventListeners();
    this.destroy();
    await this.animation.GSAPShowTransition(this.transitionOverlay);
  }

  /**
   * Initalizes the smoothScroll object for the page
   * The wrapper needs to be called here to properly set Smooth Scroll on a hard refresh
   * @returns {Promise} Resolves when smooth scroll is fully initialized
   */
  setupSmoothScroll() {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.smoothScroll = new SmoothScroll({
          container: $("main"),
          wrapper: $("section.page-content"),
          easingType: "linear",
        });
        this.smoothScroll.create();
        this.smoothScroll.setupEventListeners();
        this.smoothScroll.isReady = true;

        resolve(); // Resolve when smooth scroll is ready
      }, 1000);
    });
  }

  /**
   * Setup page event listeners
   */
  setupEventListeners() {
    document.addEventListener("resize", () => {
      console.log("resize");
    });
  }

  /**
   * Remove page event listeners
   */
  removeEventListeners() {
    this.smoothScroll.removeEventListeners();
  }

  /**
   * Check if smooth scroll is ready
   * @returns {boolean} True if smooth scroll is initialized
   */
  isSmoothScrollReady() {
    return this.smoothScroll && this.smoothScroll.isReady;
  }
}