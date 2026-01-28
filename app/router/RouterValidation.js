export class RouteValidationResult {
  constructor(isValid, action = null, route = null, url = null) {
    this.isValid = isValid || null;
    this.action = action;
    this.route = route;
    this.url = url;
  }

  /**
   * Valid route for an .internal-link anchor tag
   * @param {string} route - The route
   * @returns {RouteValidationResult} The route validation result
   */
  static valid(route) {
    return new RouteValidationResult(true, null, route);
  }

  /**
   * Same page, typically when the link is the same to page as the current page
   * @param {string} route - The route
   * @returns {RouteValidationResult} The route validation result
   */
  static samePage(route) {
    return new RouteValidationResult(false, "same-page", route);
  }

  /**
   * Skip the navigation, typically when the link is the same to page as the current page
   * @returns {RouteValidationResult} The route validation result
   */
  static skip() {
    return new RouteValidationResult(false, "skip");
  }

  /**
   * Redirect to an external link, typically when the link is an external link
   * @param {string} url - The URL to redirect to
   * @returns {RouteValidationResult} The route validation result
   */
  static externalLink(url) {
    return new RouteValidationResult(false, "external-link", null, url);
  }

  /**
   * Redirect to the home page, typically when the link is the home page
   * @returns {RouteValidationResult} The route validation result
   */
  static redirectHome() {
    return new RouteValidationResult(false, "redirect-home", null, null);
  }
}
