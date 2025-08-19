import { Animations } from "./Animations.js";
// import { prefixMemozied } from "../../node_modules/prefix/index.js";
import { gsap } from "../../node_modules/gsap/index.js";

export default class Page {
  constructor({ id, element, elements, transitionOverlay }) {
    this.selector = element;
    this.selectorChildren = { ...elements };
    this.id = id;
    this.transitionOverlay =
      transitionOverlay || document.querySelector(".transition-overlay");
    this.animations = new Animations();

    this.scroll = {
      current: 0,
      target: 0,
      last: 0,
      limit: 0,
    };
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
    this.addEventListeners();
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

  onMouseWheel(event) {
    const { deltaY } = event;
    console.log(deltaY);
    this.scroll.target += deltaY;
  }

  onResize() {
    console.log("resize");
    this.scroll.limit = this.elements.wrapper.clientHeight - window.innerHeight;
  }

  updateRAF() {
    this.scroll.current = gsap.utils.interpolate(
      this.scroll.target,
      this.scroll.current,
      0.1,
    );

    if (this.scroll.current < 0.01) {
      this.scroll.current = 0;
    }

    this.scroll.current = gsap.utils.clamp(
      0,
      this.scroll.limit,
      this.scroll.target,
    );
    this.elements.wrapper.style.transform = `translateY(-${this.scroll.current}px)`;
  }

  addEventListeners() {
    window.addEventListener("mousewheel", this.onMouseWheel.bind(this));
  }
  removeEventListeners() {
    window.removeEventListener("mousewheel", this.onMouseWheel.bind(this));
  }
}
