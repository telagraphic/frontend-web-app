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
    super.create();
    this.preloadImages();
  }

  preloadImages() {
    // consoles with the src but the DOM is not updated yet
    Object.entries(this.elements.images).forEach(([position, element]) => {
      element.onload = () => {
        element.src = element.getAttribute("data-src");
      };
    });
  }
}
