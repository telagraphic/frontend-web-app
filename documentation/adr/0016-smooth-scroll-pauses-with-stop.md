---
status: accepted
---

# Smooth scroll pauses with stop, and one preset names the feel

Lenis is the smooth-scroll service. The class today builds a settings object and never passes it, pins the body in `lock()`, and reads `window.innerWidth < 768` once to pick a mobile feel. `unlock()` never puts the saved position back, so the page jumps. The menu already pauses with `stop()` and `start()`, which keep the position. The feel itself lives in `app/config/scrollPresets.js` (ADR 0015).

## Decisions

- The service never imports GSAP. `autoRaf` is false. It runs its own frame loop until `AnimationsService` calls `useTicker(gsap.ticker)`. `addEventListener("scroll", ScrollTrigger.update)` is the same connection (ADR 0009). `destroy()` disconnects both.
- `respectReducedMotion` stays at the Lenis default. The instance keeps running, smoothing turns off, and `scrollTo` jumps. The preference updates live.
- Pausing scroll is `stop()` and `start()`. There is no `lock()` or `unlock()`. The router calls `stop()` after it has read the position with `getScroll()`, then `scrollTo()` once the next page is shown, then `start()`. A link opens at the top. Back and forward restore the saved position (ADR 0001). The menu uses `stop()` while it is open and `start()` when it closes. Pages do not scroll on their own.
- `anchors: true`. In-page `#hash` links are Lenis's `scrollTo`. The router still does not handle them (ADR 0001).
- Elements that scroll inside the page carry `data-lenis-prevent`. That is `.navigation__overlay` and `.manifest__table-wrapper`. `allowNestedScroll` stays off.
- `init()` creates Lenis stopped when the preloader will play. Boot calls `start()` only after the preloader has hidden (ADR 0014). When the preloader is skipped, `start()` runs at the end of `init()`.
- The `768` check goes away. Scroll feel does not change with width. Breakpoint widths stay in the CSS tokens `--bp-*`. `Constants.js` does not copy them.
- Smooth scroll is not a wizard question. It is constructed for both page swap and document load. A project that does not want it leaves it out of `createServices()`, and `AnimationsService` skips the ticker connection.

## Considered Options

- **Skipping Lenis entirely under reduced motion.** ScrollTrigger and `scrollTo` would need a second, native implementation, and toggling the OS setting mid-session would have to rebuild it. Lenis already forces 1:1 tracking and keeps the scroll events.
- **`lock()` with `position: fixed` on the body.** It fights the history position. `stop()` pauses Lenis and sets `overflow: hidden`.
- **Letting the browser jump to hash targets.** A native jump leaves Lenis on the old position.
- **`allowNestedScroll`.** Lenis would walk the document on every scroll event. The two regions that scroll on their own are known.
- **A `BREAKPOINTS` map in `Constants.js`.** The site's widths already live in the CSS tokens. A third copy would drift.
