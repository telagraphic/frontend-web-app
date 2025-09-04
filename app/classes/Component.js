import { $, $$, setupHelpers } from "../utils/Helpers.js";

export default class Component extends EventTarget {
  constructor({ element, elements }) {
    super();
    this.selector = element;
    this.selectorChildren = { ...elements };
    this.eventTarget = new EventTarget();
    setupHelpers();
    this.create();
    this.setupEventListeners();
  }

  /**
   * Create a page object of elements
   * Takes in a CSS selector or an HTMLElement
   */
  create() {
    /**
     * Handle both selector strings and actual DOM elements
     */
    if (this.selector instanceof window.HTMLElement) {
      // If selector is already a DOM element, use it directly
      this.element = this.selector;
    } else if (typeof this.selector === "string") {
      // If selector is a string, query for the element
      this.element = $(this.selector);
    } else {
      // Fallback for other cases
      this.element = null;
    }

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
