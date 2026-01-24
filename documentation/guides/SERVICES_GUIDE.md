# Dependency Injection vs ES6 Imports: A Practical Guide

## TL;DR

- **ES6 imports**: Great for **pure utilities**, **stateless helpers**, and **stable singletons**
- **DI (Dependency Injection)**: Better for **stateful services**, **testability**, **configuration**, and **lifecycle management**
- **Hybrid approach**: Use ES6 imports for utilities, DI for services

## The Spectrum

```
Pure Utilities ←────────────→ Stateful Services
   (imports)                    (injection)

Helpers, Constants         Router, PageManager
Pure Functions             Components with lifecycle
Stateless Classes          Things needing config
```

---

## ES6 Imports: When They Work Well

### ✅ Good Candidates for ES6 Imports

**Pure utilities that don't need configuration:**
```js
// utils/Helpers.js
export function $(selector) {
  return document.querySelector(selector);
}

export function $$(selector) {
  return document.querySelectorAll(selector);
}

// Usage anywhere
import { $, $$ } from './utils/Helpers.js';
const el = $('.my-class'); // ✅ Works great!
```

**Constants and configuration:**
```js
// constants/Colors.js
export const RED = '#ff0000';
export const BLUE = '#0000ff';

// Usage
import { RED, BLUE } from './constants/Colors.js'; // ✅ Fine to import
```

**Stateless classes:**
```js
// classes/Animation.js
export class Animation {
  // Pure utility methods, no state
  GSAPShowTransition(element) { /* ... */ }
  GSAPHideTransition(element) { /* ... */ }
}

// Usage
import { Animation } from './classes/Animation.js';
const anim = new Animation();
// ✅ No need to inject - it's stateless
```

### ❌ Problems with ES6 Imports for Stateful Services

**Your current code:**
```js
// Page.js
import { TransitionManager } from "./TransitionManager.js";

export default class Page {
  constructor() {
    // ❌ Creates new instance every time
    this.transitionManager = new TransitionManager();
  }
}

// Every page creates its own TransitionManager
// - Multiple instances doing the same work
// - Can't share state/cache
// - Hard to test (can't mock)
// - Can't configure per environment
```

**The issue:**
- Each `Page` creates its own `TransitionManager`
- Can't share preloaded images cache
- Can't test with a mock `TransitionManager`
- Hard-coded dependencies

---

## Dependency Injection: When It Helps

### ✅ Good Candidates for DI

**Stateful services with lifecycle:**
```js
// TransitionManager - maintains cache, has lifecycle
export class TransitionManager {
  constructor() {
    this.preloadedImages = new Map(); // State!
  }
  
  async preloadImage(url) {
    // Expensive operation, should be cached
  }
}

// ❌ BAD: Multiple instances = wasted work
const tm1 = new TransitionManager(); // Preloads all images
const tm2 = new TransitionManager(); // Preloads all images AGAIN

// ✅ GOOD: Single instance shared
const sharedTM = new TransitionManager();
page1.transitionManager = sharedTM;
page2.transitionManager = sharedTM;
```

**Services needing configuration:**
```js
// SmoothScroll - might need different config in dev vs prod
export class SmoothScroll {
  constructor(config = {}) {
    this.lenis = new Lenis({
      autoRaf: config.autoRaf ?? true,
      duration: config.duration ?? 1.2,
      // ... configurable options
    });
  }
}

// ❌ BAD: Hard-coded configuration
const scroll = new SmoothScroll(); // Uses defaults always

// ✅ GOOD: Configure per environment
const scroll = new SmoothScroll({
  duration: isDev ? 0.5 : 1.2,
  autoRaf: !isSSR,
});
```

**Testability:**
```js
// ❌ BAD: Hard to test
class Page {
  constructor() {
    this.transitionManager = new TransitionManager();
    // Can't mock this!
  }
}

// ✅ GOOD: Can inject mock
class Page {
  constructor({ transitionManager }) {
    this.transitionManager = transitionManager;
  }
}

// In tests:
const mockTM = { getTransition: jest.fn() };
const page = new Page({ transitionManager: mockTM });
```

---

## Hybrid Approach: Best of Both Worlds

You don't need to choose one or the other! Use **both strategically**:

