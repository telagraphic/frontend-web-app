# Utility Classes vs Mixins vs Extends: Strategy Guide

## Table of Contents

- [Overview](#overview)
- [The Three Approaches](#the-three-approaches)
  - [1. Utility Classes](#1-utility-classes)
  - [2. Mixins](#2-mixins)
  - [3. @extend](#3-extend)
- [Recommended Hybrid Approach](#recommended-hybrid-approach)
- [Practical Examples for Your Codebase](#practical-examples-for-your-codebase)
  - [Example 1: Container Pattern (Use Mixin)](#example-1-container-pattern-use-mixin)
  - [Example 2: Simple Centering (Use Utility)](#example-2-simple-centering-use-utility)
  - [Example 3: Complex Responsive Container (Use Mixin)](#example-3-complex-responsive-container-use-mixin)
  - [Example 4: Simple Spacing (Use Utility)](#example-4-simple-spacing-use-utility)
- [Decision Tree](#decision-tree)
- [Best Practices](#best-practices)
  - [1. Create Utility-First Mixins](#1-create-utility-first-mixins)
  - [2. Document Your Mixins](#2-document-your-mixins)
  - [3. Keep Utilities for Common Patterns](#3-keep-utilities-for-common-patterns)
  - [4. Component-Specific: Prefer Mixins](#4-component-specific-prefer-mixins)
  - [5. Layout Utilities: Prefer Utilities](#5-layout-utilities-prefer-utilities)
- [Recommended File Structure](#recommended-file-structure)
- [When to Choose What: Quick Reference](#when-to-choose-what-quick-reference)
- [The Verdict](#the-verdict)
- [Example Refactoring](#example-refactoring)
- [Conclusion](#conclusion)

---

## Overview

This document explores when to use utility classes, mixins, and `@extend` in your Sass codebase, providing guidance on choosing the right approach for maintainability and code clarity.

---

## The Three Approaches

### 1. Utility Classes
**Pattern:** Pre-defined classes in HTML
```html
<div class="flex flex-col items-center mx-auto max-w-80">
```

**Pros:**
- ✅ Declarative in markup (you see exactly what's applied)
- ✅ Highly composable and flexible
- ✅ Easy to understand at a glance in HTML
- ✅ Fast iteration without touching CSS
- ✅ Consistent design system application

**Cons:**
- ❌ Can clutter HTML with many classes
- ❌ Less semantic (HTML doesn't describe "what" it is, only "how" it looks)
- ❌ Harder to refactor globally (need to search HTML)
- ❌ Not visible in component CSS files

---

### 2. Mixins
**Pattern:** Reusable logic with `@include`
```scss
.my-component {
  @include flex-center;
  @include container-narrow;
}
```

**Pros:**
- ✅ Keeps HTML clean and semantic
- ✅ Declarative in stylesheets (see intent in CSS)
- ✅ Can accept parameters for flexibility
- ✅ Better encapsulation (component CSS is self-contained)
- ✅ Easier to refactor (change in one place affects all uses)
- ✅ Better for component-specific logic

**Cons:**
- ❌ Less visible (need to check CSS to see what's applied)
- ❌ More abstraction can hide what's actually happening
- ❌ Requires knowledge of available mixins

---

### 3. @extend
**Pattern:** Sharing selectors
```scss
.button-primary {
  @extend .btn-base;
  background-color: blue;
}
```

**Pros:**
- ✅ Very DRY
- ✅ Reduces compiled CSS size (groups selectors)
- ✅ Semantic class names possible

**Cons:**
- ❌ Can create unexpected selector chains
- ❌ Harder to debug (CSS output can be surprising)
- ❌ Less flexible (can't pass parameters)
- ❌ Can cause specificity issues
- ❌ Not recommended by Sass team for many use cases

---

## Recommended Hybrid Approach

For your codebase, I recommend a **hybrid strategy** that leverages the strengths of each approach:

### Use Utility Classes For:
1. **Layout primitives** - `flex`, `grid`, `flex-col`, `items-center`
2. **Simple spacing** - `mx-auto`, `px-4`, `gap-4`
3. **Typography basics** - `text-center`, `font-serif`, `text-2`
4. **Quick one-off adjustments** - `opacity-50`, `hidden`, `rounded-md`
5. **Prototyping and rapid iteration**

### Use Mixins For:
1. **Reusable component patterns** - Complex layout combinations
2. **Responsive behavior** - Media query combinations
3. **Parameterized logic** - Things that need customization
4. **Component-specific logic** - When semantic intent matters
5. **Complex utilities** - Multi-property patterns you want to compose in CSS

### Avoid @extend For:
- Most cases (it's rarely the best choice)
- Only use if you specifically need selector grouping and understand the implications

---

## Practical Examples for Your Codebase

### Example 1: Container Pattern (Use Mixin)

**Current Pattern (Component CSS):**
```scss
.page-article {
  max-inline-size: 100%;
  margin: 0 auto;
  padding: var(--space-4);
  flex: 1;
  display: flex;
  flex-direction: column;

  @media (min-width: 600px) {
    max-inline-size: 80%;
  }
}
```

**Better: Use Mixin**
```scss
// _mixins.scss
@mixin container-narrow {
  max-inline-size: 100%;
  margin-inline: auto;
  padding-inline: var(--space-4);
  flex: 1;
  display: flex;
  flex-direction: column;

  @media (min-width: 600px) {
    max-inline-size: 80%;
  }
}

// _page.scss
.page-article {
  @include container-narrow;
  
  // Component-specific styles here
}
```

**Why Mixin?** This is a reusable pattern across components, has responsive logic, and benefits from being defined once but applied in CSS where component intent is clear.

---

### Example 2: Simple Centering (Use Utility)

**Current Pattern:**
```scss
.hero-header {
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
```

**Better: Use Utility Classes**
```html
<header class="flex flex-col items-center justify-center text-center hero-header">
```

**Why Utility?** This is a simple, common pattern that's clearer to see in HTML and doesn't need complex logic.

---

### Example 3: Complex Responsive Container (Use Mixin)

**Current Pattern (from _manifest.scss):**
```scss
.manifest__header {
  max-width: 70%;
  margin: 0 auto;
  padding: var(--space-6) 0;
  
  @media (max-width: 599px) {
    max-width: 95%;
    width: max-content;
  }

  @media (min-width: 600px) and (max-width: 899px) {
    max-width: 85%;
  }

  @media (min-width: 900px) {
    max-width: 75%;
    min-width: 800px;
  }

  @media (min-width: 1200px) {
    max-width: 70%;
  }
}
```

**Better: Use Parameterized Mixin**
```scss
// _mixins.scss
@mixin responsive-container($mobile: 95%, $sm: 85%, $md: 75%, $lg: 70%, $padding: var(--space-6)) {
  max-width: $lg;
  margin-inline: auto;
  padding-block: $padding;
  
  @media (max-width: 599px) {
    max-width: $mobile;
    width: max-content;
  }

  @media (min-width: 600px) and (max-width: 899px) {
    max-width: $sm;
  }

  @media (min-width: 900px) {
    max-width: $md;
    min-width: 800px;
  }

  @media (min-width: 1200px) {
    max-width: $lg;
  }
}

// _manifest.scss
.manifest__header {
  @include responsive-container;
}

.manifest__table {
  @include responsive-container($mobile: 95%, $sm: 85%, $md: 75%, $lg: 70%);
}
```

**Why Mixin?** Complex responsive logic with parameters is better encapsulated and reusable.

---

### Example 4: Simple Spacing (Use Utility)

**Current Pattern:**
```scss
.footer__content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  margin: 0 auto;
  max-inline-size: 100%;
}
```

**Better: Hybrid Approach**
```html
<footer class="flex flex-col justify-center mx-auto max-is-full footer">
```

Or in CSS if you want to keep HTML semantic:
```scss
.footer {
  @extend .flex, .flex-col, .justify-center, .mx-auto, .max-is-full;
}
```

**Wait - Actually, Better as Mixin:**
```scss
@mixin flex-center-column {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.footer {
  @include flex-center-column;
  margin-inline: auto;
  max-inline-size: 100%;
}
```

**Why?** Common pattern that's semantically meaningful and worth encapsulating.

---

## Decision Tree

```
Is it a simple, single-property utility?
├─ Yes → Use Utility Class (mx-auto, text-center, hidden)
│
└─ No → Does it need parameters or complex logic?
    ├─ Yes → Use Mixin (responsive-container, flex-center-column)
    │
    └─ No → Is it a multi-property pattern?
        ├─ Yes → Use Mixin (better encapsulation)
        │
        └─ No → Use Utility Class (flex, grid, etc.)
```

---

## Best Practices

### 1. **Create Utility-First Mixins**

Create mixins that wrap common utility combinations:

```scss
// _mixins.scss
@mixin flex-center-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

@mixin container-responsive {
  @extend .container-responsive; // Or include utility class properties
}

// But still keep utilities available for one-offs
```

### 2. **Document Your Mixins**

```scss
/// Responsive container mixin with customizable breakpoints
/// @param {String} $mobile - Max width on mobile (< 600px)
/// @param {String} $sm - Max width on small screens (600-899px)
/// @param {String} $md - Max width on medium screens (900-1199px)
/// @param {String} $lg - Max width on large screens (1200px+)
/// @example
///   .my-component {
///     @include responsive-container;
///   }
@mixin responsive-container($mobile: 95%, $sm: 85%, $md: 75%, $lg: 70%) {
  // ...
}
```

### 3. **Keep Utilities for Common Patterns**

Even if you create mixins, keep utilities for:
- Quick prototyping
- One-off adjustments
- When HTML clarity matters more than CSS encapsulation

### 4. **Component-Specific: Prefer Mixins**

For components like `.navigation`, `.footer`, `.page-article`:
- Use mixins to keep HTML semantic
- CSS is self-documenting
- Easier to maintain and refactor

### 5. **Layout Utilities: Prefer Utilities**

For layout helpers:
- Use utilities in HTML for flexibility
- Or extend them in CSS for semantic components

---

## Recommended File Structure

```
styles/
  _utilities.scss       // Utility classes (what we just created)
  _mixins.scss         // Reusable mixins
  _components/         // Component styles (can use mixins + utilities)
    _navigation.scss
    _footer.scss
    _page.scss
```

### _mixins.scss Example

```scss
/* =======================================================================
   Mixins - Reusable Patterns
   ======================================================================= */

/// Flexbox center column pattern
@mixin flex-center-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/// Flexbox row with space between
@mixin flex-between {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}

/// Responsive container with customizable widths
@mixin responsive-container(
  $mobile: 95%,
  $sm: 85%,
  $md: 75%,
  $lg: 70%,
  $padding-block: var(--space-6)
) {
  max-width: $lg;
  margin-inline: auto;
  padding-block: $padding-block;
  
  @media (max-width: 599px) {
    max-width: $mobile;
    width: max-content;
  }

  @media (min-width: 600px) and (max-width: 899px) {
    max-width: $sm;
  }

  @media (min-width: 900px) {
    max-width: $md;
    min-width: 800px;
  }

  @media (min-width: 1200px) {
    max-width: $lg;
  }
}

/// Container with narrow content width
@mixin container-narrow {
  max-inline-size: 100%;
  margin-inline: auto;
  padding-inline: var(--space-4);
  flex: 1;
  display: flex;
  flex-direction: column;

  @media (min-width: 600px) {
    max-inline-size: 80%;
  }
}

/// Container with medium content width (90ch)
@mixin container-medium {
  max-inline-size: 100%;
  margin-inline: auto;

  @media (min-width: 600px) {
    max-inline-size: 90ch;
  }
}

/// Standard transition for color changes
@mixin transition-color {
  transition: color 0.3s ease;
}

/// Smooth transition for transforms
@mixin transition-smooth {
  transition: transform 0.75s cubic-bezier(0.7, 0, 0.3, 1);
}

/// Navigation-style transition
@mixin transition-nav {
  transition: transform 0.5s cubic-bezier(0.7, 0, 0.3, 1);
}

/// Grid with 1 column and 1 row (common pattern)
@mixin grid-1col {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr;
}

/// Full viewport height container
@mixin container-full-height {
  min-height: 100vh;
  min-height: 100dvh;
}
```

---

## When to Choose What: Quick Reference

| Scenario | Approach | Example |
|----------|----------|---------|
| Simple one-off styling | Utility | `class="text-center mx-auto"` |
| Common layout pattern | Mixin | `@include flex-center-column` |
| Responsive containers | Mixin | `@include responsive-container` |
| Component-specific logic | Mixin | Component styles using mixins |
| Prototyping | Utility | Quick iteration in HTML |
| Production components | Mixin | Semantic, maintainable CSS |
| Simple spacing | Utility | `px-4`, `mx-auto` |
| Complex responsive | Mixin | Multi-breakpoint logic |
| Parameterized logic | Mixin | Customizable patterns |

---

## The Verdict

**For your codebase, I recommend:**

1. **Keep utilities for simple, composable patterns** - They're great for quick adjustments and common primitives
2. **Use mixins for complex, reusable patterns** - Especially responsive containers and multi-property patterns
3. **Use mixins in component CSS** - Keeps HTML semantic and CSS self-documenting
4. **Allow both approaches** - Utilities for flexibility, mixins for structure

**The key is consistency:** Pick one approach per pattern and stick with it across your codebase.

---

## Example Refactoring

### Before (Utility-only):
```html
<div class="flex flex-col items-center justify-center mx-auto max-w-80 px-4 py-6">
```

### After (Mixin + Utilities):
```scss
// CSS
.content-wrapper {
  @include flex-center-column;
  @include container-narrow;
  padding-block: var(--space-6);
}
```

```html
<div class="content-wrapper">
```

**Benefits:**
- ✅ HTML is semantic
- ✅ CSS is self-documenting
- ✅ Easier to refactor
- ✅ Still uses design tokens
- ✅ Utilities available for overrides if needed

---

## Conclusion

There's no one-size-fits-all answer. The best approach is:

- **Utilities** for simple, composable primitives
- **Mixins** for complex, reusable patterns with logic
- **Both together** for maximum flexibility and maintainability

The hybrid approach gives you the best of both worlds: semantic components with mixins, and quick flexibility with utilities when needed.
