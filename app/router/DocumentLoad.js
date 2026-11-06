import { $ } from "../utilities/dom.js";
import { SELECTORS, ATTRIBUTES, EVENTS } from "../utilities/Constants.js";
import {
  createError,
  ERROR_CODES,
  requireDependency,
} from "../utilities/ErrorRegistry.js";

const COVER_FLAG = "gsap-cover";

export class DocumentLoad extends EventTarget {
  constructor({
    routes,
    pages,
    animationsService,
    transitionsService,
    smoothScroll,
  }) {
    super();
    requireDependency("DocumentLoad", {
      routes,
      pages,
      animationsService,
      transitionsService,
      smoothScroll,
    });
    this.routes = routes;
    this.pages = pages;
    this.animationsService = animationsService;
    this.transitionsService = transitionsService;
    this.smoothScroll = smoothScroll;
    this.currentPage = null;
    this.controller = null;
    this.byPath = new Map();
    for (const [key, record] of Object.entries(routes)) {
      this.byPath.set(record.path, { key, record });
    }
  }

  async init() {
    this.listenLinks();
    await this.showFirstPage();
    if (document.documentElement.classList.contains("is-covering")) {
      await this.transitionsService.revealArrival();
    }
  }

  async destroy() {
    this.controller?.abort();
    await this.currentPage?.destroy?.();
    this.currentPage = null;
  }

  currentKey() {
    return $(SELECTORS.MAIN)?.getAttribute(ATTRIBUTES.DATA_ROUTE) ?? null;
  }

  resolve(url) {
    const parsed = url instanceof URL ? url : new URL(url, location.href);
    if (parsed.origin !== location.origin) {
      return { kind: "external", url: parsed };
    }
    const entry = this.byPath.get(parsed.pathname);
    if (!entry) return { kind: "not-found", url: parsed };
    if (parsed.pathname === location.pathname) {
      return {
        kind: "same-document",
        key: entry.key,
        record: entry.record,
        path: parsed.pathname,
      };
    }
    return {
      kind: "commit",
      key: entry.key,
      record: entry.record,
      path: parsed.pathname,
    };
  }

  async showFirstPage() {
    const key = this.currentKey() ?? "home";
    const pageClass = await this.loadPageClass(key);
    if (!pageClass) {
      throw createError(ERROR_CODES.PAGE_NOT_FOUND, { page: key });
    }
    this.currentPage = new pageClass({
      smoothScroll: this.smoothScroll,
      animationsService: this.animationsService,
    });
    await this.currentPage.init();
    await whenPreloaderDone();
    await this.currentPage.show({
      family: "document-load",
      from: null,
      to: key,
      path: location.pathname,
      history: "replace",
      signal: this.controller?.signal,
    });
  }

  async loadPageClass(key) {
    const pageName = this.routes[key]?.page;
    const load = pageName ? this.pages[pageName] : undefined;
    if (!load) return null;
    const pageModule = await load();
    return pageModule.default ?? null;
  }

  shouldIntercept(anchor, event) {
    if (!anchor) return false;
    if (event.button !== 0) return false;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return false;
    }
    if (anchor.hasAttribute("download")) return false;
    const target = anchor.getAttribute(ATTRIBUTES.TARGET);
    if (target && target !== "_self") return false;
    return true;
  }

  handleLinkClick(event) {
    const anchor = event.target.closest?.(SELECTORS.INTERNAL_LINK);
    if (!this.shouldIntercept(anchor, event)) return;

    const url = new URL(anchor.href, location.href);
    if (url.hash && url.pathname === location.pathname) return;

    const resolved = this.resolve(url);
    if (resolved.kind === "same-document") {
      event.preventDefault();
      return;
    }
    if (resolved.kind !== "commit") return;

    event.preventDefault();
    this.navigate(url);
  }

  listenLinks() {
    document.addEventListener(
      EVENTS.CLICK,
      (event) => this.handleLinkClick(event),
      { capture: true },
    );
  }

  async navigate(url) {
    const parsed = url instanceof URL ? url : new URL(url, location.href);
    const resolved = this.resolve(parsed);
    if (resolved.kind !== "commit") {
      location.assign(parsed.pathname);
      return;
    }

    this.controller?.abort();
    this.controller = new AbortController();
    const { signal } = this.controller;
    const fromKey = this.currentKey();
    const context = {
      family: "document-load",
      from: fromKey ? { key: fromKey, ...this.routes[fromKey] } : null,
      to: { key: resolved.key, ...resolved.record },
      path: resolved.path,
      history: "push",
      signal,
    };

    this.dispatchEvent(
      new CustomEvent(EVENTS.NAVIGATION_START, { detail: context }),
    );
    this.smoothScroll?.stop();

    try {
      const next = await this.transitionsService.run(
        {
          hideCurrent: () =>
            this.currentPage
              ? this.currentPage.hide(context)
              : Promise.resolve(),
          loadNext: async () => {
            prefetch(resolved.path);
            return { path: resolved.path };
          },
          commit: async () => {
            writeCoverFlag(context);
            location.assign(resolved.path);
          },
        },
        context,
      );
      return next;
    } catch (error) {
      if (error.name === "AbortError" || signal.aborted) return;
      console.error(error);
      location.assign(resolved.path);
    }
  }
}

function whenPreloaderDone() {
  if (!document.documentElement.classList.contains("is-loading")) {
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    document.addEventListener(EVENTS.PRELOADER_COMPLETE, resolve, {
      once: true,
    });
    if (!document.documentElement.classList.contains("is-loading")) {
      resolve();
    }
  });
}

function writeCoverFlag(context) {
  const fields = overlayFields(context.to);
  sessionStorage.setItem(
    COVER_FLAG,
    JSON.stringify({
      path: context.path,
      at: Date.now(),
      copy: fields.copy ?? "",
      image: fields.image ?? "",
      alt: fields.alt ?? "",
    }),
  );
}

function overlayFields(to) {
  const value = to?.pageTransition;
  if (!value || typeof value === "string") return {};
  return value;
}

function prefetch(path) {
  if (document.querySelector(`link[rel="prefetch"][href="${path}"]`)) return;
  const link = document.createElement("link");
  link.rel = "prefetch";
  link.href = path;
  document.head.append(link);
}

export { COVER_FLAG };
