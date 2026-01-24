# Utility Functions Migration Guide

This guide explains how to migrate from prototype extensions to utility functions for DOM operations.

## Current Situation

The codebase currently uses two approaches:
1. **Prototype extensions** (via `setupElementHelpers()`) - `element.$()`, `element.$$()`, `element.on()`, `element.off()`
2. **Global functions** (via `window.$`, `window.$$`) - `$()`, `$$()`
3. **New utility functions** (exported from `Utilities.js`) - `$(selector)`, `$$(selector)`, `on(element, event, handler)`, `off(element, event, handler)`

## Recommended Approach: Import Where Needed

### Step 1: Update Utilities.js

First, enhance the utility functions to support element-scoped queries:

```javascript
// app/utilities/Utilities.js

/**
 * Query selector - works on document or element
 * @param {string} selector - CSS selector
 * @param {HTMLElement|Document} [context=document] - Context element to query within
 * @returns {HTMLElement|null}
 */
export function $(selector, context = document) {
  return context.querySelector(selector);
}

/**
 * Query selector all - works on document or element
 * @param {string} selector - CSS selector
 * @param {HTMLElement|Document} [context=document] - Context element to query within
 * @returns {NodeList}
 */
export function $$(selector, context = document) {
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
  element.addEventListener(event, callback, options);
}

/**
 * Remove event listener
 * @param {EventTarget} element - Element to remove listener from
 * @param {string} event - Event name
 * @param {Function} callback - Event handler
 */
export function off(element, event, callback) {
  element.removeEventListener(event, callback);
}
```

### Step 2: Import in Files That Use Them

#### Example: App.js

```javascript
// app/App.js
import { $ } from "./utilities/Utilities.js";
// Remove: import { setupElementHelpers } from "./utilities/Utilities.js";

class App {
  async init() {
    // Remove: setupElementHelpers();
    this.createServices();
    // ... rest of init
  }

  createPreloader() {
    // Before: const preloaderElement = $(SELECTORS.PRELOADER);
    // After: Import $ and use directly
    const preloaderElement = $(SELECTORS.PRELOADER);
    // ... rest of method
  }
}
```

#### Example: Navigation.js

```javascript
// app/components/Navigation.js
import { $, $$, on } from "../utilities/Utilities.js";

export class Navigation extends Component {
  create() {
    super.create();
    // Before: this.navigation = $(".navigation");
    // After: Use imported $
    this.navigation = $(".navigation");
    this.menuButton = $(".navigation__toggle");
    this.menuLinks = $$(".navigation__link");
    this.title = $(".navigation__title");
    // ...
  }

  addEventListeners() {
    // Before: document.addEventListener("keydown", ...)
    // After: Use imported on()
    on(document, "keydown", (e) => {
      if (e.key === "Escape") {
        // ...
      }
    });
  }
}
```

#### Example: PageTransition.js (Element-scoped queries)

```javascript
// app/animations/PageTransition.js
import { $ } from "../utilities/Utilities.js";

export class PageTransition {
  async showPageTransition(element) {
    // Before: this.transitionImage = element.$(".page-transition-overlay__image");
    // After: Pass element as context
    this.transitionImage = $(".page-transition-overlay__image", element);
    // ...
  }
}
```

#### Example: Pages/Page.js

```javascript
// app/pages/Page.js
import { $ } from "../utilities/Utilities.js";
// Remove any reliance on global $ or prototype extensions

export default class Page {
  async createElements() {
    // Before: this.element = $(SELECTORS.MAIN_WITH_TEMPLATE);
    // After: Use imported $
    this.element = $(SELECTORS.MAIN_WITH_TEMPLATE);
    // ...
  }
}
```

### Step 3: Update Internal Utilities

The `createPageObjectFromSelectors` functions already use `$()` and `$$()` internally, so they'll automatically use the imported versions:

```javascript
// app/utilities/Utilities.js
import { $, $$ } from "./Utilities.js"; // Self-import if needed, or they're in same file

export const createPageObjectFromSelectors = (selectorChildren) => {
  const elements = {};
  // These will use the imported $ and $$ functions
  Object.entries(selectorChildren).forEach(([key, selector]) => {
    const selectedElements = $$(selector);
    // ...
  });
  return elements;
};
```

