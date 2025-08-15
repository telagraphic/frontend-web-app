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
    this.currentPage.show();
  }

  setupApp() {
    document.addEventListener("DOMContentLoaded", () => {
      this.router.init();
    });
  }
}

const app = new App();
