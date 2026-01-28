import { RouteValidationResult } from "./RouterValidation.js";


/**
 * RouterResolver is responsible for validating and resolving routes
 * @param {Object} siteConfig - The site configuration
 * @param {RouterHistory} routerHistory - The router history
 * @returns {RouteValidationResult} The route validation result
 */
export class RouterResolver {
  constructor({ siteConfig, routerHistory }) {
    this.siteConfig = siteConfig;
    this.routerHistory = routerHistory; // Can be undefined initially, set via setRouterHistory()
  }

  /**
   * Set the router history (injected after construction to resolve circular dependency)
   * @param {RouterHistory} routerHistory - The router history instance
   */
  setRouterHistory(routerHistory) {
    this.routerHistory = routerHistory;
  }

  /**
   * Create the router resolver
   */
  create() {
    if (this.validRoutes) return;
    this.validRoutes = new Map();

    for (const [key, value] of Object.entries(this.siteConfig.settings)) {
      this.validRoutes.set(key, value.link);
    }
  }

  /**
   * Validates and normalizes a route for navigation
   * @param {string} href - The route to validate
   * @param {string} currentPath - The current browser path
   * @returns {Object} Validation result
   */
  validateRoute(href, currentPath) {
    // If home page, set current path to home
    if (href === "/" || href === "")
      return RouteValidationResult.valid("home", "home");
    // If same page, do nothing
    if (currentPath.includes(href)) return RouteValidationResult.skip();
    // If external link, redirect to new page
    if (href.includes("http")) return RouteValidationResult.externalLink(href);
    // If route exists in our valid routes map, return it
    if (this.validRoutes.has(href))
      return RouteValidationResult.valid(href, href);
    // Else, return a valid route
    return RouteValidationResult.valid(href, href.replace("/", ""));
  }

  handleInvalidRoute(routeInfo) {
    if (routeInfo.action === "same-page") {
      window.location.href = routeInfo.url; // TODO: Call smooth scroll to go back to top of page
    }
    if (routeInfo.action === "skip") return routeInfo;
    if (routeInfo.action === "external-link") {
      window.location.href = routeInfo.url;
    }
    if (routeInfo.action === "redirect-home") {
      this.redirectToHome();
    }
    return routeInfo;
  }

  /**
   * Redirects to the home page
   */
  redirectToHome() {
    window.history.replaceState({ route: "" }, "", "/");
    return;
  }

  /**
   * Gets the route from the valid routes map
   * @param {string} href - The route to get
   * @returns {string} The route
   */
  getRoute(href) {
    if (this.validRoutes.has(href)) {
      return this.validRoutes.get(href);
    }
    return null;
  }

  /**
   * Checks if the route exists in the valid routes map
   * @param {string} href - The route to check
   * @returns {boolean} True if the route exists, false otherwise
   */
  hasRoute(href) {
    return this.validRoutes.has(href);
  }
}
