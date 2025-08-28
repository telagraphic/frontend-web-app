/**
 * SPA Router
 *
 * History API
 * Handle back button state
 * Intercept Links
 * Show/Hide pages
 * Transition Logic
 * Handle 404
 *
 */

import { BackgroundColors } from "./Colors.js";
import { $, $$, setupHelpers } from "../utils/Helpers.js";

export class Router {
  constructor(mainElement) {
    this.template = null;
    this.pathname = null;
    this.newPage = null;
    this.mainElement = mainElement || document.querySelector("main");
    this.pageHistory = window.history;
    this.initialPage = null;
    setupHelpers();
    this.setupRoutes();
  }

  create() {
    this.setupPopState();
    this.setupEventListeners();

    // Sync URL when a hard refresh occurs with content after a short delay to ensure DOM is ready
    setTimeout(() => {
      this.syncUrlWithContent();
    }, 100);
  }

  /**
   * Setup the routes for the application
   */
  setupRoutes() {
    this.validRoutes = new Map();
    this.validRoutes.set("home", "index.html");
    this.validRoutes.set("about", "pages/about.html");
    this.validRoutes.set("gallery", "pages/gallery.html");
    this.validRoutes.set("earth", "pages/earth.html");
    this.validRoutes.set("mercury", "pages/mercury.html");
    this.validRoutes.set("venus", "pages/venus.html");
    this.validRoutes.set("mars", "pages/mars.html");
    this.validRoutes.set("jupiter", "pages/jupiter.html");
    this.validRoutes.set("saturn", "pages/saturn.html");
    this.validRoutes.set("uranus", "pages/uranus.html");
    this.validRoutes.set("neptune", "pages/neptune.html");
    this.validRoutes.set("pluto", "pages/pluto.html");
    this.validRoutes.set("moons", "pages/moons.html");
  }

  /**
   * Builds the file path for a given route
   * @param {string} href - The route identifier
   * @returns {string} The file path to fetch
   */
  buildRoute(href) {
    // Check if route exists in our valid routes map
    if (this.validRoutes.has(href)) {
      return this.validRoutes.get(href);
    }

    // Fallback for legacy "/" handling
    if (href === "/") {
      return this.validRoutes.get("home");
    }

    // If route doesn't exist, return null to indicate invalid route
    return null;
  }

  /**
   * Validates and normalizes a route for navigation
   * @param {string} href - The route to validate
   * @param {string} currentPath - The current browser path
   * @returns {Object} Validation result
   */
  validateRoute(href, currentPath) {
    // If home page, set current path to home
    if (href === "/" || href === "") {
      return { isValid: true, route: "home", normalizedPath: "home" };
    }
    // If same page, do nothing
    if (currentPath.includes(href)) return { isValid: false, action: "skip" };

    // If external link, redirect to new page
    if (href.includes("http"))
      return { isValid: false, action: "redirect", url: href };

    // Else, return a valid route
    return {
      isValid: true,
      route: href,
      normalizedPath: href.replace("/", ""),
    };
  }

  /**
   * SPA page navigation flow triggered by a link click
   * @param {string} href - The route to navigate to (e.g., "home", "about", "gallery")
   * @param {boolean} hardRefresh - Whether the page was hard refreshed
   */
  async updatePage(href, hardRefresh = false) {
    await this.requestPage(href);
    await this.updateMarkup(this.newPage);
    await this.updateHistory(href);

    // need to remove "home" from the main element when hard refresh occurs
    if (hardRefresh) {
      this.mainElement.classList.remove("home");
    }
  }

  /**
   * Fetch next page
   * @param {string} href - The URL of the next page to fetch
   */
  async requestPage(href) {
    const routePath = this.buildRoute(href);

    // Check if route is valid
    if (routePath === null) {
      this.redirectToHome();
      return;
    }

    try {
      const response = await fetch(routePath);
      if (response.ok) {
        this.newPage = response;
      } else {
        throw new Error("Failed to fetch page: ${routePath}");
        this.redirectToHome();
      }
    } catch (error) {
      throw new Error("Network error: ${error.message}");
      this.redirectToHome();
    }
  }

  /**
   * Replace DOM with new page content
   * @param {*} response
   */
  async updateMarkup(response) {
    const newPageHTML = await response.text();
    const newPageDOM = new DOMParser().parseFromString(
      newPageHTML,
      "text/html"
    );

    const pageContent = newPageDOM.querySelector("main");
    this.template = pageContent.getAttribute("data-template");
    this.backgroundColor = pageContent.getAttribute("data-background") || null;
    this.color = pageContent.getAttribute("data-color") || null;

    const newPageContent = pageContent.querySelector("section.page-content");
    const newPageFragment = document.createDocumentFragment();
    newPageFragment.appendChild(newPageContent);

    // could update the main element in one go instead of multiple steps
    this.mainElement.replaceChildren(newPageFragment);
    this.mainElement.setAttribute(
      "data-template",
      `${this.template.toString()}`
    );

    // Update main element classes, will be undefined on an invalid route
    this.mainElement.removeAttribute("class");
    this.mainElement.classList.add(`${this.template.toString()}`);

    // Preload images after DOM is updated
    await this.preloadImages();
    // Waits for the images to be loaded and complete layout calculation
    await this.waitForDOMReady();
    // Dispatch a resize event to trigger the smooth scroll to update the new page height
    window.dispatchEvent(new Event("resize"));
    // Set the background and color of the page
    BackgroundColors.change(this.backgroundColor, this.color);
  }

