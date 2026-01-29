# Image Preloading Utilities Documentation

## Table of Contents

- [Introduction](#introduction)
  - [Key Features](#key-features)
  - [Module Structure](#module-structure)
- [Public API Functions](#public-api-functions)
  - [`preloadImages(options)`](#preloadimagesoptions)
  - [`loadSingleImage(options)`](#loadsingleimageoptions)
  - [`normalizeImages(images, container)`](#normalizeimagesimages-container)
  - [`isImageLoaded(element)`](#isimageloadedelement)
  - [`loadImageOffDOM(src)`](#loadimageoffdomsrc)
  - [`waitForElementLoad(element)`](#waitforelementloadelement)
  - [`decodeImage(element)`](#decodeimageelement)
- [Composition Patterns](#composition-patterns)
  - [Pattern 1: `preloadImages` Internal Composition](#pattern-1-preloadimages-internal-composition)
  - [Pattern 2: Priority-Based Loading](#pattern-2-priority-based-loading)
  - [Pattern 3: Viewport-Based Conditional Loading](#pattern-3-viewport-based-conditional-loading)
  - [Pattern 4: Sequential Loading with Progress](#pattern-4-sequential-loading-with-progress)
  - [Pattern 5: Parallel with Concurrency Limit](#pattern-5-parallel-with-concurrency-limit)
  - [Pattern 6: Custom Flow with Individual Utilities](#pattern-6-custom-flow-with-individual-utilities)
- [Flow Charts](#flow-charts)
  - [Main Entry Point Flow (`preloadImages`)](#main-entry-point-flow-preloadimages)
  - [Single Image Loading Flow (`loadSingleImage`)](#single-image-loading-flow-loadsingleimage)
  - [`loadImageWithDecode` Flow (Decode-Before-DOM)](#loadimagewithdecode-flow-decode-before-dom)
  - [`loadImageWithoutDecode` Flow (Traditional)](#loadimagewithoutdecode-flow-traditional)
  - [Progress Tracking Flow](#progress-tracking-flow)
  - [Complete Call Sequence Diagram](#complete-call-sequence-diagram)
- [Function Dependency Map](#function-dependency-map)
- [Decision Points](#decision-points)

---

## Introduction

The `Images.js` module provides a comprehensive set of utilities for image preloading, lazy loading, and decode support. It's designed to handle various image loading scenarios with support for progress tracking, decode-before-DOM strategies, and flexible input types.

### Key Features

- **Decode-before-DOM**: Prevents flicker by decoding images off-DOM before setting them on DOM elements
- **Progress Tracking**: Built-in support for progress callbacks during batch loading
- **Flexible Input Types**: Accepts CSS selectors, arrays, NodeLists, or single elements
- **Smart Caching**: Automatically detects and skips already-loaded images
- **Error Handling**: Graceful error handling that doesn't break batch operations
- **Composable Design**: Functions can be combined for custom loading strategies

### Module Structure

The module exports both high-level batch loading functions and low-level utilities that can be composed for custom use cases. All functions are designed to work together seamlessly.

---

## Public API Functions

### `preloadImages(options)`

Main entry point for batch image preloading. Handles multiple images in parallel with optional progress tracking.

**Signature:**
```javascript
async function preloadImages({
  images,
  container = document,
  onProgress,
  onImageLoad,
  excludePreloader = false,
  useDecode = true,
} = {})
```

**Returns:** `Promise<{loaded: number, total: number, images: HTMLElement[]}>`

**Parameters:**
- `images` - Array of image elements, NodeList, CSS selector string, or single element
- `container` - Container to search in (default: `document`)
- `onProgress` - Callback: `(loaded, total, percentage) => void`
- `onImageLoad` - Callback: `(imageElement, index) => void`
- `excludePreloader` - Exclude images inside `.preloader` (default: `false`)
- `useDecode` - Use `decode()` for layout-ready images (default: `true`)

**Use Cases:**

1. **Page Manager - Wait for page images** (`PageManager.js`):
```javascript
async waitForPageReady() {
  await preloadImages({
    images: SELECTORS.LAZY_IMAGES,
    container: this.pageContainer,
    excludePreloader: true,
    useDecode: true,
  });
  await nextPaint(); // Wait for layout calculation
}
```

2. **Preloader Component - Progress tracking** (`Preloader.js`):
```javascript
preloadImages({
  images: this.images,
  excludePreloader: true,
  useDecode: true,
  onProgress: (loaded, total, percentage) => {
    this.imagesLoaded = loaded;
    this.percentage = percentage;
    if (this.elements.counter) {
      this.elements.counter.innerHTML = `${percentage}%`;
    }
  }
});
```

3. **Transitions Manager - Preload transition images** (`TransitionsManager.js`):
```javascript
async preloadAllTransitionImages() {
  const imageElements = this.getAllTransitionImageElements();
  if (imageElements.length === 0) return;

  await preloadImages({
    images: imageElements,
    container: this.transitionTemplates,
    useDecode: true,
    onImageLoad: (img) => {
      if (img.dataset?.src) {
        this.preloadedImageUrls.add(img.dataset.src);
      }
    }
  });
}
```

---

### `loadSingleImage(options)`

Loads a single image with decode support. When `useDecode` is true, decodes the image off-DOM before setting src on the DOM element to prevent flicker.

**Signature:**
```javascript
async function loadSingleImage({
  element,
  index,
  useDecode = true,
  onLoad
})
```

**Returns:** `Promise<HTMLImageElement|null>` - Resolves with the loaded element, or `null` on error

**Parameters:**
- `element` - Image element to load (required)
- `index` - Index of the image (optional, for progress tracking)
- `useDecode` - Whether to use `decode()` (default: `true`)
- `onLoad` - Callback when image loads: `(element) => void`

**Use Cases:**

1. **Lazy Image Loader - Viewport-based loading** (`LazyImageLoader.js`):
```javascript
async loadImage(imgElement) {
  if (this.loadedImages.has(imgElement) || isImageLoaded(imgElement)) {
    return; // Already loaded
  }

  this.loadedImages.add(imgElement);
  
  await loadSingleImage({
    element: imgElement,
    useDecode: this.useDecode,
    onLoad: (img) => {
      this.onImageLoad?.(img);
    }
  });
}
```

2. **Hero image loading**:
```javascript
async function loadHeroImage() {
  const heroImg = document.querySelector('#hero-image');
  await loadSingleImage({ 
    element: heroImg, 
    useDecode: true 
  });
}
```

3. **Transition image preparation**:
```javascript
async ensureImageReady(imgElement) {
  if (isImageLoaded(imgElement)) {
    return imgElement; // Already cached
  }
  
  return await loadSingleImage({
    element: imgElement,
    useDecode: true
  });
}
```

---

### `normalizeImages(images, container)`

Normalizes various image input types into an array of image elements. Handles CSS selectors, NodeLists, arrays, single elements, or defaults to finding all lazy images.

**Signature:**
```javascript
function normalizeImages(images, container = document)
```

**Returns:** `HTMLImageElement[]`

**Parameters:**
- `images` - CSS selector string, NodeList, array, single element, or `null`/`undefined`
- `container` - Container to search in (default: `document`)

**Use Cases:**

1. **Lazy Image Loader - Initialize images** (`LazyImageLoader.js`):
```javascript
constructor(selector, options = {}) {
  this.images = normalizeImages(selector, container);
  // Now can observe all images
}
```

2. **Dynamic image addition**:
```javascript
addImages(selector) {
  const newImages = normalizeImages(selector, this.container);
  newImages.forEach(img => {
    if (!this.images.includes(img)) {
      this.images.push(img);
    }
  });
}
```

3. **Flexible input handling**:
```javascript
// All of these work:
normalizeImages('img[data-src]');                    // CSS selector
normalizeImages(document.querySelectorAll('img'));   // NodeList
normalizeImages([img1, img2, img3]);                 // Array
normalizeImages(singleImgElement);                   // Single element
normalizeImages();                                    // Default: all lazy images
```

---

### `isImageLoaded(element)`

Checks if an image is already loaded (cached). Useful for skipping already-loaded images to avoid redundant work.

**Signature:**
```javascript
function isImageLoaded(element)
```

**Returns:** `boolean` - `true` if image is loaded and has dimensions

**Use Cases:**

1. **Lazy Image Loader - Skip loaded images** (`LazyImageLoader.js`):
```javascript
observe() {
  this.images.forEach(img => {
    if (!this.loadedImages.has(img) && !isImageLoaded(img)) {
      this.observer.observe(img);
    }
  });
}
```

2. **Conditional loading**:
```javascript
async function loadIfNeeded(imgElement) {
  if (isImageLoaded(imgElement)) {
    return imgElement; // Already loaded, skip
  }
  
  return await loadSingleImage({ element: imgElement });
}
```

3. **Filter already-loaded images**:
```javascript
const imagesToLoad = allImages.filter(img => !isImageLoaded(img));
await Promise.all(imagesToLoad.map(img => loadSingleImage({ element: img })));
```

---

### `loadImageOffDOM(src)`

Loads an image off-DOM and returns a Promise. Useful for preloading images without adding them to the DOM, or for decode-before-DOM strategies.

**Signature:**
```javascript
function loadImageOffDOM(src)
```

**Returns:** `Promise<HTMLImageElement>` - Resolves with loaded Image instance

**Use Cases:**

1. **Preload without DOM**:
```javascript
// Preload image without adding to DOM
const img = await loadImageOffDOM('/path/to/image.jpg');
// Image is cached, can now use it instantly
```

2. **Decode-before-DOM strategy** (used internally by `loadImageWithDecode`):
```javascript
// Load and decode off-DOM, then set on DOM element
const tempImg = await loadImageOffDOM(dataSrc);
await tempImg.decode();
element.src = dataSrc; // Will be instant since cached
```

3. **Image validation**:
```javascript
async function validateImageUrl(url) {
  try {
    await loadImageOffDOM(url);
    return true; // Image exists and loads
  } catch {
    return false; // Image failed to load
  }
}
```

---

### `waitForElementLoad(element)`

Waits for a DOM element to load (or returns immediately if already complete). Returns a Promise that resolves when the element's `load` or `error` event fires.

**Signature:**
```javascript
function waitForElementLoad(element)
```

**Returns:** `Promise<void>`

**Use Cases:**

1. **Wait for DOM element** (used internally):
```javascript
element.src = dataSrc;
await waitForElementLoad(element); // Wait for load event
```

2. **Custom loading flow**:
```javascript
async function customLoad(imgElement, src) {
  imgElement.src = src;
  await waitForElementLoad(imgElement);
  // Image is now loaded
}
```

---

### `decodeImage(element)`

Decodes an image to ensure it's layout-ready. Uses the browser's native `decode()` API when available. See [HTML spec on decoding images](https://html.spec.whatwg.org/multipage/images.html#decoding-images).

**Signature:**
```javascript
async function decodeImage(element)
```

**Returns:** `Promise<HTMLImageElement>` - Always resolves with the element (even if decode fails)

**Use Cases:**

1. **Ensure layout-ready**:
```javascript
const img = await loadImageOffDOM(src);
await decodeImage(img); // Decode before adding to DOM
element.src = src; // Will render without flicker
```

2. **Post-load decode** (fallback strategy):
```javascript
element.addEventListener('load', async () => {
  await decodeImage(element); // Decode after load
});
```

---

## Composition Patterns

The functions in `Images.js` are designed to be composable. Here are common patterns for combining them:

### Pattern 1: `preloadImages` Internal Composition

`preloadImages` is itself a composition of smaller functions:

```javascript
// preloadImages internally composes:
// 1. prepareImages() → normalizeImages() + excludePreloaderImages()
// 2. createProgressTracker() → handleImageProgress()
// 3. loadSingleImage() for each image
// 4. Promise.all() to wait for all

export async function preloadImages(options) {
  const imageElements = prepareImages(...);
  const trackProgress = createProgressTracker(...);
  
  const imagePromises = imageElements.map((element, index) => {
    return loadSingleImage({
      element,
      index,
      useDecode,
      onLoad: (img) => trackProgress(img, index) // Compose with progress
    });
  });
  
  await Promise.all(imagePromises);
}
```

### Pattern 2: Priority-Based Loading

Load images in priority order by composing `normalizeImages` and `loadSingleImage`:

```javascript
import { 
  normalizeImages, 
  loadSingleImage, 
  isImageLoaded 
} from './utilities/Images.js';

async function loadImagesByPriority(selector, prioritySelector) {
  // Compose: normalize → filter → load
  const allImages = normalizeImages(selector);
  const priorityImages = normalizeImages(prioritySelector);
  const regularImages = allImages.filter(img => !priorityImages.includes(img));
  
  // Load priority images first
  await Promise.all(
    priorityImages.map(img => 
      loadSingleImage({ element: img, useDecode: true })
    )
  );
  
  // Then load regular images
  await Promise.all(
    regularImages.map(img => 
      loadSingleImage({ element: img, useDecode: true })
    )
  );
}
```

### Pattern 3: Viewport-Based Conditional Loading

Load only visible images by composing `normalizeImages`, `isImageLoaded`, and `loadSingleImage`:

```javascript
import { 
  normalizeImages, 
  loadSingleImage, 
  isImageLoaded
} from './utilities/Images.js';

async function loadVisibleImages(container) {
  // Compose: normalize → filter → check → load
  const images = normalizeImages('img[data-src]', container);
  
  const visibleImages = images.filter(img => {
    const rect = img.getBoundingClientRect();
    return rect.top < window.innerHeight;
  });
  
  // Load visible images, skip already loaded
  const promises = visibleImages
    .filter(img => !isImageLoaded(img))
    .map(img => loadSingleImage({ 
      element: img, 
      useDecode: true 
    }));
  
  await Promise.all(promises);
}
```

**Real-world example** - `LazyImageLoader.js` uses this pattern with Intersection Observer:
```javascript
// LazyImageLoader composes normalizeImages, isImageLoaded, and loadSingleImage
this.images = normalizeImages(selector, container);
// ... Intersection Observer setup ...
if (!isImageLoaded(img)) {
  await loadSingleImage({ element: img, useDecode: true });
}
```

### Pattern 4: Sequential Loading with Progress

Load images one at a time for bandwidth control:

```javascript
import { normalizeImages, loadSingleImage } from './utilities/Images.js';

async function loadImagesSequentially(selector, onProgress) {
  const images = normalizeImages(selector);
  let loaded = 0;
  
  // Compose: normalize → reduce → load sequentially
  for (const img of images) {
    await loadSingleImage({ 
      element: img, 
      useDecode: true,
      onLoad: () => {
        loaded++;
        onProgress?.(loaded, images.length);
      }
    });
  }
}
```

### Pattern 5: Parallel with Concurrency Limit

Load images in batches to limit concurrent network requests:

```javascript
import { normalizeImages, loadSingleImage } from './utilities/Images.js';

async function loadImagesWithLimit(selector, maxConcurrent = 3) {
  const images = normalizeImages(selector);
  const results = [];
  
  // Compose: normalize → chunk → load in batches
  for (let i = 0; i < images.length; i += maxConcurrent) {
    const batch = images.slice(i, i + maxConcurrent);
    const batchResults = await Promise.all(
      batch.map(img => loadSingleImage({ element: img, useDecode: true }))
    );
    results.push(...batchResults);
  }
  
  return results;
}
```

### Pattern 6: Custom Flow with Individual Utilities

Compose individual utilities for completely custom behavior:

```javascript
import { 
  loadImageOffDOM,
  decodeImage,
  waitForElementLoad,
  isImageLoaded 
} from './utilities/Images.js';

async function customImageLoad(imgElement, src) {
  // Compose individual utilities for custom behavior
  if (isImageLoaded(imgElement)) {
    return imgElement;
  }
  
  // Load off-DOM
  const tempImg = await loadImageOffDOM(src);
  
  // Decode
  await decodeImage(tempImg);
  
  // Set on DOM element
  imgElement.src = src;
  
  // Wait for DOM element
  await waitForElementLoad(imgElement);
  
  return imgElement;
}
```

---

## Flow Charts

### Main Entry Point Flow (`preloadImages`)

```
┌─────────────────────────────────────────────────────────────┐
│                    preloadImages()                            │
│              (Public API - Entry Point)                      │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │   prepareImages()             │
        │   - normalizeImages()          │
        │   - excludePreloaderImages()   │
        └───────────────┬───────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │   createProgressTracker()      │
        │   (Returns tracking function) │
        └───────────────┬───────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │   For each image:              │
        │   loadSingleImage()            │
        └───────────────┬───────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │   Promise.all()               │
        │   (Wait for all images)       │
        └───────────────┬───────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │   Return results              │
        │   {loaded, total, images}     │
        └───────────────────────────────┘
```

### Single Image Loading Flow (`loadSingleImage`)

```
┌─────────────────────────────────────────────────────────────┐
│                    loadSingleImage()                         │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │   isImageLoaded(element)?      │
        └───────┬───────────────┬────────┘
                │ YES           │ NO
                ▼               ▼
    ┌───────────────────┐   ┌──────────────────────┐
    │ handleImageReady()│   │ Get data-src attr     │
    │   └─> decodeImage()│   └───────┬──────────────┘
    └───────────────────┘           │
                                    ▼
                        ┌──────────────────────────┐
                        │ dataSrc exists?           │
                        └───────┬──────────┬────────┘
                                │ NO       │ YES
                                ▼          ▼
                    ┌──────────────────┐ ┌──────────────────────┐
                    │ handleImageReady()│ │ getImageLoader()     │
                    │   └─> decodeImage()│ │   (Strategy selector)│
                    └──────────────────┘ └───────┬───────────────┘
                                                │
                        ┌───────────────────────┴───────────────┐
                        │                                         │
                        ▼                                         ▼
        ┌──────────────────────────┐        ┌──────────────────────────┐
        │ loadImageWithDecode()     │        │ loadImageWithoutDecode()│
        │ (Decode before DOM)       │        │ (Traditional onload)      │
        └───────────┬───────────────┘        └───────────┬──────────────┘
                    │                                    │
                    │                                    │
```

### `loadImageWithDecode` Flow (Decode-Before-DOM)

```
┌─────────────────────────────────────────────────────────────┐
│              loadImageWithDecode()                            │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │   loadImageOffDOM(dataSrc)     │
        │   (Creates temp Image off-DOM) │
        └───────────────┬────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │   decodeImageOffDOM(tempImg)   │
        │   (Decodes temp image)         │
        └───────────────┬────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │   element.src = dataSrc        │
        │   (Set src on DOM element)     │
        └───────────────┬────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │   waitForElementLoad(element) │
        │   (Wait for DOM element)      │
        └───────────────┬────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │   onLoad?.(element)           │
        │   Return element              │
        └───────────────────────────────┘
                        │
                        │ (On Error)
                        ▼
        ┌───────────────────────────────┐
        │   handleImageError()           │
        │   Return null                  │
        └───────────────────────────────┘
```

### `loadImageWithoutDecode` Flow (Traditional)

```
┌─────────────────────────────────────────────────────────────┐
│           loadImageWithoutDecode()                           │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │   Create AbortController       │
        │   Add event listeners          │
        │   element.src = dataSrc        │
        └───────────────┬────────────────┘
                        │
        ┌───────────────┴───────────────┐
        │                                │
        ▼                                ▼
┌──────────────────┐          ┌──────────────────┐
│  'load' event    │          │  'error' event   │
│  fires           │          │  fires           │
└────────┬─────────┘          └────────┬─────────┘
         │                              │
         │                              │
         ▼                              ▼
┌──────────────────┐          ┌──────────────────┐
│ controller.abort()│          │ controller.abort()│
│ decodeImage()?   │          │ onLoad?.(element)│
│ onLoad?.(element)│          │ resolve(null)     │
│ resolve(element) │          └──────────────────┘
└──────────────────┘
```

### Progress Tracking Flow

```
┌─────────────────────────────────────────────────────────────┐
│              trackProgress(element, index)                   │
│         (Returned from createProgressTracker)                │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │   Increment loadedCount        │
        └───────────────┬────────────────┘
                        │
                        ▼
        ┌───────────────────────────────┐
        │   handleImageProgress()        │
        │   - Calculate percentage       │
        │   - Call onProgress?()         │
        │   - Call onImageLoad?()         │
        └───────────────────────────────┘
```

### Complete Call Sequence Diagram

```
preloadImages()
    │
    ├─> prepareImages()
    │       ├─> normalizeImages()
    │       │       └─> Uses: SELECTORS.LAZY_IMAGES
    │       └─> excludePreloaderImages()
    │               └─> Uses: SELECTORS.PRELOADER
    │
    ├─> createProgressTracker()
    │       └─> Returns: trackProgress function
    │
    └─> For each image:
            └─> loadSingleImage()
                    │
                    ├─> isImageLoaded()? YES
                    │       └─> handleImageReady()
                    │               └─> decodeImage()
                    │
                    ├─> Get dataSrc (ATTRIBUTES.DATA_SRC)
                    │   └─> No dataSrc? YES
                    │           └─> handleImageReady()
                    │
                    └─> getImageLoader()
                            │
                            ├─> useDecode && element.decode? YES
                            │       └─> loadImageWithDecode()
                            │               ├─> loadImageOffDOM()
                            │               ├─> decodeImageOffDOM()
                            │               ├─> waitForElementLoad()
                            │               └─> On error: handleImageError()
                            │
                            └─> Otherwise
                                    └─> loadImageWithoutDecode()
                                            ├─> Sets up event listeners
                                            ├─> On 'load': decodeImage()?
                                            └─> On 'error': resolve(null)
```

---

## Function Dependency Map

```
┌─────────────────────────────────────────────────────────────┐
│                      Helper Functions                         │
├─────────────────────────────────────────────────────────────┤
│  • loadImageOffDOM()          (Promise helper)               │
│  • waitForElementLoad()       (Promise helper)               │
│  • decodeImageOffDOM()        (Decode helper)                │
│  • decodeImage()              (Decode helper)               │
│  • handleImageError()         (Error handler)                │
│  • handleImageReady()         (Early return handler)         │
│  • getImageLoader()            (Strategy selector)           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Loading Strategies                         │
├─────────────────────────────────────────────────────────────┤
│  • loadImageWithDecode()      (Uses: loadImageOffDOM,        │
│                                 decodeImageOffDOM,           │
│                                 waitForElementLoad,          │
│                                 handleImageError)            │
│                                                              │
│  • loadImageWithoutDecode()   (Uses: decodeImage,           │
│                                 AbortController)             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Core Functions                            │
├─────────────────────────────────────────────────────────────┤
│  • loadSingleImage()          (Uses: isImageLoaded,          │
│                                 handleImageReady,            │
│                                 getImageLoader)              │
│                                                              │
│  • prepareImages()           (Uses: normalizeImages,        │
│                                 excludePreloaderImages)     │
│                                                              │
│  • createProgressTracker()   (Uses: handleImageProgress)    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Public API                                │
├─────────────────────────────────────────────────────────────┤
│  • preloadImages()            (Uses: prepareImages,         │
│                                 createProgressTracker,      │
│                                 loadSingleImage)             │
└─────────────────────────────────────────────────────────────┘
```

---

## Decision Points

The image loading flow makes decisions at several key points:

1. **Image already loaded?** → `handleImageReady()` - Skip loading, just decode if needed
2. **No `data-src` attribute?** → `handleImageReady()` - Image has no source to load
3. **`useDecode` and `element.decode` supported?** → `loadImageWithDecode()` else → `loadImageWithoutDecode()`
4. **Error during loading?** → `handleImageError()` - Return `null`, continue with other images

This shows the flow from entry point through helper functions to the final result.
