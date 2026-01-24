# DRY Utilities Guide: Centralizing Helpers, Constants, and Shared Behaviors

## What Are "Magic Strings"?

**Magic strings** are hardcoded string literals scattered throughout your code that represent:
- CSS selectors: `".page-transition-overlay"`
- HTML attributes: `"data-template"`
- Event names: `"preloader-complete"`
- CSS classes: `".preloader"`
- Data attributes: `"data-src"`

### The Problem

```js
// ❌ BAD: Magic strings scattered everywhere
document.querySelector(".page-transition-overlay");  // In Page.js
document.querySelector(".page-transition-overlay");  // In TransitionManager.js
document.querySelector(".preloader");                // In Page.js
this.preloader.on("preloader-complete", ...);        // In App.js
element.getAttribute("data-template");               // In Router.js
document.querySelectorAll("img[data-src]");          // In Preloader.js
document.querySelectorAll("nav a");                  // In Navigation.js

// Problems:
// - Typos not caught until runtime
// - Hard to refactor (change selector? search entire codebase!)
// - No single source of truth
// - Easy to miss when updating
```

### The Solution

```js
// ✅ GOOD: Centralized constants
import { SELECTORS, ATTRIBUTES, EVENTS } from './constants/dom.js';

document.querySelector(SELECTORS.TRANSITION_OVERLAY);
document.querySelector(SELECTORS.PRELOADER);
this.preloader.on(EVENTS.PRELOADER_COMPLETE, ...);
element.getAttribute(ATTRIBUTES.DATA_TEMPLATE);

// Benefits:
// - Single source of truth
// - Typos caught at import/compile time
// - Easy to refactor (change once)
// - IDE autocomplete
// - Self-documenting
```

---

## Structure Overview

```
app/
  utils/
    constants/
      selectors.js      # CSS selectors
      attributes.js     # HTML attributes
      events.js         # Event names
    helpers/
      dom.js            # DOM utilities (existing $, $$, etc.)
      timing.js         # Timing utilities (rAF, delays, etc.)
      images.js         # Image loading utilities
```

---

## 1. Constants: Selectors, Attributes, Events

### Selectors (CSS Classes/IDs)

```js
// utils/constants/selectors.js

/**
 * Centralized CSS selectors
 * Single source of truth for all selectors used across the app
 */
export const SELECTORS = {
  // Main structure
  MAIN: 'main',
  BODY: 'body',
  
  // Preloader
  PRELOADER: '.preloader',
  PRELOADER_TITLE: '.preloader h1',
  PRELOADER_COUNTER: '.preloader-counter',
  PRELOADER_COPY: '.preloader-transition-copy',
  PRELOADER_IMAGE: '.preloader-transition-image',
  
  // Page transitions
  TRANSITION_OVERLAY: '.page-transition-overlay',
  TRANSITION_TEMPLATES: '#page-transition-overlay-templates',
  TRANSITION_COPY: '.page-transition-overlay__copy',
  TRANSITION_IMAGE: '.page-transition-overlay__image',
  
  // Navigation
  NAV: 'nav',
  NAV_LINKS: 'nav a',
  LINK: '.link',
  
  // Page content
  PAGE_CONTENT: 'section.page-content',
  
  // Images
  LAZY_IMAGES: 'img[data-src]',
  
  // Animations
  TITLE_ANIMATIONS: '[data-animation="title"]',
  
  // Helper to create data attribute selector
  dataAnimation: (name) => `[data-animation="${name}"]`,
  dataTemplate: (template) => `[data-template="${template}"]`,
} as const;

// Type-safe exports for each category
export const PRELOADER_SELECTORS = {
  CONTAINER: SELECTORS.PRELOADER,
  TITLE: SELECTORS.PRELOADER_TITLE,
  COUNTER: SELECTORS.PRELOADER_COUNTER,
  COPY: SELECTORS.PRELOADER_COPY,
  IMAGE: SELECTORS.PRELOADER_IMAGE,
} as const;

export const TRANSITION_SELECTORS = {
  OVERLAY: SELECTORS.TRANSITION_OVERLAY,
  TEMPLATES: SELECTORS.TRANSITION_TEMPLATES,
  COPY: SELECTORS.TRANSITION_COPY,
  IMAGE: SELECTORS.TRANSITION_IMAGE,
} as const;
```

