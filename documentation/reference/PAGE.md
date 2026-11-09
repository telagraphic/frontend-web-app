# Add a page

Copy this when adding a route with its own view, stylesheet, and page class. Terms: [GLOSSARY.md](../../GLOSSARY.md). Verbs: [METHOD_VERBS.md](METHOD_VERBS.md). Lifecycle: [ADR 0004](../adr/0004-boot-loads-page-classes-from-the-page-index.md), [ADR 0011](../adr/0011-base-lifecycle-holds-signal-and-scope.md). Markup: [TEMPLATES.md](TEMPLATES.md). Regions inside the page: [PAGE_COMPONENTS.md](PAGE_COMPONENTS.md). CSS: [STYLES.md](STYLES.md). Motion: [ANIMATIONS.md](ANIMATIONS.md). Accessibility: [ACCESSIBILITY.md](ACCESSIBILITY.md).

The starter ships Home at `/` and not-found at `/404` (ADR 0025). Extra pages come from `.cursor/skills/add-page/SKILL.md`.

Status: slice 8 ships Home and not-found. Extra pages come from the add-page skill.

## Files

Starter pages:

```
app/config/siteRoutes.js              home, not-found
app/config/pages.js                   Home, Page
app/pages/Home.js
app/pages/Page.js                     not-found uses this; no NotFound.js
views/pages/home.{ext}
views/pages/not-found.{ext}
styles/pages/home.css
styles/pages/not-found.css
```

An extra route, key `about`:

```
app/config/siteRoutes.js              add the route
app/config/pages.js                   one import() if this class is new
app/pages/About.js                    default export, extends BasePage
views/pages/about.{ext}               Nunjucks .njk, Vento .vto, or JSX .jsx
styles/pages/about.css                imported from styles/styles.css
```

Read the extension from `server/renderer.js`. A route that needs no custom behavior can set `page: "Page"` and skip the class file. Home keeps a class so a new site has one to copy.

## Route

A route entry is the public URL plus the fields the document and the router need: `path`, `title`, `description`, and `page`. `page` names a key in the page index. The index holds one dynamic `import()` per class, so the bundler emits a separate chunk for each page class (ADR 0004). Several routes can share the `Page` key when they need no custom behavior.

```js
// app/config/siteRoutes.js
home: {
  path: "/",
  title: "Home",
  description: "The site home.",
  page: "Home",
},
"not-found": {
  path: "/404",
  title: "Page not found",
  description: "This URL is not a route.",
  page: "Page",
},
about: {
  path: "/about",
  title: "About",
  description: "About this site.",
  page: "About",
},
```

```js
// app/config/pages.js
Page: () => import("../pages/Page.js"),
Home: () => import("../pages/Home.js"),
About: () => import("../pages/About.js"),
```

`page` is the key in the page index, not the file's export name. Every page class is a default export.

## Names

One route key. The page class, the view, the stylesheet, and the CSS block all use it. A view-transition name is built from the same part, so each snapshot has that name once.

| Piece | Form | `about` | `not-found` |
| --- | --- | --- | --- |
| Route key | kebab-case | `about` | `not-found` |
| Page class | PascalCase | `About` | `Page` (shared; there is no `NotFound`) |
| Files | key or class | `views/pages/about.njk`, `styles/pages/about.css`, `app/pages/About.js` | `views/pages/not-found.njk`, `styles/pages/not-found.css`, `app/pages/Page.js` |
| Root inside `<main>` | the route key | `<section class="about">` | `<section class="not-found">` |
| Part | `{block}__{part}` | `about__title`, `about__body` | `not-found__title`, `not-found__body` |
| Hook the class selects | `data-{route}-{part}` | `data-about-title` | `data-not-found-title` |
| `static elements` | the part | `title: "[data-about-title]"` | the shared `Page` class selects nothing |
| Page CSS | `main[data-route="…"]` | `main[data-route="about"] .about__title` | `main[data-route="not-found"] .not-found__title` |
| View-transition name | `{part}-{route key}` | `title-about` | `title-not-found` |
| Chrome that stays outside `<main>` | `chrome-{role}` | `chrome-nav` on `[data-navigation]` | same name; the menu does not swap |
| GSAP overlay | the plug-in block | `wipe`, `wipe__copy`, `wipe__image` | the overlay is not a page block |

