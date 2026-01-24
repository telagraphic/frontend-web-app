# Boolean Extraction: Making Conditions Obvious

## What Does "Non-Obvious" Mean?

A condition is **non-obvious** when:
1. **The intent isn't clear** - Why these specific conditions?
2. **The logic is complex** - Multiple negations make it hard to parse
3. **The reader must think** - Can't understand at a glance
4. **The business rule is hidden** - What are we actually checking?

## Your Current Code

```js
async show() {
  // Only scroll if smoothScroll is enabled (lenis exists)
  if (!this.smoothScroll.enabled() && !this.preloader) {
    this.smoothScroll.create();
    this.smoothScroll.scrollTo(0, {immediate: true});
  }
  await this.animation.GSAPHideTransition(this.transitionOverlay);
}
```

### Why It's Non-Obvious

```js
if (!this.smoothScroll.enabled() && !this.preloader) {
  // 🤔 What does this mean?
  // - If smoothScroll is NOT enabled AND preloader is NOT present
  // - But why BOTH conditions?
  // - What's the business logic here?
  // - When would this be true?
  // - When would this be false?
}
```

**Problems:**
1. **Double negation** - `!enabled() && !preloader` requires mental parsing
2. **Unclear intent** - What are we really checking for?
3. **Hidden business rule** - When should scroll initialize?
4. **Must read comment** - Need comment to understand
5. **Easy to misread** - Could misread as OR instead of AND

## What Makes It Obvious?

### 1. Descriptive Variable Name

Instead of:
```js
if (!this.smoothScroll.enabled() && !this.preloader) {
```

Use:
```js
const shouldInitializeScroll = !this.smoothScroll.enabled() && !this.preloader;
if (shouldInitializeScroll) {
```

**Why it's better:**
- ✅ Name describes **intent** ("should initialize scroll")
- ✅ Self-documenting (no comment needed)
- ✅ Easy to understand at a glance

### 2. Positive Logic (Easier to Read)

```js
// ❌ Hard to parse (double negation)
if (!this.smoothScroll.enabled() && !this.preloader) {
  // "If NOT enabled AND NOT preloader"
}

// ✅ Easier to parse (positive logic)
const shouldInitializeScroll = 
  this.smoothScroll.enabled() === false && 
  this.preloader === null;
if (shouldInitializeScroll) {
  // "If scroll is disabled and no preloader"
}
```

Or even better, extract the conditions:

```js
const isScrollNotEnabled = !this.smoothScroll.enabled();
const hasNoPreloader = !this.preloader;
const shouldInitializeScroll = isScrollNotEnabled && hasNoPreloader;

if (shouldInitializeScroll) {
  this.smoothScroll.create();
  this.smoothScroll.scrollTo(0, { immediate: true });
}
```

### 3. Explain the Business Logic

```js
// ❌ Unclear business rule
if (!this.smoothScroll.enabled() && !this.preloader) {

// ✅ Clear business rule
const shouldInitializeScroll = 
  !this.smoothScroll.enabled() && // Scroll not initialized yet
  !this.preloader;                  // Preloader not managing scroll
if (shouldInitializeScroll) {
  // Initialize scroll ourselves since preloader isn't handling it
}
```

## Complete Refactored Examples

### Option 1: Simple Boolean Extraction

```js
async show() {
  // Initialize scroll if not already enabled and preloader isn't managing it
  const shouldInitializeScroll = 
    !this.smoothScroll.enabled() && 
    !this.preloader;
  
  if (shouldInitializeScroll) {
    this.smoothScroll.create();
    this.smoothScroll.scrollTo(0, { immediate: true });
  }
  
  await this.animation.GSAPHideTransition(this.transitionOverlay);
}
```

**Benefits:**
- ✅ Clear intent in variable name
- ✅ Easy to read
- ✅ Self-documenting

### Option 2: Extract Conditions

