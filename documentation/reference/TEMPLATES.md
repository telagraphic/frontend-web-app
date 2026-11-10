# Templates and page rendering

How the starter turns the route table and `views/` into HTML documents, in dev and in production. A project uses one **renderer**: Nunjucks, Vento, or JSX. The setup wizard picks it (ADR 0002). The pipeline is [ADR 0020](../adr/0020-pages-render-through-one-renderer-and-hono.md). Terms are in [GLOSSARY.md](../../GLOSSARY.md).

Status: slice 8 landed the Hono renderer, Nunjucks views, and Home / not-found documents. Slice 10 added Vento and JSX kits under `wizard/renderers/`. The documentation site is `server/docs.js` (ADR 0027). `bun run dev` is `server/dev.js`. `bun run build` is `server/build.js`. `bun run docs:dev` is the documentation site.

## How it flows

### One request in dev

```
browser  GET /about
   │
   ▼
server/dev.js                Bun.serve, renders on every request
   │
   ▼
server/app.js                createApp(): one handler per route, registered in a loop
   │  route table lookup     /about → { key: "about", title: "About", page: "Page" }
   ▼
server/data.js               buildData(route) → { route, site, routes, navigation, meta, assets }
   │
   ▼
server/renderer.js           re-exports the chosen renderer, e.g. renderers/vento.js
   │  render(route, data)    reads views/pages/about.vto, its layout, and partials
   ▼
server/document.js           assertDocument(route, html): the shell every document needs
   │
   ▼
200 text/html                or a 500 error page with message, file, and line
```

### A file change in dev

| You save | Watcher does | Browser gets | Browser does |
| --- | --- | --- | --- |
| `app/**/*.js` | `Bun.build` into `.dev/assets/` | `reload`, or `error` | Reloads, or shows an overlay and keeps the last good code |
| `styles/**/*.css` | `Bun.build` on `styles/styles.css` | `css` | Swaps the stylesheet, no reload |
| `views/**` | `renderer.invalidate()` | `reload` | Reloads; the next request renders fresh |
| `app/config/**` | Rebuilds the Hono app from the route table | `reload` | Reloads; new routes work without a restart |
| `experiments/{name}/styles.css` | Nothing to compile | `css` | Swaps the stylesheet, no reload |
| `experiments/{name}/experiment.js` or `index.{ext}` | Rebuilds that experiment's JS, or invalidates the template | `reload` | Reloads |
| The server restarts | Nothing | `hello` on reconnect | Reloads |

Each watcher is debounced to about 60 ms and runs one at a time, so a burst of saves is one reload. Events travel over server-sent events at `/dev/events`. A reload keeps your scroll position: the client saves it before reloading, and dev restores it after boot.

### The production build

```
bun run build   (server/build.js — stops at the first error)

 step  tool          input                               output
 ────  ────────────  ──────────────────────────────────  ───────────────────────────────────────
  1    Bun.build     app/App.js, app/head.js,            dist/assets/App-[hash].js, chunks,
                     styles/styles.css                   head-[hash].js, styles-[hash].css
                     minify: true
  2    assets        build outputs                       { head, css, js }   (no liveReload)
  3    toSSG         createApp({ assets })               dist/{route key}.html, one per route
                       └ renderer.render + assertDocument for every route
  4    sitemap       route table + app/config/site.js    dist/sitemap.xml
  5    headers       app/config/csp.js                   dist/_headers
  6    copy          public/                             dist/   (fonts, robots.txt, _redirects)
```

### What navigation does with the output

```
                       dist/about.html   (one complete document)
                                │
              ┌─────────────────┴──────────────────┐
              ▼                                    ▼
      document load                           page swap
      the browser requests and                the router fetches the same file,
      renders the whole document              parses it, and replaces the swap root
                                              inside <main>; the menu, preloader,
                                              and transition host stay
```

There is no fragment build. Both navigation options use the same documents.

### Stages

| Stage | Module | Dev | Production |
| --- | --- | --- | --- |
| Route lookup | `server/app.js` | Per request | `toSSG` walks every route |
| Data | `server/data.js` | Per request | Per route |
| Render | `server/renderers/{engine}.js` | Per request, cache cleared on change | Once per route |
| Document check | `server/document.js` | Error page on failure | Build fails |
| Assets | `server/assets.js` | `.dev/assets/App.js`, linked source maps | Hashed files in `dist/assets/` |
| Live reload | `server/live-reload/` | On | Off; its tag is never rendered |

## Folders

