# Accessibility

Baseline the starter ships. Native elements first. No ARIA when a native control exists. Contrast is measured on the project's rendered palette, not a second token pass here.

Terms: [GLOSSARY.md](../../GLOSSARY.md). Markup: [TEMPLATES.md](TEMPLATES.md). CSS: [STYLES.md](STYLES.md). Focus listener: [SERVICES.md](SERVICES.md). Menu: [LAYOUT_COMPONENTS.md](LAYOUT_COMPONENTS.md), [ADR 0017](../adr/0017-menu-api-is-shared.md). Preloader: [ADR 0014](../adr/0014-preloader-runs-once-per-session.md). Images: [IMAGES.md](IMAGES.md).

Status: accepted design. Slice 1 ships the markup and CSS. Slice 5 ships preloader `inert` of chrome.

## Document

Every layout produces this shell. `assertDocument()` fails without it.

| Piece | Rule |
| --- | --- |
| `<html lang>` | Required. Starter is `en` |
| Viewport | `width=device-width, initial-scale=1`. Never `user-scalable=no` or `maximum-scale` |
| Skip link | First focusable in `<body>`: `<a class="skip-link" href="#main">Skip to content</a>` |
| `<main id="main" data-route tabindex="-1">` | One landmark. `id` and `tabindex` stay on the live node; RouterSwap copies only `data-*` |
| Title | Matches the page. Copied on page swap (ADR 0021) |
| Overlay host | GSAP path only: `<div data-transition-host hidden aria-hidden="true">`. Not a landmark, never focusable |

Site links are `<a href>`. The menu toggle is a `<button>`. Do not rebuild either as a `div` with a click handler. Site navigation is `<nav>` plus a list of links, never `role="menu"`.

## Focus and keyboard

- Base CSS styles `:focus-visible` with `outline-offset: 2px` and leaves the browser ring. A custom color needs a `--focus-ring` token, a check against every adjacent surface, and system colors under `forced-colors`. Never `outline: none` without that replacement.
- The skip link is visually hidden until `:focus`.
- `main` has `tabindex="-1"` so the focus layout listener can move keyboard focus after a **page swap**. Document load and first boot leave focus to the browser (ADR 0006).
- `main` and in-page headings get `scroll-margin-block-start` so a skip or hash is not hidden under a sticky header.
- Only `tabindex="0"` (join the tab order) and `tabindex="-1"` (programmatic). No positive values.
- Menu: Escape closes, focus moves to the first link on open and returns to the toggle on close, `aria-expanded` tracks state, `aria-current="page"` is in the built HTML (ADR 0017).
- While the preloader is up, menu, footer, skip link, transition host, and `<main>` are `inert`. The preloader is the only tab stop (ADR 0014).

## Motion, zoom, hit area

- CSS motion is opt-in: wrap transitions in `@media (prefers-reduced-motion: no-preference)`, plus the global reduce floor in `base/base.css` (ADR 0023). GSAP uses duration `0`. Lenis turns smoothing off (ADR 0016).
- Interactive `:hover` lives inside `@media (hover: hover)`.
- The page reflows at 320px and at 200% zoom. Breakpoints are rem. Do not cap zoom.
- Icon-only controls, including the menu toggle, are at least `2.75rem` (44px at a 16px root) in both axes, or a 44px hit pseudo that does not overlap another control. The panel uses `overscroll-behavior: contain` and `data-lenis-prevent`.

## Names and images

- Visible text is the accessible name. Icon-only controls get `aria-label`; the icon is `aria-hidden="true"`.
- Decorative images: `alt=""`. Informative images describe the meaning. Functional images describe the action. Overlay images take `alt` from the destination route (ADR 0024).
- `.sr-only` is the only utilities class. Use it for text that must be announced and must not be seen. Never `display: none` for that job.

## Not in the starter

| Need | When it appears |
| --- | --- |
| Form labels, `autocomplete`, validate on submit, `aria-invalid` | First real form. Not a service |
| `role="status"` / `role="alert"` | First toast or untied error. Page swap already announces by moving focus and updating `<title>` |
| `role="dialog"` | First modal that is not the menu. Prefer `<dialog showModal()>` |
| Color contrast tokens | The project's palette, measured on the rendered pair |

Do not add an accessibility service, a live-region layout listener, or `role="menu"` on the site nav.