### Strategy 1: Import Utilities, Inject Services

```js
// ✅ Import pure utilities
import { $, $$ } from '../utils/Helpers.js';
import { Animation } from './Animation.js';

// ✅ Inject stateful services
export default class Page {
  constructor({ 
    // Injected services (stateful, configurable)
    transitionManager,
    smoothScroll,
    // Imported utilities (pure, stateless)
  }) {
    this.transitionManager = transitionManager;
    this.smoothScroll = smoothScroll;
    
    // Utilities can be imported and instantiated
    this.animation = new Animation(); // ✅ Stateless, fine to create
  }
  
  async create() {
    // Use imported utilities
    this.element = $(this.selector); // ✅ From import
    
    // Use injected services
    await this.transitionManager.getTransition(route); // ✅ Injected
  }
}
```

### Strategy 2: Factory Functions (Simplicity)

Instead of a complex Init.js, use factory functions:

```js
// services/createServices.js
export function createAppServices(config = {}) {
  const transitionManager = new TransitionManager(config.transition);
  const smoothScroll = new SmoothScroll(config.scroll);
  const router = new Router(config.router);
  
  return {
    transitionManager,
    smoothScroll,
    router,
  };
}

// App.js
import { createAppServices } from './services/createServices.js';

class App {
  constructor() {
    // Create services once
    this.services = createAppServices({
      scroll: { duration: 1.2 },
      transition: { preloadAll: true },
    });
    
    // Inject into pages
    this.currentPage = new PageClass({
      transitionManager: this.services.transitionManager,
      smoothScroll: this.services.smoothScroll,
    });
  }
}
```

### Strategy 3: Service Locator (Simpler Alternative)

```js
// services/ServiceContainer.js
class ServiceContainer {
  constructor() {
    this.services = new Map();
  }
  
  register(name, service) {
    this.services.set(name, service);
  }
  
  get(name) {
    return this.services.get(name);
  }
}

export const services = new ServiceContainer();

// Init.js (or App.js)
import { services } from './services/ServiceContainer.js';
import { TransitionManager } from './classes/TransitionManager.js';

services.register('transitionManager', new TransitionManager());
services.register('smoothScroll', new SmoothScroll());

// Page.js
import { services } from './services/ServiceContainer.js';

export default class Page {
  constructor() {
    // Get from container (or inject as fallback)
    this.transitionManager = services.get('transitionManager');
    this.smoothScroll = services.get('smoothScroll');
  }
}
```

---

## Practical Example: Your Codebase Refactored

### Current Problem

```js
// Page.js
import { TransitionManager } from "./TransitionManager.js";

export default class Page {
  constructor() {
    // ❌ Every page creates its own manager
    this.transitionManager = new TransitionManager();
    // ❌ Calls setupTransitionTemplates() multiple times
    // ❌ Each instance preloads images separately
  }
}

// App.js
// ❌ Router also creates its own Registry
this.router = new Router();
this.registry = new Registry(); // Duplicate!
```

### Refactored with Hybrid Approach

```js
// App.js - Creates and shares services
class App {
  constructor() {
    // ✅ Create shared services once
    this.registry = new Registry();
    this.transitionManager = new TransitionManager({ registry: this.registry });
    this.router = new Router({ registry: this.registry });
    
    // ✅ Store in services object for easy access
    this.services = {
      registry: this.registry,
      transitionManager: this.transitionManager,
      router: this.router,
      // Will create others as needed
    };
  }
  
  async loadAndCreatePage(template) {
    const PageClass = await this.loadPageClass(template);
    
    // ✅ Inject shared services
    this.currentPage = new PageClass({
      id: template,
      element: "main",
      transitionManager: this.services.transitionManager,
      // smoothScroll will be created per-page (or shared if preferred)
    });
    
    await this.currentPage.create();
  }
}

// Page.js - Accepts injected services
export default class Page {
  constructor({ 
    id, 
    element, 
    elements,
    // ✅ Injected services (shared, stateful)
    transitionManager,
    // ✅ Optional - can create if not provided
    smoothScroll = null,
    animation = null,
  }) {
    this.id = id;
    this.selector = element;
    this.transitionManager = transitionManager; // Shared instance
    
    // ✅ Stateless utilities can be instantiated
    this.animation = animation ?? new Animation();
    
    // ✅ Per-page services (create if not injected)
    this.smoothScroll = smoothScroll;
  }
  
  async create() {
    // ✅ Use shared transition manager
    // (images already preloaded by first page!)
    await this.transitionManager.getTransition(route);
    
    // ✅ Create per-page service if not injected
    if (!this.smoothScroll) {
      this.smoothScroll = new SmoothScroll();
    }
  }
}
```

