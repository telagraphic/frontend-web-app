import Page from "../classes/Page.js";


export default class Pluto extends Page {
  constructor() {
    super({
      id: "pluto",
      element: ".pluto",
      transitionOverlay: ".transition-overlay",
      elements: { wrapper: ".page-content" },
    });
  }

  create() {
    super.create({});
  }
}
