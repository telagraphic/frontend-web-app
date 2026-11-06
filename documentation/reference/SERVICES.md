# Services and layout components

Every long-lived object in the app, what it's for, and where it lives. This describes the design the ADRs settled on. The **Status** column shows how far the code has moved toward it. Update this file in the same change that adds, moves, or removes one of these objects.

Terms follow [GLOSSARY.md](../../GLOSSARY.md). Method names follow [METHOD_VERBS.md](METHOD_VERBS.md). Every object here has `init()` and `destroy()` (ADR 0006).

## Services

Built by `createServices()` in `app/services/ServicesFactory.js`, the composition root for services. A service that fails `init()` stops boot (ADR 0007). The function returns `{ router, animationsService, transitionsService, smoothScroll }`. The route table is constructed here and passed into the router; it is not a field on that return.

| Service | What it does | Lives in | Status | Decided in |
| --- | --- | --- | --- | --- |
| Route table | Lists every route with its page class, path, title, meta description, and optional `pageTransition`. Config the factory constructs and the router holds, not a returned service | `app/config/siteRoutes.js` (data) and `app/config/SiteConfig.js` (class) | Exists. The `class` field becomes `page`. Overlay fields follow ADR 0024 | ADR 0004, 0006, 0024 |
| Router, page swap | Intercepts internal links, runs the order of each navigation, owns the current page, builds page classes, and dispatches `navigationstart` and `navigationend` | `app/router/Router.js` | Exists. Being refactored | ADR 0001, 0005, 0006 |
| Document load navigation | Same interface as the page swap router, using browser document loads. Used instead of it when the setup chooses document load | Not created yet | To build | ADR 0002, 0006 |
| Transitions service | Sequences hide/load/commit. Ships with GSAP transitions (`prepare` / `cover` / `reveal`) and with page-swap view transitions (`wrapCommit` → `document.startViewTransition`). Not included on document-load view transitions | `app/services/TransitionsService.js`, plug-ins in `app/transitions/` | Exists. To refactor. Paths: [PAGE_TRANSITIONS.md](PAGE_TRANSITIONS.md) | ADR 0005, 0012 |
| Animations service | The site's only connection to GSAP. Registers plugins, connects smooth scroll to ScrollTrigger, creates animation scopes, runs `data-animation` types, and refreshes ScrollTrigger | `app/services/AnimationsService.js`, with GSAP code in `app/animations/gsap/` | Exists. To refactor. Usage: [ANIMATIONS.md](ANIMATIONS.md) | ADR 0009 |
| Smooth scroll | Wraps Lenis. Never imports GSAP. Pauses with `stop()` and `start()`. `refresh()` after a page's init; window resize only when width changes. One preset name picks the feel | `app/components/SmoothScroll.js` | Exists. To refactor | ADR 0006, 0009, 0015, 0016 |

### Helpers with a lifecycle

Not services. Each lifecycle object creates its own.

| Helper | What it does | Lives in | Status |
| --- | --- | --- | --- |
| Base lifecycle | Shared `init` / `destroy` shell: abort signal, animation scope, `this.use(child)`. `BasePage` and `Component` extend it | `app/pages/BaseLifecycle.js` (or next to `Component`) | To build (ADR 0011) |
| Animation scope | Records everything one lifecycle object animates, and reverts all of it on `destroy()`. Created through `animationsService.createScope(root)` | `app/animations/gsap/GsapAnimationScope.js` | To build (ADR 0009) |

### Router parts

Built by the router itself, never by the factory or anything else (ADR 0006). Internal seams. Not on the factory return. Not a test surface.

| Part | What it does | Lives in |
| --- | --- | --- |
| Router history | Pushes and replaces history entries, and reports back and forward | `app/router/RouterHistory.js` |
| Router resolver | Decides what a link is: a route to commit, the same document, external, or not found | `app/router/RouterResolver.js` |
| Router page loader | Loads a route's page class through the page index | `app/router/RouterPageLoader.js` |
| Router page manager | Fetches the next page's HTML and swaps the children of `<main>` (`swapMain`, `updateHead`). Does not apply theme or construct `ImageService` | `app/router/RouterPageManager.js` (or equivalent internal helpers) |
| Prefetch cache | Keeps recently fetched page HTML | `app/router/RouterPrefetchCache.js` |
| Prefetch manager | Fetches the next page on hover and focus | `app/router/RouterPrefetchManager.js` |

### Page services

The only services a page class receives, passed by the router when it builds the page class. A page class passes its components only what they use.

| Page service | Why page classes need it |
| --- | --- |
| Animations service | Create and destroy the page's entrance animations |
| Smooth scroll | Scroll within the page |

## Layout components

Built by `createLayout(services)`, the composition root for layout components. Each project lists its own. A layout component that fails `init()` is logged and skipped (ADR 0007).

| Layout component | What it does | Lives in | Status |
| --- | --- | --- | --- |
| Menu | `Navigation` owns `open` and `close`. A subclass supplies markup and motion. Closes on `navigationstart`. Sets `aria-current="page"` by href | `app/components/Navigation.js`, starter subclass in `app/components/menus/` | Exists. To refactor. Boilerplate: [LAYOUT_COMPONENTS.md](LAYOUT_COMPONENTS.md). ADR 0006, 0017 |
| Preloader | Covers the first document of a session. Later document loads do not paint it. Page `show` runs after it hides. While it is up, skip link, menu, footer, host, and `<main>` are `inert`. `maxWait` defaults to 4000. The counter is off unless `counter` is true | `app/components/Preloader.js` | Exists. Built by `App.js` today. ADR 0014 |

`createLayout()` doesn't exist yet.

### Layout listeners, not services

ADR 0006: `createLayout` attaches these. They hear `navigationstart` / `navigationend`. They have no markup. They are not constructed in `createServices()`. The menu also hears those events; it is a layout component, not a layout listener.

| Layout listener | What it does |
| --- | --- |
| Focus | After `navigationend` on a page swap, move focus to `main` unless something inside it already has focus. Abort with the layout signal. Skip the first boot. Do not steal restored focus on document load |

Theme is CSS after `swapMain` copies `data-background` and `data-color`. Analytics is the first integration. Neither is a layout listener.

A 404 is a route plus a view. The resolver's `not-found` outcome loads it. Do not add a 404 service, a font service, or a breakpoint service. Future APIs: [CANDIDATES.md](CANDIDATES.md). Speed checks: [PERFORMANCE.md](PERFORMANCE.md).

## Lists the composition roots read

| List | What it holds | Lives in | Status |
| --- | --- | --- | --- |
| Route table | Every route the site serves | `app/config/siteRoutes.js` | Exists |
| Page index | One `import()` per page class | `app/config/pages.js` | To build (ADR 0004, 0015) |
| Animation index | Each `data-animation` type and its effect | `app/config/animations.js` | To build (ADR 0009, 0015) |
| Scroll presets | `default`, `heavy`, and `expo`. The factory passes one name | `app/config/scrollPresets.js` | To build (ADR 0015) |
| Layout list | The project's layout components | Inside `createLayout()` | To build (ADR 0007) |

## Removed

| Object | Why | Decided in |
| --- | --- | --- |
| `RegistryService` | The page index replaces its page class map, and the router owns the current page | ADR 0004, 0006 |

## Integrations

None yet. How integrations such as a database, accounts, or payments connect is deferred until the first one is needed.
