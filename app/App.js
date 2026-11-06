import { createServices } from "./services/ServicesFactory.js";
import { createLayout } from "./layout/createLayout.js";
import { pages } from "./config/pages.js";
import { siteRoutes } from "./config/siteRoutes.js";
import { $ } from "./utilities/dom.js";
import { SELECTORS, ATTRIBUTES, EVENTS } from "./utilities/Constants.js";
import { createError, ERROR_CODES } from "./utilities/ErrorRegistry.js";

class App {
  async init() {
    this.services = createServices();
    const { router, animationsService, transitionsService, smoothScroll } =
      this.services;

    try {
      await smoothScroll.init();
      await animationsService.init();
      await transitionsService?.init?.();
    } catch (error) {
      throw createError(ERROR_CODES.SERVICE_INIT_FAILED, {
        service: error.context?.service ?? "boot",
        cause: error,
      });
    }

    this.layout = createLayout(this.services);
    await this.layout.init();

    try {
      if (router) await router.init();
      else await showStandalonePage({ animationsService, smoothScroll });
    } catch (error) {
      await this.layout?.preloader?.destroy?.();
      throw createError(ERROR_CODES.SERVICE_INIT_FAILED, {
        service: router ? "Router" : "Page",
        cause: error,
      });
    }

    restoreDevScroll(smoothScroll);
  }
}

async function showStandalonePage({ animationsService, smoothScroll }) {
  const key = $(SELECTORS.MAIN)?.getAttribute(ATTRIBUTES.DATA_ROUTE) ?? "home";
  const load = pages[siteRoutes[key]?.page];
  if (!load) {
    throw createError(ERROR_CODES.PAGE_NOT_FOUND, { page: key });
  }
  const pageModule = await load();
  const Page = pageModule.default;
  const page = new Page({ animationsService, smoothScroll });
  await page.init();
  await whenPreloaderDone();
  await page.show({
    family: "document-load",
    from: null,
    to: key,
    path: location.pathname,
    history: "replace",
  });
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

function restoreDevScroll(smoothScroll) {
  try {
    const raw = sessionStorage.getItem("dev-scroll");
    if (raw == null) return;
    sessionStorage.removeItem("dev-scroll");
    const y = Number(raw);
    if (Number.isFinite(y)) smoothScroll?.scrollTo(y, { immediate: true });
  } catch {
    /* sessionStorage can throw in private mode */
  }
}

const app = new App();
app.init();
