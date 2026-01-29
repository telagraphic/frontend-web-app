# Design Patterns Guide: Patterns Implemented in This Codebase

## Table of Contents

- [Overview](#overview)
- [1. Factory Pattern](#1-factory-pattern)
- [2. Registry Pattern](#2-registry-pattern)
- [3. Dependency Injection](#3-dependency-injection)
- [4. Template Method Pattern](#4-template-method-pattern)
- [5. Observer Pattern](#5-observer-pattern)
- [6. Orchestrator Pattern](#6-orchestrator-pattern)
- [7. Strategy Pattern](#7-strategy-pattern)
- [8. Cache-Aside Pattern](#8-cache-aside-pattern)
- [9. Guard Clause Pattern](#9-guard-clause-pattern)
- [10. Lifecycle Hooks Pattern](#10-lifecycle-hooks-pattern)
- [11. Manager Pattern](#11-manager-pattern)
- [Summary](#summary)

---

## Overview

This document catalogs all design patterns implemented in this codebase, explaining:
- **What** each pattern is
- **Where** it's used in the codebase
- **What problem** it solves
- **Code examples** showing the implementation
- **What bad code** it replaces

These patterns work together to create a maintainable, testable, and scalable single-page application architecture.

---

## 1. Factory Pattern

### What It Is

The Factory Pattern provides a centralized way to create objects without specifying the exact class of object that will be created. It encapsulates object creation logic.

### Where It's Used

**Location:** `app/services/ServicesFactory.js`

The `createServices()` function acts as a factory that creates and wires all application services.

### What Problem It Solves

**Before (Bad Code):**
```javascript
// ❌ BAD: Services created everywhere, dependencies scattered
class App {
  constructor() {
    // Services created in multiple places
    this.registry = new RegistryService();
    this.transitionManager = new TransitionsService();
    this.router = new Router();
    
    // Dependencies manually wired
    this.transitionManager.registry = this.registry;
    this.router.registry = this.registry;
    this.router.transitionManager = this.transitionManager;
    
    // Hard to test - can't easily swap implementations
    // Hard to configure - settings scattered
    // Hard to track dependencies - no single source of truth
  }
}

// ❌ BAD: Each page creates its own services
class Page {
  constructor() {
    this.transitionManager = new TransitionsService(); // New instance!
    // Duplicate instances, no shared state
  }
}
```

**After (Good Code):**
```javascript
// ✅ GOOD: Factory centralizes creation
export function createServices() {
  // Phase 1: Create base services
  const siteConfig = new SiteConfig();
  const animationsService = new AnimationsService();
  const transitionsService = new TransitionsService({ 
    siteConfig,
    transitionType: TRANSITION_TYPES.CUSTOM
  });
  const smoothScroll = new SmoothScroll();
  const footnotes = new Footnotes({ smoothScroll });
  
  // Phase 2: Create dependent services
  const routerPageLoader = new RouterPageLoader({ 
    siteConfig, 
    smoothScroll, 
    animationsManager: animationsService, 
    transitionsManager: transitionsService, 
    footnotes 
  });
  const registryService = new RegistryService({ 
    siteConfig, 
    routerPageLoader 
  });
  
  // Phase 3: Wire circular dependencies
  routerPageLoader.setRegistryService(registryService);
  registryService.setRouterPageLoader(routerPageLoader);
  
  // Return all services
  return {
    siteConfig,
    router,
    smoothScroll,
    animationsService,
    transitionsService,
    registryService,
    // ... all services
  };
}

// ✅ GOOD: App uses factory
class App {
  constructor() {
    this.services = createServices(); // Single point of creation
    // All dependencies properly wired
    // Easy to test (can pass mock services)
    // Easy to configure (pass config to factory)
  }
}
```

### Benefits

1. **Single Source of Truth**: All services created in one place
2. **Dependency Management**: Dependencies automatically wired
3. **Testability**: Easy to create test services with mocks
4. **Configuration**: Can pass environment-specific config
5. **No Duplication**: Services created once and shared

### Code Example

```javascript
// app/services/ServicesFactory.js
export function createServices() {
  const siteConfig = new SiteConfig();
  const animationsService = new AnimationsService();
  const transitionsService = new TransitionsService({ 
    siteConfig,
    transitionType: TRANSITION_TYPES.CUSTOM
  });
  
  // ... create all services with proper dependencies
  
  return {
    siteConfig,
    router,
    smoothScroll,
    animationsService,
    transitionsService,
    registryService,
    routerPageLoader,
    routerPageManager,
    routerHistory,
    routerResolver,
    navigation,
    prefetchCache,
    prefetchManager,
  };
}
```

---

## 2. Registry Pattern

### What It Is

The Registry Pattern maintains a central registry (Map) of objects that can be looked up by key. It provides a way to store and retrieve objects without knowing their concrete types.

### Where It's Used

**Locations:**
- `app/services/RegistryService.js` - Page class registry
- `app/services/AnimationsService.js` - Animation type registry

### What Problem It Solves

**Before (Bad Code):**
```javascript
// ❌ BAD: Hard-coded lookups, no central registry
class Router {
  async loadPage(template) {
    // Hard-coded switch statement
    switch(template) {
      case 'home':
        return await import('./pages/Home.js');
      case 'introduction':
        return await import('./pages/Introduction.js');
      case 'section-1':
        return await import('./pages/View.js');
      // ... 20+ more cases
      default:
        throw new Error('Unknown page');
    }
  }
}

// ❌ BAD: Animation types hard-coded
class AnimationsService {
  createAnimation(type, element) {
    if (type === 'title') {
      return new Titles(element);
    } else if (type === 'image') {
      return new Images(element);
    }
    // Hard to extend - must modify this code
  }
}
```

**After (Good Code):**
```javascript
// ✅ GOOD: Registry for page classes
export class RegistryService {
  constructor({ siteConfig, routerPageLoader }) {
    this.siteConfig = siteConfig;
    this.routerPageLoader = routerPageLoader;
    this.pages = new Map(); // Registry: template → PageClass
    this.currentPage = null;
    this.currentPageTemplate = null;
  }

  setPage(page, pageClass) {
    this.pages.set(page, pageClass);
  }

  getPage(page) {
    return this.pages.get(page);
  }

  hasPage(page) {
    return this.pages.has(page);
  }
}

// ✅ GOOD: Registry for animation types
export class AnimationsService {
  constructor() {
    this.animationRegistry = {
      title: Titles,
      // Easy to extend - just add to registry
      // Future: image: Images, parallax: Parallax
    };
  }

  createAnimationInstances(elementsByType) {
    const animations = [];
    elementsByType.forEach((elements, type) => {
      const AnimationClass = this.animationRegistry[type];
      if (!AnimationClass) {
        throw new Error(`Unknown animation type: ${type}`);
      }
      elements.forEach((element) => {
        const animation = new AnimationClass(element);
        animations.push(animation);
      });
    });
    return animations;
  }
}
```

### Benefits

1. **Extensibility**: Add new types without modifying existing code
2. **Centralized Lookup**: Single place to find registered objects
3. **Dynamic Registration**: Can register types at runtime
4. **Type Safety**: Can validate types before use
5. **Testability**: Easy to mock registry entries

### Code Example

```javascript
// app/services/RegistryService.js
export class RegistryService {
  constructor({ siteConfig, routerPageLoader }) {
    this.pages = new Map(); // Registry: template → PageClass
    this.currentPage = null;
    this.currentPageTemplate = null;
  }

  setPage(page, pageClass) {
    this.pages.set(page, pageClass);
  }

  getPage(page) {
    return this.pages.get(page);
  }

  hasPage(page) {
    return this.pages.has(page);
  }
}

// Usage in RouterPageLoader
async loadPage(template) {
  // Check registry first
  if (this.registryService.hasPage(template)) {
    return this.registryService.getPage(template);
  }
  
  // Load and register
  const PageClass = await import(`./pages/${template}.js`);
  this.registryService.setPage(template, PageClass);
  return PageClass;
}
```

---

## 3. Dependency Injection

### What It Is

Dependency Injection (DI) is a technique where objects receive their dependencies from external sources rather than creating them internally. This promotes loose coupling and testability.

### Where It's Used

**Location:** Throughout the codebase, primarily in `app/services/ServicesFactory.js`

All services receive their dependencies through constructor parameters rather than creating them internally.

### What Problem It Solves

**Before (Bad Code):**
```javascript
// ❌ BAD: Tight coupling, hard to test
class Page {
  constructor() {
    // Creates dependencies internally
    this.transitionManager = new TransitionsService();
    this.smoothScroll = new SmoothScroll();
    this.animationsManager = new AnimationsService();
    
    // Can't swap implementations
    // Can't test with mocks
    // Each page creates new instances (no sharing)
  }
}

class Router {
  constructor() {
    // Creates dependencies internally
    this.registry = new RegistryService();
    this.pageLoader = new RouterPageLoader();
    
    // Hard dependencies - can't test in isolation
  }
}
```

**After (Good Code):**
```javascript
// ✅ GOOD: Dependencies injected
class Page {
  constructor({
    element,
    elements,
    smoothScroll,        // Injected
    animationsManager,   // Injected
    transitionsManager,  // Injected
    footnotes,           // Injected
  }) {
    this.smoothScroll = smoothScroll;
    this.animationsManager = animationsManager;
    this.transitionsManager = transitionsManager;
    this.footnotes = footnotes;
    // Dependencies come from outside - easy to test, easy to swap
  }
}

class Router {
  constructor({
    siteConfig,
    registryService,      // Injected
    routerPageLoader,     // Injected
    routerPageManager,    // Injected
    routerHistory,        // Injected
    routerResolver,       // Injected
    smoothScroll,         // Injected
    transitionsManager,   // Injected
    // ... all dependencies injected
  }) {
    this.registryService = registryService;
    this.routerPageLoader = routerPageLoader;
    // All dependencies injected - testable, flexible
  }
}

// Factory wires dependencies
export function createServices() {
  const transitionsService = new TransitionsService({ siteConfig });
  const smoothScroll = new SmoothScroll();
  const routerPageLoader = new RouterPageLoader({ 
    siteConfig, 
    smoothScroll, 
    transitionsManager: transitionsService 
  });
  
  const router = new Router({
    registryService,
    routerPageLoader,
    transitionsManager: transitionsService,
    smoothScroll,
    // ... all dependencies
  });
  
  return { router, transitionsService, smoothScroll, /* ... */ };
}
```

### Benefits

1. **Loose Coupling**: Classes don't depend on concrete implementations
2. **Testability**: Easy to inject mocks for testing
3. **Flexibility**: Can swap implementations without changing code
4. **Shared Instances**: Services can be shared across components
5. **Clear Dependencies**: Constructor shows exactly what's needed

### Code Example

```javascript
// app/services/ServicesFactory.js
export function createServices() {
  // Create services with dependencies
  const siteConfig = new SiteConfig();
  const animationsService = new AnimationsService();
  const transitionsService = new TransitionsService({ 
    siteConfig,
    transitionType: TRANSITION_TYPES.CUSTOM
  });
  const smoothScroll = new SmoothScroll();
  const footnotes = new Footnotes({ smoothScroll });
  
  // Inject dependencies
  const routerPageLoader = new RouterPageLoader({ 
    siteConfig, 
    smoothScroll, 
    animationsManager: animationsService, 
    transitionsManager: transitionsService, 
    footnotes 
  });
  
  // Return services (can be injected into other classes)
  return {
    siteConfig,
    transitionsService,
    smoothScroll,
    routerPageLoader,
    // ... all services
  };
}
```

---

## 4. Template Method Pattern

### What It Is

The Template Method Pattern defines the skeleton of an algorithm in a base class, allowing subclasses to override specific steps without changing the overall structure.

### Where It's Used

**Locations:**
- `app/components/Component.js` - Base component class
- `app/pages/Page.js` - Base page class

### What Problem It Solves

**Before (Bad Code):**
```javascript
// ❌ BAD: Duplicated lifecycle code in every component
class Preloader {
  create() {
    // Find element
    this.element = document.querySelector('.preloader');
    // Setup event listeners
    this.setupListeners();
    // Initialize
    this.init();
  }
  
  destroy() {
    // Remove listeners
    this.removeListeners();
    // Cleanup
    this.cleanup();
  }
}

class Navigation {
  create() {
    // Find element (duplicated)
    this.element = document.querySelector('.navigation');
    // Setup event listeners (duplicated)
    this.setupListeners();
    // Initialize (duplicated)
    this.init();
  }
  
  destroy() {
    // Remove listeners (duplicated)
    this.removeListeners();
    // Cleanup (duplicated)
    this.cleanup();
  }
}
```

**After (Good Code):**
```javascript
// ✅ GOOD: Template method in base class
export default class Component extends EventTarget {
  constructor({ element, elements }) {
    super();
    this.selector = element;
    this.selectorChildren = { ...elements };
    this.eventManager = new EventManager();
    this.element = null;
    this.elements = {};
  }

  // Template method - defines the algorithm
  create() {
    // Step 1: Find elements (common)
    const { element, elements } = createComponentPageObjectFromSelectors(
      this.selector,
      this.selectorChildren
    );
    this.element = element;
    this.elements = elements;
    
    // Step 2: Subclass can override
    this.onCreate?.();
  }

  // Template method for cleanup
  destroy() {
    // Step 1: Remove listeners (common)
    this.removeAllListeners();
    
    // Step 2: Subclass can override
    this.onDestroy?.();
  }
}

// ✅ GOOD: Subclasses implement specific steps
class Preloader extends Component {
  constructor() {
    super({ element: '.preloader', elements: {} });
  }
  
  // Override specific step
  onCreate() {
    this.setupPreloader();
  }
  
  onDestroy() {
    this.cleanupPreloader();
  }
}

class Navigation extends Component {
  constructor() {
    super({ element: '.navigation', elements: {} });
  }
  
  // Override specific step
  onCreate() {
    this.setupNavigation();
  }
  
  onDestroy() {
    this.cleanupNavigation();
  }
}
```

### Benefits

1. **Code Reuse**: Common algorithm steps defined once
2. **Consistency**: All components follow same lifecycle
3. **Flexibility**: Subclasses can customize specific steps
4. **Maintainability**: Change algorithm in one place
5. **Clear Structure**: Algorithm structure is obvious

### Code Example

```javascript
// app/components/Component.js
export default class Component extends EventTarget {
  constructor({ element, elements }) {
    super();
    this.selector = element;
    this.selectorChildren = { ...elements };
    this.eventManager = new EventManager();
    this.element = null;
    this.elements = {};
  }

  // Template method
  create() {
    // Common step: Find elements
    const { element, elements } = createComponentPageObjectFromSelectors(
      this.selector,
      this.selectorChildren
    );
    this.element = element;
    this.elements = elements;
  }

  // Template method
  destroy() {
    // Common step: Remove listeners
    this.removeAllListeners();
  }
}

// app/pages/Page.js
export default class Page {
  // Template method
  async create() {
    await this.beforeCreate?.();  // Hook point
    await this.createElements();   // Common step
    await this.createComponents(); // Common step
    this.createPageAnimations();  // Common step
    this.createPage();            // Common step
    await this.afterCreate?.();    // Hook point
  }
  
  // Subclasses can override specific steps
  async createElements() {
    this.element = $(SELECTORS.MAIN_WITH_TEMPLATE);
    this.elements = createPageObjectFromSelectors(this.selectorChildren);
  }
}
```

---

## 5. Observer Pattern

### What It Is

The Observer Pattern defines a one-to-many dependency between objects so that when one object changes state, all its dependents are notified and updated automatically.

### Where It's Used

**Location:** `app/utilities/EventManager.js`

The `EventManager` implements the Observer pattern using the native `EventTarget` API, allowing components to subscribe to and emit events.

### What Problem It Solves

**Before (Bad Code):**
```javascript
// ❌ BAD: Direct method calls, tight coupling
class Preloader {
  complete() {
    // Directly calls router method
    this.router.startNavigation();
    // Directly calls page method
    this.page.show();
    // Must know about all dependents
  }
}

class Router {
  startNavigation() {
    // Router must know about preloader
    if (this.preloader.isComplete) {
      // ...
    }
  }
}

// ❌ BAD: Callback hell
class App {
  init() {
    this.preloader.onComplete(() => {
      this.router.start(() => {
        this.page.show(() => {
          // Nested callbacks - hard to maintain
        });
      });
    });
  }
}
```

**After (Good Code):**
```javascript
// ✅ GOOD: Observer pattern with EventManager
export class EventManager {
  constructor() {
    this.eventTarget = new EventTarget();
    this.eventHandlers = new Map();
  }

  emit(type, detail) {
    this.eventTarget.dispatchEvent(new CustomEvent(type, { detail }));
  }

  on(type, callback) {
    const handler = (event) => callback(event.detail);
    this.eventTarget.addEventListener(type, handler);
    this.registerEvent(type, handler, this.eventTarget);
  }
}

// ✅ GOOD: Loose coupling with events
class Preloader extends Component {
  complete() {
    // Emit event - doesn't know who's listening
    this.emit('preloader-complete', { percentage: 100 });
  }
}

class Router {
  constructor() {
    // Subscribe to events
    this.preloader.on('preloader-complete', () => {
      this.startNavigation();
    });
  }
}

class Page {
  constructor() {
    // Subscribe to events
    this.preloader.on('preloader-complete', () => {
      this.show();
    });
  }
}
```

### Benefits

1. **Loose Coupling**: Publishers don't know about subscribers
2. **Dynamic Relationships**: Can add/remove observers at runtime
3. **Broadcast Communication**: One event can notify many listeners
4. **Separation of Concerns**: Event logic separate from business logic
5. **Testability**: Easy to test event emission/subscription

### Code Example

```javascript
// app/utilities/EventManager.js
export class EventManager {
  constructor() {
    this.eventTarget = new EventTarget();
    this.eventHandlers = new Map();
  }

  emit(type, detail) {
    this.eventTarget.dispatchEvent(new CustomEvent(type, { detail }));
  }

  on(type, callback) {
    const handler = (event) => callback(event.detail);
    this.eventTarget.addEventListener(type, handler);
    this.registerEvent(type, handler, this.eventTarget);
  }

  removeAllListeners(type) {
    if (type) {
      const handlers = this.eventHandlers.get(type) || [];
      handlers.forEach(({ handler, target }) => {
        target.removeEventListener(type, handler);
      });
      this.eventHandlers.delete(type);
    } else {
      // Remove all listeners
      this.eventHandlers.forEach((handlers, eventType) => {
        handlers.forEach(({ handler, target }) => {
          target.removeEventListener(eventType, handler);
        });
      });
      this.eventHandlers.clear();
    }
  }
}

// Usage in Component
class Preloader extends Component {
  complete() {
    this.emit('preloader-complete', { percentage: 100 });
  }
}

// Usage in App
class App {
  init() {
    this.preloader.on('preloader-complete', () => {
      this.router.start();
    });
  }
}
```

---

## 6. Orchestrator Pattern

### What It Is

The Orchestrator Pattern coordinates multiple steps or services to complete a workflow. It centralizes control and sequencing while individual steps remain focused.

### Where It's Used

**Location:** `app/router/Router.js`

The `Router` class orchestrates the page navigation lifecycle, coordinating multiple services to complete navigation.

### What Problem It Solves

**Before (Bad Code):**
```javascript
// ❌ BAD: Navigation logic scattered, no coordination
class App {
  async handleLinkClick(href) {
    // Step 1: Hide current page (in Page class)
    await this.currentPage.hide();
    
    // Step 2: Fetch new page (somewhere else)
    const html = await fetch(`/pages/${href}.html`);
    
    // Step 3: Update DOM (in another class)
    document.querySelector('main').innerHTML = await html.text();
    
    // Step 4: Load page class (somewhere)
    const PageClass = await import(`./pages/${href}.js`);
    
    // Step 5: Create page (in Page class)
    this.currentPage = new PageClass();
    await this.currentPage.create();
    
    // Step 6: Show page (in Page class)
    await this.currentPage.show();
    
    // No error handling
    // No coordination
    // Hard to test
    // Hard to maintain
  }
}
```

**After (Good Code):**
```javascript
// ✅ GOOD: Orchestrator coordinates workflow
export class Router {
  async updatePage(href) {
    // Guard clause prevents concurrent navigation
    if (this.isNavigating) return;
    this.isNavigating = true;

    try {
      // Step 1: Validate route
      const routeInfo = await this.beforePageUpdate(href);
      
      // Step 2: Hide current page, update DOM, load new page
      const newPage = await this.startPageUpdate(routeInfo);
      
      // Step 3: Create and show new page
      await this.afterPageUpdate(newPage, routeInfo);
      
    } catch (error) {
      this.handleNavigationError(error);
    } finally {
      this.isNavigating = false;
    }
  }

  async beforePageUpdate(href) {
    // Validate route
    const validation = await this.routerResolver.validateRoute(href);
    if (!validation.isValid) {
      throw new Error(`Invalid route: ${href}`);
    }
    return validation;
  }

  async startPageUpdate(routeInfo) {
    // Hide current page
    await this.registryService.getCurrentPage()?.hide(routeInfo.normalizedPath);
    
    // Update DOM
    await this.routerPageManager.updatePage(routeInfo.normalizedPath);
    
    // Update history
    this.routerHistory.updateHistory(routeInfo.normalizedPath, true);
    
    // Load page class
    const page = await this.routerPageLoader.getPage(routeInfo.template);
    return page;
  }

  async afterPageUpdate(newPage, routeInfo) {
    // Create page
    await newPage.create();
    
    // Show page
    await newPage.show();
  }
}
```

### Benefits

1. **Centralized Control**: All navigation logic in one place
2. **Error Handling**: Centralized error handling for entire workflow
3. **Testability**: Can test orchestration separately from steps
4. **Maintainability**: Easy to modify workflow steps
5. **Clear Flow**: Workflow is obvious and documented

### Code Example

```javascript
// app/router/Router.js
export class Router {
  constructor({
    siteConfig,
    registryService,
    routerPageLoader,
    routerPageManager,
    routerHistory,
    routerResolver,
    // ... dependencies
  }) {
    this.registryService = registryService;
    this.routerPageLoader = routerPageLoader;
    this.routerPageManager = routerPageManager;
    this.routerHistory = routerHistory;
    this.routerResolver = routerResolver;
    this.isNavigating = false; // Guard clause
  }

  async updatePage(href) {
    if (this.isNavigating) return;
    this.isNavigating = true;

    try {
      // Orchestrate navigation workflow
      const routeInfo = await this.beforePageUpdate(href);
      const newPage = await this.startPageUpdate(routeInfo);
      await this.afterPageUpdate(newPage, routeInfo);
    } catch (error) {
      this.handleNavigationError(error);
    } finally {
      this.isNavigating = false;
    }
  }
}
```

---

## 7. Strategy Pattern

### What It Is

The Strategy Pattern defines a family of algorithms, encapsulates each one, and makes them interchangeable. It lets the algorithm vary independently from clients that use it.

### Where It's Used

**Location:** `app/services/AnimationsService.js`

The animation registry maps animation types (strategies) to animation classes, allowing different animation behaviors to be selected at runtime.

### What Problem It Solves

**Before (Bad Code):**
```javascript
// ❌ BAD: Hard-coded if/else, hard to extend
class AnimationsService {
  createAnimation(type, element) {
    if (type === 'title') {
      return new Titles(element);
    } else if (type === 'image') {
      return new Images(element);
    } else if (type === 'parallax') {
      return new Parallax(element);
    } else {
      throw new Error('Unknown animation type');
    }
    // Must modify this code to add new types
  }
}

// ❌ BAD: Switch statement
class AnimationsService {
  createAnimation(type, element) {
    switch(type) {
      case 'title':
        return new Titles(element);
      case 'image':
        return new Images(element);
      case 'parallax':
        return new Parallax(element);
      default:
        throw new Error('Unknown animation type');
    }
    // Must modify this code to add new types
  }
}
```

**After (Good Code):**
```javascript
// ✅ GOOD: Strategy pattern with registry
export class AnimationsService {
  constructor() {
    // Registry maps type → strategy class
    this.animationRegistry = {
      title: Titles,
      // Easy to extend - just add to registry
      // Future: image: Images, parallax: Parallax
    };
  }

  createAnimationInstances(elementsByType) {
    const animations = [];
    elementsByType.forEach((elements, type) => {
      // Get strategy from registry
      const AnimationClass = this.animationRegistry[type];
      
      if (!AnimationClass) {
        throw new Error(`Unknown animation type: ${type}`);
      }

      // Create instance using strategy
      elements.forEach((element) => {
        const animation = new AnimationClass(element);
        animations.push(animation);
      });
    });
    return animations;
  }
  
  // Easy to register new strategies
  registerAnimationType(type, AnimationClass) {
    this.animationRegistry[type] = AnimationClass;
  }
}

// Usage: Different strategies for different types
// <h2 data-animation="title"> → Uses Titles strategy
// <img data-animation="image"> → Uses Images strategy
```

### Benefits

1. **Extensibility**: Add new strategies without modifying existing code
2. **Runtime Selection**: Choose strategy based on data attributes
3. **Open/Closed Principle**: Open for extension, closed for modification
4. **Separation**: Each strategy is independent
5. **Testability**: Can test strategies independently

### Code Example

```javascript
// app/services/AnimationsService.js
export class AnimationsService {
  constructor() {
    // Strategy registry
    this.animationRegistry = {
      title: Titles,
      // Future strategies can be added here
    };
  }

  createAnimationInstances(elementsByType) {
    const animations = [];
    elementsByType.forEach((elements, type) => {
      // Get strategy class from registry
      const AnimationClass = this.animationRegistry[type];
      
      if (!AnimationClass) {
        throw createError(ERROR_CODES.CLASS_NOT_FOUND, { 
          className: `animation type: ${type}` 
        });
      }

      // Create instances using the strategy
      elements.forEach((element) => {
        const animation = new AnimationClass(element);
        animations.push(animation);
        this.pageAnimations.push(animation);
      });
    });
    return animations;
  }
}

// HTML: Strategy selected via data attribute
// <h2 data-animation="title">My Title</h2>
// → Uses Titles strategy

// Future: Add new strategy
// this.animationRegistry.image = Images;
// <img data-animation="image" src="...">
// → Uses Images strategy
```

---

## 8. Cache-Aside Pattern

### What It Is

The Cache-Aside Pattern (also called Lazy Loading) loads data into the cache on demand. The application is responsible for loading data into the cache when needed.

### Where It's Used

**Location:** `app/router/RouterPrefetchCache.js`

The prefetch cache stores HTML for pages that have been prefetched on hover/focus, using a cache-aside strategy with LRU eviction and TTL expiration.

### What Problem It Solves

**Before (Bad Code):**
```javascript
// ❌ BAD: Always fetch, no caching
class RouterPageManager {
  async updatePage(route) {
    // Always fetches, even if already fetched
    const response = await fetch(`/pages/${route}.html`);
    const html = await response.text();
    
    // No caching - refetches on every navigation
    // Slow, wasteful, poor UX
    this.updateDOM(html);
  }
}

// ❌ BAD: Manual cache management scattered
class Router {
  constructor() {
    this.cache = {}; // Manual cache
  }
  
  async navigate(route) {
    if (this.cache[route]) {
      // Use cache
    } else {
      // Fetch and cache manually
      const html = await fetch(`/pages/${route}.html`);
      this.cache[route] = await html.text();
    }
    // No expiration, no size limits, memory leaks
  }
}
```

**After (Good Code):**
```javascript
// ✅ GOOD: Cache-aside pattern with LRU and TTL
export class RouterPrefetchCache {
  constructor({ maxSize = 10, ttlMs = 5 * 60 * 1000 } = {}) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
    this.cache = new Map(); // route → { html, timestamp, metadata }
  }

  // Cache-aside: Check cache first, load if missing
  get(route) {
    const entry = this.cache.get(route);
    if (!entry) return null;

    // TTL expiration
    const isExpired = Date.now() - entry.timestamp > this.ttlMs;
    if (isExpired) {
      this.cache.delete(route);
      return null;
    }

    // LRU: Move to most-recent
    this.cache.delete(route);
    this.cache.set(route, entry);

    return { html: entry.html, metadata: entry.metadata };
  }

  // Cache-aside: Store after fetch
  set(route, html, metadata = {}) {
    if (!route || typeof html !== "string") return;

    // LRU: Remove if exists
    if (this.cache.has(route)) {
      this.cache.delete(route);
    }

    // LRU: Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(route, { html, timestamp: Date.now(), metadata });
  }
}

// ✅ GOOD: Usage in RouterPageManager
class RouterPageManager {
  async updatePage(route) {
    // Cache-aside: Check cache first
    const cached = this.prefetchCache.get(route);
    if (cached) {
      // Use cached HTML
      this.updateDOM(cached.html);
      return;
    }
    
    // Cache-aside: Fetch if not in cache
    const response = await fetch(`/pages/${route}.html`);
    const html = await response.text();
    
    // Cache-aside: Store in cache
    this.prefetchCache.set(route, html);
    
    this.updateDOM(html);
  }
}
```

### Benefits

1. **Performance**: Avoids redundant network requests
2. **Memory Management**: LRU eviction prevents unbounded growth
3. **Freshness**: TTL expiration ensures data doesn't get stale
4. **Transparency**: Cache is separate from business logic
5. **Flexibility**: Can prefetch on hover/focus for better UX

### Code Example

```javascript
// app/router/RouterPrefetchCache.js
export class RouterPrefetchCache {
  constructor({ maxSize = 10, ttlMs = 5 * 60 * 1000 } = {}) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
    this.cache = new Map();
  }

  // Cache-aside: Check cache
  get(route) {
    const entry = this.cache.get(route);
    if (!entry) return null;

    // TTL check
    if (Date.now() - entry.timestamp > this.ttlMs) {
      this.cache.delete(route);
      return null;
    }

    // LRU: Move to end
    this.cache.delete(route);
    this.cache.set(route, entry);

    return { html: entry.html, metadata: entry.metadata };
  }

  // Cache-aside: Store
  set(route, html, metadata = {}) {
    // LRU eviction if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(route, { html, timestamp: Date.now(), metadata });
  }
}

// Usage in RouterPrefetchManager
class RouterPrefetchManager {
  async prefetch(route) {
    // Cache-aside: Check cache first
    if (this.prefetchCache.has(route)) {
      return; // Already cached
    }
    
    // Cache-aside: Fetch and store
    const response = await fetch(`/pages/${route}.html`);
    const html = await response.text();
    this.prefetchCache.set(route, html);
  }
}
```

---

## 9. Guard Clause Pattern

### What It Is

The Guard Clause Pattern uses early returns to handle edge cases and prevent invalid operations. It makes code more readable by handling exceptional cases first.

### Where It's Used

**Locations:**
- `app/router/Router.js` - `isNavigating` guard prevents concurrent navigation
- `app/pages/Page.js` - `_created` and `_destroyed` guards ensure idempotency

### What Problem It Solves

**Before (Bad Code):**
```javascript
// ❌ BAD: Nested conditionals, hard to read
class Router {
  async updatePage(href) {
    if (!this.isNavigating) {
      if (href) {
        if (this.isValidRoute(href)) {
          // Actual logic buried deep
          await this.navigate(href);
        } else {
          console.error('Invalid route');
        }
      } else {
        console.error('No href provided');
      }
    } else {
      console.warn('Navigation already in progress');
    }
  }
}

// ❌ BAD: No idempotency guards
class Page {
  async create() {
    // No guard - can be called multiple times
    this.setupEventListeners(); // Duplicate listeners!
    this.createAnimations();    // Duplicate animations!
    this.initialize();          // Duplicate initialization!
  }
}
```

**After (Good Code):**
```javascript
// ✅ GOOD: Guard clauses for early returns
export class Router {
  async updatePage(href) {
    // Guard: Prevent concurrent navigation
    if (this.isNavigating) {
      console.warn('Navigation already in progress');
      return;
    }
    
    // Guard: Validate input
    if (!href) {
      console.error('No href provided');
      return;
    }
    
    // Guard: Validate route
    if (!this.isValidRoute(href)) {
      console.error('Invalid route');
      return;
    }
    
    // Actual logic - no nesting
    this.isNavigating = true;
    try {
      await this.navigate(href);
    } finally {
      this.isNavigating = false;
    }
  }
}

// ✅ GOOD: Idempotency guards
export default class Page {
  async create() {
    // Guard: Ensure idempotency
    if (this._created) {
      console.warn(`Page ${this.id}.create() called multiple times`);
      return;
    }
    
    // Actual logic
    await this.beforeCreate?.();
    await this.createElements();
    await this.createComponents();
    this.createPageAnimations();
    this.createPage();
    this._created = true;
    await this.afterCreate?.();
  }
  
  async destroy() {
    // Guard: Prevent double-destruction
    if (this._destroyed) {
      return;
    }
    
    // Actual logic
    await this.beforeDestroy?.();
    this.destroyPageAnimations();
    this.removeEventListeners();
    this._destroyed = true;
    await this.afterDestroy?.();
  }
}
```

### Benefits

1. **Readability**: Early returns reduce nesting
2. **Idempotency**: Guards prevent duplicate operations
3. **Safety**: Prevents invalid state transitions
4. **Debugging**: Clear error messages for edge cases
5. **Performance**: Early exits avoid unnecessary work

### Code Example

```javascript
// app/router/Router.js
export class Router {
  constructor({ /* ... */ }) {
    this.isNavigating = false; // Guard flag
  }

  async updatePage(href) {
    // Guard clause: Prevent concurrent navigation
    if (this.isNavigating) {
      return;
    }
    
    this.isNavigating = true;
    try {
      const routeInfo = await this.beforePageUpdate(href);
      const newPage = await this.startPageUpdate(routeInfo);
      await this.afterPageUpdate(newPage, routeInfo);
    } catch (error) {
      this.handleNavigationError(error);
    } finally {
      this.isNavigating = false; // Always reset guard
    }
  }
}

// app/pages/Page.js
export default class Page {
  constructor({ /* ... */ }) {
    this._created = false;   // Idempotency guard
    this._destroyed = false; // Idempotency guard
  }

  async create() {
    // Guard clause: Idempotency
    if (this._created) {
      console.warn(`Page ${this.id}.create() called multiple times`);
      return;
    }
    
    await this.beforeCreate?.();
    await this.createElements();
    await this.createComponents();
    this.createPageAnimations();
    this.createPage();
    this._created = true; // Set guard
    await this.afterCreate?.();
  }
  
  async destroy() {
    // Guard clause: Prevent double-destruction
    if (this._destroyed) {
      return;
    }
    
    await this.beforeDestroy?.();
    this.destroyPageAnimations();
    this.removeEventListeners();
    this._destroyed = true; // Set guard
    await this.afterDestroy?.();
  }
}
```

---

## 10. Lifecycle Hooks Pattern

### What It Is

The Lifecycle Hooks Pattern provides extension points in a base class lifecycle where subclasses can inject custom behavior without overriding entire methods.

### Where It's Used

**Location:** `app/pages/Page.js`

The `Page` class implements optional lifecycle hooks (`beforeCreate`, `afterCreate`, `beforeShow`, `afterShow`, `beforeHide`, `afterHide`, `beforeDestroy`, `afterDestroy`) that subclasses can implement.

### What Problem It Solves

**Before (Bad Code):**
```javascript
// ❌ BAD: Must override entire method to customize
class Page {
  async show() {
    // Base logic
    await this.hideTransition();
    await this.scrollToTop();
    await this.enableScroll();
  }
}

class Home extends Page {
  // Must override entire method, duplicate base logic
  async show() {
    // Duplicate base logic
    await this.hideTransition();
    await this.scrollToTop();
    await this.enableScroll();
    
    // Add custom logic
    await this.playWelcomeAnimation();
  }
}

// ❌ BAD: Fragile - parent changes break subclasses
class Page {
  async show() {
    await this.hideTransition();
    await this.scrollToTop();
    // Added new step - breaks Home.show()!
    await this.updateMetadata();
    await this.enableScroll();
  }
}
```

**After (Good Code):**
```javascript
// ✅ GOOD: Lifecycle hooks pattern
export default class Page {
  async show() {
    // Hook: Before show
    await this.beforeShow?.();
    
    // Base logic
    await this.hideTransition();
    await this.scrollToTop();
    await this.enableScroll();
    
    // Hook: After show
    await this.afterShow?.();
  }
  
  async hide(route) {
    // Hook: Before hide
    await this.beforeHide?.(route);
    
    // Base logic
    await this.updateTransitionOverlay();
    await this.showTransition();
    await this.destroy();
    
    // Hook: After hide
    await this.afterHide?.(route);
  }
}

// ✅ GOOD: Subclasses implement hooks
class Home extends Page {
  // Only implement hooks needed
  async afterShow() {
    // Custom logic after show
    await this.playWelcomeAnimation();
  }
  
  async beforeHide(route) {
    // Custom logic before hide
    await this.stopHomeAnimations();
  }
}

// ✅ GOOD: Other pages don't need hooks
class View extends Page {
  // No hooks needed - uses base implementation
}
```

### Benefits

1. **No Duplication**: Base logic defined once
2. **Flexible Extension**: Subclasses customize only what's needed
3. **Safe Override**: Parent changes don't break subclasses
4. **Optional**: Hooks are optional (using `?.()`)
5. **Clear Intent**: Hook names describe when they're called

### Code Example

```javascript
// app/pages/Page.js
export default class Page {
  async create() {
    if (this._created) return;
    
    // Hook: Before create
    await this.beforeCreate?.();
    
    // Base logic
    await this.createElements();
    await this.createComponents();
    this.createPageAnimations();
    this.createPage();
    
    this._created = true;
    
    // Hook: After create
    await this.afterCreate?.();
  }
  
  async show() {
    // Hook: Before show
    await this.beforeShow?.();
    
    // Base logic
    if (!this.smoothScroll.enabled() && !this.preloader) {
      this.smoothScroll.create();
      this.smoothScroll.scrollTo(0, { immediate: true });
    }
    await this.transitionsManager.hidePageTransition(this.pageTransition);
    
    // Hook: After show
    await this.afterShow?.();
  }
  
  async hide(route) {
    // Hook: Before hide
    await this.beforeHide?.(route);
    
    // Base logic
    await this.transitionsManager.updateTransitionOverlay(route);
    await this.transitionsManager.showPageTransition(this.pageTransition);
    await this.destroy();
    
    // Hook: After hide
    await this.afterHide?.(route);
  }
  
  async destroy() {
    if (this._destroyed) return;
    
    // Hook: Before destroy
    await this.beforeDestroy?.();
    
    // Base logic
    this.destroyPageAnimations();
    this.removeEventListeners();
    
    this._destroyed = true;
    
    // Hook: After destroy
    await this.afterDestroy?.();
  }
}

// Usage in subclass
class Home extends Page {
  async afterShow() {
    // Custom logic after page is shown
    await this.playWelcomeAnimation();
  }
  
  async beforeHide(route) {
    // Custom cleanup before hiding
    await this.stopHomeAnimations();
  }
}
```

---

## 11. Manager Pattern

### What It Is

The Manager Pattern encapsulates domain-specific logic and state management. Managers coordinate operations within their domain and provide a clean API for other components.

### Where It's Used

**Locations:**
- `app/router/RouterPageManager.js` - Manages page content updates and DOM manipulation
- `app/services/AnimationsService.js` - Manages animation lifecycle
- `app/services/TransitionsService.js` - Manages page transitions

### What Problem It Solves

**Before (Bad Code):**
```javascript
// ❌ BAD: Logic scattered across multiple classes
class Router {
  async navigate(route) {
    // Fetch logic mixed with routing
    const response = await fetch(`/pages/${route}.html`);
    const html = await response.text();
    
    // DOM manipulation mixed with routing
    document.querySelector('main').innerHTML = html;
    
    // Metadata extraction mixed with routing
    const template = document.querySelector('main').dataset.template;
    const bgColor = document.querySelector('main').dataset.bgColor;
    
    // Image preloading mixed with routing
    const images = document.querySelectorAll('img[data-src]');
    await Promise.all(Array.from(images).map(img => {
      return new Promise(resolve => {
        img.onload = resolve;
        img.src = img.dataset.src;
      });
    }));
    
    // Too many responsibilities!
  }
}
```

**After (Good Code):**
```javascript
// ✅ GOOD: Manager encapsulates domain logic
export class RouterPageManager {
  constructor({ siteConfig, routerPageLoader }) {
    this.siteConfig = siteConfig;
    this.routerPageLoader = routerPageLoader;
  }

  async updatePage(route) {
    // Manager handles all page update concerns
    const html = await this.fetchPageHTML(route);
    this.updateDOM(html);
    const metadata = this.extractPageMetadata();
    await this.preloadPageImages();
    return metadata;
  }

  async fetchPageHTML(route) {
    // Check prefetch cache first
    const cached = this.prefetchCache?.get(route);
    if (cached) {
      return cached.html;
    }
    
    // Fetch if not cached
    const response = await fetch(this.getPageURL(route));
    const html = await response.text();
    
    // Store in cache
    this.prefetchCache?.set(route, html);
    return html;
  }

  updateDOM(html) {
    const main = document.querySelector('main');
    main.innerHTML = html;
  }

  extractPageMetadata() {
    const main = document.querySelector('main');
    return {
      template: main.dataset.template,
      bgColor: main.dataset.bgColor,
      color: main.dataset.color,
    };
  }

  async preloadPageImages() {
    const images = document.querySelectorAll('img[data-src]');
    await preloadImages({ images, excludePreloader: true });
  }
}

// ✅ GOOD: Router delegates to manager
export class Router {
  async startPageUpdate(routeInfo) {
    // Delegate page update to manager
    await this.routerPageManager.updatePage(routeInfo.normalizedPath);
    
    // Router focuses on orchestration
    const page = await this.routerPageLoader.getPage(routeInfo.template);
    return page;
  }
}
```

### Benefits

1. **Single Responsibility**: Each manager handles one domain
2. **Encapsulation**: Domain logic hidden behind clean API
3. **Reusability**: Managers can be used by multiple components
4. **Testability**: Managers can be tested independently
5. **Maintainability**: Changes to domain logic isolated to manager

### Code Example

```javascript
// app/router/RouterPageManager.js
export class RouterPageManager {
  constructor({ siteConfig, routerPageLoader }) {
    this.siteConfig = siteConfig;
    this.routerPageLoader = routerPageLoader;
  }

  async updatePage(route) {
    // Manager encapsulates all page update logic
    const html = await this.fetchPageHTML(route);
    this.updateDOM(html);
    const metadata = this.extractPageMetadata();
    await this.preloadPageImages();
    return metadata;
  }

  async fetchPageHTML(route) {
    // Check cache first
    const cached = this.prefetchCache?.get(route);
    if (cached) return cached.html;
    
    // Fetch and cache
    const response = await fetch(this.getPageURL(route));
    const html = await response.text();
    this.prefetchCache?.set(route, html);
    return html;
  }

  updateDOM(html) {
    document.querySelector('main').innerHTML = html;
  }

  extractPageMetadata() {
    const main = document.querySelector('main');
    return {
      template: main.dataset.template,
      bgColor: main.dataset.bgColor,
      color: main.dataset.color,
    };
  }
}

// app/services/AnimationsService.js
export class AnimationsService {
  // Manager for animation lifecycle
  createPageAnimations(pageElement) {
    this.destroyPageAnimations();
    this.validatePageElement(pageElement);
    const elements = this.findAnimatedElements(pageElement);
    const elementsByType = this.groupElementsByType(elements);
    this.createAnimationInstances(elementsByType);
    this.createSharedIntersectionObserver();
  }
  
  destroyPageAnimations() {
    // Manager handles cleanup
    this.pageAnimations.forEach(animation => animation.kill());
    this.intersectionObserver?.disconnect();
    this.pageAnimations = [];
    this.intersectionObserver = null;
  }
}

// app/services/TransitionsService.js
export class TransitionsService {
  // Manager for transition lifecycle
  async updateTransitionOverlay(route) {
    const config = this.siteConfig.getRouteConfig(route);
    const template = this.getTransitionTemplate(config.transition);
    this.updateTransitionContent(template);
  }
  
  async showPageTransition(element) {
    // Manager handles transition animation
    return this.animation.GSAPShowTransition(element);
  }
  
  async hidePageTransition(element) {
    // Manager handles transition animation
    return this.animation.GSAPHideTransition(element);
  }
}
```

---

## Summary

This codebase implements **11 design patterns** that work together to create a maintainable, testable, and scalable architecture:

1. **Factory Pattern** - Centralized service creation
2. **Registry Pattern** - Dynamic type lookup and registration
3. **Dependency Injection** - Loose coupling and testability
4. **Template Method Pattern** - Consistent component lifecycles
5. **Observer Pattern** - Event-driven communication
6. **Orchestrator Pattern** - Coordinated workflows
7. **Strategy Pattern** - Pluggable algorithms
8. **Cache-Aside Pattern** - Performance optimization
9. **Guard Clause Pattern** - Safety and idempotency
10. **Lifecycle Hooks Pattern** - Flexible extension points
11. **Manager Pattern** - Domain encapsulation

### Pattern Relationships

These patterns complement each other:

- **Factory + Dependency Injection**: Factory creates services with DI
- **Registry + Strategy**: Registry stores strategy classes
- **Template Method + Lifecycle Hooks**: Template method calls hooks
- **Orchestrator + Manager**: Orchestrator coordinates managers
- **Observer + Component**: Components use EventManager for events
- **Guard Clause + Lifecycle**: Guards ensure safe lifecycle transitions

### Benefits of This Architecture

1. **Maintainability**: Clear separation of concerns
2. **Testability**: Easy to mock and test components
3. **Extensibility**: Easy to add new features without modifying existing code
4. **Performance**: Caching and optimization patterns
5. **Safety**: Guard clauses prevent invalid operations
6. **Flexibility**: Hooks and strategies allow customization

This architecture demonstrates how multiple design patterns can work together harmoniously to solve real-world problems in a single-page application.
