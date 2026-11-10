# Styles

How CSS is authored, layered, bundled, and targeted. The decisions are [ADR 0023](../adr/0023-css-is-layered-files-bundled-by-bun.md). Page selectors follow [ADR 0021](../adr/0021-page-swap-replaces-the-children-of-main.md) and [PAGE_SWAP.md](PAGE_SWAP.md). Motion that is not layout lives in [ANIMATIONS.md](ANIMATIONS.md). Adding a file or a modern feature: [write-css](../../.cursor/skills/front-end-write-css/SKILL.md). Terms are in [GLOSSARY.md](../../GLOSSARY.md).

Status: Home and not-found are the only pages. Navigation, preloader, footer, and page are starter chrome. A project replaces tokens and those files.

## Files

```
styles/
  styles.css                  layer order and @import list
  reset/normalize.css         modern-normalize; upgrade in place, do not restyle
  tokens/tokens.css           :root custom properties only
  base/base.css               axioms: measure, focus, skip link, reduced motion, hover, scroll-margin
  base/typography.css         element type. The starter uses system fonts; a project adds @font-face here
  components/*.css            layout components, shared blocks, published experiments
  pages/*.css                 one file per route that needs its own rules
  utilities/sr-only.css       the utilities layer
```

There is no compiled Sass output. `styles/styles.css` is the entry Bun bundles. Dev rebuilds it and swaps the stylesheet (ADR 0020). Experiments live in `experiments/{name}/styles.css` as the same language.

A project keeps reset, layer order, and base axioms. It replaces tokens, component artwork, and page files.

## Layers

`styles.css` is the bundle entry. The `@layer` line names the order. Each `@import` assigns that file to one layer. A rule in a later layer beats the same selector in an earlier layer.

```css
/* styles/styles.css */
@layer reset, tokens, base, components, utilities, pages, overrides;

@import "./reset/normalize.css" layer(reset);
@import "./tokens/tokens.css" layer(tokens);
@import "./base/base.css" layer(base);
@import "./base/typography.css" layer(base);
@import "./components/navigation.css" layer(components);
@import "./components/menu.css" layer(components);
@import "./pages/home.css" layer(pages);
@import "./pages/not-found.css" layer(pages);
@import "./utilities/sr-only.css" layer(utilities);
```

Later layers win. Unlayered CSS wins over every layer; do not emit it. Importing with `layer(components)` puts that file in `components`. Do not also wrap the file in `@layer components { }`, or the rules land in a nested layer.

| Layer | Holds |
| --- | --- |
| `reset` | modern-normalize |
| `tokens` | `:root` custom properties |
| `base` | Element defaults and axioms |
| `components` | `.navigation`, `.preloader`, `.footer`, shared blocks, published experiments, a GSAP transition's CSS |
| `utilities` | `.sr-only` only |
| `pages` | Rules under `main[data-route="…"]` |
| `overrides` | Empty in the starter. A project uses it to beat third-party CSS |

Add a new component by creating `styles/components/{name}.css` and adding one `@import` line to `styles/styles.css`.

## Tokens

Custom properties on `:root` are the only shared values. Name them for what they are, then alias the roles a project restyles.

```css
:root {
  --color-white: #fff;
  --color-black: #111;
  --color-brand: #111;

  --color-bg: var(--color-white);
  --color-fg: var(--color-black);

  --font-family-sans: system-ui, sans-serif;

  --font-size--2: clamp(0.7813rem, 0.6406rem + 0.6249vw, 1.3827rem);
  --font-size--1: clamp(0.9375rem, 0.793rem + 0.6421vw, 1.5556rem);
  --font-size-0: clamp(1.125rem, 0.9789rem + 0.6494vw, 1.75rem);
  --font-size-1: clamp(1.35rem, 1.2054rem + 0.6429vw, 1.9688rem);
  --font-size-2: clamp(1.62rem, 1.4809rem + 0.618vw, 2.2148rem);
  --font-size-3: clamp(1.944rem, 1.816rem + 0.569vw, 2.4917rem);
  --font-size-4: clamp(2.3328rem, 2.2228rem + 0.4887vw, 2.8032rem);
  --font-size-5: clamp(2.7994rem, 2.7166rem + 0.368vw, 3.1536rem);

  --font-weight-regular: 400;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  --line-height-tight: 1.2;
  --line-height-body: 1.5;

  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;

  --measure: 65ch;
  --border-width: 1px;
  --radius: 0.25em;

  --z-base: 0;
  --z-sticky: 100;
  --z-menu: 200;
  --z-preloader: 300;
  --z-transition: 400;
}
```