```js
async show() {
  const isScrollDisabled = !this.smoothScroll.enabled();
  const preloaderNotPresent = !this.preloader;
  const shouldInitializeScroll = isScrollDisabled && preloaderNotPresent;
  
  if (shouldInitializeScroll) {
    this.smoothScroll.create();
    this.smoothScroll.scrollTo(0, { immediate: true });
  }
  
  await this.animation.GSAPHideTransition(this.transitionOverlay);
}
```

**Benefits:**
- ✅ Each condition is explicit
- ✅ Very readable
- ✅ Easy to modify individual conditions

### Option 3: Invert Logic (Positive Reading)

```js
async show() {
  // Only initialize scroll if it's disabled and preloader isn't managing it
  const scrollAlreadyEnabled = this.smoothScroll.enabled();
  const preloaderManagingScroll = !!this.preloader;
  const shouldInitializeScroll = !scrollAlreadyEnabled && !preloaderManagingScroll;
  
  if (shouldInitializeScroll) {
    this.smoothScroll.create();
    this.smoothScroll.scrollTo(0, { immediate: true });
  }
  
  await this.animation.GSAPHideTransition(this.transitionOverlay);
}
```

**Benefits:**
- ✅ Positive logic is easier to understand
- ✅ Clear what we're checking

### Option 4: Extract to Helper Method (Best for Complex Logic)

```js
shouldInitializeScroll() {
  // Scroll should be initialized if:
  // 1. Scroll is not already enabled
  // 2. Preloader is not present (would have initialized it)
  return !this.smoothScroll.enabled() && !this.preloader;
}

async show() {
  if (this.shouldInitializeScroll()) {
    this.smoothScroll.create();
    this.smoothScroll.scrollTo(0, { immediate: true });
  }
  
  await this.animation.GSAPHideTransition(this.transitionOverlay);
}
```

**Benefits:**
- ✅ Reusable
- ✅ Can add JSDoc explaining business logic
- ✅ Testable independently
- ✅ Clear intent

### Option 5: Early Return Pattern

```js
async show() {
  // If scroll is already enabled, skip initialization
  if (this.smoothScroll.enabled()) {
    await this.animation.GSAPHideTransition(this.transitionOverlay);
    return;
  }
  
  // If preloader is managing scroll, skip initialization
  if (this.preloader) {
    await this.animation.GSAPHideTransition(this.transitionOverlay);
    return;
  }
  
  // Initialize scroll ourselves
  this.smoothScroll.create();
  this.smoothScroll.scrollTo(0, { immediate: true });
  await this.animation.GSAPHideTransition(this.transitionOverlay);
}
```

**Benefits:**
- ✅ Each case is explicit
- ✅ No complex boolean logic
- ✅ Easy to add more conditions

## Comparison: Before vs After

### Before (Non-Obvious)

```js
async show() {
  // Only scroll if smoothScroll is enabled (lenis exists)
  if (!this.smoothScroll.enabled() && !this.preloader) {
    // 🤔 Why both conditions?
    // 🤔 What's the business logic?
    // 🤔 When is this true/false?
    this.smoothScroll.create();
    this.smoothScroll.scrollTo(0, {immediate: true});
  }
  await this.animation.GSAPHideTransition(this.transitionOverlay);
}
```

**Issues:**
- ❌ Must read comment to understand
- ❌ Double negation hard to parse
- ❌ Unclear business rule
- ❌ Comment doesn't match code (says "if enabled" but checks "!enabled")

### After (Obvious)

```js
async show() {
  // Initialize scroll if not already enabled and preloader isn't managing it
  const shouldInitializeScroll = 
    !this.smoothScroll.enabled() && 
    !this.preloader;
  
  if (shouldInitializeScroll) {
    this.smoothScroll.create();
    this.smoothScroll.scrollTo(0, { immediate: true });
  }
  
  await this.animation.GSAPHideTransition(this.transitionOverlay);
}
```

