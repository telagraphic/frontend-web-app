# Tests

Three layers. Each one checks something a caller can see: a public method, a dispatched event, the DOM, an error code, or a settled screenshot. Decision: [ADR 0008](../adr/0008-tests-go-through-public-interfaces-in-three-layers.md). Adding a test: [write-test](../../.cursor/skills/front-end-write-test/SKILL.md).

`bun test` runs unit and wiring. `bun run test:browser` runs Playwright. The dev server for browser tests is `PORT=3458 bun server/dev.js`, started by `playwright.config.js`.

## Which layer

| You added | Layer | What the test shows |
| --- | --- | --- |
| Service in `createServices()` | Wiring, then unit | The factory still returns the four boot services. A unit test calls `init`, `destroy`, or another public method with fakes in the constructor |
| Page class with its own behavior | Unit | `init` selects `static elements`, or a listener fires, inside `main` |
| Page that is only a route and a view | Wiring | `assertDocument` already renders every route. No extra test until the class does something |
| Layout component | Unit | `open` / `close`, `inert`, `aria-current`, or the preloader session flag |
| Helper such as `loadImages` | Unit | The named export: empty input, a failure, `maxWait` |
| Effect | Unit, only for cleanup | `destroy` on the scope drops what the effect created. Do not assert tween values |
| GSAP transition | Unit | `run()` still sequences prepare, cover, commit, and reveal. Do not assert tween values |
| View transition | Unit and browser | `wrapCommit` calls `startViewTransition`, or `commit` when the API is missing. The browser test skips when this combination is not view transition plus page swap |
| Navigation a fake DOM cannot see | Browser | Overlay cover and reveal, back and forward, `pageshow`, focus on `main`, a settled screenshot |

A browser test is copied onto every created site. Skip it when that combination does not have the behavior. A unit test that imports a module the wizard deletes for some combinations needs the same `rm` in `wizard/create.js` as `documentLoad.test.js`, `viewTransitions.test.js`, `transitionsService.test.js`, and `pageNavigate.test.js`.

## Unit

`tests/unit/*.test.js`. happy-dom provides `window` and `document`. Assign those, plus `HTMLElement`, on `globalThis`, then `import()` the module. Do not assign happy-dom's `Event` or `CustomEvent` onto `globalThis`. Pass fakes through the constructor. Call `router.navigate` when the subject is the router. Do not construct `RouterPageManager`, `RouterSwap`, `RouterHistory`, or `RouterResolver`.

## Wiring

`tests/wiring/*.test.js`. `createServices()` builds the real graph and the test fails when a required constructor argument is missing. `assertDocument` renders every route and checks the document shell.

## Browser

`tests/browser/*.browser.js`, so `bun test` does not load Playwright. Wait on a DOM state or an event: `main[data-route]`, a hidden `[data-transition-host]`, or `waitForFunction` for the cover. Register the cover wait before the click. Set `sessionStorage` `preloader-played` before navigation, except when the test is the preloader or `pageshow`.

Screenshots are settled frames, with `reducedMotion: "reduce"` and animations disabled. Playwright names the file with the operating system, so CI needs `home-settled-chromium-linux.png` beside the macOS baseline. Do not screenshot a frame mid-cover.

## Not in this suite

Private methods, the order of internal calls, markup snapshots, and GSAP tween values. Do not `mock.module()` to replace a constructor argument.
