/**
 * Constants for the application
 * Prevent the use of "magic strings" by providing a single source of truth for all selectors, attributes, events, and other constants used across the app
 * Wrap objects in Object.freeze() to prevent mutation outside of this class
 *
 * Problems with "magic strings":
 * - Typos not caught until runtime
 * - Hard to refactor (change selector? search entire codebase!)
 * - No single source of truth
 * - Easy to miss when updating
 */

/**
 * CSS selectors
 */
export const SELECTORS = Object.freeze({
  // Main structure
  MAIN: "main[data-route]",

  // Preloader
  PRELOADER: ".preloader",
  PRELOADER_TITLE: ".preloader-transition-title",
  PRELOADER_COUNTER: ".preloader-counter",
  PRELOADER_COPY: ".preloader-transition-copy h1",
  PRELOADER_COPY_CONTAINER: ".preloader-transition-copy",
  PRELOADER_IMAGE: "img[data-src].preloader-transition-image__img",

  // Page transitions
  TRANSITION_HOST: "[data-transition-host]",

  // Navigation
  NAV: "[data-navigation]",
  NAV_LINKS: "[data-navigation] a",
  INTERNAL_LINK: "a.internal-link",
  NAV_TOGGLE: "[data-navigation-toggle]",
  NAV_PANEL: "[data-navigation-panel]",
  NAV_TITLE: ".navigation__title",

  // Images
  LAZY_IMAGES: "img[data-src]",

  // Animations
  ANIMATIONS_ATTRIBUTE: "[data-animation]",
  TITLE_ANIMATIONS: '[data-animation="title"]',

  // HTML elements
  TEMPLATE: "template",
  IMG: "img",
});

/**
 * HTML attribute names
 */
export const ATTRIBUTES = Object.freeze({
  // Data attributes
  DATA_ROUTE: "data-route",
  DATA_SRC: "data-src",
  DATA_BACKGROUND: "data-background",
  DATA_COLOR: "data-color",
  DATA_ID: "data-id",
  DATA_ANIMATION: "data-animation",
  DATA_PRELOAD: "data-preload",

  // Standard attributes
  HREF: "href",
  TARGET: "target",
  TABINDEX: "tabindex",
});

/**
 * Event names
 */
export const EVENTS = Object.freeze({
  // Custom events
  PRELOADER_COMPLETE: "preloader-complete",
  NAVIGATION_START: "navigationstart",
  NAVIGATION_END: "navigationend",
  TRANSITION_START: "transitionstart",
  TRANSITION_COVERED: "transitioncovered",
  TRANSITION_END: "transitionend",

  // DOM events
  CLICK: "click",
  POPSTATE: "popstate",
  RESIZE: "resize",
  DOM_CONTENT_LOADED: "DOMContentLoaded",
});

/**
 * Common values and options
 */
export const VALUES = Object.freeze({
  TABINDEX_DISABLED: "-1",
  TARGET_BLANK: "_blank",
  NAV_SCROLL_THRESHOLD: 30,
  ROUTER_TIMEOUT: 1000,
  NAV_TIMEOUT: 500,
  PREFETCH_HOVER_DELAY_MS: 100,
});
