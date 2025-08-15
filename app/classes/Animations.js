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

      element.addEventListener("transitionend", () => {
        resolve();
      });

      requestAnimationFrame(() => {
        transitionCallback(element);
      });
    });
  }
}
