---
status: accepted
---

# Tests go through public interfaces, in three layers

The starter has no tests yet. Once the refactors in ADRs 0004 to 0007 land, every class gets its dependencies through its constructor, so tests can pass in fakes without replacing modules. We will test in three layers, and every test checks behavior through something a caller can see: a public method (`init`, `destroy`, `navigate`), a dispatched event, the resulting DOM, an error code, or a screenshot.

## Decisions

- **Unit tests** use `bun test` with happy-dom for services, layout components, and page classes, with fakes passed through constructors. The interface is the test surface ([MODULES.md](../reference/MODULES.md)).
- **A wiring test** builds the real services with `createServices()` and fails on `MISSING_DEPENDENCY`.
- **Browser tests** use Playwright for what a fake DOM can't do: overlay timing, view transitions, back and forward, restores from the back/forward cache, and visual tests that compare screenshots. They run on each of the five setup combinations (ADR 0002).
- These patterns are not used:
  - `mock.module()` to replace something a constructor could receive.
  - Tests of private methods or of the order of internal calls.
  - Waiting with timeouts instead of waiting for an event or a DOM state.
  - Snapshots of markup. Screenshot comparisons in Playwright are fine, because they check what a visitor sees.
  - Assertions on GSAP tween values.

## Consequences

- Visual tests capture settled states, such as a page after its reveal, with animations disabled while the screenshot is taken. Mid-transition frames vary from run to run, so they're checked by timing and DOM state instead.
- Most of today's classes can't be tested in isolation until the refactors land, so the suite is built after them.
