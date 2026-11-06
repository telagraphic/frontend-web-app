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

Write the real steps when that navigation combination exists in the running code. Until then, do not invent a cover/reveal wrapper around the View Transitions API.

## Do

**Page swap.** `TransitionsService` is a thin wrapper. The plug-in implements `wrapCommit(commit)` and calls `document.startViewTransition`. Set `view-transition-name` in CSS as `{role}-{route key}`. One name per element. `onHide` finishes before the snapshot.

**Document load.** Do not ship `TransitionsService` or the page-swap router. CSS is `@view-transition { navigation: auto }`. Shared names stay in CSS. Optional `pageswap` / `pagereveal` work lives in the head script, not the service.

Reduced motion: `::view-transition-group(*) { animation: none }`.

The work is done when the chosen path matches [PAGE_TRANSITIONS.md](../../../documentation/reference/PAGE_TRANSITIONS.md) and there is no overlay host.

## Do not

- Use [add-gsap-transition](../add-gsap-transition/SKILL.md) for this. The families do not share a class shape.
- Put `view-transition-name: match-element` on a document-load path.
- Animate the outgoing page with GSAP during the snapshot.
