import { ATTRIBUTES, SELECTORS, VALUES } from "../utilities/Constants.js";

export class RouterPrefetchManager {
  constructor({
    routerResolver,
    routerPageManager,
    prefetchCache,
    hoverDelayMs,
  }) {
    this.routerResolver = routerResolver;
    this.routerPageManager = routerPageManager;
    this.prefetchCache = prefetchCache;
    this.hoverDelayMs = hoverDelayMs ?? VALUES.PREFETCH_HOVER_DELAY_MS;
    this.hoverTimers = new Map();
    this.prefetchController = null;
  }

  init() {
    this.setupListeners();
  }

  setupListeners() {
    document.addEventListener("mouseover", (event) => {
      const link = event.target?.closest?.(SELECTORS.INTERNAL_LINK);
      if (!link) return;

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
      this.hoverTimers.delete(link);
      this.prefetch(href);
    }, this.hoverDelayMs);

    this.hoverTimers.set(link, timerId);
  }

  cancelPrefetch(link) {
    const timerId = this.hoverTimers.get(link);
    if (timerId) {
      window.clearTimeout(timerId);
      this.hoverTimers.delete(link);
    }
  }

  async prefetch(href) {
    const resolved = this.routerResolver.resolve(href);
    if (resolved.kind !== "commit" && resolved.kind !== "same-document") {
      return;
    }

    const path = resolved.path;
    if (this.prefetchCache?.has(path)) return;

    this.prefetchController?.abort();
    this.prefetchController = new AbortController();

    try {
      const html = await this.routerPageManager.requestPage(path, {
        signal: this.prefetchController.signal,
        useCache: false,
      });
      if (!html) return;

      const metadata = this.extractMetadata(html);
      this.prefetchCache?.set(path, html, metadata);
    } catch {
      // Prefetch is best-effort.
    }
  }

  extractMetadata(html) {
    try {
      const doc = new DOMParser().parseFromString(html, "text/html");
      const main = doc.querySelector(SELECTORS.MAIN);
      if (!main) return {};
      return {
        route: main.getAttribute(ATTRIBUTES.DATA_ROUTE) ?? null,
        backgroundColor: main.getAttribute(ATTRIBUTES.DATA_BACKGROUND) ?? null,
        color: main.getAttribute(ATTRIBUTES.DATA_COLOR) ?? null,
      };
    } catch {
      return {};
    }
  }
}
