# DOM helpers and element maps

How page classes and components find their elements, listen for events, and wait for the browser. The decisions are [ADR 0022](../adr/0022-classes-declare-their-elements.md) and [ADR 0010](../adr/0010-listeners-use-abort-signal.md). Terms are in [GLOSSARY.md](../../GLOSSARY.md).

Status: this page describes the accepted design. `DOMHelpers.js`, `ArrayHelpers.js`, and `AsyncHelpers.js` are still the running versions.

## Helpers

| Helper | File | Returns | Use it for |
| --- | --- | --- | --- |
| `$(selector, root = document)` | `dom.js` | One element or `null` | A single lookup |
| `$$(selector, root = document)` | `dom.js` | An array, possibly empty | Every match, ready for `map` and `forEach` |
| `select(root, map)` | `dom.js` | An object of elements | The element map; `BaseLifecycle` calls it |
| `delegate(root, type, selector, handler, { signal })` | `dom.js` | Nothing | One listener for many children, including ones added later |
| `getData(element, key, fallback)` | `dom.js` | A boolean, number, object, or string | Settings written in markup as `data-*` |
| `whenVisible(element, callback, { signal, once, rootMargin, threshold })` | `dom.js` | The observer | Work that should wait until an element is on screen |
| `whenDOMReady(callback)` | `dom.js` | Nothing | Code outside a module script, where the document may still be parsing |
| `nextPaint()` | `frames.js` | A promise | Waiting two frames so styles and layout apply before measuring |

Use GSAP for motion that follows scroll or media queries: ScrollTrigger and `gsap.matchMedia()` inside the animation scope. `whenVisible` is for work that is not animation, such as starting a video or loading an embed.

```js
// app/utilities/dom.js
export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

export function select(root, map) {
  const elements = {};
  for (const [key, value] of Object.entries(map)) {
    if (Array.isArray(value)) elements[key] = $$(value[0], root);
    else if (typeof value === "string") elements[key] = $(value, root);
    else elements[key] = value;
  }
  return elements;
}

export function delegate(root, type, selector, handler, { signal }) {
  root.addEventListener(
    type,
    (event) => {
      const match = event.target.closest(selector);
      if (match && root.contains(match)) handler(event, match);
    },
    { signal },
  );
}

export function getData(element, key, fallback) {
  const value = element.dataset[key];
  if (value === undefined) return fallback;
  if (value === "" || value === "true") return true;
  if (value === "false") return false;
  if (value.trim() !== "" && !Number.isNaN(Number(value))) return Number(value);
  if (value.startsWith("{") || value.startsWith("[")) return JSON.parse(value);
  return value;
}

export function whenVisible(element, callback, { signal, once = true, rootMargin = "0px", threshold = 0 }) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        callback(entry);
        if (once) observer.unobserve(entry.target);
      }
    },
    { rootMargin, threshold },
  );
  observer.observe(element);
  signal.addEventListener("abort", () => observer.disconnect(), { once: true });
  return observer;
}

export function whenDOMReady(callback) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", callback, { once: true });
  } else {
    callback();
  }
}
```

## The element map

A page class or component lists the elements it uses in `static elements`. `BaseLifecycle.init()` selects them once, inside the object's root, and stores them on `this.elements`.

| Value in the map | `this.elements.key` is |
| --- | --- |
| `"[data-title]"` | The first match inside the root, or `null` |
| `["[data-card]"]` | Every match inside the root, as an array |
| An element | That element |

### In a page class

The root is `main[data-route]` (ADR 0021). Adding a page: [PAGE.md](PAGE.md).

```js
// app/pages/Home.js
import BasePage from "./BasePage.js";
import { whenVisible } from "../utilities/dom.js";
import { createTitleReveal } from "../animations/gsap/effects/titleReveal.js";

export default class Home extends BasePage {
  static elements = {
    title: "[data-home-title]",
    cards: ["[data-card]"],
    video: "[data-home-video]",
  };

  onInit() {
    this.animations.add(({ reducedMotion }) => {
      createTitleReveal(this.elements.title, { reducedMotion });
    });

    if (this.elements.video) {
      whenVisible(this.elements.video, () => this.elements.video.play(), { signal: this.signal });
    }
  }
}
```

### In a component

The root is the `element` option. Two copies of one component never see each other's elements.

```js
// app/components/Accordion.js
import { Component } from "./Component.js";
import { delegate } from "../utilities/dom.js";

export class Accordion extends Component {
  static elements = {
    triggers: ["[data-accordion-trigger]"],
    panels: ["[data-accordion-panel]"],
  };

  onInit() {
    delegate(this.root, "click", "[data-accordion-trigger]", (event, trigger) => {
      this.toggle(this.elements.triggers.indexOf(trigger));
    }, { signal: this.signal });
  }
}
```

```js
// a page class using two accordions
this.use(new Accordion({ element: "[data-accordion='faq']", animationsService }));
this.use(new Accordion({ element: "[data-accordion='terms']", animationsService }));
```

### Extending and overriding

```js
// a subclass adds to its parent's map
static elements = { ...Menu.elements, image: "[data-menu-image]" };
```

```js
// one instance swaps a selector without a subclass
new Accordion({ element: "[data-accordion]", elements: { triggers: [".faq-question"] } });
```

### Elements created after init

The map is a snapshot from `init()`. Use `this.$()` and `this.$$()` for anything created later. Both search inside the root.

```js
const split = SplitText.create(this.elements.title, { type: "lines" });
const lines = this.$$(".line");
```

### Settings in markup

```html
<div data-marquee data-speed="1.5" data-reverse data-pause-on-hover="false"></div>
```

```js
const speed = getData(this.root, "speed", 1);                  // 1.5
const reverse = getData(this.root, "reverse", false);           // true
const pauseOnHover = getData(this.root, "pauseOnHover", true);  // false
```

## Rules

- Search inside the root. Use `this.$()`, `this.$$()`, and the element map, not `document.querySelector`. Layout components select their own elements, and a page never reaches into the menu.
- Name keys for what the element is, such as `title` and `cards`. Use a plural for arrays.
- List an element in the map when more than one method uses it. A lookup used once can stay local with `this.$()`.
- Pass `{ signal: this.signal }` to every listener and observer.
- Select hooks with `data-*` attributes. Classes are for styling.

## Pros and cons

| Pros | Cons |
| --- | --- |
| Every element a class uses is listed at the top of the file | It is a snapshot; elements created later need `this.$$()` |
| Searches stay inside the root, so instances and pages do not collide | A wrong selector gives `null`; dev warns, production does not |
| One element or `null`, or always an array; no normalizing | The array wrapper for "every match" is a convention to learn |
| A page swap creates a new page object that selects from the new `<main>` | Editors do not autocomplete keys without a JSDoc typedef |
| Testing is a fixture, `init()`, and a check of `this.elements` | It invites listing elements that only one line uses |

## Why there is no `on` / `off`

`addEventListener(type, handler, { signal })` is the whole pattern (ADR 0010). The old `on` helper did nothing when the element was missing, which hid broken selectors. `off` dropped the `capture` option, so it could not remove some listeners. Aborting the signal removes every listener, so nothing needs `off`. A listener removed while the owner keeps running uses a child `AbortController`.
