import Page from "../classes/Page.js";


export class Uranus extends Page {
  constructor() {
    super({
      id: "uranus",
      element: ".uranus",
      transitionOverlay: ".transition-overlay",
      elements: { wrapper: ".page-content" },
    });
  }

  create() {
    super.create({});
  }
}
