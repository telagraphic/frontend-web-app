# AbortController Guide: Race-Safe Async Flows in SPAs

## TL;DR

- **AbortController** is the native Web API (use it, not custom tokens!)
- Prevents race conditions when users click links rapidly
- Cancels stale fetch requests, animations, and async operations
- Essential for SPAs to avoid state corruption and wasted resources
- [AbortController Video](https://www.youtube.com/watch?v=2sdXSczmvNc)



**AbortController** is like a "kill switch" for async operations. When you call `abort()`, it doesn't immediately stop JavaScript execution - instead, it sets a flag that operations can check.
---

## Why You Need This: The Race Condition Problem

### Scenario: User Clicks Links Rapidly

```
User clicks: Home → About → Gallery (within 1 second)

Without AbortController:
1. Home navigation starts (fetching /pages/home.html)
2. About navigation starts (fetching /pages/about.html) 
   → Still waiting for home.html ❌
3. Gallery navigation starts (fetching /pages/gallery.html)
   → Still waiting for home.html AND about.html ❌
4. All three complete in wrong order
5. DOM shows wrong page, state is corrupted ❌

With AbortController:
1. Home navigation starts (fetching /pages/home.html)
2. About navigation starts → Aborts home fetch ✅
   → Fetches /pages/about.html
3. Gallery navigation starts → Aborts about fetch ✅
   → Fetches /pages/gallery.html
4. Only gallery completes, shows correct page ✅
```

---

## Your Code's Race Condition Hotspots

### 🔴 Critical: App.onPageChange()

**Current Problem:**
```js
async onPageChange(href) {
  await this.currentPage.hide(route);      // Animation 1
  await this.router.updatePage(href);      // Fetch + DOM swap
  await this.loadPage(template);           // Dynamic import
  await this.currentPage.create();         // Setup
  await this.currentPage.show();           // Animation 2
}

// If user clicks twice:
// - First navigation: hide → fetch → create → show
// - Second navigation: hide (interrupts first!) → fetch → create → show
// Result: Wrong page shows, animations conflict, state corrupted
```

**With AbortController:**
```js
async onPageChange(href) {
  // Cancel any in-flight navigation
  this.navigationController?.abort();
  this.navigationController = new AbortController();
  const { signal } = this.navigationController;
  
  // Pass signal through chain
  await this.currentPage.hide(route, { signal });
  
  if (signal.aborted) return; // Check after each async step
  
  await this.router.updatePage(href, { signal });
  if (signal.aborted) return;
  
  await this.loadPage(template, { signal });
  if (signal.aborted) return;
  
  await this.currentPage.create({ signal });
  if (signal.aborted) return;
  
  await this.currentPage.show({ signal });
}
```

### 🔴 Critical: Router.requestPage() - Stale Fetch Requests

**Current Problem:**
```js
async requestPage(href) {
  const response = await fetch(routePath);  // ❌ Can't cancel!
  this.newPageHTML = await response.text();
}

// If navigation happens during fetch:
// - Old fetch completes, overwrites new page HTML
// - Shows wrong content
```

**With AbortController:**
```js
async requestPage(href, { signal } = {}) {
  const response = await fetch(routePath, { signal }); // ✅ Cancelable!
  
  if (signal?.aborted) {
    throw new DOMException('Aborted', 'AbortError');
  }
  
  this.newPageHTML = await response.text();
}
```

### 🟡 Medium: Page.hide() - GSAP Animations

**Current Problem:**
```js
async hide(route) {
  await this.transitionManager.getTransition(route);
  await this.animation.GSAPShowTransition(this.transitionOverlay);
  // ❌ If new navigation starts, animation might not complete
  // ❌ Leaves overlay in wrong state
}
```

**With AbortController:**
```js
async hide(route, { signal } = {}) {
  await this.transitionManager.getTransition(route, { signal });
  if (signal?.aborted) return;
  
  // GSAP supports abort via kill()
  const timeline = gsap.timeline();
  
  signal?.addEventListener('abort', () => {
    timeline.kill(); // Stop animation
  });
  
  await timeline.to(this.transitionOverlay, { opacity: 1 });
}
```

### 🟡 Medium: Dynamic Imports

**Current Problem:**
```js
async loadPage(page) {
  const pageModule = await import(`${path}${className}.js`);
  // ❌ If navigation happens, still loads old module
}
```

**With AbortController:**
```js
// Note: Dynamic imports can't be aborted natively
// But we can ignore the result if aborted
async loadPage(page, { signal } = {}) {
  const pageModule = await import(`${path}${className}.js`);
  
  if (signal?.aborted) {
    return null; // Ignore result
  }
  
  return pageModule;
}
```


## Common SPA Use Cases

### 1. Navigation Cancellation

```js
// User clicks multiple links rapidly
click 1: Home    → navigation 1 starts
click 2: About   → navigation 1 aborted, navigation 2 starts
click 3: Gallery → navigation 2 aborted, navigation 3 starts
Result: Only Gallery completes ✅
```

### 2. Search/Filter Debouncing

```js
class SearchComponent {
  constructor() {
    this.searchController = null;
  }
  
  async search(query) {
    // Cancel previous search
    this.searchController?.abort();
    this.searchController = new AbortController();
    
    try {
      const results = await fetch(`/api/search?q=${query}`, {
        signal: this.searchController.signal,
      }).then(r => r.json());
      
      this.displayResults(results);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Search failed:', error);
      }
    }
  }
}
```

### 3. Image Loading

```js
async loadImages(urls, { signal } = {}) {
  const promises = urls.map(async (url) => {
    if (signal?.aborted) return null;
    
    const img = new Image();
    
    return new Promise((resolve, reject) => {
      signal?.addEventListener('abort', () => {
        resolve(null); // Skip if aborted
      });
      
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = url;
    });
  });
  
  return (await Promise.all(promises)).filter(Boolean);
}
```

### 4. Form Submission

```js
class FormComponent {
  async submit(formData) {
    // Cancel previous submission
    this.submitController?.abort();
    this.submitController = new AbortController();
    
    try {
      const response = await fetch('/api/submit', {
        method: 'POST',
        body: formData,
        signal: this.submitController.signal,
      });
      
      // Handle success
    } catch (error) {
      if (error.name !== 'AbortError') {
        // Handle real errors
      }
    }
  }
}
```


---

## Does `abort()` Cancel Previous Functions?

**Short answer: It depends on how the function checks the signal.**

### ✅ Works with Native APIs (fetch, addEventListener)

```js
// fetch() automatically checks signal
const controller = new AbortController();
fetch(url, { signal: controller.signal });
controller.abort(); // ✅ fetch() automatically cancels

// addEventListener with signal
element.addEventListener('click', handler, { signal: controller.signal });
controller.abort(); // ✅ Listener automatically removed
```

### ⚠️ Requires Manual Checking for Custom Async Functions

```js
async function myAsyncFunction({ signal } = {}) {
  // ❌ WRONG: Doesn't check signal
  await longOperation();
  await anotherOperation();
  // Even if aborted, continues execution!
}

async function myAsyncFunction({ signal } = {}) {
  // ✅ RIGHT: Checks signal after each step
  await longOperation();
  if (signal?.aborted) return; // Stops here
  
  await anotherOperation();
  if (signal?.aborted) return; // Stops here
  
  return result;
}
```

---

## How Fetch Handles Abort Automatically

```js
async requestPage(href, { signal } = {}) {
  try {
    // fetch() automatically checks signal internally
    const response = await fetch(routePath, { signal });
    
    // If aborted, fetch throws AbortError BEFORE returning
    // So this code won't run if aborted
    
    const html = await response.text();
    return html;
    
  } catch (error) {
    // fetch() throws AbortError if signal.aborted === true
    if (error.name === 'AbortError') {
      console.log('Fetch cancelled');
      return null;
    }
    throw error;
  }
}
```

**What happens:**
1. `fetch()` starts network request
2. `signal.aborted` becomes `true`
3. `fetch()` internally checks `signal.aborted`
4. `fetch()` throws `AbortError` immediately
5. Network request may or may not be cancelled (browser dependent)
6. Your code catches `AbortError` and handles it



## Complete Flow Diagram

```
User clicks link
    ↓
onPageChange('home')
    ↓
controller?.abort() ──→ (if exists) signal.aborted = true
    ↓
new AbortController() ──→ signal.aborted = false (new signal)
    ↓
await updatePage({ signal })
    ↓
    └─→ await fetch(url, { signal })
            ↓
        [If signal.aborted === true]
            ↓
        fetch() throws AbortError
            ↓
    catch AbortError → return early
    ↓
if (signal.aborted) return ──→ ✅ STOP HERE

[If signal.aborted === false]
    ↓
await create({ signal })
    ↓
if (signal.aborted) return ──→ (could be true if new click happened)
```

 Why Check After Each `await`?

```js
// ❌ BAD: Only checks at end
async onPageChange(href) {
  this.controller?.abort();
  this.controller = new AbortController();
  const { signal } = this.controller;
  
  await step1({ signal }); // Takes 500ms
  await step2({ signal }); // Takes 500ms
  await step3({ signal }); // Takes 500ms
  
  if (signal.aborted) return; // ❌ Too late! Wasted 1.5 seconds
}

// ✅ GOOD: Checks after each step
async onPageChange(href) {
  this.controller?.abort();
  this.controller = new AbortController();
  const { signal } = this.controller;
  
  await step1({ signal });
  if (signal.aborted) return; // ✅ Stop immediately if aborted (?)
  
  await step2({ signal });
  if (signal.aborted) return; // ✅ Stop immediately if aborted
  
  await step3({ signal });
  if (signal.aborted) return; // ✅ Stop immediately if aborted
}
```


 Why Check After Each `await`?

```js
// ❌ BAD: Only checks at end
async onPageChange(href) {
  this.controller?.abort();
  this.controller = new AbortController();
  const { signal } = this.controller;
  
  await step1({ signal }); // Takes 500ms
  await step2({ signal }); // Takes 500ms
  await step3({ signal }); // Takes 500ms
  
  if (signal.aborted) return; // ❌ Too late! Wasted 1.5 seconds
}

// ✅ GOOD: Checks after each step
async onPageChange(href) {
  this.controller?.abort();
  this.controller = new AbortController();
  const { signal } = this.controller;
  
  await step1({ signal });
  if (signal.aborted) return; // ✅ Stop immediately if aborted (?)
  
  await step2({ signal });
  if (signal.aborted) return; // ✅ Stop immediately if aborted
  
  await step3({ signal });
  if (signal.aborted) return; // ✅ Stop immediately if aborted
}
```
---

## Best Practices

### ✅ DO

1. **Check signal after each async operation:**
   ```js
   await step1({ signal });
   if (signal?.aborted) return;
   
   await step2({ signal });
   if (signal?.aborted) return;
   ```

2. **Pass signal through the chain:**
   ```js
   async functionA({ signal }) {
     await functionB({ signal });
   }
   ```

3. **Ignore AbortError:**
   ```js
   try {
     await operation({ signal });
   } catch (error) {
     if (error.name === 'AbortError') return;
     throw error; // Re-throw real errors
   }
   ```

4. **Clean up on abort:**
   ```js
   signal?.addEventListener('abort', () => {
     timeline.kill();
     cleanup();
   });
   ```

### ❌ DON'T

1. **Don't throw on abort (usually):**
   ```js
   // ❌ BAD
   if (signal?.aborted) {
     throw new Error('Aborted');
   }
   
   // ✅ GOOD
   if (signal?.aborted) {
     return; // Silent return
   }
   ```

2. **Don't forget to check signal:**
   ```js
   // ❌ BAD
   await longOperation(); // No signal check
   
   // ✅ GOOD
   await longOperation({ signal });
   if (signal?.aborted) return;
   ```

3. **Don't create too many controllers:**
   ```js
   // ❌ BAD - Creates new controller each time
   async onPageChange() {
     const controller = new AbortController();
     // ...
   }
   
   // ✅ GOOD - Reuse and abort previous
   async onPageChange() {
     this.controller?.abort();
     this.controller = new AbortController();
   }
   ```

---

## Testing AbortController

```js
describe('Navigation with AbortController', () => {
  it('should cancel previous navigation', async () => {
    const app = new App();
    
    // Start first navigation
    const nav1 = app.onPageChange('home');
    
    // Start second navigation (should cancel first)
    const nav2 = app.onPageChange('about');
    
    // Wait for both
    await Promise.all([nav1, nav2]);
    
    // Should be on 'about' page, not 'home'
    expect(app.router.template).toBe('about');
  });
  
  it('should ignore aborted fetch errors', async () => {
    const router = new Router();
    
    const fetch1 = router.requestPage('home');
    const fetch2 = router.requestPage('about'); // Should cancel home
    
    await fetch2;
    
    // Should not throw, even if home was cancelled
    expect(router.template).toBe('about');
  });
});
```

---

## Summary

1. **Use AbortController** (native API) ✅
2. **Cancel on new navigation** ✅
3. **Pass signal through async chain** ✅
4. **Check signal after each await** ✅
5. **Ignore AbortError silently** ✅

**Key Benefits:**
- ✅ No stale requests
- ✅ No state corruption
- ✅ Better performance (cancel wasted work)
- ✅ Better UX (responsive to user actions)


Here are implementation ideas for AbortController patterns in your codebase.

## 1. Should AbortController be a Service?

Recommendation: No — use a hybrid approach.

- AbortController instances should be owned by the component managing the operation lifecycle (e.g., `Router` for navigation, `Page` for page operations).
- Create a utility/helper service for shared patterns and helpers.

### Recommended Structure:

```javascript
// app/services/AbortControllerManager.js (Utility Service)
export class AbortControllerManager {
  /**
   * Creates a new controller, aborting previous if exists
   * @param {AbortController|null} previousController 
   * @returns {AbortController}
   */
  static createNew(previousController = null) {
    previousController?.abort();
    return new AbortController();
  }

  /**
   * Checks if signal is aborted and throws if needed
   * @param {AbortSignal} signal 
   * @param {string} message 
   */
  static throwIfAborted(signal, message = 'Operation aborted') {
    if (signal?.aborted) {
      throw new DOMException(message, 'AbortError');
    }
  }

  /**
   * Wraps async operation with abort checking
   */
  static async withAbortCheck(operation, signal) {
    await operation();
    if (signal?.aborted) {
      throw new DOMException('Operation aborted', 'AbortError');
    }
  }
}
```

### Usage in Router:

```javascript
// Router.js
import { AbortControllerManager } from './AbortControllerManager.js';

export class Router {
  constructor({ /* ... */ }) {
    this.navigationController = null; // Own the controller
  }

  async updatePage(href, { signal } = {}) {
    // Create controller if not provided
    if (!signal) {
      this.navigationController = AbortControllerManager.createNew(
        this.navigationController
      );
      signal = this.navigationController.signal;
    }

    try {
      const routeInfo = await this.beforePageUpdate(href, { signal });
      if (signal.aborted) return;

      const newPage = await this.startPageUpdate(routeInfo, true, { signal });
      if (signal.aborted) return;

      await this.afterPageUpdate(newPage, routeInfo, { signal });
    } catch (error) {
      if (error.name === 'AbortError') {
        return; // Expected, ignore
      }
      console.error("Error updating page", error);
      this.routerResolver.redirectToHome();
    }
  }
}
```

---

## 2. DRY Patterns to Avoid Multiple `signal.aborted` Checks

### Pattern A: Sequential execution helper

```javascript
// app/utilities/AsyncSequence.js
export class AsyncSequence {
  /**
   * Executes async operations sequentially, stopping if aborted
   * @param {Array<Function>} operations - Array of async functions
   * @param {AbortSignal} signal 
   * @returns {Promise}
   */
  static async execute(operations, signal) {
    for (const operation of operations) {
      if (signal?.aborted) {
        throw new DOMException('Sequence aborted', 'AbortError');
      }
      await operation({ signal });
    }
  }

  /**
   * Executes operations with early return (no throw)
   * @param {Array<Function>} operations 
   * @param {AbortSignal} signal 
   * @returns {Promise<boolean>} - true if completed, false if aborted
   */
  static async executeOrReturn(operations, signal) {
    for (const operation of operations) {
      if (signal?.aborted) return false;
      await operation({ signal });
    }
    return true;
  }
}
```

### Pattern B: Abort-aware promise wrapper

```javascript
// app/utilities/AbortablePromise.js
export class AbortablePromise {
  /**
   * Wraps a promise to check abort after completion
   * @param {Promise} promise 
   * @param {AbortSignal} signal 
   * @returns {Promise}
   */
  static async wrap(promise, signal) {
    const result = await promise;
    if (signal?.aborted) {
      throw new DOMException('Operation aborted', 'AbortError');
    }
    return result;
  }

  /**
   * Executes multiple promises, checking abort between each
   */
  static async sequence(promises, signal) {
    const results = [];
    for (const promise of promises) {
      if (signal?.aborted) {
        throw new DOMException('Sequence aborted', 'AbortError');
      }
      results.push(await promise);
    }
    return results;
  }
}
```

### Pattern C: Decorator/helper for methods

```javascript
// app/utilities/Abortable.js
export function abortable(target, propertyKey, descriptor) {
  const originalMethod = descriptor.value;
  
  descriptor.value = async function(...args) {
    // Extract signal from options (last arg or options.signal)
    const options = args[args.length - 1];
    const signal = options?.signal;
    
    const result = await originalMethod.apply(this, args);
    
    if (signal?.aborted) {
      throw new DOMException('Operation aborted', 'AbortError');
    }
    
    return result;
  };
  
  return descriptor;
}
```

---

## 3. Clean Code Patterns with Try-Catch

### Pattern 1: Centralized abort error handling

```javascript
// app/utilities/ErrorHandler.js
export class ErrorHandler {
  /**
   * Handles abort errors silently, re-throws others
   */
  static handleAbortError(error, fallback = null) {
    if (error.name === 'AbortError') {
      return fallback;
    }
    throw error;
  }

  /**
   * Wraps async operation with abort-aware error handling
   */
  static async withAbortHandling(operation, signal, onError = null) {
    try {
      return await operation({ signal });
    } catch (error) {
      if (error.name === 'AbortError') {
        return null; // Silent return
      }
      if (onError) {
        return onError(error);
      }
      throw error;
    }
  }
}
```

### Pattern 2: Pipeline pattern with abort support

```javascript
// app/utilities/AsyncPipeline.js
export class AsyncPipeline {
  constructor(signal) {
    this.signal = signal;
    this.steps = [];
  }

  add(step) {
    this.steps.push(step);
    return this;
  }

  async execute() {
    try {
      for (const step of this.steps) {
        if (this.signal?.aborted) {
          throw new DOMException('Pipeline aborted', 'AbortError');
        }
        await step({ signal: this.signal });
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        return null; // Expected
      }
      throw error;
    }
  }
}
```

### Pattern 3: Router implementation with pipeline

```javascript
// Router.js - Clean implementation
import { AsyncPipeline } from '../utilities/AsyncPipeline.js';
import { ErrorHandler } from '../utilities/ErrorHandler.js';

export class Router {
  constructor({ /* ... */ }) {
    this.navigationController = null;
  }

  async updatePage(href, { signal } = {}) {
    // Create controller if not provided
    if (!signal) {
      this.navigationController?.abort();
      this.navigationController = new AbortController();
      signal = this.navigationController.signal;
    }

    try {
      // Use pipeline pattern - clean and DRY
      const pipeline = new AsyncPipeline(signal)
        .add(() => this.beforePageUpdate(href))
        .add(({ result: routeInfo }) => {
          if (!routeInfo?.isValid) return;
          return this.startPageUpdate(routeInfo);
        })
        .add(({ result: newPage }) => {
          if (!newPage) return;
          return this.afterPageUpdate(newPage);
        });

      await pipeline.execute();
    } catch (error) {
      return ErrorHandler.handleAbortError(error, () => {
        console.error("Error updating page", error);
        this.routerResolver.redirectToHome();
      });
    }
  }
}
```

---

## 4. Specific Implementation Ideas

### For Router.js (updatePage):

```javascript
// Router.js - Recommended implementation
export class Router {
  constructor({ /* ... */ }) {
    this.navigationController = null;
  }

  async updatePage(href, { signal } = {}) {
    // 1. Create/abort controller
    if (!signal) {
      this.navigationController?.abort();
      this.navigationController = new AbortController();
      signal = this.navigationController.signal;
    }

    try {
      // 2. Use helper to avoid repetitive checks
      const routeInfo = await this.checkAbort(
        () => this.beforePageUpdate(href, { signal }),
        signal
      );

      if (!routeInfo?.isValid) return;

      const newPage = await this.checkAbort(
        () => this.startPageUpdate(routeInfo, true, { signal }),
        signal
      );

      if (!newPage) return;

      await this.checkAbort(
        () => this.afterPageUpdate(newPage, routeInfo, { signal }),
        signal
      );
    } catch (error) {
      if (error.name === 'AbortError') return;
      console.error("Error updating page", error);
      this.routerResolver.redirectToHome();
    }
  }

  /**
   * Helper to check abort after async operation
   */
  async checkAbort(operation, signal) {
    const result = await operation();
    if (signal?.aborted) {
      throw new DOMException('Operation aborted', 'AbortError');
    }
    return result;
  }

  async beforePageUpdate(href, { signal } = {}) {
    const routeInfo = this.routerResolver.validateRoute(
      href,
      window.location.pathname
    );
    // ... rest of logic
    return routeInfo;
  }

  async startPageUpdate(routeInfo, addToHistory = true, { signal } = {}) {
    const currentPage = this.pageRegistry.getCurrentPage();
    if (currentPage) {
      await currentPage.hide(routeInfo.route, { signal });
    }

    await this.pageManager.updatePage(routeInfo.route, { signal });

    if (addToHistory) {
      this.routerHistory.updateHistory(routeInfo.route);
    }

    await nextPaint();
    return await this.pageLoader.getPage(routeInfo.route, { signal });
  }

  async afterPageUpdate(newPage, routeInfo, { signal } = {}) {
    await newPage.create({ signal });
    await newPage.show({ signal });
    await nextPaint();
  }
}
```

### For Page.js (show method):

```javascript
// Page.js - Recommended implementation
export default class Page {
  async show({ signal } = {}) {
    await this.beforeShow?.({ signal });

    // Use helper for transition with abort support
    if (this.pageTransition) {
      await this.withAbortCheck(
        () => this.transitionsManager.hidePageTransition(
          this.pageTransition,
          { signal }
        ),
        signal
      );
    }

    // Critical operations - let errors bubble up
    if (this.smoothScroll.enabled()) {
      this.smoothScroll.scrollTo(0, { immediate: true });
    } else {
      this.smoothScroll.create();
      this.smoothScroll.scrollTo(0, { immediate: true });
    }

    this.setPageFocus();
    await this.afterShow?.({ signal });
  }

  /**
   * Helper to wrap operations with abort checking
   */
  async withAbortCheck(operation, signal) {
    try {
      await operation();
      if (signal?.aborted) {
        throw new DOMException('Operation aborted', 'AbortError');
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        return; // Silent return for aborted operations
      }
      // Re-throw real errors
      throw error;
    }
  }
}
```

### For PageManager.js (requestPage):

```javascript
// PageManager.js - Fetch with abort support
export class PageManager {
  constructor({ /* ... */ }) {
    this.fetchController = null;
  }

  async requestPage(href, { signal } = {}) {
    if (!href) return null;

    // Create controller if not provided
    if (!signal) {
      this.fetchController?.abort();
      this.fetchController = new AbortController();
      signal = this.fetchController.signal;
    }

    try {
      const res = await fetch(href, { signal });

      if (signal.aborted) {
        throw new DOMException('Request aborted', 'AbortError');
      }

      if (!res.ok) {
        throw new Error(`Failed to fetch page: ${href}`);
      }

      const html = await res.text();

      if (signal.aborted) {
        throw new DOMException('Request aborted', 'AbortError');
      }

      return html;
    } catch (error) {
      if (error.name === 'AbortError') {
        return null; // Expected, ignore
      }
      console.error("Error requesting page:", error);
      return null;
    }
  }
}
```

---

## Summary of Recommendations

1. AbortController ownership: Keep controllers in the component managing the lifecycle (Router, PageManager, etc.). Use a utility service for shared helpers.
2. DRY patterns:
   - `AsyncSequence.execute()` for sequential operations
   - `checkAbort()` helper method
   - Pipeline pattern for complex flows
3. Try-catch patterns:
   - Centralized `ErrorHandler.handleAbortError()`
   - Silent return for `AbortError`
   - Re-throw real errors
4. Implementation strategy:
   - Add `{ signal }` parameter to async methods
   - Use helpers to reduce repetitive checks
   - Handle `AbortError` at the top level

This approach reduces boilerplate, keeps error handling consistent, and makes the code easier to maintain.


# AbortController Implementation Audit

## Summary

This audit identifies all async operations in the codebase that should implement AbortController to prevent race conditions, stale requests, and state corruption during rapid navigation.

---

## XL (Extra Large) - Core Navigation Flow

### 1. Router.updatePage() - Main Navigation Orchestrator

**File:** `app/services/Router.js:74-93`
**Issue:** No cancellation support for in-flight navigation. Rapid clicks cause multiple navigations to run simultaneously.
**Impact:**

- CRITICAL: Wrong page can display
- State corruption from overlapping operations
- Wasted network requests and DOM operations
**Priority:** HIGH
**Lines affected:** ~20 lines
**Dependencies:** Calls `beforePageUpdate()`, `startPageUpdate()`, `afterPageUpdate()`

### 2. Router.startPageUpdate() - Page Swap Sequence

**File:** `app/services/Router.js:123-144`
**Issue:** Multiple async steps (hide, updatePage, loadPage) without abort checks between steps.
**Impact:**

- CRITICAL: Page hide animation can be interrupted mid-animation
- Stale page content can overwrite new content
- Dynamic imports continue even after navigation cancelled
**Priority:** HIGH
**Lines affected:** ~22 lines
**Dependencies:** `Page.hide()`, `PageManager.updatePage()`, `PageLoader.getPage()`

---

## L (Large) - Critical Async Operations

### 3. PageManager.requestPage() - Fetch Request

**File:** `app/services/PageManager.js:46-61`
**Issue:** `fetch()` call has no signal parameter. Stale requests can complete and overwrite newer page content.
**Impact:**

- CRITICAL: Wrong HTML content displayed
- Network waste from uncancelled requests
- Race condition: old fetch completes after new navigation starts
**Priority:** HIGH
**Lines affected:** ~16 lines
**Dependencies:** Native `fetch()` API

### 4. PageManager.updatePage() - DOM Update + Preloading

**File:** `app/services/PageManager.js:20-39`
**Issue:** Sequential async operations (requestPage, updateDOM, waitForPageReady) without abort checks.
**Impact:**

- HIGH: DOM updates can happen for cancelled navigation
- Image preloading continues for cancelled pages (wasteful)
- Background color changes can apply to wrong page
**Priority:** HIGH
**Lines affected:** ~20 lines
**Dependencies:** `requestPage()`, `updateDOM()`, `waitForPageReady()`

### 5. Page.hide() - Transition Animation

**File:** `app/pages/Page.js:166-181`
**Issue:** GSAP animations not cancellable. If new navigation starts, animation may not complete, leaving overlay in wrong state.
**Impact:**

- HIGH: Transition overlay stuck visible/hidden
- Animation conflicts when rapid navigation occurs
- Visual glitches and broken UX
**Priority:** HIGH
**Lines affected:** ~16 lines
**Dependencies:** `TransitionsManager.updateTransitionOverlay()`, `TransitionsManager.showPageTransition()`, GSAP

### 6. Page.show() - Transition Animation

**File:** `app/pages/Page.js:140-161`
**Issue:** Transition hide animation not cancellable. Smooth scroll operations not abort-aware.
**Impact:**

- MEDIUM: Transition animation can be interrupted
- Smooth scroll setup happens even if navigation cancelled
- Focus management on wrong page
**Priority:** MEDIUM
**Lines affected:** ~22 lines
**Dependencies:** `TransitionsManager.hidePageTransition()`, `SmoothScroll`

### 7. PageLoader.loadPage() - Dynamic Import

**File:** `app/services/PageLoader.js:95-130`
**Issue:** Dynamic `import()` cannot be cancelled natively, but result should be ignored if aborted.
**Impact:**

- MEDIUM: Unnecessary module loading for cancelled navigation
- Memory waste from loading unused modules
- Can delay new navigation if import is slow
**Priority:** MEDIUM
**Lines affected:** ~36 lines
**Dependencies:** Dynamic `import()` API

---

## M (Medium) - Supporting Operations

### 8. PageLoader.getPage() - Page Instance Creation

**File:** `app/services/PageLoader.js:65-73`
**Issue:** Calls `loadPage()` without abort support. Page instance created even if navigation cancelled.
**Impact:**

- MEDIUM: Unnecessary page instance creation
- Memory waste
**Priority:** MEDIUM
**Lines affected:** ~9 lines
**Dependencies:** `loadPage()`

### 9. TransitionsManager.updateTransitionOverlay() - Template Loading

**File:** `app/animations/TransitionsManager.js:227-265`
**Issue:** Image preloading not cancellable. DOM updates happen even if navigation cancelled.
**Impact:**

- MEDIUM: Unnecessary image preloading
- DOM manipulation for cancelled navigation
**Priority:** MEDIUM
**Lines affected:** ~39 lines
**Dependencies:** `preloadSingleImage()`, DOM operations

### 10. PageTransition.showPageTransition() - GSAP Animation

**File:** `app/animations/PageTransition.js:9-42`
**Issue:** GSAP timeline not cancellable. Animation continues even if navigation cancelled.
**Impact:**

- MEDIUM: Animation conflicts during rapid navigation
- Timeline not cleaned up on abort
- Promise never resolves if aborted
**Priority:** MEDIUM
**Lines affected:** ~34 lines
**Dependencies:** GSAP

### 11. PageTransition.hidePageTransition() - GSAP Animation

**File:** `app/animations/PageTransition.js:44-96`
**Issue:** GSAP timeline not cancellable. Same issues as showPageTransition.
**Impact:**

- MEDIUM: Animation conflicts
- Timeline cleanup missing
**Priority:** MEDIUM
**Lines affected:** ~53 lines
**Dependencies:** GSAP

### 12. PageManager.waitForPageReady() - Image Preloading

**File:** `app/services/PageManager.js:137-147`
**Issue:** `preloadImages()` called without signal. Images continue loading for cancelled navigation.
**Impact:**

- MEDIUM: Network waste
- Layout calculations for wrong page
**Priority:** MEDIUM
**Lines affected:** ~11 lines
**Dependencies:** `preloadImages()` utility

### 13. TransitionsManager.preloadSingleImage() - Image Loading

**File:** `app/animations/TransitionsManager.js:190-214`
**Issue:** Calls `preloadImages()` without signal. Single image preloading not cancellable.
**Impact:**

- LOW: Single image, less critical
- Still wasteful if navigation cancelled
**Priority:** LOW
**Lines affected:** ~25 lines
**Dependencies:** `preloadImages()` utility

---

## S (Small) - Utility Enhancements

### 14. Images.js preloadImages() - Batch Image Loading

**File:** `app/utilities/Images.js:341-383`
**Issue:** Already has some AbortController usage in `loadImageWithoutDecode()`, but main `preloadImages()` function doesn't accept signal parameter.
**Impact:**

- LOW: Enhancement to existing pattern
- Would make all image preloading cancellable
**Priority:** LOW
**Lines affected:** ~43 lines
**Dependencies:** `loadSingleImage()`

### 15. TransitionsManager.preloadAllTransitionImages() - Batch Preloading

**File:** `app/animations/TransitionsManager.js:145-165`
**Issue:** Calls `preloadImages()` without signal. Batch preloading not cancellable.
**Impact:**

- LOW: Happens during idle time, less critical
- Still wasteful if many images
**Priority:** LOW
**Lines affected:** ~21 lines
**Dependencies:** `preloadImages()` utility

---

## Implementation Priority Summary

### Phase 1 (Critical - Do First)

1. Router.updatePage() - XL
2. Router.startPageUpdate() - XL
3. PageManager.requestPage() - L
4. PageManager.updatePage() - L
5. Page.hide() - L

### Phase 2 (High Impact)

6. Page.show() - L
7. PageLoader.loadPage() - L
8. PageTransition.showPageTransition() - M
9. PageTransition.hidePageTransition() - M

### Phase 3 (Supporting)

10. PageLoader.getPage() - M
11. TransitionsManager.updateTransitionOverlay() - M
12. PageManager.waitForPageReady() - M

### Phase 4 (Enhancements)

13. Images.js preloadImages() - S
14. TransitionsManager.preloadSingleImage() - S
15. TransitionsManager.preloadAllTransitionImages() - S

---

## Total Impact Assessment

- **XL tasks:** 2 (Core navigation - must fix first)
- **L tasks:** 5 (Critical async operations)
- **M tasks:** 6 (Supporting operations)
- **S tasks:** 2 (Utility enhancements)

**Estimated total lines to modify:** ~350-400 lines across 15 locations