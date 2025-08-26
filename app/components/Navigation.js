import Component from "../classes/Component.js";
import { gsap } from "gsap/index.js";
import { RED, GREEN, BLUE, YELLOW, PURPLE, ORANGE, PINK, BROWN, GRAY, BLACK, WHITE } from "../utils/Colors.js";

export class Navigation extends Component {
  constructor({ currentPage }) {
    super({
      element: "nav",
      elements: {
        links: "nav a",
      },
    });

    this.onChange(currentPage);
  }

  /**
   * Hook to update the navigation links when the page changes, hide links, change colors depending on the page, etc...
   * @param {Page} currentPage class instance of the current page
   */
  onChange(currentPage) {
    /**
     * Re-query the DOM for the links due the DOM not being ready when calling the Component.create method
     * Component class is referencing an older NodeList
     */
    this.elements.links = document.querySelectorAll("nav a");

    if (currentPage.id === "home") {
      gsap.to(this.elements.links, {
        color: PURPLE,
        duration: 0.3,
        ease: "power2.inOut",
      })
    } else if (currentPage.id === "about") {
      gsap.to(this.elements.links, {
        color: RED,
        duration: 0.3,
        ease: "power2.inOut",
      })
    } else if (currentPage.id === "gallery") {
      gsap.to(this.elements.links, {
        color: RED,
        duration: 0.3,
        ease: "power2.inOut",
      })
    }
  }
}