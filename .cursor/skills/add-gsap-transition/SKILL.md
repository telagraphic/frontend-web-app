---
name: add-gsap-transition
description: >-
  Adds a GSAP page-transition plug-in that injects markup into the transition
  host and implements prepare, cover, and reveal. Use when the user asks to
  add, create, or customize a GSAP transition, overlay transition, page
  transition effect, wipe, or cover animation. Do not use for view transitions.
---

# Add a GSAP transition

Read [GSAP_TRANSITION.md](../../../documentation/reference/GSAP_TRANSITION.md) and copy that boilerplate. Terms are in [GLOSSARY.md](../../../GLOSSARY.md).

## Do

- Add `app/transitions/{name}/{Name}Transition.js` with `init`, `destroy`, `markup`, `prepare`, `cover`, and `reveal`.
- Inject HTML in `prepare` from `navigationContext.to.pageTransition`. Leave `[data-transition-host]` empty in the layout.
- Run GSAP inside `this.animations.add`, and resolve the promise when the tween finishes. `duration` is `0` when `reducedMotion` is set.
- `destroy` reverts the animation scope and clears the host.
- Wire the default class in `createServices()`. A second effect goes in `app/config/transitions.js` (name → `import()`) and is selected by the destination route's `pageTransition.effect` (ADR 0024).
- Put `copy`, `image`, and `alt` as strings on `pageTransition` in `siteRoutes.js`. `markup()` reads `navigationContext.to`. Do not add `<template>` overlay markup.

## Do not

- Edit `TransitionsService.run`, the router, or page `onHide` / `onShow` to sequence this effect.
- Fetch HTML, swap `<main>`, or call `location.assign` from the plug-in.
- Add `TransitionsService` work for a view transition. Full-load view transitions do not include that service. Client-swap view transitions use `wrapCommit` only. See [PAGE_TRANSITIONS.md](../../../documentation/reference/PAGE_TRANSITIONS.md).
- Use the words SPA or MPA. The navigation options are page swap and document load.
- Dispatch `transitionstart`, `transitioncovered`, or `transitionend`. The service does, and callers do not await them.
- Import GSAP from `"gsap"`. Import it from `app/animations/gsap/gsap.js`.
