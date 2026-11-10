# Performance

Checks for markup, CSS, JavaScript, and network. An agent running [check-performance](../../.cursor/skills/front-end-check-performance/SKILL.md) works this list. Terms: [GLOSSARY.md](../../GLOSSARY.md). Images: [IMAGES.md](IMAGES.md). Styles: [STYLES.md](STYLES.md). Animations: [ANIMATIONS.md](ANIMATIONS.md).

The target is a first document that paints the cover correctly, then a site that does not download the next route's page class or overlay image until they are needed.

## Markup

- One hero may have `fetchpriority="high"`. It has `data-preload`, a real `src`, `width`, and `height`.
- Below-the-fold images have `loading="lazy"` and `decoding="async"`. They do not have `data-preload`.
- Do not mark every image `data-preload`. That holds the preloader and the page-swap reveal.
- Overlay images are injected in `prepare()`, then `loadImages`. Do not idle-preload every route's `pageTransition.image`.
- `app/head.js` is a blocking external script **before** the CSS. No inline script (CSP).
- Fonts: `preconnect` only for the actual font host. `font-display` is not `block` without a plan.
- One `<main id="main" data-route tabindex="-1">`. Skip link is the first focusable. Links are root-relative.

## Styles

- One bundle from `styles/styles.css`. No extra blocking stylesheets in the layout.
- Do not animate a property GSAP already tweens.
- `will-change` is not a rest style.
- No utility-class dump. Page CSS is `styles/pages/{route}.css` imported on `layer(pages)`.
- `content-visibility` is a candidate ([CANDIDATES.md](CANDIDATES.md)). Measure; it can break ScrollTrigger.
- Reduced-motion floor stays in base CSS.

## JavaScript

- Page classes load through the page index (`import()`). Do not import every page up front.
- GSAP only through `app/animations/gsap/gsap.js`. Layout components and pages do not import `"gsap"`.
- `destroy` reverts the animation scope and aborts the signal. After a swap, leftover ScrollTriggers are a leak.
- Smooth scroll is one instance from the factory. `stop` it while the menu or preloader owns the screen.
- A page class receives only page services. Do not ship the factory into a page chunk.

## Network

- Production: `Bun.build` minify + hashed names. The host gzips/brotli. HTML is not minified by us.
- Dev: no minify, linked source maps, CSS swap without reload.
- Page swap: prefetch HTML on hover/focus into the router cache, not every route at idle. Cover waits on that load.
- GSAP document load: HTTP-prefetch during cover. Do not share the page-swap cache.
- View-transition document load: Speculation Rules prefetch. Prerender waits ([CANDIDATES.md](CANDIDATES.md)).
- `head.js` stays flags → `html` class. No sessionStorage key for “next URL.”
- `modulepreload` the app entry in the layout when the hashed name is known (production `assets.js`).
- A created site does not include unused renderer packages or `@clack/prompts` (ADR 0002).
- Images go through `bun run process:image` before `public/`. Prefer WebP (AVIF is a candidate).

## How to check

1. Walk the page like a visitor: first load, then one internal navigation, then back.
2. Network: first document, CSS, `head.js`, `App.js`, the current page chunk, hero image. Flag extra page chunks, every overlay image, or a font that is not used.
3. After a page swap, confirm ScrollTriggers belong only to the current page and layout components.
4. Lighthouse / DevTools are evidence, not the spec. Fix against this list.

The work is done when the first visit downloads one page class, the cover waits only on `[data-preload]`, and a navigation does not start a second Lenis or a second GSAP bundle.
