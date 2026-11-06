---
status: accepted
---

# The services factory wires services in dependency order, with no cycles

`ServicesFactory` builds 13 objects in two phases: it constructs them, then connects three dependency cycles with setters. The cycles exist only for "does this route exist" lookups and redirects to Home. Four services are passed under a name the receiving class doesn't read, so those classes silently get `undefined`. Once route lookups go to the route table, failures go back up to the router (ADR 0001), and the page index replaces the registry (ADR 0004), nothing needs a cycle. We will build each service after the services it depends on, passing everything through constructors.

## Decisions

- `ServicesFactory` is the composition root for services, and `createLayout()` is the composition root for layout components (ADR 0007). They are the only places that build those objects. No class imports `ServicesFactory` or a service instance, and no class receives the whole set of services. Code refers to a dependency only through `this`, set from its constructor. Page classes receive only the page services the router passes them, and pass their components only what those components use.
- No setters for wiring. A service gets its dependencies through its constructor, and only the dependencies it uses.
- The router module builds its own parts: history, resolver, page loader, page manager, and prefetch. Those files are internal seams. They are not on the factory interface, and they are not a test surface. Callers and tests use `init` / `destroy` / `navigate` and the two navigation events.
- `createServices()` returns only `{ router, animationsService, transitionsService, smoothScroll }`. It still constructs the route table and passes it into the router (and into page transitions when overlay fields are needed). It does not return `siteConfig`, `registryService`, loader, manager, history, resolver, prefetch, or Navigation. Navigation is built by `createLayout()` (ADR 0007). Boot calls `init()` / `destroy()` on those four only.
- Every service has `init()` and `destroy()`. Boot calls `init()` in dependency order. The hot-reload `dispose` handler calls `destroy()` in reverse order, so a reload never leaves a second set of listeners.
- Setup wizard choices land in the factory as imports: the chosen page transition strategy and the chosen navigation option. No setting is read at runtime (ADR 0002).
- The router dispatches `navigationstart` and `navigationend` events on itself. Code that reacts to navigations listens for them. The router never calls that code directly.
  - The menu (a layout component) closes on `navigationstart` and sets `aria-current="page"` on `navigationend` by matching the new route's href (ADR 0001 action 8).
  - Focus is a layout listener. `createLayout` attaches it. It is not a service and not a layout component. It runs only when the navigation context's family is page swap, and only when nothing inside `<main>` already has focus. First boot and document load leave focus to the browser.
  - Page theme is `data-background` and `data-color` on `<main>`. `swapMain` copies those attributes (ADR 0021). CSS owns the colors (`STYLES.md`). There is no theme listener. `BackgroundColors` leaves `RouterPageManager`.
  - Analytics is the first integration, not a core listener.
- The page swap router and document load navigation share one interface: `init()`, `destroy()`, `navigate(url)`, and the same events. The factory imports the one the setup chose, so every listener works under both options.
- Each service is passed under one name everywhere, such as `transitionsService`, never `transitionsManager`. A test builds the services and fails if any dependency arrives as `undefined`.

## Considered Options

- **A dependency injection container.** It would resolve the wiring automatically, but for six services it hides an order that fits in one readable function.
- **Keep the setters.** They work, but they let a service exist half-wired, and they hide cycles that point to misplaced responsibilities.

## Consequences

- `RegistryService`, the `pageRegistry`, `pageLoader`, and `pageManager` aliases in `App.js`, and the unused `registryService` dependency in `Navigation` all go away. Fetch, parse, `swapMain`, `updateHead`, the prefetch cache, and the failure fallback (`location.assign`) stay inside the router module. `loadImages` is a helper the router calls after swap (ADR 0018), not an object the manager constructs.
- `Router.start()` becomes `Router.init()`, and `TransitionsService.init()` is no longer called separately by boot.
- A client site's factory imports only the code its setup chose.
- The router no longer receives `Navigation`. The menu closes itself when it hears `navigationstart`.
