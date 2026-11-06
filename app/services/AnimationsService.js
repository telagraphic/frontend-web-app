import { gsap, ScrollTrigger } from "../animations/gsap/gsap.js";
import GsapAnimationScope from "../animations/gsap/GsapAnimationScope.js";
import types from "../config/animations.js";
import { isProduction } from "../utilities/environment.js";

export class AnimationsService {
  constructor({ smoothScroll } = {}) {
    this.smoothScroll = smoothScroll;
    this.types = types;
    this.scopes = new Set();
    this.lastWidth = 0;
    this.controller = null;
  }

  init() {
    this.controller = new AbortController();
    const { signal } = this.controller;

    if (this.smoothScroll) {
      this.smoothScroll.useTicker(gsap.ticker);
      this.onScroll = () => ScrollTrigger.update();
      this.smoothScroll.addEventListener("scroll", this.onScroll);
    }
    gsap.ticker.lagSmoothing(0);

    this.lastWidth = window.innerWidth;
    window.addEventListener(
      "resize",
      () => {
        const width = window.innerWidth;
        if (width === this.lastWidth) return;
        this.lastWidth = width;
        this.smoothScroll?.refresh();
        this.refresh();
      },
      { signal },
    );

    window.addEventListener(
      "pageshow",
      () => {
        this.smoothScroll?.refresh();
        this.refresh();
      },
      { signal },
    );

    document.fonts?.ready?.then(() => {
      if (this.controller?.signal.aborted) return;
      this.refresh();
    });
  }

  createScope(root) {
    const scope = new GsapAnimationScope({ root });
    scope.init();
    this.scopes.add(scope);
    return scope;
  }

  addTypes(scope, root) {
    if (!scope || !root) return;
    scope.add((conditions) => {
      for (const element of root.querySelectorAll("[data-animation]")) {
        const create = this.types[element.dataset.animation];
        if (!create) {
          console.warn(
            `Unknown data-animation type: ${element.dataset.animation}`,
          );
          continue;
        }
        create(element, conditions);
      }
    });
  }

  refresh() {
    ScrollTrigger.refresh();
  }

  checkLeaks() {
    if (isProduction()) return;
    const leftovers = ScrollTrigger.getAll().filter(
      (trigger) => trigger.trigger && !trigger.trigger.isConnected,
    );
    if (leftovers.length > 0) {
      console.warn(
        `ScrollTrigger leftovers after destroy: ${leftovers.length}`,
      );
    }
  }

  destroy() {
    this.controller?.abort();
    this.controller = null;
    for (const scope of this.scopes) scope.destroy();
    this.scopes.clear();
    if (this.smoothScroll && this.onScroll) {
      this.smoothScroll.removeEventListener("scroll", this.onScroll);
    }
    this.smoothScroll?.useTicker(null);
    gsap.ticker.lagSmoothing(500);
  }
}
