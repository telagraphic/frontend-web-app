import BaseLifecycle from "../pages/BaseLifecycle.js";
import { createError, ERROR_CODES } from "../utilities/ErrorRegistry.js";

export default class Component extends BaseLifecycle {
  async init() {
    this.findRoot();
    if (!this.root) {
      throw createError(ERROR_CODES.COMPONENT_INIT_FAILED, {
        component: this.constructor.name,
      });
    }
    await super.init();
  }
}