## Alternative: Global Setup (Temporary Migration)

If you want to maintain backward compatibility during migration, you can set up global versions in App.js:

```javascript
// app/App.js
import { $, $$, on, off } from "./utilities/Utilities.js";

// Temporary: Set up globals for backward compatibility
// TODO: Remove after full migration
window.$ = $;
window.$$ = $$;

class App {
  async init() {
    // No need to call setupElementHelpers() anymore
    this.createServices();
    // ...
  }
}
```

**Note**: This approach is only recommended as a temporary bridge. The explicit import approach is better long-term.

## Migration Checklist

### Files That Need Updates

1. **app/App.js**
   - [ ] Remove `import { setupElementHelpers }`
   - [ ] Remove `setupElementHelpers()` call
   - [ ] Add `import { $ } from "./utilities/Utilities.js"`
   - [ ] Verify `$()` calls work

2. **app/components/Navigation.js**
   - [ ] Add `import { $, $$, on } from "../utilities/Utilities.js"`
   - [ ] Replace `document.addEventListener` with `on(document, ...)`
   - [ ] Verify all `$()` and `$$()` calls work

3. **app/pages/Page.js**
   - [ ] Add `import { $ } from "../utilities/Utilities.js"`
   - [ ] Verify all `$()` calls work

4. **app/services/PageLoader.js**
   - [ ] Add `import { $ } from "../utilities/Utilities.js"`
   - [ ] Verify `$()` calls work

5. **app/services/PageManager.js**
   - [ ] Add `import { $ } from "../utilities/Utilities.js"`
   - [ ] Verify `$()` calls work

6. **app/animations/TransitionsManager.js**
   - [ ] Add `import { $ } from "../utilities/Utilities.js"`
   - [ ] Verify `$()` calls work

7. **app/animations/PageTransition.js**
   - [ ] Add `import { $ } from "../utilities/Utilities.js"`
   - [ ] Replace `element.$(selector)` with `$(selector, element)`

8. **app/components/Footnotes.js**
   - [ ] Add `import { $$ } from "../utilities/Utilities.js"`
   - [ ] Verify `$$()` calls work

9. **app/utilities/Utilities.js**
   - [ ] Remove `setupElementHelpers()` function (after migration complete)
   - [ ] Update `$()` and `$$()` to accept optional context parameter
   - [ ] Add proper JSDoc documentation

## Benefits of Import Approach

1. **Explicit Dependencies**: Clear what each file depends on
2. **Tree Shaking**: Unused utilities can be eliminated in production builds
3. **Testing**: Easier to mock utilities in tests
4. **No Prototype Pollution**: Avoids conflicts with other libraries
5. **Type Safety**: Better IDE support and type checking
6. **Maintainability**: Easier to refactor and understand code flow

## Element-Scoped Queries

The key difference when migrating from `element.$(selector)` to utility functions:

```javascript
// Before (prototype extension)
const child = element.$(".child");

// After (utility function with context)
import { $ } from "../utilities/Utilities.js";
const child = $(".child", element);
```

This pattern works for both `$()` and `$$()`:

```javascript
// Before
const children = element.$$(".child");

// After
import { $$ } from "../utilities/Utilities.js";
const children = $$(".child", element);
```

## Complete Example: Updated Utilities.js

```javascript
// app/utilities/Utilities.js
import { EVENTS } from "./Constants.js";

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
  if (!selector) return document.createDocumentFragment().querySelectorAll(selector); // Empty NodeList
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

// ... rest of utilities (nextPaint, returnImagesArray, etc.)
```

## Summary

**Recommended**: Import utilities where needed
- Add `import { $, $$, on, off } from "../utilities/Utilities.js"` to each file
- Replace `element.$(selector)` with `$(selector, element)`
- Replace `document.addEventListener` with `on(document, ...)`
- Remove `setupElementHelpers()` call from App.js
- Eventually remove `setupElementHelpers()` function entirely

This approach provides better code organization, testability, and maintainability while avoiding prototype pollution.
