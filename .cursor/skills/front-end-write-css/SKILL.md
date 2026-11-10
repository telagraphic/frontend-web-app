---
name: front-end-write-css
description: >-
  Writes a component or page stylesheet in this starter's CSS, and adopts a
  modern CSS feature only after checking current Can I Use and Baseline support.
  Use when adding a CSS file, styling a component or page, or when the user
  asks to use nesting, :has(), container queries, color-mix, @scope, anchor
  positioning, or another CSS feature. Do not use for GSAP motion or Sass.
---

# Write CSS

Read [STYLES.md](../../../documentation/reference/STYLES.md) first. Terms are in [GLOSSARY.md](../../../GLOSSARY.md). Layers, BEM, tokens, and Bun bundling are already decided (ADR 0023). This skill is how to add a file or a feature on top of that.

## Do

1. Pick the file. A layout component or shared block is `styles/components/{kebab-name}.css`. A route's own rules are `styles/pages/{route key}.css`. Tokens go in `styles/tokens/tokens.css`. An unproven feature goes in `experiments/{name}/styles.css`.
2. If the file is new, add one `@import "./{folder}/{name}.css" layer({layer});` to `styles/styles.css`. Do not wrap the file in `@layer`.
3. If the CSS uses a feature that STYLES.md does not already require, look up support **now**. Do not use a remembered year or a stale table. Follow [FEATURES.md](FEATURES.md).
4. Write full BEM class names (`.block__element`, not `&__element`). Nest only `&:hover`, attributes, and at-rules. Put interactive `:hover` inside `@media (hover: hover)`. Use tokens for color, space, and type. Width queries are rem, such as `@media (width >= 50rem)`. Do not set `outline: none` without a verified `:focus-visible` replacement. Hit areas for icon-only controls are at least `2.75rem`. Accessibility: [ACCESSIBILITY.md](../../../documentation/reference/ACCESSIBILITY.md).
5. Page-specific layout-component rules use `body:has(main[data-route="…"])`. Page content rules use `main[data-route="…"]`.

The work is done when the new rules live in the right file and layer, class names match the markup, tokens replace raw values, and any non-Baseline feature has a fallback or an experiment note.

## Do not

- Author `.scss` or add Sass, PostCSS, Autoprefixer, or cssnano.
- Ship a feature whose MDN/Can I Use status is experimental without an `@supports` fallback or an experiment.
- Animate a property GSAP already tweens. CSS owns layout and rest states ([ANIMATIONS.md](../../../documentation/reference/ANIMATIONS.md)).
- Add utility classes. Extract a named layout class on the second use.
- Use this skill for a menu, preloader, or GSAP transition. Those have their own skills. A new route's view, class, and stylesheet come from [add-page](../front-end-add-page/SKILL.md); this skill writes the CSS.
