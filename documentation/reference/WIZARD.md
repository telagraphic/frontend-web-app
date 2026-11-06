# Setup wizard

How a client site is created from this starter. Decisions: [ADR 0002](../adr/0002-setup-wizard-configures-navigation-and-page-transitions.md). Paths: [PAGE_TRANSITIONS.md](PAGE_TRANSITIONS.md). Renderer swap: [TEMPLATES.md](TEMPLATES.md). Terms: [GLOSSARY.md](../../GLOSSARY.md).

`bun run create <dest>` runs `wizard/create.js`. The starter is never rewritten. A created site has no `wizard/` folder and no `create` script.

Status: accepted design. `wizard/create.js` is not built yet.

## Prompts

Interactive when flags are omitted. `@clack/prompts` stays in the starter.

| Order | Prompt | Kind | Default | Skipped when |
| --- | --- | --- | --- | --- |
| 1 | Destination folder | text fill | — | `<dest>` argument or `--dest` |
| 2 | Site name | text fill | — | `--name` |
| 3 | Origin | text fill | — | `--origin` |
| 4 | Page transition | GSAP transition, View transition, None | GSAP transition | `--transition` |
| 5 | Navigation | Page swap, Document load | Page swap | `--navigation`, or page transition is None |
| 6 | Renderer | Nunjucks, Vento, JSX | Nunjucks | `--renderer` |

Flags: `--dest`, `--transition`, `--navigation`, `--renderer`, `--name`, `--origin`.

Refuse `.`, the starter root, a path inside the starter, and a non-empty destination. No overwrite. If create fails after the copy starts, delete the destination.

After **None**, navigation is document load. After view transition, the labels are page swap (same-document API) and document load (cross-document API).

Trade-offs sit next to the choice: a document load without an overlay gives up GSAP on the outgoing page; Firefox may ignore view transitions; Speculation Rules prefetch is mainly Chromium.

Fixed, not asked: GSAP as the motion library, Bun as host, menu, smooth scroll, Prettier, ESLint, Stylelint, html-validate, `process-image.js`, integrations (none).

Create writes files and stops. It prints `cd <dest> && bun install && bun run dev`. It does not install or `git init`.

## Copy, drop, write

Copy the starter into `<dest>`. Skip `wizard/`, `node_modules/`, `dist/`, `.dev/`, and `.git`. Copy `experiments/`. Then delete unused modules for this combination. Write only these seams:

| File | What the wizard writes |
| --- | --- |
| `app/config/site.js` | name, origin |
| `package.json` | name; chosen renderer packages; no `@clack/prompts`; no `create` script |
| `server/renderer.js` | one import |
| `.prettierrc` | the chosen engine |
| `styles/styles.css` | GSAP overlay import, or view-transition import, or neither |
| `app/services/ServicesFactory.js` | the navigation import and the transition import |
| the layout | overlay host only on GSAP |
| `app/head.js` | preloader always; GSAP document-load cover flag only on that path |

`assertDocument()` requires `[data-transition-host]` only when the layout has that host. That host is a `div` with `hidden` and `aria-hidden="true"`, never a landmark. Skip link and `main#main` are always required ([ACCESSIBILITY.md](ACCESSIBILITY.md)).

Docs on the copy: `.cursor/skills/`, `AGENTS.md`, `GLOSSARY.md`, `documentation/adr/`, `documentation/reference/`. Not copied: `documentation/guides/`, `documentation/refactoring-reviews/`, `APPLICATION_GUIDE.md`. Starter-only tests and the create-matrix CI workflow stay in the starter. A created site keeps site-level lint, test, and build.

## Modules per combination

| Combination | Navigation | `TransitionsService` | Overlay host | Transition module | Head extras |
| --- | --- | --- | --- | --- | --- |
| GSAP + page swap | Page-swap router | Yes | Yes | GSAP plug-in | Preloader only |
| GSAP + document load | Document-load navigation | Yes | Yes | GSAP plug-in | Preloader + cover flag |
| View transition + page swap | Page-swap router | Thin `wrapCommit` | No | `ViewTransition.js` | Preloader only |
| View transition + document load | None (browser navigates) | No | No | `@view-transition` CSS | Preloader only |
| None | None (browser navigates) | No | No | None | Preloader only |

GSAP the motion library, Lenis, menu, preloader, Home, and `AnimationsService` ship on every path. Page-swap router parts ship only with page swap.

## CI

**Starter as committed.** Lint, `format:check`, unit/wiring tests, and build.

**Created sites.** `bun run create <tmp> --transition … --navigation … --renderer … --name ci --origin https://example.com`, then `bun install`, lint, `format:check`, test, and build.

| # | Transition | Navigation | Renderer | Playwright |
| --- | --- | --- | --- | --- |
| 1 | GSAP | Page swap | Nunjucks | Yes |
| 2 | GSAP | Document load | Nunjucks | Yes |
| 3 | View transition | Page swap | Nunjucks | Yes |
| 4 | View transition | Document load | Nunjucks | Yes |
| 5 | None | *(document load)* | Nunjucks | Yes |
| 6 | GSAP | Page swap | Vento | No |
| 7 | GSAP | Page swap | JSX | No |
