import { EVENTS } from "./Constants.js";

/**
 * Uses the double requestAnimationFrame to ensure the DOM is ready by forcing the browser to run the rendering cycle (layout, styles, and paint)
 * The first RaF will run the rendering cycle (layout, styles, and paint) and the second RaF will run the next cycle to ensure the DOM is ready
 * Useful for ensuring CSS transitions are complete before running code that depends on the DOM being ready
 * @returns
 */
export function nextPaint() {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    });
  });
}

/**
 * Waits for the DOM to be ready and then executes the callback
 * @param {Function} callback - The callback to execute when the DOM is ready
 * @returns {void}
 */
export function whenDOMReady(callback) {
  if (document.readyState === "loading") {
    // DOM not ready yet, wait for DOMContentLoaded
    document.addEventListener(EVENTS.DOM_CONTENT_LOADED, callback);
  } else {
    // DOM already loaded (hard refresh), execute immediately
    callback();
  } 
}