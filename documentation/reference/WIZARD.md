# Setup wizard

How a client site is created from this starter. Decisions: [ADR 0002](../adr/0002-setup-wizard-configures-navigation-and-page-transitions.md). Paths: [PAGE_TRANSITIONS.md](PAGE_TRANSITIONS.md). Renderer swap: [TEMPLATES.md](TEMPLATES.md). Terms: [GLOSSARY.md](../../GLOSSARY.md).

`bun run create <dest>` runs `wizard/create.js`. The starter is never rewritten. A created site has no `wizard/` folder and no `create` script.

Status: slice 11 landed the Starlight app in `docs/`. Create still matches the slice 10 matrix. The docs site is starter-only.

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

Copy the starter into `<dest>`. Skip `wizard/`, `docs/`, `node_modules/`, `dist/`, `.dev/`, `.git`, and `.github/`. Copy `experiments/`. Then delete unused modules for this combination. Write only these seams:

| File | What the wizard writes |
| --- | --- |
| `app/config/site.js` | name, origin |
| `package.json` | name; chosen renderer packages; no `@clack/prompts`; no `create` script |
| `server/renderer.js` | one import |
| `.prettierrc` | the chosen engine |
| `styles/styles.css` | GSAP overlay import, or view-transition import, or neither |
| `app/services/ServicesFactory.js` | the navigation import and the transition import |
| `app/layout/createLayout.js` | the menu, the preloader, and the page-swap focus listener |
| the layout | overlay host only on GSAP |
| `app/head.js` | preloader always; GSAP document-load cover flag only on that path |

`assertDocument()` requires `[data-transition-host]` only when the layout has that host. That host is a `div` with `hidden` and `aria-hidden="true"`, never a landmark. Skip link and `main#main` are always required ([ACCESSIBILITY.md](ACCESSIBILITY.md)).

Docs on the copy: `.cursor/skills/`, `AGENTS.md`, `GLOSSARY.md`, `documentation/adr/`, `documentation/reference/`. History guides and checklists are gone from the starter (slice 0). Starter-only tests, the create-matrix CI workflow, and the Starlight app in `docs/` stay in the starter. A created site keeps site-level lint, test, and build.

## Modules per combination

| Combination | Navigation | `TransitionsService` | Overlay host | Transition module | Head extras |
| --- | --- | --- | --- | --- | --- |
| GSAP + page swap | Page-swap router | Yes | Yes | GSAP plug-in | Preloader only |
| GSAP + document load | Document-load navigation | Yes | Yes | GSAP plug-in | Preloader + cover flag |
| View transition + page swap | Page-swap router | Thin `wrapCommit` | No | `ViewTransition.js` | Preloader only |
| View transition + document load | None (browser navigates) | No | No | `@view-transition` CSS | Preloader only |
| None | None (browser navigates) | No | No | None | Preloader only |

GSAP the motion library, Lenis, menu, preloader, Home, and `AnimationsService` ship on every path. Page-swap router parts ship only with page swap.

## Files

Create deletes whole files. A file is listed on a combination only when that combination needs the entire file. Two combinations that need different bodies get two files. The factory still exposes one `transitionsService`: it imports `GsapTransitions.js` or `ViewTransitions.js`, or neither.

Columns: **G/S** GSAP + page swap, **G/D** GSAP + document load, **V/S** view transition + page swap, **V/D** view transition + document load, **N** none. A mark means the file ships. The renderer choice is separate and listed after this table.

Paths the ADRs already name are used as written. Three paths are assigned here because the role existed without a filename: `app/router/DocumentLoad.js`, `app/layout/createLayout.js`, `app/layout/listenFocus.js`.

### Every combination

| File | Function |
| --- | --- |
| `app/App.js` | Boot: `createServices()`, then `createLayout()`, then the first page |
| `app/config/siteRoutes.js` | Route table |
| `app/config/pages.js` | Page index, one `import()` per page class |
| `app/config/animations.js` | `data-animation` type → effect |
| `app/config/scrollPresets.js` | Lenis presets `default`, `heavy`, `expo` |
| `app/config/csp.js` | Content security policy |
| `app/utilities/environment.js` | `isProduction` |
| `app/utilities/dom.js` | `select` and the DOM helpers |
| `app/utilities/frames.js` | `nextPaint` |
| `app/utilities/images.js` | `loadImages` |
| `app/pages/BaseLifecycle.js` | Signal, animation scope, `use(child)` |
| `app/pages/BasePage.js` | Page `init` / `show` / `hide` / `destroy` |
| `app/pages/Page.js` | Page class with no custom behavior |
| `app/pages/Home.js` | Starter page class |
| `app/components/Component.js` | Component base |
| `app/components/Navigation.js` | Menu `open` / `close` |
| `app/components/menus/Menu.js` | Starter menu subclass |
| `app/components/Preloader.js` | First-document preloader |
| `app/components/SmoothScroll.js` | Lenis wrapper |
| `app/services/AnimationsService.js` | The only connection to GSAP |
| `app/animations/gsap/gsap.js` | The one GSAP import |
| `app/animations/gsap/GsapAnimationScope.js` | Records motion and reverts it on `destroy` |
| `app/animations/gsap/effects/titleReveal.js` | Starter `data-animation` effect |
| `styles/reset/normalize.css` | Reset layer |
| `styles/tokens/tokens.css` | `:root` custom properties |
| `styles/base/base.css` | Axioms: focus, skip link, reduced motion |
| `styles/base/typography.css` | `@font-face` and element type |
| `styles/utilities/sr-only.css` | `.sr-only` |
| `styles/components/navigation.css` | Menu |
| `styles/components/menu.css` | Starter menu artwork |
| `styles/components/preloader.css` | Preloader |
| `styles/pages/home.css` | Home, under `main[data-route="home"]` |
| `styles/pages/not-found.css` | Not-found, under `main[data-route="not-found"]` |
| `views/layouts/page.{ext}` | Document shell |
| `views/pages/home.{ext}` | Home view |
| `views/pages/not-found.{ext}` | Not-found view |
| `views/partials/preloader.{ext}` | Preloader markup |
| `server/app.js` | One handler per route |
| `server/data.js` | Template data |
| `server/document.js` | `assertDocument` |
| `server/assets.js` | Built asset names |
| `server/dev.js` | Dev server |
| `server/build.js` | Production build |
| `server/preview.js` | Serves `dist/` |
| `server/lint-html.js` | Renders every route and checks the document |
| `server/live-reload/` | Dev reload. Its tag is never rendered in production |
| `public/` | Fonts, `robots.txt`, `_redirects` |
| `scripts/process-image.js` | Image tool |
| `experiments/` | Dev-only pages. Copied, never published |

