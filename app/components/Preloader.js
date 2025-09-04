import Component from "../classes/Component.js";

/**
 * Preloader element is displayed until all images are loaded and ready to be displayed
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
    this.imagesLoaded = 0;

    this.createLoader();
  }

  /**
   * Wait for images to load and then update the DOM with the path
   */
  createLoader() {
    Object.values(this.elements.images).forEach((element) => {
      // Call onload to register the event listener before the image is loaded, cached images will trigger the event listener
      element.onload = () => this.updatePreloader();
      element.src = element.getAttribute("data-src");
    });
  }

  /**
   * Update the preloader template with the image loading percentage
   */
  updatePreloader() {
    this.imagesLoaded += 1;
    const percent = Math.round((this.imagesLoaded / this.images.length) * 100);
    this.elements.counter.innerHTML = `${percent}%`;

    if (percent === 100) {
      this.emit("preloader-complete", { message: "Preloader completed" });
    }
  }

  /**
   * Hide the preloader element
   */
  hide() {
    this.element.style.opacity = 0;
  }

  /**
   * Remove the preloader element
   */
  destroy() {
    this.element.remove();
  }
}
