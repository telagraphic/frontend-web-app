---
name: add-integration
description: >-
  Connects the first outside product (database, accounts, payments).
  Use when the user asks to add an integration, third-party API, auth,
  or a database. Do not use for in-process services.
---

# Add an integration

None ship yet ([SERVICES.md](../../../documentation/reference/SERVICES.md)). How an outside product connects is decided with the first one.

Write the full steps in this file when that work starts. Until then, do not add a client SDK as a service “just in case.”

## Do

- Treat the outside product as an **integration**, not a service.
- Keep secrets off the client bundle. Server or host env, not `app/config` that ships to the browser.
- Expand this skill with the files, env names, and destroy/teardown rules the first integration actually uses.

## Do not

- Wire it through `createServices()` unless the first integration proves it belongs there.
- Use [add-service](../add-service/SKILL.md) for a vendor SDK.
