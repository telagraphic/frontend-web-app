import { $ } from "../utilities/DOMHelpers.js";

/**
 * Link transitions that animate between pages
 * We need to update the page-transition-overlay markup to remove the image and replace with a blank div with proper styling!
 */
export class FadeInOutAnimation {
  constructor() {
    this.timelines = [];
  }

  async showPageTransition(element) {
    if (!element) {
      return Promise.resolve();
    }

    this.transitionImage = $(".page-transition-overlay__image", element);
    return new Promise((resolve) => {
      // Fade in to visible (opacity: 1)
      // Note: CSS has opacity: 1 by default, but Router.initialize() may set it to 0
      // We animate from current state to 1
      // The overlay has white background, so it covers the page even during animation
      gsap.to(element, {
        opacity: 1,
        duration: 0.6,
        ease: "power2.inOut",
        onComplete: resolve,
      });
    });
  }

  async hidePageTransition(element) {
    if (!element) {
      return Promise.resolve();
    }

    this.transitionImage = $(".page-transition-overlay__image", element);

    return new Promise((resolve) => {
      // Fade out to hidden (opacity: 0)
      // Note: CSS already has opacity: 1 by default, so no need to set it before animating
      gsap.to(element, {
        opacity: 0,
        duration: 0.6,
        delay: 0.5,
        ease: "power2.inOut",
        onComplete: resolve,
      });
    });
  }
}
