# Future enhancements

Browser and CSS features this starter may adopt when support is Baseline widely available, or when a project proves the need. **None of these are scheduled.** Shipping one needs its own ADR. CSS still goes through [write-css](../../.cursor/skills/write-css/SKILL.md).

Terms: [GLOSSARY.md](../../GLOSSARY.md). Building blocks: [OVERVIEW.md](OVERVIEW.md).

## Already locked

View Transitions (both modes), Speculation Rules **prefetch**, `AbortController`, cascade layers, `:has()`, `data-preload` / `fetchpriority`, reduced motion, custom elements as a seam, GSAP as the only motion library, Bun as bundler. No Sass, no utility-class library, no runtime settings file.

## Watch

Adopt when support is there and an ADR says yes.

| Candidate | Why it fits | Tension |
| --- | --- | --- |
| Navigation API | Could replace click intercept + `pushState` on page swap | Partial support; must not reopen ADR 0001 lightly |
| View Transition types | Named types on `startViewTransition` / CSS | View-transition path only |
| Speculation Rules **prerender** | Next step after prefetch on document load | Chromium-heavy; memory |
| Popover + invoker commands | Top-layer UI without extra JS | Must keep `Navigation` `open` / `close` |
| Anchor positioning | Tooltips, menu attachment | Experiment until widely available |
| Scroll-driven animations | Simple scroll fades in CSS | GSAP still owns sequenced scroll motion |
| `@starting-style` | CSS entry for dialogs / popover | Not a GSAP replacement |
| `light-dark()` / `oklch` tokens | Token layer | Fallbacks; `write-css` already allows this |
| `text-wrap: pretty` / `balance` | Headings | Enhancement only |
| `content-visibility` | Long documents | Can break ScrollTrigger; measure first |
| AVIF (or JPEG XL) in `process-image` | Authoring pipeline | `srcset` and the host, not a runtime service |
| GSAP Flip | Shared-element-like motion on the GSAP path | Do not mix with `view-transition-name` on the same node |

## Park

Hydration runtime (`client:*`, client JSX, server islands), signals, a second animation library, WebGPU/WebGL as default, PWA/service worker by default, CSS Modules, native `@mixin` until it ships.

A page component is the shape already in the starter: HTML in the view, class loaded by the page class ([PAGE_COMPONENTS.md](PAGE_COMPONENTS.md)). That is not a hydration runtime.

## Never

An SPA framework, Barba, Sass, a utility-class library, a runtime settings file.

## Not a new service

`createServices()` stays the composition root for the core: router, transitions, animations, smooth scroll (ADR 0006). The route table is config the factory constructs and the router holds. Navigation is a layout component (ADR 0007). These look like “features” and are **not** factory services:

| Need | Where it lives |
| --- | --- |
| Focus after a page swap | Layout listener attached by `createLayout`. ADR 0006. |
| Theme (`data-background`, `data-color`) | Copied onto `<main>` by page swap. CSS owns the paint. Not `BackgroundColors` in the router |
| 404 | Locked: route key `not-found`, path `/404` (ADR 0025). Not a service |
| `modulepreload` / `preconnect` | Layout `<head>`, [PERFORMANCE.md](PERFORMANCE.md) |
| Analytics, accounts, search, payments | [add-integration](../../.cursor/skills/add-integration/SKILL.md) when the first one lands |

Do not add an analytics service, a breakpoint service, or a font service. Fonts already ride `document.fonts.ready` on the preloader. Breakpoints stay in CSS.
