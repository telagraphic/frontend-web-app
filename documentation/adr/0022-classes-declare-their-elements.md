---
status: accepted
---

# Page classes and components declare their elements, selected inside their root

`createPageObjectFromSelectors` and `createComponentPageObjectFromSelectors` were two copies of one lookup. Both returned early from the loop when given an element, which returned `undefined`. The component version found its root, then searched for its children in `document`, so two copies of one component could take each other's elements. A key held `null`, one element, or an array, depending on how many matched. `ArrayHelpers.js` existed only to undo that.

## Decisions

- `app/utilities/dom.js` exports `$`, `$$`, `select`, `delegate`, `getData`, `whenVisible`, and `whenDOMReady`. `app/utilities/frames.js` exports `nextPaint`.
- `$(selector, root)` returns one element or `null`. `$$(selector, root)` always returns an array.
- `select(root, map)` builds an object from an element map. A string value gives one element or `null`. A selector wrapped in an array, such as `[".card"]`, gives every match as an array. An element passed in is kept as is.
- Page classes and components declare `static elements`. `BaseLifecycle.init()` finds the root, then runs `select(this.root, { ...this.constructor.elements, ...this.options.elements })`. A page's root is `main[data-route]` (ADR 0021). A component's root is its `element` option.
- `this.$()` and `this.$$()` search inside the root. They are for elements created after `init()`, such as SplitText output.
- In dev, `select` warns once per class with the keys that matched nothing. Production stays quiet.
- `delegate(root, type, selector, handler, { signal })` adds one listener to `root` and calls `handler(event, match)` when `event.target.closest(selector)` is inside it.
- `getData(element, key, fallback)` reads a `data-*` value as a boolean, number, JSON object, or string.
- `whenVisible(element, callback, { signal, once = true, rootMargin, threshold })` wraps an `IntersectionObserver`. The signal disconnects it.
- Helpers that add a listener or observer take `{ signal }`, following ADR 0010.
- `DOMHelpers.js`, its `on` and `off`, and `ArrayHelpers.js` are removed. `AsyncHelpers.js` becomes `frames.js`, and `whenDOMReady` moves to `dom.js`.
- Function modules use lowercase file names (`dom.js`, `frames.js`, `images.js`). Class modules keep PascalCase file names.
- The pattern, with examples, is in [DOM.md](../reference/DOM.md).

## Considered Options

- **Fix the early `return` and keep both functions.** It keeps two copies, the document-wide search, and the changing types.
- **Return a `NodeList` for several matches.** It has no `map` or `filter`, which is why the array helpers existed.
- **Throw when a declared element is missing.** Optional elements are common in page markup. A dev warning catches typos without breaking pages that leave a part out.
- **Keep `on` and `off`.** `on` did nothing when the element was missing, and `off` dropped the `capture` option. With `{ signal }`, nothing needs `off`.
- **`readData`.** `get` / `set` is the verb pair for stored values in METHOD_VERBS.md.
- **`onVisible`.** The `on` prefix is reserved for hooks a subclass implements. `when` marks a helper that calls back once a condition is met, as `whenDOMReady` does.

## Consequences

- `Page.js`, `Component.js`, `Navigation.js`, `Preloader.js`, and `PreloaderAnimation.js` move to `static elements` and the new helpers.
- ADR 0011's "Component adds selector → element" now lives in `BaseLifecycle`, shared by pages and components.
- DOM helpers are [DOM.md](../reference/DOM.md). The old utilities guide is deleted.