### Attributes (HTML Attributes)

```js
// utils/constants/attributes.js

/**
 * Centralized HTML attribute names
 */
export const ATTRIBUTES = {
  // Data attributes
  DATA_TEMPLATE: 'data-template',
  DATA_SRC: 'data-src',
  DATA_BACKGROUND: 'data-background',
  DATA_COLOR: 'data-color',
  DATA_ID: 'data-id',
  DATA_ANIMATION: 'data-animation',
  
  // Standard attributes
  HREF: 'href',
  SRC: 'src',
  CLASS: 'class',
  ID: 'id',
  TARGET: 'target',
  TABINDEX: 'tabindex',
} as const;

// Helper functions for common patterns
export const getDataAttribute = (element, name) => {
  return element?.getAttribute(`data-${name}`);
};

export const setDataAttribute = (element, name, value) => {
  element?.setAttribute(`data-${name}`, value);
};
```

### Events (Custom Event Names)

```js
// utils/constants/events.js

/**
 * Centralized event names
 * All custom events used throughout the application
 */
export const EVENTS = {
  // Preloader
  PRELOADER_COMPLETE: 'preloader-complete',
  
  // Navigation
  HARD_REFRESH: 'hard-refresh',
  PAGE_CHANGE: 'page-change',
  ROUTE_CHANGE: 'route-change',
  
  // Page lifecycle
  PAGE_CREATE: 'page-create',
  PAGE_SHOW: 'page-show',
  PAGE_HIDE: 'page-hide',
  PAGE_DESTROY: 'page-destroy',
  
  // Animations
  ANIMATION_START: 'animation-start',
  ANIMATION_COMPLETE: 'animation-complete',
  
  // Router
  ROUTE_LOAD_START: 'route-load-start',
  ROUTE_LOAD_COMPLETE: 'route-load-complete',
  ROUTE_LOAD_ERROR: 'route-load-error',
} as const;

// Helper to create custom event
export const createCustomEvent = (eventName, detail = {}) => {
  return new CustomEvent(eventName, { detail });
};

// Helper to dispatch event
export const dispatchEvent = (target, eventName, detail = {}) => {
  const event = createCustomEvent(eventName, detail);
  target.dispatchEvent(event);
  return event;
};
```

---

## 2. DOM Helpers (Extend Existing)

```js
// utils/helpers/dom.js

import { SELECTORS, ATTRIBUTES } from '../constants/selectors.js';
import { ATTRIBUTES as ATTRS } from '../constants/attributes.js';

/**
 * DOM query helpers (existing, but enhanced)
 */
export const $ = (selector) => document.querySelector(selector);
export const $$ = (selector) => document.querySelectorAll(selector);

/**
 * Query using constant selector
 */
export const $selector = (selectorKey) => {
  const selector = SELECTORS[selectorKey];
  if (!selector) {
    console.warn(`Selector not found: ${selectorKey}`);
    return null;
  }
  return $(selector);
};

export const $$selector = (selectorKey) => {
  const selector = SELECTORS[selectorKey];
  if (!selector) {
    console.warn(`Selector not found: ${selectorKey}`);
    return [];
  }
  return Array.from($$(selector));
};

/**
 * Get element by data-template attribute
 */
export const getElementByTemplate = (template) => {
  return $(SELECTORS.dataTemplate(template));
};

/**
 * Get template from element
 */
export const getTemplate = (element) => {
  return element?.getAttribute(ATTRS.DATA_TEMPLATE);
};

/**
 * Set template gently
 */
export const setTemplate = (element, template) => {
  element?.setAttribute(ATTRS.DATA_TEMPLATE, template);
};

/**
 * Safe class manipulation
 */
export const addClass = (element, className) => {
  element?.classList.add(className);
};

export const removeClass = (element, className) => {
  element?.classList.remove(className);
};

export const toggleClass = (element, className, force) => {
  element?.classList.toggle(className, force);
};

/**
 * Safe attribute manipulation
 */
export const getAttr = (element, attrName) => {
  return element?.getAttribute(attrName);
};

export const setAttr = (element, attrName, value) => {
  element?.setAttribute(attrName, value);
};

export const removeAttr = (element, attrName) => {
  element?.removeAttribute(attrName);
};

/**
 * Check if element exists and is visible
 */
export const isVisible = (element) => {
  return element && 
         element.offsetParent !== null && 
         window.getComputedStyle(element).display !== 'none';
};

/**
 * Wait for element to exist in DOM
 */
export const waitForElement = (selector, options = {}) => {
  const {
    timeout = 5000,
    interval = 100,
    root = document.body,
  } = options;
  
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const check = () => {
      const element = $(selector);
      
      if (element) {
        resolve(element);
        return;
      }
      
      if (Date.now() - startTime > timeout) {
        reject(new Error(`Element not found: ${selector}`));
        return;
      }
      
      setTimeout(check, interval);
    };
    
    check();
  });
};
```

