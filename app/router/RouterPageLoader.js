import { createError, ERROR_CODES } from "../utilities/ErrorRegistry.js";

export class RouterPageLoader {
  constructor({ routes, pages, smoothScroll, animationsService }) {
    this.routes = routes;
    this.pages = pages;
    this.smoothScroll = smoothScroll;
    this.animationsService = animationsService;
    this.loaded = new Map();
  }

  initializePage(pageClass) {
    return new pageClass({
      smoothScroll: this.smoothScroll,
      animationsService: this.animationsService,
    });
  }

  async getPage(pageTemplate) {
    const pageClass = await this.loadPage(pageTemplate);
    return this.initializePage(pageClass);
  }

  async loadPage(page) {
    if (this.loaded.has(page)) {
      return this.loaded.get(page);
    }

    const pageName = this.routes[page]?.page;
    const load = pageName ? this.pages[pageName] : undefined;
    if (!load) {
      throw createError(ERROR_CODES.CLASS_NOT_FOUND, {
        className: pageName ?? `template: ${page}`,
      });
    }

    try {
      const pageModule = await load();
      const pageClass = pageModule.default;

      if (!pageClass) {
        throw createError(ERROR_CODES.CLASS_NOT_FOUND, {
          className: pageName,
          availableExports: Object.keys(pageModule),
        });
      }

      this.loaded.set(page, pageClass);
      return pageClass;
    } catch (error) {
      if (error.code) {
        throw error;
      }
      throw createError(ERROR_CODES.NETWORK_ERROR, {
        message: `Error loading page ${page}: ${error.message}`,
      });
    }
  }
}
