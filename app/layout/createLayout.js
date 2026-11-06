import Menu from "../components/menus/Menu.js";
import Preloader from "../components/Preloader.js";
import { listenFocus } from "./listenFocus.js";
import { ERROR_CODES } from "../utilities/ErrorRegistry.js";
import { EVENTS } from "../utilities/Constants.js";

export function createLayout({ router, animationsService, smoothScroll }) {
  const controller = new AbortController();
  const menu = new Menu({ router, smoothScroll, animationsService });
  const preloader = new Preloader({ animationsService });

  return {
    menu,
    preloader,
    async init() {
      listenFocus({ router, signal: controller.signal });
      await initLayoutComponent(menu);

      preloader.addEventListener(
        EVENTS.PRELOADER_COMPLETE,
        () => {
          smoothScroll?.start();
          preloader.destroy();
        },
        { once: true, signal: controller.signal },
      );

      const preloaderReady = await initLayoutComponent(preloader);
      if (!preloaderReady) {
        document.documentElement.classList.remove("is-loading");
        document.dispatchEvent(new CustomEvent(EVENTS.PRELOADER_COMPLETE));
        smoothScroll?.start();
      }
    },
    destroy() {
      controller.abort();
      menu.destroy();
      preloader.destroy();
    },
  };
}

async function initLayoutComponent(component) {
  try {
    await component.init();
    return true;
  } catch (error) {
    if (error.code === ERROR_CODES.COMPONENT_INIT_FAILED) {
      console.error(error.message);
      return false;
    }
    throw error;
  }
}
