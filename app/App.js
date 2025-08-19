/**
 *  Entry point for the application
 */

import { Router } from "./Router.js";
import { Home } from "./pages/Home.js";
import { About } from "./pages/About.js";
import { Gallery } from "./pages/Gallery.js";
import { Preloader } from "./components/Preloader.js";

class App {
  constructor() {
    this.pageHistory = window.history;
    this.mainElement = document.querySelector("main.main-content");
    this.router = new Router();
    this.setupPages();
    this.setupApp();
    this.updateRAF();
    this.setupEventListeners();
    // this.createPreloader();
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
    this.onResize();
  }

  setupApp() {
    document.addEventListener("DOMContentLoaded", () => {
      this.setupLinkListeners();
      this.router.init();
    });
  }

  createPreloader() {
    this.preloader = new Preloader();
    this.preloader.on("preloader-complete", ({ message }) => {
      // TODO: Images are not cached when visiting back home!
      this.onResize();
      this.preloader.hide();
      setTimeout(() => {
        this.preloader.destroy();
      }, 2000);
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
    this.onResize();
    await this.currentPage.show();
  }

  updateRAF() {
    if (this.currentPage && this.currentPage.updateRAF) {
      this.currentPage.updateRAF();
    }
    this.frame = window.requestAnimationFrame(this.updateRAF.bind(this));
  }

  onResize() {
    if (this.currentPage && this.currentPage.onResize) {
      this.currentPage.onResize();
    }
  }

  setupEventListeners() {
    window.addEventListener("resize", this.onResize.bind(this));
  }
}

const app = new App();
