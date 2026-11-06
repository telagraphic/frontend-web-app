---
status: accepted
---

# Boot loads page classes through the route table and a page index

Boot is the first building block of every site the starter creates, under both page swap and document load. Each route in the route table names its page class with a `page` field, such as `page: "Page"`. One page index holds a single `import()` per page class, and the bundler splits each page class into its own chunk. We chose this over building import paths from strings because Bun's bundler only follows `import()` calls with a literal path. A built path ships the page files unbundled, which is why `scripts/build-pages.js` and the production path check exist today.

## Decisions

- Boot owns the first page: it sets up services, creates and shows the current page, and starts the router. The router handles only the navigations after that.
- Every page class file uses a default export, so loading a page class never depends on its export name.
- Every page class extends `BasePage`. `Page` is the generic page class for routes with no custom behavior. It replaces `View`, whose name clashed with view transition. The starter ships `Home` as the one sample subclass, so a new site has a page class to copy. Further classes come from [PAGE.md](../reference/PAGE.md).
- On a first visit, entrance animations wait until the preloader has hidden (ADR 0014).
- A failed boot leaves the static page readable.

## Considered Options

| Option | Why not |
| --- | --- |
| One loader function that builds the path from the page name | Bun doesn't bundle or split built paths, so the page files ship unbundled and need their own build step |
| An `import()` on every route-table entry | Repeats the same import for every route that shares a page class; 15 routes share `Page` |
| Importing every page class up front | Every page pays for every other page's code on the first visit |
| A build plugin that generates the page index from `app/pages/` | Removes a few hand-written lines but adds a plugin to the dev server and the build, and the index can't be read in the repo |

## Consequences

- Adding a page class means adding one line to the page index. Adding a route for an existing page class only touches the route table.
- A route whose `page` isn't in the page index fails a check at boot and in CI, not at click time.
- The JavaScript build adds `--splitting --format esm`. `scripts/build-pages.js`, the page path setting, and the string-based page import go away.
- The router owns the current page, because it's the only thing that changes it. `RegistryService` goes away, since the page index replaces its page class map.
- The dev server bundles every page class into one file, so splitting only shows up in production builds.
- The route table stays plain data. The static-page and sitemap scripts import it without loading any page code.
- If boot fails, neither the preloader nor content waiting for an entrance animation can be left covering the page.
