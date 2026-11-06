# Layout component boilerplate

Copy this when adapting a menu, a preloader, or another layout component from a tutorial or a package. The base behavior stays. The tutorial's markup, styles, and motion replace the starter's artwork.

Terms: [GLOSSARY.md](../../GLOSSARY.md). Verbs: [METHOD_VERBS.md](METHOD_VERBS.md). Menu: [ADR 0017](../adr/0017-menu-api-is-shared.md). Preloader: [ADR 0014](../adr/0014-preloader-runs-once-per-session.md).

## Menu

The base is `app/components/Navigation.js`. A project subclasses it. `createLayout()` imports the subclass.

```
app/components/menus/Menu.js
styles/components/menu.css    # imported from styles/styles.css
```

The partial uses these attributes. Class names are the layout's.

```html
<nav data-navigation data-navigation-status="not-active">
  <button type="button" data-navigation-toggle aria-expanded="false" aria-controls="menu-panel" aria-label="Menu"></button>
  <div id="menu-panel" data-navigation-panel data-lenis-prevent>
    <a href="/" aria-current="page">Home</a>
  </div>
</nav>
```

```js
// app/components/menus/Menu.js
import Navigation from "../Navigation.js";
import { gsap } from "../../animations/gsap/gsap.js";

export default class Menu extends Navigation {
  onInit() {
    this.animations.add(({ reducedMotion }) => {
      const duration = reducedMotion ? 0 : 0.6;
      this.timeline = gsap.timeline({ paused: true }).from(this.panel, { autoAlpha: 0, duration });
    });
  }

  onOpen() {
    this.timeline.play();
  }

  onClose() {
    this.timeline.reverse();
  }
}
```

`open`, `close`, `aria-current`, focus, `inert`, and `smoothScroll.stop` / `start` stay on the base. The toggle is at least `2.75rem` in both axes. The panel has `overscroll-behavior: contain`. A tutorial's menu script gives up its own click handler, escape handler, scroll lock, and router. Accessibility baseline: [ACCESSIBILITY.md](ACCESSIBILITY.md).

## Preloader

`app/components/Preloader.js` keeps the session rule, `maxWait`, the optional counter, and the head script that adds `is-loading` (ADR 0014). A tutorial replaces the markup in `views/partials/preloader.html`, the styles in `styles/components/preloader.css`, and the hide timeline.

The timeline runs inside the component's animation scope and resolves before `preloader-complete`. Reduced motion hides with no timeline. A tutorial that waits until every image returns `loaded === total`, stores a flag in `localStorage`, or starts the page's entrance motion does not replace those rules.

## Another layout component

```js
// app/components/SiteHeader.js
import Component from "./Component.js";
import { gsap } from "../animations/gsap/gsap.js";

export default class SiteHeader extends Component {
  constructor({ animationsService, element }) {
    super({ animationsService, element });
  }

  onInit() {
    this.animations.add(({ reducedMotion }) => {
      if (reducedMotion) return;
      gsap.from(this.element, { autoAlpha: 0, duration: 0.4 });
    });
  }
}
```

Add the class to the list in `createLayout(services)`. The root element is required. A missing root throws `COMPONENT_INIT_FAILED` and boot continues (ADR 0007).

GSAP is imported from `app/animations/gsap/gsap.js`. Motion is created inside `this.animations.add`. `destroy` on the base reverts the scope.

Styles follow [STYLES.md](STYLES.md). Add `@import "./components/{name}.css" layer(components);` to `styles/styles.css`. Page-specific artwork uses `body:has(main[data-route="…"])`.