```
app/        browser code; ships to visitors
views/      templates in the project's renderer syntax
  layouts/page.{ext}
  partials/{name}.{ext}
  pages/{route key}.{ext}
styles/     CSS; Bun bundles styles/styles.css
server/     never ships; makes and serves the HTML
  app.js  data.js  document.js  assets.js  renderer.js
  renderers/   nunjucks.js  vento.js  jsx.js
  live-reload/ events.js  client.js  watch.js
  dev.js  build.js  preview.js  lint-html.js
public/     copied into dist/ unchanged
scripts/    one-off tools, such as process-image.js
experiments/  dev-only pages, never published
  {name}/  index.{ext}  styles.css  experiment.js  NOTES.md
wizard/     starter only; the setup wizard's alternatives
  renderers/vento/  renderers/jsx/   adapter, views/, .prettierrc, packages
```

In the starter, `views/` is the default Nunjucks set. A client site has no `wizard/` folder.

Partial names are the same in every engine. Switching engine swaps files one for one.

## Data every template gets

| Key | What it holds | Built from |
| --- | --- | --- |
| `route` | `key`, `path`, `title`, `description`, `page`, `pageTransition` | The route table |
| `site` | `name`, `origin`, `socialImage` | `app/config/site.js` |
| `routes` | Every route | The route table |
| `navigation` | `[{ path, title, current }]`, where `current` is `"page"` or `"false"` | The route table and the current route |
| `meta` | `title`, `description`, `canonical`, `socialImage` | `route` and `site` |
| `assets` | `head`, `css`, `js`, and `liveReload` in dev only | `server/assets.js` |

Titles, canonical URLs, and current-link state are computed in `server/data.js`, not in templates. Templates hold markup and output values. That keeps one copy of each rule instead of one per engine. It also keeps block tags out of opening tags, where the Vento formatter splits them across lines.

## The document every route must produce

`assertDocument()` checks these in dev and fails the build without them.

| Required | Why |
| --- | --- |
| `<html lang>` | Screen readers need a language ([ACCESSIBILITY.md](ACCESSIBILITY.md)) |
| Viewport `width=device-width, initial-scale=1` | Never `user-scalable=no` or `maximum-scale` |
| `<script src="{assets.head}">` before the CSS | The preloader and GSAP-cover flags are read before first paint (ADR 0014, ADR 0002) |
| Skip link as the first focusable in `<body>`, `href="#main"` | Keyboard users skip chrome |
| Exactly one `<main id="main" data-route="{route key}" tabindex="-1">` | Page swap replaces its children and `data-*`. `id` and `tabindex` stay ([PAGE_SWAP.md](PAGE_SWAP.md)) |
| The menu and the preloader outside `<main>` | Layout components stay across page swaps |
| `[data-transition-host]` outside `<main>` | GSAP path only: a `div` with `hidden` and `aria-hidden="true"`. View transition and None have no host (ADR 0002) |
| Root-relative links | Links resolve the same way under both navigation options |

## The same page in each engine

Each engine below is the same three files: the document layout, the menu partial, and an about page. The layout is the shell `assertDocument` checks. The partial loops `navigation` and prints `aria-current` from data the server already computed. The page supplies only the content inside `<main>`. `data-animation="title"` is the declarative effect. The syntax is the only thing that changes.

### Nunjucks

A page `{% extends %}` the layout and fills `{% block content %}`. `{% include %}` pulls a partial into the layout. `{{ }}` prints a value. The layout below is the full document. The partial is the menu. The page is only the about content.

```njk
{# views/layouts/page.njk #}
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{{ meta.title }}</title>
    <meta name="description" content="{{ meta.description }}" />
    <link rel="canonical" href="{{ meta.canonical }}" />
    <script src="{{ assets.head }}"></script>
    <link rel="stylesheet" href="{{ assets.css }}" />
    <script type="module" src="{{ assets.js }}"></script>
  </head>
  <body>
    <a class="skip-link" href="#main">Skip to content</a>
    {% include "partials/preloader.njk" %}
    {% include "partials/navigation.njk" %}
    <div class="page-transition-overlay" data-transition-host hidden aria-hidden="true"></div>
    <main id="main" data-route="{{ route.key }}" tabindex="-1">
      {% block content %}{% endblock %}
    </main>
    {% include "partials/footer.njk" %}
    {% if assets.liveReload %}
      <script type="module" src="{{ assets.liveReload }}"></script>
    {% endif %}
  </body>
</html>
```

```njk
{# views/partials/navigation.njk #}
<nav class="navigation" data-navigation>
  <button type="button" data-navigation-toggle aria-expanded="false">Menu</button>
  <ul data-navigation-panel>
    {% for item in navigation %}
      <li><a href="{{ item.path }}" aria-current="{{ item.current }}">{{ item.title }}</a></li>
    {% endfor %}
  </ul>
</nav>
```

