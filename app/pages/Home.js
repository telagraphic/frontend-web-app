import Page from "../classes/Page.js";

export class Home extends Page {
  constructor() {
    super({
      id: "home",
      element: ".home",
      elements: {
        wrapper: ".page-content",
        header: "h1",
        button: "button",
        images: document.querySelectorAll("img"),
      },
    });

    this.images = document.querySelectorAll("img");
  }

  create() {
    super.create({});
  }
}
