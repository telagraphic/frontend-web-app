/**
 *  Entry point for the application
 */

import { Router } from "./Router.js";

class App {
  constructor() {
    this.router = new Router();

    document.addEventListener("DOMContentLoaded", () => {
      this.router.init();
    });
  }
}

const app = new App();
