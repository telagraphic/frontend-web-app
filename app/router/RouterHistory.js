export class RouterHistory {
  constructor({ onPop }) {
    this.onPop = onPop;
    this.history = window.history;
  }

  init() {
    this.history.scrollRestoration = "manual";
    window.addEventListener("popstate", (event) => {
      const path = event.state?.path ?? location.pathname;
      this.onPop(new URL(path, location.href));
    });
    if (!this.history.state?.path) {
      this.replace(location.pathname);
    }
  }

  push(path) {
    this.history.pushState({ path, scroll: 0 }, "", path);
  }

  replace(path) {
    const scroll = this.history.state?.scroll ?? 0;
    this.history.replaceState({ path, scroll }, "", path);
  }

  saveScroll(smoothScroll) {
    const path = this.history.state?.path ?? location.pathname;
    const scroll = smoothScroll?.getScroll?.() ?? window.scrollY ?? 0;
    this.history.replaceState({ path, scroll }, "", path);
  }

  restoreScroll(smoothScroll) {
    const scroll = this.history.state?.scroll ?? 0;
    smoothScroll?.scrollTo(scroll, { immediate: true });
  }
}