The tokens file is imported with `layer(tokens)`, so do not wrap this `:root` block in another `@layer`.

| Kind | Examples | Who edits them |
| --- | --- | --- |
| Primitive | `--color-white`, `--space-4`, `--font-size-2` | Rarely |
| Semantic | `--color-bg`, `--color-fg`, `--color-brand` | Each project |
| Stacking | `--z-menu`, `--z-preloader`, `--z-transition` | When a new overlay is added |

Rules:

- One type scale: `--font-size-*`. Do not also keep `--step-*`.
- Spacing is rem. Do not comment the pixel equivalent.
- Do not store breakpoints as custom properties. They cannot be read in `@media`.
- Do not store `vh` spacing as tokens. Write `min-block-size: 100dvh` or a `clamp()` at the point of use.
- A component may set a local custom property for JS to override, such as `--toggle-bar-color` on `.navigation__toggle`.
- Colors live here, not in JavaScript. Page theme is `data-background` and `data-color` on `<main>` (ADR 0021).

## Breakpoints

Write the rem query. These names match the old Sass map: `xs` 37.5rem, `sm` 50rem, `md` 56.25rem, `lg` 75rem, `xl` 93.75rem (600, 800, 900, 1200, 1500 CSS pixels at a 16px root).

```css
.navigation__header {
  padding: var(--space-4);
}

@media (width >= 50rem) {
  .navigation__header {
    padding: var(--space-6);
  }
}

@media (hover: hover) {
  .navigation__link:hover {
    color: var(--color-brand);
  }
}
```

Viewport queries are for:

- `(hover: hover)` and `(hover: none)`
- `(prefers-reduced-motion: reduce)`
- `print`
- A page-level cover that cannot use `min-block-size: 100dvh`

Component layout uses `flex-wrap`, `minmax`, or `@container`. Do not switch `flex-direction` or grid column counts at a width query when the content can wrap on its own.

Native `@custom-media` and CSS `@mixin` have not shipped. Do not use them.

## Naming

| Thing | Form | Example |
| --- | --- | --- |
| Block | `.block` | `.footer`, `.navigation`, `.preloader` |
| Page block | the route key | `.home`, `.about`, `.not-found` |
| Element | `.block__element` | `.footer__text`, `.about__title` |
| View-transition name | `{part}-{route key}`, or `chrome-{role}` for chrome outside `<main>` | `title-about`, `chrome-nav` |
| Modifier | `.block--modifier` or `.block__element--modifier` | `.footer__text--highlight` |
| JS state | `data-*` on the block | `[data-navigation-status="active"]` |
| Document flag | class on `html` | `html.is-loading`, `html.is-animating` |

Write the full BEM class. Native nesting does not concatenate `&__header` into `.navigation__header`; that rule is invalid.

Nest only states and at-rules:

```css
.navigation {
  position: fixed;
  inset: 0;
}

.navigation__toggle {
  cursor: pointer;
  min-inline-size: 2.75rem;
  min-block-size: 2.75rem;
}

@media (hover: hover) {
  .navigation__toggle:hover {
    color: var(--color-brand);
  }
}

@media (width >= 50rem) {
  .navigation__toggle {
    inline-size: 3em;
  }
}
```

Do not add global `.is-visible`, `.is-hidden`, `.flex`, or `.mx-4`. Hide a pre-animation state under `html.is-animating`, not with an inline style.

## Selectors

| You want to style | Selector | Layer |
| --- | --- | --- |
| A layout component everywhere | `.footer` | `components` |
| A layout component on one page | `body:has(main[data-route="home"]) .footer` | `components` |
| A layout component on a group of pages | `body:has(main[data-route^="section-"]) .footer` | `components` |
| A page's own content | `main[data-route="about"]` | `pages` |
| Flow text | `p`, `li`, `blockquote` in `base`, or nested inside an article block | `base` or `components` |

Do not use `body[data-page]`. The router will not write it.

Keep nesting to three levels. `.navigation .navigation__header` raises specificity and is not BEM; write `.navigation__header` at the root of the file.

## Units and layout

| Property | Unit |
| --- | --- |
| Type size, margin, padding, gap, flex-basis | `rem`, `em`, or a token |
| Measure (line length) | `ch`, via `--measure` |
| Border width, shadow blur | `px` |
| Viewport covers | `min-block-size: 100dvh` (with a `100vh` fallback if needed) |
| Fluid type | the `--font-size-*` clamps; do not write a raw `vw` font-size |

Use logical properties (`margin-block`, `padding-inline`, `inset-block-start`, `border-inline-end`) unless the value is a transform GSAP owns or a clip-path tied to physical edges.

