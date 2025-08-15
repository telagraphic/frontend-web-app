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

export class Router {
  constructor() {
    this.pageHistory = window.history;
    this.mainElement = document.querySelector(".main-content");
    this.links = document.querySelectorAll("a");
    this.transitionOverlay = document.querySelector(".transition-overlay");
    this.nextPage = null;
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
      const initialPage = window.location.pathname;
      this.pageHistory.replaceState({ route: initialPage }, "", initialPage);
    }

    window.addEventListener("popstate", (event) => {
      this.navigateToPage(event.state.route, false);
    });
  }

  /**
   * Intercept links for removing current page and replacing with new page
   * - call on new page load to ensure content links are updated
   */
  setupLinks() {
    this.links.forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        this.nextPage = event.target.getAttribute("href");
        this.navigateToPage(this.nextPage);
      });
    });

    /**
     * Check the initial page if user is first visiting another page,
     * TODO: move to init function?
     */
    // this.navigateToPage(window.location.pathname);
  }

  /**
   * Update history state and update DOM
   *
   * @param {*} newPage
   * @param {*} addToHistory
   */
  // loadPage(nextPage, addToHistory = true) {
  //   if (addToHistory) {
  //     // TODO: don't call updateNewPage on first page load
  //     console.log("loadPage called");

  //     if (`/pages/${nextPage}` !== window.location.pathname) {
  //       this.updatePage(nextPage);
  //       this.pageHistory.pushState({ route: nextPage }, "", nextPage);
  //     }
  //   }
  // }

  /**
   * Returns a promise for showing/hiding page animation
   */
  async navigateToPage(showAnimation = true) {
    const showOverlay = (element) => element.classList.add("is-visible");
    const hideOverlay = (element) => element.classList.remove("is-visible");
    const hidePage = (element) => element.classList.add("is-hidden");
    const showPage = (element) => element.classList.remove("is-hidden");

    // await this.runTransition(this.mainElement, hidePage);
    await this.runTransition(this.transitionOverlay, showOverlay);
    await this.updatePage(this.nextPage);
    await this.updateHistory(this.nextPage);
    await this.runTransition(this.transitionOverlay, hideOverlay);
    // await this.runTransition(this.mainElement, showPage);
  }

  /**
   * Updates the history state with the new page
   * @param {*} nextPage
   * @param {*} addToHistory
   * @returns
   */
  async updateHistory(nextPage, addToHistory = true) {
    return new Promise((resolve, reject) => {
      if (addToHistory) {
        // TODO: don't call updateNewPage on first page load

        if (`/pages/${nextPage}` !== window.location.pathname) {
          this.pageHistory.pushState({ route: nextPage }, "", nextPage);
        }
      }
      resolve();
    });
  }

  /**
   * Replace current DOM with new page DOM
   * - scroll to top of page
   */
  async updatePage(newPage) {
    try {
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
        scrollTo({ top: 0, left: 0, behavior: "instant" });
      } else {
        // TODO: this resets the history state, perhaps go to a index.html state instead!
        window.location.replace("index.html");
        scrollTo({ top: 0, left: 0, behavior: "instant" });
      }
    } catch (error) {
      console.error("Error updating page:", error);
    }
  }

  /**
   * Run the transition callback, remove the listen when done, then resolve
   * @param {*} element to target for animation
   * @param {*} callback function to run on element for transition
   * @returns
   */
  async runTransition(element, transitionCallback) {
    return new Promise((resolve) => {
      element.addEventListener("transitionstart", () => {});

      element.addEventListener("transitionend", () => {
        resolve();
      });

      requestAnimationFrame(() => {
        transitionCallback(element);
      });
    });
  }

  async showPage() {
    return new Promise((resolve) => {});
  }

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
