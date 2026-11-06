# Animations

How motion is created, tracked, and cleaned up. Terms follow [GLOSSARY.md](../../GLOSSARY.md). Verbs follow [METHOD_VERBS.md](METHOD_VERBS.md). The decisions live in [ADR 0009](../adr/0009-animation-scopes-own-and-revert-all-motion.md).

Every owner (page class, component, page transition strategy) gets one **animation scope**. GSAP objects created inside it are recorded. `destroy()` reverts all of them: tweens, timelines, ScrollTriggers, SplitText, and inline styles. That is what stops duplicates on a page swap.

CSS owns layout, color, type, rest states, and simple hover color. GSAP owns sequenced motion. Do not animate the same property in both. Hide a pre-animation state under `html.is-animating` ([STYLES.md](STYLES.md)).

## Files

```
app/config/animations.js        animation index: data-animation type → effect
app/animations/
  gsap/
    gsap.js                     plugin gate
    easings.js                  named CustomEase curves
    presets.js                  shared motion values, data only
    GsapAnimationScope.js       one scope per owner
    effects/                    shared recipes
      titleReveal.js
app/services/AnimationsService.js
app/transitions/                overlay animations live here, not in app/animations/
```

The starter does not ship `Titles.js`, `BackgroundColors.js`, `FadeInAndOut.js`, or `PreloaderAnimation.js`. Title motion is an effect. Theme is `data-background` / `data-color` on `<main>` (ADR 0021). Overlay motion is a transition plug-in ([GSAP_TRANSITION.md](GSAP_TRANSITION.md)). Preloader motion lives on the preloader. Page classes: [PAGE.md](PAGE.md).

## Plugin gate

Every file that uses GSAP imports from here, never from `"gsap"` directly.

```js
// app/animations/gsap/gsap.js
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { CustomEase } from "gsap/CustomEase";

gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);

export { gsap, ScrollTrigger, SplitText, CustomEase };
```

## Animation scope

```js
// app/animations/gsap/GsapAnimationScope.js
import { gsap } from "./gsap.js";

export default class GsapAnimationScope {
  constructor({ root }) {
    this.root = root;
  }

  init() {
    this.media = gsap.matchMedia(this.root);
  }

  add(build) {
    this.media.add(
      {
        motion: "(prefers-reduced-motion: no-preference)",
        reducedMotion: "(prefers-reduced-motion: reduce)",
      },
      (context) => build(context.conditions),
    );
  }

  track(handler) {
    return (...args) => this.media.add(() => handler(...args));
  }

  destroy() {
    this.media?.revert();
    this.media = null;
  }
}
```

## AnimationsService

The site's only connection to GSAP. Smooth scroll never imports GSAP. This service connects them when both exist.

```js
// app/services/AnimationsService.js
import { gsap, ScrollTrigger } from "../animations/gsap/gsap.js";
import GsapAnimationScope from "../animations/gsap/GsapAnimationScope.js";
import types from "../animations/index.js";

export class AnimationsService {
  constructor({ smoothScroll }) {
    this.smoothScroll = smoothScroll;
    this.types = types;
    this.scopes = new Set();
  }

  init() {
    this.smoothScroll.useTicker(gsap.ticker);
    this.smoothScroll.addEventListener("scroll", ScrollTrigger.update);
    gsap.ticker.lagSmoothing(0);
  }

  createScope(root) {
    const scope = new GsapAnimationScope({ root });
    scope.init();
    this.scopes.add(scope);
    return scope;
  }

  addTypes(scope, root) {
    scope.add((conditions) => {
      for (const element of root.querySelectorAll("[data-animation]")) {
        const create = this.types[element.dataset.animation];
        if (!create) {
          console.warn(`Unknown data-animation type: ${element.dataset.animation}`);
          continue;
        }
        create(element, conditions);
      }
    });
  }

  refresh() {
    ScrollTrigger.refresh();
  }

  destroy() {
    for (const scope of this.scopes) scope.destroy();
    this.scopes.clear();
    this.smoothScroll.removeEventListener("scroll", ScrollTrigger.update);
    this.smoothScroll.useTicker(null);
    gsap.ticker.lagSmoothing(500);
  }
}
```

## Animation index and an effect

