---
name: add-view-transition
description: >-
  Adds a view-transition path: CSS names and wrapCommit or
  @view-transition, with no overlay host. Use when the user asks to add
  or customize a view transition, shared element, or
  document.startViewTransition. Do not use for GSAP overlays.
---

# Add a view transition

Read [PAGE_TRANSITIONS.md](../../../documentation/reference/PAGE_TRANSITIONS.md). Terms: [GLOSSARY.md](../../../GLOSSARY.md). Decisions: ADR 0012, ADR 0002.

`document.startViewTransition` is Baseline **newly available**. `@view-transition` is **Limited** (Firefox ignores it). Both ship with a fallback: wrapCommit calls `commit()` when the API is missing; unsupported browsers document-load.

## Do

### Page swap (same-document)

1. No overlay host in `views/layouts/page.{ext}`.
2. Factory imports `ViewTransitions` and `ViewTransition`. `createServices()` returns that object as `transitionsService`.
3. `app/transitions/view/ViewTransition.js` implements `wrapCommit(commit)` only:

```js
wrapCommit(commit) {
  if (typeof document.startViewTransition !== "function") return commit();
  return document.startViewTransition(async () => {
    await commit();
  }).finished;
}
```

4. `ViewTransitions.run` is `hideCurrent`, then `loadNext`, then `wrapCommit(() => commit(next))`. Do not call `prepare` / `cover` / `reveal`.
5. Set `view-transition-name` in `styles/components/view-transition.css` as `{role}-{route key}` (for example `title-home`). One name per element. Import that file from `styles/styles.css`.
6. Reduced motion: `::view-transition-group(*) { animation: none }`.
7. Page `onHide` finishes before `startViewTransition`. Do not run GSAP on the outgoing page during the snapshot.

### Document load (cross-document)

1. Do not ship `ViewTransitions`, `ViewTransition.js`, the page-swap router, or `DocumentLoad.js`.
2. CSS is `@view-transition { navigation: auto }` in `styles/components/view-transition-document.css`, plus the shared names file.
3. Do not `preventDefault` on links. The browser navigates.
4. Do not use `view-transition-name: match-element`.
5. Optional `pageswap` / `pagereveal` work lives in `app/head.js`, not a service, and only when a shared name must be chosen at click time.

The work is done when the chosen path matches [PAGE_TRANSITIONS.md](../../../documentation/reference/PAGE_TRANSITIONS.md) and there is no overlay host.

## Do not

- Use [add-gsap-transition](../add-gsap-transition/SKILL.md) for this. The families do not share a class shape.
- Put `view-transition-name: match-element` on a document-load path.
- Animate the outgoing page with GSAP during the snapshot.
- Import GSAP from the view-transition plug-in.