---

## 3. Timing Helpers

```js
// utils/helpers/timing.js

/**
 * Timing utilities for DOM readiness, delays, etc.
 */

/**
 * Double requestAnimationFrame
 * Waits for next paint cycle after current frame
 * Ensures layout calculations are complete
 */
export const nextPaint = () => {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(resolve);
    });
  });
};

/**
 * Wait for DOM to be ready (double rAF)
 * Alias for nextPaint for clarity
 */
export const waitForDOMReady = () => nextPaint();

/**
 * Delay utility
 */
export const delay = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * Wait for next frame
 */
export const nextFrame = () => {
  return new Promise((resolve) => {
    requestAnimationFrame(resolve);
  });
};

/**
 * Wait for multiple conditions
 */
export const waitFor = async (conditions, options = {}) => {
  const {
    timeout = 5000,
    interval = 50,
  } = options;
  
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const results = await Promise.all(
      conditions.map(condition => 
        typeof condition === 'function' ? condition() : condition
      )
    );
    
    if (results.every(Boolean)) {
      return true;
    }
    
    await delay(interval);
  }
  
  return false;
};

/**
 * Debounce function calls
 */
export const debounce = (fn, ms) => {
  let timeoutId;
  return function debounced(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
};

/**
 * Throttle function calls
 */
export const throttle = (fn, ms) => {
  let lastCall = 0;
  return function throttled(...args) {
    const now = Date.now();
    if (now - lastCall >= ms) {
      lastCall = now;
      return fn.apply(this, args);
    }
  };
};

/**
 * Wait for images to load
 */
export const waitForImages = async (selector, options = {}) => {
  const {
    timeout = 10000,
    signal,
  } = options;
  
  const images = Array.from($$(selector || SELECTORS.LAZY_IMAGES));
  if (images.length === 0) return;
  
  const promises = images.map((img) => {
    if (signal?.aborted) return Promise.resolve();
    
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Image load timeout: ${img.src}`));
      }, timeout);
      
      signal?.addEventListener('abort', () => {
        clearTimeout(timeoutId);
        resolve(); // Resolve on abort
      }, { once: true });
      
      if (img.complete && img.naturalHeight !== 0) {
        clearTimeout(timeoutId);
        resolve(img);
        return;
      }
      
      img.onload = () => {
        clearTimeout(timeoutId);
        resolve(img);
      };
      
      img.onerror = () => {
        clearTimeout(timeoutId);
        resolve(img); // Resolve even on error
      };
    });
  });
  
  return Promise.all(promises);
};
```

---

## 4. Image Loading Utilities

```js
// utils/helpers/images.js

import { SELECTORS } from '../constants/selectors.js';
import { ATTRIBUTES } from '../constants/attributes.js';

