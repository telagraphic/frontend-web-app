/**
 *  Entry point for the application
 */

import { Router } from "./Router.js";

class App {
  constructor() {
    this.router = new Router();
    this.router.init();
  }
}

const app = new App();
