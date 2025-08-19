import Page from "../classes/Page.js";

export class About extends Page {
  constructor() {
    super({
      id: "about",
      element: ".about",
      elements: { wrapper: ".page-content" },
    });
  }

  create() {
    super.create();
  }
}
