# How-To Guide

## Table of Contents
- [Creating a New Page](#creating-a-new-page)
- [Page Registry Setup](#page-registry-setup)
- [Animation System](#animation-system)
- [Image Preloading](#image-preloading)
- [Page Transitions](#page-transitions)
- [Authoring Page Animations](#authoring-page-animations)
- [Using Page Lifecycle Hooks](#using-page-lifecycle-hooks)
- [Creating Custom Components](#creating-custom-components)

## Creating a New Page

This guide walks you through creating a complete new page from scratch.

### Step 1: Register in SiteConfig

First, add your page configuration to `app/config/SiteConfig.js`:

```javascript
// In SiteConfig.initializeSettings()
'my-new-page': {
  template: "my-new-page",        // Must match data-template in HTML
  class: "MyNewPage",              // JavaScript class name
  link: "/my-new-page",            // URL path
  url: "/pages/my-new-page.html",  // HTML file path
  transition: {
    image: "https://example.com/transition-image.jpg",
    copy: "My New Page",           // Text shown during transition
    alt: "Transition image alt text"
  },
},
```

**Important Notes:**
- `template` must match the `data-template` attribute in your HTML
- `class` must match your JavaScript class name
- `link` is the URL path users will navigate to
- `url` is the path to the HTML file (used by PageManager.fetch)

### Step 2: Create HTML Template

Create your HTML template in `views/pages/my-new-page.html`:

```html
{% extends "layouts/page.html" %}
{% block title %}My New Page{% endblock %}
{% block content %}
<main class="my-new-page" data-template="my-new-page" data-background="#ffffff" data-color="#000000">
  <section class="page-content">
    <article>
      <h1 data-animation="title">My New Page Title</h1>
      
      <p>Your content here...</p>
      
      <!-- Lazy-loaded image -->
      <img 
        data-src="https://example.com/image.jpg" 
        alt="Description"
      />
      
      <!-- More content -->
    </article>
    
    <footer>
      <a href="/" class="internal-link">Home</a>
      <a href="/other-page" class="internal-link">Other Page</a>
    </footer>
  </section>
</main>
{% endblock %}
```

**Key HTML Attributes:**
- `data-template`: Must match SiteConfig template value
- `data-background`: Background color for the page (optional)
- `data-color`: Text color for the page (optional)
- `data-animation="title"`: Enables title animation (see Animation System)
- `data-src`: For lazy-loaded images (see Image Preloading)
- `class="internal-link"`: Required for SPA navigation

### Step 3: Create Page Class

Create your page class in `app/pages/MyNewPage.js`:

```javascript
import Page from "./Page.js";

export class MyNewPage extends Page {
  constructor(options = {}) {
    super({
      element: ".my-new-page",  // CSS selector matching your main element class
      elements: {
        wrapper: ".page-content",
        title: "h1",
        // Add more selectors as needed
      },
      // Services are automatically injected
      ...options,
    });
  }

  async create() {
    // Call parent create() to set up base functionality
    await super.create();
    
    // Add custom initialization here
    // this.elements.title is now available
  }
  
  // Optional: Override lifecycle hooks
  async beforeCreate() {
    // Runs before page elements are created
  }
  
  async afterCreate() {
    // Runs after page is fully created
  }
}
```

**For Generic Pages:**

If your page doesn't need custom logic, use the `View` class:

```javascript
// In SiteConfig
'my-section': {
  template: "my-section",
  class: "View",  // Use View class
  // ... rest of config
}
```

The `View` class handles all standard page functionality automatically.

### Step 4: Generate Static HTML

After creating your template, generate the static HTML:

```bash
bun run build:html:dev
```

This generates `pages/my-new-page.html` from your Nunjucks template.

### Step 5: Test Your Page

1. Start the development server: `bun run dev`
2. Navigate to `http://localhost:3000/my-new-page`
3. Verify:
   - Page loads correctly
   - Transitions work
   - Animations trigger
   - Images load
   - Navigation links work

## Page Registry Setup

The Page Registry automatically manages page classes. Here's how it works:

### Automatic Registration

Pages are registered automatically when first loaded:

```javascript
// PageLoader.loadPage() automatically:
1. Checks if page class is already in registry
2. If not, dynamically imports the page class
3. Stores it in PageRegistry.pages Map
4. Returns the class for instantiation
```

### Manual Registration (Advanced)

You can manually register pages if needed:

```javascript
// In your code
const MyPageClass = await import('./pages/MyPage.js');
pageRegistry.setPage('my-page', MyPageClass.default);
```

### Checking Page Status

```javascript
// Check if page is registered
if (pageRegistry.hasPage('my-page')) {
  const PageClass = pageRegistry.getPage('my-page');
}

// Get current page instance
const currentPage = pageRegistry.getCurrentPage();
```

## Animation System

The animation system uses data attributes to automatically discover and animate elements.

### Using Built-in Animations

#### Title Animation

Add `data-animation="title"` to any element:

```html
<h1 data-animation="title">Animated Title</h1>
<h2 data-animation="title">Another Animated Title</h2>
```

The `Titles` animation class will:
- Fade in when the element enters the viewport
- Use IntersectionObserver for performance
- Automatically clean up on page destroy

**How it works:**
1. `AnimationsManager` scans the page for `[data-animation]` attributes
2. Groups elements by animation type
3. Creates animation instances from the registry
4. Sets up a shared IntersectionObserver
5. Calls `animateIn()` when element enters viewport

### Creating Custom Animations

#### Step 1: Create Animation Class

Create `app/animations/MyCustomAnimation.js`:

```javascript
export class MyCustomAnimation {
  constructor(element) {
    if (!element || !(element instanceof HTMLElement)) {
      console.warn('MyCustomAnimation: Invalid element');
      this.element = null;
      this.animationTimelines = [];
      return;
    }

    this.element = element;
    this.animationTimelines = [];
  }

  /**
   * Called when element enters viewport
   */
  animateIn() {
    if (!this.element) return;

    const timeline = gsap.timeline();
    
    timeline.fromTo(
      this.element,
      {
        y: 50,
        opacity: 0,
      },
      {
        y: 0,
        opacity: 1,
        duration: 1,
        ease: "power2.out",
      }
    );

    this.animationTimelines.push(timeline);
    return timeline;
  }

  /**
   * Called when element leaves viewport
   */
  animateOut() {
    if (!this.element) return;

    const timeline = gsap.timeline();
    
    timeline.set(this.element, {
      opacity: 0,
    });

    this.animationTimelines.push(timeline);
    return timeline;
  }

  /**
   * Clean up animation (required)
   */
  kill() {
    if (this.animationTimelines && this.animationTimelines.length > 0) {
      this.animationTimelines.forEach((timeline) => {
        try {
          timeline.kill();
        } catch (error) {
          console.error('MyCustomAnimation#kill: Error killing timeline:', error);
        }
      });
      this.animationTimelines = [];
    }
  }
}
```

#### Step 2: Register Animation

Add to `app/animations/AnimationsManager.js`:

```javascript
import { MyCustomAnimation } from "./MyCustomAnimation.js";

export class AnimationsManager {
  constructor() {
    this.animationRegistry = {
      title: Titles,
      'my-custom': MyCustomAnimation,  // Add your animation
    };
    // ...
  }
}
```

#### Step 3: Use in HTML

```html
<div data-animation="my-custom">
  This will animate with MyCustomAnimation
</div>
```

### Registering Custom Animations at Runtime

You can also register GSAP timelines directly:

```javascript
// In your Page class
async create() {
  await super.create();
  
  const customTimeline = gsap.timeline({
    paused: true,
    onComplete: () => {
      // Animation complete
    }
  });
  
  customTimeline.to(this.elements.someElement, {
    opacity: 1,
    duration: 1
  });
  
  // Register with AnimationsManager
  this.animationsManager.register(customTimeline);
  
  // Play when ready
  customTimeline.play();
}
```

**Important:** Registered animations are automatically cleaned up when the page is destroyed.

## Image Preloading

The application provides a robust image preloading system with decode support to prevent layout shifts and flicker.

### Basic Usage

#### Lazy Loading with data-src

Use `data-src` instead of `src` for images that should be preloaded:

```html
<img 
  data-src="https://example.com/image.jpg" 
  alt="Description"
/>
```

The `PageManager` automatically preloads all `img[data-src]` elements before showing the page.

#### Excluding Preloader Images

Images inside `.preloader` are automatically excluded from page preloading.

### Using preloadImages Utility

#### Basic Preloading

```javascript
import { preloadImages } from "../utilities/Images.js";

// Preload all images with data-src
await preloadImages({
  images: 'img[data-src]',
  container: document,
});
```

#### With Progress Tracking

```javascript
await preloadImages({
  images: this.images,
  excludePreloader: true,
  useDecode: true,  // Decode images for layout-ready rendering
  onProgress: (loaded, total, percentage) => {
    console.log(`${percentage}% loaded`);
    // Update progress bar, etc.
  },
  onImageLoad: (imageElement, index) => {
    // Called when each image loads
    console.log(`Image ${index} loaded:`, imageElement);
  }
});
```

#### Preloading Specific Images

```javascript
// Preload specific image elements
const images = document.querySelectorAll('.gallery img[data-src]');
await preloadImages({
  images: images,
  useDecode: true,
});
```

#### Preloading Single Image

```javascript
import { loadSingleImage } from "../utilities/Images.js";

const img = document.querySelector('img[data-src]');
await loadSingleImage({
  element: img,
  useDecode: true,
  onLoad: (loadedImg) => {
    console.log('Image loaded:', loadedImg);
  }
});
```

### Image Decode Support

The `useDecode: true` option:
- Loads images off-DOM first
- Decodes them before setting `src` on DOM element
- Prevents flicker and layout shifts
- Falls back gracefully if `decode()` is not supported

### In Page Classes

```javascript
export class MyPage extends Page {
  async create() {
    await super.create();
    
    // Preload additional images after page creation
    const additionalImages = this.element.querySelectorAll('.gallery img[data-src]');
    await preloadImages({
      images: additionalImages,
      useDecode: true,
      onProgress: (loaded, total, percentage) => {
        // Update gallery loading state
      }
    });
  }
}
```

## Page Transitions

Page transitions provide smooth visual feedback when navigating between pages.

### Configuration

Transitions are configured in `SiteConfig`:

```javascript
'my-page': {
  // ... other config
  transition: {
    image: "https://example.com/transition-image.jpg",
    copy: "Loading My Page...",
    alt: "Transition image description"
  },
},
```

### How Transitions Work

1. **On Page Hide**: 
   - `TransitionsManager.updateTransitionOverlay()` updates the overlay with the next page's transition data
   - Image is preloaded if not already cached
   - `showPageTransition()` animates the overlay in

2. **On Page Show**:
   - `hidePageTransition()` animates the overlay out
   - Page content is revealed

### Transition Image Preloading

Transition images are automatically preloaded:
- During browser idle time (via `requestIdleCallback`)
- Before showing transition (if not already preloaded)
- Cached in `TransitionsManager.preloadedImageUrls` Set

### Customizing Transition Animation

Edit `app/animations/PageTransition.js`:

```javascript
async showPageTransition(element) {
  // Customize the show animation
  const timeline = gsap.timeline({
    onComplete: () => resolve(),
  });

  timeline.to(element, {
    opacity: 1,
    duration: 0.3,  // Adjust duration
    ease: "power2.inOut",
  });
  
  // Add more animation steps...
}
```

### Disabling Transitions

To disable transitions for a specific page:

```javascript
// In your Page class
async hide(route) {
  // Skip transition
  await this.beforeHide?.();
  this.destroy();
  await this.afterHide?.();
}

async show() {
  await this.beforeShow?.();
  // Skip transition hide
  this.smoothScroll.scrollTo(0, { immediate: true });
  await this.afterShow?.();
}
```

## Authoring Page Animations

### Using Lifecycle Hooks

Page lifecycle hooks allow you to add animations at specific points:

```javascript
export class MyPage extends Page {
  async beforeCreate() {
    // Animate page container in
    gsap.set(this.element, { opacity: 0 });
  }
  
  async afterCreate() {
    // Animate page content in after everything is set up
    gsap.to(this.element, {
      opacity: 1,
      duration: 0.5,
      ease: "power2.out"
    });
  }
  
  async beforeShow() {
    // Animation before page is shown
    gsap.from(this.elements.title, {
      y: 20,
      opacity: 0,
      duration: 0.6,
      ease: "power2.out"
    });
  }
  
  async afterShow() {
    // Animation after page is fully visible
    // e.g., trigger scroll animations
  }
}
```

### Registering Page-Specific Animations

```javascript
export class MyPage extends Page {
  async create() {
    await super.create();
    
    // Create custom timeline
    const pageAnimation = gsap.timeline({ paused: true });
    
    pageAnimation.from(this.elements.header, {
      y: 50,
      opacity: 0,
      duration: 1
    });
    
    pageAnimation.from(this.elements.content, {
      y: 30,
      opacity: 0,
      duration: 0.8
    }, "-=0.5"); // Start 0.5s before previous animation ends
    
    // Register for automatic cleanup
    this.animationsManager.register(pageAnimation);
    
    // Play when ready
    pageAnimation.play();
  }
}
```

### Scroll-Triggered Animations

Use IntersectionObserver for scroll-triggered animations:

```javascript
export class MyPage extends Page {
  async create() {
    await super.create();
    
    // Create observer for custom scroll animations
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.animateElementIn(entry.target);
        }
      });
    }, {
      threshold: 0.1
    });
    
    // Observe elements
    const animatedElements = this.element.querySelectorAll('.animate-on-scroll');
    animatedElements.forEach(el => observer.observe(el));
    
    // Store observer for cleanup
    this.scrollObserver = observer;
  }
  
  animateElementIn(element) {
    gsap.fromTo(element, 
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: "power2.out" }
    );
  }
  
  async destroy() {
    // Clean up observer
    if (this.scrollObserver) {
      this.scrollObserver.disconnect();
      this.scrollObserver = null;
    }
    
    await super.destroy();
  }
}
```

## Using Page Lifecycle Hooks

The Page base class provides optional lifecycle hooks you can override:

### Available Hooks

```javascript
export class MyPage extends Page {
  // Called before page elements are created
  async beforeCreate() { }
  
  // Called after page is fully created
  async afterCreate() { }
  
  // Called before page is shown
  async beforeShow() { }
  
  // Called after page is shown
  async afterShow() { }
  
  // Called before page is hidden
  async beforeHide() { }
  
  // Called after page is hidden
  async afterHide() { }
  
  // Called before page is destroyed
  async beforeDestroy() { }
  
  // Called after page is destroyed
  async afterDestroy() { }
}
```

### Example: Analytics Tracking

```javascript
export class MyPage extends Page {
  async afterShow() {
    // Track page view
    if (window.analytics) {
      window.analytics.track('Page View', {
        page: 'my-page'
      });
    }
  }
}
```

### Example: Lazy Loading Content

```javascript
export class MyPage extends Page {
  async afterCreate() {
    // Load additional content after page is created
    const response = await fetch('/api/additional-content');
    const data = await response.json();
    this.renderAdditionalContent(data);
  }
}
```

## Creating Custom Components

### Step 1: Extend Component Base Class

Create `app/components/MyComponent.js`:

```javascript
import Component from "./Component.js";
import { SELECTORS, EVENTS } from "../utilities/Constants.js";

export class MyComponent extends Component {
  constructor(options = {}) {
    super({
      element: SELECTORS.MY_COMPONENT,
      elements: {
        button: ".my-component__button",
        content: ".my-component__content",
      },
    });
  }

  create() {
    super.create(); // Sets up this.element and this.elements
    
    // Component-specific initialization
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    if (this.elements.button) {
      this.addListenerAndRegister(
        this.elements.button,
        EVENTS.CLICK,
        this.handleButtonClick.bind(this)
      );
    }
  }
  
  handleButtonClick(event) {
    // Handle click
    this.emit('button-clicked', { component: this });
  }
  
  destroy() {
    // Clean up event listeners
    this.removeAllListeners();
    
    // Clear references
    this.element = null;
    this.elements = null;
  }
}
```

### Step 2: Use Component in Page

```javascript
import { MyComponent } from "../components/MyComponent.js";

export class MyPage extends Page {
  async create() {
    await super.create();
    
    // Create component
    this.myComponent = new MyComponent();
    this.myComponent.create();
    
    // Listen to component events
    this.myComponent.on('button-clicked', (detail) => {
      console.log('Button clicked!', detail);
    });
  }
  
  async destroy() {
    // Clean up component
    if (this.myComponent) {
      this.myComponent.destroy();
      this.myComponent = null;
    }
    
    await super.destroy();
  }
}
```

### Step 3: Emit Custom Events

```javascript
// In your component
this.emit('custom-event', {
  data: 'some data',
  timestamp: Date.now()
});

// In your page
this.myComponent.on('custom-event', (detail) => {
  // Handle event
});
```

## Best Practices

### Page Creation
- Always call `super.create()` in your `create()` method
- Use `data-template` attribute consistently
- Register all pages in SiteConfig before use
- Use `View` class for simple pages without custom logic

### Animations
- Always implement `kill()` method for cleanup
- Store animation timelines in arrays for batch cleanup
- Use IntersectionObserver for scroll-triggered animations
- Register custom animations with AnimationsManager for automatic cleanup

### Images
- Use `data-src` for lazy-loaded images
- Always use `useDecode: true` for layout-ready images
- Exclude preloader images from page preloading
- Handle image load errors gracefully

### Components
- Extend Component base class
- Clean up event listeners in `destroy()`
- Use `addListenerAndRegister()` for automatic cleanup
- Emit events for component communication

### Memory Management
- Always implement `destroy()` methods
- Remove event listeners
- Set DOM references to null
- Kill animation timelines
- Disconnect observers

## Troubleshooting

### Page Not Loading
- Check SiteConfig registration
- Verify `data-template` matches SiteConfig template
- Check browser console for import errors
- Verify HTML file exists in `pages/` directory

### Animations Not Working
- Verify `data-animation` attribute is set
- Check animation is registered in AnimationsManager
- Ensure element is in viewport (IntersectionObserver)
- Check browser console for errors

### Images Not Loading
- Verify `data-src` attribute is set
- Check image URLs are valid
- Verify preloadImages is called
- Check network tab for failed requests

### Transitions Not Showing
- Verify transition config in SiteConfig
- Check transition image URL is valid
- Verify PageTransition class is working
- Check browser console for errors

