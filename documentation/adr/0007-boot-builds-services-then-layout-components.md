---
status: accepted
---

# Boot builds services, then layout components, and dependencies only point down

Services are the core every site needs to run: the route table, router, page transitions, animations, and smooth scroll. Layout components, such as the navigation menu and the preloader, own markup outside the page template and differ from project to project. Today the factory builds some layout components, boot builds the preloader itself, and the router calls the menu directly. We will boot in layers: `createServices()`, then `createLayout(services)`, then the router shows the first page.

## Decisions

- `createLayout(services)` holds an explicit list of the project's layout components. Each project adds its own layout components to that list. Nothing is found by scanning the markup.
- Dependencies only point down. Services never reference layout components or page classes. Layout components receive services and never reference page classes. Anything that has to travel up a layer goes through an event.
- Failures depend on the layer:
  - A service whose `init()` throws stops boot with `SERVICE_INIT_FAILED`, and the static page stays readable (ADR 0004).
  - A layout component whose `init()` throws is logged with `COMPONENT_INIT_FAILED` and skipped, and boot continues.
  - A page hook that throws raises `PAGE_HOOK_FAILED`, and the router falls back to a document load (ADR 0005).
  - A constructor missing a dependency throws `MISSING_DEPENDENCY`.

## Considered Options

- **Scanning markup for `data-component` attributes.** It's flexible, but you can't see what runs without reading every template, and a misspelled name fails silently.
- **Building layout components in `ServicesFactory`.** It mixes the required core with project-specific additions, so one broken menu would be treated like a broken router.

## Consequences

- Tests can build any layer with fakes passed through constructors, because no class imports a service or a layout component.
- Each error keeps the original error as `error.cause`, so a test can check both the code and what caused it.
- The preloader moves from `App.js` into `createLayout()`.
