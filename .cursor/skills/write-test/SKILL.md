---
name: write-test
description: >-
  Picks the test layer for a new feature and adds that test through a
  public interface. Use when the user asks to add a test, or after adding
  a service, page class, layout component, helper, effect, or transition.
  Do not use to test private methods or GSAP tween values.
---

# Write a test

Read [TESTS.md](../../../documentation/reference/TESTS.md). Decision: [ADR 0008](../../../documentation/adr/0008-tests-go-through-public-interfaces-in-three-layers.md). Terms: [GLOSSARY.md](../../../GLOSSARY.md).

## Pick the layer

| You added | Write |
| --- | --- |
| Service in `createServices()` | Keep the wiring test green. Add `tests/unit/{name}.test.js` for a public method |
| Page class that does something | `tests/unit/{Name}.test.js` for `init`, elements, or a listener |
| Route and view with an empty page class | Nothing new. `tests/wiring/documents.test.js` already renders every route |
| Layout component | `tests/unit/{Name}.test.js` for `open` / `close`, `inert`, or the session flag |
| Helper | `tests/unit/{name}.test.js` for the named export |
| Effect or GSAP transition | A unit test that `destroy` or `run()` still does its public job. No tween values |
| View transition | Extend `tests/unit/viewTransitions.test.js`. Add a browser test that counts `startViewTransition` and skips on every other combination |
| Overlay, back/forward, `pageshow`, focus, or a settled screenshot | `tests/browser/*.browser.js` |

One change can need two layers. A service needs wiring and a unit test. A view transition needs a unit test and a browser test. Stop when the table's row is covered.

## Do

1. Assert a public method (`init`, `destroy`, `navigate`), a dispatched event, the DOM, or an error code (`MISSING_DEPENDENCY`, `SERVICE_INIT_FAILED`, `COMPONENT_INIT_FAILED`).
2. Unit and wiring: create a happy-dom `Window`, assign `window`, `document`, and `HTMLElement` on `globalThis`, then dynamically `import()` the module. Do not assign happy-dom's `Event` or `CustomEvent` onto `globalThis`.
3. Pass fakes through the constructor. Call `router.navigate` for router behavior.
4. Browser: follow `playwright.config.js`. `bun run test:browser` starts `PORT=3458 bun server/dev.js`. Wait for `main[data-route]`, `[data-transition-host][hidden]`, or `waitForFunction` for the cover. Register the cover wait before the click. Set `sessionStorage` `preloader-played` except for a preloader or `pageshow` test. Unknown paths are a document-load 404. `/404` is a route and can page-swap to Home.
5. Screenshots are settled frames only: `reducedMotion: "reduce"` and `toHaveScreenshot({ animations: "disabled" })` after the host is hidden. Commit the Linux baseline next to the macOS one. CI looks up `*-chromium-linux.png`.
6. A browser test is copied to every created site, so skip when the combination lacks the behavior. A unit test that imports a file the wizard deletes needs an `rm` in `wizard/create.js` beside the existing test drops.

The work is done when `bun test` passes for unit and wiring, `bun run test:browser` passes for a browser test, and the assertion fails if the public behavior is removed.

## Do not

- `mock.module()` to replace a constructor argument.
- Test private methods or the order of internal calls.
- Construct `RouterPageManager`, `RouterSwap`, `RouterHistory`, or `RouterResolver`.
- Wait with timeouts instead of an event or a DOM state.
- Snapshot markup.
- Assert GSAP tween values.
- Put Playwright specs where `bun test` will load them. Specs live in `tests/browser/*.browser.js`. `bun run test` runs unit and wiring. `bun run test:browser` runs Playwright.
