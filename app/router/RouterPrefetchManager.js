import { ATTRIBUTES, SELECTORS, VALUES } from "../utilities/Constants.js";

/**
 * RouterPrefetchManager
 *
 * Prefetches page HTML on user intent (hover/focus) and stores it in RouterPrefetchCache.
 *
 * Uses event delegation to handle dynamic links.
 */
export class RouterPrefetchManager {
  constructor({ routerResolver, routerPageManager, prefetchCache, hoverDelayMs }) {
    this.routerResolver = routerResolver;
    this.routerPageManager = routerPageManager;
    this.prefetchCache = prefetchCache;
    this.hoverDelayMs = hoverDelayMs ?? VALUES.PREFETCH_HOVER_DELAY_MS;

    /** @type {Map<HTMLAnchorElement, number>} */
    this._hoverTimers = new Map();
  }

  init() {
    this.setupListeners();
  }

  setupListeners() {
    // Use bubbling events for delegation (mouseenter doesn't bubble).
    document.addEventListener("mouseover", (event) => {
      const link = event.target?.closest?.(SELECTORS.INTERNAL_LINK);
      if (!link) return;

      // Ignore internal mouseover movements within the same link.
      const from = event.relatedTarget;
      if (from && link.contains(from)) return;

      this.schedulePrefetch(link);
    });

    document.addEventListener("mouseout", (event) => {
      const link = event.target?.closest?.(SELECTORS.INTERNAL_LINK);
      if (!link) return;

      const to = event.relatedTarget;
      if (to && link.contains(to)) return;

      this.cancelPrefetch(link);
    });

    // Keyboard intent: focus prefetches too (accessibility-friendly).
    document.addEventListener("focusin", (event) => {
      const link = event.target?.closest?.(SELECTORS.INTERNAL_LINK);
      if (!link) return;
      this.schedulePrefetch(link);
    });

    document.addEventListener("focusout", (event) => {
      const link = event.target?.closest?.(SELECTORS.INTERNAL_LINK);
      if (!link) return;
      this.cancelPrefetch(link);
    });
  }

  schedulePrefetch(link) {
    const href = link.getAttribute(ATTRIBUTES.HREF);
    if (!href) return;

    this.cancelPrefetch(link);

    const timerId = window.setTimeout(() => {
      this._hoverTimers.delete(link);
      this.prefetch(href);
    }, this.hoverDelayMs);

    this._hoverTimers.set(link, timerId);
  }

  cancelPrefetch(link) {
    const timerId = this._hoverTimers.get(link);
    if (timerId) {
      window.clearTimeout(timerId);
      this._hoverTimers.delete(link);
    }
  }

  async prefetch(href) {
    const routeInfo = this.routerResolver.validateRoute(
      href,
      window.location.pathname,
    );
    if (!routeInfo?.isValid) return;

    const route = routeInfo.route;
    if (!route) return;

    // Already cached
    if (this.prefetchCache?.has(route)) return;

    try {
      // Use PageManager's request method (no DOM update).
      const html = await this.routerPageManager.requestPage(route, {
        useCache: false,
      });
      if (!html) return;

      const metadata = this.extractMetadata(html);
      this.prefetchCache?.set(route, html, metadata);
    } catch {
      // Prefetch is best-effort: no hard failures.
    }
  }

  extractMetadata(html) {
    try {
      const doc = new DOMParser().parseFromString(html, "text/html");
      const main = doc.querySelector("main[data-template]");
      if (!main) return {};
      return {
        template: main.getAttribute("data-template") ?? null,
        backgroundColor: main.getAttribute("data-background") ?? null,
        color: main.getAttribute("data-color") ?? null,
      };
    } catch {
      return {};
    }
  }
}

