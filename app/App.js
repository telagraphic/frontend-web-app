/**
 *  Entry point for the application
 */

import { createServices } from "./services/ServicesFactory.js";
import { Preloader } from "./components/Preloader.js";
import { liveReload, setupPageConfig } from "./config/Environment.js";
import { SELECTORS, EVENTS } from "./utilities/Constants.js";
import { $ } from "./utilities/DOMHelpers.js";

class App {
  constructor() {
    this.pageConfig = setupPageConfig();
    this.preloaderVisible = false;
  }

  /**
   * Initialize the application state
   */
  async init() {
    this.createServices();
    await this.transitionsService.init();
    await this.services.router.start(); // Calls pageLoader.create() to initialize the first page
    this.createNavigation();
    this.createPreloader();
    liveReload();
  }

  /**
   * Create the services for the application
   */
  createServices() {
    this.services = createServices();
    this.siteConfig = this.services.siteConfig;
    this.router = this.services.router;
    this.navigation = this.services.navigation;
    this.smoothScroll = this.services.smoothScroll;
    this.animationsService = this.services.animationsService;
    this.transitionsService = this.services.transitionsService;
    this.footnotes = this.services.footnotes;
    this.pageRegistry = this.services.pageRegistry;
    this.pageLoader = this.services.pageLoader;
    this.pageManager = this.services.pageManager;
    this.routerHistory = this.services.routerHistory;
    this.routerResolver = this.services.routerResolver;
  }

  /**
   * Create the navigation component
   */
  createNavigation() {
    this.navigation.create();
  }

  /**
   * Display preloader on first page visit only
   */
  createPreloader() {
    // Don't create preloader if it's already been shown or if one already exists
    if (this.preloaderVisible || this.preloader) return;    
    const preloaderElement = $(SELECTORS.PRELOADER);
    if (!preloaderElement) return;
    
    this.currentPage = this.services.registryService.getCurrentPage();
    this.preloader = new Preloader();
    this.preloader.create();

    this.preloaderHandler = ({ message }) => {
      this.currentPage.smoothScroll.create(); // TODO: turn on smooth scroll on initial page load, or listen for this event in Page.listeners and keep it encapsulated
      this.currentPage.smoothScroll.scrollTo(0, { immediate: true });
      this.preloader.destroy();
      this.preloader = null;
      this.preloaderVisible = true;
    }

    this.preloader.on(EVENTS.PRELOADER_COMPLETE, this.preloaderHandler);
  }
}

const app = new App();
app.init();


/*
* Enable Hot Module Reloading for development environment
* import.meta.hot.accept() accepts updates for the module where it's called.
* Calling it in Environment.js only accepts updates for Environment.js.
* Calling it in App.js accepts updates for App.js and its dependency graph.
*/
if (import.meta.hot) {
  import.meta.hot.accept();
}