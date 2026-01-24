import { nextPaint } from "../utilities/AsyncHelpers.js";
import { RouteValidationResult } from "./RouterValidation.js";
import {
  SELECTORS,
  ATTRIBUTES,
  EVENTS,
  VALUES,
} from "../utilities/Constants.js";
import { createError, ERROR_CODES, isErrorCode } from "../utilities/ErrorRegistry.js";

/**
 * Move Resolver,PageRegistry, PageContentManager to this class.
 * Will handle the page lifecycle and navigation.
 *
 * 1. Validate route
 * 2. Hide current page
 * 3. Update page markup
 * 4. Load page class
 * 5. Create page instance
 * 6. Update navigation
 * 7. Show page
 */
export class Router {
  constructor({
    siteConfig,
    pageRegistry,
    pageLoader,
    pageManager,
    routerHistory,
    routerResolver,
    smoothScroll,
    transitionsManager,
    footnotes,
    navigation,
  }) {
    this.siteConfig = siteConfig;
    this.pageRegistry = pageRegistry;
    this.pageLoader = pageLoader;
    this.pageManager = pageManager;
    this.routerHistory = routerHistory;
    this.routerResolver = routerResolver;
    this.smoothScroll = smoothScroll;
    this.transitionsManager = transitionsManager;
    this.footnotes = footnotes;
    this.navigation = navigation;
    this.isNavigating = false; // Guard to prevent concurrent navigations
  }

  async start() {
    this.setupLinkListeners();
    this.setupEventListeners();
    await this.routerResolver.create();
    await this.pageLoader.create();
    this.routerHistory.create();
  }

  /**
   * Find the internal link anchor element from a click event
   * @param {MouseEvent} event - The click event
   * @returns {HTMLAnchorElement|null} The anchor element or null
   * @private
   */
  findInternalLinkAnchor(event) {
    return event.target.closest(SELECTORS.INTERNAL_LINK);
  }

  /**
   * Determine if a link click should be handled by the router
   * @param {HTMLAnchorElement|null} anchor - The anchor element
   * @param {MouseEvent} event - The click event
   * @returns {boolean} True if the click should be handled
   * @private
   */
  shouldHandleLinkClick(anchor, event) {
    // Not an internal link
    if (!anchor) {
      return false;
    }
    
    // Opens in new tab/window
    if (anchor.getAttribute(ATTRIBUTES.TARGET) === VALUES.TARGET_BLANK) {
      return false;
    }
    
    // Modifier keys pressed (Cmd/Ctrl for new tab)
    if (event.metaKey || event.ctrlKey) {
      return false;
    }
    
    // Middle mouse button (opens in new tab)
    if (event.button === 1) {
      return false;
    }
    
    return true;
  }

  /**
   * Extract and validate the href from an anchor element
   * @param {HTMLAnchorElement} anchor - The anchor element
   * @returns {string|null} href - The href value or null if invalid
   * @private
   */
  getValidatedHref(anchor) {
    const href = anchor.getAttribute(ATTRIBUTES.HREF);
    
    if (!href) {
      console.warn("Internal link has no href attribute:", anchor);
      return null;
    }
    
    return href;
  }

  /**
   * Handle navigation menu state after a link click
   * Closes the menu if it's currently open
   * @private
   */
  handleNavigationMenuAfterClick() {
    if (this.navigation.getNavigationStatus() === "active") {
      setTimeout(() => {
        this.navigation.hideNavigation();
      }, VALUES.ROUTER_TIMEOUT);
    }
  }

  /**
   * Handle click events on internal navigation links
   * @param {MouseEvent} event - The click event
   * @private
   */
  handleLinkClick(event) {
    const anchor = this.findInternalLinkAnchor(event);
    
    if (!this.shouldHandleLinkClick(anchor, event)) {
      return;
    }
    
    // CRITICAL: Prevent default IMMEDIATELY to stop browser navigation
    // Must be called synchronously, before any async operations
    event.preventDefault();
    event.stopImmediatePropagation(); // Stop ALL other handlers from running
    
    // Guard against concurrent navigations
    if (this.isNavigating) {
      return;
    }
    
    const href = this.getValidatedHref(anchor);
    if (!href) {
      return;
    }
    
    this.updatePage(href);
    this.handleNavigationMenuAfterClick();
  }

