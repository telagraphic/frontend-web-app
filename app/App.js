/**
 *  Entry point for the application
 *  Handles shared initialization for MPA: preloader, navigation, page transitions
 */

import { createServicesOnce } from "./services/ServiceFactory.js";
import { Preloader } from "./components/Preloader.js";
import { Router } from "./services/Router.js";
import { TransitionsManager } from "./transitions/TransitionsManager.js";
import { liveReload } from "./config/Environment.js";
import { SELECTORS, EVENTS, TRANSITION_TYPES } from "./utilities/Constants.js";
import { $ } from "./utilities/DOMHelpers.js";
import { whenDOMReady } from "./utilities/AsyncHelpers.js";
import { setupPageConfig } from "./config/Environment.js";

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
    await this.bootstrapCurrentPage();
    
    this.isAppInitialized = true;
    liveReload();
  }

  /**
   * Create the services for the application
   */
  createServices() {
    this.services = createServicesOnce();
    this.siteConfig = this.services.siteConfig;
    this.navigation = this.services.navigation;
    this.smoothScroll = this.services.smoothScroll;
    this.animationsManager = this.services.animationsManager;
    this.footnotes = this.services.footnotes;
  }

  /**
   * Bootstrap the current page module based on `main[data-template]`.
   */
  async bootstrapCurrentPage() {
    const main = document.querySelector(SELECTORS.MAIN_WITH_TEMPLATE);
    const template = main?.getAttribute("data-template");
    if (!template) {
      console.error("App.bootstrapCurrentPage(): missing main[data-template]");
      return;
    }

    const className = this.siteConfig.getClassByTemplate(template);
    if (!className) {
      console.error(`App.bootstrapCurrentPage(): no page class for template: ${template}`);
      return;
    }

    const { pagePath } = setupPageConfig();
    const pageModule = await import(`${pagePath}${className}.js`);
    const PageClass = pageModule.default || pageModule[className];
    if (!PageClass) {
      console.error(`App.bootstrapCurrentPage(): failed to resolve export for ${className}`);
      return;
    }

    // For View pages we pass the template-based selector so it can target the correct root.
    const elementSelector = `.${template}`;

    const page =
      className === "View"
        ? new PageClass({ element: elementSelector, ...this.services })
        : new PageClass({ ...this.services });

    await page.create();
    await page.show();
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
    
    // Create and initialize TransitionsManager with selected transition strategy
    // Default to 'custom' for image-based transitions, set to 'generic' for simple fade transitions
    if (!this.transitionsManager) {
      this.transitionsManager = new TransitionsManager({ 
        siteConfig: this.siteConfig,
        sessionStorage: window.sessionStorage,
        transitionType: TRANSITION_TYPES.CUSTOM // Change to TRANSITION_TYPES.GENERIC for simple fade transitions
      });
      await this.transitionsManager.init();
    }
    
    this.pageTransition = new Router({
      siteConfig: this.siteConfig,
      transitionsManager: this.transitionsManager,
      smoothScroll: this.smoothScroll,
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