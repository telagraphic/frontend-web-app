import Page from "../classes/Page.js";


/**
 * Moons page is a simple page with 4 containers that move up and down when the wheel is scrolled
 * Each container has a different duration and ease
 * The containers are animated with gsap.quickTo
 * The wheel event listener is added to the window
 */
export class Moons extends Page {
  constructor() {
    super({
      id: "moons",
      element: ".moons",
      transitionOverlay: ".transition-overlay",
      elements: {
        wrapper: ".page-content",
        containerOne: ".container1",
        containerTwo: ".container2",
        containerThree: ".container3",
        containerFour: ".container4",
      },
    });

    this.moonAnimations = [];
    this.increment = 0;
    this.columnDurations = [0.5, 0.8, 0.6, 0.2];
  }

  create() {
    super.create({ isScrollSmooth: true });
    this.setupAnimations();
    this.setupWheelEvents();
  }

  destroy() {
    super.destroy();
    this.moonAnimations = [];
    this.increment = 0;
  }

  /**
   * Get all the container elements and create an animation calllback for each one
   */
  setupAnimations() {
    this.containers = Object.values(this.elements).filter(
      (element) => element && element.classList.contains("container")
    );
    this.containers.forEach((container, index) => {
      this.moonAnimations.push(
        this.createAnimation(container, this.columnDurations[index])
      );
    });
  }

  /**
   * Create a callback function for to be called in the wheel event listener
   * @param {HTMLElement} container the element to animate
   * @param {number} duration of animation
   * @returns {Function} anonymous callback function
   */
  createAnimation(container, duration = null) {
    const half = container.clientHeight / 2;
    const wrap = gsap.utils.wrap(-half, 0);
    const yTo = gsap.quickTo(container, "y", {
      duration: duration || this.randomDuration(),
      ease: "power3",
      modifiers: {
        y: gsap.utils.unitize(wrap),
      },
    });

    return (increment) => yTo(increment);
  }

  /**
   * Range is between 0.2 and 0.9 which equals 0.7 for the range
   * We need to add 0.2 to the range to get a number between 0.2 and 0.9 and prevent 0 values
   * @returns number between 0.2 and 0.9
   */
  randomDuration() {
    return Math.random() * 0.7 + 0.2;
  }

  /**
   * Listen for the wheel event and animate the containers
   */
  setupWheelEvents() {
    this.element.addEventListener(
      "wheel",
      (e) => {
        this.increment += e.deltaY / 2; // Dividing by 2 to slow down the movement
        this.moonAnimations.forEach((animation) => {
          animation(this.increment);
        });
      },
      { passive: true }
    );
  }

  // Original code to be refactored above
  // animateColumns() {
  //   let increment = 0;
  //   // Half of the total height of the column
  //   const half1 = this.elements.containerOne.clientHeight / 2;
  //   const wrap1 = gsap.utils.wrap(-half1, 0);
  //   const yTo1 = gsap.quickTo(this.elements.containerOne, "y", {
  //     duration: 0.5,
  //     ease: "power3",
  //     modifiers: {
  //       y: gsap.utils.unitize(wrap1),
  //     },
  //   });

  //   // Half of the total height of the column
  //   const half2 = this.elements.containerTwo.clientHeight / 2;
  //   const wrap2 = gsap.utils.wrap(-half2, 0);
  //   const yTo2 = gsap.quickTo(this.elements.containerTwo, "y", {
  //     duration: 0.8,
  //     ease: "power3",
  //     modifiers: {
  //       y: gsap.utils.unitize(wrap2),
  //     },
  //   });

  //   // Half of the total height of the column
  //   const half3 = this.elements.containerThree.clientHeight / 2;
  //   const wrap3 = gsap.utils.wrap(-half3, 0);
  //   const yTo3 = gsap.quickTo(this.elements.containerThree, "y", {
  //     duration: 0.6,
  //     ease: "power3",
  //     modifiers: {
  //       y: gsap.utils.unitize(wrap3),
  //     },
  //   });

  //   // Half of the total height of the column
  //   const half4 = this.elements.containerFour.clientHeight / 2;
  //   const wrap4 = gsap.utils.wrap(-half4, 0);
  //   const yTo4 = gsap.quickTo(this.elements.containerFour, "y", {
  //     duration: 0.2,
  //     ease: "power3",
  //     modifiers: {
  //       y: gsap.utils.unitize(wrap4),
  //     },
  //   });

  //   window.addEventListener(
  //     "wheel",
  //     (e) => {
  //       increment += e.deltaY / 2; // Dividing by 2 to slow down the movement
  //       yTo1(increment);
  //       yTo2(increment);
  //       yTo3(increment);
  //       yTo4(increment);
  //     },
  //     { passive: true }
  //   );
  // }
}
