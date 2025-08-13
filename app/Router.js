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

// TODO: Make this a singleton? NO
// How to export the router as all ready initialized? NO
export class Router {
  constructor() {
    this.pageHistory = window.history;
    this.mainElement = document.querySelector("main");
  }

  init() {
    this.setupPopState();
    this.setupLinks();
  }

  /**
   * Setup initial state and prevent back/forward button to add to history
   */
  setupPopState() {
    if (this.pageHistory.state == null) {
      const pagePath = window.location.pathname;
      this.pageHistory.replaceState({ route: pagePath }, "", pagePath);
    }

    window.addEventListener("popstate", (event) => {
      console.log(event.state.route);
      this.loadPage(event.state.route, false);
    });
  }

  /**
   * Intercept links for removing current page and replacing with new page
   * - call on new page load to ensure content links are updated
   */
  setupLinks() {
    let links = document.querySelectorAll("a");
    console.log(links);

    links.forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        const newPage = event.target.getAttribute("href");
        this.loadPage(newPage);
      });
    });

    /**
     * Check the initial page if user is first visiting another page,
     * TODO: move to init function?
     */
    this.loadPage(window.location.pathname);
  }

  pageNavigation() {
    // Start transition
    // Fetch new page
    // Finish transition
    // Update History
  }

  /**
   * Update history state and update DOM
   *
   * @param {*} newPage
   * @param {*} addToHistory
   */
  loadPage(newPage, addToHistory = true) {
    if (addToHistory) {
      // TODO: don't call updateNewPage on first page load

      if (`/pages/${newPage}` !== window.location.pathname) {
        this.updateNewPage(newPage);
        this.pageHistory.pushState({ route: newPage }, "", newPage);
      }
    }
  }

  /**
   * Replace current DOM with new page DOM
   * - scroll to top of page
   */
  async updateNewPage(newPage) {
    const response = await fetch(newPage);

    if (response.ok) {
      const newPageHTML = await response.text();
      const newPageDOM = new DOMParser().parseFromString(
        newPageHTML,
        "text/html",
      );
      const newPageContent = newPageDOM.querySelector("main");
      const newPageFragment = new DocumentFragment().appendChild(
        newPageContent,
      );
      this.mainElement.replaceChildren(newPageFragment);
    } else {
      window.location.replace("index.html");
    }
  }

  /**
   * Returns a promise for showing/hiding page animation
   */
  async displayTransition() {}

  /**
   * Display a 404 page when no route is found
   *
   */
  displayErrorPage() {
    // TODO: Use a server rewrite to handle a 404
  }

  /**
   * If link is the current page, do nothing or navigate to a #header
   */
  checkIfSamePage() {}

  /**
   * Handle page refresh after push state history is refreshed?
   *
   */
  onPageRefresh() {}
}
