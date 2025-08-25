/**
 *  Entry point for the application
 */

import { Router } from "./classes/Router.js";
import { Home } from "./pages/Home.js";
import { About } from "./pages/About.js";
import { Gallery } from "./pages/Gallery.js";
import { Preloader } from "./components/Preloader.js";
import { Navigation } from "./components/Navigation.js";
import "../styles/styles.scss";

class App {
  constructor() {
    this.pageHistory = window.history;
    this.mainElement = document.querySelector("main");
    this.router = new Router();
    this.setupPages();
    this.setupApp();
    this.setupEventListeners();
    // this.createPreloader();
    this.createNavigation();
  }



  /**
   * Register page classes, set the data-template field for
   */
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

  /**
   * Set up app event listeners and router
   */
  setupApp() {
    document.addEventListener("DOMContentLoaded", () => {
      this.router.create();
      this.setupLinkListeners();
    });
  }

  createNavigation() {
    this.navigation = new Navigation({
      currentPage: this.currentPage,
    });
  }


  /**
   * Display preloader on first page visit
   */
  createPreloader() {
    this.preloader = new Preloader();
    this.preloader.on("preloader-complete", ({ message }) => {
      // TODO: Images are not cached when visiting back home!
      this.preloader.hide();
      setTimeout(() => {
        this.preloader.destroy();
      }, 2000);
    });
  }

    /**
   * Update the preloader template with the image loading percentage
   * @param {*} imageElement
   */
    updatePreloader(imageElement) {
      this.imagesLength += 1;
      this.imagesLoaded += 1;
      const percentage = Math.round(
        (this.imagesLoaded / this.imagesLength) * 100,
      );
      this.preloader.update(percentage);
    }

  /**
   * Event delegation for navigation links
   * TODO: check for the link class for internal versus external links
   */
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

  /**
   * Handle page navigation flow and page change registration
   * @param {*} href
   *
   */
  async onPageChange(href) {
    console.log('onPageChange', href);
    const isValidRoute = this.router.validateRoute(href, window.location.pathname);
    
    if (!isValidRoute.isValid) {
      if (isValidRoute.action === 'skip') return;
      if (isValidRoute.action === 'redirect') return window.location.href = isValidRoute.url;
      if (isValidRoute.action === 'redirect-home') return this.router.redirectToHome();
    }
  
    // Valid route - proceed with navigation
    await this.currentPage.hide();
    await this.router.updatePage(href, isValidRoute.normalizedRootPath);
    
    this.currentPage = this.pages[this.router.template];
    await this.currentPage.create();
    this.navigation.onChange(this.currentPage);
    await this.currentPage.show();
  }

  setupEventListeners() {}

  removeEventListeners() {}

}

const app = new App();
