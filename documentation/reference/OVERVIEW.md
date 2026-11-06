# Building blocks

High-level map of the starter: what each part is for, the technique it uses, and where that technique shows up in other tools. Terms: [GLOSSARY.md](../../GLOSSARY.md). Verbs: [METHOD_VERBS.md](METHOD_VERBS.md). Depth and seams: [MODULES.md](MODULES.md). Deep pages sit beside this one in Reference.

Every site is **documents first**. The server renders a complete HTML file per route. JavaScript then **enhances** that document: boot, page classes, motion, and optional page swap. Direct visit, reload, and share always work.

Boot order: `createServices()`, then `createLayout(services)`, then the first page class `init` / `show` (ADR 0007).

## Renderer

A **renderer** turns a route and its data into one HTML document. The project picks Nunjucks, Vento, or JSX once ([TEMPLATES.md](TEMPLATES.md)).

Technique: one template engine, layouts and partials, data computed in `server/data.js` rather than in each view. Production writes static files. Dev renders on request.

If you know Eleventy or Astro: same idea — choose a template language, emit documents. JSX here runs at build time only. The browser never hydrates a framework tree.

## Route table and page index

The **route table** lists every public path, its title, and which page class runs on it. The **page index** is one literal `import()` per page class, so the bundler splits each class into its own chunk ([PAGE.md](PAGE.md), ADR 0004).

Technique: config as data, not file-system routing. The route names the class. Several routes can share `Page`.

If you know Remix route modules, or Next.js `page.tsx` files: a route still maps to a module. Here the map is `app/config/siteRoutes.js` plus `app/config/pages.js`, not a folder convention. There is no registry service.

## Services factory

`createServices()` is the **composition root** for services. It returns `{ router, animationsService, transitionsService, smoothScroll }` ([SERVICES.md](SERVICES.md), ADR 0006). The route table is constructed there and held by the router. Navigation is built by `createLayout()`.

Technique: a factory function that constructs each service after the services it depends on, passing only what that constructor uses. No DI container, no service locator, no setters.

If you know Nest or Angular providers: same “wire at the edge” instinct. The whole graph is one readable function. Tests pass fakes through constructors (ADR 0008).

## Page classes and lifecycle

A **page class** brings a route’s content to life. Every class extends `BasePage`. The router (or boot) calls four stages: `init`, `show`, `hide`, `destroy`. Subclasses implement `onInit`, `onShow`, `onHide`, `onDestroy` ([PAGE.md](PAGE.md), ADR 0005, ADR 0011).

Technique: template method. The base owns signal, animation scope, and `this.use(child)`. Hooks are event-type (`on*`), not extra stages.

If you know Vue `onMounted` / `onUnmounted`, Svelte `onMount` / `onDestroy`, or old React class `componentDidMount`: same span of “this view is on screen.” The difference is a class the navigation layer calls, not a virtual-DOM component.

## Element map

A page class or component declares `static elements`. `BaseLifecycle` selects those nodes once, inside its root ([DOM.md](DOM.md), ADR 0022).

Technique: declare selectors next to the class that uses them. A string is one node; an array is every match. The page root is `main[data-route]`.

If you know Stimulus targets, Lit `@query`, or Vue template refs: same “name the nodes this unit owns.” No page-wide jQuery bag.

## Layout components and custom elements

A **layout component** owns markup outside the page: menu, preloader, footer. `createLayout(services)` constructs the project’s list ([LAYOUT_COMPONENTS.md](LAYOUT_COMPONENTS.md), ADR 0007). Page-local widgets are `Component` subclasses the page `use()`s.

Technique: the same lifecycle shell as pages (`init` / `destroy`, signal, scope). Custom elements the browser constructs import an animation scope directly (ADR 0009). The starter ships classes. A project may add custom elements at that seam.

If you know Lit or other Web Components: the custom-element path is available. If you know Stimulus controllers: layout components are the long-lived ones; page components die with the page.

## Page swap and document load

**Page swap** replaces the children of `<main>` in the current document. **Document load** lets the browser request a new document ([PAGE_SWAP.md](PAGE_SWAP.md), [PAGE_TRANSITIONS.md](PAGE_TRANSITIONS.md)). The setup wizard picks one (ADR 0002). Both start from the same static files.