  /**
   * Preload images for the page, need to fix when first page is /about or /gallery
   * @returns {Promise} Resolves when images are loaded
   */
  async preloadImages() {
    const imageElements = Array.from(
      document.querySelectorAll("img[data-src]")
    );
    console.log("preloadImages", imageElements);
    if (imageElements.length === 0) return;

    const imagePromises = imageElements.map((element) => {
      return new Promise((resolve) => {
        if (!element.src) {
          const dataSrc = element.getAttribute("data-src");
          element.src = dataSrc;
          element.onload = () => resolve();
          element.onerror = () => resolve();
        } else {
          resolve();
        }
      });
    });

    await Promise.all(imagePromises);
  }

  /**
   * Returns a promise that syncs with the RAF loop to ensure DOM is ready
   * @returns {Promise} Resolves when the DOM is ready
   */
  waitForDOMReady() {
    return new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          resolve();
        });
      });
    });
  }

  /**
   * Setup initial state and prevent back/forward button to add to history
   *
   * @description
   * Initializes the browser history state when the app first loads.
   * This prevents the initial page load from being added to the navigation history,
   * ensuring proper back/forward button behavior.
   */
  setupPopState() {
    // If the page history state is null, create initial state
    if (this.pageHistory.state == null) {
      const initialPage = window.location.pathname;

      // If home page, set home state
      if (initialPage === "/" || initialPage === "") {
        this.pageHistory.replaceState({ route: "" }, "", "/");
        return;
      }

      // Check if this is a valid route
      const route = initialPage.replace("/", ""); // Remove leading slash

      if (this.validRoutes.has(route)) {
        this.pageHistory.replaceState({ route: route }, "", initialPage);
        // Don't call updatePage here - let syncUrlWithContent on new page load
      } else {
        this.redirectToHome();
      }
    }
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
   *
   * @example
   * // Clicking href="home" results in:
   * // - History state: { route: "" }
   * // - Browser URL: "/"
   * // - File loaded: "index.html"
   *
   * // Clicking href="about" results in:
   * // - History state: { route: "about" }
   * // - Browser URL: "about"
   * // - File loaded: "/pages/about.html"
   */
  async updateHistory(nextPage, addToHistory = true) {
    return new Promise((resolve, reject) => {
      if (!addToHistory) {
        return;
      }

      // For home route, set route to empty string to resolve to base path
      const routeForHistory =
        nextPage === "/" || nextPage === "home" ? "" : nextPage;

      // For home route, redirect to base URL instead of "home"
      const urlForHistory =
        nextPage === "/" || nextPage === "home" ? "/" : nextPage;

      if (nextPage !== this.pathname) {
        this.pageHistory.pushState(
          { route: routeForHistory },
          "",
          urlForHistory
        );
      }
      resolve();
    });
  }

  /**
   * Syncs the browser URL with the current page content
   * This handles cases where the URL doesn't match the displayed content due to client side routing
   * defaulting to serving the home page
   * Will cause a slight flicker of the home page when template and path are not the same
   */
  syncUrlWithContent() {
    const currentPath = window.location.pathname;
    const currentTemplate = this.mainElement.getAttribute("data-template");

    // If we're on a path like /gallery but showing home content, sync them
    if (
      currentPath !== "/" &&
      currentPath !== "" &&
      currentTemplate === "home"
    ) {
      const route = currentPath.replace("/", ""); // Remove leading slash

      if (this.validRoutes.has(route)) {
        this.updatePage(route, "", true);
        // Pass the route information with the hard-refresh event
        window.dispatchEvent(
          new CustomEvent("hard-refresh", {
            detail: { route: route },
          })
        );
      } else {
        this.redirectToHome();
      }
    }
  }

  /**
   * Redirect back to home page when no route is found
   *
   * @description
   * Handles cases where a user types a URL that doesn't correspond to any valid page.
   * Redirects to home page and updates the browser URL to reflect the home route.
   */
  redirectToHome() {
    // Update the browser URL to show home
    window.history.replaceState({ route: "" }, "", "/");
    this.updatePage("home");
  }

  setupEventListeners() {
    // Handle back/forward button navigation
    window.addEventListener("popstate", (event) => {
      if (event.state && event.state.route !== undefined) {
        this.updatePage(event.state.route);
      }
    });
  }
}
