import Page from "./Page.js";

export class References extends Page {
  constructor(options = {}) {
    super({
      element: ".references",
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
