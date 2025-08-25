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
     * Handle both selector strings and actual DOM elements
     */
    if (this.selector instanceof window.HTMLElement) {
      // If selector is already a DOM element, use it directly
      this.element = this.selector;
    } else if (typeof this.selector === 'string') {
      // If selector is a string, query for the element
      this.element = document.querySelector(this.selector);
    } else {
      // Fallback for other cases
      this.element = null;
    }

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
