import BasePage from "./BasePage.js";

export default class Home extends BasePage {
  static elements = {
    title: "[data-home-title]",
  };
}
