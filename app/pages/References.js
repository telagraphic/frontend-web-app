import Page from "./Page.js";

export class References extends Page {
  constructor(options = {}) {
    super({
      element: ".references",
      elements: { wrapper: ".page-content" },
      // Forward services and any other options
      ...options,
    });
  }

  async create() {
    await super.create();
  }
}
