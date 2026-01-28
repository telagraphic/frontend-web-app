# Page Lifecycle Hooks

## Overview

The `Page` class implements a hook-based lifecycle system similar to barba.js, allowing subclasses to execute custom code at specific points during page creation, showing, hiding, and destruction.

This system uses optional chaining (`?.()`), meaning hooks are only called if defined in the subclass. This allows subclasses to implement only the hooks they need.

## Lifecycle Hooks

The Page class provides optional lifecycle hooks that subclasses can implement:

### Creation Hooks
- `beforeCreate()` - Called before page elements are created
- `afterCreate()` - Called after page is fully initialized

### Visibility Hooks
- `beforeShow()` - Called before page becomes visible (before transition hides)
- `afterShow()` - Called after page is visible (after transition completes)
- `beforeHide()` - Called before page hides (before transition shows)
- `afterHide()` - Called after page is hidden (after destroy completes)

### Destruction Hooks
- `beforeDestroy()` - Called before page cleanup begins
- `afterDestroy()` - Called after page cleanup completes

## Hook Implementation

Hooks are implemented using optional chaining (`?.()`), meaning they're only called if defined in the subclass. This allows subclasses to implement only the hooks they need.

```javascript
// In a subclass
async beforeHide() {
  // Custom animation logic here
  await this.animateTextOut();
  await this.animateImagesOut();
}
```

## Lifecycle Flow

### Page Creation Flow

```
Router.startPageUpdate()
  ↓
Page.create()
  ├─→ beforeCreate()?        ← Hook: Setup before creation
  ├─→ createElements()       ← Internal: Find DOM elements
  ├─→ createComponents()     ← Internal: Setup footnotes, etc.
  ├─→ createPageAnimations() ← Internal: Setup animations
  ├─→ createPage()           ← Internal: Setup event listeners
  └─→ afterCreate()?          ← Hook: Post-creation setup
```

### Page Show Flow

```
Router.afterPageUpdate()
  ↓
Page.show()
  ├─→ beforeShow()?                    ← Hook: Pre-show logic
  ├─→ Hide transition overlay          ← Internal: Fade out transition
  ├─→ Setup smooth scroll               ← Internal: Enable scrolling
  └─→ afterShow()?                     ← Hook: Post-show logic
```

### Page Hide Flow

```
User clicks internal link
  ↓
Router.startPageUpdate()
  ↓
CurrentPage.hide(route)
  ├─→ beforeHide()?                    ← Hook: Pre-hide animations
  │   └─→ Example: Animate text with SplitText
  │   └─→ Example: Animate images out
  ├─→ Update transition overlay         ← Internal: Prepare transition image
  ├─→ Show transition overlay           ← Internal: Fade in transition
  ├─→ destroy()                         ← Internal: Cleanup page state
  └─→ afterHide()?                     ← Hook: Post-hide cleanup
```

## Hook Execution Order

Hooks execute in a predictable order:

**On Page Load:**
1. `beforeCreate()` → `create()` → `afterCreate()`
2. `beforeShow()` → `show()` → `afterShow()`

**On Navigation:**
1. Current page: `beforeHide()` → `hide()` → `afterHide()`
2. New page: `beforeCreate()` → `create()` → `afterCreate()`
3. New page: `beforeShow()` → `show()` → `afterShow()`

**On Page Destroy:**
1. `beforeDestroy()` → `destroy()` → `afterDestroy()`

## Use Case Examples

### Example 1: Custom Exit Animations with GSAP SplitText

When clicking an internal link, you may want to animate page content out before the transition overlay appears. This can be done using `beforeHide()`:

```javascript
import Page from "./Page.js";
import { SplitText } from "gsap/SplitText";

export class CustomPage extends Page {
  async beforeHide() {
    // Animate text out using GSAP SplitText
    const textElements = this.elements.wrapper.querySelectorAll('h1, h2, p');
    const splitTexts = [];
    
    for (const element of textElements) {
      const split = new SplitText(element, { type: "chars" });
      splitTexts.push(split);
      
      gsap.to(split.chars, {
        opacity: 0,
        y: -20,
        duration: 0.3,
        stagger: 0.02,
        ease: "power2.in"
      });
    }
    
    // Animate images out simultaneously
    const images = this.elements.wrapper.querySelectorAll('img');
    gsap.to(images, {
      opacity: 0,
      scale: 0.9,
      duration: 0.4,
      stagger: 0.05,
      ease: "power2.in"
    });
    
    // Wait for animations to complete
    await gsap.to({}, { duration: 0.5 }); // Wait for longest animation
    
    // Cleanup SplitText instances
    splitTexts.forEach(split => split.revert());
  }
}
```

**Execution flow:**
1. `beforeHide()` is called when user clicks an internal link
2. Text is split and animated out character by character
3. Images fade and scale out simultaneously
4. After animations complete, the base `hide()` method continues
5. Transition overlay is prepared and shown
6. Page is destroyed

### Example 2: Custom Entrance Animations

Animate content in after the page transition completes:

```javascript
import Page from "./Page.js";

export class CustomPage extends Page {
  async afterShow() {
    // Animate content in after transition completes
    const content = this.elements.wrapper;
    gsap.from(content.children, {
      opacity: 0,
      y: 30,
      duration: 0.6,
      stagger: 0.1,
      ease: "power2.out"
    });
  }
}
```

### Example 3: Component Setup and Teardown

