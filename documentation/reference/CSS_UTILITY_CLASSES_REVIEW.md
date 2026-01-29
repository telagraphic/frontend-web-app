# Utility Classes Review & Design System Approach

## Table of Contents

- [Executive Summary](#executive-summary)
- [1. CSS Duplicate Patterns for Utility Classes](#1-css-duplicate-patterns-for-utility-classes)
  - [1.1 Container & Width Utilities](#11-container--width-utilities)
  - [1.2 Layout Utilities](#12-layout-utilities)
  - [1.3 Spacing Utilities](#13-spacing-utilities)
  - [1.4 Typography Utilities](#14-typography-utilities)
  - [1.5 Transition Utilities](#15-transition-utilities)
  - [1.6 Responsive Width Patterns](#16-responsive-width-patterns)
  - [1.7 Overflow & Box-Sizing](#17-overflow--box-sizing)
- [2. Manifest Table Code Analysis](#2-manifest-table-code-analysis)
  - [2.1 Current Structure](#21-current-structure)
  - [2.2 Recommended Refactoring](#22-recommended-refactoring)
  - [2.3 Specific Manifest Table Opportunities](#23-specific-manifest-table-opportunities)
- [3. Container Code Analysis](#3-container-code-analysis)
  - [3.1 Page vs Home Container Patterns](#31-page-vs-home-container-patterns)
  - [3.2 Recommended Container Utilities](#32-recommended-container-utilities)
  - [3.3 Article/Content Wrapper Patterns](#33-articlecontent-wrapper-patterns)
- [4. Itemized List of Utility Class Opportunities](#4-itemized-list-of-utility-class-opportunities)
- [5. Developing a Utility Library for SPA Web Apps](#5-developing-a-utility-library-for-spa-web-apps)
  - [5.1 Core Principles](#51-core-principles)
  - [5.2 Utility Categories](#52-utility-categories)
  - [5.3 Implementation Strategies](#53-implementation-strategies)
  - [5.4 Naming Conventions](#54-naming-conventions)
  - [5.5 File Organization](#55-file-organization)
  - [5.6 Considerations from Popular Libraries](#56-considerations-from-popular-libraries)
  - [5.7 Best Practices for SPA Context](#57-best-practices-for-spa-context)
  - [5.8 Migration Strategy](#58-migration-strategy)
- [6. Recommended Next Steps](#6-recommended-next-steps)
- [7. Example Implementation](#7-example-implementation)
- [Conclusion](#conclusion)

---

## Executive Summary

This document identifies opportunities for utility classes to DRY (Don't Repeat Yourself) up the codebase and formalize a design system approach. The review covers CSS patterns, container implementations, manifest table code, and provides an overview of developing a utility library for SPA web applications.

---

## 1. CSS Duplicate Patterns for Utility Classes

### 1.1 Container & Width Utilities

**Pattern Found:**
- `max-width` with responsive breakpoints appears repeatedly across `_page.scss`, `_manifest.scss`, `_footer.scss`, and `_footnotes.scss`
- `margin: 0 auto` used extensively for centering containers
- `max-inline-size` used alongside `max-width` inconsistently

**Current Instances:**
- `.page-article`: `max-inline-size: 100%` (mobile), `80%` (600px+)
- `.manifest__header`: `max-width: 70%` (1200px+), `75%` (900px+), `85%` (600-899px), `95%` (mobile)
- `.manifest__table`: `max-width: 80%` (default), same responsive pattern as header
- `.footer__content`: `max-inline-size: 100%` (default), `65%` (600px+)
- `.page-footnotes__footnote`: `width: 100%` (mobile), `80%` (600px+), `65%` (1500px+)

**Recommended Utility Classes:**
```scss
// Container width utilities
.container-narrow { max-width: 80%; margin: 0 auto; }
.container-medium { max-width: 90ch; margin: 0 auto; }
.container-wide { max-width: 95%; margin: 0 auto; }
.container-full { max-width: 100%; margin: 0 auto; }

// Responsive container widths (using existing breakpoints)
@media (min-width: 600px) {
  .container-narrow-sm { max-width: 80%; }
  .container-medium-sm { max-width: 90ch; }
}

@media (min-width: 900px) {
  .container-narrow-md { max-width: 75%; }
  .container-medium-md { max-width: 85%; }
}

@media (min-width: 1200px) {
  .container-narrow-lg { max-width: 70%; }
}
```

### 1.2 Layout Utilities

**Pattern Found:**
- `display: flex` with `flex-direction: column` repeated across multiple files
- `display: grid` with similar patterns in navigation, footnotes, page transitions
- `justify-content: center` and `align-items: center` used frequently

**Current Instances:**
- `.page-content`: `display: flex; flex-direction: column`
- `.page-article`: `display: flex; flex-direction: column`
- `.footer__content`: `display: flex; flex-direction: column; justify-content: center`
- `.hero-header`: `display: flex; flex-direction: column; justify-content: center; align-items: center`
- `.navigation__header`: `display: grid; grid-template-columns: 1fr; grid-template-rows: 1fr`
- `.page-transition-overlay`: `display: grid; grid-template-columns: 1fr; grid-template-rows: 1fr; justify-content: center; align-items: center`

**Recommended Utility Classes:**
```scss
// Flex utilities
.flex { display: flex; }
.flex-col { flex-direction: column; }
.flex-row { flex-direction: row; }
.flex-center { justify-content: center; align-items: center; }
.flex-between { justify-content: space-between; }
.items-center { align-items: center; }
.justify-center { justify-content: center; }

// Grid utilities
.grid { display: grid; }
.grid-1col { grid-template-columns: 1fr; }
.grid-2col { grid-template-columns: 1fr 1fr; }
.grid-center { place-items: center; }
```

### 1.3 Spacing Utilities

**Pattern Found:**
- Padding patterns are repetitive but use design tokens
- Margin: 0 auto used extensively for centering

**Recommended Utility Classes:**
```scss
// Margin utilities
.mx-auto { margin-left: auto; margin-right: auto; }
.my-auto { margin-top: auto; margin-bottom: auto; }
.m-0 { margin: 0; }

// Padding utilities (based on existing space tokens)
.p-0 { padding: var(--space-0); }
.p-2 { padding: var(--space-2); }
.p-4 { padding: var(--space-4); }
.p-6 { padding: var(--space-6); }
.p-8 { padding: var(--space-8); }

// Responsive padding
@media (min-width: 600px) {
  .px-0-sm { padding-left: var(--space-0); padding-right: var(--space-0); }
}
```

### 1.4 Typography Utilities

**Pattern Found:**
- `text-align: center` used in multiple locations
- `text-align: left` used in page headers
- Font family combinations repeated

**Current Instances:**
- `.hero-header`: `text-align: center`
- `.page-article header`: `text-align: left`
- `.manifest__table`: `text-align: left`
- `.page-transition-overlay__copy`: `text-align: center`
- `.navigation__link h3`: `text-align: center`

**Recommended Utility Classes:**
```scss
// Text alignment
.text-center { text-align: center; }
.text-left { text-align: left; }
.text-right { text-align: right; }

// Font family utilities (using existing tokens)
.font-sans { font-family: var(--font-family-sans); }
.font-serif { font-family: var(--font-family-serif); }
.font-script { font-family: var(--font-family-script); }
```

### 1.5 Transition Utilities

**Pattern Found:**
- `transition: color 0.3s ease` appears multiple times
- Similar cubic-bezier transitions repeated with slight variations

**Current Instances:**
- `.page-article-link`: `transition: color 0.3s ease`
- `.navigation__link`: `transition: transform 0.75s cubic-bezier(0.7, 0, 0.3, 1)`
- `.footer__text--highlight a`: `transition: color 0.3s ease`
- `.hero-nav__section-list-item`: `transition: color 0.75s cubic-bezier(...), background-color 0.6s cubic-bezier(...)`
- `sup`: `transition: background-color 0.3s ease, color 0.3s ease`

**Recommended Utility Classes:**
```scss
// Transition utilities
.transition-base { transition: all 0.3s ease; }
.transition-color { transition: color 0.3s ease; }
.transition-transform { transition: transform 0.75s cubic-bezier(0.7, 0, 0.3, 1); }
.transition-smooth { transition: all 0.5s cubic-bezier(0.7, 0, 0.3, 1); }
```

### 1.6 Responsive Width Patterns

**Pattern Found:**
- Repeated responsive width patterns with breakpoints at 600px, 900px, 1200px
- Pattern: mobile (100% or 95%) → 600px (80-85%) → 900px (75%) → 1200px (70%)

**Recommended Utility Classes:**
```scss
// Responsive width utilities
.w-full { width: 100%; }
.w-max-content { width: max-content; }

@media (min-width: 600px) {
  .w-80-sm { width: 80%; }
  .w-85-sm { width: 85%; }
}

@media (min-width: 900px) {
  .w-75-md { width: 75%; }
}

@media (min-width: 1200px) {
  .w-70-lg { width: 70%; }
}
```

### 1.7 Overflow & Box-Sizing

**Pattern Found:**
- `overflow-x: hidden` appears in hero components
- `box-sizing: border-box` set globally but some components redundantly set it

**Current Instances:**
- `.hero-content`: `overflow-x: hidden; box-sizing: border-box`
- `.hero-content__page`: `overflow-x: hidden; box-sizing: border-box`
- `.hero-nav`: `overflow-x: hidden; box-sizing: border-box`
- `.manifest__table-wrapper`: `overflow-x: auto; overflow-y: visible`

**Recommended Utility Classes:**
```scss
.overflow-hidden { overflow: hidden; }
.overflow-x-hidden { overflow-x: hidden; }
.overflow-x-auto { overflow-x: auto; }
.overflow-y-visible { overflow-y: visible; }
```

---

## 2. Manifest Table Code Analysis

### 2.1 Current Structure

The manifest table implementation in `_manifest.scss` has several patterns that could benefit from utility classes:

**Issues Identified:**
1. **Repeated responsive width pattern** - `.manifest__header` and `.manifest__table` share identical responsive max-width logic
2. **Table cell padding** - All cells use `var(--space-4)` padding
3. **Border patterns** - Table rows and cells use consistent border-top patterns
4. **Hover states** - Transition patterns could be standardized

### 2.2 Recommended Refactoring

**Option 1: Extract Common Patterns to Utilities**
```scss
// Create a reusable responsive container utility
.table-container {
  max-width: 95%;
  margin: 0 auto;
  
  @media (min-width: 600px) {
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

// Table-specific utilities
.table-cell-padding { padding: var(--space-4); }
.table-border-top { border-top: var(--border-width-thin) solid var(--color-white); }
.table-hover-row { 
  transition: background-color 0.7s ease, color 0.6s ease;
  &:hover {
    background-color: var(--color-white);
    opacity: 0.75;
    color: var(--theme-color-main);
  }
}
```

**Option 2: Component-Based Approach**
Keep table-specific styles but use utility classes for common patterns:
- Use `.container-responsive` utility for width constraints
- Use `.transition-base` for hover effects
- Use `.text-left` for alignment

### 2.3 Specific Manifest Table Opportunities

1. **Wrapper scrollbar styling** - Could be extracted to `.scrollbar-custom` utility
2. **Header/Table width sync** - Both use identical responsive patterns
3. **Cell border consistency** - All cells use same border pattern

---

## 3. Container Code Analysis

### 3.1 Page vs Home Container Patterns

**Page Container (`.page-content`):**
```scss
.page-content {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  min-height: 100dvh;
  position: relative;
  top: 0;
  z-index: 100;
  margin: 0 auto;
  font-variant-ligatures: no-common-ligatures;
}
```

**Home/Hero Container (`.hero-content`):**
```scss
.hero-content {
  grid-row: 1 / 2;
  grid-column: 1 / 2;
  position: relative;
  top: 0;
  z-index: var(--z-index-home-content);
  margin: 0 auto;
  min-height: 100%;
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
  box-sizing: border-box;
}
```

**Similarities:**
- Both use `margin: 0 auto` for centering
- Both use `position: relative; top: 0`
- Both use z-index (different values)
- Both have min-height constraints

**Differences:**
- Page uses flexbox, hero uses grid positioning
- Hero has overflow-x: hidden, page doesn't explicitly set it
- Different z-index scales

### 3.2 Recommended Container Utilities

```scss
// Base container utility
.container-base {
  margin: 0 auto;
  position: relative;
  top: 0;
  box-sizing: border-box;
}

// Full viewport height container
.container-full-height {
  min-height: 100vh;
  min-height: 100dvh;
}

// Content container (for page content)
.container-content {
  @extend .container-base;
  display: flex;
  flex-direction: column;
}

// Hero container (for hero sections)
.container-hero {
  @extend .container-base;
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
}
```

### 3.3 Article/Content Wrapper Patterns

**Page Article (`.page-article`):**
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

**Hero Content Page (`.hero-content__page`):**
```scss
.hero-content__page {
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
  box-sizing: border-box;
}
```

**Recommended Utilities:**
```scss
.article-container {
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

---

## 4. Itemized List of Utility Class Opportunities

### Priority 1: High-Frequency, High-Impact

1. **Container Width Utilities**
   - Files: `_page.scss`, `_manifest.scss`, `_footer.scss`, `_footnotes.scss`
   - Pattern: Responsive max-width with consistent breakpoints
   - Impact: Reduces ~15-20 instances of duplicate code

2. **Centering Utilities**
   - Files: Throughout (40+ instances of `margin: 0 auto`)
   - Pattern: `margin: 0 auto` for horizontal centering
   - Impact: Simplifies centering patterns

3. **Flexbox Layout Utilities**
   - Files: `_page.scss`, `_footer.scss`, `_hero.scss`, `_navigation.scss`
   - Pattern: `display: flex; flex-direction: column` repeated
   - Impact: Reduces layout boilerplate

4. **Text Alignment Utilities**
   - Files: Multiple files (10+ instances)
   - Pattern: `text-align: center` and `text-align: left`
   - Impact: Quick wins for consistency

### Priority 2: Medium-Frequency, Good ROI

5. **Transition Utilities**
   - Files: `_page.scss`, `_navigation.scss`, `_footer.scss`, `_hero.scss`
   - Pattern: `transition: color 0.3s ease` repeated
   - Impact: Standardizes animation timing

6. **Font Family Utilities**
   - Files: Throughout
   - Pattern: Font family declarations using tokens
   - Impact: Ensures consistent typography

7. **Spacing Utilities (Padding)**
   - Files: Throughout
   - Pattern: Padding using space tokens
   - Impact: Consistent spacing scale

8. **Overflow Utilities**
   - Files: `_hero.scss`, `_manifest.scss`
   - Pattern: `overflow-x: hidden`, `overflow-x: auto`
   - Impact: Simplifies overflow management

### Priority 3: Lower Frequency, Component-Specific

9. **Grid Layout Utilities**
   - Files: `_navigation.scss`, `_footnotes.scss`, `_page-transitions.scss`
   - Pattern: `display: grid; grid-template-columns: 1fr; grid-template-rows: 1fr`
   - Impact: Less frequent but still beneficial

10. **Table-Specific Utilities**
    - Files: `_manifest.scss`
    - Pattern: Cell padding, borders, hover states
    - Impact: Makes table styling more maintainable

11. **Z-Index Utilities** (Optional)
    - Files: Throughout
    - Pattern: Z-index values from tokens
    - Impact: Better z-index management, though tokens already help

---

## 5. Developing a Utility Library for SPA Web Apps

### 5.1 Core Principles

**Utility-First Approach:**
- Single responsibility: Each utility class does one thing
- Composable: Utilities can be combined for complex layouts
- Consistent naming: Use a clear, predictable naming convention (e.g., Tailwind-style: `property-value`)

**Design Token Integration:**
- Utilities should reference design tokens (CSS custom properties)
- Enables easy theme switching and consistency
- Your existing token system in `_tokens.scss` is well-structured for this

**Responsive Design:**
- Breakpoint variants: `utility-sm`, `utility-md`, `utility-lg`
- Mobile-first approach: Base utilities for mobile, add variants for larger screens
- Use existing breakpoints: `--bp-xs: 600px`, `--bp-sm: 800px`, `--bp-md: 900px`, `--bp-lg: 1200px`

### 5.2 Utility Categories

**Layout Utilities:**
- Display (flex, grid, block, inline-block)
- Positioning (relative, absolute, fixed)
- Flexbox (direction, justify, align)
- Grid (columns, rows, gap)
- Width/Height (w-full, h-screen, max-w-*)

**Spacing Utilities:**
- Margin (m-*, mt-*, mb-*, mx-*, my-*)
- Padding (p-*, pt-*, pb-*, px-*, py-*)
- Gap (gap-*) for flexbox/grid

**Typography Utilities:**
- Font families (font-sans, font-serif)
- Font sizes (text-*, using existing step scale)
- Font weights (font-light, font-regular, font-bold)
- Text alignment (text-left, text-center, text-right)
- Line height (leading-*)

**Color Utilities:**
- Text colors (text-*)
- Background colors (bg-*)
- Border colors (border-*)

**Border Utilities:**
- Border width (border, border-2)
- Border radius (rounded-*, using existing tokens)
- Border style (border-solid, border-dashed)

**Effects Utilities:**
- Transitions (transition-base, transition-color)
- Transforms (transform, scale-*)
- Opacity (opacity-*)
- Shadows (shadow-*)

### 5.3 Implementation Strategies

**Strategy 1: Incremental Adoption (Recommended)**
- Start with highest-impact utilities (containers, layout, centering)
- Gradually expand as patterns emerge
- Keep existing component classes, supplement with utilities
- Best for existing codebases

**Strategy 2: Hybrid Approach**
- Core utilities for common patterns
- Component classes for complex, unique components
- Utilities for layout/composition, components for semantics
- Your codebase already follows this pattern partially

**Strategy 3: Full Utility-First (Not Recommended for Your Project)**
- Everything becomes utilities
- Very flexible but can hurt maintainability
- Harder to track component boundaries
- Better for greenfield projects

### 5.4 Naming Conventions

**Popular Approaches:**

1. **Tailwind CSS Style** (Most Popular)
   ```
   .flex
   .flex-col
   .items-center
   .justify-between
   .max-w-80
   .mx-auto
   ```

2. **Bootstrap Style**
   ```
   .d-flex
   .flex-column
   .align-items-center
   .justify-content-between
   .w-80
   .mx-auto
   ```

3. **Semantic Abbreviations**
   ```
   .flex
   .flex-col
   .center
   .space-between
   ```

**Recommendation:** Use Tailwind-style naming for familiarity and discoverability.

### 5.5 File Organization

**Option 1: Single Utilities File**
```
styles/
  _utilities.scss  // All utilities in one file
```

**Option 2: Categorized Utilities**
```
styles/
  utilities/
    _layout.scss
    _spacing.scss
    _typography.scss
    _colors.scss
    _effects.scss
```

**Option 3: Mix of Both**
```
styles/
  _utilities.scss  // Core, most-used utilities
  utilities/
    _layout.scss   // Extended layout utilities
    _spacing.scss  // Extended spacing utilities
```

**Recommendation:** Start with Option 1, split into Option 2 as it grows.

### 5.6 Considerations from Popular Libraries

**Tailwind CSS:**
- Strengths: Comprehensive, well-documented, highly composable, excellent tooling
- Considerations: Can generate large CSS bundles (mitigated with purging), learning curve
- Takeaway: Excellent naming conventions and organization to emulate

**Bootstrap Utilities:**
- Strengths: Familiar, well-tested, good documentation
- Considerations: More opinionated, larger bundle size
- Takeaway: Good responsive breakpoint strategy

**Bulma (Sass-based):**
- Strengths: Flexbox-first, modular, Sass variables
- Considerations: Less utility-focused, more component-based
- Takeaway: Good integration with Sass and design tokens

**Your Current Approach:**
- Component-based with design tokens (excellent foundation)
- Some utility-like patterns emerging (good candidates for extraction)
- Well-organized file structure

### 5.7 Best Practices for SPA Context

**1. Performance Considerations:**
- Use CSS custom properties (tokens) for theming - you're already doing this
- Consider purging unused utilities in production builds
- Group related utilities to leverage browser caching

**2. JavaScript Integration:**
- Utilities should be CSS-only (no JS dependencies)
- Consider utility classes for state-based styling (e.g., `.is-active`, `.is-visible`)
- Your existing state classes (`.is-visible`, `.is-hidden`) follow this pattern

**3. Maintainability:**
- Document utility purposes and usage
- Create a utility reference/cheat sheet
- Set up linting rules to encourage utility usage over custom CSS

**4. Accessibility:**
- Don't override semantic HTML with utilities
- Maintain proper heading hierarchy
- Ensure color contrast with utility color classes

**5. Testing:**
- Test utilities across breakpoints
- Ensure utility combinations work well together
- Visual regression testing for common utility patterns

### 5.8 Migration Strategy

**Phase 1: Audit & Plan** (Current)
- Identify high-frequency patterns (✅ Done in this document)
- Prioritize utilities based on impact
- Create initial utility set

**Phase 2: Core Utilities**
- Implement container/layout utilities
- Implement spacing utilities
- Implement typography utilities

**Phase 3: Component Integration**
- Refactor manifest table to use utilities
- Update page/home containers
- Migrate common patterns

**Phase 4: Expansion**
- Add remaining utility categories
- Document usage patterns
- Create utility reference guide

**Phase 5: Optimization**
- Review and consolidate
- Remove redundant component styles
- Performance optimization

---

## 6. Recommended Next Steps

1. **Start Small:** Begin with container utilities and centering (`mx-auto`)
2. **Measure Impact:** Track how many instances each utility replaces
3. **Document Usage:** Create examples showing before/after
4. **Iterate:** Expand utilities based on actual usage patterns
5. **Maintain Balance:** Keep utilities focused, don't over-abstract

---

## 7. Example Implementation

Here's a starter utility file structure:

```scss
// styles/_utilities.scss

/* =======================================================================
   Utility Classes
   ======================================================================= */

// Layout Utilities
.flex { display: flex; }
.flex-col { flex-direction: column; }
.flex-row { flex-direction: row; }
.flex-center { justify-content: center; align-items: center; }
.flex-between { justify-content: space-between; }

.grid { display: grid; }
.grid-1col { grid-template-columns: 1fr; }

// Spacing Utilities
.mx-auto { margin-left: auto; margin-right: auto; }
.my-auto { margin-top: auto; margin-bottom: auto; }
.m-0 { margin: 0; }

.p-0 { padding: var(--space-0); }
.p-4 { padding: var(--space-4); }
.px-4 { padding-left: var(--space-4); padding-right: var(--space-4); }
.py-4 { padding-top: var(--space-4); padding-bottom: var(--space-4); }

// Typography Utilities
.text-center { text-align: center; }
.text-left { text-align: left; }

.font-sans { font-family: var(--font-family-sans); }
.font-serif { font-family: var(--font-family-serif); }
.font-script { font-family: var(--font-family-script); }

// Transition Utilities
.transition-base { transition: all 0.3s ease; }
.transition-color { transition: color 0.3s ease; }

// Overflow Utilities
.overflow-hidden { overflow: hidden; }
.overflow-x-hidden { overflow-x: hidden; }
.overflow-x-auto { overflow-x: auto; }

// Container Utilities (Responsive)
.container-responsive {
  width: 100%;
  max-width: 95%;
  margin: 0 auto;
  
  @media (min-width: 600px) {
    max-width: 85%;
  }
  
  @media (min-width: 900px) {
    max-width: 75%;
  }
  
  @media (min-width: 1200px) {
    max-width: 70%;
  }
}
```

---

## Conclusion

The codebase has excellent foundations with design tokens and component-based architecture. Introducing utility classes will reduce duplication, improve maintainability, and create a more formal design system. Start incrementally with high-impact utilities, and expand based on actual usage patterns.