**Benefits:**
- ✅ Self-documenting variable name
- ✅ Clear intent
- ✅ Easy to read
- ✅ Comment explains business logic (not just what code does)

## Real-World Example: Understanding the Logic

Let's trace through when each condition is true:

```js
// Scenario 1: First page load, no preloader
this.smoothScroll.enabled() // false (not created yet)
this.preloader              // null (removed after initial load)
// Result: shouldInitializeScroll = true ✅
// Action: Create scroll

// Scenario 2: First page load, preloader exists
this.smoothScroll.enabled() // false
this.preloader              // Preloader instance (exists)
// Result: shouldInitializeScroll = false ✅
// Action: Skip (preloader will handle it)

// Scenario 3: Page navigation, scroll already enabled
this.smoothScroll.enabled() // true (already created)
this.preloader              // null (removed)
// Result: shouldInitializeScroll = false ✅
// Action: Skip (already initialized)
```

**The business rule:**
> "Initialize scroll only if it's not already initialized AND the preloader isn't going to initialize it."

## When to Extract to Boolean

### ✅ Extract When:
- Multiple conditions (`&&`, `||`)
- Double/triple negation (`!`, `!!`)
- Complex logic
- Business rule not clear
- Comment needed to explain

### ❌ Don't Extract When:
- Simple, clear condition
- Already obvious
- Over-engineering

```js
// ✅ Extract this
if (!this.smoothScroll.enabled() && !this.preloader) {

// ❌ Don't extract this (already obvious)
if (this.isLoading) {

// ✅ Extract this (complex)
if (user.isAdmin && (order.total > 100 || user.hasDiscount) && !order.isCancelled) {

// ❌ Don't extract this (simple)
if (user.isAdmin) {
```

## Best Practice Recommendation

For your specific code, I recommend **Option 1 or Option 4**:

**Option 1 (Simple):**
```js
async show() {
  const shouldInitializeScroll = 
    !this.smoothScroll.enabled() && 
    !this.preloader;
  
  if (shouldInitializeScroll) {
    this.smoothScroll.create();
    this.smoothScroll.scrollTo(0, { immediate: true });
  }
  
  await this.animation.GSAPHideTransition(this.transitionOverlay);
}
```

**Option 4 (Method - if logic might grow):**
```js
shouldInitializeScroll() {
  // Initialize scroll if not already enabled and preloader isn't managing it
  return !this.smoothScroll.enabled() && !this.preloader;
}

async show() {
  if (this.shouldInitializeScroll()) {
    this.smoothScroll.create();
    this.smoothScroll.scrollTo(0, { immediate: true });
  }
  
  await this.animation.GSAPHideTransition(this.transitionOverlay);
}
```

## Summary

**"Non-obvious" means:**
- Hard to understand at a glance
- Requires mental parsing
- Business logic isn't clear
- Needs comment to explain

**Making it obvious:**
1. Extract to descriptive variable name
2. Use positive logic when possible
3. Explain the business rule
4. Break down complex conditions

**Result:**
- Self-documenting code
- Easier to read and maintain
- Clear intent
- Less likely to introduce bugs



# Functions should return what it creates and computes

## 1. **Return Values Pattern** / **Return What You Create**

A function should return what it creates or computes, not require the caller to look it up elsewhere. This is a common functional programming principle.

## 2. **Avoiding Unnecessary Indirection**

The anti-pattern you were experiencing is sometimes called:
- **Unnecessary Indirection** — requiring lookups through intermediaries
- **Registry Lookup Anti-pattern** — storing and then retrieving from a registry
- **Double Lookup Pattern** — creating → storing → retrieving

## 3. **Law of Demeter (LoD)** / **Principle of Least Knowledge**

Avoid chaining through intermediaries. Prefer direct returns so callers don’t need to know internal storage details.

## 4. **Command-Query Separation (CQS)** with nuance

