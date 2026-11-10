import Component from "./Component.js";
import { $$, $ } from "../utilities/dom.js";
import { loadImages } from "../utilities/images.js";
import { gsap } from "../animations/gsap/gsap.js";
import { SELECTORS, EVENTS } from "../utilities/Constants.js";

const INERT_TARGETS = [
  ".skip-link",
  "[data-navigation]",
  "footer",
  SELECTORS.TRANSITION_HOST,
  SELECTORS.MAIN,
];

export default class Preloader extends Component {
  static elements = {
    title: SELECTORS.PRELOADER_TITLE,
    counter: SELECTORS.PRELOADER_COUNTER,
    copy: SELECTORS.PRELOADER_COPY,
  };

  constructor({ maxWait = 4000, counter = false, animationsService } = {}) {
    super({
      element: SELECTORS.PRELOADER,
      animationsService,
    });
    this.maxWait = maxWait;
    this.counterEnabled = counter;
  }

  onInit() {
    window.addEventListener(
      "pageshow",
      (event) => {
        if (event.persisted) this.skipPersisted();
      },
      { signal: this.signal },
    );

    if (!document.documentElement.classList.contains("is-loading")) {
      this.dispatchComplete();
      return;
    }

    this.setInert(true);
    if (this.counterEnabled && this.elements.counter) {
      this.elements.counter.hidden = false;
    }

    this.run();
  }

  async run() {
    await this.waitForAssets();
    await this.playHide();
    this.finish();
  }

  async waitForAssets() {
    const images = $$("[data-preload]");
    const total = images.length + 1;
    let settled = 0;

    const updateCounter = () => {
      if (!this.counterEnabled || !this.elements.counter) return;
      const percent = Math.round((settled / total) * 100);
      this.elements.counter.textContent = `${percent}%`;
    };

    const fonts = (document.fonts?.ready ?? Promise.resolve()).then(() => {
      settled += 1;
      updateCounter();
    });

    const imageWaits = images.map((image) =>
      loadImages([image], { maxWait: null }).then(() => {
        settled += 1;
        updateCounter();
      }),
    );

    const assets = Promise.all([fonts, ...imageWaits]);
    const timeout = new Promise((resolve) => {
      setTimeout(resolve, this.maxWait);
    });
    await Promise.race([assets, timeout]);

    if (this.counterEnabled && this.elements.counter) {
      this.elements.counter.textContent = "100%";
    }
  }

  playHide() {
    const copy = this.elements.copy;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    return new Promise((resolve) => {
      if (!this.animations) {
        resolve();
        return;
      }
      this.animations.add(({ reducedMotion: reduced }) => {
        if (reduced || reducedMotion) {
          gsap.set(this.root, { autoAlpha: 0 });
          resolve();
          return;
        }

        const timeline = gsap.timeline({ onComplete: resolve });
        if (copy) {
          timeline.to(copy, {
            y: "-100%",
            autoAlpha: 0,
            duration: 0.75,
            ease: "power2.inOut",
          });
        }
        timeline.to(
          this.root,
          {
            autoAlpha: 0,
            duration: 0.5,
            ease: "power2.inOut",
          },
          copy ? "-=0.3" : 0,
        );
      });
    });
  }

  finish() {
    this.setInert(false);
    document.documentElement.classList.add("is-animating");
    document.documentElement.classList.remove("is-loading");
    this.dispatchComplete();
  }

  skipPersisted() {
    this.setInert(false);
    document.documentElement.classList.remove(
      "is-loading",
      "is-covering",
      "is-animating",
    );
    if (this.root) this.root.style.display = "none";
    const host = $(SELECTORS.TRANSITION_HOST);
    if (host) {
      host.hidden = true;
      host.replaceChildren();
      host.style.pointerEvents = "";
    }
    this.dispatchComplete();
  }

  setInert(on) {
    for (const selector of INERT_TARGETS) {
      const element = $(selector);
      if (!element) continue;
      if (on) element.setAttribute("inert", "");
      else element.removeAttribute("inert");
    }
  }

  dispatchComplete() {
    document.dispatchEvent(new CustomEvent(EVENTS.PRELOADER_COMPLETE));
    this.dispatchEvent(new CustomEvent(EVENTS.PRELOADER_COMPLETE));
  }

  hide() {
    if (this.root) this.root.style.opacity = 0;
  }
}
