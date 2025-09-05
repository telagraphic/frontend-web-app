import Page from "../classes/Page.js";


export class Neptune extends Page {
  constructor() {
    super({
      id: "neptune",
      element: ".neptune",
      transitionOverlay: ".transition-overlay",
      elements: { wrapper: ".page-content" },
    });
  }

  create() {
    super.create({});
  }

}
