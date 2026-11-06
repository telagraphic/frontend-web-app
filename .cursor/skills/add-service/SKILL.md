---
name: add-service
description: >-
  Adds a service to createServices() with constructor dependencies and
  init / destroy. Use when the user asks to add a service, a long-lived
  object with no markup, or to wire something in the services factory.
  Do not use for layout components, page classes, or integrations.
---

# Add a service

Read [SERVICES.md](../../../documentation/reference/SERVICES.md). Terms: [GLOSSARY.md](../../../GLOSSARY.md). Verbs: [METHOD_VERBS.md](../../../documentation/reference/METHOD_VERBS.md). Decisions: ADR 0006, ADR 0007.

Write the real steps when `createServices()` is the composition root in the running code. Until then, do not invent a locator or a settings file.

## Do

1. Name the file `app/services/{Name}Service.js`. Default export. Constructor takes only the dependencies it uses, under the same names as everywhere else.
2. Implement `init()` and `destroy()`. `destroy` is safe to call twice.
3. Construct it in `createServices()` after the services it depends on. Pass it through constructors, not setters.
4. If only page classes need it, add it to the page-services subset (today: animations and smooth scroll). Do not hand the whole factory to a page.
5. A failed `init` stops boot with `SERVICE_INIT_FAILED`. Keep `error.cause`.
6. Add a row to [SERVICES.md](../../../documentation/reference/SERVICES.md) in the same change.

The work is done when `createServices()` builds the object, a wiring test would see it, and no class imports the factory.

## Do not

- Scan markup for the service. Layout components go in `createLayout()`.
- Read a runtime settings file for wizard choices (ADR 0002).
- Add this as an integration. Use [add-integration](../add-integration/SKILL.md) when an outside product connects.
