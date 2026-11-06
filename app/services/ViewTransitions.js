import { EVENTS } from "../utilities/Constants.js";

export class ViewTransitions extends EventTarget {
  constructor({ plugin } = {}) {
    super();
    this.plugin = plugin;
  }

  async init() {}

  async destroy() {
    await this.plugin?.destroy?.();
    this.plugin = null;
  }

  async run({ hideCurrent, loadNext, commit }, navigationContext) {
    this.dispatchEvent(
      new CustomEvent(EVENTS.TRANSITION_START, { detail: navigationContext }),
    );

    await hideCurrent();
    const next = await loadNext();
    if (navigationContext?.signal?.aborted || !next) {
      this.dispatchEvent(
        new CustomEvent(EVENTS.TRANSITION_END, { detail: navigationContext }),
      );
      return null;
    }

    const wrap = this.plugin?.wrapCommit?.bind(this.plugin);
    if (wrap) await wrap(() => commit(next));
    else await commit(next);

    this.dispatchEvent(
      new CustomEvent(EVENTS.TRANSITION_END, { detail: navigationContext }),
    );
    return next;
  }
}
