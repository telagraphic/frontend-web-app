---
status: accepted
---

# A page swap replaces the children of `<main data-route>`

The page swap used two class names for unrelated jobs. The router took `section.page-template` from the fetched document. Page classes kept `.page-content` as a wrapper, and no stylesheet used it. `main[data-template]` held a name that was not always the route key: `index.html` said `home`. After each swap, the router also rewrote a class on `<main>` and `body[data-page]` with the same value. The glossary avoids "template" for a page.

## Decisions

- `<main id="main" data-route="{route key}" tabindex="-1">` is the only page swap hook. Every document has exactly one. `id` and `tabindex` stay on the live node. RouterSwap copies only `data-*` attributes and replaces children.
- On a swap, the router replaces the children of the current `<main>` with the children of the fetched `<main>`. It removes the current `data-*` attributes from `<main>` and copies the fetched ones. Everything outside `<main>` stays: the menu, the preloader, `[data-transition-host]`, and the footer.
- `data-background` and `data-color` on `<main>` are the page's theme. They travel with the other `data-*` attributes.
- The router copies `<title>`, `meta[name="description"]`, and `link[rel="canonical"]` from the fetched document. That replaces setting them from the route record (ADR 0001, action 8), because the document already has the values `server/data.js` computed (ADR 0020).
- `.page-template`, the required `.page-content` section, `body[data-page]`, and the class the router wrote on `<main>` go away. `.page-content` can stay as ordinary page markup.
- CSS that styles a page's own content uses `main[data-route="about"]`. CSS that styles a layout component per page uses `body:has(main[data-route="home"]) .footer`.
- Scripts inside `<main>` do not run after a swap. Page behavior belongs in the page class.
- `assertDocument()` checks for one `main[data-route]` whose value is the route key (ADR 0020).
- The full sequence is in [PAGE_SWAP.md](../reference/PAGE_SWAP.md).

## Considered Options

- **Keep an inner section as the swap root.** It needs a second name that every page must remember, and gains nothing over the children of `<main>`.
- **Mirror the route key onto `<body>` or `<html>` for CSS.** Two attributes would hold one value and could disagree. `:has()` reads the one on `<main>`.
- **Keep `data-template`.** It names a template, not the route key the rest of the code uses.

## Consequences

- `navigation.css` and `footer.css` move from `[data-page…]` selectors to `body:has(main[data-route…])`.
- `SELECTORS.PAGE_CONTENT`, `SELECTORS.MAIN_WITH_TEMPLATE`, `ATTRIBUTES.DATA_TEMPLATE`, and `ATTRIBUTES.DATA_PAGE` become `SELECTORS.MAIN` and `ATTRIBUTES.DATA_ROUTE`.
- Every view sets `data-route` from `route.key`. The renderer layouts already pass it.