```js
// app/config/animations.js
import { createTitleReveal } from "../animations/gsap/effects/titleReveal.js";

export default {
  title: createTitleReveal,
};
```

```js
// app/animations/gsap/effects/titleReveal.js
import { gsap } from "../gsap.js";
import { EASES } from "../easings.js";

/**
 * Title reveal
 *
 *    0ms   element hidden (CSS, under html.is-animating)
 *  100ms   fade and rise when the element enters the viewport
 *    end   element at rest
 */

export function createTitleReveal(element, { reducedMotion } = {}) {
  if (reducedMotion) {
    gsap.set(element, { autoAlpha: 1, y: 0 });
    return;
  }

  return gsap.fromTo(
    element,
    { autoAlpha: 0, y: 16 },
    {
      autoAlpha: 1,
      y: 0,
      duration: 0.5,
      ease: EASES.outQuad,
      scrollTrigger: { trigger: element, start: "top 85%", once: true },
    },
  );
}
```

## BasePage wires the scope

Page classes never import GSAP to get a scope. `BasePage` creates one, runs the animation index, and reverts it on destroy.

```js
// app/pages/BasePage.js
export default class BasePage {
  constructor({ animationsService, smoothScroll, element }) {
    this.animationsService = animationsService;
    this.smoothScroll = smoothScroll;
    this.root = element;
  }

  async init(context) {
    this.animations = this.animationsService.createScope(this.root);
    await this.onInit?.(context);
  }

  async show(context) {
    // After the preloader has hidden, when one played (ADR 0014).
    this.animationsService.addTypes(this.animations, this.root);
    await this.onShow?.(context);
    this.smoothScroll.refresh();
    this.animationsService.refresh();
  }

  async destroy() {
    await this.onDestroy?.();
    this.animations?.destroy();
    this.animations = null;
  }

  use(component) {
    component.init();
    this.components.push(component);
    return component;
  }
}
```

## Three ways to create motion

**1. Declarative type.** Markup only. The animation index maps the type to an effect.

```html
<h1 data-animation="title">Section title</h1>
```

**2. Page-specific motion.** A page class imports an effect, or GSAP, inside `add()`.

```js
// app/pages/Home.js
import BasePage from "./BasePage.js";
import { gsap } from "../animations/gsap/gsap.js";
import { createTitleReveal } from "../animations/gsap/effects/titleReveal.js";

export default class Home extends BasePage {
  static elements = {
    title: "[data-home-title]",
    cards: ["[data-card]"],
  };

  onInit() {
    this.animations.add(({ reducedMotion }) => {
      createTitleReveal(this.elements.title, { reducedMotion });
      gsap.from(this.elements.cards, {
        autoAlpha: 0,
        stagger: 0.1,
        scrollTrigger: { trigger: this.elements.cards, start: "top 80%" },
      });
    });
  }
}
```

**3. Layout component or custom element.** Same scope, owned by the component.

```js
// app/components/Navigation.js
export class Navigation extends Component {
  init() {
    this.animations = this.animationsService.createScope(this.element);
    this.animations.add(() => {
      this.menuTimeline = gsap.timeline({ paused: true }).from(this.elements.panel, { autoAlpha: 0 });
    });
    this.router.addEventListener("navigationstart", this.track(() => this.close()));
  }

  open() { this.menuTimeline.play(); }
  close() { this.menuTimeline.reverse(); }

  destroy() {
    this.animations.destroy();
  }
}
```

Page classes and components find their elements through `static elements` ([DOM.md](DOM.md)).

## Router order, so nothing piles up

```js
// one page swap
await leaving.hide(context);          // leave animations run
await swap();                         // next HTML is in the document
await leaving.destroy();              // leaving.animations.destroy() reverts that page
this.currentPage = new PageClass(pageServices);
await this.currentPage.init(context); // new scope, data-animation types, page-specific add(), then refresh Lenis and ScrollTrigger
await this.currentPage.show(context);
```

Window `resize` refreshes Lenis and ScrollTrigger only when **width** changes. Height-only resizes are the iOS URL bar. Content-height changes after a swap are handled by the post-init `refresh()`, not by the window listener.

## Leak check

After a page's destroy stage, `ScrollTrigger.getAll()` should contain only triggers owned by layout components. `AnimationsService` warns in development when it finds extras. Tests assert the same thing (ADR 0008).
