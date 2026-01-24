# CSS Modern Features & Best Practices Checklist

## Overview

This checklist provides a comprehensive guide for implementing modern CSS features, selectors, syntax, and patterns that improve performance, flexibility, and maintainability. Use this to audit your codebase and systematically improve your CSS architecture.

---

## Table of Contents

1. [CSS Architecture & Structure](#css-architecture--structure)
2. [CSS Logical Properties](#css-logical-properties)
3. [Modern Selectors](#modern-selectors)
4. [Layout & Responsive Design](#layout--responsive-design)
5. [Typography & Content](#typography--content)
6. [Color & Theming](#color--theming)
7. [Animations & Transitions](#animations--transitions)
8. [Performance Optimizations](#performance-optimizations)
9. [Accessibility](#accessibility)
10. [Browser Compatibility](#browser-compatibility)
11. [Code Quality & Maintainability](#code-quality--maintainability)
12. [Modern CSS Features Checklist](#modern-css-features-checklist)
13. [Implementation Priority](#implementation-priority)
14. [Code Review Checklist](#code-review-checklist)
15. [Tools & Resources](#tools--resources)
16. [Summary](#summary)
17. [Modern CSS Properties Reference](#modern-css-properties-reference)

---

## CSS Architecture & Structure

### Design System Foundation

- [ ] **Design Tokens System**
  - [ ] CSS custom properties for colors
  - [ ] Spacing scale (4px, 8px, 16px, etc.)
  - [ ] Typography scale (fluid or fixed)
  - [ ] Border radius values
  - [ ] Shadow definitions
  - [ ] Z-index scale
  - [ ] Animation durations and easings
  - [ ] Breakpoint values (as tokens, not hardcoded)

- [ ] **File Organization**
  - [ ] Separate files by concern (tokens, base, components, utilities)
  - [ ] Clear naming conventions (BEM, utility-first, or custom)
  - [ ] Logical import order (tokens → base → components → utilities)
  - [ ] Component-specific styles co-located or in dedicated files

- [ ] **Cascade Management**
  - [ ] Use `@layer` for explicit cascade control
  - [ ] Define layer order: reset → tokens → base → components → utilities → overrides
  - [ ] Avoid `!important` (or document exceptions)
  - [ ] Use specificity strategically

### Modularity

- [ ] **Component-Based Architecture**
  - [ ] Styles scoped to components
  - [ ] Reusable component patterns
  - [ ] Clear component boundaries
  - [ ] Minimal component interdependencies

- [ ] **Utility Classes**
  - [ ] Consistent utility class naming
  - [ ] Utility classes for common patterns
  - [ ] Balance between utilities and components
  - [ ] Utility classes use design tokens

- [ ] **Mixins/Functions**
  - [ ] Sass/PostCSS mixins for repeated patterns
  - [ ] Parameterized mixins for flexibility
  - [ ] Clear mixin documentation
  - [ ] Mixins don't duplicate utility classes unnecessarily

---

## CSS Logical Properties

### Spacing

- [ ] **Replace Physical Properties**
  - [ ] `width` → `inline-size` (where appropriate)
  - [ ] `height` → `block-size` (where appropriate)
  - [ ] `margin-left/right` → `margin-inline`
  - [ ] `margin-top/bottom` → `margin-block`
  - [ ] `padding-left/right` → `padding-inline`
  - [ ] `padding-top/bottom` → `padding-block`
  - [ ] `left/right/top/bottom` → `inset` or `inset-inline`/`inset-block`
  - [ ] `border-left/right` → `border-inline`
  - [ ] `border-top/bottom` → `border-block`

### Text & Alignment

- [ ] **Logical Text Alignment**
  - [ ] `text-align: left` → `text-align: start`
  - [ ] `text-align: right` → `text-align: end`
  - [ ] `float: left` → `float: inline-start`
  - [ ] `float: right` → `float: inline-end`

### Positioning

- [ ] **Logical Positioning**
  - [ ] Use `inset` shorthand instead of `top: 0; right: 0; bottom: 0; left: 0`
  - [ ] Use `inset-inline` for horizontal positioning
  - [ ] Use `inset-block` for vertical positioning

### Sizing

- [ ] **Logical Sizing**
  - [ ] `max-width` → `max-inline-size`
  - [ ] `min-width` → `min-inline-size`
  - [ ] `width` → `inline-size` (when logical intent matters)
  - [ ] `height` → `block-size` (when logical intent matters)

**Benefits:** Automatic RTL support, writing-mode compatibility, clearer intent

---

## Modern Selectors

### Functional Pseudo-classes

- [ ] **`:is()` Selector**
  - [ ] Use to group selectors
  - [ ] Simplify complex selector lists
  - [ ] Maintains the highest specificity in the list
  
  **Example:**
  ```html
  <article>
    <h1>Main Title</h1>
    <section>
      <h2>Section Title</h2>
      <h3>Subsection Title</h3>
    </section>
  </article>
  ```
  
  ```css
  /* Without :is() - verbose */
  article h1,
  article h2,
  article h3 {
    margin-top: 1.5em;
    color: var(--color-primary);
  }
  
  /* With :is() - cleaner */
  article :is(h1, h2, h3) {
    margin-top: 1.5em;
    color: var(--color-primary);
  }
  
  /* Can combine with other selectors */
  .page-content :is(header, section) :is(h1, h2, h3) {
    line-height: 1.25;
  }
  ```

- [ ] **`:where()` Selector**
  - [ ] Use for zero-specificity selectors
  - [ ] Perfect for resets and framework overrides
  - [ ] Always has 0 specificity (can be easily overridden)
  
  **Example:**
  ```html
  <header>
    <nav>
      <a href="/">Home</a>
      <a href="/about">About</a>
    </nav>
  </header>
  <footer>
    <a href="/contact">Contact</a>
  </footer>
  ```
  
  ```css
  /* Reset styles with zero specificity */
  :where(header, nav, footer) a {
    text-decoration: none;
    color: inherit;
  }
  
  /* This can be easily overridden by any other rule */
  header a {
    color: var(--color-primary); /* This will win even though reset comes first */
  }
  
  /* Useful for framework resets that shouldn't conflict */
  :where(.button, .btn, [role="button"]) {
    cursor: pointer;
    border: none;
  }
  ```

- [ ] **`:has()` Selector**
  - [ ] Parent selector functionality
  - [ ] Conditional styling based on children
  - [ ] State-based parent styling
  - [ ] Select parent based on child state
  
  **Example:**
  ```html
  <div class="card">
    <h3>Regular Card</h3>
    <p>Some content</p>
  </div>
  
  <div class="card">
    <h3>Featured Card</h3>
    <p>Some content</p>
    <span class="badge">Featured</span>
  </div>
  
  <div class="card">
    <h3>Active Card</h3>
    <p>Some content</p>
    <button class="active">Active</button>
  </div>
  ```
  
  ```css
  /* Style parent card when it contains a badge */
  .card:has(.badge) {
    border: 2px solid var(--color-primary);
    background-color: var(--color-highlight);
  }
  
  /* Style parent when child button is active */
  .card:has(.active) {
    transform: scale(1.05);
  }
  
  /* Style navigation menu when any item is hovered */
  .nav-menu:has(.nav-item:hover) .nav-item:not(:hover) {
    opacity: 0.5;
  }
  
  /* Conditional layout based on content */
  .container:has(.sidebar) {
    display: grid;
    grid-template-columns: 1fr 300px;
  }
  
  /* Style form field when it has an error */
  .form-group:has(.error-message) input {
    border-color: red;
  }
  ```
  
  **Real-world use case from your codebase:**
  ```html
  <body>
    <nav class="navigation" data-follower-collection="">
      <ul class="navigation__menu">
        <li class="navigation__item">Item 1</li>
        <li class="navigation__item">Item 2</li>
      </ul>
    </nav>
  </body>
  ```
  
  ```css
  /* Your existing pattern - style parent when child is hovered */
  body:has([data-follower-collection]:hover) .home__nav-section-list-preview-follower-inner {
    opacity: 1;
    transform: scale(1);
  }
  
  /* Alternative: style menu when item is hovered */
  .navigation__menu:has(.navigation__item:hover) .navigation__item {
    opacity: 0.55;
  }
  
  .navigation__menu:has(.navigation__item:hover) .navigation__item:hover {
    opacity: 1;
  }
  ```

### Attribute Selectors

- [ ] **Modern Attribute Syntax**
  - [ ] `[attr]` - attribute exists
  - [ ] `[attr="value"]` - exact match
  - [ ] `[attr^="value"]` - starts with
  - [ ] `[attr$="value"]` - ends with
  - [ ] `[attr*="value"]` - contains
  - [ ] `[attr~="value"]` - space-separated list
  - [ ] Case-insensitive: `[attr="value" i]`

### Pseudo-elements

- [ ] **Modern Pseudo-elements**
  - [ ] `::marker` for list markers
  - [ ] `::placeholder` for input placeholders
  - [ ] `::selection` for selected text
  - [ ] `::first-letter` and `::first-line`

### Combinators & Relationships

- [ ] **Use Appropriate Combinators**
  - [ ] `>` (direct child)
  - [ ] `+` (adjacent sibling)
  - [ ] `~` (general sibling)
  - [ ] ` ` (descendant) - use sparingly

---

## Layout & Responsive Design

### CSS Grid

- [ ] **Basic Grid Usage**
  - [ ] `display: grid` for two-dimensional layouts
  - [ ] `grid-template-columns` and `grid-template-rows`
  - [ ] `gap` instead of margins for grid spacing
  - [ ] `grid-auto-flow` for automatic placement

- [ ] **Advanced Grid Features**
  - [ ] `minmax()` for flexible tracks
  - [ ] `auto-fit` and `auto-fill` for responsive grids
  - [ ] Named grid areas with `grid-template-areas`
  - [ ] Grid line names for better maintainability
  - [ ] Subgrid (where supported) for nested grids

- [ ] **Grid Best Practices**
  - [ ] Use `fr` units for flexible sizing
  - [ ] Combine with `minmax()` for constraints
  - [ ] Use `grid-column`/`grid-row` for explicit placement
  - [ ] Avoid unnecessary wrapper divs

### Flexbox

- [ ] **Flexbox Usage**
  - [ ] Use for one-dimensional layouts
  - [ ] `flex-direction` for layout direction
  - [ ] `justify-content` for main-axis alignment
  - [ ] `align-items` for cross-axis alignment
  - [ ] `flex-wrap` for wrapping behavior

- [ ] **Flex Properties**
  - [ ] `flex: 1` for flexible sizing
  - [ ] `flex-grow`, `flex-shrink`, `flex-basis` when needed
  - [ ] `gap` for spacing (instead of margins)

### Container Queries

- [ ] **Container Query Implementation**
  - [ ] Define containers with `container-type: inline-size`
  - [ ] Use `@container` queries instead of media queries where appropriate
  - [ ] Named containers with `container-name`
  - [ ] Component-level responsive design

- [ ] **Container Query Use Cases**
  - [ ] Card components
  - [ ] Sidebar components
  - [ ] Nested components
  - [ ] Reusable components in different contexts

### Responsive Design

- [ ] **Mobile-First Approach**
  - [ ] Base styles for mobile
  - [ ] Progressive enhancement with `min-width` media queries
  - [ ] Avoid `max-width` where possible

- [ ] **Breakpoint Strategy**
  - [ ] Consistent breakpoint values
  - [ ] Named breakpoints (variables or mixins)
  - [ ] Breakpoints based on content, not devices

- [ ] **Viewport Units**
  - [ ] `100vw` / `100vh` for full viewport
  - [ ] `100dvw` / `100dvh` for dynamic viewport (mobile-friendly)
  - [ ] `100svw` / `100svh` for small viewport
  - [ ] `100lvw` / `100lvh` for large viewport
  - [ ] Always provide fallback: `height: 100vh; height: 100dvh;`

### Aspect Ratio

- [ ] **Aspect Ratio Property**
  - [ ] Use `aspect-ratio` instead of padding hacks
  - [ ] Maintain aspect ratio for images/videos
  - [ ] Consistent card/proportional layouts
  - [ ] Combine with `object-fit` for images

---

## Typography & Content

### Fluid Typography

- [ ] **Responsive Font Sizing**
  - [ ] Use `clamp()` for fluid typography
  - [ ] Avoid multiple media query font-size changes
  - [ ] Example: `font-size: clamp(1rem, 2.5vw + 1rem, 2rem);`

- [ ] **Typography Scale**
  - [ ] Consistent type scale
  - [ ] Relative units (rem, em) over pixels
  - [ ] Line-height ratios
  - [ ] Letter-spacing adjustments

### Font Features

- [ ] **Modern Font Properties**
  - [ ] `font-variant-numeric` for numbers
  - [ ] `font-variant-ligatures` for ligatures
  - [ ] `font-variation-settings` for variable fonts
  - [ ] `font-display: swap` for web fonts
  - [ ] `unicode-range` for font subsetting

### Text Rendering

- [ ] **Text Quality**
  - [ ] `text-rendering: optimizeLegibility` (when appropriate)
  - [ ] `-webkit-font-smoothing: antialiased`
  - [ ] `font-feature-settings` for OpenType features

### Content Sizing

- [ ] **Content-Based Sizing**
  - [ ] `width: fit-content` for content-based width
  - [ ] `width: max-content` for maximum content width
  - [ ] `width: min-content` for minimum content width
  - [ ] `min()` and `max()` functions for responsive constraints

---

## Color & Theming

### Color Functions

- [ ] **Modern Color Syntax**
  - [ ] `rgb()` and `rgba()` with space-separated syntax
  - [ ] `hsl()` and `hsla()` for intuitive colors
  - [ ] `lab()` and `lch()` for perceptual uniformity
  - [ ] `oklab()` and `oklch()` for better gradients

- [ ] **Color Manipulation**
  - [ ] `color-mix()` for mixing colors
  - [ ] `relative-color-syntax` (e.g., `rgb(from var(--primary) r g b / 0.5)`)
  - [ ] Opacity with `/` syntax: `rgb(255 0 0 / 0.5)`

### CSS Custom Properties for Theming

- [ ] **Theming Strategy**
  - [ ] Color tokens as custom properties
  - [ ] Semantic color names (primary, secondary, surface)
  - [ ] Scoped theming with custom properties
  - [ ] Fallback values in `var()`

- [ ] **Theme Switching**
  - [ ] Dark mode implementation
  - [ ] Multiple theme support
  - [ ] `prefers-color-scheme` media query
  - [ ] Theme persistence

### Color Contrast

- [ ] **Accessibility**
  - [ ] WCAG AA contrast ratios (4.5:1 for text)
  - [ ] WCAG AAA where possible (7:1 for text)
  - [ ] Test color combinations
  - [ ] Provide alternatives for low contrast

---

## Animations & Transitions

### Performance

- [ ] **Animatable Properties**
  - [ ] Animate `transform` and `opacity` (GPU-accelerated)
  - [ ] Avoid animating `width`, `height`, `top`, `left`
  - [ ] Use `will-change` sparingly
  - [ ] Remove `will-change` after animation

- [ ] **Transition Best Practices**
  - [ ] Explicit property lists (avoid `all`)
  - [ ] Appropriate duration (usually 200-300ms)
  - [ ] Appropriate easing functions
  - [ ] `prefers-reduced-motion` media query support

### Advanced Animations

- [ ] **Keyframe Animations**
  - [ ] `@keyframes` for complex animations
  - [ ] Use `transform` in keyframes
  - [ ] Named keyframe animations
  - [ ] Animation composition

- [ ] **Modern Animation Features**
  - [ ] `@property` for animating custom properties
  - [ ] `animation-timeline` for scroll-based animations
  - [ ] `animation-range` for scroll-linked animations
  - [ ] `@starting-style` for entry animations

### Easing Functions

- [ ] **Modern Easing**
  - [ ] Use cubic-bezier for custom easing
  - [ ] CSS easing functions (`ease-in-out`, etc.)
  - [ ] Consider `ease()`, `linear()`, `cubic-bezier()` functions
  - [ ] Match easing to interaction type

---

## Performance Optimizations

### CSS Delivery

- [ ] **Critical CSS**
  - [ ] Extract above-the-fold CSS
  - [ ] Inline critical CSS
  - [ ] Defer non-critical CSS
  - [ ] Use `rel="preload"` for critical CSS

- [ ] **CSS Loading**
  - [ ] Minimize CSS file size
  - [ ] Remove unused CSS (purge/tree-shake)
  - [ ] Use `media` attribute for conditional loading
  - [ ] Avoid `@import` (use `<link>` instead)

### Selector Performance

- [ ] **Efficient Selectors**
  - [ ] Avoid overly complex selectors
  - [ ] Avoid universal selector (`*`) in key selectors
  - [ ] Use ID and class selectors (fastest)
  - [ ] Avoid deep nesting (max 3-4 levels)

- [ ] **Selector Specificity**
  - [ ] Keep specificity low
  - [ ] Use `:where()` to reduce specificity
  - [ ] Avoid unnecessary ID selectors
  - [ ] Use classes instead of attribute selectors when possible

### Rendering Optimizations

- [ ] **Layout & Paint**
  - [ ] Minimize layout thrashing
  - [ ] Use `contain` property for isolation
  - [ ] Use `content-visibility: auto` for long lists
  - [ ] Use `transform` instead of position changes

- [ ] **GPU Acceleration**
  - [ ] Use `transform: translateZ(0)` when needed
  - [ ] Use `will-change` strategically (remove after use)
  - [ ] Prefer transforms over position changes

---

## Accessibility

### Focus Management

- [ ] **Focus Styles**
  - [ ] Visible focus indicators
  - [ ] `:focus-visible` for keyboard focus
  - [ ] `:focus-within` for container focus states
  - [ ] High contrast focus styles

- [ ] **Skip Links**
  - [ ] Skip to main content link
  - [ ] Visually hidden until focused
  - [ ] `.sr-only` utility class

### Reduced Motion

- [ ] **Motion Preferences**
  - [ ] Respect `prefers-reduced-motion`
  - [ ] Disable animations for reduced motion
  - [ ] Provide static alternatives

### Screen Reader Support

- [ ] **ARIA Integration**
  - [ ] `aria-hidden` for decorative elements
  - [ ] `aria-label` for icon buttons
  - [ ] Semantic HTML over ARIA when possible

### Visual Accessibility

- [ ] **Visual Clarity**
  - [ ] Sufficient color contrast
  - [ ] Don't rely solely on color for meaning
  - [ ] Text alternatives for icons
  - [ ] Touch target sizes (min 44x44px)

---

## Browser Compatibility

### Feature Detection

- [ ] **@supports Queries**
  - [ ] Progressive enhancement with `@supports`
  - [ ] Provide fallbacks for unsupported features
  - [ ] Test feature support before using
  - [ ] Example: `@supports (display: grid) { ... }`

### Vendor Prefixes

- [ ] **Prefix Strategy**
  - [ ] Use autoprefixer in build process
  - [ ] Avoid manual vendor prefixes
  - [ ] Test in target browsers
  - [ ] Keep browser support matrix updated

### Polyfills

- [ ] **Modern Feature Support**
  - [ ] Identify required polyfills
  - [ ] Test fallbacks
  - [ ] Document browser support
  - [ ] Consider graceful degradation

---

## Code Quality & Maintainability

### CSS Methodology

- [ ] **Consistent Naming**
  - [ ] BEM, utility-first, or consistent custom approach
  - [ ] Meaningful class names
  - [ ] Avoid presentational names (`.red-text` → `.text-error`)
  - [ ] Consistent naming convention across codebase

### Documentation

- [ ] **Code Comments**
  - [ ] Comment complex logic
  - [ ] Document why, not what
  - [ ] Section headers for file organization
  - [ ] TODO comments for future improvements

- [ ] **Style Guide**
  - [ ] Component documentation
  - [ ] Usage examples
  - [ ] Design token reference
  - [ ] Pattern library/documentation site

### Maintainability

- [ ] **DRY Principles**
  - [ ] Extract repeated patterns
  - [ ] Use mixins for common patterns
  - [ ] Utility classes for repeated styles
  - [ ] Avoid duplicate code

- [ ] **Modularity**
  - [ ] Single responsibility per rule
  - [ ] Loose coupling between components
  - [ ] Easy to modify without side effects
  - [ ] Clear dependencies

### Code Organization

- [ ] **File Structure**
  - [ ] Logical file organization
  - [ ] Consistent import order
  - [ ] Clear separation of concerns
  - [ ] Easy to locate styles

- [ ] **Variable Usage**
  - [ ] Consistent custom property naming
  - [ ] Semantic variable names
  - [ ] Variables for magic numbers
  - [ ] Document complex calculations

---

## Modern CSS Features Checklist

### Layout Features

- [ ] CSS Grid
- [ ] Flexbox
- [ ] Container Queries
- [ ] Subgrid (where supported)
- [ ] `aspect-ratio`
- [ ] `min()`, `max()`, `clamp()`
- [ ] `fit-content`, `max-content`, `min-content`

### Selectors

- [ ] `:is()` and `:where()`
- [ ] `:has()` parent selector
- [ ] `:focus-visible`
- [ ] `:focus-within`
- [ ] Attribute selectors (modern syntax)
- [ ] Case-insensitive attribute selectors

### Typography

- [ ] `clamp()` for fluid typography
- [ ] Variable fonts with `font-variation-settings`
- [ ] `font-display: swap`
- [ ] Modern font formats (woff2)
- [ ] `text-wrap: balance` (where supported)

### Color

- [ ] Modern color syntax (`rgb(255 0 0 / 0.5)`)
- [ ] `color-mix()` for color blending
- [ ] CSS custom properties for theming
- [ ] `prefers-color-scheme` support

### Animations

- [ ] CSS transitions (transform, opacity)
- [ ] `@keyframes` animations
- [ ] `@property` for animating custom properties
- [ ] `prefers-reduced-motion` support
- [ ] `animation-timeline` (where supported)

### Performance

- [ ] Critical CSS extraction
- [ ] Unused CSS removal
- [ ] `contain` property
- [ ] `content-visibility: auto`
- [ ] Efficient selectors

### Modern Syntax

- [ ] CSS logical properties
- [ ] CSS nesting (native or Sass)
- [ ] `@layer` for cascade control
- [ ] `@supports` feature queries
- [ ] Modern viewport units (`dvh`, `svh`, `lvh`)

---

## Implementation Priority

### Phase 1: Foundation (High Impact, Easy Wins)

1. ✅ Implement design tokens system
2. ✅ Use logical properties for spacing
3. ✅ Implement `clamp()` for fluid typography
4. ✅ Use `:is()` and `:where()` for selector simplification
5. ✅ Add `prefers-reduced-motion` support

### Phase 2: Modern Features (Medium Impact)

1. ✅ Implement container queries where applicable
2. ✅ Expand `:has()` usage
3. ✅ Add `@layer` for cascade management
4. ✅ Implement modern color syntax
5. ✅ Use `aspect-ratio` instead of padding hacks

### Phase 3: Optimization (Performance)

1. ✅ Extract critical CSS
2. ✅ Remove unused CSS
3. ✅ Optimize selectors
4. ✅ Use `contain` and `content-visibility`
5. ✅ Implement CSS loading strategies

### Phase 4: Advanced Features (Cutting Edge)

1. ✅ Explore subgrid where supported
2. ✅ Use `@property` for advanced animations
3. ✅ Implement scroll-based animations
4. ✅ Explore new color spaces (oklch, lab)
5. ✅ Test experimental features with `@supports`

---

## Code Review Checklist

Before merging CSS changes, verify:

- [ ] Uses design tokens (no hardcoded values)
- [ ] Follows naming conventions
- [ ] No unnecessary `!important`
- [ ] Mobile-first responsive approach
- [ ] Accessibility considerations (focus, contrast)
- [ ] Performance considerations (selectors, animations)
- [ ] Browser compatibility checked
- [ ] `prefers-reduced-motion` handled
- [ ] Logical properties where appropriate
- [ ] No duplicate code (DRY)
- [ ] Comments for complex logic
- [ ] Tested in target browsers

---

## Tools & Resources

### Linting & Formatting
- [ ] Stylelint configuration
- [ ] Prettier or similar formatter
- [ ] CSS validation
- [ ] Accessibility linting

### Build Tools
- [ ] Autoprefixer
- [ ] PostCSS plugins
- [ ] CSS minification
- [ ] Critical CSS extraction

### Testing
- [ ] Visual regression testing
- [ ] Browser testing matrix
- [ ] Performance testing
- [ ] Accessibility testing

### Documentation
- [ ] Style guide / component library
- [ ] Design token documentation
- [ ] Pattern documentation
- [ ] Usage examples

---

## Summary

This checklist provides a comprehensive guide for implementing modern CSS features and best practices. Use it to:

1. **Audit your current codebase** - Check off what you have
2. **Plan improvements** - Prioritize missing items
3. **Track progress** - Mark items as you implement them
4. **Code reviews** - Use sections as review criteria
5. **Onboarding** - Guide new developers through standards

**Key Principles:**
- **Performance First** - Optimize for speed and efficiency
- **Accessibility Always** - Make CSS work for everyone
- **Maintainability** - Write code that's easy to understand and modify
- **Progressive Enhancement** - Use modern features with fallbacks
- **Consistency** - Follow established patterns and conventions

---

## Modern CSS Properties Reference

This section provides a quick reference of modern CSS properties, their use cases, and practical examples.

### Layout Properties

#### `aspect-ratio`
**Use Case:** Maintain consistent aspect ratios without padding hacks or JavaScript.

**Problem Solved:** Previously required padding-top percentage tricks or JavaScript to maintain image/video/card proportions.

```css
/* Maintain 16:9 video aspect ratio */
.video-container {
  aspect-ratio: 16 / 9;
}

/* Square images in gallery */
.gallery-image {
  aspect-ratio: 1 / 1;
  object-fit: cover;
}

/* Card with consistent proportions */
.card {
  aspect-ratio: 3 / 4;
}
```

---

#### `contain`
**Use Case:** Isolate element rendering for performance optimization.

**Problem Solved:** Prevents layout/paint work from affecting parent/child elements, improving performance for complex components.

```css
/* Isolate widget rendering from rest of page */
.widget {
  contain: layout style paint;
}

/* Strict containment for isolated components */
.isolated-component {
  contain: strict; /* Same as: layout style paint size */
}

/* Size containment for dynamic content */
.dynamic-list {
  contain: layout size;
}
```

**Benefits:** Improves rendering performance, especially for components with frequent updates.

---

#### `content-visibility: auto`
**Use Case:** Skip rendering off-screen content to improve initial page load.

**Problem Solved:** Long lists or large content blocks render slowly even when not visible.

```css
/* Only render visible list items */
.long-list-item {
  content-visibility: auto;
  contain-intrinsic-size: 200px;
}

/* Skip rendering below-the-fold content */
.article-section {
  content-visibility: auto;
  contain-intrinsic-size: auto 500px;
}
```

**Benefits:** Dramatically improves initial render time for long pages.

---

#### `gap` (Grid & Flexbox)
**Use Case:** Consistent spacing between grid/flex items without margin hacks.

**Problem Solved:** Previously required negative margins or last-child selectors to remove spacing.

```css
/* Grid with consistent spacing */
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem; /* No need for margins on children */
}

/* Flexbox with gap */
.flex-container {
  display: flex;
  gap: var(--space-4);
}

/* Different row/column gaps */
.grid {
  gap: 1rem 2rem; /* row-gap column-gap */
}
```

---

### Text & Typography Properties

#### `text-wrap: balance`
**Use Case:** Balance text across lines for better readability.

**Problem Solved:** Short lines at the end of headings/paragraphs look awkward.

```css
/* Balance heading text across lines */
h1, h2, h3 {
  text-wrap: balance;
}

/* Balance long titles */
.card-title {
  text-wrap: balance;
}
```

**Browser Support:** Chrome 114+, Safari 17+, Firefox (in development)

---

#### `font-display: swap`
**Use Case:** Show fallback font immediately while custom font loads.

**Problem Solved:** Flash of invisible text (FOIT) during font loading.

```css
@font-face {
  font-family: 'CustomFont';
  src: url('font.woff2');
  font-display: swap; /* Show fallback immediately */
}
```

**Options:**
- `auto` - Browser default (usually block)
- `block` - Brief invisible text period
- `swap` - Show fallback immediately
- `fallback` - Very brief block, then swap
- `optional` - Only use if already loaded

---

#### `font-variation-settings`
**Use Case:** Control variable font axes (weight, width, slant, etc.).

**Problem Solved:** Multiple font files needed for different weights/styles. Variable fonts provide smooth interpolation.

```css
/* Adjust variable font weight smoothly */
.heading {
  font-family: 'VariableFont';
  font-variation-settings: 'wght' 700;
}

/* Animate font weight smoothly */
@keyframes weight-change {
  to {
    font-variation-settings: 'wght' 900;
  }
}

.animated-text {
  animation: weight-change 2s;
}
```

---

### Color Properties

#### Modern Color Syntax
**Use Case:** Cleaner, more intuitive color definitions with optional alpha.

**Problem Solved:** Verbose `rgba()` syntax and separate opacity property.

```css
/* Old way */
.old {
  background-color: rgba(255, 0, 0, 0.5);
}

/* Modern way - space-separated with / for alpha */
.modern {
  background-color: rgb(255 0 0 / 0.5);
  color: hsl(210 100% 50% / 0.8);
}
```

---

#### `color-mix()`
**Use Case:** Blend colors in CSS without JavaScript or preprocessors.

**Problem Solved:** Need to calculate color blends manually or with tools.

```css
/* Mix two colors */
.mixed {
  background-color: color-mix(in srgb, blue 50%, red);
}

/* Mix with transparency */
.semi-transparent {
  background-color: color-mix(
    in srgb,
    var(--primary-color) 60%,
    transparent
  );
}

/* Create lighter/darker variants */
.lighter {
  color: color-mix(in srgb, var(--text-color) 80%, white);
}
```

**Browser Support:** Chrome 111+, Safari 16.2+, Firefox 113+

---

### Animation Properties

#### `@property`
**Use Case:** Animate CSS custom properties smoothly.

**Problem Solved:** Custom properties can't be animated without this declaration.

```css
/* Register custom property for animation */
@property --progress {
  syntax: '<percentage>';
  initial-value: 0%;
  inherits: false;
}

/* Now it can animate smoothly */
.progress-bar {
  --progress: 0%;
  width: var(--progress);
  transition: --progress 0.3s ease;
}

/* JavaScript can update and it animates */
element.style.setProperty('--progress', '100%');
```

**Supported Syntax Types:**
- `<length>`, `<percentage>`, `<number>`
- `<angle>`, `<color>`, `<custom-ident>`
- And more

---

#### `animation-timeline`
**Use Case:** Link animations to scroll position or other timelines.

**Problem Solved:** Scroll-based animations previously required JavaScript.

```css
/* Animate as user scrolls */
@keyframes fade-in {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.scroll-animated {
  animation: fade-in linear;
  animation-timeline: scroll();
  animation-range: entry 0% entry 100%;
}
```

**Browser Support:** Chrome 115+, Safari 17+, Firefox (in development)

---

#### `@starting-style`
**Use Case:** Animate elements when they first appear (entry animations).

**Problem Solved:** Transitions only work on state changes, not initial render.

```css
/* Animate when element is inserted */
.fade-in {
  opacity: 1;
  transition: opacity 0.5s;
}

@starting-style {
  .fade-in {
    opacity: 0;
  }
}
```

**Browser Support:** Chrome 117+, Safari (in development)

---

### Container & Responsive Properties

#### `container-type` and `@container`
**Use Case:** Responsive design based on container size, not viewport.

**Problem Solved:** Components need different layouts in different containers (sidebar vs full-width).

```css
/* Define container */
.card-container {
  container-type: inline-size;
  container-name: card;
}

/* Query container, not viewport */
.card-title {
  font-size: 1rem;
}

@container card (min-width: 400px) {
  .card-title {
    font-size: 1.5rem;
  }
}

/* Component adapts to its container */
@container card (min-width: 600px) {
  .card {
    display: grid;
    grid-template-columns: 1fr 2fr;
  }
}
```

---

### Selector Properties

#### `:has()` (already covered, but highlighting use cases)

**Problem Solved:** Can't style parent based on child state (previously required JavaScript).

```css
/* Style form when it has errors */
.form:has(.error) {
  border-color: red;
}

/* Change layout based on content */
.container:has(.sidebar) {
  grid-template-columns: 1fr 300px;
}

/* Highlight row when cell is focused */
tr:has(td:focus) {
  background-color: yellow;
}
```

---

### Layout Utilities

#### `inset`
**Use Case:** Shorthand for top, right, bottom, left positioning.

**Problem Solved:** Verbose positioning declarations.

```css
/* Full overlay positioning */
.overlay {
  inset: 0; /* Same as: top: 0; right: 0; bottom: 0; left: 0; */
}

/* Logical positioning */
.modal {
  inset-block: 1rem; /* top and bottom */
  inset-inline: 2rem; /* left and right */
}
```

---

#### `min()`, `max()`, `clamp()`
**Use Case:** Responsive values with constraints without media queries.

**Problem Solved:** Multiple media queries for font sizes, widths, etc.

```css
/* Responsive width with constraints */
.container {
  width: min(90%, 1200px); /* Never wider than 1200px */
  width: max(300px, 50%);  /* Never narrower than 300px */
}

/* Fluid typography */
.heading {
  font-size: clamp(1.5rem, 5vw, 3rem);
  /* Min: 1.5rem, Preferred: 5vw, Max: 3rem */
}

/* Responsive padding */
.card {
  padding: clamp(1rem, 4vw, 2rem);
}
```

---

### Scroll Properties

#### `scroll-behavior: smooth`
**Use Case:** Smooth scrolling to anchors without JavaScript.

**Problem Solved:** Abrupt jumps when clicking anchor links.

```css
html {
  scroll-behavior: smooth;
}

/* Smooth scroll to sections */
a[href^="#"] {
  scroll-behavior: smooth;
}
```

---

#### `scroll-snap-type` and `scroll-snap-align`
**Use Case:** Create snap points for scrolling (carousels, sections, etc.).

**Problem Solved:** Imprecise scrolling, need for custom scroll libraries.

```css
/* Snap to sections vertically */
.scroll-container {
  scroll-snap-type: y mandatory;
  height: 100vh;
  overflow-y: scroll;
}

.section {
  scroll-snap-align: start;
  height: 100vh;
}

/* Horizontal carousel */
.carousel {
  scroll-snap-type: x mandatory;
  overflow-x: auto;
  display: flex;
}

.slide {
  scroll-snap-align: start;
  flex: 0 0 100%;
}
```

---

### Modern Viewport Units

#### `dvh`, `svh`, `lvh`, `dvw`, `svw`, `lvw`
**Use Case:** Viewport units that account for browser UI (address bar, etc.).

**Problem Solved:** `100vh` doesn't work correctly on mobile browsers.

```css
/* Full viewport height accounting for browser UI */
.fullscreen {
  height: 100vh;   /* Fallback */
  height: 100dvh;  /* Dynamic viewport height */
}

/* Large viewport (browser UI hidden) */
.hero {
  min-height: 100lvh;
}

/* Small viewport (browser UI visible) */
.header {
  height: 10svh;
}
```

**Units Explained:**
- `dvh` - Dynamic viewport (adjusts as UI shows/hides)
- `svh` - Small viewport (UI always visible)
- `lvh` - Large viewport (UI always hidden)

---

### Object Positioning

#### `object-fit` and `object-position`
**Use Case:** Control how images/videos fit in containers (like background-size for images).

**Problem Solved:** Images distorting or not filling containers properly.

```css
/* Cover entire container (may crop) */
.image {
  width: 100%;
  height: 300px;
  object-fit: cover;
  object-position: center top;
}

/* Fit entire image (may show empty space) */
.thumbnail {
  object-fit: contain;
}

/* Fill container (may distort) */
.fill {
  object-fit: fill;
}

/* Focus on specific area */
.portrait {
  object-fit: cover;
  object-position: 50% 20%; /* Focus on face */
}
```

---

### Display Properties

#### `display: contents`
**Use Case:** Make element "transparent" to layout (children behave as if parent doesn't exist).

**Problem Solved:** Unnecessary wrapper divs affecting layout.

```html
<!-- Without display: contents, wrapper affects grid -->
<div class="wrapper">
  <div class="grid-item">Item 1</div>
  <div class="grid-item">Item 2</div>
</div>
```

```css
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}

.wrapper {
  display: contents; /* Children participate in grid directly */
}
```

---

### Isolation Properties

#### `isolation: isolate`
**Use Case:** Create new stacking context for z-index management.

**Problem Solved:** Z-index conflicts between components.

```css
/* Isolate component's z-index from rest of page */
.modal {
  isolation: isolate;
  z-index: 1; /* Only relative to modal's children */
}

/* Combined with contain for performance */
.widget {
  contain: layout style paint;
  isolation: isolate;
}
```

---

### Grid Advanced Properties

#### `subgrid`
**Use Case:** Children inherit parent grid layout.

**Problem Solved:** Complex nested grid alignment requires manual coordination.

```css
.parent-grid {
  display: grid;
  grid-template-columns: 200px 1fr 200px;
}

.child-grid {
  display: grid;
  grid-template-columns: subgrid; /* Inherits parent columns */
  grid-column: 1 / -1; /* Span all columns */
}
```

**Browser Support:** Firefox 71+, Chrome 117+, Safari (in development)

---

#### `grid-template-areas`
**Use Case:** Visual, named grid layout.

**Problem Solved:** Complex grid layouts hard to read/maintain.

```css
.page {
  display: grid;
  grid-template-areas:
    "header header header"
    "sidebar main aside"
    "footer footer footer";
  grid-template-columns: 200px 1fr 150px;
}

.header { grid-area: header; }
.sidebar { grid-area: sidebar; }
.main { grid-area: main; }
.aside { grid-area: aside; }
.footer { grid-area: footer; }
```

---

## Quick Reference Table

| Property | Use Case | Browser Support |
|----------|----------|----------------|
| `aspect-ratio` | Maintain proportions | Excellent |
| `contain` | Performance isolation | Excellent |
| `content-visibility` | Skip off-screen rendering | Chrome 85+, Safari 17+ |
| `gap` | Grid/Flex spacing | Excellent |
| `text-wrap: balance` | Balanced text lines | Chrome 114+, Safari 17+ |
| `font-display: swap` | Font loading strategy | Excellent |
| `color-mix()` | Color blending | Chrome 111+, Safari 16.2+ |
| `@property` | Animate custom properties | Chrome 85+, not in Firefox/Safari |
| `animation-timeline` | Scroll-based animation | Chrome 115+, Safari 17+ |
| `@starting-style` | Entry animations | Chrome 117+ |
| Container Queries | Container-based responsive | Chrome 105+, Safari 16+ |
| `:has()` | Parent selector | Excellent |
| `inset` | Positioning shorthand | Excellent |
| `clamp()` | Responsive constraints | Excellent |
| `dvh`, `svh`, `lvh` | Mobile viewport units | Chrome 108+, Safari 15.4+ |
| `object-fit` | Image/video fitting | Excellent |
| `display: contents` | Transparent wrapper | Excellent |
| `scroll-snap-*` | Scroll snapping | Excellent |
| `subgrid` | Nested grid alignment | Firefox 71+, Chrome 117+ |

---

## Version History

- **v1.0** - Initial checklist based on modern CSS best practices
- **v1.1** - Added Modern CSS Properties Reference section

---

*Last Updated: 2024*