Separate commands (mutations) from queries. It’s fine for a command that creates something to also return that value, so long as the side effect (registry update) and the return value are clear.

## 5. **Function Composition** / **Composability**

Returning values makes functions easier to compose and chain.

## 6. **Single Responsibility Principle (SRP)**

A function that creates something should also provide it, rather than forcing a separate lookup.

## Most accurate term:

**"Return Values Pattern"** or **"Return What You Create"** — functions should return what they create/manipulate, reducing unnecessary indirection.

The anti-pattern is sometimes called **"Unnecessary Indirection"** or **"Double Lookup Anti-pattern"**.

This aligns with functional programming principles where functions return values rather than relying on side effects (though side effects like registry updates can still exist).



# Code Changes

The code stores pages in the registry and then retrieves them, which is redundant. Here's a cleaner approach:

## Recommendation: Return page instances directly

**Current pattern (problematic):**
```javascript
// Function sets in registry
initializePage(pageTemplate) {
  const page = new pageClass(...);
  this.pageRegistry.setCurrentPage(page); // Store
  // No return
}

// Caller has to retrieve
await this.pageLoader.initializePage(template);
const page = this.pageRegistry.getCurrentPage(); // Retrieve again
```

**Better pattern:**
```javascript
// Function returns the instance
initializePage(pageTemplate) {
  const pageClass = this.pageRegistry.getPage(pageTemplate);
  const page = new pageClass(...);
  this.pageRegistry.setCurrentPage(page); // Still store for registry access
  return page; // But also return it
}

// Caller uses directly
const page = await this.pageLoader.initializePage(template);
await page.create();
await page.show();
```

## Suggested Refactoring:

1. **`initializePage()` should return the page instance:**
```javascript
initializePage(pageTemplate) {
  const pageClass = this.pageRegistry.getPage(pageTemplate);
  const elementSelector = `main[data-template="${pageTemplate}"]`;
  const page = new pageClass({
    element: elementSelector,
    smoothScroll: this.smoothScroll,
    transitionManager: this.transitionManager,
    footnotes: this.footnotes,
  });
  
  this.pageRegistry.setCurrentPage(page); // Store for other parts of app
  return page; // Return for immediate use
}
```

2. **`setupPages()` should return the page instance:**
```javascript
async setupPages(specificPage = null) {
  // ... existing logic ...
  
  this.currentPage = new PageClassFinal({...});
  this.pageRegistry.setCurrentPage(this.currentPage);
  await this.currentPage.create();
  
  return this.currentPage; // Return the page
}
```

3. **`getPage()` should return the initialized page:**
```javascript
async getPage(pageTemplate) {
  if (!this.pageRegistry.hasPage(pageTemplate)) {
    await this.loadPage(pageTemplate);
  }
  return this.initializePage(pageTemplate); // Return the page instance
}
```

4. **Then `RouterRefactor.onPageChange()` becomes cleaner:**
```javascript
await this.pageRegistry.getCurrentPage().hide(isValidRoute.normalizedPath);
this.routerHistory.updateHistory(href);
await this.pageManager.updatePage(href, isValidRoute.normalizedPath);
await nextPaint();

const page = await this.pageLoader.getPage(this.pageManager.pageTemplate);
await page.create();
await page.show();
```

## Benefits:

- No redundant registry lookups
- Clearer data flow
- Easier to test (functions return values)
- Registry still maintains state for other parts of the app
- More readable and maintainable

**Principle:** Functions should return what they create/manage, while still maintaining any necessary side effects (like storing in the registry). This gives callers the flexibility to use the return value directly or access via the registry later.


# Gaurd Clauses


This is a guard clause (or idempotency guard), not a full state machine. It’s a simple boolean flag used to prevent duplicate execution.

## Pattern: Guard Clause / Idempotency Guard

### What it is
A boolean flag that ensures a method runs only once, even if called multiple times. It makes the method idempotent.

