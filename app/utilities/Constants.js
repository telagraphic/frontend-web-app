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
  MAIN: "main",
  MAIN_WITH_TEMPLATE: "main[data-template]",
  BODY: "body",

  // Preloader
  PRELOADER: ".preloader",
  PRELOADER_TITLE: ".preloader h1",
  PRELOADER_COUNTER: ".preloader-counter",
  PRELOADER_COPY: ".preloader-transition-copy h1",
  PRELOADER_COPY_CONTAINER: ".preloader-transition-copy",
  PRELOADER_IMAGE: "img[data-src].preloader-transition-image__img",

  // Page transitions
  TRANSITION_OVERLAY: ".page-transition-overlay",
  TRANSITION_TEMPLATES: "#page-transition-overlay-templates",
  TRANSITION_COPY: ".page-transition-overlay__copy",
  TRANSITION_IMAGE: ".page-transition-overlay__image",


  // Footnotes
  FOOTNOTES: "ul.footnotes li",
  SUPERSCRIPT_LINKS: ".page-content a.footnote-superscript-link",
  SUPERSCRIPT_LINK: "a.footnote-superscript-link",
  FOOTNOTE_LINK: "a.footnote-link",


  // Navigation
  NAV: "nav",
  NAV_LINKS: "nav a",
  LINK: ".link",
  INTERNAL_LINK: "a.internal-link",
  NAV_TOGGLE: ".navigation__toggle",
  NAV_TITLE: ".navigation__title",

  // Page content
  PAGE_CONTENT: "section.page-template",

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
  DATA_TEMPLATE: "data-template",
  DATA_PAGE: "data-page",
  DATA_SRC: "data-src",
  DATA_BACKGROUND: "data-background",
  DATA_COLOR: "data-color",
  DATA_ID: "data-id",
  DATA_ANIMATION: "data-animation",
  DATA_NAVIGATION_STATUS: "data-navigation-status",

  // Standard attributes
  HREF: "href",
  SRC: "src",
  CLASS: "class",
  ID: "id",
  TARGET: "target",
  TABINDEX: "tabindex",
});

/**
 * Event names
 */
export const EVENTS = Object.freeze({
  // Custom events
  PRELOADER_COMPLETE: "preloader-complete",
  HARD_REFRESH: "hard-refresh",
  
  // DOM events
  CLICK: "click",
  POPSTATE: "popstate",
  RESIZE: "resize",
  DOM_CONTENT_LOADED: "DOMContentLoaded",
  LOAD: "load",
  ERROR: "error",
});

/**
 * Common values and options
 */
export const VALUES = Object.freeze({
  TABINDEX_DISABLED: "-1",
  TARGET_BLANK: "_blank",
  NAV_SCROLL_THRESHOLD: 30,
  NAV_TIMEOUT: 500,
});

/**
 * Background image URLs
 */
export const BACKGROUND_IMAGES = Object.freeze({
  PRELOADER_COPY: "https://shea-memorandum-site.b-cdn.net/images/fbi-report-dancing-israelis-3.jpg",
});

/**
 * SessionStorage keys
 */
export const STORAGE_KEYS = Object.freeze({
  PAGE_TRANSITION: 'isPageNavigation',
  PRELOADER_SHOWN: 'preloaderShown',
  PAGE_TRANSITION_IMAGE: 'pageTransitionImage',
});

/**
 * Navigation status values
 */
export const NAVIGATION_STATUS = Object.freeze({
  ACTIVE: 'active',
  NOT_ACTIVE: 'not-active',
});

/**
 * Blocked link prefixes
 * Links starting with these prefixes should not trigger page transitions
 */
export const BLOCKED_LINK_PREFIXES = Object.freeze([
  'http',
  'mailto:',
  'tel:',
]);

/**
 * Transition types
 * Defines available transition strategy types
 */
export const TRANSITION_TYPES = Object.freeze({
  GENERIC: 'generic',
  CUSTOM: 'custom',
});