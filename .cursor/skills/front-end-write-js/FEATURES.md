# Feature support

How to decide whether a JS syntax feature may land in `app/` or `server/`. Look this up on every use. Browser versions change; this file does not list them.

The required vs reach-for vs skip lists live in [JS.md](../../../documentation/reference/JS.md). This file is the lookup procedure, matching [write-css FEATURES.md](../front-end-write-css/FEATURES.md).

## Look up

Search in this order. Use the pages as they are today.

1. **MDN** for the feature. Read the Baseline badge: widely available, newly available, or limited.
2. **Can I Use** when the feature is a Web API (`AbortSignal`, `structuredClone`, View Transitions). Match `package.json` `browserslist` (`defaults`, `not ie <= 11`).
3. **Node / Bun docs** only for `server/` APIs (`Bun.build`, `Bun.file`). Browser code must not import those.

If MDN and Can I Use disagree, treat the worse of the two as the status.

## Classify

| Status now | What to do |
| --- | --- |
| Baseline **widely available** | Write it in `app/` or `server/` |
| Baseline **newly available** | Use it only with a fallback that still runs (feature detect, or the older syntax) |
| **Limited** or behind a flag | `experiments/{name}/` only, or skip |
| Spec-only (no shipping browser) | Skip |

Tell the user the status in one sentence before writing: feature, Baseline label, and whether this file already requires it.

## Fallbacks

Keep the widely available path first. Branch on the feature, do not polyfill a library for syntax.

```js
const signal = AbortSignal.any
  ? AbortSignal.any([this.signal, userSignal])
  : this.signal;
```

If the fallback is as large as the feature, skip the feature.

## Record

When a newly available feature ships in `app/`, add a one-line comment with the MDN name and that it needs a fallback. Do not write a year or a version; the next lookup replaces it.