---

## Pros and Cons Comparison

### ES6 Imports

**Pros:**
- ✅ Simple, straightforward
- ✅ No boilerplate
- ✅ IDE can track imports easily
- ✅ Tree-shaking works well
- ✅ Great for utilities

**Cons:**
- ❌ Hard to mock in tests
- ❌ Hard to configure
- ❌ Can't swap implementations
- ❌ Creates new instances each time
- ❌ Hard to share state

### Dependency Injection

**Pros:**
- ✅ Testable (easy to mock)
- ✅ Configurable
- ✅ Share instances (memory efficient)
- ✅ Swap implementations easily
- ✅ Clear dependencies

**Cons:**
- ❌ More boilerplate
- ❌ Need to wire up dependencies
- ❌ Can be over-engineered for simple cases
- ❌ Harder to track "who uses what" (no import graph)

### Hybrid (Recommended)

**Pros:**
- ✅ Best of both worlds
- ✅ Simple for simple cases
- ✅ Flexible for complex cases
- ✅ Good balance of complexity

**Cons:**
- ⚠️ Need to decide case-by-case
- ⚠️ Slightly more mental overhead

---

## Composition vs Inheritance

**These are separate concepts!**

- **Composition**: Building complex objects from simpler parts
- **Inheritance**: Classes extending other classes
- **DI**: A technique to achieve composition

DI helps with composition, but composition ≠ DI.

```js
// Inheritance (what you have)
class Home extends Page {
  // Inherits all Page behavior
}

// Composition (alternative)
class Home {
  constructor(pageBehavior) {
    this.pageBehavior = pageBehavior; // Composed behavior
  }
}

// DI helps composition
class Home {
  constructor({ pageBehavior, animations, scroll }) {
    // Compose multiple behaviors
    this.behaviors = { pageBehavior, animations, scroll };
  }
}
```

