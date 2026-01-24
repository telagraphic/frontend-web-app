
/**
 * Class to handle the background and colors of the page
 * Use a data-color attribute to pass in the colors from each page's html
 * TODO: Could call in Navigation.onChange() for page specific colors
 * TODO: What are the use cases for the class?
 */
class BackgroundColors {
  change(backgroundColor, color) {
    gsap.to(document.documentElement, {
      backgroundColor: backgroundColor,
      color: color,
      duration: 0.3,
      ease: "power2.inOut",
    });
  }
}

export default new BackgroundColors();