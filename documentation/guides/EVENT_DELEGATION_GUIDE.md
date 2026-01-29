# Event Delegation Guide: Edge Cases and Best Practices

## Table of Contents

- [Overview](#overview)
- [1. What Was the Issue?](#1-what-was-the-issue)
  - [Problem Description](#problem-description)
  - [Root Cause](#root-cause)
- [2. What Broke the Functionality?](#2-what-broke-the-functionality)
  - [The Breaking Change](#the-breaking-change)
  - [Event Phase Execution Order](#event-phase-execution-order)
- [3. How Did Navigation's `link.on("click")` Break Functionality?](#3-how-did-navigations-linkonclick-break-functionality)
  - [The Specific Problem](#the-specific-problem)
  - [Why This Caused Issues](#why-this-caused-issues)
- [4. The Solution](#4-the-solution)
  - [Final Implementation](#final-implementation)
- [5. Key Lessons and Edge Cases](#5-key-lessons-and-edge-cases)
  - [Event Delegation Best Practices](#event-delegation-best-practices)
  - [Common Edge Cases](#common-edge-cases)
  - [Event Phase Diagram](#event-phase-diagram)
- [6. Testing Event Delegation](#6-testing-event-delegation)
  - [What to Test](#what-to-test)
  - [Debugging Tips](#debugging-tips)
- [7. Summary](#7-summary)
- [8. Deep Dive: Event Phases, Capture, and Propagation Control](#8-deep-dive-event-phases-capture-and-propagation-control)
  - [Understanding the Event Propagation Lifecycle](#understanding-the-event-propagation-lifecycle)
  - [The Three Phases of Event Propagation](#the-three-phases-of-event-propagation)
  - [Complete Event Flow Example](#complete-event-flow-example)
  - [Real-World Example: Our Router Implementation](#real-world-example-our-router-implementation)
  - [Real-World Example: Footnotes with Event Delegation](#real-world-example-footnotes-with-event-delegation)
  - [Understanding `{ capture: true }`](#understanding-capture-true)
  - [Understanding `stopImmediatePropagation()`](#understanding-stopimmediatepropagation)
  - [Practical Examples: Common Web Patterns](#practical-examples-common-web-patterns)
  - [Event Phase Detection in Code](#event-phase-detection-in-code)
  - [Debugging Event Propagation](#debugging-event-propagation)
  - [Summary: Choosing the Right Approach](#summary-choosing-the-right-approach)

---

## Overview

This guide documents a critical bug that occurred when implementing event delegation for asynchronous page navigation in a single-page application (SPA). The issue involved conflicting event handlers that caused full page reloads instead of smooth async page swaps.

## 1. What Was the Issue?

### Problem Description

Internal navigation links were triggering **full page reloads** instead of asynchronous page swaps. This caused:
- The preloader to reappear on every navigation
- Complete page refreshes (losing SPA behavior)
- Poor user experience with visible page reloads

### Root Cause

The issue stemmed from **event handler execution order** and **event propagation conflicts** between two competing click handlers:

1. **Router's event delegation handler** (on `document`) - intended to handle all internal link clicks
2. **Navigation component's direct handlers** (on individual link elements) - intended to close the menu

When a user clicked an internal link:
- Both handlers would fire
- The Navigation handler would run first (in the bubbling phase)
- Even if `preventDefault()` was called, timing issues during async operations allowed the browser's default navigation to occur
- This resulted in a full page reload instead of an async swap

## 2. What Broke the Functionality?

### The Breaking Change

The functionality worked correctly **before** the Navigation component's `link.on("click")` handlers were added. The breaking sequence was:

1. **Initial State (Working):**
   - Router used event delegation on `document` with `addEventListener('click', ...)`
   - All internal links were handled by the Router
   - Navigation worked smoothly with async page swaps

2. **Breaking Change:**
   - Navigation component added direct event handlers using `link.on("click", ...)` for each menu link
   - These handlers were attached to individual `<a>` elements
   - Event handlers execute in **registration order** during the bubbling phase
   - Navigation's handlers were registered **after** the Router's delegation handler
   - However, direct element handlers often execute **before** delegation handlers in the bubbling phase

3. **Why It Broke:**
   - Navigation's handler would execute first
   - Navigation's handler didn't call `preventDefault()` initially (it was only added later as a fix attempt)
   - Even when `preventDefault()` was added, the **timing** of when it was called relative to async operations mattered
   - The browser's default navigation could still occur if `preventDefault()` wasn't called synchronously and immediately

### Event Phase Execution Order

```
User clicks link
    ↓
CAPTURE PHASE (top → target)
    ↓
TARGET PHASE (on the link element)
    ↓
BUBBLING PHASE (target → top)
    ├─ Navigation's link.on("click") handler (direct handler)
    └─ Router's document.addEventListener handler (delegation)
```

The problem: Direct handlers on elements often execute **before** delegation handlers during bubbling, even if registered later.

## 3. How Did Navigation's `link.on("click")` Break Functionality?

### The Specific Problem

The Navigation component's `setupLinkListeners()` method attached handlers directly to each link element:

```javascript
this.menuLinks.forEach((link) => {
  link.on("click", (event) => {
    // Handle menu closing logic
    // Initially: NO preventDefault() call
  });
});
```

### Why This Caused Issues

1. **Handler Execution Order:**
   - Direct handlers on elements execute during the **target phase** or early in the **bubbling phase**
   - Router's delegation handler executes later in the bubbling phase
   - Navigation's handler would run first, potentially allowing default behavior

2. **Missing `preventDefault()`:**
   - Initially, Navigation's handler didn't call `preventDefault()`
   - This allowed the browser's default link navigation to proceed
   - Even if Router's handler called `preventDefault()` later, it was too late

3. **Async Operation Timing:**
   - Even after adding `preventDefault()` to Navigation's handler, there was a race condition
   - If `preventDefault()` wasn't called **synchronously** and **immediately**, the browser could start navigation
   - Async operations in Navigation's handler (like `setTimeout` for menu closing) created timing windows where default behavior could occur

4. **Event Propagation Conflicts:**
   - Both handlers trying to manage the same event created conflicts
   - Navigation wanted to close the menu
   - Router wanted to handle navigation
   - Without proper coordination, both could interfere with each other

## 4. The Solution

### Final Implementation

The fix involved three key changes:

#### 1. Use Capture Phase for Router Handler

```javascript
document.addEventListener(EVENTS.CLICK, (event) => {
  // Handler logic
}, { capture: true }); // CRITICAL: Run in capture phase BEFORE other handlers
```

**Why:** Capture phase executes **before** the target phase, ensuring Router's handler runs first.

#### 2. Use `stopImmediatePropagation()`

```javascript
event.preventDefault();
event.stopImmediatePropagation(); // Stop ALL other handlers from running
```

**Why:** This prevents Navigation's handler from executing at all, eliminating conflicts.

#### 3. Handle Navigation Menu Closing in Router

Since `stopImmediatePropagation()` prevents Navigation's handler from running, the Router now handles menu closing:

```javascript
await this.afterPageUpdate(newPage, routeInfo);

// Close navigation menu if it's open
const navigation = document.querySelector('.navigation');
if (navigation && navigation.getAttribute('data-navigation-status') === 'active') {
  setTimeout(() => {
    navigation.setAttribute('data-navigation-status', 'not-active');
  }, 500);
}
```

**Why:** Centralizes navigation logic in one place, avoiding handler conflicts.

#### 4. Navigation Guard

Added an `isNavigating` flag to prevent concurrent navigations:

```javascript
if (this.isNavigating) {
  return;
}
this.isNavigating = true;
// ... navigation logic ...
finally {
  this.isNavigating = false;
}
```

**Why:** Prevents race conditions from rapid successive clicks.

## 5. Key Lessons and Edge Cases

### Event Delegation Best Practices

1. **Use Capture Phase for Critical Handlers:**
   - If you need your handler to run **first**, use `{ capture: true }`
   - Capture phase executes: document → target
   - Bubbling phase executes: target → document

2. **Prevent Default Immediately:**
   - Call `preventDefault()` **synchronously** and **immediately**
   - Don't wait for async operations
   - Don't call it conditionally after checks

3. **Stop Propagation When Needed:**
   - Use `stopImmediatePropagation()` to prevent **all** other handlers
   - Use `stopPropagation()` to prevent handlers on parent elements
   - Use `stopImmediatePropagation()` when you want complete control

4. **Avoid Multiple Handlers for Same Event:**
   - If possible, use a single handler with event delegation
   - If multiple handlers are needed, coordinate them explicitly
   - Consider using a single orchestrator handler that delegates to other logic

### Common Edge Cases

#### Edge Case 1: Handler Execution Order

**Problem:** You can't always predict which handler runs first based on registration order.

**Solution:** Use capture phase for handlers that must run first, or use `stopImmediatePropagation()` to prevent others.

#### Edge Case 2: Async Operations in Handlers

**Problem:** `preventDefault()` must be called synchronously. Async operations can create timing windows where default behavior occurs.

**Solution:** Always call `preventDefault()` **before** any async operations:

```javascript
// ❌ BAD
async function handler(event) {
  await someAsyncOperation();
  event.preventDefault(); // Too late!
}

// ✅ GOOD
function handler(event) {
  event.preventDefault(); // Immediately
  someAsyncOperation(); // Then async
}
```

#### Edge Case 3: Event Delegation with Nested Elements

**Problem:** When clicking nested elements (e.g., `<span>` inside `<a>`), `event.target` may not be the link.

**Solution:** Use `closest()` to find the target element:

```javascript
const anchor = event.target.closest('a.internal-link');
if (!anchor) return;
```

#### Edge Case 4: Multiple Event Handlers on Same Element

**Problem:** Multiple handlers on the same element can conflict.

**Solution:** Use `stopImmediatePropagation()` if one handler should have exclusive control, or refactor to use a single handler.

#### Edge Case 5: Browser Default Behavior Timing

**Problem:** Browsers may start navigation before async handlers complete.

**Solution:** Always call `preventDefault()` synchronously at the start of the handler, before any conditional logic or async operations.

### Event Phase Diagram

```
CAPTURE PHASE (document → target)
├─ document.addEventListener(..., { capture: true }) ← Router handler runs here
└─ ... (other capture handlers)

TARGET PHASE (on the element)
├─ element.addEventListener(...) ← Navigation handler runs here
└─ ... (other target handlers)

BUBBLING PHASE (target → document)
├─ element.addEventListener(...) ← Navigation handler also runs here
└─ document.addEventListener(...) ← Router handler runs here (without capture)
```

## 6. Testing Event Delegation

### What to Test

1. **Click on link directly** - Should work
2. **Click on nested elements** (e.g., `<span>` inside `<a>`) - Should work
3. **Rapid successive clicks** - Should prevent concurrent navigations
4. **Keyboard navigation** (Enter on focused link) - Should work
5. **Modified clicks** (Ctrl+Click, Cmd+Click, Middle-click) - Should allow default (new tab)
6. **External links** - Should allow default navigation
7. **Links with `target="_blank"`** - Should allow default navigation

### Debugging Tips

1. **Add logging to track handler execution order:**
   ```javascript
   console.log('Handler fired:', handlerName, 'Phase:', event.eventPhase);
   ```

2. **Check `event.defaultPrevented`:**
   ```javascript
   console.log('Default prevented?', event.defaultPrevented);
   ```

3. **Monitor event propagation:**
   ```javascript
   console.log('Event phase:', event.eventPhase); // 1=capture, 2=target, 3=bubbling
   ```

## 7. Summary

The core issue was **conflicting event handlers** where:
- Navigation's direct handlers executed before Router's delegation handler
- Missing or delayed `preventDefault()` calls allowed browser navigation
- Async operations created timing windows for default behavior

The fix required:
- Using **capture phase** to ensure Router's handler runs first
- Using **`stopImmediatePropagation()`** to prevent Navigation's handler from running
- Moving menu-closing logic to Router to centralize navigation handling
- Adding a **navigation guard** to prevent concurrent navigations

**Key Takeaway:** When implementing event delegation in SPAs, ensure critical handlers run first (capture phase), prevent default immediately, and coordinate multiple handlers to avoid conflicts.

---

## 8. Deep Dive: Event Phases, Capture, and Propagation Control

### Understanding the Event Propagation Lifecycle

When a user interacts with a DOM element (e.g., clicks a link), the browser fires an event that travels through the DOM in a specific order. Understanding this lifecycle is crucial for implementing robust event handling.

### The Three Phases of Event Propagation

Every DOM event goes through three distinct phases:

#### Phase 1: CAPTURE Phase (Top → Target)

**Direction:** `document` → `html` → `body` → ... → target element  
**Purpose:** Allows parent elements to intercept events **before** they reach the target  
**When it runs:** First, immediately after the event is dispatched  
**Event Phase Value:** `Event.CAPTURING_PHASE` (1)

During capture, the event travels **down** the DOM tree from the root (`document`) toward the target element. Handlers registered with `{ capture: true }` execute in this phase.

**Visual Flow:**
```
User clicks <a> inside <nav> inside <body>
    ↓
CAPTURE PHASE (descending)
document → html → body → nav → a (target)
   ↑         ↑      ↑      ↑     ↑
 Handlers execute here (if { capture: true })
```

#### Phase 2: TARGET Phase (On the Target Element)

**Direction:** Only on the target element itself  
**Purpose:** Handlers directly attached to the target element execute  
**When it runs:** Second, after capture completes  
**Event Phase Value:** `Event.AT_TARGET` (2)

The event has reached the target element. All handlers attached directly to the target execute, regardless of whether they were registered with capture or not.

**Visual Flow:**
```
Target element: <a>
    ↓
TARGET PHASE
   <a>
    ↑
 Handlers on <a> execute here
 (both capture and non-capture)
```

#### Phase 3: BUBBLING Phase (Target → Top)

**Direction:** target element → ... → `body` → `html` → `document`  
**Purpose:** Allows parent elements to handle events **after** the target  
**When it runs:** Third, after target phase completes  
**Event Phase Value:** `Event.BUBBLING_PHASE` (3)

During bubbling, the event travels **up** the DOM tree from the target back to the root. Handlers registered without `{ capture: true }` execute in this phase (default behavior).

**Visual Flow:**
```
BUBBLING PHASE (ascending)
a (target) → nav → body → html → document
   ↑        ↑      ↑      ↑         ↑
 Handlers execute here (default, no capture)
```

### Complete Event Flow Example

Let's trace a click on an internal link in our application:

```html
<body>
  <nav class="navigation">
    <a href="/section-1" class="internal-link">Section 1</a>
  </nav>
</body>
```

**Event Flow:**

```
1. CAPTURE PHASE (document → <a>)
   ├─ Router's handler (document, { capture: true })
   │  └─ Executes FIRST, prevents default, stops propagation
   ├─ <body> handlers (if any with capture)
   └─ <nav> handlers (if any with capture)

2. TARGET PHASE (<a> element)
   └─ Navigation's handler (<a> element)
      └─ BLOCKED by stopImmediatePropagation() from Router

3. BUBBLING PHASE (<a> → document)
   └─ STOPPED by stopImmediatePropagation()
```

### Real-World Example: Our Router Implementation

Looking at `app/services/Router.js`:

```javascript
setupLinkListeners() {
  // Use capture phase to run BEFORE other handlers (including Navigation component)
  document.addEventListener(EVENTS.CLICK, (event) => {
    // Try multiple ways to find the internal link
    let anchor = null;

    // First, check if the clicked element itself is an internal link
    if (
      event.target.matches &&
      event.target.matches(SELECTORS.INTERNAL_LINK)
    ) {
      anchor = event.target;
    }
    // Otherwise, try closest
    else if (event.target.closest) {
      anchor = event.target.closest(SELECTORS.INTERNAL_LINK);
    }
    // Fallback: walk up the DOM tree manually
    else {
      let element = event.target;
      while (element && element !== document) {
        if (
          element.nodeName === "A" &&
          element.classList &&
          element.classList.contains("internal-link")
        ) {
          anchor = element;
          break;
        }
        element = element.parentElement;
      }
    }

    // If the anchor is not an internal link, or the link is not a new tab, or the link is not a middle click, return
    if (
      !anchor ||
      anchor.getAttribute(ATTRIBUTES.TARGET) === VALUES.TARGET_BLANK ||
      event.metaKey ||
      event.ctrlKey ||
      event.button === 1
    ) {
      return;
    }

    // CRITICAL: Prevent default IMMEDIATELY to stop browser navigation
    // Must be called synchronously, before any async operations
    event.preventDefault();
    event.stopImmediatePropagation(); // Stop ALL other handlers from running

    // Guard against concurrent navigations
    if (this.isNavigating) {
      return;
    }

    // Get href and ensure it's a valid string
    const href = anchor.getAttribute(ATTRIBUTES.HREF);
    if (!href) {
      console.warn("Internal link has no href attribute:", anchor);
      return;
    }

    this.updatePage(href);
  }, { capture: true }); // CRITICAL: Use capture phase to run before Navigation handlers
}
```

**Why `{ capture: true }` is critical here:**
- Router must run **first** to prevent default navigation
- Navigation component has handlers on individual `<a>` elements
- Without capture, Navigation's handlers might execute first (during target/bubbling)
- Capture ensures Router intercepts the event **before** it reaches the target

**Why `stopImmediatePropagation()` is necessary:**
- Prevents Navigation's handlers from executing at all
- Stops the event from continuing to other handlers
- Ensures Router has exclusive control over navigation

### Real-World Example: Footnotes with Event Delegation

In `app/components/Footnotes.js`, we use event delegation differently:

```javascript:30:50:app/components/Footnotes.js
if (this.isEnabled && !this.onPageClick) {
  this.onPageClick = (event) => {
    const superscript = event.target.closest("a.footnote-superscript-link");
    if (superscript) {
      this.handleSuperscriptClick(event, superscript);
      return;
    }

    const footnote = event.target.closest("a.footnote-link");
    if (footnote) {
      this.handleFootnoteClick(event, footnote);
      return;
    }
  };

  this.addListenerAndRegister(
    this.elements.page,
    "click",
    this.onPageClick
  );
}
```

**Why this works without capture:**
- Only **one** handler exists for footnotes (no conflicts)
- Uses event delegation on `.page-content` (parent element)
- Uses `closest()` to find target links (handles nested elements)
- Calls `preventDefault()` immediately in handlers:

```javascript
handleSuperscriptClick(event, superscriptLink) {
  // Prevent the browser's default anchor jump immediately
  event.preventDefault();

  const href = superscriptLink.getAttribute("href");
  if (!href || !href.startsWith("#")) return;

  const footnoteId = href.substring(1);
  // Resolve the target directly by id to avoid stale NodeLists
  const footnoteTarget = this.elements.footnotes.find(
    (footnote) => footnote.id === footnoteId
  );
  if (!footnoteTarget) return;

  if (this.smoothScroll?.isEnabled?.()) {
    this.smoothScroll.scrollTo(footnoteTarget, {
      duration: 1.2,
      offset: -100,
    });
  } else {
    footnoteTarget.scrollIntoView({ behavior: "smooth" });
  }
}
```

**Key difference:** Footnotes doesn't need capture because:
- It's the only handler for footnote clicks
- No conflicting handlers exist
- Event delegation handles nested elements gracefully

### Understanding `{ capture: true }`

#### What It Does

When you add `{ capture: true }` to `addEventListener()`, the handler executes during the **capture phase** instead of the default **bubbling phase**.

**Syntax:**
```javascript
element.addEventListener('click', handler, { capture: true });
// OR (older syntax, still supported)
element.addEventListener('click', handler, true);
```

#### When to Use Capture Phase

**Use `{ capture: true }` when:**

1. **Priority Handling:**
   - Your handler must run **before** all other handlers
   - You need to intercept events at the document/window level
   - Example: Global keyboard shortcuts, accessibility handlers

2. **Event Blocking:**
   - You want to prevent other handlers from running
   - Example: Our Router preventing Navigation handlers

3. **Parent-Level Interception:**
   - You want to handle events for all children in one place
   - Example: Analytics tracking on all clicks

4. **Preventing Default Behavior Early:**
   - Need to stop default behavior before child handlers execute
   - Example: Custom link navigation in SPAs

**Common Web Patterns Using Capture:**

```javascript
// Pattern 1: Global Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeAllModals();
  }
}, { capture: true }); // Run before any component handlers

// Pattern 2: Analytics Tracking
document.addEventListener('click', (e) => {
  trackClick(e.target); // Track all clicks globally
}, { capture: true });

// Pattern 3: Accessibility: Focus Management
document.addEventListener('focusin', (e) => {
  if (!isAccessible(e.target)) {
    e.preventDefault(); // Block focus on inaccessible elements
  }
}, { capture: true });

// Pattern 4: SPA Navigation (Our Router)
document.addEventListener('click', routerHandler, { capture: true });
```

#### When NOT to Use Capture

**Avoid capture when:**

1. **Multiple Handlers Needed:**
   - Other handlers should also execute
   - You're not trying to block them
   - Example: Footnotes - no conflicts, let handlers coexist

2. **Component-Level Logic:**
   - Handler is specific to one component
   - No need for global priority
   - Example: Button click handlers in components

3. **Event Delegation Without Conflicts:**
   - Only one handler for the event
   - No need for execution priority
   - Example: Delegating clicks on a list

### Understanding `stopImmediatePropagation()`

#### What It Does

`stopImmediatePropagation()` does two things:
1. **Prevents other handlers** on the **same element** from executing
2. **Stops event propagation** entirely (capture and bubbling both stop)

**Comparison with other propagation methods:**

```javascript
// Method 1: preventDefault()
event.preventDefault();
// Only prevents browser default behavior (e.g., link navigation)
// Does NOT stop propagation or other handlers

// Method 2: stopPropagation()
event.stopPropagation();
// Stops event from reaching parent/child elements
// Other handlers on the SAME element still execute

// Method 3: stopImmediatePropagation()
event.stopImmediatePropagation();
// Stops ALL other handlers on same element
// Stops propagation to parent/child elements
// Most aggressive - complete control
```

#### Visual Comparison

**Scenario:** Click on `<a>` with multiple handlers

```javascript
// Handler registration order:
document.addEventListener('click', handler1, { capture: true }); // 1st
link.addEventListener('click', handler2); // 2nd
link.addEventListener('click', handler3); // 3rd
document.addEventListener('click', handler4); // 4th (bubbling)
```

**With NO stop methods:**
```
1. handler1 (capture) ✓
2. handler2 (target) ✓
3. handler3 (target) ✓
4. handler4 (bubbling) ✓
```

**With `stopPropagation()` in handler2:**
```
1. handler1 (capture) ✓
2. handler2 (target) ✓ → calls stopPropagation()
3. handler3 (target) ✓ (same element, still runs)
4. handler4 (bubbling) ✗ (propagation stopped)
```

**With `stopImmediatePropagation()` in handler2:**
```
1. handler1 (capture) ✓
2. handler2 (target) ✓ → calls stopImmediatePropagation()
3. handler3 (target) ✗ (blocked by stopImmediatePropagation)
4. handler4 (bubbling) ✗ (propagation stopped)
```

#### When to Use `stopImmediatePropagation()`

**Use `stopImmediatePropagation()` when:**

1. **Exclusive Handler Control:**
   - One handler should have complete control
   - Other handlers should not execute at all
   - Example: Our Router preventing Navigation handlers

2. **Preventing Conflicts:**
   - Multiple handlers might conflict
   - Only one should handle the event
   - Example: Preventing analytics handlers from interfering with navigation

3. **Event Interception:**
   - Intercepting events at a high level
   - Preventing lower-level handlers from running
   - Example: Modal overlay intercepting all clicks

**Common Web Patterns:**

```javascript
// Pattern 1: Exclusive Navigation Handler (Our Use Case)
document.addEventListener('click', (e) => {
  if (isInternalLink(e.target)) {
    e.preventDefault();
    e.stopImmediatePropagation(); // Block all other handlers
    handleNavigation(e.target);
  }
}, { capture: true });

// Pattern 2: Modal Overlay Click Handler
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) {
    closeModal();
    e.stopImmediatePropagation(); // Prevent other click handlers
  }
});

// Pattern 3: Drag and Drop - Exclusive Control
draggableElement.addEventListener('mousedown', (e) => {
  startDrag(e);
  e.stopImmediatePropagation(); // Prevent other mousedown handlers
});
```

#### When NOT to Use `stopImmediatePropagation()`

**Avoid when:**

1. **Multiple Valid Handlers:**
   - Several handlers should all execute
   - They don't conflict with each other
   - Example: Analytics + logging + UI update

2. **Component Lifecycle:**
   - Components need to clean up
   - Handlers should complete normally
   - Example: Component destroy handlers

3. **Progressive Enhancement:**
   - Want to allow multiple libraries to handle events
   - Don't want to block third-party code
   - Example: Accessibility library + your code

### Practical Examples: Common Web Patterns

#### Pattern 1: SPA Link Interception (Our Router)

**Goal:** Intercept all internal links, prevent default navigation, handle via AJAX

**Implementation:**
```javascript
document.addEventListener('click', (e) => {
  const link = e.target.closest('a.internal-link');
  if (!link) return;
  
  // Run in capture phase to intercept early
  e.preventDefault();
  e.stopImmediatePropagation(); // Block other handlers
  
  handleSPANavigation(link.href);
}, { capture: true });
```

**Why capture + stopImmediatePropagation:**
- Capture: Run before any component handlers
- stopImmediatePropagation: Prevent conflicts with Navigation component

#### Pattern 2: Event Delegation on Dynamic Lists

**Goal:** Handle clicks on dynamically added list items

**Implementation:**
```javascript
// No capture needed - no conflicts
listContainer.addEventListener('click', (e) => {
  const item = e.target.closest('.list-item');
  if (!item) return;
  
  handleItemClick(item);
});
```

**Why no capture:**
- Only one handler exists
- No need for priority
- Standard delegation pattern

#### Pattern 3: Global Keyboard Shortcuts

**Goal:** Handle Escape key to close modals globally

**Implementation:**
```javascript
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeAllModals();
    e.stopImmediatePropagation(); // Prevent component handlers
  }
}, { capture: true });
```

**Why capture + stopImmediatePropagation:**
- Capture: Run before any component handlers
- stopImmediatePropagation: Prevent modal-specific handlers from interfering

#### Pattern 4: Click-Outside Detection

**Goal:** Close dropdown when clicking outside

**Implementation:**
```javascript
document.addEventListener('click', (e) => {
  if (!dropdown.contains(e.target)) {
    closeDropdown();
    // Don't stop propagation - let other handlers run
  }
}, { capture: true }); // Capture to check before dropdown's own handler
```

**Why capture only:**
- Need to check before dropdown's handler
- But don't want to block other handlers
- No stopImmediatePropagation needed

#### Pattern 5: Form Validation Interception

**Goal:** Prevent form submission if validation fails

**Implementation:**
```javascript
form.addEventListener('submit', (e) => {
  if (!isFormValid()) {
    e.preventDefault();
    e.stopImmediatePropagation(); // Block other submit handlers
    showValidationErrors();
    return;
  }
  // If valid, let default behavior proceed
});
```

**Why stopImmediatePropagation:**
- Prevent other submit handlers from running if invalid
- But allow default submission if valid (no preventDefault)

### Event Phase Detection in Code

You can determine which phase your handler is executing in:

```javascript
element.addEventListener('click', (e) => {
  switch(e.eventPhase) {
    case Event.CAPTURING_PHASE: // 1
      console.log('Capture phase');
      break;
    case Event.AT_TARGET: // 2
      console.log('Target phase');
      break;
    case Event.BUBBLING_PHASE: // 3
      console.log('Bubbling phase');
      break;
  }
});
```

### Debugging Event Propagation

**Helpful debugging techniques:**

```javascript
// 1. Log event phase
document.addEventListener('click', (e) => {
  console.log('Phase:', e.eventPhase, 'Target:', e.target);
}, { capture: true });

// 2. Check if default was prevented
document.addEventListener('click', (e) => {
  if (e.defaultPrevented) {
    console.log('Default was prevented by another handler');
  }
});

// 3. Track handler execution order
let handlerOrder = 0;
document.addEventListener('click', () => {
  console.log('Handler 1:', ++handlerOrder);
}, { capture: true });
document.addEventListener('click', () => {
  console.log('Handler 2:', ++handlerOrder);
});
```

### Summary: Choosing the Right Approach

| Scenario | Capture? | stopImmediatePropagation? | Why |
|----------|----------|---------------------------|-----|
| SPA Navigation (conflicts) | ✅ Yes | ✅ Yes | Must run first, block conflicts |
| Event Delegation (no conflicts) | ❌ No | ❌ No | Standard delegation, no priority needed |
| Global Keyboard Shortcuts | ✅ Yes | ✅ Yes | Run before all, prevent conflicts |
| Click-Outside Detection | ✅ Yes | ❌ No | Check early, but allow other handlers |
| Form Validation | ❌ No | ✅ Yes | Block invalid submissions, allow valid |
| Component-Level Handlers | ❌ No | ❌ No | Local scope, no conflicts |

**Key Principles:**
1. Use **capture** when you need priority or early interception
2. Use **stopImmediatePropagation** when you need exclusive control
3. Use **both** when you need to prevent conflicts (like our Router)
4. Use **neither** for standard event delegation without conflicts
