---
status: accepted
---

# The setup wizard creates a client site by writing chosen code into a new folder

This repo is a starter for client sites. A setup wizard creates each client site from it. The wizard asks a question only when a function has two or more options, because each answer changes which code the client site contains. Today that is page transition, navigation, and renderer. Site name and origin are text fills. Motion (GSAP with `AnimationsService`), hosting (static pages served by Bun), lint/format/image tools, menu, smooth scroll, and integrations (none) each have a single option, so they are copied and listed as fixed.

The command, the option tree, the copy/drop map, and the CI matrix are in [WIZARD.md](../reference/WIZARD.md).

## Options offered

| Function | Options | Default |
| --- | --- | --- |
| Page transition | GSAP transition, View transition, None | GSAP transition |
| Navigation, after GSAP transition | Page swap, Document load | Page swap |
| Navigation, after view transition | Page swap (same-document API), Document load (cross-document API) | Page swap |
| Renderer | Nunjucks, Vento, JSX | Nunjucks |

Navigation is skipped when page transition is **None**: that path is document load. The renderer question is independent of navigation. The first option question is page transition, because that changes which modules ship.

- **GSAP + page swap:** the router fetches and swaps `<main>`. The service runs cover, then commit, then reveal.
- **GSAP + document load:** the click covers, writes a short-lived flag, and assigns `location`. The next document reveals. No page-swap router.
- **View transition + page swap:** the router still swaps `<main>`, but the only visual is `document.startViewTransition(commit)`. `TransitionsService` is a thin wrapper around that call.
- **View transition + document load:** the browser loads the next document. `@view-transition { navigation: auto }` is the whole feature. No `TransitionsService`, no page-swap router.
- **None:** document loads, no cover and no view transition.

Do not name these SPA or MPA in code or docs. Page swap and document load are the terms. Markup, classes, and JavaScript for each path are in [PAGE_TRANSITIONS.md](../reference/PAGE_TRANSITIONS.md).

A document load with a GSAP transition works across documents like this. The link click plays the cover animation, writes the target path and a timestamp to `sessionStorage`, and sets `location.href`. On the next document, a small external script in `<head>` reads that flag before first paint, so CSS draws the host already covering, and the app plays the reveal. The flag is honored only if the path matches and it is a few seconds old, and it is cleared once read. The script is external because the site's CSP has no `'unsafe-inline'` for scripts. A page restored from the back/forward cache resets the host on `pageshow`. Back and forward are plain document loads. The next document is prefetched on hover and focus during the cover animation. An arrival through the cover skips the preloader.

Shared-element names are for view transitions only, set in CSS as `{role}-{route key}`, such as `hero-home`. GSAP transitions do not use them.

## How the wizard runs

- `bun run create <dest>` runs `wizard/create.js` in the starter. With no `<dest>`, the wizard asks for the folder. Interactive prompts use `@clack/prompts`, a starter-only dependency. Flags `--transition`, `--navigation`, `--renderer`, `--name`, and `--origin` skip the option prompts so CI can run without a TTY. `--dest` is also accepted.
- Refuse `.`, the starter root, a path inside the starter, and a non-empty destination. No overwrite. On failure after the copy starts, delete the destination.
- The wizard copies the starter into `<dest>`. The starter repo is never rewritten. A published `bunx create-…` package can wait.
- The copy skips `wizard/`, `node_modules/`, `dist/`, `.dev/`, and `.git`. It includes `experiments/`. Then unused modules for this combination are deleted. The wizard writes only these seams: `app/config/site.js`, `package.json` (name, renderer packages, no `@clack/prompts`, no `create` script), `server/renderer.js`, `.prettierrc`, `styles/styles.css` imports, the imports in `app/services/ServicesFactory.js`, the overlay host in the layout (GSAP only), and the GSAP document-load cover flag in `app/head.js`. No search-replace across the tree.
- The copy includes `.cursor/skills/`, `AGENTS.md`, `GLOSSARY.md`, `documentation/adr/`, and `documentation/reference/`. It omits `documentation/guides/`, `documentation/refactoring-reviews/`, and `APPLICATION_GUIDE.md`. Starter-only tests and the create-matrix CI workflow stay in the starter. A created site gets site-level lint, test, and build only.
- `assertDocument()` requires `[data-transition-host]` only on the GSAP path (ADR 0020).
- Prettier, ESLint, Stylelint, html-validate, and `scripts/process-image.js` ship on every site. The wizard does not ask about them. It only writes the renderer-specific Prettier file and, for JSX, the ESLint snippet (ADR 0020).
- Create writes files and stops. It does not run `bun install` or `git init`. Interactive mode prints `cd <dest> && bun install && bun run dev`. A created site has no `wizard/` folder and no `create` script.
- Nunjucks is what the starter runs. Vento and JSX wait in `wizard/renderers/`. The wizard copies the chosen renderer, its `views/`, and its package (ADR 0020).

## Considered Options

- **Barba.js** as a navigation option. It is a page swap maintained elsewhere, not a different model. ADR 0001 keeps our own page swap.
- **Sync mode**, with both pages in the DOM at once. Shared elements use view transitions instead (ADR 0001).
- **"SPA mode" and "MPA mode"** as names. Every site is made of full documents, and page swap is an addition on top, so the options are named for what happens at navigation.
- **Motion and CSS-only motion.** Every animation class is written against GSAP, and its plugins are free.
- **A settings file read at runtime.** Unchosen options would ship in every client site. The wizard writes only the chosen code instead.
- **In-place setup on a clone.** That mutates the starter and fights CI. Create always writes a new folder.
- **A wizard question for format, lint, or image tools.** There is one toolchain. Asking would not change which modules ship.

## Consequences

- The wizard runs once, when a client site is created. Switching navigation later is a manual change in that site.
- The starter contains every option. A client site contains only the modules, `ServicesFactory` wiring, and layout markup for its choices.
- The starter job in CI lints, tests, and builds the repo as committed. Created-site jobs run `create` with flags, then install, lint, `format:check`, test, and build. Five combinations use Nunjucks. The default combination (GSAP + page swap) is also created once with Vento and once with JSX. Playwright runs on the five combinations (ADR 0008).
- Each `Page` runs `init` and `show` on every load in both navigation options. `hide` runs when a link click starts a navigation, which happens under page swap and under document load with the overlay transition.
- A document load without the overlay gives up GSAP on the outgoing page. Firefox gets plain document loads where view transitions are partial. Prefetch through Speculation Rules works mainly in Chromium browsers. The wizard states these trade-offs next to the option.
- The living list of functions, options, defaults, and requirements is a page on the documentation site (ADR 0003).
- A function gets a wizard question when it gains a second option that a client site needs. Per-route overlay copy, images, and a named GSAP effect are route-table data, not a wizard question (ADR 0024).
