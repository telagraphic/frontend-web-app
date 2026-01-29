# Page Animation System Documentation

## Table of Contents

- [Overview](#overview)
- [How to Set Up a Page Animation](#how-to-set-up-a-page-animation)
  - [Step 1: Add `data-animation` Attribute to HTML](#step-1-add-data-animation-attribute-to-html)
  - [Step 2: Register Animation Class (if creating new type)](#step-2-register-animation-class-if-creating-new-type)
  - [Step 3: Create Animation Class (if new type)](#step-3-create-animation-class-if-new-type)
  - [Step 4: Automatic Setup](#step-4-automatic-setup)
- [How AnimationsService Coordinates Animations](#how-animationsservice-coordinates-animations)
  - [Architecture Overview](#architecture-overview)
  - [Step-by-Step Process](#step-by-step-process)
    - [1. Page Creation (`Page.create()` → `createPageAnimations()`)](#1-page-creation-pagecreate--createpageanimations)
    - [2. Cleanup Previous Page (`destroyPageAnimations()`)](#2-cleanup-previous-page-destroypageanimations)
    - [3. Validation (`validatePageElement()`)](#3-validation-validatepageelement)
    - [4. Discovery (`findAnimatedElements()`)](#4-discovery-findanimatedelements)
    - [5. Grouping (`groupElementsByType()`)](#5-grouping-groupelementsbytype)
    - [6. Instance Creation (`createAnimationInstances()`)](#6-instance-creation-createanimationinstances)
    - [7. Observer Setup (`createSharedIntersectionObserver()`)](#7-observer-setup-createsharedintersectionobserver)
    - [8. Page Destruction (`Page.destroy()` → `destroyPageAnimations()`)](#8-page-destruction-pagedestroy--destroypageanimations)
- [Key Design Patterns](#key-design-patterns)
  - [1. Single IntersectionObserver Pattern](#1-single-intersectionobserver-pattern)
  - [2. Registry Pattern](#2-registry-pattern)
  - [3. Factory Pattern](#3-factory-pattern)
  - [4. Pure Functions](#4-pure-functions)
- [Animation Instance Lifecycle](#animation-instance-lifecycle)
- [Example Flow](#example-flow)
- [Benefits of This Architecture](#benefits-of-this-architecture)
- [GSAP `kill()` vs `killTweensOf()` - Key Differences](#gsap-kill-vs-killtweensof---key-differences)
  - [1. `kill()` - On Individual Tweens/Timelines](#1-kill---on-individual-tweenstimelines)
  - [2. `gsap.killTweensOf()` - Static Method for Targets](#2-gsapkilltweensof---static-method-for-targets)
- [Your Use Case: Animation Registry Pattern](#your-use-case-animation-registry-pattern)
  - [Understanding Your Animation Structure](#understanding-your-animation-structure)
  - [Solution: Enhanced Animation Classes](#solution-enhanced-animation-classes)
- [Recommended Implementation](#recommended-implementation)
- [Key Points from GSAP Documentation](#key-points-from-gsap-documentation)
- [Best Practice for Your Code](#best-practice-for-your-code)

---

## Overview

The animation system automatically handles page animations based on `data-animation` attributes in your HTML. It uses a single `IntersectionObserver` per page to efficiently trigger animations when elements enter or leave the viewport.

**Key Components:**
- **`AnimationsService`**: Manages the animation lifecycle, auto-detects animated elements, and coordinates a shared IntersectionObserver
- **`Titles`**: Animation class that fades in title elements when they enter the viewport
- **Page Integration**: `Page.js` calls the manager during create/destroy lifecycle

## How to Set Up a Page Animation

### Step 1: Add `data-animation` Attribute to HTML

Simply add the `data-animation` attribute to any element you want to animate:

```html
<h2 data-animation="title">My Animated Title</h2>
```

The attribute value (`"title"`) corresponds to an animation class registered in the `AnimationsService` registry.

### Step 2: Register Animation Class (if creating new type)

If you're creating a new animation type (e.g., `"image"`), add it to the registry in `AnimationsService.js`:

```javascript
this.animationRegistry = {
  title: Titles,
  image: Images,  // New animation type
};
```

### Step 3: Create Animation Class (if new type)

Create a new animation class (e.g., `Images.js`) that follows the same pattern as `Titles.js`:

```javascript
export class Images {
  constructor(element) {
    this.element = element;
    this.animationTimelines = [];
  }

  animateIn() {
    // Animation logic when element enters viewport
  }

  animateOut() {
    // Animation logic when element leaves viewport
  }

  kill() {
    // Cleanup all timelines
  }
}
```

### Step 4: Automatic Setup

The system automatically:
- Detects elements with `data-animation` attributes when the page is created
- Creates animation instances for each element
- Sets up a shared IntersectionObserver
- Triggers animations when elements enter/leave the viewport

**No additional code needed in `Page.js`** - it's all handled automatically!

## How AnimationsService Coordinates Animations

### Architecture Overview

`AnimationsService` uses a factory pattern with a registry to manage animations:

```
Page.js
  └─> AnimationsService.createPageAnimations(pageElement)
       ├─> validatePageElement()          [Validates input]
       ├─> findAnimatedElements()         [Discovers elements]
       ├─> groupElementsByType()          [Groups by type]
       ├─> createAnimationInstances()     [Creates instances]
       └─> createSharedIntersectionObserver() [Sets up observer]
```

### Step-by-Step Process

#### 1. Page Creation (`Page.create()` → `createPageAnimations()`)

When a page is created, `Page.js` calls:
```javascript
this.animationsManager.createPageAnimations(this.element);
```

#### 2. Cleanup Previous Page (`destroyPageAnimations()`)

First, any existing animations from the previous page are cleaned up:
- Kills all animation timelines
- Disconnects the previous IntersectionObserver
- Resets the `pageAnimations` array

#### 3. Validation (`validatePageElement()`)

Validates that the page element is a valid HTMLElement. Throws an error if invalid.

#### 4. Discovery (`findAnimatedElements()`)

Searches the page for all elements with `data-animation` attributes:
```javascript
pageElement.querySelectorAll('[data-animation]')
```

Returns a `NodeList` of elements to animate.

#### 5. Grouping (`groupElementsByType()`)

Groups elements by their animation type into a `Map`:
```javascript
Map {
  'title' => [element1, element2, ...],
  'image' => [element3, element4, ...]
}
```

This allows batch creation of the same animation type.

#### 6. Instance Creation (`createAnimationInstances()`)

For each animation type:
- Looks up the animation class from the registry
- Creates an instance for each element
- Registers each instance in `this.pageAnimations` for tracking
- Returns an array of all created instances

#### 7. Observer Setup (`createSharedIntersectionObserver()`)

Creates a single `IntersectionObserver` for all animations:
- Disconnects any previous observer
- Creates a new observer with a callback that:
  - Finds the animation instance for each intersecting element
  - Calls `animateIn()` when element enters viewport
  - Calls `animateOut()` when element leaves viewport
- Observes all animated elements

#### 8. Page Destruction (`Page.destroy()` → `destroyPageAnimations()`)

When navigating away, `Page.js` calls:
```javascript
this.animationsManager.destroyPageAnimations();
```

This:
- Calls `kill()` on all registered animation instances
- Disconnects the IntersectionObserver
- Resets the `pageAnimations` array

## Key Design Patterns

### 1. Single IntersectionObserver Pattern

Instead of creating one observer per element, a single shared observer watches all animated elements. This is much more performant, especially with many animations.

### 2. Registry Pattern

Animation types are registered in `animationRegistry`, making it easy to add new types without modifying core logic.

### 3. Factory Pattern

`createAnimationInstances()` acts as a factory, creating instances based on the registry mapping.

### 4. Pure Functions

The refactored code uses pure functions (`validatePageElement`, `findAnimatedElements`, `groupElementsByType`) that:
- Have no side effects
- Return predictable outputs
- Are easily testable

## Animation Instance Lifecycle

Each animation instance (e.g., `Titles`) follows this lifecycle:

1. **Construction**: Element is passed to constructor, timelines array is initialized
2. **Registration**: Instance is added to `AnimationsService.pageAnimations`
3. **Observation**: Element is observed by the shared IntersectionObserver
4. **Animation**: `animateIn()` or `animateOut()` is called when element intersects viewport
5. **Cleanup**: `kill()` is called on page destroy to clean up all timelines

## Example Flow

**HTML:**
```html
<main data-template="section-1">
  <h2 data-animation="title">First Title</h2>
  <h2 data-animation="title">Second Title</h2>
</main>
```

**Execution Flow:**
1. `Page.create()` is called
2. `Page.createPageAnimations()` calls `AnimationsService.createPageAnimations(mainElement)`
3. Manager finds 2 elements with `data-animation="title"`
4. Manager groups them: `Map { 'title' => [h2, h2] }`
5. Manager creates 2 `Titles` instances, one per element
6. Manager creates a single IntersectionObserver
7. Observer watches both h2 elements
8. When user scrolls and first h2 enters viewport → `Titles.animateIn()` is called
9. When user navigates away → `AnimationsService.destroyPageAnimations()` kills both instances

## Benefits of This Architecture

- **Performance**: Single observer instead of one per element
- **Automatic**: No manual setup needed - just add `data-animation` attributes
- **Extensible**: Easy to add new animation types via registry
- **Maintainable**: Clear separation of concerns, pure functions, single responsibility
- **Memory Safe**: Proper cleanup on page destroy prevents memory leaks





## GSAP `kill()` vs `killTweensOf()` - Key Differences

### 1. `kill()` - On Individual Tweens/Timelines

**What it does:**
- Stops a specific tween or timeline
- Removes it from the rendering queue
- Allows garbage collection
- Works on tween instances, timeline instances, or animation objects

**When to use:**
- You have a reference to the tween/timeline instance
- You're managing animations through a registry (your case)

**Example:**
```javascript
const timeline = gsap.timeline();
timeline.to(".element", { x: 100, duration: 2 });

// Later, kill it
timeline.kill(); // ✅ Stops the timeline and all its child tweens
```

### 2. `gsap.killTweensOf()` - Static Method for Targets

**What it does:**
- Kills all tweens affecting specific DOM elements
- Doesn't require references to tween instances
- Can target specific properties

**When to use:**
- You don't have references to the tweens
- You want to stop all animations on specific elements
- You're cleaning up by element rather than by animation instance

**Example:**
```javascript
// Kill all tweens on an element
gsap.killTweensOf(".my-element");

// Kill specific properties only
gsap.killTweensOf(".my-element", { x: true, y: true });
```

## Your Use Case: Animation Registry Pattern

Since you're storing animation instances in `this.animations`, use `kill()` on each instance. Here's how to implement it:

### Understanding Your Animation Structure

Looking at your code:
1. `Titles` class creates GSAP timelines in `animateIn()` and `animateOut()`
2. These timelines are created on-demand (not stored)
3. The `Titles` instance itself doesn't store timeline references

**Problem:** Your `Titles` instances don't currently store timeline references, so calling `kill()` on them won't work directly.

### Solution: Enhanced Animation Classes

You need to modify your animation classes to store timeline references. Here's how:

**Option 1: Store Timelines in Animation Classes (Recommended)**

```javascript
// Titles.js - Enhanced version
export default class Titles extends Animation {
  constructor(element, elements) {
    super(element, elements);
    this.timelines = []; // Store all timelines created by this animation
    this.observer = null; // Store IntersectionObserver for cleanup
    this.createIntersectionObserver();
  }

  animateIn() {
    const showTimeline = gsap.timeline();
    
    showTimeline.fromTo(
      this.element,
      {
        autoAlpha: 0,
      },
      {
        autoAlpha: 1,
        duration: 0.5,
        ease: "power2.inOut",
      }
    );
    
    // ✅ Store timeline reference for cleanup
    this.timelines.push(showTimeline);
    
    return showTimeline;
  }

  animateOut() {
    const hideTimeline = gsap.timeline();
    
    hideTimeline.set(this.element, {
      autoAlpha: 0,
    });
    
    // ✅ Store timeline reference for cleanup
    this.timelines.push(hideTimeline);
    
    return hideTimeline;
  }

  createIntersectionObserver() {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.animateIn();
        } else {
          this.animateOut();
        }
      });
    });
    
    this.observer.observe(this.element);
  }

  // ✅ Add kill method for cleanup
  kill() {
    // Kill all timelines created by this animation
    if (this.timelines) {
      this.timelines.forEach(timeline => {
        timeline.kill();
      });
      this.timelines = [];
    }
    
    // Disconnect IntersectionObserver
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    // Clear element reference
    this.element = null;
  }
}
```

**Option 2: Use `killTweensOf()` on Elements (Alternative)**

If you don't want to modify animation classes, you can use `killTweensOf()` on the elements:

```javascript
destroyAnimations() {
  if (!this.animations || this.animations.length === 0) {
    this.animation = null;
    return true;
  }

  this.animations.forEach((animation) => {
    try {
      // If animation has a kill method, use it
      if (typeof animation.kill === 'function') {
        animation.kill();
      }
      // Otherwise, kill all tweens on the animation's element
      else if (animation.element) {
        // ✅ Kill all GSAP tweens affecting this element
        gsap.killTweensOf(animation.element);
        
        // Also disconnect IntersectionObserver if it exists
        if (animation.observer) {
          animation.observer.disconnect();
        }
      }
    } catch (error) {
      const type = animation._animationType || 'unknown';
      console.error(`Page ${this.id}: Error cleaning up ${type} animation:`, error);
    }
  });

  this.animations = null;
  this.animation = null;
  return true;
}
```

## Recommended Implementation

Use a hybrid approach: store timeline references in animation classes and provide a `kill()` method:

```javascript
/**
 * Register an animation instance for uniform tracking and cleanup
 */
registerAnimation(instance, type = 'unknown') {
  if (!this.animations) {
    this.animations = [];
  }

  if (!instance) {
    console.warn(`Page ${this.id}: Cannot register null/undefined animation (type: ${type})`);
    return false;
  }

  instance._animationType = type;
  this.animations.push(instance);
  return true;
}

/**
 * Clean up all registered animations
 * Uses kill() on timelines and killTweensOf() as fallback
 */
destroyAnimations() {
  if (!this.animations || this.animations.length === 0) {
    this.animation = null;
    return true;
  }

  let cleanedUp = 0;
  let errors = 0;

  this.animations.forEach((animation, index) => {
    const type = animation._animationType || 'unknown';
    
    try {
      // ✅ Method 1: If animation has kill() method, use it
      if (typeof animation.kill === 'function') {
        animation.kill();
        cleanedUp++;
      }
      // ✅ Method 2: If animation has destroy() method, use it
      else if (typeof animation.destroy === 'function') {
        animation.destroy();
        cleanedUp++;
      }
      // ✅ Method 3: Fallback - kill all tweens on the element
      else if (animation.element) {
        // Kill all GSAP tweens affecting this element
        gsap.killTweensOf(animation.element);
        
        // Also disconnect IntersectionObserver if it exists
        if (animation.observer && typeof animation.observer.disconnect === 'function') {
          animation.observer.disconnect();
        }
        
        cleanedUp++;
      }
      // ✅ Method 4: If element is an array/NodeList, kill tweens on all
      else if (Array.isArray(animation.elements)) {
        animation.elements.forEach(el => {
          if (el) gsap.killTweensOf(el);
        });
        cleanedUp++;
      }
      else {
        console.warn(
          `Page ${this.id}: Animation [${index}] (type: ${type}) ` +
          `has no cleanup method and no element reference`
        );
      }
    } catch (error) {
      errors++;
      console.error(
        `Page ${this.id}: Error cleaning up animation [${index}] (type: ${type}):`,
        error
      );
    }
  });

  if (cleanedUp > 0 || errors > 0) {
    console.log(
      `Page ${this.id}: Cleaned up ${cleanedUp}/${this.animations.length} animations` +
      (errors > 0 ? ` (${errors} errors)` : '')
    );
  }

  // Clear references
  this.animations = null;
  this.animation = null;
  
  return true;
}
```

## Key Points from GSAP Documentation

1. `timeline.kill()` stops the timeline and all its child tweens
2. `gsap.killTweensOf(element)` kills all tweens affecting that element, regardless of which timeline created them
3. Both methods remove animations from the rendering queue and allow garbage collection
4. `kill()` is more precise (targets specific instances)
5. `killTweensOf()` is more convenient when you only have element references

## Best Practice for Your Code

1. Modify `Titles` (and other animation classes) to store timeline references
2. Add a `kill()` method to each animation class
3. Use `kill()` in your cleanup loop (most precise)
4. Use `killTweensOf()` as a fallback for animations without `kill()` methods

This ensures all active animations are stopped when the page is destroyed.