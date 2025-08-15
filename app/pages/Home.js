import Page from "../classes/Page.js";

export class Home extends Page {
  constructor() {
    super({
      id: "home",
      element: ".home",
      elements: {
        header: "h1",
        button: "button",
      },
    });
  }

  create() {
    super.create();
  }
}
