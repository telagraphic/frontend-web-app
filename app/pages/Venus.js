import Page from "../classes/Page.js";


export class Venus extends Page {
  constructor() {
    super({
      id: "venus",
      element: ".venus",
      transitionOverlay: ".transition-overlay",
      elements: { wrapper: ".page-content" },
    });
  }

  create() {
    super.create({});
  }
}
