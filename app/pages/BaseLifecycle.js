import { $, $$, select } from "../utilities/dom.js";
import { isProduction } from "../utilities/environment.js";
import { createError, ERROR_CODES } from "../utilities/ErrorRegistry.js";
import GsapAnimationScope from "../animations/gsap/GsapAnimationScope.js";

export default class BaseLifecycle extends EventTarget {
  static elements = {};

  constructor(options = {}) {
    super();
    this.options = options;
    this.children = [];
    this.elements = {};
    this.root = null;
    this.element = null;
    this.controller = null;
    this.signal = null;
    this.animations = null;
    this.animationsService = options.animationsService;
    this.inited = false;
    this.destroyed = false;
  }

  findRoot() {
    const selector = this.options.element;
    if (selector instanceof Element) {
      this.root = selector;
    } else if (typeof selector === "string") {
      this.root = $(selector);
    }
    this.element = this.root;
  }

  createScope() {
    if (this.animationsService) {
      this.animations = this.animationsService.createScope(this.root);
      return;
    }
    this.animations = new GsapAnimationScope({ root: this.root });
    this.animations.init();
  }

  async init() {
    if (this.inited || this.destroyed) return;
    if (!this.root) this.findRoot();

    this.controller = new AbortController();
    this.signal = this.controller.signal;
    this.elements = select(
      this.root ?? document,
      {
        ...this.constructor.elements,
        ...this.options.elements,
      },
      isProduction() ? undefined : { className: this.constructor.name },
    );
    this.createScope();
    await this.onInit?.();
    this.inited = true;
  }

  $(selector) {
    return $(selector, this.root ?? document);
  }

  $$(selector) {
    return $$(selector, this.root ?? document);
  }

  async use(child) {
    this.children.push(child);
    try {
      await child.init();
    } catch (error) {
      throw createError(ERROR_CODES.PAGE_HOOK_FAILED, {
        page: this.constructor.name,
        hook: "use",
        cause: error,
      });
    }
    return child;
  }

  async destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    await this.onDestroy?.();
    for (const child of this.children) {
      await child.destroy?.();
    }
    this.children = [];
    this.animations?.destroy();
    this.animations = null;
    this.controller?.abort();
    this.inited = false;
  }
}
