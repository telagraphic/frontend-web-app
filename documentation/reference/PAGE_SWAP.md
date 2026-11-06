# Page swap

A **page swap** is a same-document navigation. The router fetches the next route's document, replaces what is inside `<main>`, and keeps everything else on screen. The decisions are [ADR 0001](../adr/0001-router-enhances-static-documents.md), [ADR 0005](../adr/0005-router-runs-the-page-lifecycle.md), and [ADR 0021](../adr/0021-page-swap-replaces-the-children-of-main.md). Terms are in [GLOSSARY.md](../../GLOSSARY.md).

Status: this page describes the accepted design. `RouterPageManager.js` still swaps `section.page-template` today.

## What stays and what changes

```
<html>
  <head>
    <title>, meta description, canonical   ← copied from the fetched document
    everything else                         stays
  </head>
  <body>
    skip link                               stays (first focusable)
    preloader                               stays
    menu                                    stays (aria-current updated on navigationend)
    [data-transition-host]                  stays (div, aria-hidden)
    <main id="main" tabindex="-1"           ← id and tabindex stay
          data-route="about"                ← data-* attributes replaced
          data-background="#111"
          data-color="#fff">
      …                                     ← children replaced
    </main>
    footer                                  stays
  </body>
</html>
```

| Part | On a page swap |
| --- | --- |
| Children of `<main>` | Replaced with the fetched `<main>`'s children |
| `data-*` on `<main>` | Current ones removed, fetched ones copied: `data-route`, `data-background`, `data-color`, and any others |
| `id="main"` and `tabindex="-1"` | Stay on the live node |
| Skip link | Stays; first focusable in `<body>` |
| `<title>`, `meta[name="description"]`, `link[rel="canonical"]` | Copied from the fetched document |
| Everything outside `<main>` | Unchanged; layout components keep running |
| `<script>` tags inside the fetched `<main>` | Inserted but never run; page behavior goes in the page class |

## One page swap, in order

```
click on a route link
   │
   ▼
resolve the URL ──── not a route, modifier key, hash, external ──► the browser navigates
   │ a route in the route table
   ▼
navigationstart                         menu closes
   │
   ├──────────────── run together ─────────────────┐
   ▼                                               ▼
current page hide()                       fetch and parse the next document
leave animations + the cover                (prefetched on hover if possible)
   │                                               │
   └───────────────── wait for both ───────────────┘
   │                                   fetch or parse failed ──► location.assign(url)
   ▼
current page destroy()                  abort signal, animation scope reverted
   │
   ▼
swap <main>                             children and data-* attributes
update <head>                           title, description, canonical
history.pushState                       { path, scroll }
   │
   ▼
new page class init()                   static elements selected inside <main>
refresh Lenis and ScrollTrigger
wait for [data-preload] images          raced against maxWait (ADR 0018)
   │
   ▼
reveal                                  the page transition strategy
new page class show()                   entrance animations
focus <main>
navigationend                           menu sets aria-current; focus moves to main
```

Back and forward run the same steps with `history: "traverse"`. They restore the saved scroll position after `show()`. A newer navigation aborts the running one.

## The swap itself

```js
// app/router/swapMain.js
export function swapMain(currentMain, nextMain) {
  for (const { name } of [...currentMain.attributes]) {
    if (name.startsWith("data-")) currentMain.removeAttribute(name);
  }
  for (const { name, value } of nextMain.attributes) {
    if (name.startsWith("data-")) currentMain.setAttribute(name, value);
  }
  currentMain.replaceChildren(...nextMain.childNodes);
}

export function updateHead(nextDocument) {
  document.title = nextDocument.title;
  for (const selector of ['meta[name="description"]', 'link[rel="canonical"]']) {
    const next = nextDocument.head.querySelector(selector);
    document.head.querySelector(selector)?.replaceWith(next ?? "");
  }
}
```

## Markup a page provides

Every view puts its content inside the layout's `<main>`. The layout sets `data-route` from `route.key`. A page sets its theme with `data-background` and `data-color`.

```njk
{# views/layouts/page.njk #}
<main
  id="main"
  tabindex="-1"
  data-route="{{ route.key }}"
  data-background="{{ route.background }}"
  data-color="{{ route.color }}"
>
  {% block content %}{% endblock %}
</main>
```

```njk
{# views/pages/about.njk #}
{% extends "layouts/page.njk" %}
{% block content %}
  <section class="page-content">
    <h1 data-animation="title">{{ route.title }}</h1>
  </section>
{% endblock %}
```

The `section.page-content` wrapper is ordinary markup. The router does not look for it.

## Styling per page

| You want to style | Selector |
| --- | --- |
| A page's own content | `main[data-route="about"] .page-content` |
| A layout component on one page | `body:has(main[data-route="home"]) .footer` |
| A layout component on a group of pages | `body:has(main[data-route^="section-"]) .footer` |

`:has()` reads the same attribute the router updates, so no second copy of the route key is needed on `<body>`. The rest of the CSS rules are in [STYLES.md](STYLES.md).

## Page swap and document load

Both navigation options use the same documents (ADR 0020).

| | Page swap | Document load |
| --- | --- | --- |
| What the browser loads | The next document, by `fetch` | The next document, as a navigation |
| What is replaced | Children and `data-*` of `<main>`, plus title, description, canonical | The whole document |
| Layout components | Keep running | Boot again |
| Page lifecycle | `hide`, `destroy`, then `init` and `show` | `init` and `show` on the new document |
| On failure | Falls back to a document load | The browser's error page |

## When a swap goes wrong

| Symptom | Likely cause |
| --- | --- |
| The router falls back to a document load on every click | The fetched document has no `main[data-route]`, or the fetch failed |
| The footer keeps the previous page's style | The CSS still targets `body[data-page]`, which no longer changes |
| A script in the page markup does nothing after a swap | Scripts in `<main>` are not run; move the code to the page class |
| `this.elements` keys are `null` after a swap | The selector is outside `<main>`; layout components select their own elements |
