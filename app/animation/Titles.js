import { Animation } from "../classes/Animation.js";
import { gsap } from "gsap/index.js";

/**
 * Title animations that refrerence
 */
export default class Titles extends Animation {
  constructor(element, elements) {
    super(element, elements);
    this.createIntersectionObserver();
  }

  /**
   * Animate the title in
   * Overrides the parent class method that is called in the Intersection Observer
   */
  animateIn() {
    const showTimeline = gsap.timeline();

    showTimeline.fromTo(
      this.element,
      {
        autoAlpha: 0,
      },
      {
        autoAlpha: 1,
        duration: 0.5,
        ease: "power2.inOut",
      },
    );
  }

  /**
   * Animate the title out
   * Overrides the parent class method that is called in the Intersection Observer
   */
  animateOut() {
    const hideTimeline = gsap.timeline();

    // It's fastest to just hide the element, then replay the animateIn animation
    hideTimeline.set(this.element, {
      autoAlpha: 0,
    });
  }
}
