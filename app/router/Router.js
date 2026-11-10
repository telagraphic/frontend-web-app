import { $ } from "../utilities/dom.js";
import { RouterHistory } from "./RouterHistory.js";
import { RouterResolver } from "./RouterResolver.js";
import { RouterPageLoader } from "./RouterPageLoader.js";
import { RouterPageManager } from "./RouterPageManager.js";
import { RouterPrefetchCache } from "./RouterPrefetchCache.js";
import { RouterPrefetchManager } from "./RouterPrefetchManager.js";
import { swap, updateHead } from "./RouterSwap.js";
import { loadImages } from "../utilities/images.js";
import { SELECTORS, ATTRIBUTES, EVENTS } from "../utilities/Constants.js";
import {
  createError,
  ERROR_CODES,
  requireDependency,
} from "../utilities/ErrorRegistry.js";

export class Router extends EventTarget {
  constructor({
    routes,
    pages,
    animationsService,
    transitionsService,
    smoothScroll,
  }) {
    super();
    requireDependency("Router", {
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

    this.routerResolver = new RouterResolver({ routes });
    this.routerHistory = new RouterHistory({
      onPop: (url) => this.navigate(url, { history: "traverse" }),
    });
    this.routerPageLoader = new RouterPageLoader({
      routes,
      pages,
      smoothScroll,
      animationsService,
    });
    this.prefetchCache = new RouterPrefetchCache({});
    this.routerPageManager = new RouterPageManager({
      prefetchCache: this.prefetchCache,
    });
    this.prefetchManager = new RouterPrefetchManager({
      routerResolver: this.routerResolver,
      routerPageManager: this.routerPageManager,
      prefetchCache: this.prefetchCache,
    });
  }

  async init() {
    this.listenLinks();
    this.routerHistory.init();
    this.prefetchManager?.init?.();
    await this.showFirstPage();
  }

  async destroy() {
    this.controller?.abort();
    await this.currentPage?.destroy?.();
    this.currentPage = null;
  }

  currentKey() {
    return $(SELECTORS.MAIN)?.getAttribute(ATTRIBUTES.DATA_ROUTE) ?? null;
  }

  async showFirstPage() {
    const route = this.currentKey();
    const pageClass = route
      ? await this.routerPageLoader.loadPage(route).catch(() => null)
      : null;
    const fallbackClass = pageClass
      ? null
      : await this.routerPageLoader.loadPage("home");
    const resolvedClass = pageClass ?? fallbackClass;

    if (!resolvedClass) {
      throw createError(ERROR_CODES.PAGE_NOT_FOUND, {
        page: "home (fallback)",
      });
    }

    this.currentPage = this.routerPageLoader.initializePage(resolvedClass);
    await this.currentPage.init();
    await whenPreloaderDone();
    await this.currentPage.show({
      family: "page-swap",
      from: null,
      to: route ?? "home",
      path: location.pathname,
      history: "replace",
      signal: this.controller?.signal,
    });
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

    const resolved = this.routerResolver.resolve(url);
    if (resolved.kind === "same-document") {
      event.preventDefault();
      return;
    }
    if (resolved.kind !== "commit") return;

    event.preventDefault();
    this.navigate(url, { history: "push" });
  }

  listenLinks() {
    document.addEventListener(
      EVENTS.CLICK,
      (event) => this.handleLinkClick(event),
      { capture: true },
    );
  }

  async navigate(url, { history: historyMode = "push" } = {}) {
    const parsed = url instanceof URL ? url : new URL(url, location.href);
    const fromPath =
      historyMode === "traverse"
        ? (this.routes[this.currentKey()]?.path ?? "")
        : location.pathname;
    const resolved = this.routerResolver.resolve(parsed, {
      currentPath: fromPath,
    });
    if (resolved.kind === "not-found") {
      location.assign(parsed.pathname);
      return;
    }
    if (resolved.kind !== "commit") return;

    this.controller?.abort();
    this.controller = new AbortController();
    const { signal } = this.controller;

    const fromKey = this.currentKey();
    const context = {
      family: "page-swap",
      from: fromKey ? { key: fromKey, ...this.routes[fromKey] } : null,
      to: { key: resolved.key, ...resolved.record },
      path: resolved.path,
      history: historyMode,
      signal,
    };

    this.dispatchEvent(
      new CustomEvent(EVENTS.NAVIGATION_START, { detail: context }),
    );

    if (historyMode !== "traverse") {
      this.routerHistory.saveScroll(this.smoothScroll);
    }
    this.smoothScroll?.stop();

    try {
      const next = await this.transitionsService.run(
        {
          hideCurrent: () =>
            this.currentPage
              ? this.currentPage.hide(context)
              : Promise.resolve(),
          loadNext: () =>
            this.routerPageManager.load(resolved.path, { signal }),
          commit: (documentResult) => this.commit(documentResult, context),
        },
        context,
      );

      if (signal.aborted) return;
      if (!next) {
        location.assign(resolved.path);
        return;
      }

      this.smoothScroll?.start();

      this.dispatchEvent(
        new CustomEvent(EVENTS.NAVIGATION_END, { detail: context }),
      );
    } catch (error) {
      if (error.name === "AbortError" || signal.aborted) return;
      console.error(error);
      location.assign(resolved.path);
    }
  }

  async commit(next, context) {
    if (context.signal?.aborted) return;

    await this.currentPage?.destroy?.();
    this.currentPage = null;
    if (context.signal?.aborted) return;

    const currentMain = $(SELECTORS.MAIN);
    swap(currentMain, next.main);
    updateHead(next.document);
    this.animationsService?.checkLeaks();

    if (context.history === "push") this.routerHistory.push(context.path);
    else if (context.history === "replace") {
      this.routerHistory.replace(context.path);
    }

    const page = await this.routerPageLoader.getPage(context.to.key);
    this.currentPage = page;
    await page.init();
    if (context.signal?.aborted) return;

    await loadImages(currentMain.querySelectorAll("[data-preload]"));
    this.smoothScroll?.refresh();
    if (context.signal?.aborted) return;

    if (context.history === "traverse") {
      this.routerHistory.restoreScroll(this.smoothScroll);
    } else {
      this.smoothScroll?.scrollTo(0, { immediate: true });
    }
    await page.show(context);
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
