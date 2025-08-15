export default class Page {
  constructor({ id, element, elements }) {
    this.selector = element;
    this.selectorChildren = { ...elements };
    this.id = id;
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

  show() {
    this.element.classList.add("is-visible");
  }

  hide() {
    this.element.classList.remove("is-visible");
  }
}
