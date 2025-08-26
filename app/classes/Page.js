import { SmoothScroll } from "./SmoothScroll.js";
import { Animation } from "./Animation.js";
import Titles from "../animation/Titles.js";
import AsyncLoad from "./AsyncLoad.js";
import { BackgroundColors } from "./Colors.js";

export default class Page {
  constructor({ id, element, elements, transitionOverlay }) {
    this.selector = element;
    this.selectorChildren = {
      ...elements,
      titleAnimations: '[data-animation="title"]',
    };
    this.id = id;
    this.transitionOverlay =
      transitionOverlay || document.querySelector(".transition-overlay");
    // this.animations = new Animations("[data-template]", this.selectorChildren);
    this.animation = new Animation();
    this.preloadImagesSelector = "img[data-src]";
  }

  /**
   * Create a page object of elements
   * Initalize any other components for the page
   */
  async create() {
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

    // Wait for smooth scroll to be fully initialized
    // await this.preloadImages();
    await this.setupSmoothScroll();
    this.createAnimations();
  }

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
    /**
     * Execute a CSS Animation Keyframe
     * @param {*} element
     */
    const animationCallback = (element) => {
      element.classList.add("show-element");
      element.classList.remove("hide-element");
    };

    
    // await this.animations.onCSSAnimation(this.element, animationCallback);
    await this.animation.GSAPShowAnimation(this.element);
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
    // await this.animations.onCSSAnimation(this.element, callback);
    await this.animation.GSAPHideAnimation(this.element);
  }

  /**
   * Preload images for the page, need to fix when first page is /about or /gallery
   * @returns {Promise} Resolves when images are loaded
   */
  async preloadImages() {
    return new Promise((resolve) => {
      imageElements.forEach(async (element) => {
        this.asyncLoadedImages.push(new AsyncLoad(element));
      });

      // images at the bottom of the screen are loaded but don't add to the content height
      this.smoothScroll.onResize();
    });
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
          container: document.body,
          wrapper: document.querySelector("section.page-content"),
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
    this.smoothScroll.setupEventListeners();
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
