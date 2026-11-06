---
status: accepted
---

# The destination route owns the effect and the overlay fields

Issue #2 asked whether a route or a pair of routes can pick a different page transition, where overlay copy and images live, and how those images are ready before the cover. Today every navigation uses one strategy chosen at boot. Overlay fields sit on the route table as `transition: { image, copy, alt }`, and `CustomPageTransitions` also builds a `<template data-id>` per route into `#page-transition-overlay-templates`. Idle time then preloads every transition image. Two sources, one unused template host, and a wait on pictures the visitor may never navigate to.

## Decisions

- The **destination** (`navigationContext.to`) chooses the look. `from` is available to the plug-in for a one-off branch in `cover()`, but the route table has no from–to matrix.
- The site-wide default effect is the class the factory imports (ADR 0012). A route may set `pageTransition` to an effect name, or to `{ effect, ...markupFields }`. An unknown name logs and uses the default.
- A second effect is listed in `app/config/transitions.js`: effect name → literal `import()` of the plug-in class (ADR 0015). Plug-in files stay in `app/transitions/{name}/`. The service keeps one instance per name.
- Overlay fields live only on that destination object. The starter fields are `copy`, `image`, and `alt`. They are strings, not HTML. The plug-in's `markup()` decides which it uses. Custom markup is that function, not a `<template>` in the layout and not HTML in the route table. `#page-transition-overlay-templates` goes away.
- Omit `pageTransition` when the route uses the default effect and needs no copy or image.
- `prepare()` injects `markup({ to })`, then `loadImages` on any image it created (ADR 0018). Cover starts after that settles. Do not preload every route's image at idle. A hover prefetch of the destination's overlay image is allowed; it does not hold navigation.
- On a GSAP document load, the click writes `{ path, at, copy, image, alt }` to `sessionStorage`. The next document's head script paints the host covering, including that image `src` if present (ADR 0002).
- None of this is a wizard question. The wizard still picks the family (GSAP, view transition, or none) and then page swap or document load (ADR 0002). Per-route fields are data in the route table.

## Considered Options

- **A from–to matrix.** Special-case Home that way and every new route multiplies the table. The plug-in already receives `from` and `to`.
- **The origin route names the effect.** The visitor arrives at `to`. Overlay copy and image describe that page.
- **Keep `<template>` markup as well as the route table.** That is the duplication the issue named.
- **Idle-preload every transition image.** Fifteen large webps compete with the page the visitor is on. `prepare()` plus the browser cache is enough.
- **A wizard question for per-route effects.** It does not change which modules ship. The family already does.

## Consequences

- `transition: { image, copy, alt }` becomes `pageTransition`. View-transition routes omit it; names stay in CSS.
- `CustomPageTransitions` / `GenericPageTransitions` and `TRANSITION_TYPES` go. One plug-in shape remains (ADR 0012).
- [IMAGES.md](../reference/IMAGES.md) waits on the injected overlay image before **cover**, not before reveal.
- Issue #2 is answered. Close it when this ADR is accepted.
