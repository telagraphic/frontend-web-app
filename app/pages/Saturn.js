import Page from "../classes/Page.js";
import { gsap } from "gsap/index.js";

export class Saturn extends Page {
  constructor() {
    super({
      id: "saturn",
      element: ".saturn",
      transitionOverlay: ".transition-overlay",
      elements: { wrapper: ".page-content" },
    });
  }

  create() {
    super.create({});
  }
}
