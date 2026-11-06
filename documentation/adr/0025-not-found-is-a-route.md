---
status: accepted
---

# Not-found is a route and a view, not a service

Unknown paths currently fall through or redirect home. A starter must ship a real 404 document so a mistyped URL is still a complete page: layout, skip link, and `data-route`. That is a route in the table, not a factory service and not a special router class.

## Decisions

- Route key `not-found`. Public path `/404`. View `views/pages/not-found.{ext}`. Styles `styles/pages/not-found.css`. Page class is `Page` (no `NotFound.js`).
- The route is in the route table. `server/data.js` omits it from the `navigation` list. `assertDocument()` checks it like every other route.
- An unknown same-origin path is **not** intercepted by page swap (ADR 0001 action 5). The browser loads it. The server renders the not-found document with HTTP 404. The address bar keeps the unknown path. `<main data-route="not-found">`.
- A direct visit to `/404` is the route itself and returns 200.
- Production `toSSG` writes the `/404` file from the route table and also `dist/404.html` (same document) so hosts that look for that name work. Dev `app.notFound()` renders the same view with status 404.
- A page-swap fetch or parse failure still `location.assign(url)` (ADR 0001). That is a failed known route, not an unknown path. Do not redirect home.
- The resolver's `not-found` outcome is for a history path that is no longer in the table: `location.assign` so the server 404s. Do not `pushState` onto `/404` and leave the visitor's URL wrong.

## Considered Options

- **Redirect unknown paths to `/`.** The visitor loses the URL they typed and cannot tell the page is missing.
- **A 404 service.** There is no long-lived object. Markup and a route record are enough.
- **Page swap intercepts unknown paths and swaps in the 404 view.** That fights ADR 0001 (the browser owns paths outside the table) and has to fake a URL the server never had.

## Consequences

- The starter ships two pages: Home and not-found. Extra pages still come from the add-page skill.
- Slice 8 writes `views/pages/not-found.{ext}` when Shea pages leave.
- Host `_redirects` does not become a single-page `/* /index.html` fallback. Missing files are 404 documents.
