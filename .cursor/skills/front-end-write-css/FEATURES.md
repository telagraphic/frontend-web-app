# Feature support

How to decide whether a CSS feature may land in `styles/`. Look this up on every use. Browser versions change; this file does not list them.

## Look up

Search in this order. Use the pages as they are today.

1. **MDN** for the feature. Read the Baseline badge: widely available, newly available, or limited.
2. **Can I Use** (`https://caniuse.com`) for the same feature. Match it against `package.json` `browserslist` (`defaults`, `not ie <= 11`).
3. **Bun CSS docs** (`https://bun.com/docs/bundler/css`) when the question is "does the bundler rewrite this?" Nesting, logical properties, media-query ranges, and literal `color-mix()` are rewritten. `:has()`, `@container`, `@scope`, mixins, and `@custom-media` are not.

If MDN and Can I Use disagree, treat the worse of the two as the status.

## Classify

| Status now | What to do |
| --- | --- |
| Baseline **widely available**, or Bun rewrites it | Write it in `styles/` |
| Baseline **newly available**, or Can I Use is high but not universal | Write it with an `@supports` (or cascade) fallback that still looks right |
| **Limited** or behind a flag | Put it in `experiments/{name}/`, or skip it |
| Spec-only (no shipping browser) | Skip it |

Tell the user the status in one sentence before writing: feature, Baseline label, and whether Bun rewrites it.

## Fallbacks

Put the safe rule first. The modern rule follows, inside `@supports` when the property would otherwise be dropped.

```css
.hero-title {
  color: var(--color-fg);
}

@supports (color: color-mix(in oklab, black, white)) {
  .hero-title {
    color: color-mix(in oklab, var(--color-fg) 80%, var(--color-brand));
  }
}
```

`:has()` and `@container` have no useful `@supports` substitute for selector matching. If they are newly available for the project's browserslist, use them. If they are limited, do not.

`@media (prefers-reduced-motion: reduce)`, `:focus-visible`, `.skip-link`, and `@media (hover: hover)` are axioms in STYLES.md. They are not optional features.

## Families

Use this only as a map of *where to look*, then still open MDN.

| Family | Typical home | Notes |
| --- | --- | --- |
| Nesting, logical properties, media ranges | Any file | Bun rewrites these. Full BEM names; no `&__element` |
| `@layer`, custom properties, `clamp()`, `:is()`, `:where()` | Entry and tokens | Already required |
| `:has()` | Layout-component-per-page selectors | Required for `body:has(main[data-route])` |
| `@container` | A component that must follow its own width, not the viewport | |
| `color-mix()`, `light-dark()`, `oklch()` | Tokens or a component | Literal mixes may be computed at build; `var()` mixes need support |
| `text-wrap: pretty` / `balance` | Type in `base` or a heading block | Enhancement; omit if limited |
| `@scope` | A third-party island | Prefer BEM. `@scope` is not a BEM replacement |
| Anchor positioning, scroll-driven animations, `if()`, `@function`, `@mixin` | Experiment only until Baseline widely available | Native mixins have not shipped |
| `@custom-media` | Skip | Not in browsers; Bun does not document the draft flag |
| View Transitions CSS | [PAGE_TRANSITIONS.md](../../../documentation/reference/PAGE_TRANSITIONS.md) | Not this skill |

## Record

When a limited or newly-available feature ships in `styles/`, add a one-line comment above the rule with the MDN name and that it needs a fallback. Do not write a year or a version; the next lookup replaces it.
