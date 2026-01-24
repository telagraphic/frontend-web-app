import { $ } from "../utilities/DOMHelpers.js";

/**
 * Link transitions that animate between pages
 */
export class PageTransition {
  constructor() {
    this.timelines = [];
  }

  async showPageTransition(element) {
    if (!element) {
      return Promise.resolve();
    }

    this.transitionImage = $(".page-transition-overlay__image", element);
    return new Promise((resolve) => {
      const transitionTimeline = gsap.timeline({
        onComplete: () => {
          resolve();
        },
      });

      transitionTimeline
        .to(element, {
          opacity: 1,
          duration: 1.25,
          ease: "power2.inOut",
        })
        .set(element, {
          opacity: 1,
          delay: .5,
        });
    });
  }

  async hidePageTransition(element) {
    if (!element) {
      return Promise.resolve();
    }

    this.transitionImage = $(".page-transition-overlay__image", element);

    return new Promise((resolve) => {
      const hideTimeline = gsap.timeline({
        onComplete: () => {
          resolve();
        },
      });

      // ✅ CRITICAL: Animate the main element FIRST at position 0
      // This ensures it always animates even if child elements don't exist
      hideTimeline.to(
        element,
        {
          opacity: 0,
          duration: 1,
          ease: "power2.inOut",
        },
        0
      ); // Position 0 = start immediately
    });
  }
}