/**
 * Image loading utilities
 * Centralized image preloading and lazy loading logic
 */

/**
 * Load a single image
 */
export const loadImage = async (src, options = {}) => {
  const {
    signal,
    timeout = 10000,
  } = options;
  
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      resolve(null);
      return;
    }
    
    const img = new Image();
    const timeoutId = setTimeout(() => {
      reject(new Error(`Image load timeout: ${src}`));
    }, timeout);
    
    signal?.addEventListener('abort', () => {
      clearTimeout(timeoutId);
      resolve(null);
    }, { once: true });
    
    img.onload = () => {
      clearTimeout(timeoutId);
      resolve(img);
    };
    
    img.onerror = (error) => {
      clearTimeout(timeoutId);
      resolve(null); // Resolve with null on error
    };
    
    img.src = src;
  });
};

/**
 * Preload images from data-src attributes
 */
export const preloadLazyImages = async (container = document, options = {}) => {
  const {
    selector = SELECTORS.LAZY_IMAGES,
    signal,
  } = options;
  
  const images = Array.from(container.querySelectorAll(selector));
  if (images.length === 0) return [];
  
  const promises = images.map(async (img) => {
    if (signal?.aborted) return null;
    
    const dataSrc = img.getAttribute(ATTRIBUTES.DATA_SRC);
    if (!dataSrc) return null;
    
    // Skip if already loaded
    if (img.src && img.complete) {
      return img;
    }
    
    // Load the image
    const loadedImg = await loadImage(dataSrc, { signal });
    
    if (loadedImg && !signal?.aborted) {
      img.src = dataSrc;
      img.removeAttribute(ATTRIBUTES.DATA_SRC);
    }
    
    return loadedImg;
  });
  
  return (await Promise.all(promises)).filter(Boolean);
};

/**
 * Preload multiple images by URL
 */
export const preloadImages = async (urls, options = {}) => {
  const { signal } = options;
  
  const promises = urls.map(url => loadImage(url, { signal }));
  return (await Promise.all(promises)).filter(Boolean);
};

/**
 * Check if image is loaded
 */
export const isImageLoaded = (img) => {
  return img && img.complete && img.naturalHeight !== 0;
};

/**
 * Get image dimensions
 */
export const getImageDimensions = (img) => {
  if (!isImageLoaded(img)) {
    return null;
  }
  
  return {
    width: img.naturalWidth,
    height: img.naturalHeight,
    aspectRatio: img.naturalWidth / img.naturalHeight,
  };
};

/**
 * Convert data-src to src for all lazy images
 */
export const revealLazyImages = (container = document) => {
  const images = Array.from(container.querySelectorAll(SELECTORS.LAZY_IMAGES));
  
  images.forEach((img) => {
    const dataSrc = img.getAttribute(ATTRIBUTES.DATA_SRC);
    if (dataSrc) {
      img.src = dataSrc;
      img.removeAttribute(ATTRIBUTES.DATA_SRC);
    }
  });
};
```

---

## 5. Usage Examples

### Before (Magic Strings)

```js
// ❌ Page.js
this.transitionOverlay = document.querySelector(".page-transition-overlay");
this.preloader = document.querySelector(".preloader");
const template = element.getAttribute("data-template");

// ❌ Router.js
this.template = pageContent.getAttribute("data-template");
const images = document.querySelectorAll("img[data-src]");

// ❌ App.js
this.preloader.on("preloader-complete", handler);
window.dispatchEvent(new CustomEvent("hard-refresh", { detail: { route } }));

// ❌ Preloader.js
const images = Array.from(document.querySelectorAll("img[data-src]"));
const dataSrc = element.getAttribute("data-src");
```

### After (Centralized Constants)

```js
// ✅ Page.js
import { $selector } from '../utils/helpers/dom.js';
import { SELECTORS } from '../utils/constants/selectors.js';
import { getTemplate } from '../utils/helpers/dom.js';

this.transitionOverlay = $selector('TRANSITION_OVERLAY');
this.preloader = $selector('PRELOADER');
const template = getTemplate(element);

