# Page components

A **page component** is a region inside the page. The view already contains its HTML. The page class loads the class that adds behavior, and `destroy` ends that class with the page. A layout component is the other kind: menu, preloader, and anything else `createLayout()` keeps across pages ([LAYOUT_COMPONENTS.md](LAYOUT_COMPONENTS.md)).

Terms: [GLOSSARY.md](../../GLOSSARY.md). Lifecycle: [ADR 0011](../adr/0011-base-lifecycle-holds-signal-and-scope.md). Element map: [DOM.md](DOM.md). Page swap: [PAGE_SWAP.md](PAGE_SWAP.md). Custom elements: [ADR 0009](../adr/0009-animation-scopes-own-and-revert-all-motion.md).

## Same shape as an island

[Islands architecture](https://www.patterns.dev/vanilla/islands-architecture/) is a static document plus small regions that bring their own JavaScript and wake on their own schedule. The name in this starter is **page component**. The pieces line up like this:

| Islands article | Here |
| --- | --- |
| Server-rendered HTML is the content | Nunjucks, Vento, or JSX writes the region into the document. JSX runs at build time. The browser does not hydrate a component tree ([TEMPLATES.md](TEMPLATES.md)). |
| One region, one script | One `Component` subclass, or one custom element. `this.use()` gives it its own root, signal, and animation scope. |
| `client:load` | Import the class in `onInit` and `use()` it. |
| `client:idle` | `requestIdleCallback`, then `import()` and `use()`. |
| `client:visible` | `IntersectionObserver`, then `import()` and `use()`. |
| No directive | Markup only. The page class does not import a class. |
| The rest of the page has no client JavaScript | Not this shell. Boot still loads GSAP, Lenis, the menu, and the preloader (ADR 0002). A page component keeps that region’s code off the other routes. It does not remove the shell. |

A hydration runtime, `client:*` directives, and server islands stay parked ([CANDIDATES.md](CANDIDATES.md)). Production is one static file per route (ADR 0020), so a region’s HTML is known at build time.

`this.use()` reports a failed child as `PAGE_HOOK_FAILED` on the page (ADR 0011). A custom element keeps a failure inside that element’s `connectedCallback`.

## Markup

The region works before its class loads. Buttons are buttons. Images have `src`, `width`, and `height`. The page class selects a root inside `<main>`.

```jsx
// views/pages/home.jsx
<section data-home-carousel>
  <button type="button" data-carousel-previous>Previous</button>
  <ul>
    <li><img src="/images/one.webp" alt="" width="1200" height="800"></li>
  </ul>
  <button type="button" data-carousel-next>Next</button>
</section>
```

Nunjucks and Vento use the same attributes. A `<script>` inside `<main>` is inserted on a page swap and never runs. The page class is the loader ([PAGE_SWAP.md](PAGE_SWAP.md)).

## Load with the page

A top-level import ships the class in the page chunk (ADR 0004). `onInit` runs after the element map is filled. `element` is this component’s root, so its selectors do not see the rest of the page.

```js
// app/pages/Home.js
import BasePage from "./BasePage.js";
import Carousel from "../components/Carousel.js";

export default class Home extends BasePage {
  static elements = {
    carousel: "[data-home-carousel]",
  };

  async onInit() {
    if (!this.elements.carousel) return;
    await this.use(
      new Carousel({
        element: this.elements.carousel,
        animationsService: this.animationsService,
        smoothScroll: this.smoothScroll,
      }),
    );
  }
}
```

```js
// app/components/Carousel.js
import Component from "./Component.js";

export default class Carousel extends Component {
  static elements = {
    previous: "[data-carousel-previous]",
    next: "[data-carousel-next]",
  };

  onInit() {
    this.elements.next?.addEventListener("click", () => this.advance(), {
      signal: this.signal,
    });
  }
}
```

`destroy` on the page runs `destroy` on each child from `use()`, which aborts `this.signal` and reverts that child’s animation scope.

## Load later

Put `import()` inside the schedule so the bundler emits a separate chunk (`splitting: true` on the asset build). A static import at the top of the page class does not wait.

**Near the viewport.** Disconnect the observer on abort so a navigation during the wait does not start the class on a removed node.

```js
async onInit() {
  const root = this.elements.carousel;
  if (!root) return;

  const observer = new IntersectionObserver(async ([entry]) => {
    if (!entry?.isIntersecting) return;
    observer.disconnect();
    const { default: Carousel } = await import("../components/Carousel.js");
    await this.use(
      new Carousel({
        element: root,
        animationsService: this.animationsService,
        smoothScroll: this.smoothScroll,
      }),
    );
  });
  observer.observe(root);
  this.signal.addEventListener("abort", () => observer.disconnect());
}
```

**Idle.** `requestIdleCallback` replaces the observer. The import and `use()` stay the same. Abort during the idle wait by passing `{ signal: this.signal }` where the browser supports it, or by cancelling the id in the abort listener.

Two regions on one page are two `use()` calls. They do not share fields. A custom event on `document` is the link, the same way layout listens for `navigationstart`.

## Custom element

Use a custom element when the browser should construct the region. The page class still imports the module: that import is what calls `customElements.define`, and the tag already in the HTML upgrades. The element imports its animation scope itself (ADR 0009) and reverts it in `disconnectedCallback`, which runs when a page swap drops the node.

The steps for the first element are in [add-custom-element](../../.cursor/skills/front-end-add-custom-element/SKILL.md). The class is not registered from `createServices()`, and it does not extend `Component`.
