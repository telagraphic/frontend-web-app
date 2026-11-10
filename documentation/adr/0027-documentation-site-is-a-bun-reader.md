---
status: accepted
---

# The documentation site is a Bun reader, not a Starlight app

ADR 0003 publishes one reference from the markdown that already lives in the repo. The first reader was an Astro Starlight app in `docs/`. That install was about 193MB: Astro, Vite, Starlight, Pagefind, and Shiki. The pages never used Starlight's components (asides, tabs, steps, file trees, cards). The custom pieces were a content loader, because Astro wants files inside `docs/`, and a remark plugin that rewrote repo links. The Geist gray tokens and the admin pages were already the same palette. Search and syntax coloring are replaceable. The chrome Starlight was supplying is a header, a page list, a table of contents, and search.

The reference is now `bun server/docs.js`, still `bun run docs:dev`, still `http://127.0.0.1:4321/`. It reads the same files on request and renders them to HTML. The browser script is plain JavaScript. There is no second `package.json` and no docs build. The site build still does not publish the reference.

## Layout

The header is a centered shortcut line at the top of the page: (M) Menu opens the page list, and ⌘ + K or Ctrl + K opens search. The page is two columns: the article, and the current page's headings on the right. The section list (Start, Glossary, Reference, Skills, Decisions) is not a permanent left column. It is a full-screen overlay in a gray set apart from the page. The links inside it are the width of the two-column layout, lined up with the article. `M` toggles it. Command-K or Ctrl-K opens a search palette near the top of the page. The palette keeps one width: a search field and the results live in the same card. Search lists the current page's headings and the other pages. A query also matches body text and shows an excerpt, which is the result Pagefind was producing, without a search-index build. Regions are separated with the Geist gray tokens and space. Rules are not used as dividers.

## Considered Options

- **Keep Starlight.** The install is the cost, and the only part in use was chrome we can draw ourselves.
- **Copy the markdown into a content tree.** Rejected in ADR 0003. A second tree goes stale.
- **Add Pagefind or Shiki.** The corpus is small enough to search in the browser. Code blocks stay in Geist Mono. A highlighter would put a large install back.
- **Serve the reference from the site dev server under `/admin`.** The admin links and a created site already use port 4321. A separate process keeps the reference off `dist/`.

## Consequences

- `docs/` is gone. Create no longer runs `bun install --cwd docs`.
- There is no `docs:build` or `docs:preview`. CI does not build a docs bundle.
- Geist and Geist Mono come from the root install, shared with `/admin`.
- The content map in ADR 0003 is unchanged. ADR 0013's Skills section is the same list, served by this reader.
