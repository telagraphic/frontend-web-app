# GSAP transition boilerplate

Copy this when adding a GSAP transition plug-in. The service already sequences `prepare`, `cover`, commit, and `reveal`. The plug-in does not fetch HTML, swap `<main>`, or call page hooks.

Terms: [GLOSSARY.md](../../GLOSSARY.md). Paths: [PAGE_TRANSITIONS.md](PAGE_TRANSITIONS.md). Decisions: [ADR 0012](../adr/0012-page-transitions-are-visual-plugins.md).

## Files

```
app/transitions/wipe/WipeTransition.js
app/transitions/wipe/wipe.css           # imported from styles/styles.css
```

The layout host is shared. Do not add markup there.

```html
<div class="page-transition-overlay" data-transition-host hidden aria-hidden="true"></div>
```

## Class

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

`cover` and `reveal` return promises. `TransitionsService` awaits them. Do not dispatch `transitionstart` or `transitionend` here. The service does that, and nothing awaits those events.

## Styles

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
