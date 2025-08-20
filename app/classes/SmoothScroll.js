import { gsap } from "../../node_modules/gsap/index.js";

export class SmoothScroll {
  constructor({ container, wrapper }) {
    this.container = container;
    this.wrapper = wrapper;
    this.scroll = {
      current: 0,
      target: 0,
      last: 0,
      limit: 0,
    };
  }

  create() {
    this.container.style.position = "fixed";
    this.container.style.top = "0";
    this.container.style.left = "0";
    this.container.style.width = "100%";
    this.container.style.height = "100%";
    this.container.style.overflow = "hidden";
  }

  onMouseWheel(event) {
    const { deltaY } = event;
    this.scroll.target += deltaY;
  }

  onResize() {
    this.scroll.limit = this.wrapper.clientHeight - window.innerHeight;
  }

  updateAnimationFrame() {
    this.scroll.current = gsap.utils.interpolate(
      this.scroll.current,
      this.scroll.target,
      0.1,
    );

    if (this.scroll.current < 0.01) {
      this.scroll.current = 0;
    }

    this.scroll.current = gsap.utils.clamp(
      0,
      this.scroll.limit,
      this.scroll.current,
    );

    if (this.wrapper) {
      this.wrapper.style.transform = `translateY(-${this.scroll.current}px)`;
    }
  }

  destroy() {
    this.wrapper.style.transform = "none";
    this.container.style.position = "relative";
    this.container.style.top = "0";
    this.container.style.left = "0";
    this.container.style.width = "100%";
    this.container.style.height = "100%";
    this.container.style.overflow = "auto";
  }
}
