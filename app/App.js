/**
 *  Entry point for the application
 *  Handles shared initialization for MPA: preloader, navigation, page transitions
 */

import { createMPAServices } from "./services/MPAServiceFactory.js";
import { Preloader } from "./components/Preloader.js";
import { MPAPageTransition } from "./animations/MPAPageTransition.js";
import { liveReload } from "./config/Environment.js";
import { SELECTORS, EVENTS } from "./utilities/Constants.js";
import { $ } from "./utilities/DOMHelpers.js";

class App {
  constructor() {
    this.preloaderVisible = false;
    this.initialized = false;
  }

  /**
   * Initialize the application state
   * Made idempotent - safe to run multiple times
   */
  async init() {
    // Prevent multiple initializations
    if (this.initialized) {
      return;
    }
    
    this.createServices();
    this.createNavigation();
    this.createPreloader();
    this.createPageTransition();
    
    // Expose globally for inline scripts to use
    window.app = this;
    window.appServices = this.services;
    
    this.initialized = true;
    liveReload();
  }

  /**
   * Create the services for the application
   */
  createServices() {
    this.services = createMPAServices();
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
    if (this.navigation && !this.navigation.element) {
      this.navigation.create();
    }
  }

  /**
   * Display preloader on first page visit only (session-based)
   */
  createPreloader() {
    // Check if preloader should be shown (first visit in session)
    const shouldShowPreloader = !sessionStorage.getItem('preloaderShown');
    
    // Don't create preloader if it's already been shown or if one already exists
    if (!shouldShowPreloader || this.preloaderVisible || this.preloader) {
      // If preloader already shown, hide the element and ensure smoothScroll is ready
      if (!shouldShowPreloader) {
        const preloaderElement = $(SELECTORS.PRELOADER);
        if (preloaderElement) {
          preloaderElement.style.display = 'none';
          preloaderElement.style.opacity = '0';
        }
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
      // No preloader element, initialize smoothScroll immediately
      if (this.services.smoothScroll && !this.services.smoothScroll.isEnabled()) {
        this.services.smoothScroll.create();
      }
      return;
    }
    
    this.preloader = new Preloader();
    
    // Reset preloader element if it was previously hidden
    preloaderElement.style.display = '';
    preloaderElement.style.opacity = '';
    
    this.preloader.create();

    this.preloaderHandler = ({ message }) => {
      sessionStorage.setItem('preloaderShown', 'true');
      if (this.services.smoothScroll) {
        this.services.smoothScroll.create();
        this.services.smoothScroll.scrollTo(0, { immediate: true });
      }
      if (this.preloader) {
        this.preloader.hide();
        this.preloader.removeAllListeners(EVENTS.PRELOADER_COMPLETE);
        if (this.preloader.preloaderAnimation) {
          this.preloader.preloaderAnimation.remove();
        }
      }
      this.preloader = null;
      this.preloaderVisible = true;
    }

    this.preloader.on(EVENTS.PRELOADER_COMPLETE, this.preloaderHandler);
  }

  /**
   * Initialize page transition handler
   */
  createPageTransition() {
    if (this.pageTransition) return;
    this.pageTransition = new MPAPageTransition();
    this.pageTransition.initialize();
  }
}

const app = new App();
app.init().catch((error) => {
  console.error('App.init() failed:', error);
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