Setup custom components after page creation and cleanup before destruction:

```javascript
import Page from "./Page.js";

export class CustomPage extends Page {
  constructor(options) {
    super(options);
    this.customTimeline = null;
    this.customListeners = [];
  }

  async afterCreate() {
    // Setup custom components after page creation
    this.setupCustomInteractions();
    this.initializeCustomAnimations();
  }
  
  async beforeDestroy() {
    // Cleanup before page destruction
    this.customTimeline?.kill();
    this.removeCustomListeners();
  }
  
  setupCustomInteractions() {
    // Setup custom event listeners
    const button = this.elements.wrapper.querySelector('.custom-button');
    if (button) {
      const handler = () => this.handleCustomClick();
      button.addEventListener('click', handler);
      this.customListeners.push({ element: button, event: 'click', handler });
    }
  }
  
  removeCustomListeners() {
    // Remove all custom listeners
    this.customListeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.customListeners = [];
  }
}
```

### Example 4: Pre-show Preparation

Prepare page content before it becomes visible:

```javascript
import Page from "./Page.js";

export class CustomPage extends Page {
  async beforeShow() {
    // Prepare page content before transition completes
    this.preloadImages();
    this.setupScrollTriggers();
  }
  
  async afterShow() {
    // Trigger entrance animations after page is visible
    this.animatePageIn();
  }
  
  preloadImages() {
    const images = this.elements.wrapper.querySelectorAll('img[data-src]');
    images.forEach(img => {
      if (img.dataset.src) {
        img.src = img.dataset.src;
      }
    });
  }
  
  animatePageIn() {
    gsap.from(this.elements.wrapper.children, {
      opacity: 0,
      y: 20,
      duration: 0.5,
      stagger: 0.1,
      ease: "power2.out"
    });
  }
}
```

### Example 5: Complex Exit Animation Sequence

Coordinate multiple animations before hiding:

```javascript
import Page from "./Page.js";
import { SplitText } from "gsap/SplitText";

export class CustomPage extends Page {
  async beforeHide() {
    // Create master timeline for coordinated animations
    const masterTimeline = gsap.timeline();
    
    // Step 1: Animate headings with SplitText
    const headings = this.elements.wrapper.querySelectorAll('h1, h2');
    const splitTexts = [];
    
    headings.forEach(heading => {
      const split = new SplitText(heading, { type: "chars" });
      splitTexts.push(split);
      
      masterTimeline.to(split.chars, {
        opacity: 0,
        y: -30,
        duration: 0.4,
        stagger: 0.02,
        ease: "power2.in"
      }, 0); // Start at position 0 (simultaneous)
    });
    
    // Step 2: Animate images
    const images = this.elements.wrapper.querySelectorAll('img');
    masterTimeline.to(images, {
      opacity: 0,
      scale: 0.8,
      duration: 0.5,
      stagger: 0.05,
      ease: "power2.in"
    }, 0.1); // Start slightly after text
    
    // Step 3: Fade out background elements
    const backgrounds = this.elements.wrapper.querySelectorAll('[data-bg]');
    masterTimeline.to(backgrounds, {
      opacity: 0,
      duration: 0.3,
      ease: "power2.in"
    }, 0.2);
    
    // Wait for all animations to complete
    await masterTimeline;
    
    // Cleanup SplitText instances
    splitTexts.forEach(split => split.revert());
  }
}
```

## Best Practices

### Async Hooks
All hooks can be async functions. Use `await` for animations and async operations:

```javascript
async beforeHide() {
  await this.animateContentOut();
  await this.cleanupResources();
}
```

### Error Handling
Wrap hook logic in try/catch if needed to prevent errors from breaking the lifecycle:

```javascript
async beforeHide() {
  try {
    await this.animateContentOut();
  } catch (error) {
    console.warn('Animation failed:', error);
    // Continue with page hide even if animation fails
  }
}
```

### Cleanup
Use `afterHide()` or `afterDestroy()` for cleanup tasks:

```javascript
async afterHide() {
  // Cleanup after page is hidden
  this.customTimeline?.kill();
  this.removeEventListeners();
}
```

### Performance
Keep hook logic lightweight; heavy work should be deferred:

```javascript
async afterShow() {
  // Lightweight: Trigger animations immediately
  this.animatePageIn();
  
  // Heavy work: Defer to next frame
  requestAnimationFrame(() => {
    this.loadHeavyContent();
  });
}
```

### Idempotency
Hooks may be called multiple times; ensure they're safe to re-run:

```javascript
async beforeShow() {
  // Check if already initialized
  if (this._initialized) return;
  
  this.setupCustomComponents();
  this._initialized = true;
}
```

### Memory Management
Always cleanup resources in destroy hooks:

```javascript
async beforeDestroy() {
  // Kill GSAP timelines
  this.timeline?.kill();
  
  // Remove event listeners
  this.removeEventListeners();
  
  // Clear intervals/timeouts
  if (this.interval) {
    clearInterval(this.interval);
  }
}
```

## Integration with Router

The lifecycle hooks integrate seamlessly with the Router:

```javascript
// Router.startPageUpdate() calls:
currentPage.hide(route)  // Triggers beforeHide → hide → afterHide

// Router.afterPageUpdate() calls:
newPage.create()          // Triggers beforeCreate → create → afterCreate
newPage.show()            // Triggers beforeShow → show → afterShow
```

## Reference

See `app/pages/Page.js` for the base Page class implementation.
