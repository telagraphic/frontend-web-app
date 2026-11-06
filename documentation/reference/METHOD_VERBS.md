# Method verbs

Every method name starts with one of these verbs. Each verb that begins something has exactly one opposite, so a reader can find the method that undoes it.

| Verb pair | Means | Used for |
| --- | --- | --- |
| `create*` | Builds and returns a new object, and changes nothing else | Factory functions, such as `createServices()` |
| `init` / `destroy` | Starts or ends an object's life. `destroy` undoes everything `init` did, is safe to call twice, and the object isn't reused after it | Services, `BaseLifecycle`, and the stages the router calls. Subclass hooks are `onInit` / `onDestroy` (and `onShow` / `onHide` on pages): the `on` prefix marks an event-type hook |
| `start` / `stop` | Runs or pauses ongoing activity that can resume | Smooth scroll motion, prefetch, animation loops |
| `show` / `hide` | Makes something visible or not visible | Page class hooks, the preloader, the overlay |
| `open` / `close` | Opens or closes a panel the visitor toggles | The navigation menu |
| `add` / `remove` | Puts one item in or takes it out: a listener, element, or class | Helpers called from `init` and `destroy`. Listeners use `addEventListener` / `removeEventListener` with `{ signal }` (ADR 0010) |
| `register` / `unregister` | Adds or removes a named entry in a lookup | Not used for DOM listeners |
| `load` | Fetches something and returns it | Page classes, page HTML, images |
| `prepare` | Gets something ready ahead of time, with no visible change | Overlay content before the cover plays |
| `update` | Changes something that exists to match new state | Page content, history |
| `track` | Returns a version of a function whose GSAP objects are recorded by an animation scope | Event handlers that start motion later |
| `refresh` | Recalculates positions after the layout changes | ScrollTrigger and Lenis after a page's init stage, fonts loading, or `pageshow`. Window resize only when width changes |
| `get` / `set` / `has` | Reads, writes, or checks a stored value | The route table, caches, `getData()` for `data-*` values |
| `select` | Finds elements inside a root and returns them | `select(root, map)` and the element map (ADR 0022) |
| `delegate` | Adds one listener on a parent for matching children | `delegate(root, type, selector, handler, { signal })` |
| `when*` | Calls back once a condition is met | `whenDOMReady()`, `whenVisible()` |

`$`, `$$`, and `nextPaint` keep their established names. The `on` prefix is only for hooks a subclass implements, so a helper never starts with `on`.

## Retired verbs

| Don't use | Use instead |
| --- | --- |
| `lock` / `unlock` | `stop` / `start` for pausing scroll (ADR 0016) |
| `setup*` | `init`, or a specific verb inside it, such as `addLinkListeners()` |
| `initialize*` | `init`, or `create*` when it returns a new object |
| `teardown`, `cleanup`, `dispose` | `destroy` |
| `kill` | Only inside GSAP calls, never in our own method names |
| `deregister` | `unregister` |
| `read*` | `get*` for a stored value, `load` for a fetch |
| `on` / `off` as helpers | `addEventListener` with `{ signal }` (ADR 0010, ADR 0022) |
