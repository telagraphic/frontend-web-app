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
    if (!this.container.classList.contains("smooth-scroll-container")) {
      this.container.classList.add("smooth-scroll-container");
    }
    this.onResize();
    this.updateAnimationFrame();
  }

  /**
   * Updates the animation frame for smooth scrolling
   */
  updateAnimationFrame() {
    if (this.updateSmoothScroll) {
      this.updateSmoothScroll();
    }

    this.animationFrame = window.requestAnimationFrame(
      this.updateAnimationFrame.bind(this),
    );
  }

  onMouseWheel(event) {
    const { deltaY } = event;
    this.scroll.target += deltaY;
  }

  onResize() {
    this.scroll.limit = this.wrapper.clientHeight - window.innerHeight;
  }

  updateSmoothScroll() {
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

  setupEventListeners() {
    if (this.onMouseWheel) {
      this.onMouseWheelEvent = (event) => {
        this.onMouseWheel(event);
      };
      window.addEventListener("mousewheel", this.onMouseWheelEvent);
    }

    if (this.onResize) {
      this.onResizeEvent = (event) => {
        this.onResize(event).bind(this);
      };
      window.addEventListener("resize", this.onResizeEvent);
    }
  }

  removeEventListeners() {
    if (this.onMouseWheelEvent) {
      window.removeEventListener("mousewheel", this.onMouseWheelEvent);
    }

    if (this.onResizeEvent) {
      console.log("onresizeevent removed");
      window.removeEventListener("resize", this.onResizeEvent);
    }
  }

  destroy() {
    this.wrapper.style.transform = "none";
    this.container.classList.remove("smooth-scroll-container");
  }
}
