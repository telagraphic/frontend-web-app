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
   * Create a page object of elements
   */
  create() {
    /**
     * Changing the markup structure might break the first two elements
     */
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

  /**
   * Emit an event with the given type and detail
   */
  emit(type, detail) {
    this.eventTarget.dispatchEvent(new CustomEvent(type, { detail }));
  }

  /**
   * Add an event listener for the given event type
   */
  on(type, callback) {
    this.eventTarget.addEventListener(type, (event) => callback(event.detail));
  }

  async setupEventListeners() {}

  async removeEventListeners() {}
}