  /**
   * Event delegation for navigation links
   * Sets up a single click listener on document that handles all internal link clicks
   */
  setupLinkListeners() {
    // Use capture phase to run BEFORE other handlers (including Navigation component)
    document.addEventListener(
      EVENTS.CLICK,
      (event) => this.handleLinkClick(event),
      { capture: true } // CRITICAL: Use capture phase to run before Navigation handlers
    );
  }

  /**
   * Use the Orchestrator pattern to handle the page navigation lifecycle
   * TODO: Use try catch to catch each async step for the page navigation lifecycle
   * @param {*} href
   */
  async updatePage(href) {
    // Guard against concurrent navigations
    if (this.isNavigating) {
      return;
    }

    this.isNavigating = true;
    try {
      const routeInfo = await this.beforePageUpdate(href);

      if (!routeInfo || !routeInfo.isValid) {
        return;
      }

      const nextPageInstance = await this.startPageUpdate(routeInfo);

      if (!nextPageInstance) {
        return;
      }

      await this.afterPageUpdate(nextPageInstance, routeInfo);
    } catch (error) {
      if (isErrorCode(error, ERROR_CODES.PAGE_NOT_FOUND)) {
        console.error('Page loading failed:', error.message);
      } else if (isErrorCode(error, ERROR_CODES.NETWORK_ERROR)) {
        console.error('Network error:', error.message);
      } else {
        console.error(`Error updating page:`, error);
      }
      this.routerResolver.redirectToHome();
    } finally {
      this.isNavigating = false;
    }
  }

  /**
   * Validate the route and start the page navigation
   * @param {string} href - The route to validate
   * @returns {RouteValidationResult}
   */
  async beforePageUpdate(href) {
    const routeInfo = this.routerResolver.validateRoute(
      href,
      window.location.pathname
    );

    if (!routeInfo.isValid) {
      return this.routerResolver.handleInvalidRoute(routeInfo);
    }

    return routeInfo;
  }

  /**
   * Start the page navigation
   * @param {RouteValidationResult} routeInfo - The route information
   * @returns {Promise<void>}
   */
  async startPageUpdate(routeInfo, addToHistory = true) {
    const currentPage = this.pageRegistry.getCurrentPage();
    if (currentPage) {
      await currentPage.hide(routeInfo.route);
    }

    await this.pageManager.updatePage(routeInfo.route);

    // add to afterPageNavigation?
    if (addToHistory) {
      this.routerHistory.updateHistory(routeInfo.route); // Update the browser history
    }

    await nextPaint();
    const nextPageInstance = await this.pageLoader.getPage(routeInfo.route);

    if (!nextPageInstance) {
      throw createError(ERROR_CODES.PAGE_NOT_FOUND, { page: routeInfo.route });
    }

    return nextPageInstance;
  }

  /**
   * After the page navigation
   * @param {Page} nextPageInstance - The next page instance
   * @param {RouteValidationResult} routeInfo - The route information
   * @returns {Promise<void>}
   */
  async afterPageUpdate(nextPageInstance, routeInfo) {
    await nextPageInstance.create();
    await nextPageInstance.show();
    await nextPaint();
  }

  async handleHistoryNavigation({ route, pathname, state }) {
    try {
      // For history navigation (back/forward), trust the route from history state
      // Normalize route - empty string means home
      const normalizedRoute = route === "" ? "home" : route;

      // Create a valid RouteValidationResult directly from the route
      const routeInfo = RouteValidationResult.valid(normalizedRoute);

      // Get the next page instance
      const nextPageInstance = await this.startPageUpdate(routeInfo, false);

      if (!nextPageInstance) {
        return;
      }

      // ✅ CRITICAL: Show the next page (this was missing!)
      await this.afterPageUpdate(nextPageInstance, routeInfo);
    } catch (error) {
      if (isErrorCode(error, ERROR_CODES.PAGE_NOT_FOUND)) {
        console.error('Page loading failed during history navigation:', error.message);
      } else if (isErrorCode(error, ERROR_CODES.NETWORK_ERROR)) {
        console.error('Network error during history navigation:', error.message);
      } else {
        console.error(`Error handling history navigation:`, error);
      }
      this.routerResolver.redirectToHome();
    }
  }

  /**
   * Setup global event listeners
   * @returns {void}
   */
  setupEventListeners() {
    window.addEventListener(EVENTS.HISTORY_NAVIGATION, (event) => {
      this.handleHistoryNavigation(event.detail);
    });
  }
}
