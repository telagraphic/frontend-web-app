# Modules, seams, and adapters

How this starter uses **module**, **interface**, **seam**, **adapter**, and **depth**. Product names stay in [GLOSSARY.md](../../GLOSSARY.md): a Service is still a Service. These words judge whether that Service (or page class, or renderer) is deep.

Tests cross the same seam as callers (ADR 0008). One adapter is a hypothetical seam. Two adapters make it real. Do not add a port for a variation that does not exist.

## What is a module here

| Kind (glossary) | It is a module whose interface is… |
| --- | --- |
| Service | `init` / `destroy`, plus that object's public methods and events |
| Page class | `init` / `show` / `hide` / `destroy` and `static elements` |
| Layout component | `init` / `destroy`, and `open` / `close` on the menu |
| Renderer | `createRenderer` → `{ extension, render, invalidate }` |
| GSAP transition plug-in | `prepare` / `cover` / `reveal` |
| Effect | `create*(element, { reducedMotion })` |
| Helper | The named export (`loadImages`, `select`, `isProduction`) |

`createServices()` and `createLayout()` are **composition roots**. They are allowed to be shallow: deleting them should not scatter logic, only wiring. The factory's interface is the four services boot uses (`router`, `animationsService`, `transitionsService`, `smoothScroll`). Router parts behind that interface are not a second composition root.

## Real seams (two or more adapters)

| Seam | Interface | Adapters |
| --- | --- | --- |
| Renderer | `render(route, data)` | Nunjucks, Vento, JSX |
| Navigation | `init`, `destroy`, `navigate`, `navigationstart` / `navigationend` | Page-swap router, document-load navigation |
| GSAP overlay | `prepare` / `cover` / `reveal` | Each named plug-in (`wipe`, …) |
| Menu | `open` / `close` | Each project subclass of `Navigation` |
| Constructor deps | The constructor | Production object, or a test fake |

GSAP transitions and view transitions are **two families**, not two adapters of one interface (ADR 0012). Do not force `cover` / `reveal` onto `startViewTransition`.

## Hypothetical seams (one adapter — do not port-ify)

| Module | Only adapter today | Second adapter would be |
| --- | --- | --- |
| Animation scope | `GsapAnimationScope` | Another library folder behind `createScope()` (ADR 0009) |
| Smooth scroll | Lenis | A different scroller, by leaving it out of `createServices()` first |
| Prefetch cache | In-memory HTML inside the page-swap router | A second in-process warmer. Cover waits on that load; document load uses Speculation Rules or HTTP prefetch, not this cache |
| Integration | None | The first outside product ([add-integration](../../.cursor/skills/add-integration/SKILL.md)) |

## Depth checks

**Deep (keep)**

- `AnimationsService`: callers never import GSAP. One connection, scopes, types, ticker.
- `loadImages`: wait, decode, failure-as-settled. Markup chooses the set.
- `assertDocument`: one function, the whole document contract.
- `BaseLifecycle`: signal, scope, `use(child)`, element map. Page classes stay thin.

**Shallow (already leaving)**

- `RegistryService` — the page index and the router own that job.
- Setter wiring — constructors are the seam.
- `ImageService` as a long-lived object — markup + `loadImages`.
- A DI container around six services — the factory is readable.
- `RouterPageManager` as a factory-constructed object — fetch, swap, and head updates are the router module's implementation.

**Deletion test.** If we deleted `AnimationsService` and every page imported GSAP, the complexity would reappear at every call site. That module earns its keep. If we deleted a pass-through `Manager` that only forwarded `init`, nothing would reappear. Do not add those.

## Testing through the interface

Dependencies are **in-process** (happy-dom, fakes in constructors) or **browser** (Playwright for overlay and view transitions). There is no network port in the core. Do not `mock.module()` to reach past a constructor. If a test has to change when the implementation changes, it is testing past the interface. Page-swap tests call `router.navigate`; they do not construct `RouterPageManager`, `RouterHistory`, or `RouterResolver`.
