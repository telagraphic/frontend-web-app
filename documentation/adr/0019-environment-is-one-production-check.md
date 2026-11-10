---
status: accepted
---

# Environment is one production check, and the origin is config

`Environment.js` sniffed the `App.js` script URL, built a string path for page imports, called `import.meta.hot.accept()` on itself, and returned a hard-coded origin. The string import cannot be split (ADR 0004). Accepting hot updates inside this module does not dispose the running app (ADR 0009). The origin belongs in config.

## Decisions

- `isProduction()` is `NODE_ENV === "production"` or `BUN_ENV === "production"`. The production build sets that variable. Dev does not, so an unbundled page is development. The script-URL scan goes away.
- `server/dev.js` and `server/build.js` import that function (ADR 0020). They do not copy the check.
- The canonical origin lives in `app/config/site.js`. A project edits it. `SITE_BASE_URL` still overrides it in the HTML and sitemap scripts.
- `setupPageConfig()` goes away with the string page import. `App.js` does not keep a `pageConfig`.
- `liveReload()` goes away. Dev reloads the page through live reload (ADR 0020). `App.js` does not use `import.meta.hot`.
- The file moves to `app/utilities/environment.js` and exports `isProduction` only.

## Considered Options

- **Caching the boolean, or making environment a service.** The check runs a handful of times at startup and during the build. A class would not make the app faster.
- **Reading `import.meta.env`, as Vite does.** This starter builds with Bun. The variables the scripts already set are the check.
