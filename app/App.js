/**
 *  Entry point for the application
 */

import { Router } from "./Router.js";
import { Home } from "./pages/Home.js";
import { About } from "./pages/About.js";
import { Gallery } from "./pages/Gallery.js";
import Observer from "./classes/Observer.js";

class App {
  constructor() {
    this.pageHistory = window.history;
    this.mainElement = document.querySelector("main.main-content");
    this.router = new Router();
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
      this.setupLinkListeners();
      this.router.init();
    });
  }

  setupLinkListeners() {
    this.body = document.querySelector("body");
    document.addEventListener("click", (event) => {
      if (event.target.tagName === "A") {
        event.preventDefault();
        this.nextPage = event.target.getAttribute("href");
        this.onPageChange(this.nextPage);
      }
    });
  }

  async onPageChange(href) {
    if (window.location.pathname.includes(href)) return;
    await this.currentPage.hide();
    const newPage = await this.router.updatePage(href);
    this.currentPage = this.pages[newPage];
    await this.currentPage.create();
    await this.currentPage.show();
  }
}

const app = new App();
