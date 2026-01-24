# Page Animation System Documentation

## Overview

The animation system automatically handles page animations based on `data-animation` attributes in your HTML. It uses a single `IntersectionObserver` per page to efficiently trigger animations when elements enter or leave the viewport.

**Key Components:**
- **`AnimationsManager`**: Manages the animation lifecycle, auto-detects animated elements, and coordinates a shared IntersectionObserver
- **`Titles`**: Animation class that fades in title elements when they enter the viewport
- **Page Integration**: `Page.js` calls the manager during create/destroy lifecycle

## How to Set Up a Page Animation

### Step 1: Add `data-animation` Attribute to HTML

Simply add the `data-animation` attribute to any element you want to animate:

```html
<h2 data-animation="title">My Animated Title</h2>
```

The attribute value (`"title"`) corresponds to an animation class registered in the `AnimationsManager` registry.

### Step 2: Register Animation Class (if creating new type)

If you're creating a new animation type (e.g., `"image"`), add it to the registry in `AnimationsManager.js`:

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

## How AnimationsManager Coordinates Animations

### Architecture Overview

`AnimationsManager` uses a factory pattern with a registry to manage animations:

```
Page.js
  └─> AnimationsManager.createPageAnimations(pageElement)
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
2. **Registration**: Instance is added to `AnimationsManager.pageAnimations`
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
2. `Page.createPageAnimations()` calls `AnimationsManager.createPageAnimations(mainElement)`
3. Manager finds 2 elements with `data-animation="title"`
4. Manager groups them: `Map { 'title' => [h2, h2] }`
5. Manager creates 2 `Titles` instances, one per element
6. Manager creates a single IntersectionObserver
7. Observer watches both h2 elements
8. When user scrolls and first h2 enters viewport → `Titles.animateIn()` is called
9. When user navigates away → `AnimationsManager.destroyPageAnimations()` kills both instances

## Benefits of This Architecture

- **Performance**: Single observer instead of one per element
- **Automatic**: No manual setup needed - just add `data-animation` attributes
- **Extensible**: Easy to add new animation types via registry
- **Maintainable**: Clear separation of concerns, pure functions, single responsibility
- **Memory Safe**: Proper cleanup on page destroy prevents memory leaks

