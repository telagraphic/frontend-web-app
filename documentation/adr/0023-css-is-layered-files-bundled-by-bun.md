---
status: accepted
---

# CSS is layered files bundled by Bun, not Sass

The styles already use `@layer`, custom properties, and BEM. They also ship a Tailwind-style utility file that no view uses, two copies of the type scale, `body[data-page]` selectors the router will stop writing (ADR 0021), and no global focus or reduced-motion rules. Sass was kept only for files, `@use`, and breakpoint mixins. Native nesting, `@import … layer()`, and Bun's CSS bundler (a LightningCSS port) cover those jobs. Native `@mixin` / `@apply` have shipped in no browser. Sass `&__element` concatenation is not valid in CSS nesting.

## Decisions

- Author production CSS as `.css` files. The entry is `styles/styles.css`. Experiments stay plain CSS (ADR 0020). There is no Sass compile step. `sass`, `postcss`, `autoprefixer`, and `cssnano` leave the planned pipeline.
- Cascade layers, in this order: `reset, tokens, base, components, utilities, pages, overrides`. The entry file declares that order and imports each file with `layer(…)`. A component or page file does not wrap itself in `@layer`.
- Values a page should share are custom properties on `:root` in the tokens layer. Do not `@extend`.
- There is no utility-class library. Layout is written in the component or page file. If the same layout appears twice, extract a named class into `styles/components/layout.css`. `.sr-only` is the only class in the utilities layer.
- Blocks use BEM with the full class name written out: `.navigation__header`, not `&__header`. Nest only pseudo-classes, attributes, and at-rules (`&:hover`, `@media`).
- Page content is selected with `main[data-route="home"]`. A layout component that changes per page uses `body:has(main[data-route="home"]) .footer` (ADR 0021). The starter ships `styles/pages/home.css`. Extra page files come from [PAGE.md](../reference/PAGE.md).
- Breakpoints are rem queries written at the call site, such as `@media (width >= 50rem)`. Custom properties are not valid in `@media`. Native `@custom-media` has shipped in no browser. Viewport queries are for hover capability, reduced motion, print, and page-level covers. Component layout uses container queries or intrinsic wrapping.
- CSS owns layout, color, type, rest states, and simple hover color. GSAP owns sequenced motion. Do not animate the same property in both. `will-change` is not a rest style.
- Base axioms: `border-box` (already in the reset), a global line-height, `--measure` on flow text, `:focus-visible` (browser ring plus `outline-offset`; no `outline: none`), `.skip-link`, `scroll-margin-block-start` on `main`, interactive `:hover` inside `@media (hover: hover)`, and `prefers-reduced-motion` as a CSS floor. GSAP still uses `matchMedia` inside the animation scope (ADR 0009). Details: [ACCESSIBILITY.md](../reference/ACCESSIBILITY.md).
- A project replaces tokens, component artwork, and page files. Reset, layer order, and base axioms stay.
- **Format** source CSS with Prettier (`bun run format`). `bun fmt` prints the same CSS and reads `.prettierrc`. Bun.build does not format.
- **Minify** with Bun.build `minify: true` in production only. Dev bundles without minify and with linked source maps.
- **Compress** (gzip / brotli) is the host, not the build. Same as HTML (ADR 0020).
- The rules and examples are in [STYLES.md](../reference/STYLES.md).

## Considered Options

- **Keep Sass for `&__element` and breakpoint mixins.** That is a second language, a convert-on-publish step for experiments, and a Sass pass in front of the Bun CSS bundle the pipeline already runs. Full BEM names and rem queries replace both.
- **Keep and grow `_utilities.scss`.** Views never used those classes. Utility soup is hard to target from GSAP and from the element map.
- **Ship Stack, Cluster, Center, and Grid as a primitive library.** Extract on the second use.
- **Native `@mixin` / `@apply`, or `@custom-media` in the browser.** Neither has shipped. Do not wait.
- **CSS Modules.** Hashed class names fight BEM, GSAP, and `static elements`.
- **LightningCSS as a separate package.** Bun's bundler is that engine. Call it directly only if a later spike needs `drafts.customMedia` and Bun will not expand it.
- **Mirror the route key onto `<body>` for CSS.** Rejected in ADR 0021.

## Consequences

- ADR 0020's Sass compile step goes. Dev watches `styles/**/*.css`, runs `Bun.build` on the entry, and sends `css`. Production hashes and minifies that bundle.
- `_utilities.scss` is deleted on rewrite, except `.sr-only`. Mixins go.
- `navigation.css` and `footer.css` move from `[data-page]` to `body:has(main[data-route])`.
- `--font-size-*` is the type scale. `--step-*` is removed.
- Experiment publish copies `styles.css` to `styles/components/{kebab-name}.css` and adds one `@import` line. No Sass conversion.
- `documentation/reference/CSS_CUSTOM_PROPERTIES.md`, `CSS_MODERN_SYNTAX.md`, `CSS_UTILITY_CLASSES_REVIEW.md`, `CSS_UTILITY_MIXIN_STRATEGY.md`, and `documentation/checklist/CSS_CHECKLIST.md` stay superseded by STYLES.md.
