---
name: front-end-check-performance
description: >-
  Audits markup, CSS, JavaScript, and network loading against this
  starter's performance rules. Use when the user asks to optimize,
  speed up, audit performance, check Lighthouse, reduce jank, or
  fix a slow load or navigation.
---

# Check performance

Read [PERFORMANCE.md](../../../documentation/reference/PERFORMANCE.md) and work every section: markup, styles, JavaScript, network. Terms: [GLOSSARY.md](../../../GLOSSARY.md). Images: [IMAGES.md](../../../documentation/reference/IMAGES.md).

## Do

1. First document, then one internal navigation, then back. Note what the Network panel downloads on each.
2. Apply the checks in PERFORMANCE.md. Quote the failing file and the rule.
3. Fix only what this pass flags. Image strategy stays [IMAGES.md](../../../documentation/reference/IMAGES.md). CSS features still go through [write-css](../front-end-write-css/SKILL.md).
4. Re-walk the same path. Confirm one page chunk on first load, `[data-preload]` only above the fold, and no second Lenis or GSAP copy after a swap.

The work is done when PERFORMANCE.md's closing line is true and the flagged rows are gone.

## Do not

- Idle-preload every route or every overlay image.
- Import every page class from `App.js`.
- Add a performance service, a font service, or a breakpoint service.
- Treat Lighthouse scores as the spec. Use them as evidence for a rule on that page.
- Adopt a watch-list feature ([CANDIDATES.md](../../../documentation/reference/CANDIDATES.md)) as the fix. That needs its own ADR.
