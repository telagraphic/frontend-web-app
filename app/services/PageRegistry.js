
/**
 * PageRegistry is responsible for registering the page classes and managing the class instances
 */
export class PageRegistry {
  constructor({ siteConfig, pageLoader}) {
    this.siteConfig = siteConfig;
    this.pageLoader = pageLoader; // Can be undefined initially, set via setPageLoader()
    this.pages = new Map();
    this.currentPage = null;
    this.currentPageTemplate = null;
  }

  /**
   * Set the page loader (injected after construction to resolve circular dependency)
   * @param {PageLoader} pageLoader - The page loader instance
   */
  setPageLoader(pageLoader) {
    this.pageLoader = pageLoader;
  }

  async create() {
    await this.pageLoader.create();
  }

  getCurrentPage() {
    return this.currentPage;
  }

  setCurrentPage(page) {
    this.currentPage = page;
  }

  getPage(page) {
    return this.pages?.get(page);
  }

  setPage(page, pageClass) {
    this.pages?.set(page, pageClass);
  }

  hasPage(page) {
    return this.pages?.has(page);
  }

  setCurrentPageTemplate(template) {
    this.currentPageTemplate = template;
  }

  getCurrentPageTemplate() {
    return this.currentPageTemplate;
  }
}
