import { $ } from "../utilities/dom.js";
import { SELECTORS, EVENTS } from "../utilities/Constants.js";

function effectName(to) {
  const value = to?.pageTransition;
  if (typeof value === "string") return value;
  return value?.effect ?? null;
}

export class GsapTransitions extends EventTarget {
  constructor({ animationsService, defaultTransition, transitions = {} } = {}) {
    super();
    this.animationsService = animationsService;
    this.defaultTransition = defaultTransition;
    this.transitions = transitions;
    this.host = null;
    this.defaultPlugin = null;
    this.plugins = new Map();
  }

  async init() {
    this.host = $(SELECTORS.TRANSITION_HOST);
    if (this.defaultTransition) {
      this.defaultPlugin = new this.defaultTransition({
        host: this.host,
        animationsService: this.animationsService,
      });
      this.defaultPlugin.init();
    }
  }

  async destroy() {
    for (const plugin of this.plugins.values()) {
      await plugin.destroy?.();
    }
    this.plugins.clear();
    await this.defaultPlugin?.destroy?.();
    this.defaultPlugin = null;
  }

  async getPlugin(navigationContext) {
    const name = effectName(navigationContext?.to);
    if (!name) return this.defaultPlugin;

    if (this.plugins.has(name)) return this.plugins.get(name);

    const load = this.transitions[name];
    if (!load) {
      console.warn(`Unknown pageTransition effect: ${name}`);
      return this.defaultPlugin;
    }

    const module = await load();
    const Plugin = module.default;
    const plugin = new Plugin({
      host: this.host,
      animationsService: this.animationsService,
    });
    plugin.init();
    this.plugins.set(name, plugin);
    return plugin;
  }

  async run({ hideCurrent, loadNext, commit }, navigationContext) {
    const plugin = (await this.getPlugin(navigationContext)) ?? {
      prepare: async () => {},
      cover: async () => {},
      reveal: async () => {},
    };

    this.dispatchEvent(
      new CustomEvent(EVENTS.TRANSITION_START, { detail: navigationContext }),
    );
    if (this.host) this.host.style.pointerEvents = "all";

    await plugin.prepare?.(navigationContext);
    const [next] = await Promise.all([
      loadNext(),
      hideCurrent(),
      plugin.cover?.() ?? Promise.resolve(),
    ]);

    this.dispatchEvent(
      new CustomEvent(EVENTS.TRANSITION_COVERED, {
        detail: navigationContext,
      }),
    );

    if (navigationContext?.signal?.aborted || !next) {
      if (this.host) this.host.style.pointerEvents = "";
      return null;
    }

    await commit(next);

    if (navigationContext?.family !== "document-load") {
      await plugin.reveal?.();
      if (this.host) this.host.style.pointerEvents = "";
    }

    this.dispatchEvent(
      new CustomEvent(EVENTS.TRANSITION_END, { detail: navigationContext }),
    );
    return next;
  }

  async revealArrival() {
    const plugin = this.defaultPlugin;
    if (this.host) this.host.style.pointerEvents = "all";
    await plugin?.reveal?.();
    if (this.host) this.host.style.pointerEvents = "";
    document.documentElement.classList.remove("is-covering");
  }
}
