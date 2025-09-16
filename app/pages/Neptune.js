import Page from "../classes/Page.js";


export default class Neptune extends Page {
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
