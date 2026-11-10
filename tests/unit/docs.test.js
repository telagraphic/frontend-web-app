import { Window } from "happy-dom";
import { resolve } from "node:path";
import { describe, expect, test } from "bun:test";
import {
  docsMenu,
  loadDocsPages,
  rewriteDocsHref,
} from "../../server/developer/docsCatalog.js";
import { docsResponse } from "../../server/developer/docsPage.js";
import { renderDocsMarkdown } from "../../server/developer/docsRender.js";
import { searchDocs } from "../../server/developer/docsSearch.js";

const happy = new Window({ url: "http://127.0.0.1:4321/" });
globalThis.window = happy;
globalThis.document = happy.document;
globalThis.HTMLElement = happy.HTMLElement;
globalThis.navigator = happy.navigator;

const { default: DocsPage } = await import(
  "../../server/developer/docsClient.js"
);

describe("documentation reader", () => {
  test("rewrites repo links onto documentation paths", () => {
    const overview = resolve("documentation/reference/OVERVIEW.md");
    expect(rewriteDocsHref("../../GLOSSARY.md", overview)).toBe("/glossary");
    expect(rewriteDocsHref("METHOD_VERBS.md", overview)).toBe(
      "/reference/method-verbs",
    );

    const skill = resolve(".cursor/skills/front-end-write-js/SKILL.md");
    expect(rewriteDocsHref("FEATURES.md", skill)).toBe(
      "/skills/front-end-write-js/features",
    );
  });

  test("renders headings and tables without raw html", () => {
    const { html, headings, text } = renderDocsMarkdown(
      "# Hello\n\n<script>alert(1)</script>\n\n## Renderer\n\n```js\nconst n = 1;\n```\n\n| A | B |\n| --- | --- |\n| 1 | 2 |\n",
      "/tmp/none.md",
    );
    expect(html).toContain('id="hello"');
    expect(html).toContain('id="renderer"');
    expect(html).not.toContain("<script>");
    expect(html).toContain("<table>");
    expect(html).toContain("data-docs-copy");
    expect(text).toContain("const n = 1");
    expect(text).not.toContain("Copy");
    expect(headings).toEqual([{ id: "renderer", text: "Renderer", level: 2 }]);
  });

  test("serves the overview with the menu, search, and headings", async () => {
    const labels = docsMenu().map((group) => group.label);
    expect(labels).toEqual([
      "Start",
      "Glossary",
      "Reference",
      "Skills",
      "Decisions",
    ]);

    const page = await docsResponse("/reference/overview");
    expect(page.status).toBe(200);
    expect(page.html).toContain("Building blocks");
    expect(page.html).toContain('href="/glossary"');
    expect(page.html).toContain("data-docs-menu");
    expect(page.html).toContain("data-docs-search");
    expect(page.html).toContain("(M) Menu");
    expect(page.html).toContain("⌘ + K");
    expect(page.html).not.toContain("docs-header__title");
    expect(page.html).toContain("On this page");
    expect(page.html).toContain(">Renderer<");

    const missing = await docsResponse("/missing");
    expect(missing.status).toBe(404);
    expect(missing.html).toContain("Page not found");
  });

  test("search lists the current headings and the other pages", async () => {
    const pages = await loadDocsPages();
    const result = searchDocs(pages, {
      query: "",
      currentId: "reference/overview",
    });
    expect(result.headings.some((item) => item.title === "Renderer")).toBe(
      true,
    );
    expect(
      result.pages.some((item) => item.href === "/reference/overview"),
    ).toBe(false);
    expect(result.pages.some((item) => item.href === "/reference/wizard")).toBe(
      true,
    );

    const matched = searchDocs(pages, {
      query: "nunjucks",
      currentId: "index",
    });
    const hit = matched.pages.find((item) =>
      item.excerpt?.toLowerCase().includes("nunjucks"),
    );
    expect(hit).toBeDefined();
  });

  test("M opens the menu and Command-K opens search", async () => {
    document.documentElement.setAttribute("data-docs-page", "reference/overview");
    document.body.innerHTML = `
      <button type="button" data-docs-menu-toggle aria-expanded="false">Menu</button>
      <form data-docs-search>
        <input data-docs-search-input aria-expanded="false" />
        <kbd data-docs-search-kbd>⌘K</kbd>
        <div data-docs-search-panel hidden></div>
      </form>
      <button type="button" data-docs-menu-backdrop hidden>Close menu</button>
      <nav data-docs-menu hidden>
        <a href="/reference/overview" aria-current="page">Overview</a>
      </nav>
      <div data-docs-shell></div>
    `;

    const page = new DocsPage(document, {
      pages: [
        {
          id: "reference/overview",
          href: "/reference/overview",
          title: "Building blocks",
          section: "Reference",
          headings: [{ id: "renderer", text: "Renderer", level: 2 }],
          text: "A renderer turns a route into HTML.",
        },
        {
          id: "reference/wizard",
          href: "/reference/wizard",
          title: "Setup wizard",
          section: "Reference",
          headings: [],
          text: "Create a site with the wizard.",
        },
      ],
    });
    page.init();

    document.dispatchEvent(
      new window.KeyboardEvent("keydown", { key: "m", bubbles: true }),
    );
    expect(document.querySelector("[data-docs-menu]").hidden).toBe(false);
    expect(document.querySelector("[data-docs-shell]").inert).toBe(true);

    document.dispatchEvent(
      new window.KeyboardEvent("keydown", {
        key: "k",
        metaKey: true,
        bubbles: true,
      }),
    );
    const panel = document.querySelector("[data-docs-search-panel]");
    expect(panel.hidden).toBe(false);
    expect(panel.textContent).toContain("Renderer");
    expect(panel.textContent).toContain("Setup wizard");
    expect(document.querySelector("[data-docs-menu]").hidden).toBe(true);

    const input = document.querySelector("[data-docs-search-input]");
    input.value = "wizard";
    input.dispatchEvent(new window.Event("input", { bubbles: true }));
    expect(panel.textContent).toContain("Setup wizard");
    expect(panel.textContent).not.toContain("Renderer");

    page.destroy();
  });

  test("a current-page search result scrolls to that heading", async () => {
    window.history.pushState(null, "", "/reference/overview");
    document.documentElement.setAttribute(
      "data-docs-page",
      "reference/overview",
    );
    document.body.innerHTML = `
      <button type="button" data-docs-menu-toggle aria-expanded="false">Menu</button>
      <form data-docs-search>
        <input data-docs-search-input aria-expanded="false" />
        <div data-docs-search-panel hidden></div>
      </form>
      <nav data-docs-menu hidden></nav>
      <div data-docs-shell>
        <h2 id="renderer">Renderer</h2>
      </div>
    `;
    const heading = document.getElementById("renderer");
    let scrolled = false;
    heading.scrollIntoView = () => {
      scrolled = true;
    };

    const page = new DocsPage(document, {
      pages: [
        {
          id: "reference/overview",
          href: "/reference/overview",
          title: "Building blocks",
          section: "Reference",
          headings: [{ id: "renderer", text: "Renderer", level: 2 }],
          text: "A renderer turns a route into HTML.",
        },
      ],
    });
    page.init();
    document.dispatchEvent(
      new window.KeyboardEvent("keydown", {
        key: "k",
        metaKey: true,
        bubbles: true,
      }),
    );
    document.querySelector("[data-docs-search-panel] a").click();

    expect(document.querySelector("[data-docs-search]").hidden).toBe(true);
    expect(window.location.hash).toBe("#renderer");
    expect(scrolled).toBe(true);
    page.destroy();
    window.history.pushState(null, "", "/");
  });

  test("copy writes the code block text", async () => {
    document.body.innerHTML = `
      <button type="button" data-docs-menu-toggle aria-expanded="false">Menu</button>
      <form data-docs-search>
        <input data-docs-search-input aria-expanded="false" />
        <div data-docs-search-panel hidden></div>
      </form>
      <nav data-docs-menu hidden></nav>
      <div data-docs-shell>
        <div class="docs-code">
          <button type="button" data-docs-copy>Copy</button>
          <pre><code>const n = 1;</code></pre>
        </div>
      </div>
    `;
    let written = "";
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText(value) {
          written = value;
          return Promise.resolve();
        },
      },
    });

    const page = new DocsPage(document, { pages: [] });
    page.init();
    document.querySelector("[data-docs-copy]").click();
    await Promise.resolve();
    await Promise.resolve();

    expect(written).toBe("const n = 1;");
    expect(document.querySelector("[data-docs-copy]").textContent).toBe(
      "Copied",
    );
    page.destroy();
  });
});
