---
status: accepted
---

# BasePage and Component extend BaseLifecycle so abort, scope, and child teardown are not copied

Page classes and components both need the same lifetime shell: an abort signal, an animation scope, `init` / `destroy` guards, and `this.use()` so children die with the parent. Copying those lines into `BasePage` and `Component` is how `create()` vs `init()` and "forgot `super.create()`" drifted apart. We will put that shell in `BaseLifecycle`. `BasePage` adds the page stages (`hide`, `show`) and the animation index. `BaseLifecycle` also selects the declared `static elements` inside the root, for pages and components alike (ADR 0022). Services do not extend it; they last for the whole document.

## Decisions

- Glossary term: **lifecycle object**. Class name: `BaseLifecycle`.
- `BaseLifecycle` creates the `AbortController` in `init()` and aborts it in `destroy()` (ADR 0010). It creates the animation scope and reverts it on destroy (ADR 0009). `this.use(child)` inits a child and destroys it with the parent.
- Subclasses implement `onInit` / `onDestroy` (pages also have `onShow` / `onHide`). The `on` prefix marks an event-type hook. They do not override `init` / `destroy` except to find their DOM root before calling `super.init()`, because the scope needs `this.root`.
- `Component.init()` throws `COMPONENT_INIT_FAILED` when the selector matches nothing. Boot logs that and skips the layout component (ADR 0007). A page-level component that fails inside `this.use()` is `PAGE_HOOK_FAILED`.
- A page uses components; it is not a component. `Home extends BasePage extends BaseLifecycle`. `Navigation extends Component extends BaseLifecycle`.

## Considered Options

- **`Owner` as the class name.** It names a role, not a thing. The glossary names things.
- **Copy the shell into `BasePage` and `Component`.** Two copies will drift the first time a leak check or child controller is added.
- **`BasePage extends Component`.** A page is not a layout component. `this.use()` is "contains," not "is-a."
