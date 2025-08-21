import Component from "../classes/Component.js";

/**
 * Preloader is called on intial page load
 */

export class Preloader extends Component {
  constructor() {
    super({
      element: ".preloader",
      elements: {
        title: ".preloader h1",
        counter: ".preloader p",
        images: Array.from(document.querySelectorAll("img")),
      },
    });

    this.images = Array.from(this.elements.images);
    this.images.length;
    this.imagesLength = 0;

    this.createLoader();
  }

  /**
   * Wait for images to load and then update the DOM with the path
   */
  createLoader() {
    Object.entries(this.elements.images).forEach(([position, element]) => {
      element.onload = () => this.updatePreloader(element);
      element.src = element.getAttribute("data-src");
    });
  }

  /**
   * Update the preloader template with the image loading percentage
   * @param {*} imageElement
   */
  updatePreloader(imageElement) {
    this.imagesLength += 1;
    const percent = Math.round((this.imagesLength / this.images.length) * 100);
    this.elements.counter.innerHTML = `${percent}%`;

    if (percent === 100) {
      this.emit("preloader-complete", { message: "Preloader completed" });
    }
  }

  hide() {
    this.element.style.opacity = 0;
  }

  destroy() {
    this.element.remove();
  }
}
