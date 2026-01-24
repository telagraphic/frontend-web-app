# CSS Custom Properties Guide

A comprehensive guide to CSS custom properties (CSS variables), their runtime behavior, integration patterns, and modern web application usage.

---

## Table of Contents

1. [What Are CSS Custom Properties?](#what-are-css-custom-properties)
2. [Runtime vs Build-Time Calculation](#runtime-vs-build-time-calculation)
3. [Use Cases](#use-cases)
4. [Integration with Design Systems](#integration-with-design-systems)
5. [Modern Theming and Conditional Styling Patterns](#modern-theming-and-conditional-styling-patterns)
6. [Scoped Custom Properties](#scoped-custom-properties)
7. [JavaScript Interaction](#javascript-interaction)
8. [Common Implementation Patterns](#common-implementation-patterns)
9. [Power for Theming and Code Simplification](#power-for-theming-and-code-simplification)
10. [Best Practices and Gotchas](#best-practices-and-gotchas)

---

## What Are CSS Custom Properties?

CSS custom properties (also called CSS variables) are author-defined properties that participate in the CSS cascade. They are declared with a double hyphen prefix (`--`) and consumed using the `var()` function.

### Basic Syntax

```css
/* Declaration */
:root {
  --color-primary: #005eb8;
  --space-4: 1rem;
}

/* Consumption */
.button {
  background-color: var(--color-primary);
  padding: var(--space-4);
}
```

### Key Characteristics

- **Inheritance**: Custom properties are inherited by default, cascading down the DOM tree
- **Scoping**: They follow normal CSS specificity and cascade rules
- **Dynamic**: Values can change at runtime based on selectors, media queries, container queries, attributes, and JavaScript
- **Fallbacks**: The `var()` function supports fallback values: `var(--property, fallback-value)`

### Differences from Preprocessor Variables

Unlike Sass/Less variables, CSS custom properties:
- Are **real CSS**, not compile-time substitutions
- Are **resolved at runtime** by the browser
- Can be **changed dynamically** with JavaScript
- Participate in the **CSS cascade** and inheritance
- Can be **overridden** by selectors, media queries, and container queries

---

## Runtime vs Build-Time Calculation

### How Browsers Resolve Custom Properties

CSS custom properties are resolved during the browser's **style computation phase** (runtime), not at build time. Here's the process:

#### 1. **Parsing Phase**
- CSS is parsed into rule sets
- Custom property declarations are stored but not yet resolved

#### 2. **Cascade Phase**
- The cascade determines which declarations apply to each element
- Specificity and source order determine which custom property values win

#### 3. **Computed Value Resolution**
- For each element, the browser computes which custom property values apply
- Values are resolved based on the element's context (parent, media queries, container queries, etc.)

#### 4. **Substitution Phase**
- `var()` functions are evaluated per element
- Each element gets its own resolved value based on its position in the DOM
- Fallbacks are used if a custom property is missing or invalid

#### 5. **Final Value Application**
- The resolved values are applied to CSS properties
- Changes can trigger repaint or layout depending on the consuming property

### Key Implications

**Runtime Resolution Means:**
- ✅ The same component can resolve different values in different contexts
- ✅ Custom properties respond to selector changes, media queries, and container queries
- ✅ JavaScript can change values and see immediate effects
- ✅ Values can be context-dependent (parent element, viewport size, container size)

**Example: Context-Dependent Values**

```css
:root {
  --card-padding: 1rem;
}

.card {
  padding: var(--card-padding);
}

/* Different padding in different contexts */
@media (min-width: 900px) {
  :root {
    --card-padding: 2rem;
  }
}

.sidebar .card {
  --card-padding: 0.75rem;
}
```

The `.card` element will have different padding values depending on:
- Viewport width (media query)
- Parent element (`.sidebar` context)

### Build-Time vs Runtime Comparison

| Aspect | Preprocessor Variables (Sass) | CSS Custom Properties |
|--------|-------------------------------|----------------------|
| **Resolution** | Build-time (compile) | Runtime (browser) |
| **Dynamic Changes** | No | Yes (JavaScript, media queries) |
| **Context-Aware** | No | Yes (inheritance, cascade) |
| **Browser DevTools** | Not visible | Visible and editable |
| **Performance** | Zero runtime cost | Minimal runtime cost |

---

## Use Cases

### 1. **Design Tokens**
Centralize design values (colors, spacing, typography, shadows, radii) for consistency and easy updates.

```css
:root {
  --color-primary: #005eb8;
  --space-4: 1rem;
  --font-size-2: clamp(1.62rem, 1.4809rem + 0.618vw, 2.2148rem);
  --border-radius-medium: 0.75em;
}
```

### 2. **Theming**
Enable multiple themes (light/dark, brand variants) without duplicating CSS.

```css
[data-theme="dark"] {
  --color-bg: #0b1220;
  --color-text: #e5e7eb;
}
```

### 3. **Conditional/Contextual Styling**
Style components differently based on context, state, or parent elements.

```css
.button {
  --btn-bg: var(--color-primary);
}

.button:hover {
  --btn-bg: var(--color-primary-hover);
}

.button:disabled {
  --btn-bg: var(--color-neutral-300);
}
```

### 4. **Responsive Design**
Adjust values based on viewport or container size.

```css
:root { --space-page: 1rem; }

@media (min-width: 768px) {
  :root { --space-page: 2rem; }
}
```

### 5. **Runtime Updates**
Enable live previews, user customization, feature flags, and dynamic adjustments.

### 6. **Code Simplification**
Reduce repetition and create reusable, maintainable stylesheets.

---

## Integration with Design Systems

### Token Architecture: Primitives and Semantics

A robust design system separates **primitive tokens** (raw values) from **semantic tokens** (meaning-based values).

#### Primitive Tokens

Raw scales that don't refer to specific component usage:

```css
:root {
  /* Color primitives */
  --color-white: #ffffff;
  --color-black: #000000;
  --color-gray-1: rgb(137 137 137 / 48%);
  --theme-color-main: #005eb8;

  /* Spacing primitives */
  --space-0: 0;
  --space-1: 0.25rem;  /* 4px */
  --space-2: 0.5rem;   /* 8px */
  --space-4: 1rem;     /* 16px */
  --space-6: 1.5rem;   /* 24px */
  --space-8: 2rem;     /* 32px */

  /* Typography primitives */
  --font-family-sans: "Outfit", -apple-system, sans-serif;
  --font-family-serif: "Hedvig", serif;
  --font-size-0: clamp(1.125rem, 0.9789rem + 0.6494vw, 1.75rem);
  --font-weight-regular: 400;
  --font-weight-semibold: 600;

  /* Border primitives */
  --border-width-thin: 1px;
  --border-radius-medium: 0.75em;
}
```

#### Semantic Tokens

Meaning-based tokens that reference primitives:

```css
:root {
  /* Semantic color tokens */
  --color-text: var(--color-black-2);
  --color-text-muted: var(--color-gray-1);
  --color-bg: var(--color-white);
  --color-surface: var(--color-gray-2);
  --color-primary: var(--theme-color-main);

  /* Semantic spacing tokens */
  --space-card-padding: var(--space-4);
  --space-page-margin: var(--space-6);
  --space-section-gap: var(--space-20);

  /* Semantic typography tokens */
  --font-body: var(--font-family-serif);
  --font-heading: var(--font-family-sans);
  --font-size-body: var(--font-size-0);
  --font-size-heading: var(--font-size-2);
}
```

#### Component Usage

Components consume semantic tokens, not primitives:

```css
.card {
  color: var(--color-text);
  background: var(--color-surface);
  padding: var(--space-card-padding);
  border-radius: var(--border-radius-medium);
  font-family: var(--font-body);
  font-size: var(--font-size-body);
}
```

### Benefits of This Architecture

1. **Centralized Meaning**: Change semantic tokens to update entire design system
2. **Easy Theme Swapping**: Swap primitives without touching component CSS
3. **Clear Intent**: Semantic names communicate purpose (`--color-text` vs `--color-black-2`)
4. **Maintainability**: Update spacing scale in one place, affects all components
5. **Consistency**: Enforces design system constraints

### Example: Theme Switching

```css
/* Light theme (default) */
:root {
  --color-text: var(--color-black-2);
  --color-bg: var(--color-white);
}

/* Dark theme */
[data-theme="dark"] {
  --color-text: var(--color-white);
  --color-bg: var(--color-black);
}

/* Components automatically adapt */
.card {
  color: var(--color-text);
  background: var(--color-bg);
}
```

---

## Modern Theming and Conditional Styling Patterns

### 1. Theme via Data Attribute

The most common pattern for theme switching:

```css
:root {
  --color-bg: #ffffff;
  --color-text: #111827;
  --color-surface: #f9fafb;
}

[data-theme="dark"] {
  --color-bg: #0b1220;
  --color-text: #e5e7eb;
  --color-surface: #1e293b;
}

[data-theme="high-contrast"] {
  --color-bg: #000000;
  --color-text: #ffffff;
  --color-surface: #1a1a1a;
}
```

**JavaScript:**
```javascript
// Toggle theme
document.documentElement.dataset.theme = "dark";

// Or toggle between themes
const currentTheme = document.documentElement.dataset.theme;
document.documentElement.dataset.theme = currentTheme === "dark" ? "light" : "dark";
```

### 2. Scoped Theming

Apply themes to specific sections or components:

```css
.theme-brand-a { --color-brand: #b45309; }
.theme-brand-b { --color-brand: #2563eb; }
.theme-brand-c { --color-brand: #10b981; }

.button {
  background: var(--color-brand);
}
```

**Use cases:**
- Multi-brand pages
- Widget previews
- Component libraries
- A/B testing different color schemes

### 3. State-Based Tokens

Use custom properties for component states:

```css
.button {
  --btn-bg: var(--color-primary);
  --btn-text: var(--color-white);
  --btn-padding: var(--space-4);
  
  background: var(--btn-bg);
  color: var(--btn-text);
  padding: var(--btn-padding);
}

.button:hover {
  --btn-bg: var(--color-primary-hover);
}

.button:active {
  --btn-bg: var(--color-primary-active);
}

.button:disabled {
  --btn-bg: var(--color-neutral-300);
  --btn-text: var(--color-neutral-500);
  cursor: not-allowed;
}

.button--large {
  --btn-padding: var(--space-6);
}
```

**Benefits:**
- All state styles in one place
- Easy to add new states
- Consistent state transitions

### 4. Responsive Tokens with Media Queries

Adjust tokens based on viewport:

```css
:root {
  --space-page: 1rem;
  --font-size-heading: var(--font-size-2);
  --grid-columns: 1;
}

@media (min-width: 768px) {
  :root {
    --space-page: 2rem;
    --font-size-heading: var(--font-size-3);
    --grid-columns: 2;
  }
}

@media (min-width: 1200px) {
  :root {
    --space-page: 3rem;
    --grid-columns: 3;
  }
}

.page {
  padding: var(--space-page);
}

.heading {
  font-size: var(--font-size-heading);
}

.grid {
  grid-template-columns: repeat(var(--grid-columns), 1fr);
}
```

### 5. Container Queries for Component Responsiveness

Adjust tokens based on container size:

```css
.card-container {
  container-type: inline-size;
}

.card {
  --card-gap: 0.75rem;
  --card-padding: var(--space-4);
  --card-font-size: var(--font-size-0);
  
  gap: var(--card-gap);
  padding: var(--card-padding);
  font-size: var(--card-font-size);
}

@container (min-width: 560px) {
  .card {
    --card-gap: 1.25rem;
    --card-padding: var(--space-6);
    --card-font-size: var(--font-size-1);
  }
}
```

### 6. Attribute-Based Conditional Styling

Use data attributes for conditional styling:

```css
[data-density="compact"] {
  --space-control-y: 0.25rem;
  --space-control-x: 0.5rem;
}

[data-density="comfortable"] {
  --space-control-y: 0.75rem;
  --space-control-x: 1rem;
}

.button {
  padding-block: var(--space-control-y);
  padding-inline: var(--space-control-x);
}
```

### 7. Class-Based Variants

Create component variants with custom properties:

```css
.card {
  --card-padding: var(--space-4);
  --card-radius: var(--border-radius-medium);
  --card-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  
  padding: var(--card-padding);
  border-radius: var(--card-radius);
  box-shadow: var(--card-shadow);
}

.card--dense {
  --card-padding: var(--space-2);
}

.card--rounded {
  --card-radius: var(--border-radius-large);
}

.card--elevated {
  --card-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}
```

---

## Scoped Custom Properties

**Pattern Name**: Component-Scoped Custom Properties (also called "Local Custom Properties" or "Scoped Variables")

This pattern involves defining custom properties directly on a component selector, then overriding them in pseudo-classes, modifiers, or states. The properties are scoped to the component and its descendants, creating a clean API for component customization.

#### Pattern 1: Decomposed Value Manipulation

Break complex values into component parts that can be individually modified:

```css
button {
  /* Define HSL components as custom properties */
  --h: 100;
  --s: 50%;
  --l: 50%;
  --a: 1;

  /* Compose them into the final value */
  background: hsl(var(--h) var(--s) var(--l) / var(--a));
}

/* Modify individual components via pseudo-classes */
button:hover {
  --l: 75%; /* Increase lightness on hover */
}

button:focus {
  --s: 75%; /* Increase saturation on focus */
}

button[disabled] {
  --s: 0%;  /* Remove saturation (grayscale) */
  --a: 0.5; /* Reduce opacity */
}
```

**Benefits:**
- Modify individual aspects of a value without recalculating the whole thing
- Clean separation of concerns (color, opacity, etc.)
- Easy to create state variations
- Works with any value type (colors, transforms, spacing, etc.)

**Use Cases:**
- Color manipulation (HSL, RGB components)
- Transform composition
- Spacing adjustments
- Opacity/transparency control

#### Pattern 2: Variant-Based Scoping

Use scoped custom properties to create component variants:

```css
.button {
  /* Base styles */
  padding: 1rem 1.25rem;
  color: #fff;
  font-weight: bold;
  font-size: 1.25rem;
  margin: 1rem;
  transition: background 0.1s ease;
  
  /* Scoped custom property for variant control */
  --hue: 200; /* Default hue */
  
  /* Use the scoped property */
  background: hsl(var(--hue), 100%, 50%);
  outline-color: hsl(var(--hue), 100%, 80%);
}

/* State variations use the scoped property */
.button:hover {
  background: hsl(var(--hue), 100%, 40%);
}

.button:active {
  background: hsl(var(--hue), 100%, 30%);
}

/* Variants override the scoped property */
.button--primary {
  --hue: 233;
}

.button--secondary {
  --hue: 200;
}

.button--success {
  --hue: 120;
}

.button--danger {
  --hue: 0;
}
```

**Benefits:**
- Single source of truth for variant behavior
- All states automatically adapt to variant
- Easy to add new variants
- Consistent state transitions across variants

#### Pattern 3: Transform Composition

Compose complex transforms from individual components:

```css
.view {
  /* Define transform components */
  --tx: 0;      /* translateX */
  --ty: 0;      /* translateY */
  --deg: 0;     /* rotation */
  --scale: 1;   /* scale */
  
  /* Compose into transform */
  transform: 
    translateX(var(--tx, 0))
    rotate(var(--deg, 0))
    scale(var(--scale, 1))
    translateY(var(--ty, 0));
}

/* State classes modify individual components */
.view.activated {
  --tx: 10vmin;
  --deg: 90deg;
}

.view.minimize {
  --scale: 0.8;
}

.view.priority {
  --ty: 10vmin;
}

/* Multiple states can combine */
.view.activated.priority {
  /* Both --tx and --ty are set */
  /* --deg and --scale remain from previous states */
}
```

**Benefits:**
- Modify individual transform functions independently
- Combine multiple states without conflicts
- Maintain transform order
- Easy to animate individual components

#### Additional Common Patterns

**Pattern 4: Spacing Composition**

```css
.card {
  --padding-x: var(--space-4);
  --padding-y: var(--space-6);
  --gap: var(--space-2);
  
  padding: var(--padding-y) var(--padding-x);
  gap: var(--gap);
}

.card--compact {
  --padding-x: var(--space-2);
  --padding-y: var(--space-4);
  --gap: var(--space-1);
}

.card--spacious {
  --padding-x: var(--space-8);
  --padding-y: var(--space-10);
  --gap: var(--space-4);
}
```

**Pattern 5: Shadow Layering**

```css
.card {
  --shadow-x: 0;
  --shadow-y: 2px;
  --shadow-blur: 4px;
  --shadow-spread: 0;
  --shadow-color: rgba(0, 0, 0, 0.1);
  
  box-shadow: 
    var(--shadow-x) 
    var(--shadow-y) 
    var(--shadow-blur) 
    var(--shadow-spread) 
    var(--shadow-color);
}

.card--elevated {
  --shadow-y: 8px;
  --shadow-blur: 16px;
  --shadow-color: rgba(0, 0, 0, 0.15);
}

.card--inset {
  --shadow-x: inset 0;
  --shadow-y: 2px;
}
```

**Pattern 6: Grid Composition**

```css
.grid {
  --columns: 1;
  --gap-x: var(--space-4);
  --gap-y: var(--space-4);
  
  display: grid;
  grid-template-columns: repeat(var(--columns), 1fr);
  gap: var(--gap-y) var(--gap-x);
}

.grid--2-col {
  --columns: 2;
}

.grid--3-col {
  --columns: 3;
}

.grid--tight {
  --gap-x: var(--space-2);
  --gap-y: var(--space-2);
}
```

### JavaScript Interaction with Scoped Custom Properties

JavaScript can manipulate scoped custom properties just like global ones, but the scope matters:

#### Setting Scoped Properties

```javascript
// Set on specific element (scoped to that element)
const button = document.querySelector('.button');
button.style.setProperty('--hue', '120');

// Set on element with modifier class
const primaryButton = document.querySelector('.button--primary');
primaryButton.style.setProperty('--hue', '233');

// Set on all elements matching selector
document.querySelectorAll('.button').forEach(btn => {
  btn.style.setProperty('--hue', '180');
});
```

#### Reading Scoped Properties

```javascript
// Get computed value from specific element
const button = document.querySelector('.button');
const styles = getComputedStyle(button);
const hue = styles.getPropertyValue('--hue').trim();
// Returns the value for THIS specific button element
```

#### Dynamic Variant Creation

```javascript
class Button {
  constructor(element) {
    this.element = element;
  }

  setVariant(variant) {
    const hues = {
      primary: 233,
      secondary: 200,
      success: 120,
      danger: 0,
      warning: 45
    };
    
    this.element.style.setProperty('--hue', hues[variant] || 200);
  }

  setState(state) {
    // Modify individual HSL components
    if (state === 'hover') {
      this.element.style.setProperty('--l', '40%');
    } else if (state === 'active') {
      this.element.style.setProperty('--l', '30%');
    } else if (state === 'disabled') {
      this.element.style.setProperty('--s', '0%');
      this.element.style.setProperty('--a', '0.5');
    }
  }
}

// Usage
const btn = new Button(document.querySelector('.button'));
btn.setVariant('primary');
btn.setState('hover');
```

#### Transform Manipulation

```javascript
class ViewController {
  constructor(element) {
    this.element = element;
  }

  activate() {
    this.element.style.setProperty('--tx', '10vmin');
    this.element.style.setProperty('--deg', '90deg');
    this.element.classList.add('activated');
  }

  minimize() {
    this.element.style.setProperty('--scale', '0.8');
    this.element.classList.add('minimize');
  }

  reset() {
    this.element.style.setProperty('--tx', '0');
    this.element.style.setProperty('--ty', '0');
    this.element.style.setProperty('--deg', '0');
    this.element.style.setProperty('--scale', '1');
    this.element.classList.remove('activated', 'minimize', 'priority');
  }

  setTransform(transform) {
    // Set multiple transform components at once
    Object.entries(transform).forEach(([key, value]) => {
      this.element.style.setProperty(`--${key}`, value);
    });
  }
}

// Usage
const view = new ViewController(document.querySelector('.view'));
view.activate();
view.setTransform({ tx: '20px', ty: '10px', scale: '1.2' });
```

#### Dynamic HSL Color Manipulation

```javascript
class ColorButton {
  constructor(element) {
    this.element = element;
    this.h = 200;
    this.s = 50;
    this.l = 50;
    this.a = 1;
    this.update();
  }

  setHue(h) {
    this.h = h;
    this.update();
  }

  setSaturation(s) {
    this.s = s;
    this.update();
  }

  setLightness(l) {
    this.l = l;
    this.update();
  }

  setAlpha(a) {
    this.a = a;
    this.update();
  }

  update() {
    this.element.style.setProperty('--h', this.h);
    this.element.style.setProperty('--s', `${this.s}%`);
    this.element.style.setProperty('--l', `${this.l}%`);
    this.element.style.setProperty('--a', this.a);
  }

  // Animate between states
  animateTo(targetState, duration = 300) {
    const startState = {
      h: this.h,
      s: this.s,
      l: this.l,
      a: this.a
    };

    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const eased = 1 - Math.pow(1 - progress, 3);

      this.h = startState.h + (targetState.h - startState.h) * eased;
      this.s = startState.s + (targetState.s - startState.s) * eased;
      this.l = startState.l + (targetState.l - startState.l) * eased;
      this.a = startState.a + (targetState.a - startState.a) * eased;

      this.update();

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }
}

// Usage
const colorBtn = new ColorButton(document.querySelector('button'));
colorBtn.animateTo({ h: 120, s: 75, l: 60, a: 1 }, 500);
```

#### Reactive Scoped Properties

Create reactive systems that respond to scoped property changes:

```javascript
class ScopedPropertyObserver {
  constructor(element, property, callback) {
    this.element = element;
    this.property = property;
    this.callback = callback;
    this.lastValue = null;
    this.observe();
  }

  observe() {
    const checkValue = () => {
      const styles = getComputedStyle(this.element);
      const currentValue = styles.getPropertyValue(this.property).trim();

      if (currentValue !== this.lastValue) {
        this.callback(currentValue, this.lastValue);
        this.lastValue = currentValue;
      }

      requestAnimationFrame(() => this.observe());
    };

    checkValue();
  }
}

// Usage: Watch for hue changes on a button
const button = document.querySelector('.button');
new ScopedPropertyObserver(button, '--hue', (newValue, oldValue) => {
  console.log(`Button hue changed from ${oldValue} to ${newValue}`);
  // Update other UI elements, sync with state, etc.
});
```

#### Pattern: Component API with JavaScript

Create a clean JavaScript API that mirrors the CSS scoped properties:

```javascript
class Component {
  constructor(element) {
    this.element = element;
    this.properties = new Map();
  }

  // Generic setter for any scoped property
  set(property, value) {
    this.properties.set(property, value);
    this.element.style.setProperty(`--${property}`, value);
    return this; // Chainable
  }

  // Generic getter
  get(property) {
    const styles = getComputedStyle(this.element);
    return styles.getPropertyValue(`--${property}`).trim();
  }

  // Batch setter
  setProperties(props) {
    Object.entries(props).forEach(([key, value]) => {
      this.set(key, value);
    });
    return this;
  }
}

// Usage
const card = new Component(document.querySelector('.card'));
card
  .set('card-padding', '2rem')
  .set('card-radius', '1rem')
  .setProperties({
    'card-shadow': '0 4px 8px rgba(0,0,0,0.1)',
    'card-bg': '#ffffff'
  });
```

### When to Use Scoped Custom Properties

**Use scoped properties when:**
- ✅ You need component-specific customization
- ✅ Values should be isolated to a component and its variants
- ✅ You want to compose complex values from parts
- ✅ You need to override values in pseudo-classes or modifiers
- ✅ You're building reusable component libraries

**Use global properties when:**
- ✅ Values should be shared across the entire application
- ✅ You're creating design tokens
- ✅ Values need to respond to theme changes
- ✅ You want values to cascade from parent to child

### Best Practices for Scoped Properties

1. **Define defaults**: Always provide default values in the base selector
2. **Use fallbacks**: Include fallbacks in `var()` for resilience
3. **Document the API**: Comment which properties can be overridden
4. **Keep names descriptive**: Use clear, component-specific names
5. **Avoid over-scoping**: Don't create scoped properties for truly global values

---

## JavaScript Interaction

### Setting Custom Properties

#### Method 1: `setProperty()`

```javascript
// Set on document root
document.documentElement.style.setProperty("--color-brand", "#2563eb");

// Set on specific element
element.style.setProperty("--card-padding", "2rem");

// Remove a property (set to empty string)
element.style.setProperty("--custom-prop", "");
```

#### Method 2: Direct Style Assignment

```javascript
// Set on element
element.style.setProperty("--color-brand", "#2563eb");

// Or using CSSStyleDeclaration
document.documentElement.style.cssText = "--color-brand: #2563eb; --space-4: 1.5rem;";
```

### Reading Custom Properties

#### Get Computed Value

```javascript
const styles = getComputedStyle(document.documentElement);
const brandColor = styles.getPropertyValue("--color-brand").trim();
// Returns: "#2563eb"

// Get from specific element
const elementStyles = getComputedStyle(element);
const padding = elementStyles.getPropertyValue("--card-padding").trim();
```

#### Get Property Priority

```javascript
const styles = getComputedStyle(element);
const priority = styles.getPropertyPriority("--color-brand");
// Returns: "important" if !important, empty string otherwise
```

### Use Cases for JavaScript Interaction

#### 1. **User Theme Customization**

Allow users to customize theme colors:

```javascript
class ThemeCustomizer {
  constructor() {
    this.colorInputs = document.querySelectorAll('[data-theme-color]');
    this.init();
  }

  init() {
    this.colorInputs.forEach(input => {
      input.addEventListener('input', (e) => {
        const property = e.target.dataset.themeColor;
        const value = e.target.value;
        document.documentElement.style.setProperty(property, value);
      });
    });
  }
}

// HTML
<input type="color" data-theme-color="--color-primary" value="#005eb8">
<input type="color" data-theme-color="--color-secondary" value="#10b981">
```

#### 2. **Live Design Previews**

Update design tokens in real-time for design tools or style guides:

```javascript
function updateDesignToken(token, value) {
  document.documentElement.style.setProperty(token, value);
  
  // Emit event for other systems
  window.dispatchEvent(new CustomEvent('design-token-changed', {
    detail: { token, value }
  }));
}

// Usage in design tool
updateDesignToken('--space-4', '1.25rem');
updateDesignToken('--font-size-2', '2rem');
```

#### 3. **Feature Flags and Experiments**

Toggle features via custom properties:

```javascript
function enableFeature(featureName, enabled) {
  document.documentElement.style.setProperty(
    `--feature-${featureName}`,
    enabled ? '1' : '0'
  );
}

// CSS
.feature-new-layout {
  display: var(--feature-new-layout, 0) ? block : none;
}

// Or use in calc()
.component {
  opacity: calc(var(--feature-new-layout, 0) * 1);
}
```

#### 4. **Syncing JavaScript UI with CSS Theme**

Read CSS tokens to style JavaScript-rendered content:

```javascript
function getThemeColors() {
  const styles = getComputedStyle(document.documentElement);
  return {
    primary: styles.getPropertyValue('--color-primary').trim(),
    text: styles.getPropertyValue('--color-text').trim(),
    bg: styles.getPropertyValue('--color-bg').trim(),
  };
}

// Use in Canvas, SVG, or third-party libraries
const colors = getThemeColors();
chart.update({
  colors: [colors.primary, colors.secondary]
});
```

#### 5. **Dynamic Density Control**

Adjust spacing based on user preference or context:

```javascript
function setDensity(density) {
  document.documentElement.dataset.density = density;
  
  // Or set specific tokens
  const densities = {
    compact: { y: '0.25rem', x: '0.5rem' },
    comfortable: { y: '0.75rem', x: '1rem' },
    spacious: { y: '1.25rem', x: '1.5rem' }
  };
  
  const values = densities[density];
  document.documentElement.style.setProperty('--space-control-y', values.y);
  document.documentElement.style.setProperty('--space-control-x', values.x);
}
```

#### 6. **OS Theme Preference Detection**

Sync with system preferences:

```javascript
function syncWithOSTheme() {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.dataset.theme = prefersDark ? 'dark' : 'light';
}

// Initial sync
syncWithOSTheme();

// Listen for changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', syncWithOSTheme);
```

#### 7. **Animation and Transitions**

Animate custom properties for smooth transitions:

```javascript
function animateColorTransition(fromColor, toColor, duration = 300) {
  const root = document.documentElement;
  root.style.setProperty('--color-transition', fromColor);
  
  requestAnimationFrame(() => {
    root.style.setProperty('--transition-duration', `${duration}ms`);
    root.style.setProperty('--color-transition', toColor);
  });
}

// CSS
.element {
  background: var(--color-transition);
  transition: background var(--transition-duration, 300ms) ease;
}
```

#### 8. **Responsive JavaScript Logic**

Read responsive tokens to inform JavaScript behavior:

```javascript
function getResponsiveValue() {
  const styles = getComputedStyle(document.documentElement);
  const columns = parseInt(styles.getPropertyValue('--grid-columns').trim(), 10);
  
  // Use in JavaScript logic
  if (columns >= 3) {
    enableAdvancedFeatures();
  }
}

// Listen for resize and recalculate
window.addEventListener('resize', getResponsiveValue);
```

### Advanced: Custom Property Observers

Watch for custom property changes:

```javascript
class CustomPropertyObserver {
  constructor(property, callback) {
    this.property = property;
    this.callback = callback;
    this.lastValue = null;
    this.observe();
  }

  observe() {
    const checkValue = () => {
      const styles = getComputedStyle(document.documentElement);
      const currentValue = styles.getPropertyValue(this.property).trim();
      
      if (currentValue !== this.lastValue) {
        this.callback(currentValue, this.lastValue);
        this.lastValue = currentValue;
      }
      
      requestAnimationFrame(checkValue);
    };
    
    checkValue();
  }
}

// Usage
new CustomPropertyObserver('--color-primary', (newValue, oldValue) => {
  console.log(`Color changed from ${oldValue} to ${newValue}`);
});
```

---

## Common Implementation Patterns

### 1. Token Files and Layering

Organize tokens in a layered structure:

```
styles/
├── tokens/
│   ├── _colors.scss      # Color primitives
│   ├── _spacing.scss     # Spacing primitives
│   ├── _typography.scss  # Typography primitives
│   ├── _semantics.scss   # Semantic tokens
│   └── _tokens.scss      # Main file (imports all)
├── base/
│   ├── _base.scss        # Element defaults
│   └── _typography.scss  # Typography styles
├── components/
│   └── *.scss            # Component styles
└── utilities/
    └── _utilities.scss   # Utility classes
```

**Example structure:**

```scss
// tokens/_tokens.scss
@layer tokens {
  :root {
    // Import primitives
    @import './colors';
    @import './spacing';
    @import './typography';
    
    // Semantic tokens
    @import './semantics';
  }
}
```

### 2. Fallback Values

Always provide fallbacks for resilience:

```css
.card {
  /* Fallback if custom property is missing */
  padding: var(--space-card-padding, 1rem);
  
  /* Multiple fallbacks */
  color: var(--color-text, var(--color-black, #000));
  
  /* Fallback with calc */
  margin: var(--space-card-margin, calc(var(--space-4) * 2));
}
```

**Use cases:**
- Migrating from hardcoded values
- Embedded components that may not have tokens
- Progressive enhancement
- Third-party integrations

### 3. Derived Tokens with `calc()`

Create tokens that derive from other tokens:

```css
:root {
  --space-4: 1rem;
  --space-6: calc(var(--space-4) * 1.5);
  --space-8: calc(var(--space-4) * 2);
  
  /* Mathematical operations */
  --header-height: calc(var(--space-8) + var(--space-4));
  --content-max-width: calc(100vw - var(--space-8) * 2);
}
```

### 4. Component API Pattern

Expose custom properties as a component API:

```css
.card {
  /* Public API - can be overridden */
  --card-padding: var(--space-4);
  --card-radius: var(--border-radius-medium);
  --card-bg: var(--color-surface);
  --card-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  
  /* Internal usage */
  padding: var(--card-padding);
  border-radius: var(--card-radius);
  background: var(--card-bg);
  box-shadow: var(--card-shadow);
}

/* Variants override the API */
.card--dense {
  --card-padding: var(--space-2);
}

.card--elevated {
  --card-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

/* Parent can override */
.dashboard .card {
  --card-bg: var(--color-white);
}
```

**Benefits:**
- Clear component API
- Easy to create variants
- Parent elements can customize
- Maintains encapsulation

### 5. Utility Classes with Custom Properties

Create utility classes that use custom properties:

```css
/* Utilities that use tokens */
.p-4 { padding: var(--space-4); }
.p-6 { padding: var(--space-6); }
.m-4 { margin: var(--space-4); }

.text-primary { color: var(--color-primary); }
.bg-surface { background: var(--color-surface); }

.font-sans { font-family: var(--font-family-sans); }
.font-serif { font-family: var(--font-family-serif); }
```

### 6. Z-Index Management

Use custom properties for z-index scales:

```css
:root {
  --z-index-zero: 0;
  --z-index-home: 10;
  --z-index-navigation: 200;
  --z-index-preloader: 300;
  --z-index-page-transition: 400;
}

.navigation {
  z-index: var(--z-index-navigation);
}

.preloader {
  z-index: var(--z-index-preloader);
}
```

**Benefits:**
- Centralized z-index management
- Easy to adjust layering
- Prevents z-index conflicts
- Self-documenting

### 7. Aspect Ratio Tokens

Store aspect ratios as custom properties:

```css
:root {
  --aspect-ratio-16-9: 16 / 9;
  --aspect-ratio-1-1: 1 / 1;
  --aspect-ratio-4-3: 4 / 3;
}

.hero-image {
  aspect-ratio: var(--aspect-ratio-16-9);
}

.avatar {
  aspect-ratio: var(--aspect-ratio-1-1);
}
```

### 8. Breakpoint Tokens (for JavaScript)

Store breakpoints for JavaScript use:

```css
:root {
  --bp-xs: 600px;
  --bp-sm: 800px;
  --bp-md: 900px;
  --bp-lg: 1200px;
  --bp-xl: 1500px;
}
```

**JavaScript:**
```javascript
function getBreakpoint(name) {
  const styles = getComputedStyle(document.documentElement);
  return styles.getPropertyValue(`--bp-${name}`).trim();
}

const mdBreakpoint = getBreakpoint('md'); // "900px"
```

### 9. CSS Layers Integration

Use `@layer` to organize custom properties:

```css
@layer tokens, base, components, utilities;

@layer tokens {
  :root {
    --color-primary: #005eb8;
    --space-4: 1rem;
  }
}

@layer components {
  .card {
    padding: var(--space-4);
    background: var(--color-primary);
  }
}
```

### 10. Conditional Token Loading

Load different token sets based on conditions:

```css
/* Default tokens */
:root {
  --color-primary: #005eb8;
}

/* Brand-specific tokens */
[data-brand="enterprise"] {
  --color-primary: #10b981;
}

[data-brand="startup"] {
  --color-primary: #f59e0b;
}
```

---

## Power for Theming and Code Simplification

### 1. **Centralized Value Management**

**Before (without custom properties):**
```css
.button-primary {
  background: #005eb8;
  color: #ffffff;
}

.card {
  border-color: #005eb8;
}

.link {
  color: #005eb8;
}

/* To change primary color, update 3+ places */
```

**After (with custom properties):**
```css
:root {
  --color-primary: #005eb8;
}

.button-primary {
  background: var(--color-primary);
}

.card {
  border-color: var(--color-primary);
}

.link {
  color: var(--color-primary);
}

/* Change in one place, updates everywhere */
```

### 2. **Theme as Data, Not CSS Duplication**

**Before:**
```css
/* Light theme */
.button { background: #005eb8; color: #ffffff; }
.card { background: #ffffff; color: #000000; }

/* Dark theme - duplicate all styles */
.dark .button { background: #2563eb; color: #ffffff; }
.dark .card { background: #0b1220; color: #e5e7eb; }
```

**After:**
```css
:root {
  --color-primary: #005eb8;
  --color-bg: #ffffff;
  --color-text: #000000;
}

[data-theme="dark"] {
  --color-primary: #2563eb;
  --color-bg: #0b1220;
  --color-text: #e5e7eb;
}

.button {
  background: var(--color-primary);
  color: var(--color-white);
}

.card {
  background: var(--color-bg);
  color: var(--color-text);
}

/* Components unchanged, themes are just data */
```

### 3. **Scoped Overrides**

Override values for specific contexts without duplicating CSS:

```css
.card {
  --card-padding: var(--space-4);
  padding: var(--card-padding);
}

/* Override in specific context */
.sidebar .card {
  --card-padding: var(--space-2);
}

/* No need to redefine entire .card styles */
```

### 4. **Reduced CSS Bundle Size**

Custom properties enable:
- Single set of component styles
- Multiple themes via data attributes
- Less CSS duplication
- Smaller bundle sizes

### 5. **Runtime Flexibility**

Change values without rebuilding:
- User preferences
- A/B testing
- Feature flags
- Dynamic theming
- Live previews

### 6. **Better Maintainability**

- **Single source of truth**: Update tokens, not components
- **Self-documenting**: Token names communicate intent
- **Type safety**: Consistent naming prevents errors
- **Easier refactoring**: Change token, update everywhere

### 7. **Design System Integration**

Custom properties bridge:
- **Design tools** → CSS (tokens as shared language)
- **CSS** → JavaScript (read tokens for JS logic)
- **Components** → Themes (components adapt automatically)

### 8. **Progressive Enhancement**

```css
/* Works without custom properties */
.card {
  padding: 1rem;
  background: #ffffff;
}

/* Enhanced with custom properties */
.card {
  padding: var(--space-card-padding, 1rem);
  background: var(--color-surface, #ffffff);
}
```

### Real-World Impact Example

**Scenario**: Update primary color across entire application

**Without custom properties:**
- Search codebase for `#005eb8` (risky, might miss some)
- Update 50+ instances manually
- Risk inconsistencies
- Time: 30+ minutes

**With custom properties:**
- Update `--color-primary: #2563eb` in tokens file
- All components update automatically
- Guaranteed consistency
- Time: 10 seconds

---

## Best Practices and Gotchas

### Naming Conventions

**Recommended patterns:**

```css
/* Primitives: category-scale-value */
--color-neutral-500
--space-4
--font-size-2
--border-radius-medium

/* Semantics: purpose-context */
--color-text
--color-text-muted
--space-card-padding
--font-heading

/* Component API: component-property */
--card-padding
--button-bg
--nav-height
```

**Avoid:**
- Generic names: `--color`, `--size`
- Abbreviations: `--clr-prm` (unclear)
- Inconsistent patterns

### Common Gotchas

#### 1. **Custom Properties Are Strings**

```css
:root {
  --number: 10;
}

.element {
  /* This doesn't work - var() returns a string */
  width: var(--number)px; /* Results in "10px" */
  
  /* Use calc() instead */
  width: calc(var(--number) * 1px);
}
```

#### 2. **Invalid Values Invalidate Properties**

```css
:root {
  --color: invalid-color;
}

.element {
  /* Entire property becomes invalid */
  color: var(--color); /* Invalid, falls back or ignored */
  background: blue; /* This still works */
}
```

#### 3. **Fallback Chain Limitations**

```css
/* This doesn't work as expected */
.element {
  color: var(--color-primary, var(--color-secondary, blue));
}

/* Better: use multiple fallbacks explicitly */
.element {
  color: var(--color-primary, var(--color-secondary));
  color: var(--color-primary); /* If exists, override */
}
```

#### 4. **Inheritance Can Be Surprising**

```css
.parent {
  --value: 10px;
}

.child {
  /* Inherits --value from parent */
  margin: var(--value);
}

/* To prevent inheritance, set to initial */
.child {
  --value: initial;
  margin: var(--value); /* Now uses fallback or invalid */
}
```

#### 5. **Media Queries Don't Cascade Custom Properties**

```css
:root {
  --space: 1rem;
}

@media (min-width: 768px) {
  /* Must redeclare :root */
  :root {
    --space: 2rem;
  }
  
  /* This doesn't work */
  --space: 2rem; /* Invalid - no selector */
}
```

### Performance Considerations

1. **Minimal Runtime Cost**: Custom properties have negligible performance impact
2. **Repaint vs Reflow**: Changing color tokens triggers repaint, spacing tokens trigger reflow
3. **Avoid Over-Tokenizing**: Don't create tokens for every single value
4. **Use for Dynamic Values**: Prefer custom properties for values that change, not static constants

### Migration Strategy

**Step 1: Identify Common Values**
```css
/* Find repeated values */
.button { padding: 1rem; }
.card { padding: 1rem; }
```

**Step 2: Create Tokens**
```css
:root {
  --space-4: 1rem;
}
```

**Step 3: Replace with Fallbacks**
```css
.button {
  padding: var(--space-4, 1rem);
}

.card {
  padding: var(--space-4, 1rem);
}
```

**Step 4: Remove Fallbacks (after verification)**
```css
.button {
  padding: var(--space-4);
}
```

### Testing Custom Properties

```javascript
// Test that custom properties are set
function testCustomProperty(property, expectedValue) {
  const styles = getComputedStyle(document.documentElement);
  const actualValue = styles.getPropertyValue(property).trim();
  return actualValue === expectedValue;
}

// Test theme switching
function testTheme(themeName) {
  document.documentElement.dataset.theme = themeName;
  // Assert custom properties changed
}
```

---

## Conclusion

CSS custom properties are a powerful tool for:
- **Building maintainable design systems**
- **Enabling flexible theming**
- **Reducing code duplication**
- **Creating dynamic, responsive interfaces**
- **Bridging CSS and JavaScript**

By understanding their runtime behavior, following best practices, and leveraging modern patterns, custom properties can significantly simplify your codebase while providing unprecedented flexibility for theming and styling.

---

## Additional Resources

- [MDN: Using CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- [CSS Custom Properties Specification](https://www.w3.org/TR/css-variables-1/)
- [Design Tokens Community Group](https://www.designtokens.org/)
- [Container Queries Specification](https://www.w3.org/TR/css-contain-3/)
