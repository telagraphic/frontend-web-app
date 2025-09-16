/**
 *  Entry point for the application
 */

import { Router } from "./classes/Router.js";
import { Preloader } from "./components/Preloader.js";
import { Navigation } from "./components/Navigation.js";
import { $, $$, setupHelpers } from "./utils/Helpers.js";

class App {
  constructor() {
    setupHelpers();
    this.pageHistory = window.history;
    this.mainElement = document.querySelector("main");
    this.router = new Router();
    this.setupPageConfig();
    this.setupPages();
    this.setupApp();
    this.setupEventListeners();
    this.createPreloader();
  }

  setupPageConfig() {
    // Configuration for different environments
    const CONFIG = {
      development: {
        pagePath: "./pages/",
      },
      production: {
        pagePath: "/dist/pages/",
      },
    };

    const isProduction = process.env.NODE_ENV === "production";
    this.pageConfig = isProduction ? CONFIG.production : CONFIG.development;
  }

  /**
   * Register page classes using the data-template field in the main element
   * This data-template field is a key for creating the page instances
   * TODO: Dynamically import the pages
   * @param {string} specificPage - Optional specific page to set (e.g., "gallery", "about") used for hard-refresh
   */
  async setupPages(specificPage = null) {
    this.pages = new Map();

    this.content = $("main");

    // If a specific page is provided, use it; otherwise read from DOM
    if (specificPage) {
      this.template = specificPage;
    } else {
      this.template = this.content.getAttribute("data-template");
    }

    if (this.pages.has(this.template)) {
      const PageClass = this.pages.get(this.template);
      this.currentPage = new PageClass();
    } else {
      await this.loadPage(this.template);
      const PageClass = this.pages.get(this.template);
      this.currentPage = new PageClass();
    }

    this.currentPage.create();

    // Create navigation after setting the correct currentPage
    this.createNavigation();
  }
  /**
   * Dynamically load the page, update this.pages with loaded page
   * Pages are now bundled separately in dist/pages/ for optimal loading
   */
  async loadPage(page) {
    const pagePath = page.charAt(0).toUpperCase() + page.slice(1);
    const pageModule = await import(
      `${this.pageConfig.pagePath}${pagePath}.js`
    );
    
    
    this.pages.set(page, pageModule.default);
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

  /**
   * Create the navigation component
   */
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
      this.preloader.hide();
      setTimeout(() => {
        this.preloader.destroy();
      }, 1000);
    });
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
   * TODO: Consider refactoring into the router, pass an object into with all the information?
   * @param {*} href
   *
   */
  async onPageChange(href) {
    const isValidRoute = this.router.validateRoute(
      href,
      window.location.pathname
    );

    if (!isValidRoute.isValid) {
      if (isValidRoute.action === "skip") return;
      if (isValidRoute.action === "redirect")
        return (window.location.href = isValidRoute.url);
      if (isValidRoute.action === "redirect-home")
        return this.router.redirectToHome();
    }

    await this.currentPage.hide();
    await this.router.updatePage(href, isValidRoute.normalizedPath);
    
    // Get the page class and create a new instance
    if (this.pages.has(this.template)) {
      const PageClass = this.pages.get(this.template);
      this.currentPage = new PageClass();
    } else {
      await this.loadPage(this.template);
      const PageClass = this.pages.get(this.template);
      this.currentPage = new PageClass();
    }
    await this.currentPage.create();
    this.navigation.onChange(this.currentPage);
    await this.currentPage.show();
  }

  setupEventListeners() {
    // Update the currentPage when the hard-refresh event is triggered
    window.addEventListener("hard-refresh", (event) => {
      // Extract the route from the event detail
      const route = event.detail?.route;
      this.setupPages(route);
      // Navigation is now created in setupPages, so no need to call it here
    });
  }

  removeEventListeners() {}
}

const app = new App();
