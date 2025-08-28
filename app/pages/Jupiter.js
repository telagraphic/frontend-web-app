import Page from "../classes/Page.js";
import { gsap } from "gsap/index.js";

export class Jupiter extends Page {
  constructor() {
    super({
      id: "jupiter",
      element: ".jupiter",
      transitionOverlay: ".transition-overlay",
      elements: { wrapper: ".page-content" },
    });
  }

  create() {
    super.create({});
  }
}
