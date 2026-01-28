# MPA Setup (Bootstrapping + Page Loading)

This project runs as a **Multi-Page Application (MPA)**, but it uses a shared JavaScript entry to keep initialization consistent across every page.

The key idea is:

- Every HTML page includes the same entry module (`app/App.js`).
- `App.js` determines which page class to load by reading `main[data-template]`.
- The page’s JavaScript is **dynamically imported** so only the code needed for the current page is loaded.
- Shared services are created once (module singleton), without storing state on `window`.

---

## What each HTML page provides

Each page’s markup must include a `<main>` element with a `data-template` value:

```html
<main class="home" data-template="home">
  ...
</main>
```

That `data-template` string is the **bootstrap key** used to select the correct page module/class.

---

## The bootstrap flow (what happens on every page load)

### 1) `App.js` runs on DOM ready

`app/App.js` waits for DOM readiness (`whenDOMReady`) and then calls `app.init()`.

### 2) Services are created once (no `window.*` globals)

`app/services/ServiceFactory.js` exports:

- `createServices()`: constructs and wires services
- `createServicesOnce()`: module-level singleton wrapper (returns the same instance for the current document)

`App.js` uses `createServicesOnce()` so all consumers share one services instance without using `window.appServices`.

### 3) `App.js` determines the current page “template”

`App.js` reads:

- `document.querySelector('main[data-template]')`
- `template = main.getAttribute('data-template')`

### 4) `SiteConfig` maps template → page class

Routes are centrally defined in `app/config/siteRoutes.js` and used by `app/config/SiteConfig.js`.

Important detail:

- `siteRoutes` is keyed by **URL path** (`'/'`, `'/introduction'`, etc.)
- Bootstrapping uses **template**, so `SiteConfig` provides template-based lookups:
  - `getByTemplate(template)`
  - `getClassByTemplate(template)`

### 5) The page module is dynamically imported

Once the class name is known (example: `"Home"`, `"Introduction"`, `"View"`), `App.js` imports the module at runtime:

- Base path comes from `setupPageConfig().pagePath` (see `app/config/Environment.js`)
- Module is resolved as: `${pagePath}${className}.js`

Then `App.js` resolves the exported class as:

- `module.default` (if present), otherwise
- `module[className]`

### 6) The page instance is constructed and lifecycle runs

Finally, `App.js` constructs the page class and runs:

- `await page.create()`
- `await page.show()`

For template-driven pages using `View`, `App.js` passes a template selector so the instance targets the correct DOM root:

- `element: .${template}` (example: `.section-1`)

---

## Why `views/partials/page-init.html` is now empty

Historically, `views/partials/page-init.html` contained conditional logic to import and instantiate a page class per route, and it also read/wrote `window.appServices`.

That logic is now centralized in `App.js`, so:

- `page-init.html` should contain **no JS bootstrapping**
- `views/layouts/page.html` no longer includes `page-init.html`

This removes duplicated initialization paths and avoids global state.

---

## Adding a new page

### 1) Add a route config entry

In `app/config/siteRoutes.js`, add a route entry with a unique `template` and a `class`:

- **`template`** must match `main[data-template]` in the HTML
- **`class`** must match the filename and exported class name in `app/pages/`

Example shape:

- `template: "my-page"`
- `class: "MyPage"`

### 2) Create the page module

Create `app/pages/MyPage.js` and export the class (named export is fine; default export also works).

### 3) Ensure the HTML uses the template

Make sure the page’s `<main>` includes:

- `data-template="my-page"`

---

## Troubleshooting

- **“no page class for template: X”**
  - `main[data-template]` is missing, or
  - `siteRoutes` has no entry with `template: X`, or
  - the template key is misspelled between HTML and `siteRoutes`

- **“failed to resolve export for ClassName”**
  - `app/pages/ClassName.js` doesn’t exist at the resolved path, or
  - the module doesn’t export `ClassName` (and has no default export)

---

## Verification checklist

Run:

```bash
bun run dev
```

Manual:

- Load `/` → imports `Home` and runs `create()` + `show()`
- Load `/introduction` → imports `Introduction`
- Load a section page (e.g. `/section-1`) → imports `View` with `element: .section-1`
