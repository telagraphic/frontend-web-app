export default class ViewTransition {
  init() {}

  destroy() {}

  // document.startViewTransition — Baseline newly available. Fall back to commit().
  wrapCommit(commit) {
    if (typeof document.startViewTransition !== "function") {
      return commit();
    }
    return document.startViewTransition(async () => {
      await commit();
    }).finished;
  }
}
