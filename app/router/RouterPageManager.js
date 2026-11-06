import { SELECTORS } from "../utilities/Constants.js";
import { createError, ERROR_CODES } from "../utilities/ErrorRegistry.js";

export class RouterPageManager {
  constructor({ prefetchCache }) {
    this.prefetchCache = prefetchCache ?? null;
    this.fetchController = null;
  }

  async load(path, { signal, useCache = true } = {}) {
    const html = await this.requestPage(path, { signal, useCache });
    if (!html) return null;
    const nextDocument = new DOMParser().parseFromString(html, "text/html");
    const main = nextDocument.querySelector(SELECTORS.MAIN);
    if (!main) {
      throw createError(ERROR_CODES.ELEMENT_NOT_FOUND, {
        element: "main[data-route]",
      });
    }
    return { document: nextDocument, main, html };
  }

  async requestPage(path, { signal, useCache = true } = {}) {
    if (!path) return null;

    if (useCache && this.prefetchCache) {
      const cached = this.prefetchCache.get(path);
      if (cached?.html) return cached.html;
    }

    if (!signal) {
      this.fetchController?.abort();
      this.fetchController = new AbortController();
      signal = this.fetchController.signal;
    }

    try {
      const res = await fetch(path, { signal });
      if (signal.aborted) return null;
      if (!res.ok) {
        throw createError(ERROR_CODES.NETWORK_ERROR, {
          message: `Failed to fetch page: ${path}`,
        });
      }
      const html = await res.text();
      if (signal.aborted) return null;
      if (useCache && this.prefetchCache && html) {
        this.prefetchCache.set(path, html);
      }
      return html;
    } catch (error) {
      if (error.name === "AbortError") return null;
      throw error;
    }
  }
}
