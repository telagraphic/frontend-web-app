# JavaScript conventions

How browser and server JS is written in this starter. Verbs: [METHOD_VERBS.md](METHOD_VERBS.md). Terms: [GLOSSARY.md](../../GLOSSARY.md). A new file starts from [add-module](../../.cursor/skills/add-module/SKILL.md). Syntax gate: [write-js](../../.cursor/skills/write-js/SKILL.md) and [FEATURES.md](../../.cursor/skills/write-js/FEATURES.md) beside it.

## Two module shapes

This codebase is classes **and** functions. Pick by lifetime, not by taste.

| Shape | When | Export | Example |
| --- | --- | --- | --- |
| `class` | An object with `init` / `destroy` (and `show` / `hide` or `open` / `close`) | Default | Page class, layout component, service, GSAP transition, `App` |
| Named function | Builds and returns, or has no lifetime | Named | `createServices`, `createLayout`, `loadImages`, `listenFocus`, `createTitleReveal`, `swap` |

A class that only wraps one function is too shallow: write the function. A helper that grows `init` / `destroy` is a class (or it belongs inside one). Composition roots stay functions; they are allowed to be shallow (ADR 0006, ADR 0007).

The first export is a page class. It listens with `this.signal`, so `destroy` aborts the listener without an `off` helper. The second is `createLayout`. It constructs the menu and returns `init` and `destroy` that forward to it. Boot calls those two methods. The function itself has no lifetime after it returns.

```js
export default class Home extends BasePage {
  static elements = { title: "[data-home-title]" };

  onInit() {
    this.element.addEventListener("click", this.onTitleClick, { signal: this.signal });
  }
}

import Menu from "../components/menus/Menu.js";

export function createLayout({ router, smoothScroll }) {
  const menu = new Menu({ router, smoothScroll });
  return {
    async init() { await menu.init(); },
    destroy() { menu.destroy(); },
  };
}
```

## Language

- ESM only. Default export for a class. Named export for a helper. No `index.js` barrel that re-exports the app.
- Constructor dependencies are assigned to `this` (`this.router = router`). No `#` private fields: subclasses (`Navigation`, `BasePage`) and tests-through-the-interface both need ordinary properties.
- `static elements` on page classes and components (ADR 0022). Other instance data is set in the constructor or `onInit`.
- `async` / `await`. Do not use top-level await in a module that must `destroy()` (boot uses `app.init()`).
- Listeners: `addEventListener(type, handler, { signal: this.signal })`. No `on` / `off` helpers.
- Errors keep `error.cause` (ADR 0007).
- Import GSAP only from `app/animations/gsap/gsap.js`. Import a service only through `this` from the constructor, never the factory.

## Syntax

Look up a feature that is not in this table on MDN Baseline **now** ([FEATURES.md](../../.cursor/skills/write-js/FEATURES.md)). Do not remember a year.

**Required** (Baseline widely available; write these)

`class`, `static` fields, `async` / `await`, `?.`, `??`, `for…of`, `{ signal }`, `{ cause }` on `Error`, template literals, destructuring, rest/spread, `import` / `export`.

**Reach for when they fit** (widely available; do not polyfill)

`Object.hasOwn`, `AbortSignal.any`, `AbortSignal.timeout`, `Promise.withResolvers`, `Array.prototype.at`, `structuredClone`, `||=` / `&&=` / `??=`.

**Experiment or skip** until Baseline widely available

`using` / `await using`, Temporal, decorators, iterator helpers, import attributes (`with { type: "json" }`). Newly available: only with a fallback that still runs.

**Never**

`var`, CommonJS, `with`, `==` (use `===`), jQuery, React, Vue, TypeScript in `app/` or `server/`, `create()` / `setup()` as lifecycle, `.then()` chains when `await` works, positive `tabindex` from JS.

## Shape

Lifecycle objects share one shell (ADR 0011): `init` / `destroy`, abort signal, animation scope when they animate, `this.use(child)` when they own children. They do not implement `create` or `setup`. The sample is the page-class form of that shell: `static elements` for the nodes, `onInit` for the work, and `this.animations.add` so the motion reverts with the page.

```js
import BasePage from "./BasePage.js";

export default class About extends BasePage {
  static elements = {
    title: "[data-about-title]",
  };

  onInit() {
    this.animations.add(({ reducedMotion }) => {
      /* GSAP or an effect */
    });
  }
}
```

Services are the same verbs without an element map: constructor deps, `init`, `destroy`. Effects are `createName(element, { reducedMotion })` and return a timeline.

## Directories

| Kind | Directory | Base |
| --- | --- | --- |
| Page class | `app/pages/` | `BasePage` |
| Layout or page component | `app/components/` | `Component` |
| Service | `app/services/` | none; `init` / `destroy` |
| Composition root | `app/services/`, `app/layout/` | named `create*` function |
| Effect | `app/animations/gsap/effects/` | `create*` function |
| GSAP transition | `app/transitions/{name}/` | `prepare` / `cover` / `reveal` |
| Helper | `app/utilities/` | named export |
| Server | `server/` | never ships |

Import GSAP only from `app/animations/gsap/gsap.js`. Import a service only through `this` from the constructor, never the factory.
