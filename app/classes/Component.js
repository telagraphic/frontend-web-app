export default class Component extends EventTarget {
  constructor({ element, elements, transitionOverlay }) {
    super();
    this.selector = element;
    this.selectorChildren = { ...elements };
    this.eventTarget = new EventTarget();
    this.create();
    this.setupEventListeners();
  }

  /**
   * Creates an object based mapping for page elements
   * Changing the markup structure might break the first two elements
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
  }

  emit(type, detail) {
    this.eventTarget.dispatchEvent(new CustomEvent(type, { detail }));
  }

  on(type, callback) {
    this.eventTarget.addEventListener(type, (event) => callback(event.detail));
  }

  async setupEventListeners() {}

  async removeEventListeners() {}
}
