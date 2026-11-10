import {
  docsMenu,
  loadDocsPages,
  normalizeDocsPath,
  slugFromId,
} from "./docsCatalog.js";
import { escapeHtml } from "./docsRender.js";
import { developerFontFaceCss } from "./theme.js";

export async function docsSearchIndex() {
  const pages = await loadDocsPages();
  return pages.map(({ id, href, title, section, headings, text }) => ({
    id,
    href,
    title,
    section,
    headings,
    text,
  }));
}

export async function docsResponse(pathname) {
  const path = normalizeDocsPath(pathname);
  const pages = await loadDocsPages();
  const page = pages.find((item) => item.href === path);
  const current = page ?? {
    id: "",
    href: path,
    title: "Page not found",
    headings: [],
    html: `<h1>Page not found</h1><p>That page is not in the reference.</p><p><a href="/">Introduction</a></p>`,
  };
  return {
    status: page ? 200 : 404,
    html: docsDocument(current),
  };
}

function docsDocument(page) {
  return `<!doctype html>
<html lang="en" data-docs-page="${escapeHtml(page.id)}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(page.title)} — Frontend web app</title>
    <style>
${developerFontFaceCss("/fonts")}
    </style>
    <link rel="stylesheet" href="/docs.css" />
  </head>
  <body>
    <a class="docs-skip" href="#docs-content">Skip to content</a>
    <header class="docs-header">
      <div class="docs-header__bar">
        <p class="docs-header__keys">
          <button type="button" class="docs-header__key" data-docs-menu-toggle aria-expanded="false" aria-controls="docs-menu">(M) Menu</button>
          <span class="docs-header__sep" aria-hidden="true">/</span>
          <button type="button" class="docs-header__key" data-docs-search-open data-docs-search-kbd>⌘ + K</button>
        </p>
      </div>
    </header>
    <div class="docs-search" data-docs-search hidden>
      <button type="button" class="docs-search__backdrop" data-docs-search-backdrop aria-label="Close search"></button>
      <form class="docs-search__dialog" role="search">
        <label class="docs-search__field">
          <svg class="docs-search__icon" viewBox="0 0 16 16" aria-hidden="true">
            <circle cx="7" cy="7" r="4.25" fill="none" stroke="currentColor" stroke-width="1.5"></circle>
            <path d="M10.2 10.2 13 13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"></path>
          </svg>
          <input id="docs-search-input" class="docs-search__input" data-docs-search-input type="search" placeholder="Search" aria-label="Search" autocomplete="off" spellcheck="false" role="combobox" aria-expanded="false" aria-controls="docs-search-results" aria-autocomplete="list" />
        </label>
        <div id="docs-search-results" class="docs-search__panel" data-docs-search-panel></div>
      </form>
    </div>
    <nav id="docs-menu" class="docs-menu" data-docs-menu hidden aria-label="Pages">
      <div class="docs-menu__list">
        ${menuHtml(page.href)}
      </div>
    </nav>
    <div class="docs-frame">
      <div class="docs-shell" data-docs-shell>
        <article id="docs-content" class="docs-content" tabindex="-1">
          ${page.html}
        </article>
        ${tocHtml(page.headings)}
      </div>
    </div>
    <script type="module">
      import DocsPage from "/docs-client.js";
      new DocsPage(document).init();
    </script>
  </body>
</html>`;
}

function menuHtml(currentHref) {
  return docsMenu()
    .map((group) => {
      const links = group.items
        .map((item) => {
          const href = item.link ?? slugFromId(item.slug);
          const path = href.split("#")[0];
          const current = path === currentHref && !href.includes("#");
          const currentAttr = current ? ' aria-current="page"' : "";
          return `<a class="docs-menu__link" href="${escapeHtml(href)}"${currentAttr}>${escapeHtml(item.label)}</a>`;
        })
        .join("");
      return `<div class="docs-menu__group"><p class="docs-menu__label">${escapeHtml(group.label)}</p>${links}</div>`;
    })
    .join("");
}

function tocHtml(headings) {
  if (!headings?.length) return "";
  const links = headings
    .map(
      (heading) =>
        `<a class="docs-toc__link" href="#${escapeHtml(heading.id)}" data-level="${heading.level}">${escapeHtml(heading.text)}</a>`,
    )
    .join("");
  return `<aside class="docs-toc" aria-label="On this page"><p class="docs-toc__label">On this page</p>${links}</aside>`;
}
