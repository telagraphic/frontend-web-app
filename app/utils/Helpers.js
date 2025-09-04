export const $ = (element) => document.querySelector(element);
export const $$ = (elements) => document.querySelectorAll(elements);

// Helper function to add methods to HTMLElement prototype
export function setupElementPrototype() {
  HTMLElement.prototype.on = function (event, callback, options) {
    return this.addEventListener(event, callback, options);
  };

  HTMLElement.prototype.off = function (event, callback) {
    return this.removeEventListener(event, callback);
  };

  HTMLElement.prototype.$ = function (selector) {
    return this.querySelector(selector);
  };

  HTMLElement.prototype.$$ = function (selector) {
    return this.querySelectorAll(selector);
  };
}

// Main function to setup all helpers
export function setupHelpers() {
  setupElementPrototype();
  // Add other helper setup functions here as needed
}
