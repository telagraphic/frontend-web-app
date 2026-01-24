import { createComponentPageObjectFromSelectors } from "../utilities/DOMHelpers.js";
import { EventManager } from "../utilities/EventManager.js";

/**
 * Base class for all components
 * Inherits from EventTarget to allow for event handling
 *
 * @param {Object} options - Configuration options
 * @param {string} options.element - CSS selector for the component element
 * @param {Object} options.elements - Object containing CSS selectors for child elements
 * @returns {Component} A new Component instance
 */
export default class Component extends EventTarget {
  constructor({ element, elements }) {
    super();
    this.selector = element;
    this.selectorChildren = { ...elements };
    this.eventManager = new EventManager();
    this.eventTarget = this.eventManager.getEventTarget();
    this.element = null;
    this.elements = {};
  }

  /**
   * Create a page object of elements
   * Takes in a CSS selector or an HTMLElement
   * Call this method when DOM is ready (typically in subclass create() or setup() methods)
   */
  create() {
    const { element, elements } = createComponentPageObjectFromSelectors(
      this.selector,
      this.selectorChildren
    );
    this.element = element;
    this.elements = elements;
  }

  /**
   * Emit an event with the given type and detail
   */
  emit(type, detail) {
    this.eventManager.emit(type, detail);
  }

  /**
   * Add an event listener for the given event type
   */
  on(type, callback) {
    this.eventManager.on(type, callback);
  } 

  /**
   * Register an event handler for the given event type
   * @param {string} type - The event type
   * @param {Function} handler - The event handler function
   * @param {EventTarget} target - The event target to remove the listener from
   */
  registerEvent(type, handler, target) {
    this.eventManager.registerEvent(type, handler, target);
  }

  /**
   * Remove event listeners
   * @param {string} [type] - Optional event type. If provided, removes only that type. If omitted, removes all listeners.
   * Call this in destroy() to prevent memory leaks
   */
  removeAllListeners(type) {
    this.eventManager.removeAllListeners(type);
  }

  /**
   * Wrapper around EventManager.addListenerAndRegister
   * @param {EventTarget} target - The event target (element, window, document, etc.)
   * @param {string} type - The event type
   * @param {Function} handler - The event handler function
   * @param {Object} options - Optional addEventListener options
   */
  addListenerAndRegister(target, type, handler, options) {
    this.eventManager.addListenerAndRegister(target, type, handler, options);
  }

  /**
   * Wrapper around EventManager.removeListenerAndDeregister
   * @param {EventTarget} target - The event target (element, window, document, etc.)
   * @param {string} type - The event type
   * @param {Function} handler - The event handler function
   */
  removeListenerAndDeregister(target, type, handler) {
    this.eventManager.removeListenerAndDeregister(target, type, handler);
  }
}
