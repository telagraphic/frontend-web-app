# GSAP transition boilerplate

Copy this when adding a GSAP transition plug-in. The service already sequences `prepare`, `cover`, commit, and `reveal`. The plug-in does not fetch HTML, swap `<main>`, or call page hooks.

Terms: [GLOSSARY.md](../../GLOSSARY.md). Paths: [PAGE_TRANSITIONS.md](PAGE_TRANSITIONS.md). Decisions: [ADR 0012](../adr/0012-page-transitions-are-visual-plugins.md).

## Files

A plug-in is one folder: the class that injects markup and runs the tweens, and the stylesheet for that markup. The layout already has the empty host. The plug-in fills it per navigation and empties it when the reveal finishes.

```
app/transitions/fade/FadeTransition.js
app/transitions/fade/fade.css           # imported from styles/styles.css
```

The host stays empty in the layout. `prepare` writes into it, and `reveal` clears it. The `hidden` attribute keeps it out of the page until then. `aria-hidden="true"` keeps the overlay out of the accessibility tree while it is only a visual cover.

```html
<div class="page-transition-overlay" data-transition-host hidden aria-hidden="true"></div>
```

## Class

The factory constructs the plug-in with the host element and `animationsService`. The class does not fetch HTML or replace `<main>`. `TransitionsService` calls these methods around the router's commit.

`init` opens an animation scope on the host so the cover and reveal tweens revert together. `destroy` reverts that scope, empties the host, and hides it.

`markup({ to })` returns the HTML for this navigation. It reads `to.pageTransition` only. `copy`, `image`, and `alt` are strings the destination route supplied. `prepare` writes that HTML into the host, unhides the host, and waits for `loadImages` on an injected image so the cover does not rise over an empty frame.

`cover` fades the host in (`autoAlpha` 0 to 1) and resolves on complete. `reveal` fades it out, then hides the host and removes the injected nodes before resolving. Under reduced motion the plug-in sets `autoAlpha` and resolves immediately, so the promise still settles and the service can continue. The service awaits these promises. The plug-in does not dispatch `transitionstart` or `transitionend`. The service does that.

```js
// app/transitions/fade/FadeTransition.js
import { gsap } from "../../animations/gsap/gsap.js";
import { loadImages } from "../../utilities/images.js";

export default class FadeTransition {
  constructor({ host, animationsService }) {
    this.host = host;
    this.animationsService = animationsService;
  }

  init() {
    this.animations = this.animationsService.createScope(this.host);
  }

  destroy() {
    this.animations?.destroy();
    this.host.replaceChildren();
    this.host.hidden = true;
  }

  /** HTML injected into the host. Read only navigationContext.to.pageTransition. */
  markup({ to }) {
    const value = to.pageTransition;
    const { copy = "", image, alt = "" } =
      value && typeof value !== "string" ? value : {};
    const imageTag = image
      ? `<img class="page-transition-overlay__image" src="${image}" alt="${alt}">`
      : "";
    const copyTag = copy
      ? `<p class="page-transition-overlay__copy">${copy}</p>`
      : "";
    return `${imageTag}${copyTag}`;
  }

  async prepare(navigationContext) {
    this.host.innerHTML = this.markup(navigationContext);
    this.host.hidden = false;
    const image = this.host.querySelector("img");
    if (image) await loadImages([image]);
  }

  cover(navigationContext) {
    return new Promise((resolve) => {
      this.animations.add(({ reducedMotion }) => {
        if (reducedMotion) {
          gsap.set(this.host, { autoAlpha: 1 });
          resolve();
          return;
        }
        gsap.fromTo(
          this.host,
          { autoAlpha: 0 },
          {
            autoAlpha: 1,
            duration: 0.45,
            ease: "power2.inOut",
            onComplete: resolve,
          },
        );
      });
    });
  }

  reveal() {
    return new Promise((resolve) => {
      this.animations.add(({ reducedMotion }) => {
        const finish = () => {
          this.host.hidden = true;
          this.host.replaceChildren();
          resolve();
        };
        if (reducedMotion) {
          gsap.set(this.host, { autoAlpha: 0 });
          finish();
          return;
        }
        gsap.to(this.host, {
          autoAlpha: 0,
          duration: 0.4,
          ease: "power2.inOut",
          onComplete: finish,
        });
      });
    });
  }
}
```

`cover` and `reveal` return promises so the service can await the visual. The event dispatch stays on the service because nothing in the plug-in waits on those events.

## Styles

The host is the overlay (`inset: 0`, fixed). The image covers that box. The copy sits centered on top of the image. `cover` and `reveal` fade the host with `autoAlpha`.

```css
/* app/transitions/fade/fade.css */
.page-transition-overlay {
  inset: 0;
  opacity: 0;
  position: fixed;
}

.page-transition-overlay__image {
  height: 100%;
  object-fit: cover;
  width: 100%;
}

.page-transition-overlay__copy {
  margin: 0;
  text-align: center;
}
```

Add `@import "../app/transitions/fade/fade.css" layer(components);` to `styles/styles.css` only when this effect is the one the site uses.

## Factory

One effect: import the class in the factory. A second effect: add it to `app/config/transitions.js` and set `pageTransition.effect` on the destination routes that use it.

```js
import FadeTransition from "../transitions/fade/FadeTransition.js";
import { transitions } from "../config/transitions.js";
import { GsapTransitions } from "./GsapTransitions.js";

const transitionsService = new GsapTransitions({
  animationsService,
  defaultTransition: FadeTransition,
  transitions,
});
```

## Route field

Omit `pageTransition` when the route uses the factory default and needs no copy or image.

```js
"section-3": {
  link: "/section-3",
  page: "Page",
  pageTransition: {
    effect: "fade",
    copy: "Section 3",
    image: "/images/section-3.webp",
    alt: "Section 3",
  },
}
```

Extra keys in that object are for `markup()` only. Do not put `view-transition-name` here.