Technique: progressive enhancement. Navigation is an option on top of documents, not a replacement for them. The two implementations share `init`, `destroy`, `navigate`, and `navigationstart` / `navigationend`.

If you know Turbo Drive, htmx boosted links, or Astro’s client router: page swap is that family — swap a region, keep the shell. If you know the View Transitions API’s cross-document mode: document load is the browser’s own navigation, optionally animated. Do not call these SPA or MPA.

## Page transitions

A **GSAP transition** is our plug-in: inject markup into a host, cover, commit, reveal. A **view transition** is the browser’s snapshot API. The destination route owns overlay copy and effect name (ADR 0024). `TransitionsService` sequences hide/load/commit around the visual. It does not fetch or swap ([GSAP_TRANSITION.md](GSAP_TRANSITION.md), ADR 0012).

Technique: visual plug-in behind a sequencer. Cover/reveal never own navigation. Document-load view transitions ship neither the service nor the page-swap router.

If you know Barba hooks: those mixed fetch into the animation. Here the router still sequences; the plug-in only paints. If you know `document.startViewTransition`, or Astro `<ViewTransitions />`: that is the view-transition family.

## Animations

**AnimationsService** is the only connection to GSAP. Each page class, component, and transition plug-in gets an **animation scope** that records what it creates and reverts it on `destroy`. Declarative types use `data-animation` plus the **animation index**. Sequenced motion is GSAP; layout and rest states are CSS ([ANIMATIONS.md](ANIMATIONS.md), ADR 0009).

Technique: owner-scoped cleanup. `add(build)` runs inside `gsap.matchMedia`. Reduced motion is a zero-duration path, not a missing path.

If you know `gsap.context()` or React `useGSAP`: the scope is that cleanup boundary, one per lifecycle object, not one global timeline manager.

## Images

Above-the-fold images carry `data-preload` and a real `src`. The cover waits on them through `loadImages`. Below-the-fold images use `loading="lazy"`. There is no runtime image service in the target design ([IMAGES.md](IMAGES.md), ADR 0018).

Technique: markup strategy plus one wait helper. Decode-before-reveal for the set that holds the cover. The browser loads the rest.

If you know `next/image` or Astro `<Image />`: those are build-time pipelines. This starter waits on a marked set at runtime and leaves resizing to `process-image` when you add a file.

## Preloader

The **preloader** covers the first document of a tab session, waits for fonts and `[data-preload]` images (or `maxWait`), then hides. Page `show` runs after that. Later document loads do not paint it. A GSAP document-load cover also skips it ([SERVICES.md](SERVICES.md), ADR 0014).

Technique: a layout component plus a blocking external head script that sets `is-loading` before first paint. A `sessionStorage` flag remembers the session. CSS hides preload images and entrance animation until the cover lifts.

If you know intro loaders in Barba or WebGL first-load screens: same job, tied to boot and to `show`, not to every navigation.

## Smooth scroll

**Smooth scroll** wraps Lenis. It is constructed for both navigation options. `stop` / `start` pause it (menu, preloader). `refresh` runs after a page’s `init`. It never imports GSAP; `AnimationsService` hands it `gsap.ticker` when both exist (ADR 0016).

Technique: one service in the factory, not a plugin each page constructs. Window resize refreshes only when **width** changes.

If you know Lenis, Lenis+ScrollTrigger, or Locomotive Scroll: same library choice, owned by boot so a page swap does not create a second instance.

## Abort signal

Every listener and fetch takes `{ signal: this.signal }`. `destroy` aborts the controller (ADR 0010).

Technique: one signal per lifecycle object. Cleanup does not depend on remembering `removeEventListener`.

If you know `AbortController` on `fetch`, or Vue `onUnmounted` teardown: same cancel-on-leave. Here it is the default for DOM listeners too, not only HTTP.

## Events upward

The router dispatches `navigationstart` and `navigationend` on itself. The menu (a layout component) and focus (a layout listener) listen. Services never import layout components ([SERVICES.md](SERVICES.md), ADR 0006).

Technique: events travel up a layer. Dependencies only point down.

