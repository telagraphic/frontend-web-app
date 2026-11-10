import BaseLifecycle from "./BaseLifecycle.js";
import { $ } from "../utilities/dom.js";
import { SELECTORS } from "../utilities/Constants.js";
import { createError, ERROR_CODES } from "../utilities/ErrorRegistry.js";

export default class BasePage extends BaseLifecycle {
  static elements = {
    titleAnimations: SELECTORS.TITLE_ANIMATIONS,
  };

  constructor(options = {}) {
    super(options);
    this.smoothScroll = options.smoothScroll;
    this.animationsService = options.animationsService;
  }

  findRoot() {
    this.root = $(SELECTORS.MAIN);
    this.element = this.root;
  }

  async init() {
    this.findRoot();
    if (!this.root) {
      throw createError(ERROR_CODES.ELEMENT_NOT_FOUND, {
        element: "main[data-route]",
      });
    }
    await super.init();
  }

  async show(context) {
    const root = document.documentElement;
    root.classList.add("is-animating");
    try {
      this.animationsService?.addTypes(this.animations, this.root);
      await this.onShow?.(context);
      this.smoothScroll?.refresh();
      this.animationsService?.refresh();
    } catch (error) {
      console.warn(
        `${this.constructor.name}: show hook failed, continuing:`,
        error,
      );
    } finally {
      root.classList.remove("is-animating");
    }
  }

  async hide(context) {
    try {
      await this.onHide?.(context);
    } catch (error) {
      throw createError(ERROR_CODES.PAGE_HOOK_FAILED, {
        page: this.constructor.name,
        hook: "hide",
        cause: error,
      });
    }
  }
}
