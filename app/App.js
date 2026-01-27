/**
 *  Entry point for the application
 *  Handles shared initialization for MPA: preloader, navigation, page transitions
 */

import { createServices } from "./services/ServiceFactory.js";
import { Preloader } from "./components/Preloader.js";
import { Router } from "./services/Router.js";
import { TransitionsManager } from "./animations/TransitionsManager.js";
import { liveReload } from "./config/Environment.js";
import { SELECTORS, EVENTS } from "./utilities/Constants.js";
import { $ } from "./utilities/DOMHelpers.js";
import { whenDOMReady } from "./utilities/AsyncHelpers.js";

class App {
  constructor() {
    this.preloaderVisible = false;
    this.isAppInitialized = false;
  }

  /**
   * Initialize the application state
   * Made idempotent - safe to run multiple times
   */
  async init() {
    // Prevent multiple initializations
    if (this.isAppInitialized) {
      return;
    }
    
    this.createServices();
    this.createNavigation();
    this.createPreloader();
    await this.createPageTransition();
    
    // Expose globally for inline scripts to use
    window.app = this;
    window.appServices = this.services;
    
    this.isAppInitialized = true;
    liveReload();
  }

  /**
   * Create the services for the application
   */
  createServices() {
    this.services = createServices();
    this.siteConfig = this.services.siteConfig;
    this.navigation = this.services.navigation;
    this.smoothScroll = this.services.smoothScroll;
    this.animationsManager = this.services.animationsManager;
    this.footnotes = this.services.footnotes;
  }

  /**
   * Create the navigation component
   */
  createNavigation() {
    if (this.navigation) {
      this.navigation.create();
    }
  }

  /**
   * Display preloader on first page visit only (session-based)
   */
  createPreloader() {
    // Don't create preloader if it's already been shown or if one already exists
    if (!Preloader.shouldShow() || this.preloaderVisible || this.preloader) {
      // If preloader already shown, hide element and ensure smoothScroll is ready
      if (!Preloader.shouldShow()) {
        const preloader = new Preloader();
        preloader.hideIfAlreadyShown();
        if (this.services.smoothScroll) {
          if (!this.services.smoothScroll.isEnabled()) {
            this.services.smoothScroll.create();
          }
          this.services.smoothScroll.scrollTo(0, { immediate: true });
        }
      }
      return;
    }

    const preloaderElement = $(SELECTORS.PRELOADER);
    if (!preloaderElement) {
      if (this.services.smoothScroll && !this.services.smoothScroll.isEnabled()) {
        this.services.smoothScroll.create();
      }
      return;
    }

    this.preloader = new Preloader();
    this.preloader.show();
    this.preloader.create();

    this.preloader.setupCompletionHandler(() => {
      if (this.services.smoothScroll) {
        this.services.smoothScroll.create();
        this.services.smoothScroll.scrollTo(0, { immediate: true });
      }
      this.preloader = null;
      this.preloaderVisible = true;
    });
  }

  /**
   * Initialize page transition handler
   */
  async createPageTransition() {
    if (this.pageTransition) return;
    
    // Create and initialize TransitionsManager for preloading transition images
    if (!this.transitionsManager) {
      this.transitionsManager = new TransitionsManager({ 
        siteConfig: this.siteConfig,
        sessionStorage: window.sessionStorage
      });
      await this.transitionsManager.init();
    }
    
    this.pageTransition = new Router({
      siteConfig: this.siteConfig,
      transitionsManager: this.transitionsManager
    });
    await this.pageTransition.initialize();
  }
}

const app = new App();
whenDOMReady(() => {
  app.init().catch((error) => {
    console.error('App.init() failed:', error);
  });
});


/*
* Enable Hot Module Reloading for development environment
* import.meta.hot.accept() accepts updates for the module where it's called.
* Calling it in Environment.js only accepts updates for Environment.js.
* Calling it in App.js accepts updates for App.js and its dependency graph.
*/
if (import.meta.hot) {
  import.meta.hot.accept();
}