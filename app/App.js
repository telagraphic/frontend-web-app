/**
 *  Entry point for the application
 */

import { Router } from "./Router.js";
import { Home } from "./pages/Home.js";
import { About } from "./pages/About.js";
import { Gallery } from "./pages/Gallery.js";

class App {
  constructor() {
    this.router = new Router();
    this.links = document.querySelectorAll("a");
    this.pageHistory = window.history;
    this.mainElement = document.querySelector("main");
    this.setupPages();
    this.setupApp();
  }

  setupPages() {
    this.pages = {
      home: new Home(),
      about: new About(),
      gallery: new Gallery(),
    };

    this.content = document.querySelector("main");
    this.template = this.content.getAttribute("data-template");
    this.currentPage = this.pages[this.template];
    this.currentPage.create();
  }

  setupApp() {
    document.addEventListener("DOMContentLoaded", () => {
      this.setupLinks();
      this.setupPopState();
    });
  }

  setupLinks() {
    this.links.forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        this.nextPage = event.target.getAttribute("href");
        this.navigateToPage(this.nextPage);
      });
    });
  }

  /**
   * Replace current DOM with new page DOM
   *
   */
  async navigateToPage(newPage) {
    await this.currentPage.hide();

    try {
      const response = await fetch(newPage);

      if (response.ok) {
        await this.updateMarkup(response);

        scrollTo({ top: 0, left: 0, behavior: "instant" });
        await this.currentPage.show();
        await this.updateHistory(newPage);
        // this.setupLinks(); optional, fix main element content wrapper issue
      } else {
        // TODO: this resets the history state, perhaps go to a index.html state instead!
        window.location.replace("index.html");
        scrollTo({ top: 0, left: 0, behavior: "instant" });
      }
    } catch (error) {
      console.error("Error updating page:", error);
    }
  }

  /**
   * Update the currentPage and template, fix the mainElement content wrapper issue
   * @param {*} response
   */
  async updateMarkup(response) {
    const newPageHTML = await response.text();
    const newPageDOM = new DOMParser().parseFromString(
      newPageHTML,
      "text/html",
    );
    const newPageContent = newPageDOM.querySelector("main");
    const newPageFragment = new DocumentFragment().appendChild(newPageContent);
    this.mainElement.replaceChildren(newPageFragment);
  }

  /**
   * Updates the history state with the new page
   * @param {*} nextPage
   * @param {*} addToHistory
   * @returns
   */
  async updateHistory(nextPage, addToHistory = true) {
    return new Promise((resolve, reject) => {
      if (addToHistory) {
        // TODO: will need to update when server is setup
        if (`/pages/${nextPage}` !== window.location.pathname) {
          this.pageHistory.pushState({ route: nextPage }, "", nextPage);
        }
      }
      resolve();
    });
  }

  /**
   * Setup initial state and prevent back/forward button to add to history
   */
  setupPopState() {
    if (this.pageHistory.state == null) {
      const initialPage = window.location.pathname;
      this.pageHistory.replaceState({ route: initialPage }, "", initialPage);
    }

    window.addEventListener("popstate", (event) => {
      this.navigateToPage(event.state.route, false);
    });
  }
}

const app = new App();