### In your code
```javascript
preloaderAnimation() {
  if (this.animationStarted && this.preloaderAnimation) return; // ✅ Guard clause
  this.animationStarted = true; // Set flag to prevent re-entry
  
  this.preloaderAnimation = gsap.timeline({...});
}
```

### When to use
1. Preventing race conditions: multiple async callbacks could trigger the same operation
2. Ensuring idempotency: safe to call multiple times
3. Preventing duplicate operations: expensive or side-effect-heavy work
4. Protecting async operations: avoid overlapping async work

### Example scenarios
```javascript
// ✅ Good use cases:
- Animation initialization (your case)
- Event listener setup
- API request debouncing
- Modal opening/closing
- Form submission
- Component initialization

// ❌ Not needed for:
- Pure functions (no side effects)
- Simple getters/setters
- Stateless operations
```

## State machine vs guard clause

### Guard clause (what you have)
- Simple boolean flag
- Two states: not started / started
- Prevents duplicate execution
- Lightweight

```javascript
if (this.animationStarted) return; // Simple guard
this.animationStarted = true;
```

### State machine (more complex)
- Multiple states (e.g., idle, loading, loaded, error)
- Defined transitions between states
- State-specific behavior
- More structure for complex flows

```javascript
// Example state machine
this.state = 'idle'; // idle → loading → loaded → error

if (this.state === 'loading') return; // Can't start if already loading
if (this.state === 'loaded') return; // Already done
this.state = 'loading'; // Transition
```

## When to upgrade to a state machine
- More than two states
- Complex transitions
- State-specific behavior
- Need to track history or validate transitions

For your preloader, a guard clause is sufficient. If you later need states like `idle`, `loading`, `animating`, `completed`, `error`, then consider a state machine.

## Best practices
1. Set the flag immediately to prevent race conditions
2. Check the flag first (early return)
3. Use descriptive names (`animationStarted`, `isInitialized`, `hasLoaded`)
4. Reset the flag when appropriate (e.g., in `destroy()`)

Your implementation follows these practices.



# Naming Conventions



## Decision Tree for Naming

```
What does the function do?
│
├─ Creates and returns instances?
│  └─ → Use "create*" ✅
│
├─ Configures/prepares (one-time)?
│  └─ → Use "setup*" ✅
│
├─ Starts lifecycle after creation?
│  └─ → Use "init*" ✅
│
└─ Retrieves existing instance?
   └─ → Use "get*" ✅
```



### Recommended Pattern

```js
// 1. CREATE - Instances
createServices(config)  // ✅ Creates service instances
createApp()             // ✅ Creates app instance
createPage(id)          // ✅ Creates page instance

// 2. SETUP - Configuration
setupHelpers()          // ✅ Configures DOM helpers
setupPageConfig()       // ✅ Returns config
setupRoutes()           // ✅ Configures routes

// 3. INIT - Lifecycle
init()                  // ✅ Start app lifecycle
initRouter()            // ✅ Initialize router
initServices()          // ✅ Start service lifecycle

// 4. GET - Retrieve
getServices()           // ✅ Get existing services
getRouter()            // ✅ Get existing router
```

---

## Common Confusion Points

## The Semantic Difference

Naming conventions should communicate **intent** and **what the function does**. Here's the standard meaning:

| Name | Purpose | Returns | When to Use |
|------|---------|---------|-------------|
| **create** | Instantiate new instances | Object/Instance | Creating stateful objects |
| **setup** | Configure/prepare (one-time) | void/undefined | Configuration, registration |
| **init** | Initialize/start lifecycle | void/undefined | Starting after creation/setup |
| **get** | Retrieve existing | Instance/Object | Accessing created instance |


### Confusion 1: "setupServices" vs "createServices"

