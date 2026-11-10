---
name: front-end-add-service
description: >-
  Adds a service to createServices() with constructor dependencies and
  init / destroy. Use when the user asks to add a service, a long-lived
  object with no markup, or to wire something in the services factory.
  Do not use for layout components, page classes, or integrations.
---

# Add a service

Read [SERVICES.md](../../../documentation/reference/SERVICES.md). Terms: [GLOSSARY.md](../../../GLOSSARY.md). Verbs: [METHOD_VERBS.md](../../../documentation/reference/METHOD_VERBS.md). Decisions: ADR 0006, ADR 0007.

## Do

1. Name the file `app/services/{Name}Service.js`. Default export. Constructor takes only the dependencies it uses, under the same names as everywhere else. Call `requireDependency` for those names.
2. Implement `init()` and `destroy()`. `destroy` is safe to call twice.
3. Construct it in `createServices()` after the services it depends on. Pass it through constructors, not setters.
4. If only page classes need it, the router passes it when it builds the page (today: animations and smooth scroll). Do not hand the whole factory to a page.
5. A failed `init` stops boot with `SERVICE_INIT_FAILED`. Keep `error.cause`.
6. Add a row to [SERVICES.md](../../../documentation/reference/SERVICES.md) in the same change.
7. `createServices()` still returns only `{ router, animationsService, transitionsService, smoothScroll }` unless an ADR changes that set. Extra objects stay internal.
8. Follow [write-test](../front-end-write-test/SKILL.md). Keep the wiring test passing, and add a unit test for the service's public method.

The work is done when `createServices()` builds the object, the wiring test still passes, and no class imports the factory.

## Do not

- Scan markup for the service. Layout components go in `createLayout()`.
- Read a runtime settings file for wizard choices (ADR 0002).
- Add this as an integration. Use [add-integration](../front-end-add-integration/SKILL.md) when an outside product connects.
- Put Navigation, Preloader, or another layout component in the factory.
