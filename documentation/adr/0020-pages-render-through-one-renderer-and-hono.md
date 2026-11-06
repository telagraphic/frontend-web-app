---
status: accepted
---

# Pages render through one renderer in a Hono app, with live reload in dev

`scripts/generate-static-pages.js` scans `views/pages`, picks titles with a switch written for one client site, and writes `pages/` in dev and `dist/` in production. `server.js` imports `pages/*.html` once at startup, so a new page needs a restart. Its watcher shells out to rebuild every page on any change. Nothing fails when a route and a template drift apart.

A spike compared two replacements on Bun 1.2.21 and 1.4.4. Bun's HTML imports with hot module replacement applied only the first edit to a module that `App.js` imports, then dropped later edits. After a template regenerated an HTML file, Bun kept serving stale JavaScript until restart. A Hono app that renders on request, with our own live reload, applied every edit.

## Decisions

- The route table is the only list of pages. A route with no template fails the build. A template with no route is never published.
- A **renderer** turns a route and its data into one complete HTML document. Each renderer is a module in `server/renderers/` that exports `createRenderer({ viewsDir })`, which returns `extension`, `render(route, data)`, and `invalidate()`. `server/renderer.js` re-exports the one the project uses. Engine errors become one `RenderError` with message, file, and line.
- Everything that makes or serves HTML lives in `server/`, which never ships. `app/` is browser code, `views/` is templates, `public/` is copied into `dist/` unchanged, and `scripts/` keeps one-off tools. The sitemap becomes a build step.

| Renderer | Page file | Layout | Package |
| --- | --- | --- | --- |
| Nunjucks | `views/pages/{route key}.njk` | `{% extends %}` | `nunjucks` |
| Vento | `views/pages/{route key}.vto` | `{{ layout }}` | `ventojs` |
| JSX | `views/pages/{route key}.jsx` | A `Layout` component | `hono` (`jsxImportSource: "hono/jsx"`) |

- Every renderer gets the same data from `server/data.js`: `route`, `site` from `app/config/site.js`, `routes`, `navigation`, `meta`, and `assets`. Titles, canonical URLs, and current-link state are computed there, not in templates. Partials use each engine's own include system and keep the same names in every engine. JSX runs at build time only. The browser never runs a template engine.
- `server/app.js` exports `createApp({ assets })`. It loops the route table and registers one handler per route that calls the renderer. It is one loop, not one endpoint per route. Dev and production use the same app.
- Every document has the shell page swap and document load depend on. The external head script comes before the CSS. There is exactly one `<main id="main" data-route="{route key}" tabindex="-1">`, and page swap replaces its children (ADR 0021). A skip link (`href="#main"`) is the first focusable in `<body>`. The menu and the preloader sit outside `<main>`. An empty `[data-transition-host]` `div` with `hidden` and `aria-hidden="true"` sits outside `<main>` only on the GSAP path (ADR 0002). Links are root-relative. `assertDocument()` checks each rendered document, and a test runs it for every route. The host check runs only when that path includes the host. The full list is [ACCESSIBILITY.md](../reference/ACCESSIBILITY.md) and [TEMPLATES.md](../reference/TEMPLATES.md).
- Production runs `Bun.build` for `app/App.js`, `app/head.js`, and `styles/styles.css` with `minify: true`, `naming: "[name]-[hash].[ext]"`, and splitting (ADR 0004, ADR 0023). The output names are passed in as `assets`. Then `toSSG(app, { dir: "dist" })` writes one HTML file per route. `dist/` is the whole site.
- Dev runs one process, `server/dev.js`, which renders on request. `Bun.build` runs in the same process into `.dev/assets/` with linked source maps and no minify. A Hono middleware sends the same content security policy headers `server.js` sends today. In production, the host sends them.
- **Live reload** is dev only:
  - `/dev/events` streams server-sent events through Hono's `streamSSE`, with a ping every 15 seconds. `onAbort` removes the client.
  - `/dev/live-reload.js` is an external file, because the content security policy has no `'unsafe-inline'`. The renderer adds its tag only when `assets.liveReload` is set.
  - Events: `reload` reloads the page. `css` swaps each stylesheet `href` with a timestamp. `error` shows an overlay. `hello` on a reconnect reloads, so a server restart refreshes the page.
- Watchers, each debounced to about 60 ms and run one at a time:
  - `app/` rebuilds assets, then sends `reload`, or sends `error` and keeps the last good bundle.
  - `views/` calls `invalidate()`, then sends `reload`.
  - `experiments/` rebuilds that experiment's JS and sends `reload`, sends `css` for `styles.css`, and sends `reload` for markup.
  - `styles/` rebuilds the CSS bundle, then sends `css`.
  - `app/config/` rebuilds the Hono app from the route table, then sends `reload`. A new route needs no restart.