```js
// ❌ CONFUSING: What does setupServices return?
function setupServices() {
  // Creates instances? Configures? Registers?
}

// ✅ CLEAR: Creates and returns services
function createServices() {
  return { router, registry };
}

// ✅ ALTERNATIVE: Setup registers (no return)
function setupServices(container) {
  container.register('router', new Router());
  // No return - just registration
}
```

### Confusion 2: "init" vs "create" vs "setup"

```js
// ❌ CONFUSING: What's the difference?
createApp()
setupApp()
initApp()

// ✅ CLEAR: Each has distinct purpose
const app = createApp(); // Creates instance
setupApp(app);           // Configures app
app.init();              // Starts app lifecycle
```


---

## Summary

| Function Name | Expectation | Returns | Example |
|---------------|-------------|---------|---------|
| `create*` | Creates new instances | Object/Instance | `createServices()` |
| `setup*` | Configures/prepares | void or Config | `setupHelpers()` |
| `init*` | Starts lifecycle | void | `init()` |
| `get*` | Retrieves existing | Instance/Object | `getServices()` |

**Your current naming:**
- ✅ `createServices()` - Correct! Creates and returns
- ✅ `setupHelpers()` - Correct! Configures (no return)
- ✅ `setupPageConfig()` - Correct! Returns config

**Consistency rule:**
- **create** = Stateful instances (returns something)
- **setup** = Configuration (usually void, sometimes config)
- **init** = Lifecycle start (after creation)

This makes code self-documenting!

# Dry Utilities


---

## Benefits Summary

1. **Single Source of Truth**
   - Change selector once, updates everywhere
   - No search/replace across files

2. **Type Safety**
   - IDE autocomplete for constants
   - Catch typos at import time

3. **Easier Refactoring**
   - Rename selector? Change in one place
   - Update event name? Change once

4. **Better Testing**
   - Mock constants easily
   - Test utilities independently

5. **Self-Documenting**
   - Constants file shows all selectors/events
   - Clear naming conventions

6. **DRY Principle**
   - Shared utilities for common operations
   - No code duplication

---


## What Are "Magic Strings"?

**Magic strings** are hardcoded string literals scattered throughout your code that represent:
- CSS selectors: `".page-transition-overlay"`
- HTML attributes: `"data-template"`
- Event names: `"preloader-complete"`
- CSS classes: `".preloader"`
- Data attributes: `"data-src"`

### The Problem

```js
// ❌ BAD: Magic strings scattered everywhere
document.querySelector(".page-transition-overlay");  // In Page.js
document.querySelector(".page-transition-overlay");  // In TransitionManager.js
document.querySelector(".preloader");                // In Page.js
this.preloader.on("preloader-complete", ...);        // In App.js
element.getAttribute("data-template");               // In Router.js
document.querySelectorAll("img[data-src]");          // In Preloader.js
document.querySelectorAll("nav a");                  // In Navigation.js

// Problems:
// - Typos not caught until runtime
// - Hard to refactor (change selector? search entire codebase!)
// - No single source of truth
// - Easy to miss when updating
```

### The Solution

```js
// ✅ GOOD: Centralized constants
import { SELECTORS, ATTRIBUTES, EVENTS } from './constants/dom.js';

document.querySelector(SELECTORS.TRANSITION_OVERLAY);
document.querySelector(SELECTORS.PRELOADER);
this.preloader.on(EVENTS.PRELOADER_COMPLETE, ...);
element.getAttribute(ATTRIBUTES.DATA_TEMPLATE);

// Benefits:
// - Single source of truth
// - Typos caught at import/compile time
// - Easy to refactor (change once)
// - IDE autocomplete
// - Self-documenting
```

---

## Structure Overview

```
app/
  utils/
    constants/
      selectors.js      # CSS selectors
      attributes.js     # HTML attributes
      events.js         # Event names
    helpers/
      dom.js            # DOM utilities (existing $, $$, etc.)
      timing.js         # Timing utilities (rAF, delays, etc.)
      images.js         # Image loading utilities
```
