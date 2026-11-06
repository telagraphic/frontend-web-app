---
status: accepted
---

# Page transitions are visual plug-ins; the router still sequences navigation

Generic and Custom were the same GSAP fade plus extra image templates. GSAP transitions and view transitions do not share a visual lifecycle, and the two view-transition modes do not share code. A GSAP transition injects markup into a host and plays cover and reveal. A page-swap view transition calls `document.startViewTransition` around the DOM commit. A document-load view transition is `@view-transition { navigation: auto }` and does not use `TransitionsService`. We will not force view transitions through cover and reveal.

## Decisions

- The layout has an empty host, `.page-transition-overlay`, only on the GSAP-transition path. Plug-ins inject HTML in `prepare()` via `markup(navigationContext)`.
- On GSAP transitions, and on page-swap view transitions, `TransitionsService.run({ hideCurrent, loadNext, commit }, navigationContext)` is the sequencer. GSAP plug-ins implement `prepare` / `cover` / `reveal`. The page-swap view-transition plug-in implements `wrapCommit` only, calling `document.startViewTransition`. Plug-ins do not fetch or destroy pages.
- A document-load view transition does not include `TransitionsService`. The browser navigates. CSS opts in. Shared-element names are set in CSS, not by the router.
- Events `transitionstart`, `transitioncovered`, and `transitionend` are dispatched on the service when it exists, and never awaited. The document-load view-transition path has no service, so it has no these events.
- Route field `pageTransition` is either an effect name or `{ effect, ...markupFields }`. It replaces `transition: { image, copy, alt }`. The site-wide default effect is the factory import, not a field on every route. The destination route owns the effect and the overlay fields (ADR 0024).
- Do not name the paths SPA or MPA. They are page swap and document load.

## Considered Options

- **Every strategy implements `run()`.** Each visual copy would have to call `commit` itself. That is the bug we are leaving: motion mixed into navigation.
- **`CustomTransition.start()` with no steps.** The plug-in would have to own fetch and swap.
- **One class shape for overlay and view transition.** View transition has no host and must wrap `commit`. Forcing `cover` / `reveal` on it is fiction.
