import { gsap } from "./gsap.js";

export default class GsapAnimationScope {
  constructor({ root }) {
    this.root = root;
  }

  init() {
    this.media = gsap.matchMedia(this.root);
  }

  add(build) {
    if (!this.media) {
      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      return build({ reducedMotion });
    }

    this.media.add(
      {
        motion: "(prefers-reduced-motion: no-preference)",
        reducedMotion: "(prefers-reduced-motion: reduce)",
      },
      (context) => build(context.conditions),
    );
  }

  track(handler) {
    return (...args) => {
      if (!this.media) return handler(...args);
      this.media.add(() => handler(...args));
    };
  }

  destroy() {
    this.media?.revert();
    this.media = null;
  }
}