### Page swap

Ships on **G/S** and **V/S**. Deleted for **G/D**, **V/D**, and **N**.

| File | Function |
| --- | --- |
| `app/router/Router.js` | Page-swap navigation: `init`, `destroy`, `navigate`, the two navigation events |
| `app/router/RouterHistory.js` | History entries, back and forward |
| `app/router/RouterResolver.js` | What a link is: route, same document, external, not found |
| `app/router/RouterPageLoader.js` | Loads the page class through the page index |
| `app/router/RouterPageManager.js` | Fetches the next document |
| `app/router/RouterSwap.js` | Replaces the children of `<main>` (`swap`, `updateHead`) |
| `app/router/RouterPrefetchCache.js` | Recently fetched HTML |
| `app/router/RouterPrefetchManager.js` | Prefetch on hover and focus |
| `app/layout/listenFocus.js` | Moves focus to `main` after a page swap |

### Document-load navigation

Ships on **G/D** only. A view-transition document load and None let the browser follow the link, so they do not keep this file.

| File | Function |
| --- | --- |
| `app/router/DocumentLoad.js` | Same navigation interface. Click plays the GSAP cover, writes the flag, then `location.assign` |

### GSAP transition

Ships on **G/S** and **G/D**. Deleted for **V/S**, **V/D**, and **N**.

| File | Function |
| --- | --- |
| `app/services/GsapTransitions.js` | Sequencer: `prepare`, `cover`, the injected commit, `reveal`. Page swap passes RouterSwap. Document load passes the assign |
| `app/transitions/wipe/WipeTransition.js` | Default plug-in: `prepare` / `cover` / `reveal` |
| `app/transitions/wipe/wipe.css` | Plug-in styles |
| `app/config/transitions.js` | Second and later effects only. Omitted when the site has one effect |

### View transition

`view-transition.css` is the shared file: both view combinations need all of it. The cross-document opt-in is its own file so a page-swap site does not receive it.

| File | Function | G/S | G/D | V/S | V/D | N |
| --- | --- | --- | --- | --- | --- | --- |
| `app/services/ViewTransitions.js` | Sequencer: `hide`, `load`, `wrapCommit` | | | yes | | |
| `app/transitions/view/ViewTransition.js` | `wrapCommit` → `document.startViewTransition` | | | yes | | |
| `styles/components/view-transition.css` | Shared names `{role}-{route key}`, reduced motion | | | yes | yes | |
| `styles/components/view-transition-document.css` | `@view-transition { navigation: auto }` | | | | yes | |

### None

**N** keeps the every-combination files and the seams below. It does not keep a router, `DocumentLoad.js`, either transitions file, a plug-in, or a transition stylesheet.

### Seams the wizard writes

These files exist on every site. The wizard writes the variant. They are not five copies, and they do not contain the other options' branches.

| File | What the chosen site receives |
| --- | --- |
| `app/config/site.js` | Name and origin |
| `package.json` | Project name, the chosen renderer packages, no `@clack/prompts`, no `create` script |
| `server/renderer.js` | One import: Nunjucks, Vento, or JSX |
| `.prettierrc` | The chosen engine |
| `styles/styles.css` | The shared layer imports, plus `wipe.css`, or the view-transition files that combination keeps, or neither |
| `app/services/ServicesFactory.js` | `Router.js` or `DocumentLoad.js` or no navigation import. `GsapTransitions.js` or `ViewTransitions.js` or no transition import |
| `app/layout/createLayout.js` | Menu and preloader. `listenFocus` only when the router is page swap |
| `views/layouts/page.{ext}` | Overlay host only for GSAP |
| `app/head.js` | Preloader on every site. Cover flag only for GSAP document load. `pageswap` / `pagereveal` only for view-transition document load, and only when a shared name has to be chosen at click time |

### Renderer

Independent of the five rows above. The starter holds the Nunjucks set. Vento and JSX wait in `wizard/renderers/` and replace that set when chosen.

| Choice | What is in the created site |
| --- | --- |
| Nunjucks | `server/renderers/nunjucks.js`, `views/**/*.njk` |
| Vento | `server/renderers/vento.js`, `views/**/*.vto`, copied from `wizard/renderers/vento/` |
| JSX | `server/renderers/jsx.js`, `views/**/*.jsx`, copied from `wizard/renderers/jsx/` |

`wizard/` itself is never copied.

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
