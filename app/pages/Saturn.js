import Page from "../classes/Page.js";


export default class Saturn extends Page {
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
