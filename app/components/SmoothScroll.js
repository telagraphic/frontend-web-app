import Lenis from "lenis";

export class SmoothScroll extends EventTarget {
  constructor(options = {}) {
    super();
    this.lenis = null;
    this.options = options;
    this.controller = null;
    this.signal = null;
    this.ticker = null;
    this.tick = null;
    this.rafId = null;
    this.lastWidth = 0;
  }

  init() {
    this.destroy();
    this.controller = new AbortController();
    this.signal = this.controller.signal;
    this.lastWidth = window.innerWidth;

    this.lenis = new Lenis({
      autoRaf: false,
      anchors: true,
      ...this.options,
    });

    this.lenis.on("scroll", () => {
      this.dispatchEvent(new Event("scroll"));
    });

    window.addEventListener(
      "resize",
      () => {
        const width = window.innerWidth;
        if (width === this.lastWidth) return;
        this.lastWidth = width;
        this.refresh();
      },
      { signal: this.signal },
    );

    if (this.ticker) {
      this.useTicker(this.ticker);
    } else {
      this.loop();
    }

    if (document.documentElement.classList.contains("is-loading")) {
      this.stop();
    } else {
      this.start();
    }
  }

  loop() {
    if (this.ticker) return;
    this.rafId = requestAnimationFrame((time) => {
      this.lenis?.raf(time);
      this.loop();
    });
  }

  useTicker(ticker) {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    if (this.tick && this.ticker) this.ticker.remove(this.tick);
    this.ticker = ticker;
    if (!ticker) {
      if (this.lenis) this.loop();
      return;
    }
    this.tick = (time) => this.lenis?.raf(time * 1000);
    ticker.add(this.tick);
  }

  start() {
    document.documentElement.style.overflow = "";
    this.lenis?.start();
  }

  stop() {
    this.lenis?.stop();
    document.documentElement.style.overflow = "hidden";
  }

  refresh() {
    this.lenis?.resize();
  }

  getScroll() {
    return this.lenis?.scroll ?? window.scrollY ?? 0;
  }

  scrollTo(target, options) {
    this.lenis?.scrollTo(target, options);
  }

  isEnabled() {
    return Boolean(this.lenis);
  }

  isStopped() {
    return this.lenis ? this.lenis.isStopped : false;
  }

  destroy() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.rafId = null;
    if (this.tick && this.ticker) this.ticker.remove(this.tick);
    this.tick = null;
    this.controller?.abort();
    this.controller = null;
    this.signal = null;
    this.lenis?.destroy();
    this.lenis = null;
    document.documentElement.style.overflow = "";
  }
}
