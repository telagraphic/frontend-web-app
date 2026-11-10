# Frontend Web App

A starter for content-driven client sites built from static pages, with page classes, animations, and page transitions layered on top.

## Pages and routes

**Route**:
One public path the site serves, together with the page class that runs on it.
_Avoid_: page (for a URL), URL entry

**Route key**:
The unique name of a route, such as `home` or `not-found`. Every document carries it as `<main data-route>`.
_Avoid_: slug, route ID, page ID

**Route table**:
The list of every route the site serves, with its page class, public path, title, and optional overlay fields.
_Avoid_: routes map, site settings

**Not-found**:
The route the server renders for an unknown path. Key `not-found`, path `/404`. HTTP 404 keeps the typed URL. Visiting `/404` is this route at 200.
_Avoid_: 404 service, error page (as a class), catch-all router

**Config**:
A list a project edits to choose what a service runs. The route table, the page index, the animation index, the scroll presets, and the transition effect map are config.
_Avoid_: settings, site settings, configuration

**Page**:
The content a visitor sees at one route.
_Avoid_: view, screen, template

**Page class**:
The code that brings a page to life: its animations, components, and lifecycle. Several routes can share one page class.
_Avoid_: class (on its own), controller, view

**Page component**:
A region inside the page. Its markup is in the view, and the page class starts and ends the class that adds its behavior.
_Avoid_: island, widget, hydrated component, partial

**Page index**:
The single list that names every page class and where its code lives.
_Avoid_: registry, page map, loader map

**Current page**:
The running instance of the page class for the page on screen.
_Avoid_: active page, page instance

**Page lifecycle**:
The fixed stages every page class goes through: init, show, hide, and destroy.
_Avoid_: hooks (on their own), page events

**Lifecycle object**:
A page class or component that starts with init and ends with destroy, and holds the abort signal and animation scope for that span. `BasePage` and `Component` both are this.
_Avoid_: owner, disposable, manager, instance

**Element map**:
The `static elements` list a page class or component declares, selected once inside its root when it starts. A string gives one element, and a selector in an array gives every match.
_Avoid_: page object, selector children, DOM cache

**Navigation context**:
What a page class and a layout listener are told about the navigation they're part of: the family (page swap or document load), the route it came from, the route it's going to, and what started it.
_Avoid_: transition data, route info

## Startup

**Service**:
A long-lived object the site needs in order to run, with no markup of its own, such as the router.
_Avoid_: manager, provider, integration

**Layout component**:
A component for markup outside the page template that stays on screen across pages, such as the menu or the preloader. Each project has its own.
_Avoid_: global component, chrome, shell

**Layout listener**:
A reaction `createLayout` attaches to navigation events, with no markup of its own. The starter ships one: focus.
_Avoid_: shell listener, document listener, global listener, service (for this)

**Menu**:
The layout component that opens and closes the site links. The base class is `Navigation`. The starter subclass is `Menu`. A project replaces the markup and the motion. `open` and `close` stay the same.
_Avoid_: hamburger, nav, OverlayMenu, navigation (when you mean page swap or document load)

**Boot**:
The startup that runs once per document load: it sets up services and runs the first page's page class.
_Avoid_: init, bootstrap, app start

**Preloader**:
The screen that covers the first document of a session.
_Avoid_: loader, loading screen, splash

**Preload image**:
An above-the-fold image the cover waits for. Marked `data-preload`.
_Avoid_: lazy image, data-src image

## Navigation

**Page swap**:
A same-document navigation. The router replaces the page inside the current document.
_Avoid_: client swap, SPA mode, SPA navigation, PJAX

**Document load**:
A cross-document navigation. The browser requests and renders a new document.
_Avoid_: full load, MPA mode, hard navigation

## Presentation

**Token**:
A named custom property on `:root` for a color, space, type size, or stacking order.
_Avoid_: Sass variable (for a value a page should share), CSS variable (when you mean the named scale)