Let height come from content. Prefer `min-block-size` and `max-inline-size` over `width` and `height`. `overflow: hidden` is not a substitute for a missing constraint.

Write layout in the component that owns it. On the second copy, extract a named class:

```css
.stack {
  display: flex;
  flex-direction: column;
}

.stack > * + * {
  margin-block-start: var(--space, var(--space-6));
}

.cluster {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space, var(--space-4));
}

.center {
  max-inline-size: var(--measure);
  margin-inline: auto;
}

.frame {
  aspect-ratio: var(--frame-ratio, 16 / 9);
  overflow: hidden;
}

.frame > img,
.frame > video {
  block-size: 100%;
  inline-size: 100%;
  object-fit: cover;
}
```

Do not add these until a second caller needs them.

## Axioms

These rules live in `base` and apply on every page: the document font, body color, heading rhythm, a measure on flow text, the focus ring, the skip link, scroll-margin on `main`, and a reduced-motion floor that shortens CSS animation and transitions.

```css
html {
  font-family: var(--font-family-sans);
  font-size: 100%;
  line-height: var(--line-height-body);
}

body {
  background-color: var(--color-bg);
  color: var(--color-fg);
  margin: 0;
}

h1,
h2,
h3,
h4,
h5,
h6 {
  font-family: var(--font-family-sans);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
  margin: 0;
}

p,
li,
figcaption,
blockquote {
  max-inline-size: var(--measure);
}

:focus-visible {
  outline-offset: 2px;
}

.skip-link {
  position: absolute;
  inset-inline-start: -999px;
  z-index: var(--z-preloader);
}

.skip-link:focus {
  inset-inline-start: var(--space-4);
  inset-block-start: var(--space-4);
}

main {
  scroll-margin-block-start: 5rem;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

A full-bleed hero or menu overlay sets `max-inline-size: none` on itself. `!important` is allowed in two places: the reduced-motion floor above, and `scroll-behavior: auto !important` on `.lenis-smooth`.

The reduced-motion rule is the CSS floor. Sequenced motion still goes through the animation scope's `reducedMotion` branch (ADR 0009). Prefer the browser `:focus-visible` ring; add only `outline-offset`. A custom `--focus-ring` must be checked against every adjacent surface and keep system colors under `forced-colors`. Skip-link, focus, hover, and scroll-margin axioms: [ACCESSIBILITY.md](ACCESSIBILITY.md).

## CSS and GSAP

| Job | Owner |
| --- | --- |
| Layout, color, type, rest position, simple hover color | CSS |
| Sequenced entrance, leave, cover, scroll-linked motion | GSAP inside an animation scope |

Do not put a CSS `transition` on a property GSAP tweens. Do not set `will-change` as a rest style; GSAP sets it while it animates.

A title that GSAP will fade in starts visible in CSS, so it is readable when neither class is on `html`. `styles/base/base.css` sets `visibility: hidden` on `[data-animation]` while `html` has `is-loading` or `is-animating`. The head script adds `is-loading` before first paint when the preloader will play, and the preloader removes it when the cover lifts. The example below is that same hide, written on one title instead of every `[data-animation]`. There is no inline style to clean up.

```css
.hero-title {
  opacity: 1;
}

html.is-animating .hero-title {
  opacity: 0;
}
```

## Bundle, format, minify, compress

| Job | Who |
| --- | --- |
| Bundle `@import` into one file, assign layers, transpile nesting and color, vendor-prefix | `Bun.build` on `styles/styles.css` |
| Format source CSS | Prettier (`bun run format`). `bun fmt` prints the same CSS and reads `.prettierrc` |
| Minify | `Bun.build({ minify: true })` in production only |
| Compress (gzip / brotli) | The host. The build does not gzip |
| Lint | Stylelint with `stylelint-config-standard` |

Dev bundles without minify and with linked source maps, then live reload sends `css`. Production hashes the file as `styles-[hash].css`.

Do not edit the bundled file. Do not run Sass, PostCSS, Autoprefixer, or cssnano.

## Experiments

`experiments/{name}/styles.css` is the same CSS as production. It may use `var(--…)` from the token file. Dev serves it unbundled, so a save swaps without waiting on `styles/styles.css`.

On publish ([PUBLISH.md](../../.cursor/skills/front-end-gsap-experiment/PUBLISH.md)):

1. Copy to `styles/components/{kebab-name}.css`.
2. Replace raw colors and sizes with tokens.
3. Write full BEM class names.
4. Replace raw pixel width queries with rem queries.
5. Add `@import "./components/{kebab-name}.css" layer(components);` to `styles/styles.css`.
