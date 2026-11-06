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

## Do

1. Pick the layer. **Unit:** `bun test` with happy-dom, fakes through constructors. **Wiring:** `createServices()` builds the real graph. **Browser:** Playwright in `tests/browser/*.browser.js` for overlay timing, back/forward, `pageshow`, and settled screenshots.
2. Put unit and wiring tests in `tests/unit` and `tests/wiring`. Create a happy-dom `Window`, assign `window` / `document` / `HTMLElement` on `globalThis`, then dynamically `import()` app modules. Do not assign happy-dom's `Event` or `CustomEvent` onto `globalThis` (native `EventTarget` rejects them).
3. Assert a public method (`init`, `destroy`, `navigate`), a dispatched event, the DOM, or an error code (`MISSING_DEPENDENCY`, `SERVICE_INIT_FAILED`, `COMPONENT_INIT_FAILED`).
4. For wiring, call `createServices()` and assert the four returned services are defined. Fail if a constructor would accept `undefined` for a required dependency.
5. Browser tests use `playwright.config.js`. `bun run test:browser` starts `PORT=3458 bun server/dev.js`. Wait for a DOM state or event (`main[data-route]`, `[data-transition-host][hidden]`, `waitForFunction` for the cover). Register the cover wait before the click. Skip the preloader with `sessionStorage preloader-played` except when the test is the preloader or `pageshow`. Unknown paths are a document-load 404; `/404` is a table route and can page-swap to Home.
6. Screenshots are settled frames only: `reducedMotion: "reduce"` and `toHaveScreenshot({ animations: "disabled" })` after the host is hidden. Do not screenshot a mid-cover frame.

The work is done when the test fails on the bug and passes on the fix, through something a caller can see.

## Do not

- `mock.module()` to replace a constructor argument.
- Test private methods or the order of internal calls.
- Construct `RouterPageManager`, `RouterSwap`, `RouterHistory`, or `RouterResolver` from a test. Call `router.navigate`.
- Wait with timeouts instead of an event or a DOM state.
- Snapshot markup. Screenshot comparisons of settled frames are fine.
- Assert GSAP tween values.
- Put Playwright specs where `bun test` will load them. Specs live in `tests/browser/*.browser.js` so Bun does not treat them as unit tests. `bun run test` runs unit and wiring; `bun run test:browser` runs Playwright.
