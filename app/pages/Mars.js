import Page from "../classes/Page.js";


export class Mars extends Page {
  constructor() {
    super({
      id: "mars",
      element: ".mars",
      transitionOverlay: ".transition-overlay",
      elements: { wrapper: ".page-content" },
    });
  }

  create() {
    super.create({});
  }
}