// ✅ Router.js
import { getTemplate } from '../utils/helpers/dom.js';
import { preloadLazyImages } from '../utils/helpers/images.js';

this.template = getTemplate(pageContent);
await preloadLazyImages(this.mainElement);

// ✅ App.js
import { EVENTS, dispatchEvent } from '../utils/constants/events.js';

this.preloader.on(EVENTS.PRELOADER_COMPLETE, handler);
dispatchEvent(window, EVENTS.HARD_REFRESH, { route });

// ✅ Preloader.js
import { $$selector } from '../utils/helpers/dom.js';
import { SELECTORS } from '../utils/constants/selectors.js';
import { preloadLazyImages } from '../utils/helpers/images.js';

const images = $$selector('LAZY_IMAGES');
await preloadLazyImages();
```

---

## 6. Complete Refactored Examples

### Page.js Refactored

```js
import { Animation } from "./Animation.js";
import { $selector, getTemplate } from "../utils/helpers/dom.js";
import { SELECTORS } from "../utils/constants/selectors.js";
import { nextPaint } from "../utils/helpers/timing.js";

export default class Page {
  constructor({ id, element, elements }) {
    this.id = id;
    this.selector = element;
    this.selectorChildren = {
      titleAnimations: SELECTORS.TITLE_ANIMATIONS,
      ...elements,
    };
  }
  
  async create() {
    this.element = $(this.selector);
    this.transitionOverlay = $selector('TRANSITION_OVERLAY');
    this.preloader = $selector('PRELOADER');
    
    // Use timing helper
    await nextPaint();
    // ...
  }
  
  async show() {
    await this.animation.GSAPHideTransition(this.transitionOverlay);
  }
}
```

### Router.js Refactored

```js
import { $selector, getTemplate, setTemplate } from "../utils/helpers/dom.js";
import { SELECTORS } from "../utils/constants/selectors.js";
import { nextPaint } from "../utils/helpers/timing.js";
import { preloadLazyImages } from "../utils/helpers/images.js";

export class Router {
  async updateMarkup(html) {
    const pageContent = newPageDOM.querySelector(SELECTORS.MAIN);
    this.template = getTemplate(pageContent);
    
    const newPageContent = pageContent.querySelector(SELECTORS.PAGE_CONTENT);
    
    this.mainElement.replaceChildren(fragment);
    setTemplate(this.mainElement, this.template);
    
    // Use centralized image preloading
    await preloadLazyImages(this.mainElement);
    
    // Use timing helper
    await nextPaint();
    
    window.dispatchEvent(new Event("resize"));
  }
}
```

### App.js Refactored

```js
import { EVENTS, dispatchEvent } from "./utils/constants/events.js";
import { SELECTORS } from "./utils/constants/selectors.js";

class App {
  createPreloader() {
    this.preloader = new Preloader();
    this.preloader.on(EVENTS.PRELOADER_COMPLETE, ({ message }) => {
      // ...
    });
  }
  
  async onPageChange(href) {
    // ...
    dispatchEvent(window, EVENTS.HARD_REFRESH, { route });
  }
}
```

---

## Benefits Summary

1. **Single Source of Truth**
   - Change selector once, updates everywhere
   - No search/replace across files

2. **Type Safety**
   - IDE autocomplete for constants
   - Catch typos at import time

3. **Easier Refactoring**
   - Rename selector? Change in one place
   - Update event name? Change once

4. **Better Testing**
   - Mock constants easily
   - Test utilities independently

5. **Self-Documenting**
   - Constants file shows all selectors/events
   - Clear naming conventions

6. **DRY Principle**
   - Shared utilities for common operations
   - No code duplication

---

## Migration Strategy

1. **Start with constants** (easiest win)
   - Create `constants/selectors.js`
   - Create `constants/events.js`
   - Replace strings one file at a time

2. **Add helpers gradually**
   - Start with most-used helpers
   - Migrate as you touch files

3. **Don't do it all at once**
   - Refactor incrementally
   - Test after each change

