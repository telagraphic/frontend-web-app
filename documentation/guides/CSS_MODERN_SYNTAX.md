# Modern CSS Syntax Features Guide

## Overview

This guide explores modern CSS features that can enhance your codebase, providing use cases, edge cases, and specific examples from your project where these features can be applied.

---

## Table of Contents

1. [CSS Logical Properties](#css-logical-properties)
2. [Container Queries](#container-queries)
3. [The :has() Selector](#the-has-selector)
4. [The :is() and :where() Selectors](#the-is-and-where-selectors)
5. [CSS Nesting (Native)](#css-nesting-native)
6. [@layer for Cascade Layers](#layer-for-cascade-layers)
7. [aspect-ratio Property](#aspect-ratio-property)
8. [clamp(), min(), max() Functions](#clamp-min-max-functions)
9. [CSS Custom Properties Advanced Usage](#css-custom-properties-advanced-usage)
10. [Modern Viewport Units](#modern-viewport-units)
11. [@supports Feature Queries](#supports-feature-queries)
12. [CSS Grid Advanced Features](#css-grid-advanced-features)
13. [object-fit and object-position](#object-fit-and-object-position)
14. [scroll-behavior and Scroll Snap](#scroll-behavior-and-scroll-snap)
15. [CSS Animations with @property](#css-animations-with-property)

---

## CSS Logical Properties

### What They Are

Logical properties use writing-mode-agnostic directions (inline/block) instead of physical directions (left/right/top/bottom).

### Use Cases

- **Internationalization** - Automatically adapt to RTL languages
- **Writing modes** - Support vertical text layouts
- **Consistency** - Clearer intent in code

### Syntax

```css
/* Physical → Logical */
width → inline-size
height → block-size
margin-left/right → margin-inline
margin-top/bottom → margin-block
padding-left/right → padding-inline
padding-top/bottom → padding-block
top/right/bottom/left → inset (or inset-block/inset-inline)
```

### Examples from Your Codebase

**Current Usage:**
```scss
// styles/_page.scss (already using some!)
.page-article {
  max-inline-size: 100%;  // ✅ Good!
  margin: 0 auto;
  
  @media (min-width: 600px) {
    max-inline-size: 80%;
  }
}
```

**Opportunities for Improvement:**

```scss
// styles/_page.scss - Current
.page-article {
  max-inline-size: 100%;
  margin: 0 auto;
  padding: var(--space-4);  // ⚠️ Could be padding-block/inline
  
  header {
    text-align: left;  // ⚠️ Could use text-align: start
  }
}
```

**Better:**
```scss
.page-article {
  max-inline-size: 100%;
  margin-inline: auto;  // More explicit than margin: 0 auto
  padding-block: var(--space-4);
  padding-inline: var(--space-4);
  
  header {
    text-align: start;  // Logical equivalent of left
  }
}
```

**Edge Cases:**
- Use `start`/`end` for `text-align` instead of `left`/`right`
- `border-inline` and `border-block` for borders
- `border-inline-start` and `border-inline-end` for individual borders

**Browser Support:** Excellent (all modern browsers)

---

## Container Queries

### What They Are

Allow elements to respond to their container's size rather than the viewport size. Perfect for component-level responsive design.

### Use Cases

- **Card components** - Adapt based on container width, not viewport
- **Sidebar layouts** - Components respond to sidebar width
- **Nested components** - Child components adapt to parent container
- **Reusable components** - Same component works in different contexts

### Syntax

```css
/* Define container */
.card-container {
  container-type: inline-size;  /* or size, or normal */
  container-name: card;  /* optional named container */
}

/* Query the container */
@container card (min-width: 400px) {
  .card-title {
    font-size: 1.5rem;
  }
}

/* Or using container() function */
.card-title {
  font-size: clamp(1rem, container(card, 400px), 1.5rem);
}
```

### Examples from Your Codebase

**Perfect Use Case: Manifest Table**

```scss
// styles/_manifest.scss - Current approach uses viewport queries
.manifest__header {
  max-width: 70%;
  margin: 0 auto;
  
  @media (max-width: 599px) {
    max-width: 95%;
  }
  
  @media (min-width: 600px) and (max-width: 899px) {
    max-width: 85%;
  }
}
```

**With Container Queries:**

```scss
.manifest__table-wrapper {
  container-type: inline-size;
  container-name: table-wrapper;
  
  .manifest__header {
    max-width: 95%;  // Default for narrow containers
    
    @container table-wrapper (min-width: 600px) {
      max-width: 85%;
    }
    
    @container table-wrapper (min-width: 900px) {
      max-width: 75%;
    }
    
    @container table-wrapper (min-width: 1200px) {
      max-width: 70%;
    }
  }
}
```

**Benefits:**
- Table adapts to its container, not viewport
- Same table component works in sidebar or full-width
- More reusable and component-oriented

**Edge Cases:**
- `container-type: size` tracks both width and height (performance cost)
- Use `container-type: inline-size` for width-only queries (most common)
- Container queries work with logical properties (`min-inline-size`)

**Browser Support:** Good (Chrome 105+, Safari 16+, Firefox 110+)

---

## The :has() Selector

### What It Is

The "parent selector" - selects an element based on what it contains.

### Use Cases

- **Parent-based styling** - Style parent based on child state
- **Conditional layouts** - Different layouts based on content
- **State management** - React to child element states

### Syntax

```css
/* Select parent that has a child */
.parent:has(.child) { }

/* Select parent that has multiple children */
.card:has(.title, .description) { }

/* Select parent where child is in specific state */
.list:has(li:hover) { }

/* Select parent where child matches condition */
.container:has(> .active) { }
```

### Examples from Your Codebase

**Current Usage (You're Already Using This!):**

```scss
// styles/_home.scss
@media (hover: hover) and (min-width: 992px) {
  body:has([data-follower-collection]:hover)
    .home__nav-section-list-preview-follower-inner {
    opacity: 1;
    transform: scale(1);
  }
}

// styles/_navigation.scss
&__menu:has(.navigation__item:hover) .navigation__item {
  opacity: 1;
  
  @media (min-width: 600px) {
    opacity: 0.55;
  }
}
```

**More Opportunities:**

```scss
// styles/_page.scss - Could improve visited link handling
.page-article {
  // Current approach requires specific class
  a.page-article-link:visited {
    color: var(--color-black-2);
  }
  
  // Could use :has() for more flexible parent styling
  &:has(a:visited) {
    // Style article when it contains visited links
  }
}

// styles/_manifest.scss - Table row highlighting
.manifest__table-row {
  // Highlight entire row when any cell is hovered
  &:has(.manifest__table-cell:hover) {
    background-color: var(--color-white);
    opacity: 0.75;
  }
}
```

**Edge Cases:**
- `:has()` is relatively expensive - use sparingly
- Can't be used in pseudo-elements (`::before`, `::after`)
- Great for reducing JavaScript dependency
- Works with attribute selectors: `:has([data-state="active"])`

**Browser Support:** Excellent (all modern browsers)

---

## The :is() and :where() Selectors

### What They Are

Functional pseudo-classes that group selectors and reduce specificity.

### Use Cases

- **Selector grouping** - Cleaner, more maintainable selectors
- **Reducing specificity** - `:where()` has 0 specificity
- **Vendor prefix management** - Simplify browser prefixes

### Syntax

```css
/* :is() - Groups selectors, maintains specificity */
:is(header, nav, footer) a {
  color: blue;
}
/* Same as: header a, nav a, footer a */

/* :where() - Groups selectors, 0 specificity */
:where(header, nav, footer) a {
  color: blue;
}
```

### Examples from Your Codebase

**Opportunities:**

```scss
// styles/_page.scss - Current approach
.page-article {
  header h1 { }
  header h2 { }
  section h2 { }
  section h3 { }
}

// Better with :is()
.page-article {
  :is(header, section) {
    :is(h1, h2, h3) {
      margin-top: 1.75em;
    }
  }
}

// Even better with :where() to reduce specificity conflicts
.page-article {
  :where(header, section) {
    :where(h1, h2, h3) {
      margin-top: 1.75em;
    }
  }
}
```

**Navigation Link States:**

```scss
// styles/_navigation.scss
// Current: Multiple selectors
.navigation__link:hover,
.navigation__link:focus,
.navigation__link[aria-current] {
  color: var(--theme-color-main);
}

// Better with :is()
.navigation__link:is(:hover, :focus, [aria-current]) {
  color: var(--theme-color-main);
}
```

**Edge Cases:**
- `:is()` maintains the highest specificity in the list
- `:where()` always has 0 specificity - perfect for resets
- Both accept complex selectors: `:is(.card:has(.active), .panel)`
- Use `:where()` for framework overrides that shouldn't conflict

**Browser Support:** Excellent (all modern browsers)

---

## CSS Nesting (Native)

### What It Is

Native CSS nesting (not Sass) - allows nesting selectors directly in CSS.

### Use Cases

- **Reducing redundancy** - Write cleaner, more organized CSS
- **Component-based styling** - Group related styles together
- **Future-proofing** - Move away from preprocessors if desired

### Syntax

```css
/* Native CSS nesting */
.card {
  padding: 1rem;
  
  .card-title {  /* Descendant selector */
    font-size: 1.5rem;
  }
  
  &__element {  /* BEM modifier (needs & symbol) */
    color: blue;
  }
  
  &:hover {  /* Pseudo-class */
    background: gray;
  }
  
  @media (min-width: 600px) {  /* Media queries nest too */
    padding: 2rem;
  }
}
```

### Examples from Your Codebase

**You're using Sass nesting, but could also use native:**

```scss
// styles/_page.scss - Current (Sass)
.page {
  &-content {
    display: flex;
    
    @media (min-width: 600px) {
      padding: var(--space-0);
    }
  }
}

// Native CSS (future-proof)
.page {
  .page-content {
    display: flex;
    
    @media (min-width: 600px) {
      padding: var(--space-0);
    }
  }
}
```

**Note:** Since you're using Sass, your current approach is fine. Native CSS nesting is more for vanilla CSS projects, but good to know for future.

**Edge Cases:**
- Use `&` for concatenation (BEM), pseudo-classes, pseudo-elements
- `@nest` directive for complex nesting scenarios (rarely needed)
- Media queries can nest inside selectors
- Can't nest `@keyframes` or `@import`

**Browser Support:** Good (Chrome 112+, Safari 16.5+, Firefox 117+)

---

## @layer for Cascade Layers

### What It Is

Allows you to explicitly control CSS cascade order without relying on source order or specificity.

### Use Cases

- **Framework integration** - Isolate third-party CSS
- **Component libraries** - Control override precedence
- **Reset/normalize management** - Separate reset, base, components, utilities
- **Theme overrides** - Clear cascade for theming

### Syntax

```css
/* Define layer order */
@layer reset, base, components, utilities;

/* Add styles to layers */
@layer base {
  body {
    font-family: sans-serif;
  }
}

@layer components {
  .button {
    padding: 1rem;
  }
}

@layer utilities {
  .text-center {
    text-align: center;
  }
}
```

### Examples from Your Codebase

**Potential Structure:**

```css
/* styles/styles.scss */
@layer reset, tokens, base, components, utilities, overrides;

@layer reset {
  @forward "./normalize.scss";
}

@layer tokens {
  @forward "./tokens.scss";
}

@layer base {
  @forward "./base.scss";
  @forward "./typography.scss";
}

@layer components {
  @forward "./navigation.scss";
  @forward "./page.scss";
  @forward "./hero.scss";
  @forward "./footer.scss";
}

@layer utilities {
  @forward "./utilities.scss";
}

@layer overrides {
  /* Any last-minute overrides */
  body[data-page="home"] .navigation {
    /* These override utilities layer */
  }
}
```

**Benefits:**
- Clear cascade order regardless of file order
- Easy to override framework styles
- Better organization and mental model

**Edge Cases:**
- Layers declared later in `@layer` statement have higher priority
- Unlayered styles override all layers (be careful!)
- Can import entire files into layers
- Use `!important` carefully - it still works within layers

**Browser Support:** Excellent (all modern browsers)

---

## aspect-ratio Property

### What It Is

Maintains consistent aspect ratio for elements, regardless of content.

### Use Cases

- **Image containers** - Prevent layout shift
- **Card layouts** - Consistent card heights
- **Responsive media** - Videos, embeds
- **Grid layouts** - Uniform grid items

### Syntax

```css
/* Ratio syntax */
aspect-ratio: 16 / 9;
aspect-ratio: 1 / 1;  /* Square */
aspect-ratio: 4 / 3;

/* Single value (width / height = 1) */
aspect-ratio: 1;  /* 1:1 square */

/* Auto */
aspect-ratio: auto;  /* Natural aspect ratio */
```

### Examples from Your Codebase

**Current Usage (You're Using This!):**

```scss
// styles/_home.scss
.home__nav-section-list-preview-item {
  aspect-ratio: 1 / 1.25;  // ✅ Great!
  width: 20em;
  display: none;
  position: absolute;
  overflow: hidden;
}
```

**More Opportunities:**

```scss
// styles/_hero.scss - Hero images
.hero-background__image {
  max-width: 100%;
  height: auto;
  object-fit: cover;
  // ⚠️ Could add aspect-ratio to prevent layout shift
  aspect-ratio: 16 / 9;  // Or whatever ratio your images are
}

// styles/_manifest.scss - Table cells (if you want consistent heights)
.manifest__table-cell {
  padding: var(--space-4);
  // Could ensure consistent cell heights
  // aspect-ratio: auto;  // Let content determine, but maintain on images
}
```

**Edge Cases:**
- Works with `width` or `height` (other dimension calculates automatically)
- If both width and height specified, aspect-ratio is ignored
- Use with `object-fit: cover` for images in containers
- Combine with `min-height` for flexible but constrained layouts

**Browser Support:** Excellent (all modern browsers)

---

## clamp(), min(), max() Functions

### What They Are

Math functions that create responsive values with minimums, maximums, and preferred values.

### Use Cases

- **Fluid typography** - Responsive font sizes
- **Spacing** - Responsive margins/padding
- **Layout constraints** - Min/max widths/heights
- **Viewport-relative sizing** - Combine vw/vh with fixed values

### Syntax

```css
/* clamp(min, preferred, max) */
font-size: clamp(1rem, 2.5vw, 2rem);

/* min(value1, value2, ...) */
width: min(90%, 1200px);

/* max(value1, value2, ...) */
width: max(300px, 50%);
```

### Examples from Your Codebase

**Current Usage (Extensive!):**

```scss
// styles/_typography.scss
:root {
  --font-size--2: clamp(0.7813rem, 0.6406rem + 0.6249vw, 1.3827rem);
  --font-size--1: clamp(0.9375rem, 0.793rem + 0.6421vw, 1.5556rem);
  --font-size-0: clamp(1.125rem, 0.9789rem + 0.6494vw, 1.75rem);
  // ... etc
}
```

**More Opportunities:**

```scss
// styles/_hero.scss - Responsive header sizing
.hero-header__byline-copy {
  font-size: 4vw;
  
  @media (min-width: 600px) {
    font-size: 3.5vw;
  }
  
  @media (min-width: 800px) {
    font-size: 3vw;
  }
  
  @media (min-width: 1200px) {
    font-size: 2vw;
  }
}

// Better with clamp()
.hero-header__byline-copy {
  font-size: clamp(1.5rem, 2vw + 1rem, 3rem);
  // Smoothly scales between breakpoints
}
```

**Container Widths:**

```scss
// styles/_manifest.scss
.manifest__header {
  max-width: 70%;
  
  @media (max-width: 599px) {
    max-width: 95%;
  }
}

// Better with clamp()
.manifest__header {
  max-width: clamp(95%, 70%, 1200px);
  // Or use min() for cleaner syntax
  max-width: min(95%, max(70%, 1200px));
}
```

**Edge Cases:**
- Can nest functions: `clamp(1rem, min(5vw, 2rem), 3rem)`
- Use `calc()` inside clamp if needed: `clamp(1rem, calc(2vw + 1rem), 3rem)`
- Great replacement for multiple media query breakpoints
- Combine with CSS variables for dynamic values

**Browser Support:** Excellent (all modern browsers)

---

## CSS Custom Properties Advanced Usage

### What They Are

CSS variables that can be scoped, inherited, and manipulated.

### Advanced Features

1. **Scoping and Inheritance**
2. **Fallback Values**
3. **JavaScript Integration**
4. **Animation Support** (with `@property`)

### Advanced Syntax

```css
/* Scoped variables */
:root {
  --color-primary: blue;
}

.component {
  --color-primary: red;  /* Overrides for this scope */
}

/* Fallback values */
color: var(--color-primary, blue);
color: var(--color-primary, var(--color-fallback, black));

/* JavaScript manipulation */
element.style.setProperty('--spacing', '2rem');

/* Animation with @property */
@property --progress {
  syntax: '<percentage>';
  initial-value: 0%;
  inherits: false;
}
```

### Examples from Your Codebase

**Current Usage (Good Foundation!):**

```scss
// styles/_tokens.scss
:root {
  --color-white: #ffffff;
  --space-4: 1rem;
  --font-size-0: clamp(...);
}
```

**Advanced Opportunities:**

```scss
// Dynamic theming with scoped variables
body[data-page="home"] {
  --nav-bg: var(--color-white-2);
  --nav-text: var(--theme-color-main);
}

body[data-page="section-1"] {
  --nav-bg: transparent;
  --nav-text: var(--color-black);
}

.navigation {
  background-color: var(--nav-bg, var(--color-white));
  color: var(--nav-text, var(--color-black));
}

// JavaScript-controlled variables (you're already doing this!)
.navigation__toggle {
  --toggle-bar-color: var(--color-white-2);
  
  // JS can override: element.style.setProperty('--toggle-bar-color', 'red')
}

// Fallback chains
.component {
  padding: var(--space-custom, var(--space-4, 1rem));
  // Uses --space-custom if exists, else --space-4, else 1rem
}
```

**With @property for Animations:**

```css
/* Animate custom properties */
@property --scroll-progress {
  syntax: '<number>';
  initial-value: 0;
  inherits: false;
}

.scroll-indicator {
  --scroll-progress: 0;
  width: calc(var(--scroll-progress) * 100%);
  transition: --scroll-progress 0.1s linear;
}
```

**Edge Cases:**
- Variables are case-sensitive
- Can't be used in media queries (yet - coming in CSS 4)
- Invalid variables cause the entire declaration to be ignored (use fallbacks!)
- Great for theming and dynamic styling without JavaScript

**Browser Support:** Excellent (all modern browsers, @property in Chrome 85+)

---

## Modern Viewport Units

### What They Are

Viewport units that account for browser UI (address bar, etc.).

### Units

```css
/* Traditional viewport units */
100vw  /* Viewport width */
100vh  /* Viewport height */

/* Modern viewport units */
100dvw  /* Dynamic viewport width (adjusts for scrollbars) */
100dvh  /* Dynamic viewport height (adjusts for browser UI) */
100svw  /* Small viewport (browser UI visible) */
100svh  /* Small viewport height */
100lvw  /* Large viewport (browser UI hidden) */
100lvh  /* Large viewport height */
```

### Examples from Your Codebase

**Current Usage (You're Using dvh!):**

```scss
// styles/_page.scss
.page-content {
  min-height: 100vh;
  min-height: 100dvh;  // ✅ Excellent! Falls back gracefully
}

// styles/_hero.scss
.hero-header {
  height: 45dvh;  // ✅ Great for mobile browsers
  
  @media (min-width: 800px) {
    height: 50dvh;
  }
}
```

**More Opportunities:**

```scss
// Full-screen containers
.hero-section {
  min-height: 100vh;
  min-height: 100dvh;  // Better on mobile
  width: 100vw;
  width: 100dvw;  // Account for scrollbars
}

// Fixed positioning
.modal {
  position: fixed;
  inset: 0;
  height: 100vh;
  height: 100dvh;  // Better mobile support
}
```

**Edge Cases:**
- `dvh` adjusts as browser UI shows/hides (better UX on mobile)
- `svh` = smallest viewport (browser UI always visible)
- `lvh` = largest viewport (browser UI always hidden)
- Always provide fallback: `height: 100vh; height: 100dvh;`

**Browser Support:** Good (Chrome 108+, Safari 15.4+, Firefox 101+)

---

## @supports Feature Queries

### What It Is

Conditional CSS based on browser feature support.

### Use Cases

- **Progressive enhancement** - Enhanced styles for capable browsers
- **Fallbacks** - Provide alternatives for unsupported features
- **Feature detection** - Test for specific CSS features

### Syntax

```css
/* Basic feature query */
@supports (display: grid) {
  .container {
    display: grid;
  }
}

/* Negation */
@supports not (display: grid) {
  .container {
    display: flex;  /* Fallback */
  }
}

/* Multiple conditions */
@supports (display: grid) and (aspect-ratio: 1) {
  .card {
    display: grid;
    aspect-ratio: 1;
  }
}

/* Test custom properties */
@supports (--css: variables) {
  :root {
    --custom: value;
  }
}
```

### Examples from Your Codebase

**Opportunities:**

```scss
// Progressive enhancement for container queries
.manifest__table-wrapper {
  // Fallback for browsers without container queries
  .manifest__header {
    max-width: 95%;
    
    @media (min-width: 600px) {
      max-width: 85%;
    }
  }
  
  // Enhanced version with container queries
  @supports (container-type: inline-size) {
    container-type: inline-size;
    container-name: table-wrapper;
    
    .manifest__header {
      max-width: 95%;
      
      @container table-wrapper (min-width: 600px) {
        max-width: 85%;
      }
    }
  }
}

// Aspect ratio fallback
.preview-item {
  width: 20em;
  height: 25em;  // Fallback
  
  @supports (aspect-ratio: 1) {
    aspect-ratio: 1 / 1.25;
    height: auto;
  }
}
```

**Edge Cases:**
- Can test for property-value combinations
- Use for graceful degradation
- Great for experimental features
- Can nest `@supports` inside `@media` and vice versa

**Browser Support:** Excellent (all modern browsers)

---

## CSS Grid Advanced Features

### Advanced Features

1. **Subgrid** - Children inherit parent grid
2. **Grid Template Areas** - Named grid areas
3. **Auto-fit and Auto-fill** - Dynamic columns
4. **Minmax() with auto** - Flexible grid tracks

### Examples from Your Codebase

**Current Grid Usage:**

```scss
// styles/_hero.scss
.hero-section {
  display: grid;
  grid-template-rows: 1fr;
  grid-template-columns: 1fr;
}

.hero-background {
  grid-row: 1 / 2;
  grid-column: 1 / 2;
}
```

**Opportunities for Subgrid:**

```scss
// styles/_page-navigation.scss
.page-navigation {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr;
  
  &__section-links {
    grid-column: 1 / 3;
    grid-row: 1 / 2;
    display: grid;
    grid-template-rows: 1fr 1fr;
    
    // With subgrid, children could inherit parent grid
    @supports (grid-template-rows: subgrid) {
      grid-template-rows: subgrid;
      grid-row: 1 / 2;
    }
  }
}
```

**Auto-fit for Responsive Grids:**

```scss
// Responsive card grid (if you add this pattern)
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-4);
  
  // Automatically adjusts number of columns based on space
}
```

**Edge Cases:**
- Subgrid is powerful but browser support is limited (Firefox 71+, Chrome 117+)
- `auto-fit` collapses empty tracks, `auto-fill` keeps them
- `minmax(auto, 1fr)` creates flexible tracks that shrink below content size

**Browser Support:** 
- Basic Grid: Excellent
- Subgrid: Limited (Firefox 71+, Chrome 117+)

---

## object-fit and object-position

### What They Are

Control how replaced elements (images, videos) fit within their containers.

### Use Cases

- **Image containers** - Control image cropping/positioning
- **Responsive images** - Maintain aspect ratio in flexible containers
- **Background-like images** - Images that behave like background images

### Examples from Your Codebase

**Current Usage:**

```scss
// styles/_hero.scss
.hero-background__image {
  max-width: 100%;
  height: auto;
  object-fit: cover;  // ✅ Great!
}

// styles/_navigation.scss
&__background {
  object-fit: cover;  // ✅ Good!
}
```

**More Opportunities:**

```scss
// styles/_home.scss - Preview images
.home__nav-section-list-preview-item-image {
  object-fit: cover;
  width: 100%;
  height: 100%;
  
  // Could add object-position for better cropping
  object-position: center top;  // Focus on top of image
}
```

**Edge Cases:**
- `object-fit: cover` - Fills container, may crop (like background-size: cover)
- `object-fit: contain` - Fits entirely, may leave empty space
- `object-fit: fill` - Stretches to fill (may distort)
- `object-position` works like `background-position` - use percentages or keywords

**Browser Support:** Excellent (all modern browsers)

---

## scroll-behavior and Scroll Snap

### What They Are

Control scrolling behavior and create snap points.

### Use Cases

- **Smooth scrolling** - Animated scroll to anchors
- **Carousels** - Snap to slides
- **Full-page sections** - Snap to each section
- **Horizontal scrolling** - Snap items in horizontal lists

### Syntax

```css
/* Smooth scrolling */
html {
  scroll-behavior: smooth;
}

/* Scroll snap container */
.scroll-container {
  scroll-snap-type: y mandatory;  /* or x, or both */
  overflow-y: scroll;
  height: 100vh;
}

/* Scroll snap items */
.scroll-item {
  scroll-snap-align: start;  /* or center, end */
}
```

### Examples from Your Codebase

**Opportunities:**

```scss
// Smooth scroll to anchors (if you have anchor links)
html {
  scroll-behavior: smooth;
}

// Full-page section snapping (if you add this pattern)
.page-section {
  scroll-snap-align: start;
  scroll-snap-stop: always;  // Always stop at this section
}

.page-container {
  scroll-snap-type: y mandatory;
  height: 100vh;
  overflow-y: scroll;
}

// Horizontal scroll snap for manifest table (mobile)
.manifest__table-wrapper {
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  
  .manifest__table {
    scroll-snap-align: start;
  }
}
```

**Edge Cases:**
- `scroll-snap-type: proximity` - Only snap when close (less aggressive)
- `scroll-snap-stop: always` - Always stop, even during fast scrolling
- Works with `overflow-x` or `overflow-y` scroll containers
- Can combine with JavaScript scroll libraries

**Browser Support:** Excellent (all modern browsers)

---

## CSS Animations with @property

### What It Is

Register custom properties for animation/interpolation.

### Use Cases

- **Animate custom properties** - Smooth transitions of CSS variables
- **Complex animations** - Animate properties that normally can't animate
- **JavaScript-controlled animations** - Smooth updates from JS

### Syntax

```css
@property --angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}

@property --progress {
  syntax: '<percentage>';
  initial-value: 0%;
  inherits: false;
}

.element {
  --angle: 0deg;
  --progress: 0%;
  transform: rotate(var(--angle));
  width: calc(var(--progress) * 100%);
  transition: --angle 1s, --progress 0.5s;
}
```

### Examples from Your Codebase

**Opportunities:**

```scss
// Scroll progress indicator
@property --scroll-progress {
  syntax: '<number>';
  initial-value: 0;
  inherits: false;
}

.scroll-indicator {
  --scroll-progress: 0;
  width: calc(var(--scroll-progress) * 100%);
  transition: --scroll-progress 0.1s linear;
}

// Rotation animation for navigation toggle
@property --toggle-rotation {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}

.navigation__toggle-bar {
  --toggle-rotation: 0deg;
  transform: rotate(var(--toggle-rotation));
  transition: --toggle-rotation 0.5s cubic-bezier(0.7, 0, 0.3, 1);
}

[data-navigation-status="active"] .navigation__toggle-bar:nth-child(1) {
  --toggle-rotation: 45deg;
}
```

**Edge Cases:**
- Must register properties before using them
- Syntax types: `<length>`, `<percentage>`, `<angle>`, `<number>`, `<color>`, etc.
- Without `@property`, custom properties animate as strings (discrete steps)
- Great for JavaScript-controlled animations that need smooth transitions

**Browser Support:** Limited (Chrome 85+, not in Firefox/Safari yet)

---

## Summary: Quick Reference

| Feature | Browser Support | Use Case | Example in Your Code |
|---------|----------------|----------|---------------------|
| Logical Properties | ✅ Excellent | RTL/i18n support | `max-inline-size` |
| Container Queries | ✅ Good | Component-level responsive | Manifest table |
| `:has()` | ✅ Excellent | Parent selectors | Navigation hover states |
| `:is()` / `:where()` | ✅ Excellent | Selector grouping | Page article headings |
| CSS Nesting | ✅ Good | Cleaner CSS | All your Sass files |
| `@layer` | ✅ Excellent | Cascade control | Style organization |
| `aspect-ratio` | ✅ Excellent | Layout stability | Preview items |
| `clamp()` | ✅ Excellent | Fluid typography | All font sizes |
| Custom Properties | ✅ Excellent | Theming/dynamics | Toggle colors |
| Viewport Units (dvh) | ✅ Good | Mobile viewport | Page content height |
| `@supports` | ✅ Excellent | Progressive enhancement | Feature detection |
| Grid Subgrid | ⚠️ Limited | Nested grids | Navigation sections |
| `object-fit` | ✅ Excellent | Image containers | Hero backgrounds |
| Scroll Snap | ✅ Excellent | Smooth scrolling | Section navigation |
| `@property` | ⚠️ Limited | Animated variables | Scroll indicators |

---

## Recommended Next Steps

1. **High Impact, Easy Wins:**
   - Expand logical properties usage (`margin-inline`, `padding-block`)
   - Use `:is()` and `:where()` for selector simplification
   - Add `@layer` for better cascade management

2. **Medium Impact:**
   - Implement container queries for manifest table
   - Use `clamp()` to replace multiple media queries in hero header
   - Add scroll snap for better UX

3. **Future Considerations:**
   - Explore subgrid when browser support improves
   - Use `@property` for JavaScript-controlled animations
   - Consider native CSS nesting as Sass alternative (long-term)

4. **Progressive Enhancement:**
   - Use `@supports` to add enhanced features with fallbacks
   - Provide graceful degradation for newer features

---

## Resources

- [MDN CSS Reference](https://developer.mozilla.org/en-US/docs/Web/CSS)
- [Can I Use](https://caniuse.com/) - Browser support
- [CSS-Tricks](https://css-tricks.com/) - Modern CSS guides
- [Modern CSS Solutions](https://moderncss.dev/) - Practical examples
