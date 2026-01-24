Combining Option 2 (handler tracking) with the current code. Checking the Component implementation first:


All pages include the preloader element. Implementing Option 2 (handler tracking) and addressing the hard-refresh behavior:

## 1. Implement Option 2: Handler Tracking in Component

```javascript:app/components/Component.js
export default class Component extends EventTarget {
  constructor({ element, elements }) {
    super();
    // Store selectors (configuration only, no DOM access)
    this.selector = element;
    this.selectorChildren = { ...elements };
    this.eventTarget = new EventTarget();
    this._eventHandlers = new Map(); // Track handlers by type
    this.element = null;
    this.elements = {};
  }

  create() {
    const { element, elements } = componentPageObject(
      this.selector,
      this.selectorChildren
    );
    this.element = element;
    this.elements = elements;
  }

  emit(type, detail) {
    this.eventTarget.dispatchEvent(new CustomEvent(type, { detail }));
  }

  on(type, callback) {
    const handler = (event) => callback(event.detail);
    this.eventTarget.addEventListener(type, handler);
    
    // Track the handler
    if (!this._eventHandlers.has(type)) {
      this._eventHandlers.set(type, []);
    }
    this._eventHandlers.get(type).push(handler);
  }

  once(type, callback) {
    // Create the callback handler function that will be removed after the first event
    const handler = (event) => {
      callback(event.detail);
      this.eventTarget.removeEventListener(type, handler);
      
      // Also remove from tracking
      const handlers = this._eventHandlers.get(type);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) handlers.splice(index, 1);
      }
    };
    // Add the event listener to the event target which self deletes after the first event
    this.eventTarget.addEventListener(type, handler);
    
    // Track the handler
    if (!this._eventHandlers.has(type)) {
      this._eventHandlers.set(type, []);
    }
    this._eventHandlers.get(type).push(handler);
  }

  /**
   * Remove all listeners for a specific event type
   */
  removeAllListeners(type) {
    const handlers = this._eventHandlers.get(type) || [];
    handlers.forEach(handler => {
      this.eventTarget.removeEventListener(type, handler);
    });
    this._eventHandlers.delete(type);
  }

  /**
   * Remove all event listeners (complete cleanup)
   */
  removeAllListeners() {
    this._eventHandlers.forEach((handlers, type) => {
      handlers.forEach(handler => {
        this.eventTarget.removeEventListener(type, handler);
      });
    });
    this._eventHandlers.clear();
  }
}
```

## 2. Update Preloader to Use Handler Tracking

```javascript:app/components/Preloader.js
destroy() {
  if (this.element) {
    this.element.remove();
  }
  
  // Remove all event listeners using handler tracking
  this.removeAllListeners("preloader-complete");
  
  // Clear references
  this.element = null;
  this.elements = null;
  this.images = null;
}
```

## 3. Simplify App.js (No Manual Handler Reference Needed)

```javascript:app/App.js
createPreloader() {
  this.currentPage = this.services.pageRegistry.getCurrentPage();
  
  // Check if preloader element exists in DOM
  if (!document.querySelector(".preloader")) {
    return;
  }
  
  this.preloader = new Preloader();
  this.preloader.create();
  this.preloader.on("preloader-complete", ({ message }) => {  
    this.currentPage.smoothScroll.create();
    this.currentPage.smoothScroll.scrollTo(0, { immediate: true });
    this.destroyPreloader();
  });
}

destroyPreloader() {
  if (this.preloader) {
    // Component handles cleanup internally via removeAllListeners()
    this.preloader = null;
  }
}
```

## About Hard-Refresh and Caching

Hard-refresh does reload the page:
- JavaScript is re-executed
- `App.init()` runs again
- The preloader element exists in the HTML

The likely issue is timing/race conditions:

### Issue 1: DOM Readiness
When `App.init()` runs, the DOM might not be fully ready. The preloader element exists, but `createPreloader()` might run before the page is set up.

