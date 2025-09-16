import Page from "../classes/Page.js";


export default class Venus extends Page {
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
