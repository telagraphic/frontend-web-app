# GSAP transition boilerplate

Copy this when adding a GSAP transition plug-in. The service already sequences `prepare`, `cover`, commit, and `reveal`. The plug-in does not fetch HTML, swap `<main>`, or call page hooks.

Terms: [GLOSSARY.md](../../GLOSSARY.md). Paths: [PAGE_TRANSITIONS.md](PAGE_TRANSITIONS.md). Decisions: [ADR 0012](../adr/0012-page-transitions-are-visual-plugins.md).

## Files

A plug-in is one folder: the class that injects markup and runs the tweens, and the stylesheet for that markup. The layout already has the empty host. The plug-in fills it per navigation and empties it when the reveal finishes.

```
app/transitions/wipe/WipeTransition.js
app/transitions/wipe/wipe.css           # imported from styles/styles.css
```

The host stays empty in the layout. `prepare` writes into it, and `reveal` clears it. The `hidden` attribute keeps it out of the page until then. `aria-hidden="true"` keeps the overlay out of the accessibility tree while it is only a visual cover.

```html
<div class="page-transition-overlay" data-transition-host hidden aria-hidden="true"></div>
```

## Class

The factory constructs the plug-in with the host element and `animationsService`. The class does not fetch HTML or replace `<main>`. `TransitionsService` calls these methods around the router's commit.

`init` opens an animation scope on the host so the cover and reveal tweens revert together. `destroy` reverts that scope, empties the host, and hides it.

`markup({ to })` returns the HTML for this navigation. It reads `to.pageTransition` only. `copy`, `image`, and `alt` are strings the destination route supplied. `prepare` writes that HTML into the host, unhides the host, and waits for `loadImages` on an injected image so the cover does not rise over an empty frame.

`cover` tweens the host from below the viewport (`yPercent: 100`) to covering it (`yPercent: 0`) and resolves on complete. `reveal` tweens it off the top (`yPercent: -100`), then hides the host and removes the injected nodes before resolving. Both durations are `0` when `reducedMotion` is set, so the promise still settles and the service can continue. The service awaits these promises. The plug-in does not dispatch `transitionstart` or `transitionend`. The service does that.

```js
// app/transitions/wipe/WipeTransition.js
import { gsap } from "../../animations/gsap/gsap.js";
import { loadImages } from "../../utilities/images.js";

export default class WipeTransition {
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
    const fields = to.pageTransition ?? {};
    const { copy = "", image, alt = "" } = fields;
    return `
      <div class="wipe">
        ${image ? `<img class="wipe__image" src="${image}" alt="${alt}">` : ""}
        ${copy ? `<p class="wipe__copy">${copy}</p>` : ""}
      </div>
    `;
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
        gsap.fromTo(
          this.host,
          { yPercent: 100 },
          {
            yPercent: 0,
            duration: reducedMotion ? 0 : 0.6,
            onComplete: resolve,
          },
        );
      });
    });
  }

  reveal() {
    return new Promise((resolve) => {
      this.animations.add(({ reducedMotion }) => {
        gsap.to(this.host, {
          yPercent: -100,
          duration: reducedMotion ? 0 : 0.5,
          onComplete: () => {
            this.host.hidden = true;
            this.host.replaceChildren();
            resolve();
          },
        });
      });
    });
  }
}
```

`cover` and `reveal` return promises so the service can await the visual. The event dispatch stays on the service because nothing in the plug-in waits on those events.

## Styles

The wipe fills the host (`inset: 0` on an absolute box). The image covers that box. The copy sits centered on top of the image.

```css
/* app/transitions/wipe/wipe.css */
.wipe {
  inset: 0;
  position: absolute;
}

.wipe__image {
  height: 100%;
  object-fit: cover;
  width: 100%;
}

.wipe__copy {
  inset: 0;
  margin: 0;
  position: absolute;
  text-align: center;
}
```

Add `@import "../app/transitions/wipe/wipe.css" layer(components);` to `styles/styles.css` only when this effect is the one the site uses.

## Factory

One effect: import the class in the factory. A second effect: add it to `app/config/transitions.js` and set `pageTransition.effect` on the destination routes that use it.

```js
import WipeTransition from "../transitions/wipe/WipeTransition.js";

const host = document.querySelector("[data-transition-host]");
const transitionsService = new TransitionsService({
  strategy: new WipeTransition({ host, animationsService }),
});
```

## Route field

Omit `pageTransition` when the route uses the factory default and needs no copy or image.

```js
"section-3": {
  link: "/section-3",
  page: "Page",
  pageTransition: {
    effect: "wipe",
    copy: "Section 3",
    image: "/images/section-3.webp",
    alt: "Section 3",
  },
}
```

Extra keys in that object are for `markup()` only. Do not put `view-transition-name` here.
