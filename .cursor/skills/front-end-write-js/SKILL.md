---
name: front-end-write-js
description: >-
  Writes JavaScript in this starter's ESM class and helper style, and
  adopts a modern JS syntax feature only after checking current MDN
  Baseline support. Use when adding or editing app/, server/, or
  experiment JS, or when the user asks for modern syntax, optional
  chaining, async, or a new language feature. Do not use for CSS or
  to choose which kind of module to add.
---

# Write JS

Read [JS.md](../../../documentation/reference/JS.md) and [METHOD_VERBS.md](../../../documentation/reference/METHOD_VERBS.md). Terms: [GLOSSARY.md](../../../GLOSSARY.md). If the file does not exist yet, start with [add-module](../front-end-add-module/SKILL.md). A syntax feature JS.md does not already require: [FEATURES.md](FEATURES.md).

## Do

1. ESM. `class` for lifecycle; named function for a composition root or helper. Default export a class; named-export a helper. Verbs from the table. Stages are `init` / `show` / `hide` / `destroy`.
2. Prefer current Baseline **widely available** syntax listed in JS.md: `?.`, `??`, `async` / `await`, `for…of`, static class fields, `{ signal }`, `{ cause }`.
3. If the user wants a feature JS.md does not already require, look up MDN Baseline **now** via [FEATURES.md](FEATURES.md). Newly available: use it with a clear fallback. Limited or flag-only: experiment only.
4. Listeners take `{ signal: this.signal }`. GSAP from `app/animations/gsap/gsap.js`.
5. Format with `bun run format`. Lint with `bun run lint:js`.

The work is done when the file matches JS.md, names use glossary terms, and a new syntax feature has a current Baseline read.

## Do not

- Add React, Vue, jQuery, CommonJS, or `var`.
- Call `create`, `setup`, or `super.create()`.
- Import the services factory from a page or component.
- Use this skill to pick a directory. [add-module](../front-end-add-module/SKILL.md) does that.
