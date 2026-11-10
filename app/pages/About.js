import BasePage from "./BasePage.js";

export default class About extends BasePage {
  static elements = {
    title: "[data-about-title]",
  };
}