```njk
{# views/pages/about.njk #}
{% extends "layouts/page.njk" %}
{% block content %}
  <section class="about">
    <h1 class="about__title" data-about-title data-animation="title">{{ route.title }}</h1>
    <p class="about__body">{{ route.description }}</p>
  </section>
{% endblock %}
```

### Vento

`{{ layout }}` wraps the page body, which the layout prints as `{{ content }}`. `{{ include }}` pulls in a partial. `{{ for }}` and `{{ if }}` are the loop and the branch. The three files are the layout, the menu, and the about page, same as Nunjucks.

```vto
{{# views/layouts/page.vto #}}
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{{ meta.title }}</title>
    <meta name="description" content="{{ meta.description }}" />
    <link rel="canonical" href="{{ meta.canonical }}" />
    <script src="{{ assets.head }}"></script>
    <link rel="stylesheet" href="{{ assets.css }}" />
    <script type="module" src="{{ assets.js }}"></script>
  </head>
  <body>
    <a class="skip-link" href="#main">Skip to content</a>
    {{ include "partials/preloader.vto" }}
    {{ include "partials/navigation.vto" }}
    <div class="page-transition-overlay" data-transition-host hidden aria-hidden="true"></div>
    <main id="main" data-route="{{ route.key }}" tabindex="-1">{{ content }}</main>
    {{ include "partials/footer.vto" }}
    {{ if assets.liveReload }}
      <script type="module" src="{{ assets.liveReload }}"></script>
    {{ /if }}
  </body>
</html>
```

```vto
{{# views/partials/navigation.vto #}}
<nav class="navigation" data-navigation>
  <button type="button" data-navigation-toggle aria-expanded="false">Menu</button>
  <ul data-navigation-panel>
    {{ for item of navigation }}
      <li><a href="{{ item.path }}" aria-current="{{ item.current }}">{{ item.title }}</a></li>
    {{ /for }}
  </ul>
</nav>
```

```vto
{{# views/pages/about.vto #}}
{{ layout "layouts/page.vto" }}
  <section class="about">
    <h1 class="about__title" data-about-title data-animation="title">{{ route.title }}</h1>
    <p class="about__body">{{ route.description }}</p>
  </section>
{{ /layout }}
```

### JSX

JSX runs only on the server, through Hono JSX. Set `"jsxImportSource": "hono/jsx"` in `tsconfig.json`. Use `class`, not `className`. `Layout`, `Menu`, and the page are functions. The page passes the template data into `Layout` and puts its content in `children`, which the layout renders inside `<main>`. The live-reload script renders only when `assets.liveReload` is set, which is dev.

```jsx
// views/layouts/page.jsx
import { Preloader } from "../partials/preloader.jsx";
import { Menu } from "../partials/navigation.jsx";
import { Footer } from "../partials/footer.jsx";

export function Layout({ route, meta, assets, navigation, children }) {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <link rel="canonical" href={meta.canonical} />
        <script src={assets.head}></script>
        <link rel="stylesheet" href={assets.css} />
        <script type="module" src={assets.js}></script>
      </head>
      <body>
        <a class="skip-link" href="#main">Skip to content</a>
        <Preloader />
        <Menu navigation={navigation} />
        <div class="page-transition-overlay" data-transition-host hidden aria-hidden="true"></div>
        <main id="main" data-route={route.key} tabindex="-1">{children}</main>
        <Footer />
        {assets.liveReload && <script type="module" src={assets.liveReload}></script>}
      </body>
    </html>
  );
}
```

```jsx
// views/partials/navigation.jsx
export function Menu({ navigation }) {
  return (
    <nav class="navigation" data-navigation>
      <button type="button" data-navigation-toggle aria-expanded="false">Menu</button>
      <ul data-navigation-panel>
        {navigation.map((item) => (
          <li><a href={item.path} aria-current={item.current}>{item.title}</a></li>
        ))}
      </ul>
    </nav>
  );
}
```

```jsx
// views/pages/about.jsx
import { Layout } from "../layouts/page.jsx";

export default function Page(data) {
  return (
    <Layout {...data}>
      <section class="about">
        <h1 class="about__title" data-about-title data-animation="title">
          {data.route.title}
        </h1>
        <p class="about__body">{data.route.description}</p>
      </section>
    </Layout>
  );
}
```

## Escaping

Every value is escaped by default. Raw HTML is always explicit.

