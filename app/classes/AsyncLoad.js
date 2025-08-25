import Component from "./Component.js";

/**
 * AsyncLoad is a class that loads images asynchronously when they are in the viewport
 */
export default class AsyncLoad extends Component {
  constructor(element) {
    super({ element });
    this.createIntersectionObserver();
  }

  createIntersectionObserver() {
    this.intersectionObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          console.log("isIntersecting");
          if (!this.element.src) {
            this.element.src = this.element.getAttribute("data-src");
            this.element.onload = () => {
              console.log("loaded")
            };
          }
        }
      });
    });
    
    // Start observing the element
    this.intersectionObserver.observe(this.element);
  }
}