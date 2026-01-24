import { setupPageConfig } from "../config/Environment.js";
import { SELECTORS, ATTRIBUTES } from "../utilities/Constants.js";
import { $ } from "../utilities/DOMHelpers.js";
import { createError, ERROR_CODES } from "../utilities/ErrorRegistry.js";


/**
 * PageLoader is responsible for loading the page class
 */
export class PageLoader {
  constructor({ siteConfig, pageRegistry, smoothScroll, animationsManager, transitionsManager, footnotes }) {
    this.pageConfig = setupPageConfig();
    this.siteConfig = siteConfig;
    this.pageRegistry = pageRegistry; // Can be undefined initially, set via setPageRegistry()
    this.smoothScroll = smoothScroll;
    this.animationsManager = animationsManager;
    this.transitionsManager = transitionsManager;
    this.footnotes = footnotes;
    this.nextPageInstance = null;
    this.loadedPageClass = null;
    this.cachedPageClass = null;
  }

  /**
   * Set the page registry (injected after construction to resolve circular dependency)
   * @param {PageRegistry} pageRegistry - The page registry instance
   */
  setPageRegistry(pageRegistry) {
    this.pageRegistry = pageRegistry;
  }

  async create() {
    this.pageContent = $(SELECTORS.MAIN);
    this.template = this.pageContent.getAttribute(ATTRIBUTES.DATA_TEMPLATE);
    if (this.template) {
      document.body.setAttribute(ATTRIBUTES.DATA_PAGE, this.template);
    }
    await this.createPageOnFirstVisit();
  }

   /**
   * Initialize the page on first visit
   * Called from App#init -> Router#start -> PageLoader#create
   * @returns {Promise<void>}
   */
   async createPageOnFirstVisit() {
    try {
      // Loads the page class on direct visits to the page and initial page load
      let pageClass;
      if (!this.pageRegistry.hasPage(this.template)) {
        this.loadedPageClass = await this.loadPage(this.template);
        pageClass = this.loadedPageClass;
      } else {
        this.cachedPageClass = this.pageRegistry.getPage(this.template);
        pageClass = this.cachedPageClass;
      }
      
      // If the page class does not load due to an error or typo in the name, then load the home page instead
      if (!pageClass) {
        this.loadedPageClass = await this.loadPage("home");
        pageClass = this.loadedPageClass;
      }

      // If home page fails to load, then throw an error
      if (!pageClass) {
        throw createError(ERROR_CODES.PAGE_NOT_FOUND, { page: 'home (fallback)' });
      }

      this.nextPageInstance = this.initializePage(pageClass);
      await this.nextPageInstance.create();
      await this.nextPageInstance.show();
    } catch (error) {
      // If page loading fails, log and re-throw
      if (error.code) {
        console.error(`Page loading error:`, error.message);
      } else {
        console.error(`Unexpected error loading page:`, error);
      }
      throw error;
    }
  }

  /**
   * Gets the page instance from the pageRegistry or loads the page class and returns the page instance
   * @param {string} pageTemplate - The template of the page to get
   * @returns {Promise<Page>} The page instance
   */
  async getPage(pageTemplate) {
    if (this.pageRegistry.hasPage(pageTemplate)) {
      this.cachedPageClass = this.pageRegistry.getPage(pageTemplate);
      return this.initializePage(this.cachedPageClass);
    } else {
      this.loadedPageClass = await this.loadPage(pageTemplate);
      return this.initializePage(this.loadedPageClass);
    }
  }

  /**
   * Initialize the page instance and set the currentPage in the pageRegistry
   * @param {*} pageTemplate 
   * @returns {Page} The page instance
   */
  initializePage(pageClass) {
    const pageInstance = new pageClass({
      smoothScroll: this.smoothScroll,
      animationsManager: this.animationsManager,
      transitionsManager: this.transitionsManager,
      footnotes: this.footnotes,
    });
    this.pageRegistry.setCurrentPage(pageInstance);
    return pageInstance;
  }

  /**
   * Dynamically load the page, update this.pages with loaded page
   * Pages are now bundled separately in dist/pages/ for optimal loading
   */
  async loadPage(page) {
    // Check if already loaded
    if (this.pageRegistry.hasPage(page)) {
      return this.pageRegistry.getPage(page);
    }

    // Get class name from site config
    const className = this.siteConfig.getClass(page);
    if (!className) {
      throw createError(ERROR_CODES.CLASS_NOT_FOUND, { className: `template: ${page}` });
    }

    try {
      const pageModule = await import(
        `${this.pageConfig.pagePath}${className}.js`
      );

      // Handle both default and named exports for compatibility
      const pageClass = pageModule.default || pageModule[className];

      if (!pageClass) {
        throw createError(ERROR_CODES.CLASS_NOT_FOUND, { 
          className, 
          availableExports: Object.keys(pageModule) 
        });
      }

      // Store the loaded class
      this.pageRegistry.setPage(page, pageClass);
      return pageClass;
    } catch (error) {
      // Re-throw if it's already an ErrorRegistry error
      if (error.code) {
        throw error;
      }
      // Wrap other errors (network, import failures) as network errors
      throw createError(ERROR_CODES.NETWORK_ERROR, { message: `Error loading page ${page}: ${error.message}` });
    }
  }
}