| Renderer | Setting | Raw HTML |
| --- | --- | --- |
| Nunjucks | `autoescape: true` (default) | `{{ html \| safe }}` |
| Vento | `autoescape: true` (off by default; the adapter turns it on) | `{{ html \|> safe }}` |
| JSX | Escapes by default | `raw(html)` from `hono/html` |

## Add a page

The starter ships Home at `/`. Further pages: [PAGE.md](PAGE.md) and `.cursor/skills/front-end-add-page/SKILL.md`.

With `bun run dev` running, a new path works after the save. A route with no page file stops dev and the build with the missing path in the message.

## Developer

`bun run dev` serves `/admin`. The build does not. The page links to the diagnostics that already live elsewhere:

| Link | Page |
| --- | --- |
| `/experiments` | Motion sandboxes. Listed below |
| `/playwright-report/` | This project's Playwright HTML report, after `bun run test:browser` |
| `/admin/setups/` | `../setups/index.html`, the wizard-setup scoreboard, when that folder exists |
| `/admin/codebase` | Load order for this project's files, with links into the docs |
| `http://127.0.0.1:4321/` | The documentation site. Start it with `bun run docs:dev`, or both servers with `bun run dev:docs` |

The docs server listens on `127.0.0.1`, the same host as those links. `docsServer()` in `server/developer/docsUrl.js` supplies that host and port to `server/docs.js`. Binding `localhost` listens on IPv6 only, and these links do not connect.

The wizard copies `server/`, so a created site has the same admin page and the same reference. `bun run build` publishes `dist/` only. The setups link reads `../setups` from the project directory.

## Experiments

An experiment is a dev-only page for trying out motion before it becomes site code. `bun run dev` serves each one at `/experiments/{name}` and lists them all at `/experiments`. The build never publishes them.

| File | Holds |
| --- | --- |
| `index.{ext}` | Markup in the project's renderer syntax. Extends `layouts/experiment.{ext}`, a bare page, or `layouts/page.{ext}` to test with the router, Lenis, and the menu |
| `styles.css` | The same CSS as production. A save swaps the stylesheet |
| `experiment.js` | A `create{Name}(element, { reducedMotion })` function shaped like an effect, plus the call that runs it |
| `NOTES.md` | What was tried, what was kept, and where it was published |

This sample is markup only. It uses `layouts/experiment`, a bare document, so the trial is not wrapped in the menu and the preloader. `data-experiment` is the node the script below queries.

```vto
{{# experiments/split-title/index.vto #}}
{{ layout "layouts/experiment.vto" }}
  <h1 class="split-title" data-experiment>Split title</h1>
{{ /layout }}
```

`createSplitTitle` has the same shape as a published effect: the element, and `{ reducedMotion }`. Under reduced motion it shows the element and returns. Otherwise it splits the heading into characters and staggers them in. The call at the bottom runs it immediately, because an experiment has no page class to call `add()`. The reduced-motion flag is read from `matchMedia` at that call.

```js
// experiments/split-title/experiment.js
import { gsap, SplitText } from "../../app/animations/gsap/gsap.js";

export function createSplitTitle(element, { reducedMotion } = {}) {
  if (reducedMotion) return gsap.set(element, { autoAlpha: 1 });
  const split = SplitText.create(element, { type: "chars" });
  return gsap.from(split.chars, { yPercent: 100, stagger: 0.02, duration: 0.6, ease: "power3.out" });
}

createSplitTitle(document.querySelector("[data-experiment]"), {
  reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
});
```

When the exploration is done, the `front-end-gsap-experiment` skill publishes it as an effect, a component, a partial, and a stylesheet that follow the starter's conventions. The experiment folder stays in git as a record.

## The renderer adapter

Each renderer is one file. Adding a fourth engine means writing this file and its `views/`. `createRenderer` returns the three things the server uses: the file `extension`, `invalidate` so dev can drop a cached compile, and `render(route, data)`, which runs `pages/{route.key}` plus that extension and throws `RenderError` with the template path when the engine fails. `server/renderer.js` is the one line the wizard writes. It re-exports whichever `createRenderer` the site chose, so the rest of the server never imports Nunjucks, Vento, or JSX directly.

```js
// server/renderers/vento.js
import vento from "ventojs";
import { RenderError } from "../document.js";

export function createRenderer({ viewsDir }) {
  const env = vento({ includes: viewsDir, autoescape: true });

  return {
    extension: ".vto",
    invalidate: () => env.cache.clear(),
    async render(route, data) {
      try {
        return (await env.run(`pages/${route.key}.vto`, data)).content;
      } catch (error) {
        throw RenderError.from(error, `pages/${route.key}.vto`);
      }
    },
  };
}
```

