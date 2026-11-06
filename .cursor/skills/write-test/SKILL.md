---
name: write-test
description: >-
  Adds a unit, wiring, or Playwright test through a public interface.
  Use when the user asks to add a test, cover a service or page class,
  or write a browser test for navigation or a transition.
  Do not use to test private methods or GSAP tween values.
---

# Write a test

Read ADR 0008. Terms: [GLOSSARY.md](../../../GLOSSARY.md).

Write the real steps when `bun test` and Playwright run in this repo. Until then, do not add a suite that mocks modules a constructor could receive.

## Do

- **Unit.** `bun test` with happy-dom. Pass fakes through constructors. Assert a public method, a dispatched event, the DOM, or an error code.
- **Wiring.** `createServices()` builds the real graph. Fail on `MISSING_DEPENDENCY`.
- **Browser.** Playwright for overlay timing, view transitions, back/forward, `pageshow`, and screenshots of settled states. Run on each of the five setup combinations (ADR 0002).

The work is done when the test fails on the bug and passes on the fix, through something a caller can see.

## Do not

- `mock.module()` to replace a constructor argument.
- Test private methods or the order of internal calls.
- Wait with timeouts instead of an event or a DOM state.
- Snapshot markup. Screenshot comparisons of settled frames are fine.
- Assert GSAP tween values.
