/**
 * Query selector - works on document or element
 * @param {string} selector - CSS selector
 * @param {HTMLElement|Document} [context=document] - Context element to query within
 * @returns {HTMLElement|null}
 */
export function $(selector, context = document) {
  if (!selector) return null;
  return context.querySelector(selector);
}

/**
 * Query selector all - works on document or element
 * @param {string} selector - CSS selector
 * @param {HTMLElement|Document} [context=document] - Context element to query within
 * @returns {NodeList}
 */
export function $$(selector, context = document) {
  if (!selector) return document.createDocumentFragment().querySelectorAll(""); // Empty NodeList
  return context.querySelectorAll(selector);
}

/**
 * Add event listener
 * @param {EventTarget} element - Element to attach listener to
 * @param {string} event - Event name
 * @param {Function} callback - Event handler
 * @param {Object|boolean} [options] - Event listener options
 */
export function on(element, event, callback, options) {
  if (!element || !event || !callback) return;
  element.addEventListener(event, callback, options);
}

/**
 * Remove event listener
 * @param {EventTarget} element - Element to remove listener from
 * @param {string} event - Event name
 * @param {Function} callback - Event handler
 */
export function off(element, event, callback) {
  if (!element || !event || !callback) return;
  element.removeEventListener(event, callback);
}

/**
 * Returns a page object of elements for Page.js class
 * @param {Object} selectorChildren - An object of selector strings or DOM elements
 * @returns {Object} A page object of elements
 */

export const createPageObjectFromSelectors = (selectorChildren) => {
  const elements = {};

  for (const [key, selector] of Object.entries(selectorChildren)) {
    // Handle pre-selected elements (HTMLElement, NodeList, or Array)
    if (
      selector instanceof window.HTMLElement ||
      selector instanceof window.NodeList ||
      Array.isArray(selector)
    ) {
      elements[key] = selector;
      return;
    }

    // Handle selector strings
    const selectedElements = $$(selector);
    if (selectedElements.length === 0) {
      elements[key] = null;
    } else if (selectedElements.length === 1) {
      elements[key] = $(selector);
    } else {
      elements[key] = Array.from(selectedElements);
    }
  }

  return elements;
};

/**
 * Returns a page object of elements for the Component.js class
 * @param {Object} selectorChildren - An object of selector strings or DOM elements
 * @returns {Object} A component object of elements
 */

export const createComponentPageObjectFromSelectors = (selector, selectorChildren) => {
  let element = null;
  let elements = {};

  // In PageObject.js, add null checks:
  if (selector === null || selector === undefined) {
    return { element: null, elements: {} };
  }

  /**
   * Handle both selector strings and actual DOM elements
   */
  if (selector instanceof window.HTMLElement) {
    // If selector is already a DOM element, use it directly
    element = selector;
  } else if (typeof selector === "string") {
    // If selector is a string, query for the element
    element = $(selector);
  } else {
    // Fallback for other cases
    element = null;
  }

  for (const [key, selector] of Object.entries(selectorChildren)) {
    // Handle pre-selected elements (HTMLElement, NodeList, or Array)
    if (
      selector instanceof window.HTMLElement ||
      selector instanceof window.NodeList ||
      Array.isArray(selector)
    ) {
      elements[key] = selector;
      return;
    }

    // Handle selector strings
    const selectedElements = $$(selector);
    if (selectedElements.length === 0) {
      elements[key] = null;
    } else if (selectedElements.length === 1) {
      elements[key] = $(selector);
    } else {
      elements[key] = Array.from(selectedElements);
    }
  }

  return { element, elements };
};