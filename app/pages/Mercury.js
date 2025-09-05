import Page from "../classes/Page.js";


export class Mercury extends Page {
  constructor() {
    super({
      id: "mercury",
      element: ".mercury",
      transitionOverlay: ".transition-overlay",
      elements: { wrapper: ".page-content" },
    });
  }

  create() {
    super.create({});
  }

}