**For your codebase:**
- Keep inheritance for `Home extends Page` (it's fine!)
- Use DI to compose services (`transitionManager`, `smoothScroll`)
- They work together!

---

## Recommended Structure (Without Over-Engineering)

You don't need a huge Init.js! Here's a simple approach:

### Option 1: App Creates Services (Simplest)

```js
// App.js
class App {
  constructor() {
    // Create shared services in one place
    this.registry = new Registry();
    this.transitionManager = new TransitionManager({ registry: this.registry });
    this.router = new Router({ registry: this.registry });
    
    // Create pages and inject
    this.currentPage = new PageClass({
      transitionManager: this.transitionManager,
    });
  }
}
```

### Option 2: Services Module (Clean Separation)

```js
// services/index.js
export function createServices(config = {}) {
  const registry = new Registry();
  const transitionManager = new TransitionManager({ 
    registry,
    ...config.transition 
  });
  const router = new Router({ registry, ...config.router });
  
  return { registry, transitionManager, router };
}

// App.js
import { createServices } from './services/index.js';

class App {
  constructor() {
    this.services = createServices({
      transition: { preloadAll: true },
    });
    
    this.currentPage = new PageClass({
      transitionManager: this.services.transitionManager,
    });
  }
}
```

### Option 3: Service Locator (Most Flexible)

See Strategy 3 above - useful if services are needed in many places.

---

## Decision Matrix

| Type | ES6 Import | DI |
|------|-----------|-----|
| Pure function | ✅ | ❌ |
| Utility class (stateless) | ✅ | ❌ |
| Constants | ✅ | ❌ |
| Stateful service | ❌ | ✅ |
| Needs configuration | ❌ | ✅ |
| Needs to be shared | ❌ | ✅ |
| Needs testing/mocking | ❌ | ✅ |

---

## Conclusion

**For your codebase:**

1. **Keep ES6 imports for:**
   - `Helpers.js` utilities
   - `Animation.js` (stateless)
   - `Colors.js` constants

2. **Use DI for:**
   - `TransitionManager` (shared cache)
   - `Router` (shared registry)
   - `SmoothScroll` (might want per-page or shared)
   - `Registry` (should be singleton)

3. **Simple approach:**
   - Create services in `App.js` constructor
   - Pass to pages via constructor
   - No need for complex Init.js unless you grow

4. **Inheritance + DI:**
   - Keep `Home extends Page` (inheritance is fine!)
   - Inject services into `Page` (composition)
   - They complement each other!


# Service Factory vs Service Locator: Complete Comparison

## Quick Decision Tree

```
Need services in many places?
├─ YES → Service Locator ✅
└─ NO
   │
   Need complex initialization?
   ├─ YES → Service Factory ✅
   └─ NO → Direct creation in App.js ✅
```

---

## Comparison Table

| Aspect | Service Factory | Service Locator | Direct Creation (App.js) |
|--------|----------------|-----------------|--------------------------|
| **Complexity** | Medium | Medium | Low ✅ |
| **Boilerplate** | Medium | Medium | Low ✅ |
| **Access Pattern** | Pass as params | Global container | Pass as params |
| **Testability** | Excellent ✅ | Good | Good |
| **Flexibility** | High ✅ | Very High ✅ | Low |
| **Explicit Dependencies** | Very explicit ✅ | Implicit | Very explicit ✅ |
| **Best For** | Organized setup | Many consumers | Simple apps |
| **When Services Needed** | At creation time | Anywhere, anytime | At creation time |
| **Dependency Tracking** | Easy (import graph) | Hard (hidden) | Easy (import graph) ✅ |

---

## Service Factory Pattern

### What It Is

A function that creates and wires up all services, returning an object of services.

```js
// services/createServices.js
export function createServices(config = {}) {
  const registry = new Registry();
  const transitionManager = new TransitionManager({ registry });
  const router = new Router({ registry });
  
  return {
    registry,
    transitionManager,
    router,
  };
}

// App.js
import { createServices } from './services/createServices.js';

class App {
  constructor() {
    this.services = createServices();
    this.router = this.services.router;
  }
}
```

### Use Cases

| Use Case | Example | Why Factory? |
|----------|---------|--------------|
| **Complex initialization** | Services need setup, config, wiring | ✅ Factory handles complexity |
| **Environment-specific config** | Dev vs Prod settings | ✅ Pass config to factory |
| **Service dependencies** | Registry → TransitionManager → Router | ✅ Factory wires dependencies |
| **Organized codebase** | Want services separate from app logic | ✅ Clean separation |
| **Multiple environments** | SSR, testing, production | ✅ Easy to create test services |
| **Service lifecycle** | Services need initialization order | ✅ Factory controls order |

### Pros

- ✅ **Explicit dependencies** - Clear what's injected
- ✅ **Easy to test** - Create services with test config
- ✅ **Organized** - Services creation in one place
- ✅ **Configurable** - Pass config per environment
- ✅ **Type-safe** - Can add TypeScript/JSDoc easily
- ✅ **Testable** - Can create mock services easily
- ✅ **Clear ownership** - Know where services are created

### Cons

- ❌ **Must pass services** - Need to thread through constructors
- ❌ **Not available everywhere** - Must pass to where needed
- ❌ **More setup** - Need factory function
- ❌ **Coupling** - Services must be passed through layers

---

## Service Locator Pattern

### What It Is

A global container that holds services, accessible from anywhere.

```js
// services/ServiceContainer.js
class ServiceContainer {
  constructor() {
    this.services = new Map();
  }
  
  register(name, service) {
    this.services.set(name, service);
  }
  
  get(name) {
    return this.services.get(name);
  }
}

export const services = new ServiceContainer();

// App.js - Register services
services.register('registry', new Registry());
services.register('router', new Router());

// Anywhere - Access services
import { services } from './services/ServiceContainer.js';
const router = services.get('router');
```

### Use Cases

| Use Case | Example | Why Locator? |
|----------|---------|--------------|
| **Services needed everywhere** | Navigation, router, event bus | ✅ Access from anywhere |
| **Deep component tree** | Components 5+ levels deep | ✅ No need to pass through |
| **Event emitters** | Global event system | ✅ Single instance accessible |
| **Utility services** | Logging, analytics | ✅ Available anywhere |
| **Plugin system** | Third-party plugins need services | ✅ Plugins can access services |
| **Rapid prototyping** | Quick access, less boilerplate | ✅ Fast development |
| **Legacy migration** | Gradually refactoring old code | ✅ Easy to adopt |

### Pros

- ✅ **Accessible anywhere** - No need to pass through layers
- ✅ **Flexible** - Services available when needed
- ✅ **Less boilerplate** - Don't thread through constructors
- ✅ **Easy for plugins** - Third-party code can access
- ✅ **Quick development** - Fast to add services

### Cons

- ❌ **Hidden dependencies** - Can't see what services are used
- ❌ **Global state** - Can become hard to track
- ❌ **Hard to test** - Must mock container or clear services
- ❌ **Magic strings** - Service names are strings (typos)
- ❌ **No compile-time checking** - Errors only at runtime
- ❌ **Tight coupling** - Code depends on container

---

## Detailed Comparison

### Dependency Visibility

**Service Factory:**
```js
// ✅ Explicit - can see dependencies
class Page {
  constructor({ transitionManager, router }) {
    // Clear what's needed
  }
}
```

**Service Locator:**
```js
// ❌ Implicit - hidden dependencies
class Page {
  constructor() {
    this.transitionManager = services.get('transitionManager');
    // Can't tell what services are needed without reading code
  }
}
```

### Testing

**Service Factory:**
```js
// ✅ Easy to create test services
const testServices = createServices({
  transition: { preloadAll: false },
  router: { mockMode: true },
});

const page = new Page({ transitionManager: testServices.transitionManager });
```

**Service Locator:**
```js
// ⚠️ Must mock container or clear services
services.clear(); // Clear all
services.register('transitionManager', mockTM);
const page = new Page(); // Uses mocked service
```

### Access Pattern

**Service Factory:**
```js
// ✅ Must pass through constructors
class App {
  constructor() {
    this.services = createServices();
  }
  
  createPage() {
    return new Page({ 
      transitionManager: this.services.transitionManager 
    });
  }
}
```

**Service Locator:**
```js
// ✅ Access from anywhere
class App {
  constructor() {
    services.register('router', new Router());
  }
}

class Page {
  constructor() {
    // ✅ Can access directly
    this.router = services.get('router');
  }
}

class DeepComponent {
  // ✅ Can access even here, 5 levels deep
  handleClick() {
    services.get('router').updatePage('/home');
  }
}
```

### Configuration

**Service Factory:**
```js
// ✅ Easy to configure
const services = createServices({
  transition: { preloadAll: true },
  router: { enableLogging: isDev },
});
```

**Service Locator:**
```js
// ⚠️ Configuration happens at registration
services.register('transitionManager', new TransitionManager({
  preloadAll: true,
}));
```

---

## Real-World Scenarios

### Scenario 1: Simple App (Your Current Size)

**Best: Direct Creation in App.js**
```js
class App {
  constructor() {
    this.registry = new Registry();
    this.transitionManager = new TransitionManager({ registry: this.registry });
    this.router = new Router({ registry: this.registry });
  }
}
```

**Why:** Simplest, no extra complexity needed.

### Scenario 2: Growing App with Many Services

**Best: Service Factory**
```js
class App {
  constructor() {
    this.services = createServices({
      transition: { preloadAll: true },
      router: { enableAnalytics: true },
    });
  }
}
```

**Why:** Organized, configurable, clear separation.

### Scenario 3: Deep Component Tree

**Best: Service Locator (or Hybrid)**
```js
// Deep component needs router
class Footer extends Component {
  handleLink(href) {
    services.get('router').updatePage(href);
    // ✅ No need to pass router through 5 component layers
  }
}
```

**Why:** Avoids prop drilling.

### Scenario 4: Testing

**Best: Service Factory**
```js
// Easy to create test services
const testServices = createServices({ testMode: true });
```

**Why:** Clean test setup, easy to mock.

### Scenario 5: Plugin System

**Best: Service Locator**
```js
// Third-party plugin can access services
class MyPlugin {
  init() {
    const router = services.get('router');
    router.addRoute('/my-route', handler);
  }
}
```

**Why:** Plugins can access without dependency injection.

---

## Hybrid Approach (Best of Both)

You can combine both patterns:

```js
// services/createServices.js - Factory
export function createServices(config = {}) {
  const registry = new Registry();
  const transitionManager = new TransitionManager({ registry });
  const router = new Router({ registry });
  
  return { registry, transitionManager, router };
}

// services/ServiceContainer.js - Locator
export const services = new ServiceContainer();

// App.js - Use both
class App {
  constructor() {
    // Create with factory
    const appServices = createServices();
    
    // Register in locator (for deep access)
    services.register('router', appServices.router);
    services.register('transitionManager', appServices.transitionManager);
    
    // Inject explicitly (for main components)
    this.currentPage = new Page({
      transitionManager: appServices.transitionManager,
      router: appServices.router,
    });
  }
}

// Deep components use locator
class Footer {
  handleLink(href) {
    services.get('router').updatePage(href); // ✅ No prop drilling
  }
}
```

**When to use hybrid:**
- Main components: Explicit injection (clear dependencies)
- Deep components: Service locator (avoid prop drilling)
- Best of both worlds!

---

## Recommendation Matrix

| Your Situation | Recommended Pattern | Why |
|----------------|---------------------|-----|
| **Small app (< 10 services)** | Direct creation in App.js | Simplest |
| **Medium app (10-20 services)** | Service Factory | Organized, configurable |
| **Large app (20+ services)** | Service Factory + Locator | Factory for creation, Locator for access |
| **Deep component tree** | Service Locator (or Hybrid) | Avoid prop drilling |
| **Plugin system** | Service Locator | Plugins need access |
| **Heavy testing** | Service Factory | Easy to mock |
| **Rapid development** | Service Locator | Fast access |
| **Long-term maintenance** | Service Factory | Clear dependencies |

---

## For Your Codebase

### Current State
- Medium-sized app
- Services: Registry, Router, TransitionManager, SmoothScroll
- Some services shared, some per-page
- Testing not yet heavy

### Recommendation: **Service Factory** ✅

**Why:**
1. ✅ Organized - Clean separation of service creation
2. ✅ Configurable - Can set dev vs prod settings
3. ✅ Testable - Easy to create test services
4. ✅ Explicit - Clear what services are needed
5. ✅ Future-proof - Easy to add more services
6. ✅ Not too complex - Simple factory function

**Implementation:**
```js
// services/createServices.js
export function createServices(config = {}) {
  const registry = new Registry();
  const transitionManager = new TransitionManager({ 
    registry,
    ...config.transition 
  });
  const router = new Router({ 
    registry,
    ...config.router 
  });
  
  return {
    registry,
    transitionManager,
    router,
  };
}

// App.js
import { createServices } from './services/createServices.js';

class App {
  constructor() {
    this.services = createServices({
      transition: { preloadAll: true },
    });
    
    // Inject into pages
    this.currentPage = new PageClass({
      transitionManager: this.services.transitionManager,
    });
  }
}
```

### Future: Consider Hybrid

If your app grows and you have:
- Deep component trees needing services
- Plugin system
- Many utility services (logging, analytics)

Then add Service Locator for those specific use cases, while keeping Factory for main service creation.

---

## Summary Table

| Pattern | Best For | Worst For | Complexity | Flexibility |
|---------|----------|-----------|------------|-------------|
| **Direct Creation** | Small apps, simple setup | Complex initialization, many services | Low ✅ | Low |
| **Service Factory** | Organized code, testing, config | Services needed everywhere | Medium | High ✅ |
| **Service Locator** | Deep trees, plugins, utilities | Testing, explicit dependencies | Medium | Very High ✅ |
| **Hybrid** | Large apps, complex needs | Small apps (overkill) | High | Highest ✅ |

---

## Final Recommendation

For your codebase: **Start with Service Factory**

**Reasons:**
1. ✅ Matches your current size and needs
2. ✅ Easy to migrate to (simple factory function)
3. ✅ Can add Locator later if needed
4. ✅ Good balance of organization and simplicity
5. ✅ Future-proof as you grow

**If you grow:**
- Add Service Locator for deep components
- Keep Factory for main service creation
- Hybrid approach gives you both

