import Page from "../classes/Page.js";
import { gsap } from "gsap/index.js";

export class Earth extends Page {
  constructor() {
    super({
      id: "earth",
      element: ".earth",
      transitionOverlay: ".transition-overlay",
      elements: { wrapper: ".page-content" },
    });
  }

  create() {
    super.create({});
  }

  async show() {
    return new Promise((resolve) => {
      const hideTimeline = gsap.timeline();

      hideTimeline.to(this.transitionOverlay, {
        transform: "translateY(-100%)",
        duration: 0.5,
        delay: 0.5,
        ease: "expo.out",
        onComplete: () => {
          resolve();
        },
      });
    });
  }
}
