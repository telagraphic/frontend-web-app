import Component from "./Component.js";
import { $ } from "../utilities/dom.js";
import { SELECTORS, EVENTS, ATTRIBUTES } from "../utilities/Constants.js";

export default class Navigation extends Component {
  static elements = {
    toggle: SELECTORS.NAV_TOGGLE,
    panel: SELECTORS.NAV_PANEL,
    links: [SELECTORS.INTERNAL_LINK],
  };

  constructor({ router, smoothScroll, animationsService }) {
    super({
      element: SELECTORS.NAV,
      animationsService,
    });
    this.router = router;
    this.smoothScroll = smoothScroll;
    this.stoppedScroll = false;
    this.skipScrollStart = false;
  }

  onInit() {
    this.toggle = this.elements.toggle;
    this.panel = this.elements.panel;
    this.links = this.elements.links;
    this.listenToggle();
    this.listenKeys();
    this.router?.addEventListener(
      EVENTS.NAVIGATION_START,
      () => {
        this.skipScrollStart = true;
        this.close();
        this.skipScrollStart = false;
      },
      { signal: this.signal },
    );
    this.router?.addEventListener(
      EVENTS.NAVIGATION_END,
      (event) => this.markCurrent(event.detail?.path),
      { signal: this.signal },
    );
    this.markCurrent(location.pathname);
  }

  getStatus() {
    return this.root.getAttribute("data-navigation-status");
  }

  open() {
    if (this.getStatus() === "active") return;
    this.root.setAttribute("data-navigation-status", "active");
    this.toggle?.setAttribute("aria-expanded", "true");
    this.links?.[0]?.focus();
    $(SELECTORS.MAIN)?.setAttribute("inert", "");
    this.smoothScroll?.stop();
    this.stoppedScroll = true;
    this.onOpen?.();
  }

  close() {
    if (this.getStatus() !== "active") return;
    this.root.setAttribute("data-navigation-status", "not-active");
    this.toggle?.setAttribute("aria-expanded", "false");
    this.toggle?.focus();
    $(SELECTORS.MAIN)?.removeAttribute("inert");
    this.onClose?.();
    if (this.stoppedScroll && !this.skipScrollStart) {
      this.smoothScroll?.start();
    }
    this.stoppedScroll = false;
  }

  markCurrent(path) {
    const current = path ?? location.pathname;
    for (const link of this.links ?? []) {
      const href = link.getAttribute(ATTRIBUTES.HREF);
      if (!href) continue;
      const url = new URL(href, location.href);
      if (url.pathname === current) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    }
  }

  listenToggle() {
    this.toggle?.addEventListener(
      "click",
      () => {
        if (this.getStatus() === "active") this.close();
        else this.open();
      },
      { signal: this.signal },
    );
  }

  listenKeys() {
    document.addEventListener(
      "keydown",
      (event) => {
        if (event.key === "Escape" || event.code === "Escape") {
          if (this.getStatus() === "active") this.close();
        }
      },
      { signal: this.signal },
    );
  }
}
