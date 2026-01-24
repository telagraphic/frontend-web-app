import Page from "./Page.js";

export class Introduction extends Page {
  constructor(options = {}) {
    super({
      element: ".introduction",
      pageTransitionOverlay: ".page-transition-overlay",
      elements: { wrapper: ".page-content" },
      // Forward services and any other options
      ...options,
    });
  }

  create() {
    super.create({});
  }
}
