# Add a page

Copy this when adding a route with its own view, stylesheet, and page class. Terms: [GLOSSARY.md](../../GLOSSARY.md). Verbs: [METHOD_VERBS.md](METHOD_VERBS.md). Lifecycle: [ADR 0004](../adr/0004-boot-loads-page-classes-from-the-page-index.md), [ADR 0011](../adr/0011-base-lifecycle-holds-signal-and-scope.md). Markup: [TEMPLATES.md](TEMPLATES.md). CSS: [STYLES.md](STYLES.md). Motion: [ANIMATIONS.md](ANIMATIONS.md). Accessibility: [ACCESSIBILITY.md](ACCESSIBILITY.md).

The starter ships one of these: Home, at `/`. Extra pages come from `.cursor/skills/add-page/SKILL.md`.

Status: this page describes the accepted starter composition. The running site still has `views/pages/index.html`, the section views, `View.js`, `Introduction.js`, `References.js`, and leftover animation files.

## Files

The starter page:

```
app/config/siteRoutes.js              home: { path: "/", page: "Home", … }
app/config/pages.js                   Home: () => import("../pages/Home.js")
app/pages/Home.js
views/pages/home.{ext}
styles/pages/home.css
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

```js
// app/config/siteRoutes.js
home: {
  path: "/",
  title: "Home",
  description: "The site home.",
  page: "Home",
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

## View

The layout already wraps `{% block content %}` (or the engine's equivalent) in `<main data-route="{{ route.key }}">`. The page file is only the content.

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

```vto
{{# views/pages/about.vto #}}
{{ layout "layouts/page.vto" }}
  <section class="about">
    <h1 class="about__title" data-about-title data-animation="title">{{ route.title }}</h1>
    <p class="about__body">{{ route.description }}</p>
  </section>
{{ /layout }}
```

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

Home is `views/pages/home.{ext}`, route key `home`, path `/`. Do not name it `index`.

## Page class

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
