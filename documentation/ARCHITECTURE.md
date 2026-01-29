# Architecture Overview

## Table of Contents
- [Core Architecture](#core-architecture)
- [Design Patterns](#design-patterns)
- [Class Hierarchy](#class-hierarchy)
- [Data Flow](#data-flow)
- [Key Components](#key-components)

## Core Architecture

This single-page application (SPA) is built with vanilla JavaScript, following a modular architecture that emphasizes separation of concerns, dependency injection, and a service-oriented design.

### Entry Point

The application starts at `app/App.js`, which:
1. Initializes the service factory to create all services
2. Sets up the router to handle navigation
3. Creates the preloader for initial page load
4. Manages the application lifecycle

```javascript
// App.js structure
class App {
  constructor() {
    this.pageConfig = setupPageConfig();
    this.preloaderVisible = false;
  }

  async init() {
    this.createServices();
    await this.transitionsService.init();
    await this.services.router.start(); // Calls pageLoader.create() to initialize the first page
    this.currentPage = this.services.registryService.getCurrentPage();
    this.createNavigation();
    this.createPreloader();
    liveReload();
  }

  createServices() {
    this.services = createServices();
    this.siteConfig = this.services.siteConfig;
    this.router = this.services.router;
    this.navigation = this.services.navigation;
    this.smoothScroll = this.services.smoothScroll;
    this.animationsService = this.services.animationsService;
    this.transitionsService = this.services.transitionsService;
    this.footnotes = this.services.footnotes;
    this.pageRegistry = this.services.registryService;
    this.pageLoader = this.services.routerPageLoader;
    this.pageManager = this.services.routerPageManager;
    this.routerHistory = this.services.routerHistory;
    this.routerResolver = this.services.routerResolver;
  }
}
```

### Service Factory Pattern

The `ServicesFactory` (`app/services/ServicesFactory.js`) implements the **Factory Pattern** and **Dependency Injection** to create and wire all services together. This centralizes service creation and ensures proper dependency management.

**Key Benefits:**
- Single point of service creation
- Automatic dependency injection
- Easy to test (can mock services)
- Clear dependency graph

```javascript
// ServicesFactory creates all services with proper dependencies
export function createServices() {
  const siteConfig = new SiteConfig();
  const animationsService = new AnimationsService();
  const transitionsService = new TransitionsService({ 
    siteConfig,
    transitionType: TRANSITION_TYPES.CUSTOM
  });
  const smoothScroll = new SmoothScroll();
  const footnotes = new Footnotes({ smoothScroll });
  const routerPageLoader = new RouterPageLoader({ siteConfig, smoothScroll, animationsManager: animationsService, transitionsManager: transitionsService, footnotes });
  const registryService = new RegistryService({ siteConfig, routerPageLoader });
  const routerPageManager = new RouterPageManager({ siteConfig, routerPageLoader });
  // ... more services
  
  return {
    siteConfig,
    router,
    smoothScroll,
    animationsService,
    transitionsService,
    // ... all services
  };
}
```

## Design Patterns

### 1. Service Factory Pattern
**Location:** `app/services/ServicesFactory.js`

Creates and configures all application services with proper dependency injection. Services are created once and shared across the application.

### 2. Registry Pattern
**Location:** `app/services/RegistryService.js`

The `RegistryService` maintains a registry of page classes and their instances. It tracks:
- Loaded page classes (Map of template → PageClass)
- Current page instance
- Current page template

**Usage:**
```javascript
// Register a page class
registryService.setPage('home', Home);

// Get a page class
const HomeClass = registryService.getPage('home');

// Track current page
registryService.setCurrentPage(pageInstance);
```

### 3. Manager Pattern
Multiple managers coordinate specific domains:

- **RouterPageManager** (`app/router/RouterPageManager.js`): Manages page content updates, DOM manipulation, and page metadata
- **AnimationsService** (`app/services/AnimationsService.js`): Manages page animations lifecycle, IntersectionObserver setup, and animation cleanup
- **TransitionsService** (`app/services/TransitionsService.js`): Manages page transition overlays, image preloading, and transition templates

### 4. Component Base Class Pattern
**Location:** `app/components/Component.js`

All components inherit from a base `Component` class that provides:
- Event management (via EventManager)
- Element selection and caching
- Lifecycle hooks (create, destroy)
- Event emission/listening

**Example:**
```javascript
class Preloader extends Component {
  constructor() {
    super({
      element: SELECTORS.PRELOADER,
      elements: { /* child selectors */ }
    });
  }
  
  create() {
    super.create(); // Sets up this.element and this.elements
    // Component-specific initialization
  }
}
```

### 5. Lifecycle Hooks Pattern
**Location:** `app/pages/Page.js`

Pages implement a clear lifecycle with optional hooks:

```javascript
class Page {
  async create() {
    await this.beforeCreate?.()  // Optional hook
    await this.createElements();
    await this.createComponents();
    this.createPageAnimations();
    this.createPage();
    await this.afterCreate?.()   // Optional hook
  }
  
  async show() {
    await this.beforeShow?.()
    // Show logic
    await this.afterShow?.()
  }
  
  async hide(route) {
    await this.beforeHide?.()
    // Hide logic
    await this.afterHide?.()
  }
  
  async destroy() {
    await this.beforeDestroy?.()
    // Cleanup logic
    await this.afterDestroy?.()
  }
}
```

### 6. Orchestrator Pattern
**Location:** `app/services/Router.js`

The `Router` orchestrates the page navigation lifecycle:

1. **beforePageUpdate**: Validates route
2. **startPageUpdate**: Hides current page, updates DOM, loads new page
3. **afterPageUpdate**: Creates and shows new page

This pattern ensures a consistent, testable navigation flow.

### 7. Strategy Pattern (Animation Registry)
**Location:** `app/animations/AnimationsManager.js`

The `AnimationsManager` uses a registry pattern to map animation types to animation classes:

```javascript
this.animationRegistry = {
  title: Titles,
  // Future: image: Images, parallax: Parallax
};
```

This allows easy extension with new animation types without modifying core logic.

## Class Hierarchy

### Application Layer
```
App
├── ServicesFactory (creates all services)
│   ├── SiteConfig
│   ├── Router
│   ├── RegistryService
│   ├── RouterPageLoader
│   ├── RouterPageManager
│   ├── RouterHistory
│   ├── RouterResolver
│   ├── AnimationsService
│   ├── TransitionsService
│   ├── SmoothScroll
│   └── Footnotes
├── Preloader (Component)
└── Navigation (Component)
```

### Page Layer
```
Page (base class)
├── Home
├── Introduction
├── View (generic class for sections)
└── References
```

### Component Layer
```
Component (base class)
├── Preloader
├── Navigation
├── SmoothScroll
└── Footnotes
```

### Animation Layer
```
AnimationsService
├── Titles
├── BackgroundColors
└── PreloaderAnimation
```

## Data Flow

### Page Navigation Flow

```
User clicks link
    ↓
Router.setupLinkListeners() (event delegation)
    ↓
Router.updatePage(href)
    ↓
Router.beforePageUpdate(href)
    ├── RouterResolver.validateRoute()
    └── Returns RouteValidationResult
    ↓
Router.startPageUpdate(routeInfo)
    ├── CurrentPage.hide(route)
    │   ├── TransitionsService.updateTransitionOverlay()
    │   └── TransitionsService.showPageTransition()
    ├── RouterPageManager.updatePage(route)
    │   ├── Fetch HTML
    │   ├── Update DOM
    │   ├── Update page metadata
    │   └── Preload images
    ├── RouterHistory.updateHistory()
    └── RouterPageLoader.getPage(route)
        ├── Load page class (if not cached)
        └── Initialize page instance
    ↓
Router.afterPageUpdate(newPage, routeInfo)
    ├── newPage.create()
    │   ├── createElements()
    │   ├── createComponents()
    │   ├── createPageAnimations()
    │   └── setupEventListeners()
    └── newPage.show()
        ├── TransitionsService.hidePageTransition()
        └── SmoothScroll.scrollTo(0)
```

### Page Lifecycle Flow

```
Page Creation:
create() → beforeCreate → createElements → createComponents → 
createPageAnimations → createPage → afterCreate

Page Display:
show() → beforeShow → hidePageTransition → scrollTo(0) → afterShow

Page Hiding:
hide(route) → beforeHide → updateTransitionOverlay → 
showPageTransition → destroy() → afterHide

Page Destruction:
destroy() → beforeDestroy → destroyPageAnimations → 
removeEventListeners → destroyComponents → destroyElements → afterDestroy
```

### Animation Flow

```
Page.create()
    ↓
Page.createPageAnimations()
    ↓
AnimationsService.createPageAnimations(pageElement)
    ├── Find elements with [data-animation]
    ├── Group by animation type
    ├── Create animation instances
    └── Setup shared IntersectionObserver
    ↓
IntersectionObserver detects viewport entry
    ↓
Animation.animateIn() (e.g., Titles.animateIn())
    ↓
GSAP timeline animates element
```

## Key Components

### Router (`app/router/Router.js`)
- Handles navigation lifecycle
- Delegates route validation to RouterResolver
- Coordinates page hiding/showing
- Manages browser history via RouterHistory

### RouterPageLoader (`app/router/RouterPageLoader.js`)
- Dynamically loads page classes
- Caches loaded classes in RegistryService
- Initializes page instances with dependencies
- Handles first page load

### RouterPageManager (`app/router/RouterPageManager.js`)
- Fetches page HTML via fetch()
- Updates DOM with new page content
- Extracts page metadata (template, background, color)
- Preloads images before page display

### RegistryService (`app/services/RegistryService.js`)
- Registry of page classes (template → PageClass)
- Tracks current page instance
- Provides lookup methods

### RouterResolver (`app/router/RouterResolver.js`)
- Validates routes against SiteConfig
- Normalizes route formats
- Handles invalid routes (redirects, external links)
- Returns RouteValidationResult objects

### RouterHistory (`app/router/RouterHistory.js`)
- Manages browser history state
- Handles popstate events (back/forward)
- Normalizes routes for history
- Prevents duplicate history entries

### AnimationsService (`app/services/AnimationsService.js`)
- Discovers animations via data-animation attributes
- Creates animation instances from registry
- Manages shared IntersectionObserver
- Cleans up animations on page destroy

### TransitionsService (`app/services/TransitionsService.js`)
- Manages page transition overlays
- Preloads transition images
- Updates transition templates from SiteConfig
- Coordinates transition animations

### SiteConfig (`app/config/SiteConfig.js`)
- Central configuration for all routes
- Maps templates to classes, URLs, and transitions
- Single source of truth for route data

### Page Base Class (`app/pages/Page.js`)
- Base class for all pages
- Implements lifecycle methods
- Manages page elements and components
- Handles page animations

### Component Base Class (`app/components/Component.js`)
- Base class for all components
- Provides event management
- Handles element selection
- Lifecycle management

## Configuration

### SiteConfig Structure

Each route in `SiteConfig` contains:
```javascript
{
  template: "section-1",      // data-template attribute
  class: "View",              // JavaScript class name
  link: "/section-1",        // URL path
  url: "/pages/section-1.html", // HTML file path
  transition: {
    image: "...",             // Transition image URL
    copy: "...",              // Transition text
    alt: "..."                // Image alt text
  }
}
```

### Environment Configuration

`app/config/Environment.js` provides:
- Development vs production page paths
- Hot module reloading setup
- Environment detection utilities

## Constants

`app/utilities/Constants.js` centralizes all:
- CSS selectors
- HTML attributes
- Event names
- Common values

This prevents "magic strings" and provides a single source of truth.

## Utilities

Key utility modules:
- **Images.js**: Image preloading with decode support
- **Utilities.js**: DOM helpers, element selection
- **EventManager.js**: Event handling abstraction
- **Colors.js**: Color utilities
- **Constants.js**: Application constants

## Memory Management

The application implements careful memory management:

1. **Animation Cleanup**: All animations are killed on page destroy
2. **Event Listener Cleanup**: Event listeners are removed in destroy methods
3. **Reference Nulling**: DOM references are set to null after use
4. **AbortController**: Used for canceling async operations

## Error Handling

Error handling follows these patterns:

1. **Try-catch blocks** in async operations
2. **Fallback routes** (invalid routes redirect to home)
3. **Graceful degradation** (animations fail silently, page still shows)
4. **Console warnings** for non-critical errors

## Browser History Management

The application uses the History API with:
- `pushState` for forward navigation
- `replaceState` for initial load and redirects
- `popstate` event handling for back/forward buttons
- Route normalization to prevent duplicate entries

