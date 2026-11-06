# Frontend web app

Content-driven sites on **Bun**: static HTML documents, page classes, GSAP, Lenis. Not React, Vite, Next, or Tailwind.

Terms: [GLOSSARY.md](GLOSSARY.md). Verbs: [documentation/reference/METHOD_VERBS.md](documentation/reference/METHOD_VERBS.md). Blocks: [documentation/reference/OVERVIEW.md](documentation/reference/OVERVIEW.md). Seams: [documentation/reference/MODULES.md](documentation/reference/MODULES.md). Accessibility: [documentation/reference/ACCESSIBILITY.md](documentation/reference/ACCESSIBILITY.md). Decisions: [documentation/adr/](documentation/adr/).

Boot: `createServices()`, then `createLayout(services)`, then the first page. Navigation is **page swap** or **document load**.

New JS follows [write-js](.cursor/skills/write-js/SKILL.md) and [JS.md](documentation/reference/JS.md): `class` for lifecycle, named functions for composition roots and helpers. New CSS follows [write-css](.cursor/skills/write-css/SKILL.md). A new class or module follows [add-module](.cursor/skills/add-module/SKILL.md). Config lives in `app/config/`.

Use `bun install`, `bun run`, `bun test`, and `Bun.build`. The running tree is still the previous client site until the accepted markdown is implemented. Order: [documentation/reference/IMPLEMENTATION.md](documentation/reference/IMPLEMENTATION.md).
