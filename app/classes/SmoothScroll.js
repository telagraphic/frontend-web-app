import { gsap } from "../../node_modules/gsap/index.js";

export class SmoothScroll {
  constructor(wrapper) {
    this.body = document.body;
    this.wrapper = wrapper;
    this.scroll = {
      current: 0,
      target: 0,
      last: 0,
      limit: 0,
    };
  }

  create() {
    this.body.style.position = "fixed";
    this.body.style.top = "0";
    this.body.style.left = "0";
    this.body.style.width = "100%";
    this.body.style.height = "100%";
    this.body.style.overflow = "hidden";
  }

  onMouseWheel(event) {
    const { deltaY } = event;
    this.scroll.target += deltaY;
  }

  onResize() {
    this.scroll.limit = this.wrapper.wrapper.clientHeight - window.innerHeight;
  }

  updateRAF() {
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
      this.wrapper.wrapper.style.transform = `translateY(-${this.scroll.current}px)`;
    }
  }

  destroy() {
    this.wrapper.wrapper.style.transform = "none";
    this.body.style.position = "relative";
    this.body.style.top = "0";
    this.body.style.left = "0";
    this.body.style.width = "100%";
    this.body.style.height = "100%";
    this.body.style.overflow = "auto";
  }
}
