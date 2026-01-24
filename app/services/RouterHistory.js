import { EVENTS } from "../utilities/Constants.js";

/**
 * RouterHistory - Centralized history management
 * 
 * Responsibilities:
 * - Single source of truth for all history operations
 * - Prevents duplicate history entries
 * - Ensures URL and state stay in sync
 * - Handles route normalization
 * - Manages popstate events for back/forward navigation
 */
export class RouterHistory {
  constructor({ siteConfig, routerResolver }) {
    this.siteConfig = siteConfig;
    this.routerResolver = routerResolver; // Can be undefined initially, set via setRouterResolver()
    this.pageHistory = window.history;
    this.isInitialized = false;
    this.isNavigating = false; // Prevent recursive updates
    this.currentUrl = window.location.pathname; // Track current URL
  }

  /**
   * Set the router resolver (injected after construction to resolve circular dependency)
   * @param {RouterResolver} routerResolver - The router resolver instance
   */
  setRouterResolver(routerResolver) {
    this.routerResolver = routerResolver;
  }

  /**
   * Initialize history manager
   * Sets up initial state and popstate listener
   */
  create() {
    if (this.isInitialized) {
      return;
    }

    // Register popstate listener FIRST (before any state changes)
    this.setupPopStateListener();
    
    // Set initial state
    this.setupInitialState();
    
    this.isInitialized = true;
  }

  /**
   * Setup popstate listener for back/forward navigation
   * - Purpose: Fired when user navigates via back/forward buttons
   * - When to use: To handle browser navigation (back/forward buttons, keyboard shortcuts)
   * - Note: Only fires for `pushState`/`replaceState` entries, not initial page load
   */
  setupPopStateListener() {
    window.addEventListener(EVENTS.POPSTATE, (event) => {
      this.handlePopState(event);
    });
  }

  /**
   * Setup initial history state on page load
   * 
   * @description
   * Initializes the browser history state when the app first loads.
   * This prevents the initial page load from being added to the navigation history,
   * ensuring proper back/forward button behavior.
   */
  setupInitialState() {
    // Only set initial state if it doesn't exist
    if (this.pageHistory.state !== null) {
      return; // State already exists, don't overwrite
    }

    const pathname = window.location.pathname;
    const route = this.normalizeRoute(pathname);
    this.currentUrl = pathname; // Track initial URL


    // Validate route exists
    if (!this.routerResolver.hasRoute(route) && route !== "") {
      // Invalid route, redirect to home
      this.replaceState("", "/");
      this.currentUrl = "/";
      return;
    }

    // Set initial state (replaceState doesn't add to history)
    this.replaceState(route, pathname);
  }

  /**
   * Handle browser back/forward navigation
   */
  handlePopState(event) {
    // Don't block popstate events - they're user-initiated browser navigation
    // The isNavigating flag is only for preventing recursive programmatic updates
    
    const state = event.state;
    let route = null;

    if (state && state.route !== undefined) {
      route = state.route;
    } else {
      // Fallback: extract route from pathname
      const pathname = window.location.pathname;
      route = this.normalizeRoute(pathname);
    }

    // Update tracked URL
    this.currentUrl = window.location.pathname;


    // Dispatch event for router to handle
    window.dispatchEvent(
      new CustomEvent(EVENTS.HISTORY_NAVIGATION, {
        detail: {
          route: route,
          pathname: window.location.pathname,
          state: state,
        },
      })
    );
  }

  /**
   * Updates the browser history state with the new page
   *
   * @param {string} nextPage - The route identifier (e.g., "home", "about", "gallery")
   * @param {boolean} addToHistory - Whether to add this navigation to browser history
   * @returns {Promise} Resolves when history is updated
   *
   * @description
   * This method handles the special case of the home route:
   * - When navigating to "home", the history state stores route: "" (empty string)
   * - When navigating to "home", the browser URL shows "/" (base URL)
   * - This allows the home page to resolve to the base path while maintaining
   *   proper browser history and back/forward navigation
   */
  async updateHistory(nextPage, addToHistory = true) {
    return new Promise((resolve) => {
      if (this.isNavigating) {
        resolve();
        return;
      }

      if (!addToHistory) {
        resolve();
        return;
      }

      this.isNavigating = true;

      try {
        const normalizedRoute = this.normalizeRoute(nextPage);
        const url = this.routeToUrl(normalizedRoute);


        // Check if we're navigating to the same URL we're already on
        // Use this.currentUrl instead of window.location.pathname to avoid timing issues
        if (url === this.currentUrl) {
          // Same URL, just update state without changing history
          this.replaceState(normalizedRoute, url);
          resolve();
          return;
        }

        // Push new state to history
        this.pushState(normalizedRoute, url);
        this.currentUrl = url; // Update tracked URL
      } finally {
        this.isNavigating = false;
      }

      resolve();
    });
  }

  /**
   * Push new state to history (for forward navigation)
   * - Purpose: Adds a new entry to the history stack
   * - When to use: When navigating to a new page via user action (clicking a link)
   * - Note: Does not trigger a page reload or popstate event
   * @private
   */
  pushState(route, url) {
    this.pageHistory.pushState(
      { route: route },
      "", // Title is ignored by modern browsers
      url
    );
  }

  /**
   * Replace current state (for initial load, redirects, silent updates)
   * - Purpose: Replaces the current history entry without adding a new one
   * - When to use: 
   *   - Initial page load (to set initial state without creating a history entry)
   *   - Redirects (to replace invalid routes)
   *   - Silent URL updates (when you don't want back button to go to previous URL)
   * - Note: Does not trigger popstate event
   * @private
   */
  replaceState(route, url) {
    this.pageHistory.replaceState(
      { route: route },
      "",
      url
    );
  }

  /**
   * Normalize route (home -> "", remove leading slashes)
   * @private
   */
  normalizeRoute(route) {
    if (!route || route === "/" || route === "home") {
      return "";
    }
    return route.replace(/^\/+/, ""); // Remove leading slashes
  }

  /**
   * Convert route to URL pathname
   * @private
   */
  routeToUrl(route) {
    if (route === "") {
      return "/";
    }
    return route.startsWith("/") ? route : `/${route}`;
  }

  /**
   * Get current route from history state or URL
   * @returns {string} The current route
   */
  getCurrentRoute() {
    const state = this.pageHistory.state;
    if (state && state.route !== undefined) {
      return state.route;
    }
    return this.normalizeRoute(window.location.pathname);
  }

  /**
   * Check if current state matches route
   * @param {string} route - The route to check
   * @returns {boolean} True if route matches current state
   */
  isCurrentRoute(route) {
    const currentRoute = this.getCurrentRoute();
    const normalizedRoute = this.normalizeRoute(route);
    return currentRoute === normalizedRoute;
  }
}