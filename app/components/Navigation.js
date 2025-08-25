import Component from "../classes/Component.js";

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

    if (currentPage.id === "home") {
      console.log("home");
    } else {
      console.log("not home");
    }
  }
}