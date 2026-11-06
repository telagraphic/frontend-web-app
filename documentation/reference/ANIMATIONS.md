# Animations

How motion is created, tracked, and cleaned up. Terms follow [GLOSSARY.md](../../GLOSSARY.md). Verbs follow [METHOD_VERBS.md](METHOD_VERBS.md). The decisions live in [ADR 0009](../adr/0009-animation-scopes-own-and-revert-all-motion.md).

Every owner (page class, component, page transition strategy) gets one **animation scope**. GSAP objects created inside it are recorded. `destroy()` reverts all of them: tweens, timelines, ScrollTriggers, SplitText, and inline styles. That is what stops duplicates on a page swap.

CSS owns layout, color, type, rest states, and simple hover color. GSAP owns sequenced motion. Do not animate the same property in both. Hide a pre-animation state under `html.is-animating` ([STYLES.md](STYLES.md)).

## Files

Motion is split across a gate, a scope, shared effects, and one service. Overlay animation is a transition plug-in, so it is not in this list.

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

This module is the one place that imports GSAP. It registers ScrollTrigger, SplitText, and CustomEase, then re-exports `gsap` and those plugins. Every other file imports from here, so the plugins are registered before any tween runs and the bundle contains one copy of GSAP.

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

An animation scope is the cleanup boundary for one owner: a page class, a layout component, or a transition plug-in. The constructor stores that owner's root. `init` opens `gsap.matchMedia` on the root. That media object is the recorder. Tweens, timelines, ScrollTriggers, and SplitText created while one of its callbacks runs are tied to it.

`add(build)` runs `build` under two conditions. `motion` matches when the visitor has not asked for reduced motion. `reducedMotion` matches when they have. The build receives those flags as `context.conditions` and creates the full animation either way. The reduced path uses duration `0`, or `gsap.set` to the rest state, so the content is visible. If the preference changes, GSAP reverts the previous callback and runs the one that now matches.

`track(handler)` is for motion that starts later, from a click or a router event. It returns a function that runs `handler` inside the same media, so tweens created on that call are recorded too. A handler passed straight to `addEventListener` would create tweens the scope cannot revert.

`destroy` calls `revert()` on the media. That stops the recorded animations and clears inline styles GSAP wrote. The owner calls it from its own `destroy`, which is what stops a page swap from leaving the previous page's ScrollTriggers behind.

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

`init` hands Lenis the GSAP ticker and listens for Lenis `scroll` so ScrollTrigger measures the smoothed position. `lagSmoothing(0)` keeps ScrollTrigger in step with that ticker. `createScope(root)` builds a scope, inits it, and keeps it in a set. `addTypes(scope, root)` finds every `[data-animation]` inside the root and calls the effect named by that attribute, inside the scope, so declarative motion reverts with the owner. An unknown type warns and is skipped. `refresh` asks ScrollTrigger to remeasure after layout changes. `destroy` reverts every scope the service created, disconnects the ticker, and restores the default lag smoothing.

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

The animation index maps a `data-animation` value to a `create*` function. `addTypes` looks up `element.dataset.animation` in this object and calls the function with the element and the scope's conditions. Adding a declarative type is a new key here, plus the effect it points at.

An effect is one recipe. It receives the element and `{ reducedMotion }`. Under reduced motion it sets the element to its rest state and returns. Otherwise it builds the tween. ScrollTrigger in the tween waits until the element enters the viewport. The tween is created inside `scope.add`, so the scope reverts it. The comment at the top of the effect is the storyboard: when the element is hidden, when it moves, and where it rests. CSS hides the pre-animation state under `html.is-animating`. The effect does not hide the element itself.

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

`init` creates the scope before `onInit`, so a page class can call `this.animations.add` immediately. `show` runs after the preloader has hidden. That is when `addTypes` starts declarative motion, then `onShow`, then a refresh of Lenis and ScrollTrigger so measurements match the revealed layout. `destroy` runs `onDestroy`, then reverts the scope. `use` inits a child component and keeps it on the page.

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

**2. Page-specific motion.** A page class imports an effect, or GSAP, and calls it inside `add()`. The callback receives `{ reducedMotion }` from the scope. `createTitleReveal` is the shared recipe. The `gsap.from` on the cards belongs to this page only, and it is still recorded because it runs inside `add`.

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

**3. Layout component or custom element.** The component owns the scope. `init` creates it and builds a paused timeline. `open` and `close` play and reverse that timeline. `track` wraps the navigation listener so any tween that listener starts is recorded. `destroy` reverts the scope when the layout shuts down.

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

One page swap, from the leaving page's `hide` through the next page's `show`. The router awaits each stage. The leaving scope is reverted in `destroy` before the next scope is created, so the two pages never animate at once.

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
