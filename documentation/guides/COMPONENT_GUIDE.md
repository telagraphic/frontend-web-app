# Component Lifecycle Management Checklist

A comprehensive guide for creating, managing, and destroying components in your application.

## Table of Contents

1. [Lifecycle Phases Overview](#lifecycle-phases-overview)
2. [Phase 1: Constructor](#phase-1-constructor)
3. [Phase 2: Creation](#phase-2-creation)
4. [Phase 3: Update (Optional)](#phase-3-update-optional)
5. [Phase 4: Destruction](#phase-4-destruction)
6. [Quick Reference Checklist](#quick-reference-checklist)
7. [Common Patterns](#common-patterns)
8. [Anti-Patterns to Avoid](#anti-patterns-to-avoid)

---


## Lifecycle Phases Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    COMPONENT LIFECYCLE                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────┐
│ Constructor │
│             │
│ ✅ super()  │
│ ✅ Selectors│
│ ✅ Dependencies│
│ ✅ Flags    │
│ ✅ State    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   create()  │
│             │
│ ✅ Guard    │
│ ✅ super.create()│
│ ✅ Verify DOM│
│ ✅ Process  │
│ ✅ Listeners│
│ ✅ Init     │
│ ✅ Flag     │
└──────┬──────┘
       │
       ▼
┌─────────────┐      ┌─────────────┐
│   update()  │◄─────┤  (Optional) │
│             │      │             │
│ ✅ Guard    │      │ ✅ Update   │
│ ✅ Update   │      │ ✅ Re-render│
│ ✅ Render   │      └─────────────┘
└──────┬──────┘
       │
       │ (Component active)
       │
       ▼
┌─────────────┐
│  destroy()  │
│             │
│ ✅ Guard    │
│ ✅ Flag     │
│ ✅ Listeners│
│ ✅ Children │
│ ✅ Animations│
│ ✅ DOM      │
│ ✅ Refs     │
│ ✅ Tracking │
└─────────────┘
```

### Key Principles

1. **Constructor = Pure Configuration**
   - No DOM access
   - No side effects
   - Store selectors and dependencies

2. **Create = Initialization**
   - Idempotent guards
   - DOM access allowed
   - Set up listeners
   - Initialize state

3. **Destroy = Complete Cleanup**
   - Remove all listeners
   - Destroy child components
   - Clear all references
   - Set to null

4. **Always Track Event Listeners**
   - Store handler references
   - Remove in destroy()
   - Prevent memory leaks

5. **Use Idempotent Guards**
   - Prevent duplicate calls
   - Safe to call multiple times
   - Better error handling

---

## Phase 1: Constructor

**Purpose**: Pure configuration, no side effects, no DOM access.

### Checklist

| Task | Description | Required | Example |
|------|-------------|----------|---------|
| **1.1** | Call `super()` with selectors | ✅ Yes | `super({ element: ".preloader", elements: {...} })` |
| **1.2** | Store element selectors (strings) | ✅ Yes | `this.selector = ".preloader"` |
| **1.3** | Store child element selectors | ✅ Yes | `this.selectorChildren = { title: "h1" }` |
| **1.4** | Accept and store dependencies | ✅ If needed | `this.smoothScroll = smoothScroll` |
| **1.5** | Initialize state flags | ✅ Yes | `this._created = false`, `this._destroyed = false` |
| **1.6** | Initialize event handler tracking | ✅ If using events | `this._eventHandlers = new Map()` |
| **1.7** | Initialize empty DOM references | ✅ Yes | `this.element = null`, `this.elements = {}` |
| **1.8** | Initialize component-specific state | ✅ If needed | `this.imagesLoaded = 0` |

### ❌ DO NOT in Constructor

- ❌ Access DOM elements (`document.querySelector`)
- ❌ Access `this.element` or `this.elements` (they're null)
- ❌ Call async functions
- ❌ Register event listeners
- ❌ Create child components
- ❌ Perform side effects

### ✅ Constructor Example

```javascript
export class Preloader extends Component {
  constructor() {
    // ✅ 1.1-1.3: Call super with selectors
    super({
      element: ".preloader",
      elements: {
        title: ".preloader h1",
        counter: ".preloader-counter",
        images: "img[data-src]",
      },
    });
    
    // ✅ 1.4: Store dependencies (if any)
    // this.smoothScroll = smoothScroll;
    
    // ✅ 1.5: Initialize state flags
    this._created = false;
    this._destroyed = false;
    
    // ✅ 1.8: Initialize component-specific state
    this.imagesLoaded = 0;
    this.percentage = null;
    this.animationStarted = false;
  }
}
```

---

## Phase 2: Creation

**Purpose**: Initialize component, access DOM, set up event listeners.

### Checklist

| Task | Description | Required | Example |
|------|-------------|----------|---------|
| **2.1** | Check if already created (idempotent) | ✅ Yes | `if (this._created) return;` |
| **2.2** | Call `super.create()` | ✅ Yes | `super.create();` |
| **2.3** | Verify DOM elements exist | ⚠️ Recommended | `if (!this.element) return;` |
| **2.4** | Process/normalize element data | ✅ If needed | `this.images = selectImageOrImages(this.elements.images)` |
| **2.5** | Initialize child components | ✅ If needed | `this.footnotes = new Footnotes()` |
| **2.6** | Set up event listeners | ✅ If needed | `this.setupEventListeners()` |
| **2.7** | Initialize animations | ✅ If needed | `this.createAnimations()` |
| **2.8** | Start async operations | ✅ If needed | `this.preloadImages()` |
| **2.9** | Set `_created = true` | ✅ Yes | `this._created = true;` |

### Event Listener Setup Checklist

| Task | Description | Required | Example |
|------|-------------|----------|---------|
| **2.6.1** | Check if listeners already set up | ✅ Yes | `if (this._listenersSetup) return;` |
| **2.6.2** | Register internal event listeners | ✅ If needed | `this.on("event", handler)` |
| **2.6.3** | Register DOM event listeners | ✅ If needed | `element.addEventListener("click", handler)` |
| **2.6.4** | Track handlers for cleanup | ✅ Yes | Store in `_eventHandlers` Map |
| **2.6.5** | Set `_listenersSetup = true` | ✅ Yes | `this._listenersSetup = true;` |

### ✅ Creation Example

```javascript
async create() {
  // ✅ 2.1: Idempotent guard
  if (this._created) {
    console.warn("Preloader already created");
    return;
  }
  
  // ✅ 2.2: Call super.create() to initialize DOM
  super.create();
  
  // ✅ 2.3: Verify DOM elements exist
  if (!this.element) {
    console.warn("Preloader element not found");
    return;
  }
  
  // ✅ 2.4: Process element data
  this.images = selectImageOrImages(this.elements.images);
  this.images = this.images.filter(img => !img.closest(".preloader"));
  
  // ✅ 2.6: Set up event listeners
  this.setupEventListeners();
  
  // ✅ 2.8: Start async operations
  this.createLoader();
  
  // ✅ 2.9: Mark as created
  this._created = true;
}

setupEventListeners() {
  // ✅ 2.6.1: Idempotent guard
  if (this._listenersSetup) return;
  
  // ✅ 2.6.2: Register internal event listeners
  // (if needed)
  
  // ✅ 2.6.5: Mark as set up
  this._listenersSetup = true;
}
```

---

## Phase 3: Update (Optional)

**Purpose**: Update component state when data changes (not all components need this).

### Checklist

| Task | Description | Required | Example |
|------|-------------|----------|---------|
| **3.1** | Check if component is created | ✅ Yes | `if (!this._created) return;` |
| **3.2** | Update component state | ✅ If needed | `this.images = newImages` |
| **3.3** | Re-render/update DOM | ✅ If needed | `this.updateCounter()` |
| **3.4** | Re-register listeners if needed | ⚠️ If DOM changed | `this.setupEventListeners()` |

### ✅ Update Example

```javascript
update(newImages) {
  // ✅ 3.1: Check if created
  if (!this._created) {
    console.warn("Component not created yet");
    return;
  }
  
  // ✅ 3.2: Update state
  this.images = newImages;
  
  // ✅ 3.3: Update DOM
  this.updateCounter();
}
```

---

## Phase 4: Destruction

**Purpose**: Clean up all resources, remove listeners, clear references.

### Destruction Checklist

| Task | Description | Required | Example |
|------|-------------|----------|---------|
| **4.1** | Check if already destroyed (idempotent) | ✅ Yes | `if (this._destroyed) return;` |
| **4.2** | Set `_destroyed = true` | ✅ Yes | `this._destroyed = true;` |
| **4.3** | Remove all event listeners | ✅ Yes | `this.removeAllListeners()` |
| **4.4** | Remove DOM event listeners | ✅ Yes | `element.removeEventListener(...)` |
| **4.5** | Destroy child components | ✅ If needed | `this.footnotes.destroy()` |
| **4.6** | Clean up animations | ✅ If needed | `this.animation.kill()` |
| **4.7** | Cancel async operations | ✅ If needed | `this.abortController.abort()` |
| **4.8** | Remove DOM elements | ✅ If needed | `this.element.remove()` |
| **4.9** | Clear all references (set to null) | ✅ Yes | See table below |
| **4.10** | Reset state flags | ✅ Yes | `this._created = false;` |

### Reference Cleanup Checklist

| Reference Type | Action | Example |
|----------------|--------|---------|
| DOM elements | Set to `null` | `this.element = null;` |
| Element collections | Set to `null` | `this.elements = null;` |
| Child components | Destroy then `null` | `this.footnotes.destroy(); this.footnotes = null;` |
| Services (shared) | ⚠️ Usually don't clear | `// this.smoothScroll = null; // Shared service` |
| Services (owned) | Destroy then `null` | `this.animation.destroy(); this.animation = null;` |
| State variables | Set to `null` or reset | `this.images = null;` |
| Event handlers | Clear tracking | `this._eventHandlers.clear();` |
| Arrays/Objects | Set to `null` | `this.imagesLoaded = null;` |

### ✅ Destruction Example

```javascript
destroy() {
  // ✅ 4.1: Idempotent guard
  if (this._destroyed) {
    console.warn("Preloader already destroyed");
    return;
  }
  
  // ✅ 4.2: Mark as destroyed
  this._destroyed = true;
  this._created = false;
  
  // ✅ 4.3: Remove all event listeners
  this.removeAllListeners();
  
  // ✅ 4.5: Destroy child components (if any)
  // if (this.footnotes) {
  //   this.footnotes.destroy();
  // }
  
  // ✅ 4.6: Clean up animations (if any)
  // if (this.animation) {
  //   this.animation.kill();
  // }
  
  // ✅ 4.8: Remove DOM elements
  if (this.element) {
    this.element.remove();
  }
  
  // ✅ 4.9: Clear all references
  this.element = null;
  this.elements = null;
  this.images = null;
  this.imagesLoaded = null;
  this.percentage = null;
  this.animationStarted = false;
  
  // ✅ 4.10: Clear event handler tracking
  if (this._eventHandlers) {
    this._eventHandlers.clear();
  }
}
```

---

## Quick Reference Checklist

### Complete Component Template

```javascript
export class MyComponent extends Component {
  // ============================================
  // PHASE 1: CONSTRUCTOR
  // ============================================
  constructor(options = {}) {
    // ✅ 1.1: Call super with selectors
    super({
      element: options.element || ".my-component",
      elements: {
        ...options.elements,
      },
    });
    
    // ✅ 1.4: Store dependencies
    this.service = options.service;
    
    // ✅ 1.5: Initialize flags
    this._created = false;
    this._destroyed = false;
    this._listenersSetup = false;
    
    // ✅ 1.6: Initialize event tracking
    this._eventHandlers = new Map();
    
    // ✅ 1.8: Initialize state
    this.data = null;
  }
  
  // ============================================
  // PHASE 2: CREATION
  // ============================================
  async create() {
    // ✅ 2.1: Idempotent guard
    if (this._created) return;
    
    // ✅ 2.2: Call super
    super.create();
    
    // ✅ 2.3: Verify elements
    if (!this.element) {
      console.warn("Component element not found");
      return;
    }
    
    // ✅ 2.4: Process data
    this.processData();
    
    // ✅ 2.6: Set up listeners
    this.setupEventListeners();
    
    // ✅ 2.8: Start operations
    await this.initialize();
    
    // ✅ 2.9: Mark as created
    this._created = true;
  }
  
  setupEventListeners() {
    // ✅ 2.6.1: Idempotent guard
    if (this._listenersSetup) return;
    
    // ✅ 2.6.2: Register listeners
    this.on("custom-event", this.handleEvent);
    
    // ✅ 2.6.5: Mark as set up
    this._listenersSetup = true;
  }
  
  // ============================================
  // PHASE 3: UPDATE (Optional)
  // ============================================
  update(newData) {
    // ✅ 3.1: Check if created
    if (!this._created) return;
    
    // ✅ 3.2: Update state
    this.data = newData;
    
    // ✅ 3.3: Update DOM
    this.render();
  }
  
  // ============================================
  // PHASE 4: DESTRUCTION
  // ============================================
  destroy() {
    // ✅ 4.1: Idempotent guard
    if (this._destroyed) return;
    
    // ✅ 4.2: Mark as destroyed
    this._destroyed = true;
    this._created = false;
    
    // ✅ 4.3: Remove listeners
    this.removeAllListeners();
    
    // ✅ 4.8: Remove DOM
    if (this.element) {
      this.element.remove();
    }
    
    // ✅ 4.9: Clear references
    this.element = null;
    this.elements = null;
    this.data = null;
    this.service = null; // If owned, not shared
    
    // ✅ 4.10: Clear tracking
    if (this._eventHandlers) {
      this._eventHandlers.clear();
    }
  }
}
```

---

## Common Patterns

### Pattern 1: Idempotent Lifecycle

```javascript
create() {
  if (this._created) return; // ✅ Prevent duplicate calls
  // ... creation logic
  this._created = true;
}

destroy() {
  if (this._destroyed) return; // ✅ Prevent duplicate calls
  // ... cleanup logic
  this._destroyed = true;
}
```

### Pattern 2: Event Listener Tracking

```javascript
on(type, callback) {
  const handler = (event) => callback(event.detail);
  this.eventTarget.addEventListener(type, handler);
  
  // ✅ Track for cleanup
  if (!this._eventHandlers.has(type)) {
    this._eventHandlers.set(type, []);
  }
  this._eventHandlers.get(type).push(handler);
}

destroy() {
  // ✅ Remove all tracked listeners
  this.removeAllListeners();
}
```

### Pattern 3: Conditional Cleanup

```javascript
destroy() {
  // ✅ Safe cleanup with null checks
  if (this.animation) {
    this.animation.kill();
    this.animation = null;
  }
  
  if (this.footnotes) {
    this.footnotes.destroy();
    this.footnotes = null;
  }
}
```

### Pattern 4: Shared vs Owned Services

```javascript
constructor({ smoothScroll, footnotes }) {
  super({...});
  
  // ✅ Shared service - don't destroy
  this.smoothScroll = smoothScroll; // Shared across pages
  
  // ✅ Owned service - must destroy
  this.footnotes = new Footnotes(); // Owned by this component
}

destroy() {
  // ❌ Don't destroy shared services
  // this.smoothScroll.destroy(); // WRONG!
  
  // ✅ Do destroy owned services
  if (this.footnotes) {
    this.footnotes.destroy();
    this.footnotes = null;
  }
}
```

---

## Anti-Patterns to Avoid

### ❌ Anti-Pattern 1: DOM Access in Constructor

```javascript
// ❌ BAD
constructor() {
  super({...});
  this.element = document.querySelector(".preloader"); // ❌ DOM access
}

// ✅ GOOD
constructor() {
  super({ element: ".preloader" }); // ✅ Just selector
}
```

### ❌ Anti-Pattern 2: No Idempotent Guards

```javascript
// ❌ BAD
create() {
  super.create();
  this.setupEventListeners(); // ❌ Called multiple times = duplicate listeners
}

// ✅ GOOD
create() {
  if (this._created) return; // ✅ Guard
  super.create();
  this.setupEventListeners();
  this._created = true;
}
```

### ❌ Anti-Pattern 3: Forgetting to Remove Listeners

```javascript
// ❌ BAD
destroy() {
  this.element.remove();
  // ❌ Listeners still attached = memory leak
}

// ✅ GOOD
destroy() {
  this.removeAllListeners(); // ✅ Remove listeners first
  if (this.element) {
    this.element.remove();
  }
}
```

### ❌ Anti-Pattern 4: Not Clearing References

```javascript
// ❌ BAD
destroy() {
  this.element.remove();
  // ❌ this.element still references removed DOM
  // ❌ Can't be garbage collected
}

// ✅ GOOD
destroy() {
  if (this.element) {
    this.element.remove();
  }
  this.element = null; // ✅ Clear reference
}
```

### ❌ Anti-Pattern 5: Destroying Shared Services

```javascript
// ❌ BAD
destroy() {
  this.smoothScroll.destroy(); // ❌ Shared service used by other pages
  this.smoothScroll = null;
}

// ✅ GOOD
destroy() {
  // ✅ Don't destroy shared services
  // this.smoothScroll is shared, leave it alone
  // Only destroy services owned by this component
}
```



## Create Component Methods

### 1. `mount()` - DOM Access & Element Initialization

**Purpose**: Access and initialize DOM elements (Phase 2.3-2.4 from lifecycle guide)

**Responsibilities**:
- Access DOM elements using selectors
- Create element collections using `pageObject()`
- Store references to page-specific elements (`pageTransition`, `preloader`)
- Verify critical elements exist
- Perform initial scroll positioning

**Based on lifecycle guide**:
- ✅ **2.3**: Verify DOM elements exist
- ✅ **2.4**: Process/normalize element data

**What it should do**:
```javascript
async mount() {
  // Access main page element
  this.element = $("main[data-template]");
  
  // Verify critical element exists
  if (!this.element) {
    console.warn(`Page ${this.id}: Main element not found`);
    return false; // Return false if critical element missing
  }
  
  // Create element collections from selectors
  this.elements = pageObject(this.selectorChildren);
  
  // Store references to page-specific elements
  this.pageTransition = $(".page-transition-overlay");
  this.preloader = $(".preloader");
  
  // Initial scroll position (before components initialize)
  this.smoothScroll?.scrollTo(0, { immediate: true });
  
  return true; // Success
}
```

**Why separate**: DOM access is a distinct phase. Separating it makes testing easier and clarifies dependencies.

---

### 2. `initComponents()` - Initialize Child Components

**Purpose**: Initialize child components and services (Phase 2.5 from lifecycle guide)

**Responsibilities**:
- Initialize child components that depend on DOM elements
- Set up component-specific configurations
- Call component setup methods

**Based on lifecycle guide**:
- ✅ **2.5**: Initialize child components

**What it should do**:
```javascript
async initComponents() {
  // Initialize footnotes component (depends on DOM being mounted)
  if (this.footnotes) {
    this.footnotes.setup();
  }
  
  // Future: Initialize other child components here
  // if (this.gallery) {
  //   await this.gallery.create();
  // }
  
  // NOTE: smoothScroll is a shared service, not initialized here
  // It's passed in via constructor and managed externally
}
```

**Why separate**: Component initialization is distinct from DOM mounting. Some components may need async setup.

---

### 3. `initAnimations()` - Initialize Animations

**Purpose**: Create and initialize animations (Phase 2.7 from lifecycle guide)

**Responsibilities**:
- Create animation instances
- Initialize animation objects
- Store animations for later cleanup

**Based on lifecycle guide**:
- ✅ **2.7**: Initialize animations

**What it should do**:
```javascript
initAnimations() {
  // Initialize animations array
  this.animations = [];
  
  // Create title animations if elements exist
  if (this.elements.titleAnimations) {
    this.titleAnimations = [];
    
    this.elements.titleAnimations.forEach((element) => {
      this.titleAnimations.push(new Titles(element));
    });
    
    // Store in main animations array for cleanup
    if (this.titleAnimations?.length > 0) {
      this.animations.push(...this.titleAnimations);
    }
  }
  
  // Future: Initialize other animations
  // if (this.elements.parallaxElements) {
  //   this.parallaxAnimations = this.elements.parallaxElements.map(
  //     el => new Parallax(el)
  //   );
  //   this.animations.push(...this.parallaxAnimations);
  // }
}
```

**Why separate**: Animations are a distinct concern. Separating them makes the code clearer and easier to extend.

---

### 4. `ready()` - Final Setup & Event Listeners

**Purpose**: Complete final setup tasks (Phase 2.6, 2.8 from lifecycle guide)

**Responsibilities**:
- Set up event listeners
- Perform final initialization tasks
- Mark component as ready

**Based on lifecycle guide**:
- ✅ **2.6**: Set up event listeners
- ✅ **2.8**: Start async operations (if any final async tasks needed)

**What it should do**:
```javascript
async ready() {
  // Set up event listeners (idempotent guard already in setupEventListeners)
  this.setupEventListeners();
  
  // Future: Any final async operations
  // await this.preloadCriticalAssets();
  
  // Future: Emit ready event if needed
  // this.emit('page-ready', { pageId: this.id });
}
```

**Why separate**: Final setup tasks should run after everything else is initialized. This is the last step before the component is fully ready.

---

## Refactored `create()` Method

Here's how the refactored `create()` would orchestrate these functions:

```javascript
/**
 * Create a page object of elements
 * Initialize any other components for the page
 * Orchestrates: mount → initComponents → initAnimations → ready
 */
async create() {
  // ✅ 2.1: Idempotent guard (from lifecycle guide)
  if (this._created) {
    console.warn(`Page ${this.id}.create() called multiple times`);
    return;
  }

  // Lifecycle hook: before creation starts
  await this.beforeCreate?.();

  // Phase 1: Mount DOM elements
  const mounted = await this.mount();
  if (!mounted) {
    console.error(`Page ${this.id}: Failed to mount, aborting creation`);
    return;
  }

  // Phase 2: Initialize child components
  await this.initComponents();

  // Phase 3: Initialize animations
  this.initAnimations();

  // Phase 4: Final setup (event listeners, etc.)
  await this.ready();

  // ✅ 2.9: Mark as created (from lifecycle guide)
  this._created = true;

  // Lifecycle hook: after creation completes
  await this.afterCreate?.();
}
```

---

## Benefits of This Approach

1. Single responsibility: Each function has one clear purpose
2. Testability: Each phase can be tested independently
3. Extensibility: Easy to add new initialization steps
4. Debugging: Easier to identify which phase failed
5. Override points: Subclasses can override specific phases
6. Aligns with lifecycle guide: Follows the documented patterns

---

## Additional Considerations

### Error Handling
Each function can return a boolean or throw, allowing `create()` to handle failures:

```javascript
async create() {
  if (this._created) return;
  
  try {
    await this.beforeCreate?.();
    
    if (!(await this.mount())) {
      throw new Error(`Page ${this.id}: Mount failed`);
    }
    
    await this.initComponents();
    this.initAnimations();
    await this.ready();
    
    this._created = true;
    await this.afterCreate?.();
  } catch (error) {
    console.error(`Page ${this.id}: Creation failed:`, error);
    // Cleanup partial creation if needed
    throw error; // Let parent handle
  }
}
```


# Separating Configuration from Initialization in App.js

## Current Problem

Your constructor is doing too much:

```js
constructor() {
  setupHelpers();              // Side effect (modifies prototype)
  this.createServices();        // Creates state
  this.pageConfig = setupPageConfig(); // Configuration (okay)
  this.setupPages();           // DOM access, async operations
  this.setupApp();             // Event listeners
  this.setupEventListeners();  // Event listeners
  this.createPreloader();      // Creates components
}
```

**Issues:**
1. ❌ Mixing configuration and initialization
2. ❌ Side effects in constructor
3. ❌ Async operations (`setupPages()` is async but not awaited)
4. ❌ Hard to test
5. ❌ Can't create instance without initializing

---

## Solution: Two-Phase Initialization

### Pattern: Constructor (Config) + init() (Initialization)

**Phase 1: Constructor - Configuration Only**
- Store configuration
- Accept dependencies
- No side effects
- No DOM access
- No async operations

**Phase 2: init() - Initialization**
- All side effects
- DOM access
- Async operations
- Creates components

---

## Recommended Approach

### Option 1: init() Method (Recommended)

```js
class App {
  constructor() {
    // ✅ PHASE 1: Configuration only (pure)
    this.pageConfig = setupPageConfig();
    // Store selectors/configuration
    // No side effects
    // No DOM access
  }
  
  async init() {
    // ✅ PHASE 2: Initialization (side effects)
    setupHelpers();                    // Side effects
    this.createServices();             // Create state
    await this.setupPages();           // Async, DOM access
    this.setupApp();                   // Event listeners
    this.setupEventListeners();        // Event listeners
    this.createPreloader();            // Create components
  }
}

// Usage
const app = new App();  // ✅ Lightweight (just config)
await app.init();       // ✅ Initialize when ready
```

**Benefits:**
- ✅ Clean separation
- ✅ Testable (can create without init)
- ✅ Can delay initialization
- ✅ Clear lifecycle

---

## Detailed Refactoring

### Before (Current)

```js
class App {
  constructor() {
    // ❌ Mixing everything
    setupHelpers();              // Side effect
    this.createServices();      // Creates state
    this.pageConfig = setupPageConfig();
    this.setupPages();           // Async, DOM access (not awaited!)
    this.setupApp();             // Event listeners
    this.setupEventListeners();  // Event listeners
    this.createPreloader();      // Creates components
  }
}
```

### After (Recommended)

```js
class App {
  constructor() {
    // ✅ PHASE 1: Configuration only
    this.pageConfig = setupPageConfig();
    
    // Store references that don't require DOM
    this.pageHistory = window.history;
    
    // Initialize state containers
    this.pages = new Map();
    
    // No side effects, no DOM access, no async
  }
  
  async init() {
    // ✅ PHASE 2: Initialization with side effects
    
    // 1. Setup helpers (side effects)
    setupHelpers();
    
    // 2. Create services
    this.createServices();
    
    // 3. Setup pages (async, DOM access)
    await this.setupPages();
    
    // 4. Setup app (event listeners)
    this.setupApp();
    this.setupEventListeners();
    
    // 5. Create preloader
    this.createPreloader();
    
    // 6. Enable hot reload (side effect)
    liveReload();
  }
}

// Usage
const app = new App();  // ✅ Just configuration
await app.init();       // ✅ Initialize when ready
```

---

## Alternative: Grouped Methods

If you prefer keeping in constructor but better organized:

```js
class App {
  constructor() {
    // ✅ Configuration phase
    this.setupConfiguration();
    
    // ✅ Initialization phase
    this.init();
  }
  
  setupConfiguration() {
    // ✅ Pure configuration only
    this.pageConfig = setupPageConfig();
    this.pageHistory = window.history;
    this.pages = new Map();
    // No side effects
  }
  
  async init() {
    // ✅ All initialization with side effects
    setupHelpers();
    this.createServices();
    await this.setupPages();
    this.setupApp();
    this.setupEventListeners();
    this.createPreloader();
    liveReload();
  }
}
```

**But this still has problems:**
- ❌ Constructor still does async work (can't await)
- ❌ Can't test without initialization
- ❌ Less flexible

---

## Complete Refactored Example

```js
/**
 * Entry point for the application
 */
import { createServices } from "./services/ServicesFactory.js";
import { Preloader } from "./components/Preloader.js";
import { Navigation } from "./components/Navigation.js";
import { $, setupHelpers } from "./utils/Helpers.js";
import { liveReload, setupPageConfig } from "./utils/Environment.js";

class App {
  /**
   * Constructor: Configuration only (pure, no side effects)
   */
  constructor() {
    // ✅ Configuration: Setup page config
    this.pageConfig = setupPageConfig();
    
    // ✅ Configuration: Store references (no DOM lookup)
    this.pageHistory = window.history;
    
    // ✅ Configuration: Initialize state containers
    this.pages = new Map();
    
    // ✅ Configuration: Initialize flags
    this._initialized = false;
    
    // ❌ NO side effects
    // ❌ NO DOM access
    // ❌ NO async operations
  }
  
  /**
   * Initialize application (side effects, DOM access, async)
   * Call this after constructor
   */
  async init() {
    if (this._initialized) {
      console.warn('App.init() called multiple times');
      return;
    }
    this._initialized = true;
    
    // 1. Setup helpers (modifies prototypes)
    setupHelpers();
    
    // 2. Create services
    this.createServices();
    
    // 3. Setup pages (async, DOM access)
    await this.setupPages();
    
    // 4. Setup app event listeners
    this.setupApp();
    this.setupEventListeners();
    
    // 5. Create preloader
    this.createPreloader();
    
    // 6. Enable hot reload
    liveReload();
  }
  
  /**
   * Create the services for the application
   */
  createServices() {
    this.services = createServices();
    this.registry = this.services.registry;
    this.router = this.services.router;
    this.smoothScroll = this.services.smoothScroll;
    this.transitionManager = this.services.transitionManager;
  }
  
  /**
   * Set up app event listeners and router
   */
  setupApp() {
    // ✅ Guard DOM ready state
    if (document.readyState === 'loading') {
      document.addEventListener("DOMContentLoaded", () => {
        this.router.create();
        this.setupLinkListeners();
      });
    } else {
      // DOM already ready
      this.router.create();
      this.setupLinkListeners();
    }
  }
  
  // ... rest of methods ...
}

// ✅ Usage: Two-phase initialization
const app = new App();  // Lightweight configuration
await app.init();       // Initialize with side effects
```

---

## Benefits of Two-Phase Pattern

### 1. Testability

```js
// ✅ Can create instance without side effects
const app = new App();
expect(app.pageConfig).toBeDefined();

// ✅ Can test initialization separately
await app.init();
expect(app.services).toBeDefined();
```

### 2. Flexibility

```js
// ✅ Can delay initialization
const app = new App();
// Do other setup...
await app.init();

// ✅ Can conditionally initialize
if (shouldInit) {
  await app.init();
}
```

### 3. Error Handling

```js
try {
  const app = new App();  // ✅ Always succeeds (pure)
  await app.init();       // ✅ Can catch initialization errors
} catch (error) {
  // Handle initialization errors
}
```

### 4. SSR/Testing

```js
// ✅ Can create without DOM
const app = new App();

// ✅ Only initialize when DOM available
if (typeof document !== 'undefined') {
  await app.init();
}
```


# Constructor DOM Access: When It Works vs Best Practices

## Summary

**Your observation is correct:**
- DOM is ready when constructor runs in your flow ✅
- Code works as-is ✅

**But best practice still applies:**
- Constructor should be pure/configuration ✅
- DOM access in create() is better ✅

**Why?**
- Testability (most important) ✅
- Flexibility ✅
- Clear lifecycle ✅
- Reusability ✅

**Trade-off:**
- Slightly more code
- But much better architecture

**My recommendation:**
- Keep current code working
- Refactor incrementally when you touch files
- Focus on testable classes first
- Use best practice for new code

The goal isn't perfection - it's maintainable, testable code that works well over time.


## Your Observation: It Works!

You're absolutely right! In your current flow:

```js
async onPageChange(href) {
  // 1. Swap DOM and wait for readiness
  await this.router.updatePage(href, ...);
  //    ↑ DOM is now ready ✅
  
  // 2. Create Page instance
  const PageClass = await this.loadPage(this.router.template);
  this.currentPage = new PageClass({});
  //                  ↑ Constructor runs HERE
  //                  ↑ DOM IS ready at this point ✅
  
  // 3. Initialize
  await this.currentPage.create();
}
```

**Your constructor:**
```js
constructor({ id, element, elements}) {
  // DOM queries in constructor
  this.main = document.querySelector("main"); // ✅ Works! DOM is ready
  this.transitionManager = new TransitionManager(); // ✅ Works!
}
```

**You're correct:** The DOM is ready when `new PageClass()` is called, so this works!

## But Should You Do It? (Best Practice Question)

**Short answer:** Even though it works, it's still a best practice to avoid DOM in constructors.

## Why Avoid DOM in Constructors: The Real Reasons

### 1. **Testability** (Most Important)

**Problem:**
```js
// Page.js constructor with DOM access
constructor() {
  this.main = document.querySelector("main");
  this.transitionManager = new TransitionManager();
}

// Test:
describe('Page', () => {
  it('should initialize', () => {
    // ❌ FAILS: No DOM available in Node.js test environment!
    const page = new Page({ id: 'home' });
    // Error: document is not defined
  });
});
```

**Solution:**
```js
// Page.js constructor without DOM access
constructor({ id, element }) {
  this.id = id;
  this.selector = element;
  // No DOM access ✅
}

async create() {
  this.main = document.querySelector("main");
  this.transitionManager = new TransitionManager();
}

// Test:
describe('Page', () => {
  it('should initialize', () => {
    // ✅ WORKS: No DOM needed for constructor
    const page = new Page({ id: 'home', element: 'main' });
    expect(page.id).toBe('home');
    // Can test logic without DOM
  });
  
  it('should create with DOM', async () => {
    // Only need DOM for create()
    document.body.innerHTML = '<main>Test</main>';
    const page = new Page({ id: 'home', element: 'main' });
    await page.create();
    expect(page.main).toBeTruthy();
  });
});
```

### 2. **Dependency Clarity**

**Problem:**
```js
constructor() {
  // Hidden dependencies!
  this.main = document.querySelector("main");
  //            ↑ Implicitly requires: document to exist
  //            ↑ Implicitly requires: <main> to exist
  this.transitionManager = new TransitionManager();
  //                       ↑ Creates its own Registry internally
  //                       ↑ Can't inject different implementation
}
```

**Solution:**
```js
constructor({ 
  id, 
  element,
  transitionManager, // ✅ Explicit dependency
  registry,          // ✅ Explicit dependency
}) {
  this.id = id;
  this.selector = element;
  this.transitionManager = transitionManager;
  // ✅ Dependencies are clear
  // ✅ Can inject mocks for testing
  // ✅ Can inject different implementations
}
```

### 3. **Error Handling**

**Problem:**
```js
constructor() {
  this.main = document.querySelector("main");
  // ❌ What if <main> doesn't exist?
  // ❌ Constructor throws error immediately
  // ❌ Can't handle gracefully
  // ❌ No way to retry or wait
}
```

**Solution:**
```js
async create() {
  this.main = document.querySelector("main");
  
  // ✅ Can handle errors gracefully
  if (!this.main) {
    throw new Error('Main element not found');
    // Or: await waitForElement('main');
    // Or: return false and let caller handle
  }
}
```

### 4. **Reusability**

**Problem:**
```js
constructor() {
  document.querySelector("main"); // ❌ Only works in browser
}

// Can't use in:
// - Server-side rendering (no document)
// - Web Workers (no document)
// - Testing (no document)
// - Node.js scripts (no document)
```

**Solution:**
```js
constructor({ id }) {
  this.id = id; // ✅ Works anywhere
}

async create() {
  if (typeof document !== 'undefined') {
    this.main = document.querySelector("main");
  }
  // ✅ Can check environment
  // ✅ Can work in different contexts
}
```

### 5. **Lifecycle Clarity**

**Problem:**
```js
constructor() {
  // Mixing concerns:
  this.main = document.querySelector("main"); // Setup?
  this.transitionManager = new TransitionManager(); // Initialization?
  this.id = id; // Configuration?
}

// When does initialization happen?
// What if you call create() twice?
// Hard to reason about lifecycle
```

**Solution:**
```js
constructor({ id }) {
  // ✅ ONLY configuration
  this.id = id;
  this._created = false;
}

async create() {
  // ✅ ALL initialization happens here
  if (this._created) return; // Idempotent
  this._created = true;
  
  this.main = document.querySelector("main");
  this.transitionManager = new TransitionManager();
}
```

### 6. **Flexibility**

**Problem:**
```js
constructor() {
  this.transitionManager = new TransitionManager();
  // ❌ Can't delay initialization
  // ❌ Can't create instance without initializing
  // ❌ Must initialize immediately
}
```

**Solution:**
```js
constructor({ transitionManager }) {
  this.transitionManager = transitionManager ?? null;
  // ✅ Can create instance
  // ✅ Can initialize later
  // ✅ Can inject pre-created manager
}

async create() {
  if (!this.transitionManager) {
    this.transitionManager = new TransitionManager();
  }
  // ✅ Flexible initialization
}
```

## When DOM in Constructor Is Acceptable

There are cases where DOM access in constructors is acceptable:

### ✅ Simple Utility Classes
```js
class DOMHelper {
  constructor() {
    this.body = document.body; // ✅ Simple utility
  }
}
```

### ✅ Single-Use Components (Not Reusable)
```js
class InitialPageLoader {
  constructor() {
    this.main = document.querySelector("main"); // ✅ Runs once on page load
  }
}
```

### ✅ Framework Patterns
Some frameworks (like React in class components) use constructors for setup, but they handle the lifecycle differently.

## The Pragmatic Middle Ground

You can use a hybrid approach:

```js
constructor({ id, element, elements }) {
  // ✅ Store configuration (no DOM)
  this.id = id;
  this.selector = element;
  this.selectorChildren = elements;
  
  // ✅ Create stateless utilities (no DOM)
  this.animation = new Animation();
  
  // ⚠️ Store references (if you're SURE they exist)
  // Only if you can guarantee DOM is ready
  // But still prefer moving to create()
}
```

**But better:**
```js
constructor({ id, element, elements }) {
  // ✅ Configuration only
  this.id = id;
  this.selector = element;
  this.selectorChildren = elements;
  this.animation = new Animation(); // Stateless, fine
}

async create() {
  // ✅ All DOM access here
  this.main = document.querySelector("main");
  this.transitionManager = new TransitionManager();
}
```

## Real-World Comparison

### Your Current Code (Works but has issues)

```js
// App.js
await this.router.updatePage(href); // DOM ready ✅
this.currentPage = new PageClass({}); // Constructor runs ✅

// Page.js constructor
constructor() {
  this.main = document.querySelector("main"); // ✅ Works (DOM is ready)
}

// ✅ Pros: Simple, works
// ❌ Cons: Not testable, not reusable, tight coupling
```

### Refactored (Best Practice)

```js
// App.js
await this.router.updatePage(href); // DOM ready ✅
this.currentPage = new PageClass({ id: 'home' }); // Constructor (no DOM) ✅
await this.currentPage.create(); // Initialize (DOM access) ✅

// Page.js constructor
constructor({ id }) {
  this.id = id; // ✅ No DOM access
}

async create() {
  this.main = document.querySelector("main"); // ✅ DOM access here
}

// ✅ Pros: Testable, reusable, clear lifecycle, flexible
// ⚠️ Cons: Slightly more code
```

## Cost-Benefit Analysis

### Keeping DOM in Constructor (Your Current Approach)

**Benefits:**
- ✅ Simpler code (fewer methods)
- ✅ Works for your specific use case
- ✅ Less boilerplate

**Costs:**
- ❌ Can't test without DOM
- ❌ Can't reuse in other contexts
- ❌ Harder to mock dependencies
- ❌ Less flexible
- ❌ Hidden dependencies

### Moving DOM to create() (Best Practice)

**Benefits:**
- ✅ Testable (can test constructor logic)
- ✅ Reusable (works in different contexts)
- ✅ Clear lifecycle (config vs initialization)
- ✅ Flexible (can delay initialization)
- ✅ Explicit dependencies

**Costs:**
- ⚠️ Slightly more code
- ⚠️ Need to remember to call create()
- ⚠️ Two-phase initialization


# Memory Cleanup: Does Setting to null Clear Memory?

## Quick Answer

**Setting `this.footnotes = null` removes the reference, but the instance is only garbage collected when ALL references are cleared.**

## How JavaScript Garbage Collection Works

### What `= null` Does

```js
this.footnotes = null;
// ✅ Removes THIS reference to the instance
// ❌ Does NOT immediately delete the instance
// ✅ Allows garbage collection IF no other references exist
```

**Key Point:** The instance is only garbage collected when **no references** remain.

---

## Your Current Code

```js
// Page.js
removeEventListeners() {
  this.footnotes.remove();  // ✅ Removes event listeners
  this.footnotes = null;    // ✅ Removes reference
}
```

```js
// Footnotes.js
remove() {
  if (this.onPageClick && this.elements?.page) {
    this.elements.page.off("click", this.onPageClick); // ✅ Removes listener
    this.onPageClick = null; // ✅ Clears handler reference
  }
}
```

**What happens:**
1. ✅ Event listener removed from DOM element
2. ✅ Handler reference (`onPageClick`) cleared
3. ✅ Page reference (`this.footnotes`) cleared
4. ✅ Instance can be garbage collected (if no other references)

---

## When Memory IS Cleared (Your Code Works!)

Your cleanup is **mostly correct**, but here's what happens:

### Step-by-Step Memory Clearance

```js
// 1. Before cleanup
this.footnotes → Footnotes instance
  ↓
Footnotes instance:
  - this.onPageClick → function handler
  - this.elements.page → DOM element
  - DOM element has listener → onPageClick handler
  - this.smoothScroll → SmoothScroll instance (shared, OK)

// 2. Call remove()
this.footnotes.remove();
  ↓
  - DOM element.off("click", this.onPageClick) → Listener removed ✅
  - this.onPageClick = null → Handler reference cleared ✅

// 3. Set to null
this.footnotes = null;
  ↓
  - Page's reference removed ✅

// 4. Garbage Collection (if no other references)
Footnotes instance → Can be garbage collected ✅
```

**Result:** Memory is cleared! ✅

---

## When Memory Is NOT Cleared (Potential Leaks)

### Problem 1: DOM Element Still References Handler

```js
// ❌ BAD: If listener not removed
remove() {
  // Forgot to remove listener!
  // DOM element still references this.onPageClick
  this.onPageClick = null; // ✅ Clears reference
}

// ❌ PROBLEM: DOM element still has listener
// → Footnotes instance can't be garbage collected
// → Memory leak!
```

**Your code:** ✅ Correctly removes listener first

### Problem 2: Closures Holding References

```js
// ❌ BAD: Closure holds reference
remove() {
  // If onPageClick was defined with closure:
  this.onPageClick = (event) => {
    console.log(this.smoothScroll); // ❌ Closure holds 'this'
    // Even after remove(), closure might hold reference
  };
}
```

**Your code:** ✅ Handler is simple, should be fine

### Problem 3: Other References

```js
// ❌ BAD: Other code holds reference
const globalFootnotes = this.footnotes; // Another reference!

removeEventListeners() {
  this.footnotes.remove();
  this.footnotes = null; // ✅ Clears this reference
}

// ❌ PROBLEM: globalFootnotes still references instance
// → Instance can't be garbage collected
```

**Your code:** ✅ No global references visible

---

## Complete Cleanup Checklist

### What You Need to Clean Up

```js
removeEventListeners() {
  // ✅ 1. Remove event listeners (your code does this)
  this.footnotes.remove();
  
  // ✅ 2. Clear reference (your code does this)
  this.footnotes = null;
  
  // ✅ 3. Additional cleanup (optional but thorough)
  // Clear other references if any
}
```

### What Footnotes.remove() Should Do

```js
remove() {
  // ✅ 1. Remove event listeners
  if (this.onPageClick && this.elements?.page) {
    this.elements.page.off("click", this.onPageClick);
  }
  
  // ✅ 2. Clear handler reference
  this.onPageClick = null;
  
  // ✅ 3. Clear DOM references (optional)
  this.elements = null;
  
  // ✅ 4. Clear other references
  this.smoothScroll = null; // ⚠️ But this might be shared!
}
```

**Note:** Be careful clearing `this.smoothScroll` if it's a shared service!

---

## Enhanced Cleanup (More Thorough)

### Current Code (Good)

```js
// Footnotes.js
remove() {
  if (this.onPageClick && this.elements?.page) {
    this.elements.page.off("click", this.onPageClick);
    this.onPageClick = null;
  }
}
```

### Enhanced Cleanup (Better)

```js
// Footnotes.js
remove() {
  // ✅ 1. Remove listeners
  if (this.onPageClick && this.elements?.page) {
    this.elements.page.off("click", this.onPageClick);
    this.onPageClick = null;
  }
  
  // ✅ 2. Clear DOM element references
  // (Optional - helps if elements hold large NodeLists)
  this.elements = null;
  
  // ⚠️ Don't clear smoothScroll if it's shared!
  // this.smoothScroll = null; // ❌ Don't do this if shared
}
```

### Page.js Enhanced Cleanup

```js
removeEventListeners() {
  // ✅ Guard against multiple calls
  if (!this.footnotes) return;
  
  // ✅ Remove listeners first
  this.footnotes.remove();
  
  // ✅ Clear reference
  this.footnotes = null;
  
  // ✅ Optional: Clear other references
  this.elements = null; // If you want to clear DOM references
}
```

---

## Memory Cleanup Best Practices

### 1. Remove Event Listeners First

```js
// ✅ CORRECT ORDER
remove() {
  // First: Remove listeners (prevent leaks)
  element.off("click", handler);
  
  // Then: Clear references (allow GC)
  this.handler = null;
  this.element = null;
}
```

### 2. Clear All References

```js
// ✅ Clear all references to instance
destroy() {
  this.removeEventListeners(); // Remove listeners
  this.footnotes = null;        // Clear reference
  this.elements = null;         // Clear DOM references (optional)
}
```

### 3. Don't Clear Shared References

```js
// ⚠️ Be careful with shared services
removeEventListeners() {
  this.footnotes.remove();
  this.footnotes = null;        // ✅ OK - footnotes is per-page
  
  // ❌ DON'T clear shared services
  // this.smoothScroll = null;  // ❌ Other pages might use this!
  // this.transitionManager = null; // ❌ Shared service!
}
```

---

## When Garbage Collection Actually Happens

### JavaScript GC Timeline

```js
// 1. You set reference to null
this.footnotes = null;

// 2. GC runs eventually (not immediately)
// - GC is non-deterministic
// - Happens when JS engine decides
// - Usually when memory pressure or idle

// 3. Instance is actually freed
// - Only if NO other references exist
// - All event listeners removed
// - All closures released
```

**Important:** GC is not immediate - it happens when the engine decides (usually soon, but not guaranteed).

---

## Testing Memory Cleanup

### Check if Instance is Actually Cleared

```js
removeEventListeners() {
  const instance = this.footnotes; // Save reference for testing
  
  this.footnotes.remove();
  this.footnotes = null;
  
  // Test: Instance should eventually be GC'd
  // (Can't directly test in JS, but DevTools can show)
}
```

### Chrome DevTools Memory Profiler

1. Take heap snapshot
2. Remove listeners
3. Set to null
4. Force GC (if available)
5. Take another snapshot
6. Compare - instance should be gone

---

## Complete Cleanup Pattern

### Ideal Cleanup Flow

```js
// Footnotes.js
remove() {
  if (this._removed) return; // ✅ Idempotent
  this._removed = true;
  
  // ✅ 1. Remove event listeners
  if (this.onPageClick && this.elements?.page) {
    this.elements.page.off("click", this.onPageClick);
  }
  
  // ✅ 2. Clear handler reference
  this.onPageClick = null;
  
  // ✅ 3. Clear DOM references (optional)
  this.elements = null;
  
  // ⚠️ Don't clear shared services!
  // this.smoothScroll = null; // Only if not shared
}

// Page.js
removeEventListeners() {
  if (!this.footnotes) return; // ✅ Guard
  
  // ✅ Remove listeners
  this.footnotes.remove();
  
  // ✅ Clear reference
  this.footnotes = null;
}
```

---

## Summary

**Does `this.footnotes = null` clear memory?**

**Yes, but conditionally:**

1. ✅ **Removes the reference** - Page no longer points to instance
2. ✅ **Allows garbage collection** - Instance can be freed IF:
   - ✅ All event listeners removed (you do this ✅)
   - ✅ All handler references cleared (you do this ✅)
   - ✅ No other references exist (should be true ✅)
3. ⚠️ **GC happens eventually** - Not immediately, but usually soon

**Your cleanup is correct!** ✅

**To be extra safe, you could:**
- Add idempotent guards (`if (this._removed) return`)
- Clear `this.elements` in Footnotes.remove() (if large NodeLists)
- Ensure no closures hold references

**But your current code should work fine for memory cleanup.**

---

## Common Pitfalls

### ❌ Setting to null without removing listeners

```js
// ❌ BAD: Listener still attached
this.footnotes = null;
// DOM element still references handler
// → Memory leak!
```

### ❌ Not clearing handler reference

```js
// ❌ BAD: Handler reference still exists
remove() {
  element.off("click", this.onPageClick);
  // this.onPageClick still references function
  // → Function can't be GC'd
}
```

### ✅ Your Code (Correct)

```js
// ✅ GOOD: Removes listener AND clears reference
remove() {
  element.off("click", this.onPageClick); // ✅ Remove listener
  this.onPageClick = null;                 // ✅ Clear reference
}

removeEventListeners() {
  this.footnotes.remove();  // ✅ Remove listeners
  this.footnotes = null;     // ✅ Clear reference
}
```

**Your cleanup is correct!** ✅

# Shared Instance Memory Management: Footnotes Case Study

## The Problem

When a service is created as a **singleton** and shared across multiple components, setting `this.footnotes = null` in a single component **does not** trigger garbage collection of the instance itself.

## Current Architecture

```js
// ServicesFactory.js - Creates ONE instance
export function createServices() {
  const footnotes = new Footnotes({ smoothScroll });
  return { footnotes };
}

// App.js - Holds global reference
createServices() {
  this.services = createServices();
  this.footnotes = this.services.footnotes; // ✅ Global reference
}

// Page.js - Receives shared instance
constructor({ footnotes }) {
  this.footnotes = footnotes; // ⚠️ Reference to shared instance
}

// Page.js - Cleanup
removeEventListeners() {
  this.footnotes.remove(); // ✅ Cleans up DOM listeners
  this.footnotes = null;   // ❓ Only clears Page's reference
}
```

## Memory Reference Chain

```
ServicesFactory.js
  └─> footnotes instance (line 13)
      │
      └─> App.js
          └─> this.footnotes (line 48) ✅ STILL HOLDS REFERENCE
              │
              └─> Page.js (Page A)
                  └─> this.footnotes = null ✅ CLEARED
              │
              └─> Page.js (Page B)
                  └─> this.footnotes = null ✅ CLEARED
```

**Result**: Instance **cannot** be garbage collected because `App.js` still references it.

## Why `this.footnotes = null` Still Has Value

### 1. **Breaks Component Reference** (Minor Benefit)

```js
// Page.js
removeEventListeners() {
  this.footnotes.remove();
  this.footnotes = null; // ✅ Page no longer references instance
}
```

**Value**: Prevents the Page from accidentally reusing a stale reference or calling methods after cleanup.

**Example**:
```js
// Without null check
destroy() {
  this.removeEventListeners();
  // Later in code...
  this.footnotes.init(); // ❌ BUG: Still works, attaches listeners to destroyed page
}

// With null
destroy() {
  this.removeEventListeners(); // Sets this.footnotes = null
  // Later...
  this.footnotes.init(); // ✅ ERROR: Cannot read property 'init' of null
}
```

### 2. **Enables DOM Cleanup via `remove()`** (Major Benefit)

The **real value** is calling `this.footnotes.remove()` **before** setting to null:

```js
removeEventListeners() {
  this.footnotes.remove(); // ✅ This is the important part!
  //   │
  //   └─> Footnotes.remove():
  //       - Removes event listeners from DOM
  //       - Sets this.onPageClick = null
  //       - Clears NodeList references (this.footnotes, this.superscripts)
  //       - Clears DOM element references (this.elements)
  this.footnotes = null; // Minor: just clears Page reference
}
```

## What Actually Gets Garbage Collected?

### ✅ **Will be GC'd** (Page-specific references):

```js
// Footnotes.remove() clears these:
this.onPageClick = null;        // ✅ Function handler
this.elements = null;           // ✅ DOM element references
this.elements.page = null;      // ✅ DOM element reference
this.footnotes = null;          // ✅ NodeList (in Footnotes instance)
this.superscripts = null;       // ✅ NodeList (in Footnotes instance)
```

These are **per-page state** that gets cleaned up even though the instance persists.

### ❌ **Will NOT be GC'd** (Shared instance):

```js
// ServicesFactory.js
const footnotes = new Footnotes(); // ❌ Instance persists

// App.js
this.footnotes = footnotes; // ❌ Reference persists
```

The **Footnotes class instance** itself lives as long as the app runs.

## Architectural Consideration

### Current Pattern: **Singleton Service**

```js
// ✅ Works for stateless or global services
const smoothScroll = new SmoothScroll(); // Global scroll controller
const router = new Router(); // Global router

// ⚠️ Questionable for page-specific services
const footnotes = new Footnotes(); // But has per-page DOM listeners
```

### Alternative Pattern: **Per-Page Instance**

If Footnotes manages **page-specific state** (DOM listeners, NodeLists), consider creating it per-page:

```js
// ServicesFactory.js
export function createServices() {
  // Don't create footnotes here
  return { registry, router, smoothScroll, transitionManager };
}

// Page.js
create() {
  // Create per-page instance
  this.footnotes = new Footnotes({ smoothScroll: this.smoothScroll });
  this.footnotes.init();
}

destroy() {
  this.footnotes.destroy(); // Properly cleanup
  this.footnotes = null; // ✅ Now THIS instance can be GC'd
}
```

**Pros**:
- ✅ Each page gets its own Footnotes instance
- ✅ Instance can be fully GC'd when page is destroyed
- ✅ No risk of cross-page listener conflicts

**Cons**:
- ❌ Creates new instance per page (small memory overhead)
- ❌ Requires `smoothScroll` injection per page

## Best Practice: Hybrid Approach

For shared services that manage per-page state:

```js
// Footnotes.js
export class Footnotes extends Component {
  constructor({ smoothScroll }) {
    super({ element: ".page-content aside" });
    this.smoothScroll = smoothScroll; // ✅ Shared dependency
    this.pageState = new Map(); // ✅ Per-page state map
  }

  // Track state per page ID
  init(pageId) {
    if (!this.pageState.has(pageId)) {
      this.pageState.set(pageId, {
        onPageClick: null,
        elements: null,
        footnotes: null,
        superscripts: null,
      });
    }
    // ... init logic for this page
  }

  remove(pageId) {
    const state = this.pageState.get(pageId);
    if (state) {
      // Clean up this page's listeners
      if (state.onPageClick && state.elements?.page) {
        state.elements.page.off("click", state.onPageClick);
      }
      this.pageState.delete(pageId); // ✅ Remove page state
    }
  }
}
```

## Summary

### Question: Does `this.footnotes = null` help GC?

**Answer**: 
- ❌ **No** for the Footnotes instance itself (it's shared globally)
- ✅ **Yes** for breaking Page's reference (prevents accidental reuse)
- ✅ **Yes** when combined with `remove()` which cleans up NodeLists and DOM listeners

### The Real Benefit

The **real cleanup** happens in `Footnotes.remove()`:
- Removes event listeners from DOM
- Clears NodeList references (`this.footnotes`, `this.superscripts`)
- Clears DOM element references (`this.elements`)

Setting `this.footnotes = null` in Page.js is **defensive programming** that:
1. Prevents Page from reusing a cleaned-up instance
2. Makes it clear the reference is intentionally broken
3. Helps catch bugs if code tries to use it after cleanup

## Recommendation

**Keep the pattern**, but understand the limits:
- ✅ Call `this.footnotes.remove()` to clean up DOM state
- ✅ Set `this.footnotes = null` for defensive programming
- ✅ Understand the instance persists globally (by design)
- 🤔 Consider per-page instances if Footnotes becomes more stateful per-page

The NodeList cleanup you mentioned is the **most important** part!





# Event Listener Patterns

Let’s break down the **Event Listener Lifecycle Management pattern** (a.k.a. **Handler Registry** or **Listener Tracking**) step-by-step 👇

---

## 🔹 1. The Core Idea

Event listeners (like `element.addEventListener`) need to be:

* **Registered** when a component or feature is initialized.
* **Removed** (via `removeEventListener`) when that component or feature is destroyed, unmounted, or replaced.

If you **don’t remove** them, they can:

* Cause **memory leaks** (holding onto DOM nodes or closures).
* Cause **duplicate handlers** when re-initializing UI.
* Trigger **logic bugs** because old listeners remain active.

So — the **Event Listener Lifecycle Management pattern** formalizes **tracking, cleaning up, and re-binding** listeners as a consistent part of your component or app lifecycle.

---

## 🔹 2. What It Looks Like Conceptually

Instead of sprinkling event listeners everywhere like:

```js
window.addEventListener('resize', handleResize);
button.addEventListener('click', handleClick);
```

…you maintain a **registry** of listeners and their teardown logic:

```js
const listenerRegistry = [];

function addListener(target, event, handler, options) {
  target.addEventListener(event, handler, options);
  listenerRegistry.push(() => target.removeEventListener(event, handler, options));
}

function removeAllListeners() {
  listenerRegistry.forEach(off => off());
  listenerRegistry.length = 0; // clear registry
}
```

Now your lifecycle logic is explicit:

```js
function initUI() {
  addListener(window, 'resize', handleResize);
  addListener(button, 'click', handleClick);
}

function destroyUI() {
  removeAllListeners(); // safely clean up
}
```

---

## 🔹 3. Why This Pattern Exists

### 🧠 Problem it Solves

* Avoids **leaking listeners** when elements are removed from the DOM.
* Avoids **duplicate event triggers** after re-initialization.
* Keeps teardown logic **automatic** and consistent.

### ✅ Benefits

* Predictable cleanup (like React’s `useEffect` cleanup or Vue’s unmounted hook).
* Reduces side effects when rebuilding UIs.
* Works in frameworks **and** vanilla JS apps.

---

## 🔹 4. Lifecycle Analogy (React-like Thinking)

| Phase                 | Action                         | Registry Behavior                   |
| --------------------- | ------------------------------ | ----------------------------------- |
| **Mount / Init**      | Attach listeners               | Push teardown functions to registry |
| **Update (optional)** | Re-bind if dependencies change | Remove old, re-add new              |
| **Unmount / Destroy** | Remove listeners               | Execute teardown callbacks          |

This is similar to how React, Vue, and Svelte internally manage event lifecycles — but you can use it in **plain JavaScript** too.

---

## 🔹 5. Advanced Variations

### a. **Grouped Registries**

You can group listeners by feature:

```js
const registries = new Map();
function addListenerGroup(group, target, event, handler) {
  const list = registries.get(group) || [];
  target.addEventListener(event, handler);
  list.push(() => target.removeEventListener(event, handler));
  registries.set(group, list);
}
function clearGroup(group) {
  registries.get(group)?.forEach(off => off());
  registries.delete(group);
}
```

→ Helps in apps with multiple independent widgets.

---

### b. **Automatic Cleanup with WeakMaps**

If using classes or components:

```js
const listenerMap = new WeakMap();

function trackListeners(instance, target, event, handler) {
  const listeners = listenerMap.get(instance) || [];
  target.addEventListener(event, handler);
  listeners.push(() => target.removeEventListener(event, handler));
  listenerMap.set(instance, listeners);
}

function cleanup(instance) {
  listenerMap.get(instance)?.forEach(off => off());
  listenerMap.delete(instance);
}
```

→ Each component cleans up automatically on destruction.

---

## 🔹 6. In Practice (Modern Use)

This pattern appears implicitly in frameworks:

* **React:** `useEffect` cleanup functions remove listeners.
* **Vue:** Lifecycle hooks (`onMounted`, `onUnmounted`) do this.
* **Svelte:** `$on` automatically tears down listeners on component destruction.

But in **vanilla JS**, you implement this manually — the *Handler Registry pattern* is your structured way of doing so.

---

## ✅ Summary

| Concept                                 | Description                                                          | Benefit                                        |
| --------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------- |
| **Event Listener Lifecycle Management** | Pattern for registering and cleaning up event listeners predictably. | Prevents leaks, duplication, stale handlers.   |
| **Handler Registry**                    | Central list of listeners with teardown callbacks.                   | Enables mass cleanup (`removeAllListeners()`). |
| **Best Practice**                       | Always remove listeners when element or module is destroyed.         | Keeps app stable and memory clean.             |
| **Common in**                           | React, Vue, Svelte lifecycles, but also vanilla JS modules.          | Encapsulates side effects.                     |

---

**In short:**

> *The Event Listener Lifecycle pattern is about treating event listeners like any other resource — track them, clean them up, and never leave them hanging.*

---

👉 Would you like me to show a **real-world vanilla JS example** (like a tooltip or modal component) that uses this listener registry pattern cleanly — with attach/detach logic built in? It’s a great way to see how it feels in practice.





Evaluating both approaches. Checking which classes could benefit from event listener lifecycle management:


[3 tools called]

Analyzing both approaches:

## Approach 1: Keep in Component.js (Current)

### Pros
- Simple: All components already extend Component
- No extra imports or setup
- Consistent API across components
- Tightly coupled: event lifecycle is part of component lifecycle
- No mixin complexity

### Cons
- Only available to Component subclasses
- SmoothScroll and Page don't extend Component, so they can't use it
- Harder to test in isolation
- Couples event lifecycle to Component

---

## Approach 2: Separate EventLifecycle Mixin/Class

### Pros
- Reusable: Any class can use it (Page, SmoothScroll, etc.)
- Testable: Can test event lifecycle independently
- Separation of concerns: Event management is separate
- Flexible: Can compose with different classes

### Cons
- More complexity: Need to compose/mix in
- More imports: Need to import and set up
- Potential duplication: May need to track handlers in multiple places
- Mixin patterns can be confusing

---

## Recommendation: Keep in Component.js

### Why
1. All components that need events already extend Component
2. Event lifecycle is part of component lifecycle
3. Simpler architecture
4. SmoothScroll and Page can handle their own listeners manually (they're simpler cases)

---

## Alternative: Hybrid Approach

If you want to reuse the pattern, create a utility class for non-Component classes:

### Option A: Utility Class (For Non-Component Classes)

```javascript:app/utilities/EventLifecycle.js
/**
 * Event listener lifecycle management utility
 * Use for classes that don't extend Component but need event tracking
 */
export class EventLifecycle {
  constructor() {
    this.eventTarget = new EventTarget();
    this._eventHandlers = new Map();
  }

  on(type, callback) {
    const handler = (event) => callback(event.detail);
    this.eventTarget.addEventListener(type, handler);
    
    if (!this._eventHandlers.has(type)) {
      this._eventHandlers.set(type, []);
    }
    this._eventHandlers.get(type).push(handler);
  }

  once(type, callback) {
    const handler = (event) => {
      callback(event.detail);
      this.eventTarget.removeEventListener(type, handler);
      
      const handlers = this._eventHandlers.get(type);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) handlers.splice(index, 1);
      }
    };
    this.eventTarget.addEventListener(type, handler);
    
    if (!this._eventHandlers.has(type)) {
      this._eventHandlers.set(type, []);
    }
    this._eventHandlers.get(type).push(handler);
  }

  emit(type, detail) {
    this.eventTarget.dispatchEvent(new CustomEvent(type, { detail }));
  }

  removeAllListeners(type) {
    if (type) {
      const handlers = this._eventHandlers.get(type) || [];
      handlers.forEach(handler => {
        this.eventTarget.removeEventListener(type, handler);
      });
      this._eventHandlers.delete(type);
    } else {
      this._eventHandlers.forEach((handlers, eventType) => {
        handlers.forEach(handler => {
          this.eventTarget.removeEventListener(eventType, handler);
        });
      });
      this._eventHandlers.clear();
    }
  }
}
```

Usage in SmoothScroll:
```javascript:app/components/SmoothScroll.js
import { EventLifecycle } from "../utilities/EventLifecycle.js";

export class SmoothScroll {
  constructor(options = {}) {
    this.lenis = null;
    this.options = { /* ... */ };
    
    // ✅ Use EventLifecycle for event tracking
    this.events = new EventLifecycle();
  }

  resize() {
    // Store handler for cleanup
    this._resizeHandler = () => {
      if (this.lenis) {
        this.lenis.resize();
      }
    };
    
    window.addEventListener("resize", this._resizeHandler);
  }

  destroy() {
    // ✅ Clean up Component-style events (if any)
    this.events.removeAllListeners();
    
    // ✅ Clean up DOM events
    if (this._resizeHandler) {
      window.removeEventListener("resize", this._resizeHandler);
      this._resizeHandler = null;
    }
    
    if (this.lenis) {
      this.lenis.destroy();
      this.lenis = null;
    }
  }
}
```

---

## Comparison Table

| Aspect | Keep in Component | Separate Mixin | Hybrid (Utility) |
|--------|------------------|----------------|------------------|
| **Simplicity** | ✅ Simple | ❌ More complex | ⚠️ Moderate |
| **Reusability** | ❌ Only Components | ✅ All classes | ✅ All classes |
| **Code Duplication** | ✅ None | ❌ Some duplication | ✅ Shared utility |
| **Consistency** | ✅ All Components same | ⚠️ Varies by usage | ⚠️ Varies by usage |
| **Testability** | ⚠️ Coupled to Component | ✅ Isolated | ✅ Isolated |
| **Maintenance** | ✅ Single place | ❌ Multiple places | ⚠️ Two places |
| **Learning Curve** | ✅ Easy | ❌ Mixin patterns | ⚠️ Need to know when to use |

---

## Final Recommendation

Use a hybrid approach:

1. Keep in Component.js for components that extend Component
   - All your current components (Preloader, Footnotes, Navigation)
   - Simple and consistent

2. Create EventLifecycle utility for non-Component classes
   - Only if SmoothScroll or Page need event tracking
   - SmoothScroll can continue with manual tracking (it's just one listener)

3. For DOM event listeners (window, document, elements)
   - Continue manual tracking as needed
   - These are simpler cases

### Why this works
- Components get the pattern automatically
- Non-Component classes can opt in when needed
- Avoids mixin complexity
- Keeps the codebase simple

### When to extract to a mixin
Extract only if:
- Multiple non-Component classes need event lifecycle
- You want to test event lifecycle in isolation
- You need to share event lifecycle across unrelated classes

Right now, SmoothScroll is the only non-Component class with listeners, and it's a simple case (one window resize listener). Manual tracking is fine there.

Recommendation: Keep it in Component.js for now. It's simpler, all components benefit, and the few edge cases can be handled manually.



## The Data Structure

```javascript
// Map structure:
_eventHandlers = Map {
  "preloader-complete" => [handler1, handler2, handler3],
  "navigation-changed" => [handler1],
  "footnote-click"     => [handler1, handler2]
}
```

## Why an Array?

Each event type can have multiple listeners. The array stores all handlers for that type so you can:
1. Remove all handlers for a specific event type
2. Remove all handlers when the component is destroyed
3. Support multiple listeners on the same event

## Example: Multiple Listeners

```javascript
// Component can have multiple listeners for same event
preloader.on("preloader-complete", handler1);
preloader.on("preloader-complete", handler2);
preloader.on("preloader-complete", handler3);

// Map structure:
// "preloader-complete" => [handler1, handler2, handler3]

// When cleaning up:
preloader.removeAllListeners("preloader-complete");
// Removes all 3 handlers in one call
```

This pattern supports multiple listeners per event type and enables bulk cleanup.



# Component Versus Global Window DOM Event Tracking

Currently, tracking is only in `on()` and `once()`, so DOM listeners (e.g., `window.addEventListener`, `element.addEventListener`) aren't tracked. Generalizing the API so components can track any listener registration.

Here's a generalized event lifecycle API:

## Generalized Event Lifecycle API

```javascript:app/components/Component.js
export default class Component extends EventTarget {
  constructor({ element, elements }) {
    super();
    this.selector = element;
    this.selectorChildren = { ...elements };
    this.eventTarget = new EventTarget();
    this.eventHandlers = new Map(); // Track ALL handlers (Component + DOM)
    this.element = null;
    this.elements = {};
  }

  // ... existing create() and emit() ...

  /**
   * Add an event listener for the given event type (Component events)
   */
  on(type, callback) {
    const handler = (event) => callback(event.detail);
    this.eventTarget.addEventListener(type, handler);
    
    // ✅ Use generalized tracking method
    this.addHandler(type, handler, this.eventTarget);
  }

  /**
   * Add an event listener that will be removed after the first event
   */
  once(type, callback) {
    const handler = (event) => {
      callback(event.detail);
      this.eventTarget.removeEventListener(type, handler);
      this.removeHandler(type, handler, this.eventTarget);
    };
    this.eventTarget.addEventListener(type, handler);
    
    // ✅ Use generalized tracking method
    this.addHandler(type, handler, this.eventTarget);
  }

  // ============================================
  // GENERALIZED EVENT LIFECYCLE METHODS
  // ============================================

  /**
   * Add a handler to tracking (for any event target)
   * @param {string} type - Event type
   * @param {Function} handler - Handler function
   * @param {EventTarget} target - Event target (default: this.eventTarget)
   */
  addHandler(type, handler, target = this.eventTarget) {
    const key = this._getHandlerKey(type, target);
    
    if (!this.eventHandlers.has(key)) {
      this.eventHandlers.set(key, []);
    }
    this.eventHandlers.get(key).push({ handler, target });
  }

  /**
   * Check if a handler exists for a given event type
   * @param {string} type - Event type
   * @param {EventTarget} target - Event target (default: this.eventTarget)
   * @returns {boolean} True if handlers exist
   */
  hasHandler(type, target = this.eventTarget) {
    const key = this._getHandlerKey(type, target);
    return this.eventHandlers.has(key) && this.eventHandlers.get(key).length > 0;
  }

  /**
   * Remove a specific handler
   * @param {string} type - Event type
   * @param {Function} handler - Handler function to remove
   * @param {EventTarget} target - Event target (default: this.eventTarget)
   */
  removeHandler(type, handler, target = this.eventTarget) {
    const key = this._getHandlerKey(type, target);
    const handlers = this.eventHandlers.get(key) || [];
    
    const index = handlers.findIndex(h => h.handler === handler && h.target === target);
    if (index > -1) {
      target.removeEventListener(type, handler);
      handlers.splice(index, 1);
      
      if (handlers.length === 0) {
        this.eventHandlers.delete(key);
      }
    }
  }

  /**
   * Remove all handlers for a specific event type
   * @param {string} type - Event type
   * @param {EventTarget} target - Event target (default: this.eventTarget)
   */
  removeAllHandlers(type, target = this.eventTarget) {
    const key = this._getHandlerKey(type, target);
    const handlers = this.eventHandlers.get(key) || [];
    
    handlers.forEach(({ handler }) => {
      target.removeEventListener(type, handler);
    });
    
    this.eventHandlers.delete(key);
  }

  /**
   * Remove all event listeners (complete cleanup)
   * @param {EventTarget} target - Optional specific target to clean up
   */
  removeAllListeners(target) {
    if (target) {
      // Remove all handlers for specific target
      this.eventHandlers.forEach((handlers, key) => {
        const [eventType, targetKey] = this._parseHandlerKey(key);
        if (targetKey === this._getTargetKey(target)) {
          handlers.forEach(({ handler }) => {
            target.removeEventListener(eventType, handler);
          });
          this.eventHandlers.delete(key);
        }
      });
    } else {
      // Remove all handlers for all targets
      this.eventHandlers.forEach((handlers, key) => {
        const [eventType, targetKey] = this._parseHandlerKey(key);
        handlers.forEach(({ handler, target: eventTarget }) => {
          eventTarget.removeEventListener(eventType, handler);
        });
      });
      this.eventHandlers.clear();
    }
  }

  /**
   * Get all handlers for a specific event type
   * @param {string} type - Event type
   * @param {EventTarget} target - Event target (default: this.eventTarget)
   * @returns {Array} Array of handler objects
   */
  getHandlers(type, target = this.eventTarget) {
    const key = this._getHandlerKey(type, target);
    return this.eventHandlers.get(key) || [];
  }

  /**
   * Private: Generate unique key for handler tracking
   * @private
   */
  _getHandlerKey(type, target) {
    const targetKey = this._getTargetKey(target);
    return `${type}:${targetKey}`;
  }

  /**
   * Private: Get unique identifier for event target
   * @private
   */
  _getTargetKey(target) {
    if (target === this.eventTarget) return 'component';
    if (target === window) return 'window';
    if (target === document) return 'document';
    if (target === this.element) return 'element';
    // For other elements, use a hash or identifier
    return target.constructor.name || 'unknown';
  }

  /**
   * Private: Parse handler key back to type and target
   * @private
   */
  _parseHandlerKey(key) {
    const [type, ...targetParts] = key.split(':');
    return [type, targetParts.join(':')];
  }
}
```

## Usage Examples

### Example 1: Preloader (Component Events)

```javascript:app/components/Preloader.js
export class Preloader extends Component {
  // ... existing code ...

  destroy() {
    if (this.element) {
      this.element.remove();
    }
    
    // ✅ Remove all Component event listeners
    this.removeAllListeners();
    
    // Clear references
    this.element = null;
    this.elements = null;
  }
}
```

### Example 2: SmoothScroll (DOM Events)

```javascript:app/components/SmoothScroll.js
export class SmoothScroll {
  constructor(options = {}) {
    this.lenis = null;
    this.options = { /* ... */ };
    
    // ✅ If SmoothScroll extended Component, it could use:
    // But since it doesn't, manual tracking is fine
    this._resizeHandler = null;
  }

  resize() {
    // ✅ Store handler reference
    this._resizeHandler = () => {
      if (this.lenis) {
        this.lenis.resize();
      }
    };
    
    window.addEventListener("resize", this._resizeHandler);
    
    // ✅ If SmoothScroll extended Component:
    // this.addHandler("resize", this._resizeHandler, window);
  }

  destroy() {
    // ✅ Manual cleanup (current approach)
    if (this._resizeHandler) {
      window.removeEventListener("resize", this._resizeHandler);
      this._resizeHandler = null;
    }
    
    if (this.lenis) {
      this.lenis.destroy();
    }
  }
}
```

### Example 3: Footnotes (Mixed: DOM + Component Events)

```javascript:app/components/Footnotes.js
export class Footnotes extends Component {
  setup() {
    super.create();
    
    if (this.isEnabled && !this.onPageClick) {
      this.onPageClick = (event) => {
        // ... handler logic
      };

      // ✅ Register DOM event listener
      this.elements.page.on("click", this.onPageClick);
      
      // ✅ Track it manually (since it's a custom element method)
      // OR if we enhance the helper to use Component tracking:
      // this.addHandler("click", this.onPageClick, this.elements.page);
    }
    
    // ✅ Register Component event listener (automatically tracked)
    this.on("footnote-navigated", (detail) => {
      console.log("Navigated:", detail);
    });
  }

  remove() {
    // ✅ Remove Component event listeners
    this.removeAllListeners();
    
    // ✅ Remove DOM event listeners (custom element method)
    if (this.onPageClick && this.elements?.page) {
      this.elements.page.off("click", this.onPageClick);
      this.onPageClick = null;
    }
    
    // Clear references
    this.element = null;
    this.elements = null;
  }
}
```

### Example 4: Component with Window Events

```javascript:app/components/MyComponent.js
export class MyComponent extends Component {
  create() {
    super.create();
    
    // ✅ Register window event listener
    const resizeHandler = () => {
      this.handleResize();
    };
    window.addEventListener("resize", resizeHandler);
    
    // ✅ Track it using generalized API
    this.addHandler("resize", resizeHandler, window);
    
    // ✅ Register Component event listener (automatically tracked)
    this.on("custom-event", (data) => {
      // ...
    });
  }

  destroy() {
    // ✅ Remove all listeners (Component + window)
    this.removeAllListeners();
    
    // OR remove specific target:
    // this.removeAllListeners(window);
    
    this.element = null;
  }
}
```

## Simplified Version (If You Don't Need Multi-Target)

If you only need to track Component events and don't need to track DOM events separately:

```javascript:app/components/Component.js
/**
 * Simplified generalized API - just for Component events
 */
export default class Component extends EventTarget {
  constructor({ element, elements }) {
    super();
    this.selector = element;
    this.selectorChildren = { ...elements };
    this.eventTarget = new EventTarget();
    this.eventHandlers = new Map();
    this.element = null;
    this.elements = {};
  }

  // ... existing create() and emit() ...

  on(type, callback) {
    const handler = (event) => callback(event.detail);
    this.eventTarget.addEventListener(type, handler);
    this.addHandler(type, handler);
  }

  once(type, callback) {
    const handler = (event) => {
      callback(event.detail);
      this.eventTarget.removeEventListener(type, handler);
      this.removeHandler(type, handler);
    };
    this.eventTarget.addEventListener(type, handler);
    this.addHandler(type, handler);
  }

  /**
   * Add a handler to tracking
   */
  addHandler(type, handler) {
    if (!this.eventHandlers.has(type)) {
      this.eventHandlers.set(type, []);
    }
    this.eventHandlers.get(type).push(handler);
  }

  /**
   * Check if handlers exist for event type
   */
  hasHandler(type) {
    return this.eventHandlers.has(type) && this.eventHandlers.get(type).length > 0;
  }

  /**
   * Remove a specific handler
   */
  removeHandler(type, handler) {
    const handlers = this.eventHandlers.get(type) || [];
    const index = handlers.indexOf(handler);
    if (index > -1) {
      this.eventTarget.removeEventListener(type, handler);
      handlers.splice(index, 1);
      if (handlers.length === 0) {
        this.eventHandlers.delete(type);
      }
    }
  }

  /**
   * Remove all handlers for a specific event type
   */
  removeAllHandlers(type) {
    const handlers = this.eventHandlers.get(type) || [];
    handlers.forEach(handler => {
      this.eventTarget.removeEventListener(type, handler);
    });
    this.eventHandlers.delete(type);
  }

  /**
   * Remove all event listeners
   */
  removeAllListeners() {
    this.eventHandlers.forEach((handlers, type) => {
      handlers.forEach(handler => {
        this.eventTarget.removeEventListener(type, handler);
      });
    });
    this.eventHandlers.clear();
  }

  /**
   * Get all handlers for an event type
   */
  getHandlers(type) {
    return this.eventHandlers.get(type) || [];
  }
}
```

## Recommendation

Use the simplified version if:
- Components only use Component events (`this.on()`, `this.emit()`)
- You don't need to track DOM events separately

Use the full multi-target version if:
- Components need to track window/document/element listeners
- You want a unified API for all event types

For your current codebase, the simplified version is likely sufficient. Components can manually track DOM listeners when needed (like SmoothScroll does), and Component events are handled automatically.


Reviewing the current implementation to clarify the relationship:


[2 tools called]


No—don't call `removeAllListeners` inside `removeListenerAndDeregister`. They serve different purposes:

- `removeListenerAndDeregister(target, type, handler)` — removes one specific handler
- `removeAllListeners(type)` — removes all handlers of a type (or all handlers)

Calling `removeAllListeners` would remove all handlers, not just the one.

## The real issue

Your current `removeListenerAndDeregister` removes the listener from the DOM but doesn't remove it from EventManager's tracking Map. This leaves a stale entry.

## Solution: remove the specific handler from tracking

You have two options:

### Option 1: Add a method to EventManager to remove a single handler (recommended)

```javascript
// EventManager.js - Add this method
/**
 * Remove a specific event handler from tracking
 * @param {string} type - The event type
 * @param {Function} handler - The specific handler to remove
 * @param {EventTarget} target - The event target
 */
removeHandler(type, handler, target) {
  const handlers = this.eventHandlers.get(type) || [];
  const index = handlers.findIndex(
    h => h.handler === handler && h.target === target
  );
  
  if (index > -1) {
    handlers.splice(index, 1);
    if (handlers.length === 0) {
      this.eventHandlers.delete(type);
    }
  }
}
```

Then update Component:

```javascript
// Component.js - removeListenerAndDeregister
removeListenerAndDeregister(target, type, handler) {
  // Remove from DOM
  if (typeof target.removeEventListener === "function") {
    target.removeEventListener(type, handler);
  } else if (typeof target.off === "function") {
    target.off(type, handler);
  }

  // ✅ Remove from tracking (specific handler only)
  this.eventManager.removeHandler(type, handler, target);
}
```

### Option 2: Manually remove from the Map (simpler, but less clean)

```javascript
// Component.js - removeListenerAndDeregister
removeListenerAndDeregister(target, type, handler) {
  // Remove from DOM
  if (typeof target.removeEventListener === "function") {
    target.removeEventListener(type, handler);
  } else if (typeof target.off === "function") {
    target.off(type, handler);
  }

  // ✅ Remove from tracking Map directly
  const handlers = this.eventManager.eventHandlers.get(type) || [];
  const index = handlers.findIndex(
    h => h.handler === handler && h.target === target
  );
  
  if (index > -1) {
    handlers.splice(index, 1);
    if (handlers.length === 0) {
      this.eventManager.eventHandlers.delete(type);
    }
  }
}
```

## When to use each method

| Method | Use Case | What It Does |
|--------|----------|--------------|
| `removeListenerAndDeregister(target, type, handler)` | Remove one specific handler | Removes one handler from DOM + tracking |
| `removeAllListeners(type)` | Cleanup all handlers of a type | Removes all handlers of that type |
| `removeAllListeners()` | Complete cleanup (destroy) | Removes all handlers of all types |

## Example usage

```javascript
// Setup
this.addListenerAndRegister(window, "resize", this.handleResize);
this.addListenerAndRegister(window, "resize", this.handleResize2);
this.addListenerAndRegister(window, "scroll", this.handleScroll);

// Remove one specific handler
this.removeListenerAndDeregister(window, "resize", this.handleResize);
// ✅ Only handleResize removed, handleResize2 and handleScroll still active

// Remove all resize handlers
this.removeAllListeners("resize");
// ✅ Both handleResize and handleResize2 removed, handleScroll still active

// Complete cleanup (in destroy())
this.removeAllListeners();
// ✅ All handlers removed
```

## Recommendation

Add `removeHandler` to EventManager (Option 1) for:
- Cleaner separation of concerns
- Reusability
- Better encapsulation

## Summary

- Don't call `removeAllListeners` inside `removeListenerAndDeregister` — it would remove all handlers.
- Do remove the specific handler from the tracking Map.
- Add `removeHandler` to EventManager, or manually remove from the Map in `removeListenerAndDeregister`.

This keeps the tracking Map in sync with the DOM.


# Hooks vs Overriding: Extension Points for Subclasses

## What Are Subclasses?

Yes! **Subclasses** are classes that inherit from a parent class using `extends`:

```js
// Parent class (base class)
export default class Page {
  async show() { /* base implementation */ }
}

// Subclass (child class)
export class Home extends Page {
  // Home "extends" Page - it's a subclass
}

export class View extends Page {
  // View "extends" Page - it's also a subclass
}
```

In your codebase:
- `Home extends Page` ✅
- `View extends Page` ✅
- `Introduction extends Page` ✅

These are all **subclasses** of `Page`.

---

## The Problem: Overriding Entire Methods

### Current Situation (Good - No Overriding Yet)

Your current subclasses don't override `show()` or `hide()`:

```js
// Page.js (parent)
async show() {
  if (!this.smoothScroll.enabled() && !this.preloader) {
    this.smoothScroll.create();
    this.smoothScroll.scrollTo(0, {immediate: true});
  }
  await this.animation.GSAPHideTransition(this.transitionOverlay);
}

// Home.js (subclass)
// ✅ Doesn't override show() - uses parent's implementation
```

### Problem Scenario: When You Need to Customize

What if `Home` page needs to do something extra when showing?

**Option 1: Override Entire Method (❌ Bad)**

```js
// Home.js
export class Home extends Page {
  async show() {
    // ❌ PROBLEM: Must duplicate ALL parent logic
    if (!this.smoothScroll.enabled() && !this.preloader) {
      this.smoothScroll.create();
      this.smoothScroll.scrollTo(0, {immediate: true});
    }
    await this.animation.GSAPHideTransition(this.transitionOverlay);
    
    // ✅ Only this part is new (what we actually want to customize)
    this.playWelcomeAnimation();
  }
}
```

**Problems with overriding:**
1. ❌ **Duplicates code** - Must copy all parent logic
2. ❌ **Fragile** - If parent logic changes, must update ALL subclasses
3. ❌ **Easy to miss steps** - Forget to call animation, scroll, etc.
4. ❌ **Hard to maintain** - Changes require updating multiple files

**Example of the problem:**

```js
// Page.js (parent) - Updated
async show() {
  // New: Added scroll guard
  if (!this.smoothScroll.enabled() && !this.preloader) {
    this.smoothScroll.create();
    this.smoothScroll.scrollTo(0, {immediate: true});
  }
  // New: Added analytics
  this.trackPageView();
  await this.animation.GSAPHideTransition(this.transitionOverlay);
}

// Home.js (subclass) - Must update manually
async show() {
  // ❌ Must remember to add trackPageView() here too!
  if (!this.smoothScroll.enabled() && !this.preloader) {
    this.smoothScroll.create();
    this.smoothScroll.scrollTo(0, {immediate: true});
  }
  // ❌ Missing trackPageView() - bug!
  await this.animation.GSAPHideTransition(this.transitionOverlay);
  this.playWelcomeAnimation();
}
```

---

## The Solution: Hooks (Extension Points)

**Hooks** are optional methods that parent class calls at specific points, allowing subclasses to customize behavior without overriding entire methods.

### How Hooks Work

```js
// Page.js (parent) - Provides hooks
async show() {
  // Base logic that ALWAYS runs
  if (!this.smoothScroll.enabled() && !this.preloader) {
    this.smoothScroll.create();
    this.smoothScroll.scrollTo(0, {immediate: true});
  }
  
  // ✅ Hook: Call if subclass defines it
  await this.onBeforeShow?.(); // Optional - only runs if defined
  
  await this.animation.GSAPHideTransition(this.transitionOverlay);
  
  // ✅ Hook: Call after base logic
  await this.onAfterShow?.(); // Optional - only runs if defined
}

// Home.js (subclass) - Uses hooks
export class Home extends Page {
  // ✅ Only define what you want to customize
  async onBeforeShow() {
    console.log('About to show home page');
  }
  
  async onAfterShow() {
    // ✅ Custom logic here
    this.playWelcomeAnimation();
    // Don't need to duplicate parent's show() logic!
  }
}
```

**Benefits:**
1. ✅ **No code duplication** - Parent logic stays in parent
2. ✅ **Automatic updates** - Parent changes apply to all subclasses
3. ✅ **Optional** - Only define hooks you need
4. ✅ **Safe** - Can't break parent logic by forgetting steps

---

## Complete Example: Hooks vs Overriding

### Scenario: Home Page Needs Custom Show Logic

**With Overriding (❌ Bad):**

```js
// Page.js
async show() {
  // Step 1: Initialize scroll
  if (!this.smoothScroll.enabled() && !this.preloader) {
    this.smoothScroll.create();
    this.smoothScroll.scrollTo(0, {immediate: true});
  }
  
  // Step 2: Track analytics
  this.trackPageView();
  
  // Step 3: Hide transition
  await this.animation.GSAPHideTransition(this.transitionOverlay);
  
  // Step 4: Focus management
  this.focusMainContent();
}

// Home.js - Must override entire method
async show() {
  // ❌ Must duplicate all 4 steps
  if (!this.smoothScroll.enabled() && !this.preloader) {
    this.smoothScroll.create();
    this.smoothScroll.scrollTo(0, {immediate: true});
  }
  this.trackPageView(); // ❌ Copy-paste
  await this.animation.GSAPHideTransition(this.transitionOverlay); // ❌ Copy-paste
  this.focusMainContent(); // ❌ Copy-paste
  
  // ✅ Only this is new
  this.playWelcomeAnimation();
}

// Problem: If Page.show() changes, must update Home.show() too!
// Problem: 10 lines of duplication
```

**With Hooks (✅ Good):**

```js
// Page.js - Provides hooks
async show() {
  // Step 1: Initialize scroll
  if (!this.smoothScroll.enabled() && !this.preloader) {
    this.smoothScroll.create();
    this.smoothScroll.scrollTo(0, {immediate: true});
  }
  
  // Step 2: Track analytics
  this.trackPageView();
  
  // ✅ Hook: Before transition
  await this.onBeforeShow?.();
  
  // Step 3: Hide transition
  await this.animation.GSAPHideTransition(this.transitionOverlay);
  
  // Step 4: Focus management
  this.focusMainContent();
  
  // ✅ Hook: After everything
  await this.onAfterShow?.();
}

// Home.js - Only defines what's needed
export class Home extends Page {
  // ✅ Only 1 line - just the custom logic
  async onAfterShow() {
    this.playWelcomeAnimation();
  }
}

// ✅ No duplication
// ✅ Automatic updates
// ✅ Clean and simple
```

---

## Pros and Cons: Overriding vs Hooks

### Overriding (Current Pattern - If You Used It)

**Pros:**
- ✅ Full control - can change any part
- ✅ Simple concept - just override method
- ✅ No framework needed - native JavaScript

**Cons:**
- ❌ Code duplication - must copy parent logic
- ❌ Fragile - parent changes break subclasses
- ❌ Maintenance burden - update multiple files
- ❌ Easy to miss steps - forget important logic
- ❌ Hard to test - more code to test

### Hooks (Recommended Pattern)

**Pros:**
- ✅ No duplication - parent logic in one place
- ✅ Robust - parent changes apply automatically
- ✅ Clean - subclasses only add what's needed
- ✅ Safe - can't break parent logic
- ✅ Flexible - optional hooks, define what you need

**Cons:**
- ⚠️ Slightly more complex - need to design hook points
- ⚠️ Must remember to call hooks in parent
- ⚠️ Less control - can't change parent logic order

---

## Complete Hook Implementation

### Parent Class with Hooks

```js
export default class Page {
  constructor({ id, element, elements }) {
    this.id = id;
    this.selector = element;
    this.selectorChildren = elements;
    this._created = false;
    this._destroyed = false;
  }
  
  async create() {
    if (this._created) return;
    this._created = true;
    
    // Base initialization
    this.element = $(this.selector);
    this.elements = pageObject(this.selectorChildren);
    
    // ✅ Hook: Before components created
    await this.onBeforeCreate?.();
    
    // Base component setup
    this.smoothScroll = new SmoothScroll();
    this.footnotes = new Footnotes({smoothScroll: this.smoothScroll});
    this.createAnimations();
    this.setupEventListeners();
    
    // ✅ Hook: After components created
    await this.onAfterCreate?.();
  }
  
  async show() {
    if (!this.smoothScroll.enabled() && !this.preloader) {
      this.smoothScroll.create();
      this.smoothScroll.scrollTo(0, {immediate: true});
    }
    
    // ✅ Hook: Before transition
    await this.onBeforeShow?.();
    
    await this.animation.GSAPHideTransition(this.transitionOverlay);
    
    // ✅ Hook: After transition
    await this.onAfterShow?.();
  }
  
  async hide(route) {
    // ✅ Hook: Before transition
    await this.onBeforeHide?.(route);
    
    await this.transitionManager.getTransition(route);
    await this.animation.GSAPShowTransition(this.transitionOverlay);
    
    // ✅ Hook: After transition, before destroy
    await this.onAfterHide?.(route);
    
    this.destroy();
  }
  
  destroy() {
    if (this._destroyed) return;
    this._destroyed = true;
    
    // ✅ Hook: Before cleanup
    this.onBeforeDestroy?.();
    
    this.removeEventListeners();
    if (this.smoothScroll) {
      this.smoothScroll.destroy();
      this.smoothScroll = null;
    }
    
    // ✅ Hook: After cleanup
    this.onAfterDestroy?.();
  }
  
  // Hook methods (optional, subclasses can override)
  async onBeforeCreate() {} // Optional
  async onAfterCreate() {} // Optional
  async onBeforeShow() {} // Optional
  async onAfterShow() {} // Optional
  async onBeforeHide(route) {} // Optional
  async onAfterHide(route) {} // Optional
  onBeforeDestroy() {} // Optional
  onAfterDestroy() {} // Optional
}
```

### Subclass Using Hooks

```js
// Home.js
export class Home extends Page {
  constructor() {
    super({
      id: "home",
      element: ".home",
      elements: { /* ... */ },
    });
  }
  
  // ✅ Only define hooks you need
  async onAfterCreate() {
    // Custom logic after page is created
    this.setupHomeSpecificFeatures();
  }
  
  async onAfterShow() {
    // Custom logic after page is shown
    this.playWelcomeAnimation();
    this.initializeHomeSlider();
  }
  
  async onBeforeHide(route) {
    // Custom cleanup before hiding
    this.stopHomeAnimations();
  }
}

// View.js - No hooks needed, uses parent implementation
export class View extends Page {
  constructor({ id, element, elements }) {
    super({ id, element, elements });
  }
  // ✅ Doesn't need to define anything - uses parent's show/hide
}
```

---

## Composition vs Inheritance

### Current: Inheritance

```js
class Page {
  async show() { /* ... */ }
}

class Home extends Page {
  // Home IS-A Page
}
```

### Alternative: Composition

```js
// Page is a composition of behaviors
class Page {
  constructor(behaviors = {}) {
    this.showBehavior = behaviors.show || new DefaultShowBehavior();
    this.hideBehavior = behaviors.hide || new DefaultHideBehavior();
  }
  
  async show() {
    await this.showBehavior.execute(this);
  }
}

// Home uses composition
class Home {
  constructor() {
    super({
      show: new HomeShowBehavior(), // Custom behavior
      hide: new DefaultHideBehavior(), // Default behavior
    });
  }
}
```

## Inheritance vs Composition Comparison

### Inheritance (Current Approach)

**Pros:**
- ✅ Simple - familiar pattern
- ✅ Direct access to parent methods
- ✅ Good for "IS-A" relationships (Home IS-A Page)
- ✅ Less boilerplate

**Cons:**
- ❌ Tight coupling - subclass depends on parent
- ❌ Can't easily swap implementations
- ❌ Single inheritance only (can't extend multiple classes)
- ❌ Overriding can break parent logic
- ❌ Hard to test in isolation

### Composition (Alternative Approach)

**Pros:**
- ✅ Loose coupling - can swap behaviors
- ✅ Flexible - mix and match behaviors
- ✅ Testable - test behaviors independently
- ✅ No inheritance hierarchy
- ✅ Can use multiple behaviors simultaneously

**Cons:**
- ⚠️ More complex - more classes/interfaces
- ⚠️ More boilerplate
- ⚠️ Must pass dependencies through

---

## Could Composition Solve Your Issues?

**Short answer: Yes, but it might be overkill for your use case.**

### Current Problem with Inheritance

```js
// Problem: Overriding requires duplication
class Home extends Page {
  async show() {
    // Must duplicate parent logic
    super.show(); // Can't easily customize specific step
  }
}
```

### How Composition Would Solve It

```js
// Composition approach
class Page {
  constructor({ showBehavior, hideBehavior }) {
    this.showBehavior = showBehavior;
    this.hideBehavior = hideBehavior;
  }
  
  async show() {
    await this.showBehavior.execute(this);
  }
}

// Easy to customize
class Home extends Page {
  constructor() {
    super({
      showBehavior: new CustomShowBehavior(), // Swap behavior
      hideBehavior: new DefaultHideBehavior(),
    });
  }
}

// Or use hooks with composition
class Page {
  constructor({ hooks = {} }) {
    this.hooks = hooks;
  }
  
  async show() {
    await this.hooks.onBeforeShow?.();
    // ... base logic ...
    await this.hooks.onAfterShow?.();
  }
}

class Home {
  constructor() {
    super({
      hooks: {
        onAfterShow: () => this.playWelcomeAnimation(),
      },
    });
  }
}
```

---

## Recommendation for Your Codebase

### For Your Current Size: Inheritance + Hooks ✅

**Why:**
- Simple codebase - don't need composition complexity
- Hooks solve the overriding problem
- Familiar pattern (inheritance)
- Easy to understand

**Implementation:**

```js
// Page.js - Add hooks
async show() {
  // Base logic
  if (!this.smoothScroll.enabled() && !this.preloader) {
    this.smoothScroll.create();
    this.smoothScroll.scrollTo(0, {immediate: true});
  }
  
  // ✅ Hook point
  await this.onBeforeShow?.();
  
  await this.animation.GSAPHideTransition(this.transitionOverlay);
  
  // ✅ Hook point
  await this.onAfterShow?.();
}

// Home.js - Use hooks
export class Home extends Page {
  async onAfterShow() {
    this.playWelcomeAnimation();
  }
}
```

### When to Consider Composition

Consider composition if:
- You have 10+ page types with very different behaviors
- You need to swap behaviors at runtime
- You need to test behaviors in isolation
- You want maximum flexibility

For now, **inheritance + hooks** is the sweet spot.

---

## Summary

**Subclasses:** Yes, classes like `Home extends Page` are subclasses.

**Overriding problems:**
- Code duplication
- Fragile to parent changes
- Hard to maintain

**Hooks solution:**
- Optional extension points
- No duplication
- Safe customization

**Composition alternative:**
- More flexible
- More complex
- Probably overkill for your size

**Recommendation:** Use inheritance with hooks - best balance of simplicity and flexibility for your codebase.



# Making Lifecycle Methods Idempotent

## What Is Idempotency?

**Idempotent** = Calling a method multiple times has the same effect as calling it once.

```js
// ✅ Idempotent
create(); // Creates page
create(); // Does nothing (already created)
create(); // Does nothing (already created)
// Result: Page created once ✅

// ❌ Not idempotent
create(); // Creates page + attaches listeners
create(); // Creates page AGAIN + attaches listeners AGAIN
// Result: Duplicate listeners, animations, memory leaks ❌
```

## Why Idempotency Matters

Lifecycle methods (`create()`, `destroy()`) can be called multiple times in real-world scenarios:

- **Rapid navigation**: User clicks links quickly before pages finish loading
- **Error recovery**: Retry logic calls `create()` again after partial failures
- **Browser navigation**: Back/forward buttons trigger multiple events
- **Hot reload**: Development tools re-initialize components
- **Programmatic calls**: Multiple code paths call the same method

Without idempotency, each call creates duplicates:
- Duplicate event listeners (handlers fire multiple times)
- Duplicate animations (visual glitches)
- Memory leaks (old instances never cleaned up)
- Errors on destroy (trying to destroy already-destroyed resources)

## The Problem: Vulnerable Code

```js
async create() {
  // ❌ No guard - can be called multiple times
  this.element = $(this.selector);
  this.smoothScroll = new SmoothScroll(); // ❌ New instance every time
  this.footnotes = new Footnotes({smoothScroll: this.smoothScroll});
  this.createAnimations(); // ❌ Duplicate animations
  this.setupEventListeners(); // ❌ Duplicate listeners
}

destroy() {
  // ❌ No guard - can be called multiple times
  this.removeEventListeners();
  this.smoothScroll.destroy(); // ❌ Error if already destroyed
}
```

**Example of the problem:**
```js
// User clicks "Home" link twice quickly
onPageChange('home');
  → await this.currentPage.create(); // ✅ Creates page, attaches listeners

onPageChange('home'); // Called again before first completes
  → await this.currentPage.create(); // ❌ Creates duplicates!
  // Result: 2 sets of listeners, 2 sets of animations, memory leak
```

## The Solution: Idempotent Lifecycle

Use **lifecycle flags** to track state and guard against multiple calls:

```js
constructor({ id, element, elements }) {
  this.id = id;
  this.selector = element;
  this.selectorChildren = elements;
  
  // ✅ Initialize lifecycle flags
  this._created = false;
  this._destroyed = false;
  this._listenersSetup = false;
}

async create() {
  // ✅ Guard: Check if already created
  if (this._created) {
    console.warn(`Page ${this.id}.create() called multiple times`);
    return; // Early return - do nothing
  }
  
  // ✅ Guard against recreating destroyed page
  if (this._destroyed) {
    throw new Error(`Cannot create destroyed page: ${this.id}. Create new instance.`);
  }
  
  // ✅ Set flag BEFORE doing work
  this._created = true;
  
  // Now safe to do initialization
  this.element = $(this.selector);
  this.elements = pageObject(this.selectorChildren);
  this.transitionOverlay = document.querySelector(".page-transition-overlay");
  
  // ✅ Check before creating instances (or inject dependencies)
  if (!this.transitionManager) {
    this.transitionManager = new TransitionManager();
  }
  this.transitionManager.setupTransitionTemplates();
  
  if (!this.smoothScroll) {
    this.smoothScroll = new SmoothScroll();
  }
  
  this.footnotes = new Footnotes({smoothScroll: this.smoothScroll});
  this.createAnimations();
  this.setupEventListeners();
  this.preloader = document.querySelector(".preloader");
  this.smoothScroll.scrollTo(0, {immediate: true});
}

destroy() {
  // ✅ Guard: Check if already destroyed
  if (this._destroyed) {
    console.warn(`Page ${this.id}.destroy() called multiple times`);
    return; // Early return - do nothing
  }
  
  // ✅ Set flag BEFORE doing work
  this._destroyed = true;
  this._created = false; // Reset so page can't be reused
  
  this.removeEventListeners();
  
  // ✅ Safe cleanup with null checks
  if (this.smoothScroll) {
    this.smoothScroll.destroy();
    this.smoothScroll = null;
  }
  
  if (this.footnotes) {
    this.footnotes.destroy();
    this.footnotes = null;
  }
  
  // ✅ Clear references
  this.element = null;
  this.elements = null;
  this.transitionOverlay = null;
  this.preloader = null;
}

setupEventListeners() {
  // ✅ Additional safety: guard listener setup
  if (this._listenersSetup) return;
  this._listenersSetup = true;
  
  this.footnotes.setup();
  this.smoothScroll.resize();
}

removeEventListeners() {
  if (!this._listenersSetup) return;
  this._listenersSetup = false;
  
  this.footnotes?.destroy();
  // Note: smoothScroll.resize() listener is on window, 
  // should be removed in smoothScroll.destroy()
}
```

## How It Works

**Multiple `create()` calls:**
```js
page.create(); // ✅ Creates everything, sets _created = true
page.create(); // ✅ Checks _created, returns early, does nothing
// Result: Only created once ✅
```

**Multiple `destroy()` calls:**
```js
page.destroy(); // ✅ Destroys everything, sets _destroyed = true
page.destroy(); // ✅ Checks _destroyed, returns early, does nothing
// Result: Only destroyed once ✅
```

**Real-world flow:**
```js
// User clicks "Home" link
onPageChange('home');
  → await this.currentPage.create(); // ✅ Creates page, _created = true

// User clicks "Home" link AGAIN (before navigation completes)
onPageChange('home');
  → await this.currentPage.create(); // ✅ Checks _created, returns early
  → No duplicates! ✅

// User navigates away
onPageChange('about');
  → await this.currentPage.hide(); // Calls destroy(), _destroyed = true
  → await this.currentPage.create(); // Creates NEW page instance
  → New instance has _created = false, so creates normally ✅
```

## Key Principles

1. **Use lifecycle flags** (`_created`, `_destroyed`) to track state
2. **Check flags at the start** of methods, return early if already done
3. **Set flags before doing work** to prevent race conditions
4. **Clear references on destroy** to prevent memory leaks
5. **Guard nested operations** (like `setupEventListeners()`) for additional safety

## Summary

**Without idempotency:**
- ❌ Duplicate event listeners
- ❌ Duplicate animations
- ❌ Memory leaks
- ❌ Errors on destroy

**With idempotency:**
- ✅ Safe to call multiple times
- ✅ No duplicates
- ✅ No memory leaks
- ✅ No errors

**Implementation:**
- Add `_created` and `_destroyed` flags
- Check flags at start of methods
- Return early if already done
- Set flags before doing work
- Clear references on destroy
