

/**
 * Class to handle the background and colors of the page
 * Use a data-color attribute to pass in the colors from each page's html
 */
export class Colors {
  change(backgroundColor, color) {
    gsap.to(document.documentElement, {
      backgroundColor: backgroundColor,
      color: color,
      duration: 0.3,
      ease: "power2.inOut",
    });
  }
}

export const BackgroundColors = new Colors();
