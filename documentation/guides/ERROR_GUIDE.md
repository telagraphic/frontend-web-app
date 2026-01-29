# Error propagation in JavaScript

Short answer: errors thrown in child functions propagate up to the parent try-catch. The try-catch catches errors from the entire call stack within the try block.

## Table of Contents

- [Summary: where try-catch is needed](#summary-where-try-catch-is-needed)
- [Best practice rule](#best-practice-rule)
- [When to use try-catch: Use cases and non-use cases](#when-to-use-try-catch-use-cases-and-non-use-cases)
  - [✅ Use try-catch for: Operations that can throw errors](#-use-try-catch-for-operations-that-can-throw-errors)
    - [1. Async operations (fetch, promises, async/await)](#1-async-operations-fetch-promises-asyncawait)
    - [2. Animations (GSAP timelines, animation errors)](#2-animations-gsap-timelines-animation-errors)
    - [3. DOM updates (querySelector, DOM manipulation)](#3-dom-updates-queryselector-dom-manipulation)
    - [4. JSON parsing and data transformation](#4-json-parsing-and-data-transformation)
    - [5. External API calls and third-party libraries](#5-external-api-calls-and-third-party-libraries)
    - [6. File operations and resource loading](#6-file-operations-and-resource-loading)
  - [❌ Don't use try-catch for: Operations that don't throw errors](#-dont-use-try-catch-for-operations-that-dont-throw-errors)
    - [1. Simple property access (when null/undefined is expected)](#1-simple-property-access-when-nullundefined-is-expected)
    - [2. Simple assignments and variable declarations](#2-simple-assignments-and-variable-declarations)
    - [3. Simple conditionals and boolean operations](#3-simple-conditionals-and-boolean-operations)
    - [4. Operations that return null/undefined instead of throwing](#4-operations-that-return-nullundefined-instead-of-throwing)
    - [5. Simple arithmetic and string operations](#5-simple-arithmetic-and-string-operations)
    - [6. Simple object/array access (when using optional chaining)](#6-simple-objectarray-access-when-using-optional-chaining)
  - [Decision matrix: When to use try-catch](#decision-matrix-when-to-use-try-catch)
  - [Best practices summary](#best-practices-summary)
- [How error propagation works](#how-error-propagation-works)
  - [Rule 1: Errors bubble up the call stack](#rule-1-errors-bubble-up-the-call-stack)
  - [Rule 2: Try-catch catches errors from the entire call chain](#rule-2-try-catch-catches-errors-from-the-entire-call-chain)
- [Flowchart: error propagation](#flowchart-error-propagation)
- [Detailed sequence table](#detailed-sequence-table)
- [What triggers the catch block](#what-triggers-the-catch-block)
  - [1. Errors thrown in child functions](#1-errors-thrown-in-child-functions)
  - [2. Rejected promises (async/await)](#2-rejected-promises-asyncawait)
  - [3. Explicit throw statements](#3-explicit-throw-statements)
  - [4. Synchronous errors in try block](#4-synchronous-errors-in-try-block)
- [What does not trigger catch](#what-does-not-trigger-catch)
  - [1. Returned values (not errors)](#1-returned-values-not-errors)
  - [2. Errors caught in child try-catch](#2-errors-caught-in-child-try-catch)
  - [3. Errors thrown outside try block](#3-errors-thrown-outside-try-block)
- [Complete example with error propagation](#complete-example-with-error-propagation)
- [Visual error propagation path](#visual-error-propagation-path)
- [Key takeaways](#key-takeaways)
- [Practical example](#practical-example)
- [Try...Catch...Finally Use Case](#trycatchfinally-use-case)
  - [When to use `finally`](#when-to-use-finally)
  - [Common `finally` use cases](#common-finally-use-cases)
  - [What not to put in `finally`](#what-not-to-put-in-finally)
  - [Recommended pattern for your code](#recommended-pattern-for-your-code)
  - [Summary](#summary-1)
- [Don't Nest Try...Catch Blocks](#dont-nest-trycatch-blocks)
  - [Current flow (problematic)](#current-flow-problematic)
  - [When to use try-catch: decision tree](#when-to-use-try-catch-decision-tree)
  - [Recommended pattern for your code](#recommended-pattern-for-your-code-1)
  - [Error propagation flow](#error-propagation-flow)

---

## Summary: where try-catch is needed

| Function | Current | Recommended | Reason |
|----------|---------|-------------|--------|
| `updatePage` | ✅ Has try-catch | ✅ Keep it | Orchestrator - handles all errors |
| `beforePageUpdate` | ❌ No try-catch | ✅ No try-catch | Let errors bubble up |
| `startPageUpdate` | ❌ Has nested try-catch | ✅ Remove try-catch | Let errors bubble up (or re-throw if cleanup needed) |
| `afterPageUpdate` | ❌ No try-catch | ✅ No try-catch | Let errors bubble up |

## Best practice rule

Default: let errors bubble up to the orchestrator.

Add local try-catch only if you need:
- Specific cleanup before re-throwing
- Error transformation
- Non-critical error handling (swallow)

Your parent `updatePage` try-catch should handle all errors from the orchestrated steps. Remove the nested try-catch blocks in `startPageUpdate` and let errors propagate, or re-throw after cleanup if needed.

## When to use try-catch: Use cases and non-use cases

### ✅ Use try-catch for: Operations that can throw errors

#### 1. Async operations (fetch, promises, async/await)

**Why:** Network requests, promise rejections, and async operations can fail unpredictably.

```javascript
// ✅ GOOD: Wrap async operations
async requestPage(href) {
  try {
    const res = await fetch(href);
    if (!res.ok) {
      throw new Error(`Failed to fetch: ${res.status}`);
    }
    return await res.text();
  } catch (error) {
    // Handle network errors, timeouts, CORS issues
    console.error('Fetch error:', error);
    throw error; // Re-throw to parent
  }
}

// ✅ GOOD: Promise chains
async loadPageClass(template) {
  try {
    const module = await import(`./pages/${template}.js`);
    return module.default;
  } catch (error) {
    // Handle module not found, syntax errors, import failures
    console.error('Import error:', error);
    throw error;
  }
}
```

#### 2. Animations (GSAP timelines, animation errors)

**Why:** Animation libraries can throw errors, and animation operations can fail.

```javascript
// ✅ GOOD: Wrap animation operations
async showPageTransition(element) {
  try {
    const timeline = gsap.timeline({
      onComplete: () => resolve(),
    });
    
    timeline.to(element, {
      opacity: 1,
      duration: 0.5
    });
  } catch (error) {
    // Handle GSAP errors, invalid properties, missing elements
    console.warn('Animation error:', error);
    // Continue execution - page should still show
    resolve(); // Don't block page display
  }
}

// ✅ GOOD: Animation cleanup
destroyPageAnimations() {
  try {
    this.animationTimelines.forEach((timeline) => {
      timeline.kill(); // Can throw if timeline is invalid
    });
  } catch (error) {
    console.error('Error killing animations:', error);
    // Continue cleanup even if some fail
  }
}
```

#### 3. DOM updates (querySelector, DOM manipulation)

**Why:** DOM operations can fail if elements don't exist or DOM is in invalid state.

```javascript
// ✅ GOOD: DOM operations that can fail
async updateDOM(html) {
  try {
    const newPageDOM = new DOMParser().parseFromString(html, "text/html");
    const newPage = newPageDOM.querySelector("main");
    
    if (!newPage) {
      throw new Error("No main element found in page HTML");
    }
    
    // DOM manipulation that can throw
    this.pageContainer.replaceChildren(newPage);
    return this.pageContainer;
  } catch (error) {
    // Handle DOM parsing errors, missing elements, invalid HTML
    console.error('DOM update error:', error);
    throw error;
  }
}

// ✅ GOOD: Element access that might fail
createElements() {
  try {
    this.element = document.querySelector(this.selector);
    if (!this.element) {
      throw new Error(`Element not found: ${this.selector}`);
    }
  } catch (error) {
    // Handle missing elements
    console.error('Element creation error:', error);
    throw error;
  }
}
```

#### 4. JSON parsing and data transformation

**Why:** JSON parsing can throw SyntaxError, data transformation can fail.

```javascript
// ✅ GOOD: JSON parsing
function parseConfig(jsonString) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    // Handle invalid JSON
    console.error('JSON parse error:', error);
    return null; // Return fallback
  }
}

// ✅ GOOD: Data transformation
function transformRouteData(data) {
  try {
    return {
      route: data.template.toLowerCase(),
      url: new URL(data.url, window.location.origin).href
    };
  } catch (error) {
    // Handle invalid URLs, missing properties
    console.error('Data transformation error:', error);
    throw error;
  }
}
```

#### 5. External API calls and third-party libraries

**Why:** External services can fail, third-party code can throw unexpected errors.

```javascript
// ✅ GOOD: External API calls
async fetchExternalData(url) {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    // Handle network errors, API errors, parsing errors
    console.error('API error:', error);
    throw error;
  }
}
```

#### 6. File operations and resource loading

**Why:** File operations can fail due to permissions, missing files, or I/O errors.

```javascript
// ✅ GOOD: Image loading
async loadImage(src) {
  try {
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = src;
    });
    return img;
  } catch (error) {
    // Handle image load failures
    console.error('Image load error:', error);
    throw error;
  }
}
```

### ❌ Don't use try-catch for: Operations that don't throw errors

#### 1. Simple property access (when null/undefined is expected)

**Why:** Accessing properties on null/undefined returns undefined, doesn't throw (unless using optional chaining incorrectly).

```javascript
// ❌ BAD: Unnecessary try-catch
function getElementText(element) {
  try {
    return element.textContent; // Doesn't throw, returns undefined if element is null
  } catch (error) {
    return '';
  }
}

// ✅ GOOD: Simple null check
function getElementText(element) {
  return element?.textContent || '';
}

// ✅ GOOD: Explicit check
function getElementText(element) {
  if (!element) return '';
  return element.textContent;
}
```

#### 2. Simple assignments and variable declarations

**Why:** Assignments don't throw errors (unless you're assigning to read-only properties, which is rare).

```javascript
// ❌ BAD: Unnecessary try-catch
function setPageTitle(title) {
  try {
    this.title = title; // Simple assignment doesn't throw
  } catch (error) {
    console.error(error);
  }
}

// ✅ GOOD: Direct assignment
function setPageTitle(title) {
  this.title = title;
}
```

#### 3. Simple conditionals and boolean operations

**Why:** Conditionals and boolean operations don't throw errors.

```javascript
// ❌ BAD: Unnecessary try-catch
function isValidRoute(route) {
  try {
    return route && route.length > 0; // Doesn't throw
  } catch (error) {
    return false;
  }
}

// ✅ GOOD: Direct return
function isValidRoute(route) {
  return route && route.length > 0;
}
```

#### 4. Operations that return null/undefined instead of throwing

**Why:** Many DOM methods return null instead of throwing when elements aren't found.

```javascript
// ❌ BAD: Unnecessary try-catch
function findElement(selector) {
  try {
    return document.querySelector(selector); // Returns null if not found, doesn't throw
  } catch (error) {
    return null;
  }
}

// ✅ GOOD: Direct query with null check
function findElement(selector) {
  const element = document.querySelector(selector);
  if (!element) {
    console.warn(`Element not found: ${selector}`);
    return null;
  }
  return element;
}
```

#### 5. Simple arithmetic and string operations

**Why:** Basic math and string operations don't throw errors (except division by zero, which returns Infinity).

```javascript
// ❌ BAD: Unnecessary try-catch
function calculatePercentage(loaded, total) {
  try {
    return Math.round((loaded / total) * 100); // Division by zero returns Infinity, doesn't throw
  } catch (error) {
    return 0;
  }
}

// ✅ GOOD: Direct calculation with guard
function calculatePercentage(loaded, total) {
  if (total === 0) return 0;
  return Math.round((loaded / total) * 100);
}
```

#### 6. Simple object/array access (when using optional chaining)

**Why:** Optional chaining (`?.`) returns undefined instead of throwing.

```javascript
// ❌ BAD: Unnecessary try-catch with optional chaining
function getNestedProperty(obj) {
  try {
    return obj?.property?.nested; // Optional chaining returns undefined, doesn't throw
  } catch (error) {
    return undefined;
  }
}

// ✅ GOOD: Direct optional chaining
function getNestedProperty(obj) {
  return obj?.property?.nested;
}
```

### Decision matrix: When to use try-catch

| Operation Type | Can Throw? | Use try-catch? | Example |
|----------------|------------|----------------|---------|
| `fetch()` | ✅ Yes | ✅ Yes | Network requests |
| `await import()` | ✅ Yes | ✅ Yes | Dynamic imports |
| `JSON.parse()` | ✅ Yes | ✅ Yes | JSON parsing |
| `gsap.timeline()` | ✅ Yes | ✅ Yes | Animation operations |
| `new DOMParser()` | ✅ Yes | ✅ Yes | DOM parsing |
| `element.querySelector()` | ❌ No (returns null) | ❌ No | Use null check instead |
| `obj.property` | ❌ No (returns undefined) | ❌ No | Use optional chaining |
| `array[index]` | ❌ No (returns undefined) | ❌ No | Check length first |
| `a + b` | ❌ No | ❌ No | Simple arithmetic |
| `obj.prop = value` | ❌ No | ❌ No | Simple assignment |
| `if (condition)` | ❌ No | ❌ No | Simple conditional |

### Best practices summary

1. **Use try-catch for:**
   - Async operations (fetch, promises, async/await)
   - Operations that explicitly throw errors
   - Third-party library calls that can fail
   - Operations where errors are expected and need handling

2. **Don't use try-catch for:**
   - Simple property access (use optional chaining or null checks)
   - Operations that return null/undefined instead of throwing
   - Simple assignments and conditionals
   - Operations that can't fail

3. **General rule:**
   - If an operation can throw an error that would crash your app, use try-catch
   - If an operation returns a value (null/undefined) that you can check, use conditional logic instead

## How error propagation works

### Rule 1: Errors bubble up the call stack
When an error is thrown in a child function, it propagates up to the nearest try-catch block.

### Rule 2: Try-catch catches errors from the entire call chain
The try-catch in `updatePage()` will catch errors thrown by:
- `updatePage()` itself
- `requestPage()` (child)
- `updateDOM()` (child)
- `updateFields()` (child)
- Any functions called by those children (grandchildren, etc.)

## Flowchart: error propagation

```
┌─────────────────────────────────────────────────────────────┐
│ updatePage(href)                                            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ try {                                                    │ │
│ │                                                          │ │
│ │   ┌──────────────────────────────────────────────────┐  │ │
│ │   │ await requestPage(href)                          │  │ │
│ │   │   ┌────────────────────────────────────────────┐ │  │ │
│ │   │   │ fetch(href) throws NetworkError          │ │  │ │
│ │   │   │ ❌ ERROR THROWN HERE                       │ │  │ │
│ │   │   └────────────────────────────────────────────┘ │  │ │
│ │   │   ⬆️ ERROR PROPAGATES UP                         │  │ │
│ │   └──────────────────────────────────────────────────┘  │ │
│ │   ⬆️ ERROR CONTINUES UP                                │ │
│ │                                                          │ │
│ │   ┌──────────────────────────────────────────────────┐  │ │
│ │   │ await updateDOM(html)                             │  │ │
│ │   │   ┌────────────────────────────────────────────┐ │  │ │
│ │   │   │ newPage.querySelector() throws TypeError   │ │  │ │
│ │   │   │ ❌ ERROR THROWN HERE                       │ │  │ │
│ │   │   └────────────────────────────────────────────┘ │  │ │
│ │   │   ⬆️ ERROR PROPAGATES UP                         │  │ │
│ │   └──────────────────────────────────────────────────┘  │ │
│ │   ⬆️ ERROR CONTINUES UP                                │ │
│ │                                                          │ │
│ │   ┌──────────────────────────────────────────────────┐  │ │
│ │   │ await updateFields(newPage)                       │  │ │
│ │   │   ┌────────────────────────────────────────────┐ │  │ │
│ │   │   │ preloadImages() throws Error               │ │  │ │
│ │   │   │ ❌ ERROR THROWN HERE                       │ │  │ │
│ │   │   └────────────────────────────────────────────┘ │  │ │
│ │   │   ⬆️ ERROR PROPAGATES UP                         │  │ │
│ │   └──────────────────────────────────────────────────┘  │ │
│ │   ⬆️ ERROR CONTINUES UP                                │ │
│ │                                                          │ │
│ │ } catch (error) {                                       │ │
│ │   ✅ CATCHES ALL ERRORS FROM ABOVE                     │ │
│ │   console.error('Error:', error);                      │ │
│ │   this.routerResolver.redirectToHome();                │ │
│ │ }                                                       │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Detailed sequence table

| Step | Function | Action | Error thrown? | Propagation | Caught by |
|------|----------|--------|---------------|-------------|-----------|
| 1 | `updatePage()` | Enters try block | No | - | - |
| 2 | `updatePage()` | Calls `await requestPage(href)` | No | - | - |
| 3 | `requestPage()` | Executes `fetch(href)` | No | - | - |
| 4 | `fetch()` | Network request fails | Yes (NetworkError) | ⬆️ Up | - |
| 5 | `requestPage()` | Receives error from `fetch()` | No | ⬆️ Up | - |
| 6 | `requestPage()` | No try-catch, error continues | No | ⬆️ Up | - |
| 7 | `updatePage()` | Receives error from `requestPage()` | No | - | ✅ Catch block |
| 8 | `updatePage()` | Catch block executes | No | - | - |

## What triggers the catch block

### 1. Errors thrown in child functions

```javascript
async updatePage(href) {
  try {
    const html = await this.requestPage(href);
    // If requestPage() throws an error, it's caught here
  } catch (error) {
    // ✅ Catches errors from requestPage()
  }
}

async requestPage(href) {
  const res = await fetch(href); // ❌ Throws NetworkError
  // Error propagates up to updatePage() catch block
}
```

### 2. Rejected promises (async/await)

```javascript
async updatePage(href) {
  try {
    const html = await this.requestPage(href);
    // If requestPage() returns a rejected promise, it's caught here
  } catch (error) {
    // ✅ Catches promise rejections
  }
}

async requestPage(href) {
  return Promise.reject(new Error('Failed')); // ❌ Rejected promise
  // Becomes an error when awaited, caught by parent catch
}
```

### 3. Explicit throw statements

```javascript
async updatePage(href) {
  try {
    if (!href) {
      throw new Error('No href provided'); // ❌ Explicit throw
    }
    const html = await this.requestPage(href);
  } catch (error) {
    // ✅ Catches explicit throws
  }
}
```

### 4. Synchronous errors in try block

```javascript
async updatePage(href) {
  try {
    const obj = null;
    obj.property; // ❌ TypeError: Cannot read property
  } catch (error) {
    // ✅ Catches synchronous errors
  }
}
```

## What does not trigger catch

### 1. Returned values (not errors)

```javascript
async requestPage(href) {
  if (!href) return null; // ✅ Returns null, NOT an error
  // This does NOT trigger catch in parent
}
```

### 2. Errors caught in child try-catch

```javascript
async requestPage(href) {
  try {
    await fetch(href);
  } catch (error) {
    console.error(error); // ✅ Error caught here
    return null; // Returns null instead of throwing
  }
  // Parent catch won't see this error
}
```

### 3. Errors thrown outside try block

```javascript
async updatePage(href) {
  // ❌ Error thrown here is NOT caught
  throw new Error('Outside try block');
  
  try {
    // ...
  } catch (error) {
    // Won't catch the error above
  }
}
```

## Complete example with error propagation

```javascript
async updatePage(href) {
  try {
    // Step 1: Call requestPage
    const html = await this.requestPage(href);
    // ✅ If requestPage throws, error propagates here
    
    if (!html) return this.routerResolver.redirectToHome();
    
    // Step 2: Call updateDOM
    const newPage = await this.updateDOM(html);
    // ✅ If updateDOM throws, error propagates here
    
    // Step 3: Call updateFields
    await this.updateFields(newPage);
    // ✅ If updateFields throws, error propagates here
    
  } catch (error) {
    // ✅ CATCHES ERRORS FROM:
    // - requestPage() and all its children
    // - updateDOM() and all its children
    // - updateFields() and all its children
    // - Any explicit throws in updatePage()
    
    console.error('Error updating page:', error);
    this.routerResolver.redirectToHome();
  }
}

async requestPage(href) {
  // ❌ NO try-catch here
  // If fetch() throws, error propagates to updatePage() catch
  
  if (!href) return null;
  const res = await fetch(href); // ❌ Can throw NetworkError
  if (!res.ok) return null;
  return await res.text(); // ❌ Can throw parsing error
}

async updateDOM(html) {
  // ❌ NO try-catch here
  // If any error occurs, it propagates to updatePage() catch
  
  const newPageDOM = new DOMParser().parseFromString(html, "text/html");
  const newPage = newPageDOM.querySelector("main");
  // ❌ If newPage is null and you call methods on it, throws TypeError
  
  return this.pageContainer; // ❌ If this.pageContainer is undefined, can throw
}
```

## Visual error propagation path

```
Error Thrown in:          Propagation Path:              Caught By:
─────────────────────────────────────────────────────────────────────
fetch() in requestPage()  ⬆️ requestPage()              ✅ updatePage() catch
                         ⬆️ updatePage() try block
                         ⬆️ updatePage() catch block

querySelector() in        ⬆️ updateDOM()                 ✅ updatePage() catch
updateDOM()              ⬆️ updatePage() try block
                        ⬆️ updatePage() catch block

preloadImages() in        ⬆️ updateFields()              ✅ updatePage() catch
updateFields()           ⬆️ updatePage() try block
                        ⬆️ updatePage() catch block
```

## Key takeaways

1. Errors bubble up: thrown errors propagate to the nearest try-catch.
2. Try-catch covers the call chain: errors from child functions are caught by the parent try-catch.
3. Await converts rejections: rejected promises become thrown errors when awaited.
4. Return values are not errors: returning `null` or a value does not trigger catch.
5. Caught errors don't propagate: if a child has its own try-catch and handles the error, the parent won't see it.

## Practical example

```javascript
async updatePage(href) {
  try {
    // ✅ All errors from these calls are caught here
    const html = await this.requestPage(href);
    const newPage = await this.updateDOM(html);
    await this.updateFields(newPage);
  } catch (error) {
    // ✅ Catches:
    // - NetworkError from fetch() in requestPage()
    // - TypeError from querySelector() in updateDOM()
    // - Any error from preloadImages() in updateFields()
    // - Any explicit throw in any of these functions
    
    console.error('Error updating page:', error);
    this.routerResolver.redirectToHome();
  }
}
```

This pattern ensures all errors in the chain are handled in one place.





# Try...Catch...Finally Use Case

Clarifying `finally` usage:

- `finally` runs always, whether the try succeeds or an error is caught.
- It's for cleanup that must run regardless of outcome.
- Do not put success-only code (like `await this.updateFields`) in `finally`.

## When to use `finally`

Use `finally` for cleanup that must run regardless of success or failure:

```javascript
async updatePage(href) {
  let isLoading = true;
  
  try {
    this.setLoadingState(true); // Show loading spinner
    const html = await this.requestPage(href);
    if (!html) {
      this.routerResolver.redirectToHome();
      return;
    }
    
    const newPage = await this.updateDOM(html);
    if (!newPage) {
      this.routerResolver.redirectToHome();
      return;
    }
    
    await this.updateFields(newPage); // ✅ Only runs on success
  } catch (error) {
    console.error('Error updating page:', error);
    this.routerResolver.redirectToHome();
  } finally {
    // ✅ ALWAYS runs - cleanup code
    this.setLoadingState(false); // Hide loading spinner
    this.abortController = null; // Clean up abort controller
  }
}
```

## Common `finally` use cases

### 1. Cleanup state/flags
```javascript
try {
  this.isNavigating = true;
  await this.navigate();
} catch (error) {
  console.error(error);
} finally {
  this.isNavigating = false; // ✅ Always reset flag
}
```

### 2. Close connections/resources
```javascript
let connection = null;
try {
  connection = await openConnection();
  await connection.send(data);
} catch (error) {
  console.error(error);
} finally {
  if (connection) {
    connection.close(); // ✅ Always close, even on error
  }
}
```

### 3. Reset UI state
```javascript
try {
  this.showLoadingSpinner();
  await this.loadData();
} catch (error) {
  this.showError(error);
} finally {
  this.hideLoadingSpinner(); // ✅ Always hide spinner
}
```

### 4. Abort controller cleanup
```javascript
try {
  this.abortController = new AbortController();
  await this.fetchData({ signal: this.abortController.signal });
} catch (error) {
  if (error.name !== 'AbortError') {
    console.error(error);
  }
} finally {
  this.abortController = null; // ✅ Always clean up
}
```

## What not to put in `finally`

Do not put success-only code in `finally`:

```javascript
// ❌ WRONG - updateFields should only run on success
async updatePage(href) {
  try {
    const html = await this.requestPage(href);
    const newPage = await this.updateDOM(html);
  } catch (error) {
    console.error(error);
    this.routerResolver.redirectToHome();
  } finally {
    await this.updateFields(newPage); // ❌ BAD! Runs even if newPage is undefined
  }
}
```

## Recommended pattern for your code

For `updatePage`, use this structure:

```javascript
async updatePage(href) {
  try {
    const html = await this.requestPage(href);
    if (!html) {
      this.routerResolver.redirectToHome();
      return;
    }
    
    const newPage = await this.updateDOM(html);
    if (!newPage) {
      this.routerResolver.redirectToHome();
      return;
    }
    
    // ✅ Success path - only runs if everything above succeeds
    await this.updateFields(newPage);
  } catch (error) {
    console.error('Error updating page:', error);
    this.routerResolver.redirectToHome();
  }
  // ✅ No finally needed unless you have cleanup code
}
```

If you need cleanup, add `finally`:

```javascript
async updatePage(href) {
  try {
    this.setLoadingState(true); // Show loading
    
    const html = await this.requestPage(href);
    if (!html) {
      this.routerResolver.redirectToHome();
      return;
    }
    
    const newPage = await this.updateDOM(html);
    if (!newPage) {
      this.routerResolver.redirectToHome();
      return;
    }
    
    await this.updateFields(newPage);
  } catch (error) {
    console.error('Error updating page:', error);
    this.routerResolver.redirectToHome();
  } finally {
    // ✅ Cleanup that must always run
    this.setLoadingState(false); // Hide loading
    this.abortController = null; // Clean up if you have one
  }
}
```

## Summary

- `finally` runs always (success or error).
- Use it for cleanup, state resets, and resource closing.
- Do not put success-only logic in `finally`.
- For your current code, `finally` is optional unless you need cleanup.

For your simple SPA, Option 1 without `finally` is fine unless you have cleanup to do.





# Don't Nest Try...Catch Blocks

Your current code has an issue: the nested try-catch blocks in `startPageUpdate` catch errors and return `null`, which prevents the parent `updatePage` try-catch from seeing them.

### Current flow (problematic)

```javascript
async updatePage(href) {
  try {
    const newPage = await this.startPageUpdate(routeInfo);
    // ❌ If startPageUpdate catches an error and returns null,
    //    the parent try-catch NEVER sees the error!
    if (!newPage) {
      return; // Silent failure - parent doesn't know why
    }
  } catch (error) {
    // ❌ This never runs because errors are caught in startPageUpdate
    console.error("Error updating page", error);
  }
}

async startPageUpdate(routeInfo) {
  try {
    await this.pageManager.updatePage(routeInfo.route);
  } catch (error) {
    console.error("Error updating page", error);
    return null; // ❌ Error is swallowed, parent never sees it
  }
}
```

## When to use try-catch: decision tree

### Rule 1: Let errors bubble up (default)

Use when:
- You want centralized error handling
- The parent orchestrator should handle all errors
- You want consistent error handling across steps

```javascript
// ✅ GOOD: Let errors bubble up
async beforePageUpdate(href) {
  // No try-catch - errors bubble to parent
  const routeInfo = this.routerResolver.validateRoute(href, window.location.pathname);
  return routeInfo;
}

async updatePage(href) {
  try {
    const routeInfo = await this.beforePageUpdate(href);
    // ✅ Any error from beforePageUpdate is caught here
  } catch (error) {
    // ✅ Handles all errors from beforePageUpdate
  }
}
```

### Rule 2: Handle locally (specific cases)

Use when:
- You need different handling for specific errors
- You need to clean up resources before re-throwing
- You need to transform the error
- The error is expected and recoverable

```javascript
// ✅ GOOD: Local handling with re-throw
async startPageUpdate(routeInfo) {
  try {
    await this.pageManager.updatePage(routeInfo.route);
  } catch (error) {
    // ✅ Specific cleanup before re-throwing
    await this.cleanupPartialUpdate();
    throw error; // ✅ Re-throw so parent can handle
  }
}
```

### Rule 3: Swallow errors (rare)

Use when:
- The error is expected and non-critical
- You have a fallback
- You want to continue execution

```javascript
// ✅ GOOD: Swallow non-critical errors
async afterPageUpdate(newPage, routeInfo) {
  try {
    await newPage.create();
  } catch (error) {
    // ✅ Non-critical - page might already be created
    console.warn("Page creation warning:", error);
    // Continue execution
  }
  
  // This always runs, even if create() fails
  await newPage.show();
}
```

## Recommended pattern for your code

### Option 1: Let all errors bubble up (recommended)

```javascript
async updatePage(href) {
  try {
    const routeInfo = await this.beforePageUpdate(href);
    
    if (!routeInfo || !routeInfo.isValid) {
      return; // Expected case, not an error
    }

    const newPage = await this.startPageUpdate(routeInfo);
    
    if (!newPage) {
      // ✅ If this happens, it's an error - throw it
      throw new Error("Failed to start page update");
    }

    await this.afterPageUpdate(newPage, routeInfo);
  } catch (error) {
    // ✅ Catches ALL errors from the entire chain
    console.error("Error updating page", error);
    this.routerResolver.redirectToHome();
  }
}

async beforePageUpdate(href) {
  // ✅ No try-catch - errors bubble up
  const routeInfo = this.routerResolver.validateRoute(
    href,
    window.location.pathname
  );

  if (!routeInfo.isValid) {
    this.routerResolver.handleInvalidRoute(routeInfo);
    return null; // Expected case
  }

  return routeInfo;
}

async startPageUpdate(routeInfo, addToHistory = true) {
  // ✅ No try-catch - let errors bubble up
  const currentPage = this.pageRegistry.getCurrentPage();
  if (currentPage) {
    await currentPage.hide(routeInfo.route);
  }

  // ✅ Errors from updatePage will bubble to parent
  await this.pageManager.updatePage(routeInfo.route);

  if (addToHistory) {
    this.routerHistory.updateHistory(routeInfo.route);
  }

  await nextPaint();
  
  // ✅ Errors from getPage will bubble to parent
  const newPage = await this.pageLoader.getPage(routeInfo.route);
  
  if (!newPage) {
    throw new Error("Failed to load page"); // ✅ Throw instead of returning null
  }

  return newPage;
}

async afterPageUpdate(newPage, routeInfo) {
  // ✅ No try-catch - let errors bubble up
  await newPage.create();
  await newPage.show();
  await nextPaint();

  const mainElement = document.querySelector(
    `main[data-template="${routeInfo.route}"]`
  );

  if (mainElement) {
    if (!mainElement.hasAttribute("tabindex")) {
      mainElement.setAttribute("tabindex", "-1");
    }
    mainElement.focus();
  }
}
```

### Option 2: Hybrid approach (specific local handling)

```javascript
async startPageUpdate(routeInfo, addToHistory = true) {
  const currentPage = this.pageRegistry.getCurrentPage();
  if (currentPage) {
    await currentPage.hide(routeInfo.route);
  }

  try {
    await this.pageManager.updatePage(routeInfo.route);
  } catch (error) {
    // ✅ Specific handling: cleanup before re-throwing
    console.error("Error updating page DOM:", error);
    await this.rollbackPageHide(); // Cleanup
    throw error; // ✅ Re-throw so parent can handle
  }

  if (addToHistory) {
    this.routerHistory.updateHistory(routeInfo.route);
  }

  await nextPaint();
  
  try {
    const newPage = await this.pageLoader.getPage(routeInfo.route);
    if (!newPage) {
      throw new Error("Failed to load page class");
    }
    return newPage;
  } catch (error) {
    // ✅ Specific handling: cleanup before re-throwing
    console.error("Error loading page:", error);
    await this.rollbackHistory(); // Cleanup
    throw error; // ✅ Re-throw so parent can handle
  }
}
```

## Error propagation flow

### Current (problematic)

```
updatePage (try-catch)
  └─→ startPageUpdate (try-catch) ❌ Catches error, returns null
       └─→ pageManager.updatePage() throws error
            └─→ Error caught in startPageUpdate, returns null
                 └─→ Parent sees null, doesn't know it was an error
```

### Recommended

```
updatePage (try-catch) ✅ Catches all errors
  └─→ beforePageUpdate (no try-catch) ✅ Errors bubble up
  └─→ startPageUpdate (no try-catch) ✅ Errors bubble up
       └─→ pageManager.updatePage() throws error
            └─→ Error bubbles to updatePage catch block ✅
  └─→ afterPageUpdate (no try-catch) ✅ Errors bubble up
```
