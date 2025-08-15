import { Animations } from "./Animations.js";

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
   */
  create() {
    this.element = document.querySelector(this.selector);
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

    console.log(this.elements);
  }

  async show() {
    const showOverlay = (element) => element.classList.remove("is-visible");
    await this.animations.runCSSTransition(this.transitionOverlay, showOverlay);
  }

  async hide() {
    const hideOverlay = (element) => element.classList.add("is-visible");
    await this.animations.runCSSTransition(this.transitionOverlay, hideOverlay);
  }
}