If you know a DOM `EventTarget`, or a tiny emitter: one object, two event names, no global bus.

## Child lifecycle

`this.use(child)` inits a child and destroys it with the parent (ADR 0011).

Technique: composition of lifecycle objects. A page does not keep a manual list of widgets to tear down.

If you know React children unmounting with the parent, or a scene graph: the parent owns the span.

## Page services

A page class receives only the **page services**: animations and smooth scroll. It does not receive the factory or the router ([SERVICES.md](SERVICES.md)).

Technique: a narrow constructor. Tests fake two objects, not thirteen.

## Config lists

The route table, page index, animation index, scroll presets, and transition effect map live in `app/config/` as data (ADR 0015).

Technique: edit a list, not a service class, to add a route, an effect, or a scroll feel.

If you know a framework `routes.ts` plus a plugin registry: several small maps, each with one job.

## CSS layers and tokens

Production CSS is layered files: reset, tokens, base, components, utilities, pages, overrides. BEM names are written in full. Bun bundles `@import` ([STYLES.md](STYLES.md), ADR 0023).

Technique: the cascade is explicit. Tokens on `:root`. GSAP owns sequenced motion; CSS owns layout and rest.

If you know CSS Cascade Layers, or design tokens in a theme file: that is the system. Not Sass, not utility soup.

## Failures by layer

A service `init` that throws stops boot. A layout `init` that throws is skipped. A page hook that throws falls back to a document load (ADR 0007).

Technique: the static document stays readable. Errors have codes (`SERVICE_INIT_FAILED`, `COMPONENT_INIT_FAILED`, `PAGE_HOOK_FAILED`).

## Head script and CSP

`app/head.js` is an external file before the CSS. It sets `is-loading` and the GSAP cover flag before first paint. Flags become a class on `html`. Do not add a third protocol for prefetch. The CSP has no `'unsafe-inline'` (ADR 0014, ADR 0020).

Technique: first-paint flags cannot live in the app bundle. The host sends CSP in production; dev sends the same policy as a header.

## Prefetch

Page swap prefetches HTML on hover and focus into the router’s in-memory cache. GSAP `cover` waits on that same load; it does not fetch on its own. Document load does not read that cache. A GSAP document load may HTTP-prefetch the next URL during cover (ADR 0002). A view-transition document load uses Speculation Rules ([PAGE_TRANSITIONS.md](PAGE_TRANSITIONS.md)). Do not add a NextDocument module until a second in-process adapter exists.

Technique: the next document is warm before the click finishes. Prefetch never holds the cover.

## Reduced motion

The animation scope rebuilds with duration `0` when `prefers-reduced-motion: reduce` matches. CSS has a floor. The head script skips the preloader cover (ADR 0009, ADR 0014).

## Accessibility

The document contract includes a skip link, `main#main` with `tabindex="-1"`, native links and buttons, and `inert` on chrome while the preloader is up. Page swap announces by updating `<title>` and moving focus. Details: [ACCESSIBILITY.md](ACCESSIBILITY.md).

Technique: platform defaults. Keyboard and screen-reader paths are in the layout, not a later pass.

Technique: a real path, not a missing animation. Content is visible either way.

## Experiments

An experiment is a dev-only page at `/experiments/{name}`. The build never publishes it. Publishing copies what you kept into views, styles, and app code ([TEMPLATES.md](TEMPLATES.md)).

Technique: try motion beside the site, then promote it. Home stays a bootstrap page.

## Document contract

`assertDocument()` checks each rendered document: `html[lang]`, skip link, one `main#main[data-route][tabindex="-1"]`, menu, preloader, overlay host only on the GSAP path ([TEMPLATES.md](TEMPLATES.md), [ACCESSIBILITY.md](ACCESSIBILITY.md)).

Technique: page swap and document load share one shell. A missing part fails dev and the build, not the first click.

## Method verbs

Every method name starts with a verb from the table: `init` / `destroy`, `show` / `hide`, `create*`, `start` / `stop`, and the rest. The full table is [METHOD_VERBS.md](METHOD_VERBS.md).

Technique: one opposite for each verb that begins something, so the undo is findable. Retired verbs (`setup`, `teardown`, `lock`) stay retired.
