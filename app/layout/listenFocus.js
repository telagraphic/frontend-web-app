import { $ } from "../utilities/dom.js";
import {
  SELECTORS,
  ATTRIBUTES,
  VALUES,
  EVENTS,
} from "../utilities/Constants.js";

export function listenFocus({ router, signal }) {
  router.addEventListener(
    EVENTS.NAVIGATION_END,
    (event) => {
      if (event.detail?.family !== "page-swap") return;
      const main = $(SELECTORS.MAIN);
      if (!main) return;
      if (main.contains(document.activeElement)) return;
      if (!main.hasAttribute(ATTRIBUTES.TABINDEX)) {
        main.setAttribute(ATTRIBUTES.TABINDEX, VALUES.TABINDEX_DISABLED);
      }
      main.focus();
    },
    { signal },
  );
}
