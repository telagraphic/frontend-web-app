import Component from "./Component.js";
import { gsap } from "gsap/index.js";

export class Animation extends Component {
  constructor(element, elements) {
    super({
      element,
      elements,
    });

    // this.createIntersectionObserver();
  }

  /**
   * Create an Intersection Observer for the element to animate in and out
   * Uses
   */
  createIntersectionObserver() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.animateIn();
        } else {
          this.animateOut();
        }
      });
    });

    observer.observe(this.element);
  }

  /**
   * This parent class will call the overriden methods in the child class in the Intersection Observer
   */
  animateIn() {
  }

  /**
   * This parent class will call the overriden methods in the child class in the Intersection Observer
   */
  animateOut() {
  }

  /**
   * Run the transition callback in an RAF, remove the listener when done
   * @param {*} element to target for animation
   * @param {*} callback function to run on element for transition
   * @returns Promise
   * @example call in Page.show/hide
   *  this.element.classList.remove("is-visible"); does not work for main.is-visible animation keyframes
   *  const hideOverlay = (element) => element.classList.add("is-visible");
   *  await this.animations.onCSSTransition(this.transitionOverlay, hideOverlay);
   */
  async onCSSTransition(element, transitionCallback) {
    return new Promise((resolve) => {
      element.addEventListener("transitionstart", () => {
        // console.log("Transition started");
      });

      element.addEventListener(
        "transitionend",
        () => {
          // console.log("Transition ended");
          resolve();
        },
        { once: true }
      );

      requestAnimationFrame(() => {
        transitionCallback(element);
      });
    });
  }

  /**
   * Run the animation callback in an RAF, remove the listener when done
   * @param {*} element
   * @param {*} animationCallback
   * @returns Promise
   * @example call in Page.show/hide
   * const animationCallback = (element) => {
   *  element.classList.add("show-element");
   *   element.classList.remove("hide-element");
   * };
   *
   * await this.animations.onCSSAnimation(this.element, animationCallback);
   */
  async onCSSAnimation(element, animationCallback) {
    return new Promise((resolve) => {
      element.addEventListener(
        "animationstart",
        () => {
          // console.log("Animation started");
        },
        { once: true }
      );

      element.addEventListener(
        "animationend",
        () => {
          // console.log("Animation ended");
          element.classList.remove("show-element");
          resolve();
        },
        { once: true }
      );

      requestAnimationFrame(() => {
        animationCallback(element);
      });
    });
  }

  async GSAPShowAnimation(element) {
    return new Promise((resolve) => {
      const showTimeline = gsap.timeline();

      showTimeline.to(element, {
        opacity: 1,
        duration: 0.5,
        ease: "power2.inOut",
        onComplete: () => {
          resolve();
        },
      });
    });
  }

  async GSAPHideAnimation(element) {
    return new Promise((resolve) => {
      const hideTimeline = gsap.timeline();

      hideTimeline.to(element, {
        opacity: 0,
        duration: 1,
        ease: "power2.inOut",
        onComplete: () => {
          resolve();
        },
      });
    });
  }
}
