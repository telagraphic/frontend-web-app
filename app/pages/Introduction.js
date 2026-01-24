import Page from "./Page.js";

export class Introduction extends Page {
  constructor(options = {}) {
    super({
      element: ".introduction",
      elements: { wrapper: ".page-content" },
      // Forward services and any other options
      ...options,
    });
  }

  create() {
    super.create({});
  }
}
