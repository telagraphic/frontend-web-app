import { createError, ERROR_CODES } from "./ErrorRegistry.js";

/**
 * EventManager - Centralized event lifecycle management for events
 * Tracks and manages event listeners for safe cleanup
 */
export class EventManager {
  constructor() {
    this.eventTarget = new EventTarget();
    this.eventHandlers = new Map();
  }

  /**
   * Emit an event with the given type and detail
   * @param {string} type - The event type
   * @param {any} detail - The detail of the event
   * @returns {void}
   */
  emit(type, detail) {
    this.eventTarget.dispatchEvent(new CustomEvent(type, { detail }));
  }

  /**
   * Add an event listener for the given event type
   * @param {string} type - The event type
   * @param {Function} callback - The event handler function
   * @returns {void}
   */
  on(type, callback) {
    const handler = (event) => callback(event.detail);
    this.eventTarget.addEventListener(type, handler);
    this.registerEvent(type, handler, this.eventTarget);
  }

  /**
   * Register an event handler for tracking
   * @param {string} type - The event type
   * @param {Function} handler - The event handler function
   * @param {EventTarget} target - The event target (default: this.eventTarget)
   */
  registerEvent(type, handler, target = this.eventTarget) {
    if (!this.eventHandlers.has(type)) {
      this.eventHandlers.set(type, []);
    }
    this.eventHandlers.get(type).push({ handler, target });
  }

  /**
   * Remove event listeners
   * @param {string} [type] - Optional event type. If provided, removes only that type.
   */
  removeAllListeners(type) {
    if (type) {
      const handlers = this.eventHandlers.get(type) || [];
      handlers.forEach(({ handler, target }) => {
        target.removeEventListener(type, handler);
      });
      this.eventHandlers.delete(type);
    } else {
      this.eventHandlers.forEach((handlers, eventType) => {
        handlers.forEach(({ handler, target }) => {
          target.removeEventListener(eventType, handler);
        });
      });
      this.eventHandlers.clear();
    }
  }

  /**
   * Get the internal EventTarget instance
   */
  getEventTarget() {
    return this.eventTarget;
  }

  /**
   * Add a DOM event listener and automatically register it for cleanup
   * Use this instead of addEventListener + registerEvent
   * @param {EventTarget} target - The event target (element, window, document, etc.)
   * @param {string} type - The event type
   * @param {Function} handler - The event handler function
   * @param {Object} options - Optional addEventListener options
   */
  addListenerAndRegister(target, type, handler, options) {
    // Support both native addEventListener and element prototype .on()
    if (typeof target.addEventListener === "function") {
      target.addEventListener(type, handler, options);
    } else if (typeof target.on === "function") {
      target.on(type, handler, options);
    } else {
      throw createError(ERROR_CODES.VALIDATION_ERROR, { message: 'Target must support addEventListener or .on()' });
    }

    // Automatically register for cleanup
    this.registerEvent(type, handler, target);
  }

  /**
   * Remove a specific DOM event listener
   * @param {EventTarget} target - The event target
   * @param {string} type - The event type
   * @param {Function} handler - The event handler function
   */
  removeListenerAndDeregister(target, type, handler) {
    // Remove from DOM
    if (typeof target.removeEventListener === "function") {
      target.removeEventListener(type, handler);
    } else if (typeof target.off === "function") {
      target.off(type, handler);
    }

    // ✅ Remove from tracking (specific handler only)
    this.removeHandler(type, handler, target);
  }

  /**
   * Remove a specific event handler from tracking
   * @param {string} type - The event type
   * @param {Function} handler - The specific handler to remove
   * @param {EventTarget} target - The event target
   */
  removeHandler(type, handler, target) {
    const handlers = this.eventHandlers.get(type) || [];
    const index = handlers.findIndex(
      (h) => h.handler === handler && h.target === target
    );

    if (index > -1) {
      handlers.splice(index, 1);
      if (handlers.length === 0) {
        this.eventHandlers.delete(type);
      }
    }
  }
}