### Issue 2: currentPage Not Ready
`this.currentPage = this.services.pageRegistry.getCurrentPage()` might be `null` if the page hasn't been created yet.

### Issue 3: Service Worker / Module Caching
If you have a service worker or module caching, the JavaScript might not reload on hard-refresh.

## Improved Solution with Timing Fixes

```javascript:app/App.js
async init() {
  this.createServices();
  await this.services.router.start();
  await this.transitionManager.init();
  setupHelpers();
  
  // Wait for DOM to be ready and currentPage to be set
  // Use requestAnimationFrame to ensure DOM is fully rendered
  await new Promise(resolve => requestAnimationFrame(resolve));
  this.createPreloader();
}

createPreloader() {
  // Check if preloader element exists
  const preloaderElement = document.querySelector(".preloader");
  if (!preloaderElement) {
    console.warn("Preloader element not found in DOM");
    return;
  }
  
  this.currentPage = this.services.pageRegistry.getCurrentPage();
  if (!this.currentPage) {
    console.warn("Current page not available yet");
    // Retry after a short delay
    setTimeout(() => this.createPreloader(), 100);
    return;
  }
  
  this.preloader = new Preloader();
  this.preloader.create();
  this.preloader.on("preloader-complete", ({ message }) => {  
    this.currentPage.smoothScroll.create();
    this.currentPage.smoothScroll.scrollTo(0, { immediate: true });
    this.destroyPreloader();
  });
}
```

This ensures:
1. Handler tracking for cleanup (Option 2)
2. Proper timing for DOM readiness
3. Retry logic if currentPage isn't ready
4. Works on hard-refresh and initial page loads

The preloader should now work on every initial page load, including hard-refresh to any page.



Reviewing the current implementation to explain how the callbacks work:


[3 tools called]


## Callback options explained

### 1. `onProgress` callback

Purpose: Fired each time an image loads, providing aggregate progress.

Signature:
```javascript
onProgress(loaded, total, percentage)
```

- `loaded`: Number of images loaded so far
- `total`: Total number of images
- `percentage`: Calculated percentage (0-100)

When it fires: Every time an image finishes loading (after decode if enabled).

### 2. `onImageLoad` callback

Purpose: Fired per image, providing details about the specific image.

Signature:
```javascript
onImageLoad(imageElement, index)
```

- `imageElement`: The specific `<img>` element that loaded
- `index`: The index of that image in the array

When it fires: Same timing as `onProgress`, but provides per-image details.

## How it all works together

### Execution flow

```
┌─────────────────────────────────────────────────────────────┐
│ preloadImages() called                                      │
│                                                              │
│ 1. normalizeImages() → Get array of image elements          │
│ 2. excludePreloaderImages() → Filter if needed              │
│ 3. For each image:                                          │
│    └─→ loadSingleImage() → Start loading                    │
└─────────────────────────────────────────────────────────────┘
                           ↓
        ┌──────────────────┴──────────────────┐
        │                                      │
        ↓                                      ↓
┌───────────────────┐              ┌───────────────────┐
│ Image already      │              │ Image needs       │
│ loaded (cached)    │              │ loading           │
│                    │              │                   │
│ • Check complete   │              │ • Set src         │
│ • Decode if needed │              │ • Wait for load   │
│ • Call onLoad()    │              │ • Decode if needed│
│                    │              │ • Call onLoad()   │
└───────────────────┘              └───────────────────┘
        │                                      │
        └──────────────────┬──────────────────┘
                           ↓
              ┌────────────────────────┐
              │ handleProgress()       │
              │                        │
              │ • Increment loadedCount│
              │ • Calculate percentage │
              │ • Call onProgress()    │
              │ • Call onImageLoad()   │
              └────────────────────────┘
```

### Code flow example