A hyphenated key stays hyphenated in the class, the data hook, and the transition name. The class for `work-item` is `WorkItem`. The block is `work-item`, the hook is `data-work-item-title`, and the view-transition name is `title-work-item`.

`internal-link`, `data-animation`, and `data-preload` are shared behavior. They are not the page block.

The root class is the route key. `page-content` is not a page block.

View-transition names live in `styles/components/view-transition.css`, scoped with `main[data-route="…"]`, and only on the view-transition path. A GSAP overlay does not get a `view-transition-name`. Chrome that both pages share uses one fixed name (`chrome-nav`), because the menu is outside the swap. A page part keeps the route in its name (`title-home`, `title-about`), so the two titles do not pair. Give both pages the same name, once in each snapshot, only when that part should move from one page into the other.

Home is the copy: `section.home`, `home__title`, `data-home-title`, `title-home`, class `Home`.

## View

The layout already wraps `{% block content %}` (or the engine's equivalent) in `<main data-route="{{ route.key }}">`. The page file is only the content. The three files below are that same about page. Each one extends the document layout and fills the content block. `data-about-title` is the hook the page class selects. `data-animation="title"` is the declarative effect from the animation index.

Nunjucks extends the layout with `{% extends %}` and fills `{% block content %}`.

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

Vento wraps the page body with `{{ layout }}`. The body becomes `{{ content }}` inside the layout.

```vto
{{# views/pages/about.vto #}}
{{ layout "layouts/page.vto" }}
  <section class="about">
    <h1 class="about__title" data-about-title data-animation="title">{{ route.title }}</h1>
    <p class="about__body">{{ route.description }}</p>
  </section>
{{ /layout }}
```

JSX is a function that receives the template data and returns the layout with the page content as `children`. Use `class`, not `className`. The function runs at build time.

```jsx
// views/pages/about.jsx
import { Layout } from "../layouts/page.jsx";

export default function About(data) {
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

Home is `views/pages/home.{ext}`, route key `home`, path `/`. Do not name it `index`. Not-found is `views/pages/not-found.{ext}`, route key `not-found`, path `/404` (ADR 0025).

## Page class

The class is the route's behavior. It extends `BasePage`, lists the nodes it uses in `static elements`, and does its work in `onInit`. By the time `onInit` runs, the base has selected those nodes, opened an abort signal, and created the animation scope. Motion goes through `this.animations.add`. Listeners take `{ signal: this.signal }`.

```js
// app/pages/About.js
import BasePage from "./BasePage.js";

export default class About extends BasePage {
  static elements = {
    title: "[data-about-title]",
  };

  onInit() {
    // Motion: this.animations.add(({ reducedMotion }) => { … })
    // Listeners: addEventListener(..., { signal: this.signal })
  }
}
```

The root is `main[data-route]` (ADR 0021). Look up elements only inside it (ADR 0022). Do not import GSAP to get a scope. Do not call `create`, `setup`, or `super.create()`.

## Styles

Page rules live in `styles/pages/{key}.css`. The selector starts at `main[data-route="…"]`, so the rules apply while that route's attributes are on `<main>` and drop away after a swap replaces those attributes. One `@import` in `styles/styles.css` puts the file in the `pages` layer, which wins over components and loses to overrides.

```css
/* styles/pages/about.css */
main[data-route="about"] .about {
  padding-block: var(--space-12);
}

main[data-route="about"] .about__title {
  font-size: var(--font-size-3);
}
```

```css
/* styles/styles.css — add one line */
@import "./pages/about.css" layer(pages);
```

Full BEM names. No `&__title`. No Sass. A modern feature you have not used yet goes through [write-css](../../.cursor/skills/write-css/SKILL.md).

## What the starter does not ship

`View.js`, `Introduction.js`, and `References.js` leave with the client site. `Titles.js`, `BackgroundColors.js`, and `FadeInAndOut.js` are not page classes; they are replaced by an effect, `data-background` / `data-color`, and the GSAP transition plug-in. Preloader motion lives on the preloader, not under `app/animations/`.
