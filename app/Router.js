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
  constructor(mainElement) {
    this.template = null;
    this.newPage = null;
    this.mainElement =
      mainElement || document.querySelector("main.main-content");
    this.pageHistory = window.history;
  }

  init() {
    this.setupPopState();
  }

  async updatePage(href) {
    await this.requestPage(href);
    await this.updateMarkup(this.newPage);
    await this.updateHistory(href);
    return this.template;
  }

  /**
   * Fetch next page
   * @param {string} newPage - The URL of the next page to fetch
   */
  async requestPage(newPage) {
    if (newPage.includes("http")) {
      window.location.href = newPage;
      return;
    }

    try {
      const response = await fetch(newPage);
      if (response.ok) {
        this.newPage = response;
      } else {
        // TODO: this resets the history state, perhaps go to a index.html state instead!
        window.location.replace("index.html");
      }
    } catch (error) {
      console.error("Error updating page:", error);
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
      "text/html",
    );

    const pageContent = newPageDOM.querySelector("main");
    const newPageContent = newPageDOM.querySelector("section.page-content");
    const newPageFragment = document.createDocumentFragment();
    newPageFragment.appendChild(newPageContent);

    this.template = pageContent.getAttribute("data-template");
    this.mainElement.replaceChildren(newPageFragment);
    this.mainElement.setAttribute(
      "data-template",
      `${this.template.toString()}`,
    );
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
      this.updatePage(event.state.route, false);
    });
  }

  /**
   * Updates the history state with the new page
   * @param {string} nextPage the href
   * @param {boolean} addToHistory boolean to write to history
   * @returns
   */
  async updateHistory(nextPage, addToHistory = true) {
    return new Promise((resolve, reject) => {
      if (addToHistory) {
        if (`/pages/${nextPage}` !== window.location.pathname) {
          this.pageHistory.pushState({ route: nextPage }, "", nextPage);
        }
      }
      resolve();
    });
  }
  /**
   * Display a 404 page when no route is found
   *
   */
  displayErrorPage() {
    // TODO: Use a server rewrite to handle a 404
  }

  /**
   * Handle page refresh after push state history is refreshed?
   *
   */
  onPageRefresh() {}
}
