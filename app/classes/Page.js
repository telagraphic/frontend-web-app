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
   * Creates an object based mapping for page elements
   * Changing the markup structure might break the first two elements
   */
  create() {
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

  async show() {
    // this.element.classList.remove("is-visible"); does not work for main.is-visible animation keyframes
    // const showOverlay = (element) => element.classList.remove("is-visible");
    // await this.animations.runCSSTransition(this.transitionOverlay, showOverlay);

    // Use keyframes, need to call a different animation function for each show/hide
    const callback = (element) => {
      element.classList.add("show-element");
      element.classList.remove("hide-element");
    };
    await this.animations.runCSSShowAnimation(this.element, callback);
  }

  async hide() {
    this.removeEventListeners();
    // const hideOverlay = (element) => element.classList.add("is-visible");
    // await this.animations.runCSSTransition(this.transitionOverlay, hideOverlay);
    const callback = (element) => {
      element.classList.remove("show-element");
      element.classList.add("hide-element");
    };
    await this.animations.runCSSHideAnimation(this.element, callback);
  }

  setupSmoothScroll() {
    this.smoothScroll = new SmoothScroll({
      container: document.body,
      wrapper: this.elements.wrapper,
    });
    this.smoothScroll.create();
    this.onResize();
    this.updateAnimationFrame();
    this.setupEventListeners();
  }

  /**
   * Resets the page wrapper element to match the actual content height
   */
  onResize() {
    this.smoothScroll.scroll.limit =
      this.elements.wrapper.clientHeight - window.innerHeight;
  }

  /**
   * Updates the animation frame for smooth scrolling
   */
  updateAnimationFrame() {
    if (this.smoothScroll && this.smoothScroll.updateAnimationFrame) {
      this.smoothScroll.updateAnimationFrame();
    }

    this.animationFrame = window.requestAnimationFrame(
      this.updateAnimationFrame.bind(this),
    );
  }

  setupEventListeners() {
    if (this.smoothScroll && this.smoothScroll.onMouseWheel) {
      this.onMouseWheelEvent = (event) => {
        this.smoothScroll.onMouseWheel(event);
      };
      window.addEventListener("mousewheel", this.onMouseWheelEvent);
    }

    if (this.onResize) {
      this.onResizeEvent = (event) => {
        this.onResize(event).bind(this);
      };
      window.addEventListener("resize", this.onResizeEvent);
    }
  }

  removeEventListeners() {
    if (this.onMouseWheelEvent) {
      window.removeEventListener("mousewheel", this.onMouseWheelEvent);
    }

    if (this.onResizeEvent) {
      console.log("onresizeevent removed");
      window.removeEventListener("resize", this.onResizeEvent);
    }
  }
}
