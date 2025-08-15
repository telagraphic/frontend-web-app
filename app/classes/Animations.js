export class Animations {
  /**
   * Run the transition callback, remove the listener when done
   * @param {*} element to target for animation
   * @param {*} callback function to run on element for transition
   * @returns nil
   */
  async runCSSTransition(element, transitionCallback) {
    return new Promise((resolve) => {
      element.addEventListener("transitionstart", () => {
        console.log("Transition started");
      });

      element.addEventListener(
        "transitionend",
        () => {
          resolve();
        },
        { once: true },
      );

      requestAnimationFrame(() => {
        transitionCallback(element);
      });
    });
  }

  async runCSSShowAnimation(element, animationCallback) {
    return new Promise((resolve) => {
      element.addEventListener(
        "animationstart",
        () => {
          // element.style.opacity = "0";
          console.log("show started");
        },
        { once: true },
      );

      element.addEventListener(
        "animationend",
        () => {
          console.log("show ended");
          resolve();
        },
        { once: true },
      );

      requestAnimationFrame(() => {
        animationCallback(element);
      });
    });
  }

  async runCSSHideAnimation(element, animationCallback) {
    return new Promise((resolve) => {
      element.addEventListener(
        "animationstart",
        () => {
          console.log("hide started");
        },
        { once: true },
      );

      element.addEventListener(
        "animationend",
        () => {
          console.log("hide ended");
          resolve();
        },
        { once: true },
      );

      requestAnimationFrame(() => {
        animationCallback(element);
      });
    });
  }
}