```javascript
// In Preloader.js
preloadImages({
  images: this.images,  // [img1, img2, img3] - 3 images
  onProgress: (loaded, total, percentage) => {
    // This fires 3 times:
    // 1st: loaded=1, total=3, percentage=33
    // 2nd: loaded=2, total=3, percentage=67
    // 3rd: loaded=3, total=3, percentage=100
    this.imagesLoaded = loaded;
    this.percentage = percentage;
  },
  onImageLoad: (element, index) => {
    // This also fires 3 times:
    // 1st: element=img1, index=0
    // 2nd: element=img2, index=1
    // 3rd: element=img3, index=2
    // You could do per-image operations here
  }
})
```

### Internal callback chain

```javascript
// Inside Images.js - loadSingleImage()
loadSingleImage({
  element: img1,
  onLoad: (img) => handleProgress(img, 0)
  //         ↑
  //         This is called when img1 loads
})

// Inside Images.js - handleProgress()
function handleProgress({ loaded, total, element, index, onProgress, onImageLoad }) {
  // loaded = 1 (first image)
  // total = 3
  // percentage = 33
  
  if (onProgress) {
    onProgress(1, 3, 33);  // ← Calls your callback!
  }
  
  if (onImageLoad) {
    onImageLoad(element, 0);  // ← Calls your callback!
  }
}
```

## Real-world example: Preloader

```javascript
// Preloader.js - createLoader()
preloadImages({
  images: this.images,  // [img1, img2, img3]
  
  onProgress: (loaded, total, percentage) => {
    // Image 1 loads → loaded=1, total=3, percentage=33
    this.imagesLoaded = 1;           // Update state
    this.percentage = 33;            // Update percentage
    this.elements.counter.innerHTML = "33%";  // Update UI
    
    // Image 2 loads → loaded=2, total=3, percentage=67
    this.imagesLoaded = 2;
    this.percentage = 67;
    this.elements.counter.innerHTML = "67%";
    
    // Image 3 loads → loaded=3, total=3, percentage=100
    this.imagesLoaded = 3;
    this.percentage = 100;
    this.elements.counter.innerHTML = "100%";
    
    // All done! Trigger animation
    if (loaded === total && !this.animationStarted) {
      this.animationStarted = true;
      this.preloaderAnimation();
    }
  }
})
```

## Real-world example: PageManager (no callbacks)

```javascript
// PageManager.js - updateFields()
await preloadImages({
  images: "img[data-src]",
  container: this.pageContainer,
  // No onProgress - don't need progress tracking
  // No onImageLoad - don't need per-image handling
  // Just wait for all images to load
});

// Code continues here after all images are loaded
await nextPaint();
```

## When to use each callback

### Use `onProgress` when:
- Showing a progress bar or percentage
- Updating UI based on overall progress
- Triggering actions at specific completion percentages
- Tracking loading state

### Use `onImageLoad` when:
- Performing per-image operations (e.g., fade in)
- Logging specific images
- Image-specific validation or processing
- Tracking which images loaded

### Use both when:
- You need both aggregate progress and per-image details
- Example: "Loading image 3 of 10 (30%)" + fade in image 3

## Callback timing

```javascript
// Timeline example with 3 images:

Time 0ms:   preloadImages() starts
Time 50ms:  img1 loads → onProgress(1, 3, 33) → onImageLoad(img1, 0)
Time 200ms: img2 loads → onProgress(2, 3, 67) → onImageLoad(img2, 1)
Time 350ms: img3 loads → onProgress(3, 3, 100) → onImageLoad(img3, 2)
Time 350ms: Promise resolves, code continues
```

## Summary

1. `onProgress`: Aggregate progress (loaded count, total, percentage)
2. `onImageLoad`: Per-image details (element, index)
3. Both are optional: use what you need
4. They fire synchronously: same timing, different data
5. They fire after decode: if `useDecode: true`, callbacks fire after decode completes

The callbacks let you react to loading progress without exposing internal loading logic.