```js
// server/renderer.js (the one line the wizard writes)
export { createRenderer } from "./renderers/vento.js";
```

| Renderer | `invalidate()` in dev |
| --- | --- |
| Nunjucks | Nothing; the loader runs with `noCache: true` in dev |
| Vento | `env.cache.clear()` |
| JSX | Deletes the `views/` entries from `require.cache` |

## Commands

| Command | Runs | Use it |
| --- | --- | --- |
| `bun run dev` | `server/dev.js`: renders on request, bundles JS and CSS on save, live reload | While working |
| `bun run dev:docs` | `bun run dev` and `bun run docs:dev` together | While working with the reference open |
| `bun run build` | `server/build.js`: the six build steps above | Before deploy; the host runs it |
| `bun run preview` | `server/preview.js`: serves `dist/` the way the host does | To check a build |
| `bun run lint` | `lint:js`, `lint:css`, then `lint:html` | Before a commit; CI |
| `bun run lint:js` | ESLint on `app/`, `server/`, and `views/**/*.jsx` | |
| `bun run lint:css` | Stylelint on `styles/` | |
| `bun run lint:html` | `server/lint-html.js`: renders every route, runs `assertDocument`, then html-validate | After template changes |
| `bun run format` | Prettier, writing changes | Before a commit |
| `bun run format:check` | Prettier, reporting only | CI |
| `bun run test` | `bun test` | Before a commit; CI |
| `bun run process:image` | `scripts/process-image.js` | When adding images |
| `bun run create <dest>` | `wizard/create.js`: copy the starter and write the chosen options | Starter only. A client site does not have this. [WIZARD.md](WIZARD.md) |
| `bun run docs:dev` | `server/docs.js`, reading the repo markdown | Dev reference, including on a created site. Not part of `dist/` |

## Formatting and linting by engine

Prettier formats every file type. A plugin covers each string engine. Template syntax errors show up when rendering, so `lint:html` renders every route and lints the HTML the browser receives. That works the same for all three engines.

| Renderer | Formatter | Template errors | HTML lint |
| --- | --- | --- | --- |
| Nunjucks | Prettier with `prettier-plugin-nunjucks` | `lint:html` render | html-validate |
| Vento | Prettier with `prettier-plugin-jinja-template` | `lint:html` render | html-validate |
| JSX | Prettier, built in | ESLint and the `lint:html` render | html-validate |

The wizard writes the `.prettierrc` for the chosen renderer. Nunjucks needs only the plugin. Vento needs the plugin plus an override that parses `*.vto` as a Jinja-family template. The html-validate config is the same for every engine, because lint runs on rendered HTML. The ESLint block is added only for JSX, so the linter parses `views/**/*.jsx`.

```json
// .prettierrc for Nunjucks
{ "plugins": ["prettier-plugin-nunjucks"] }
```

```json
// .prettierrc for Vento
{
  "plugins": ["prettier-plugin-jinja-template"],
  "overrides": [{ "files": "*.vto", "options": { "parser": "jinja-template" } }]
}
```

```json
// .htmlvalidate.json for every renderer
{
  "extends": ["html-validate:recommended"],
  "rules": {
    "doctype-style": "off",
    "void-style": "off",
    "attribute-empty-style": "off"
  }
}
```

```js
// eslint.config.mjs, added for JSX
{
  files: ["views/**/*.jsx"],
  languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
}
```

### What the formatter spike found

Each formatter ran on the same templates. Each template was rendered before and after formatting, and the HTML was compared.

- `prettier-plugin-nunjucks` and `prettier-plugin-jinja-template` changed whitespace only. Each settles in one pass on its own engine.
- `prettier-plugin-jinja-template` on Nunjucks needed two passes to settle, which breaks `format:check`. It is used for Vento only.
- Plain Prettier with the HTML parser broke a Nunjucks page and could not parse a Vento tag inside an attribute.
- djLint formats both engines, but it needs Python, uppercases the doctype, and reports valid Vento tags as errors (rule T044).
- html-validate on rendered output caught a missing `alt`, a duplicate `id`, and a button with no `type`, from all three engines.

## Errors in dev

| Error | Where it shows | Recovery |
| --- | --- | --- |
| Template syntax or render error | A 500 page with message, file, and line | Fix and save; the page reloads |
| JavaScript build error | An overlay on the current page | Fix and save; the page reloads with the new code |
| Missing document shell | A 500 page naming the missing part | Fix the layout |
| Missing page file for a route | Dev stops at startup, naming the path | Add the file |