**Cascade layer**:
One of the named layers in `styles/styles.css` that controls which stylesheet wins: reset, tokens, base, components, utilities, pages, overrides.
_Avoid_: CSS file (for a layer), specificity hack

**Page transition**:
The animation that covers or connects two pages while one replaces the other.
_Avoid_: transition (on its own), page animation

**GSAP transition**:
A page transition our code animates with GSAP. A plug-in injects markup into a host, covers the page, then reveals the next one.
_Avoid_: overlay transition (as the product name), custom transition, generic transition, page/GSAP transition

**View transition**:
A page transition the browser animates from a snapshot of the old page to the new page, using the View Transitions API. A page swap uses `document.startViewTransition`. A document load uses `@view-transition { navigation: auto }`.
_Avoid_: crossfade, native transition, CSS transition (for this feature)

**Shared element**:
An element that appears on both pages and morphs from its old position to its new one during a view transition.
_Avoid_: hero transition, morph element

## Motion

**Entrance animation**:
Motion that brings a page's content into view, when the page is shown or as elements scroll into view.
_Avoid_: intro, reveal animation, scroll animation

**Leave animation**:
Motion a page plays on its own content when a navigation away from it starts.
_Avoid_: exit animation, outro

**Animation scope**:
Everything one page class, component, or page transition has animated, which ends together when its owner ends.
_Avoid_: registry, animation context, timeline manager

**Effect**:
A reusable motion recipe that any page class or component can apply to its elements.
_Avoid_: preset (for the recipe itself), GSAP effect, animation module

**Animation index**:
The single list that maps each declarative animation type a page can use to its effect.
_Avoid_: animation registry, animation map

## Build

**Setup wizard**:
The starter command that copies this repo into a new folder and writes only the chosen page transition, navigation, and renderer.
_Avoid_: installer, generator, bootstrap

**Wizard setup**:
One created site for a single combination of page transition, navigation, and renderer.
_Avoid_: this project's options, preset, profile

**Starter release**:
A published snapshot of the starter. The setup wizard runs from it to create one new client site.
_Avoid_: installer, upgrade

**Renderer**:
The template engine adapter that turns a route and its data into one complete HTML document. A project has one: Nunjucks, Vento, or JSX.
_Avoid_: template engine (for the adapter), view engine, page generator

**Live reload**:
The dev server reloading the browser when code, templates, or config change. CSS changes swap without a reload.
_Avoid_: hot reload, HMR

**Experiment**:
A dev-only page in `experiments/{name}/` for trying out motion. It is never published. What it proves is published as an effect, component, partial, or stylesheet.
_Avoid_: sandbox, playground, demo, prototype

## Designing modules

These names judge shape. They do not replace Service, Page class, or Layout component in app code.

**Module**:
Anything with an interface and an implementation: a function, a class, a page class, a service, a renderer, a plug-in. _Avoid_: using this word as a folder name or as a substitute for Service or Page class in `app/`

**Interface**:
Everything a caller must know to use a module: methods, order (`init` before `show`), error codes, reduced motion, which events fire. _Avoid_: API, signature (too narrow)

**Implementation**:
What sits behind that interface. _Avoid_: internals (when you mean this)

**Depth**:
How much behaviour a caller gets per fact they must learn. Deep is the goal. _Avoid_: measuring depth as lines of code

**Seam**:
Where the interface lives, so you can change behaviour without editing callers. Constructors, `createRenderer`, `TransitionsService.run`. _Avoid_: boundary

**Adapter**:
A concrete thing that satisfies an interface at a seam. Nunjucks and Vento are adapters of the renderer. Page-swap and document-load navigation are adapters of `navigate`. _Avoid_: wrapper, driver (when you mean this)

**Leverage**:
What callers get from depth: one implementation, many call sites and tests.

**Locality**:
What maintainers get from depth: a change or a bug lives in one place.

## Capabilities

**Integration**:
An outside product capability the site connects to, such as a database, accounts, or payments.
_Avoid_: additional service, third-party service, service (for an outside product)
