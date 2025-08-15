import Page from "../classes/Page.js";
export class Gallery extends Page {
  constructor() {
    super({
      id: "gallery",
      element: ".gallery",
      elements: { header: "h1", paragraph: "p" },
    });
  }

  create() {
    super.create();
  }
}