- `invalidate()` clears the engine's cache. Vento clears `env.cache`. Nunjucks runs with `noCache` in dev. JSX deletes the `views/` entries from `require.cache`.
- A render error returns a 500 page with the message, file, and line, plus the live-reload tag, so a fix reloads it. A build error overlay shows file and line from the Bun build log.
- `App.js` does not use `import.meta.hot`. This replaces the hot-update decision in ADR 0019.
- `scripts/generate-static-pages.js`, `scripts/build-pages.js`, the generated `pages/` folder, `server.js`, and the `build:html*` and `build:pages:js` scripts go away. `bun run dev` runs `server/dev.js`. `bun run build` runs `server/build.js`. `bun run preview` serves `dist/`. The full command list is in [TEMPLATES.md](../reference/TEMPLATES.md).
- Prettier formats every engine. Nunjucks uses `prettier-plugin-nunjucks`. Vento uses `prettier-plugin-jinja-template` with the `jinja-template` parser. JSX needs no plugin. The wizard writes the `.prettierrc` for the chosen renderer.
- `bun run lint:html` renders every route, runs `assertDocument()`, and checks the HTML with html-validate. Template syntax errors fail the render, so this one command lints templates in all three engines. JSX files also go through ESLint.
- Templates keep block tags out of opening tags. Attribute values such as `aria-current` come from data.
- **Experiments** are dev-only pages in `experiments/{name}/`: `index.{ext}`, `styles.css`, `experiment.js`, and `NOTES.md`. Dev serves each at `/experiments/{name}` and lists them at `/experiments`. `toSSG()` never sees them, and the build does not bundle them. `index.{ext}` extends `layouts/experiment.{ext}`, a bare layout with no router, preloader, or menu, or `layouts/page.{ext}` to test inside the real page. CSS is the same language as production (ADR 0023). Experiments are committed and stay after publishing. The `gsap-experiment` skill creates and publishes them.
- The wizard asks which renderer to use (ADR 0002). It copies that renderer, its `views/` files, and its package. The others do not ship.
- In the starter, `views/` and `server/renderers/nunjucks.js` are the default Nunjucks set, so the starter runs as a normal site. `wizard/renderers/vento/` and `wizard/renderers/jsx/` each hold that engine's adapter, `views/`, `.prettierrc`, and package list. The wizard swaps one in.
- The starter ships one page: Home. Route key `home`, path `/`, view `views/pages/home.{ext}`, class `app/pages/Home.js`, styles `styles/pages/home.css`. Extra pages come from the add-page skill. The previous client site's pages (`View`, `Introduction`, `References`, and the section views) leave the starter.
- `public/` holds files copied into `dist/` unchanged: fonts, `robots.txt`, and `_redirects`.
- The content security policy lives once, in `app/config/csp.js`. Dev sends it as a header. The build writes it to `dist/_headers`. `netlify.toml` no longer repeats it, and its single-page fallback redirect goes away.
- The build stops at the first render, asset, or document error, with a non-zero exit. A route with no page file stops dev at startup. A template with no route prints a warning.
- HTML is not minified. The host compresses it.
- Before a live reload, the client saves the scroll position in `sessionStorage`. After boot, dev restores it with smooth scroll's `scrollTo(y, { immediate: true })` and clears it.

## Considered Options

- **Bun HTML imports with hot module replacement.** This is option A from the spike. It writes HTML to a folder and lets Bun bundle it. In-place updates failed after the first edit to an imported module, and the server served stale JavaScript after regenerated HTML until restart. Full reloads were also needed for templates.
- **A hand-rolled `ReadableStream` for events.** The server lost track of browser connections, so reload events reached no one. Hono's `streamSSE` kept them.
- **Eleventy 3.** It handles multiple engines well, but needs its own dev server next to Bun's build and runs on Node.
- **Astro, or Vite multi-page.** Each replaces the Bun bundler, and Astro brings its own syntax and routing next to ours.
- **A runtime choice between renderers.** Unused engines would ship in every client site.
- **Plain Prettier for templates.** Its HTML parser broke a Nunjucks page and could not parse a Vento tag inside an attribute.
- **`prettier-plugin-jinja-template` for Nunjucks too.** It needed two passes to settle on a Nunjucks layout, which breaks `format:check`.
- **djLint.** It formats both string engines, but it needs Python, uppercases the doctype, and reports valid Vento tags as errors.

## Consequences

- A JavaScript or template save is a full reload. A CSS save swaps without one. A reload does not replay the preloader, because it runs once per session (ADR 0014).
- A reload keeps the scroll position but closes an open menu and restarts running animations.
- `hono` is a dependency of every client site, at build time and in dev. It ships nothing to the browser.
- CI renders and builds the starter pages with each renderer, next to the navigation combinations (ADR 0002).
- Not yet verified: Bun CSS bundling of `@import … layer()` feeding the `css` event, and the boot from ADR 0007 under live reload.
- The first `format` run on a hand-written template can change many lines. After that, the formatters are stable.
