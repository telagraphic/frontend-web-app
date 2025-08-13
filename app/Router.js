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

// TODO: Make this a singleton?
// How to export the router as all ready initialized?
export class Router {
  constructor() {}

  init() {
    console.log("Router up");
    this.setupLinks();
  }

  setupLinks() {
    let links = document.querySelectorAll("a");
    console.log(links);
  }
}
