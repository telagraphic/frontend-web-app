import { existsSync, readFileSync } from "node:fs";
import { developerDocument } from "./theme.js";

export function codebasePage(docsUrl) {
  const rows = bootFiles()
    .map(([path, by, slug, label]) => {
      return `<tr><td><code>${escapeHtml(path)}</code></td><td>${escapeHtml(by)}</td><td><a href="${docsUrl}${slug}">${escapeHtml(label)}</a></td></tr>`;
    })
    .join("");

  return developerDocument(
    "Codebase",
    `<h1>Codebase</h1>
    <p>Load order for the files in this project. <a href="${docsUrl}glossary">Glossary</a> and the links below are the Starlight site (<code>bun run docs:dev</code>).</p>
    <pre><code>${escapeHtml(chart())}</code></pre>
    <h2>Files</h2>
    <table>
      <thead><tr><th>File</th><th>Referenced by</th><th>Docs</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p><a href="/admin">Developer</a></p>`,
  );
}

function bootFiles() {
  const rows = [
    [
      "server/app.js",
      "dev.js and build.js",
      "reference/templates",
      "Templates",
    ],
    ["server/renderer.js", "server/app.js", "reference/templates", "Templates"],
    ["server/data.js", "server/app.js", "reference/templates", "Templates"],
    [
      "app/head.js",
      "the layout, before CSS",
      "reference/accessibility",
      "Accessibility",
    ],
    ["styles/styles.css", "the layout", "reference/styles", "Styles"],
    [
      "app/App.js",
      "the layout module script",
      "reference/overview",
      "Overview",
    ],
    [
      "app/services/ServicesFactory.js",
      "App.js",
      "reference/services",
      "Services",
    ],
    [
      "app/components/SmoothScroll.js",
      "createServices()",
      "reference/services",
      "Services",
    ],
    [
      "app/services/AnimationsService.js",
      "createServices()",
      "reference/animations",
      "Animations",
    ],
  ];

  if (existsSync("app/services/GsapTransitions.js")) {
    rows.push(
      [
        "app/services/GsapTransitions.js",
        "createServices()",
        "reference/gsap-transition",
        "GSAP transition",
      ],
      [
        "app/transitions/fade/FadeTransition.js",
        "GsapTransitions",
        "reference/gsap-transition",
        "GSAP transition",
      ],
    );
  } else if (existsSync("app/services/ViewTransitions.js")) {
    rows.push(
      [
        "app/services/ViewTransitions.js",
        "createServices()",
        "reference/page-transitions",
        "Page transitions",
      ],
      [
        "app/transitions/view/ViewTransition.js",
        "ViewTransitions",
        "reference/page-transitions",
        "Page transitions",
      ],
    );
  }

  if (existsSync("app/router/Router.js")) {
    rows.push([
      "app/router/Router.js",
      "createServices()",
      "reference/page-swap",
      "Page swap",
    ]);
  } else if (existsSync("app/router/DocumentLoad.js")) {
    rows.push([
      "app/router/DocumentLoad.js",
      "createServices()",
      "reference/page-transitions",
      "Page transitions",
    ]);
  }

  rows.push(
    [
      "app/layout/createLayout.js",
      "App.js",
      "reference/layout-components",
      "Layout components",
    ],
    [
      "app/components/menus/Menu.js",
      "createLayout()",
      "reference/layout-components",
      "Layout components",
    ],
    [
      "app/components/Navigation.js",
      "Menu",
      "reference/layout-components",
      "Layout components",
    ],
    [
      "app/components/Preloader.js",
      "createLayout()",
      "reference/images",
      "Images",
    ],
  );

  if (existsSync("app/layout/listenFocus.js")) {
    rows.push([
      "app/layout/listenFocus.js",
      "createLayout()",
      "reference/page-swap",
      "Page swap",
    ]);
  }

  rows.push(
    [
      "app/config/siteRoutes.js",
      "the server and createServices()",
      "reference/page",
      "Add a page",
    ],
    [
      "app/config/pages.js",
      "createServices() and App.js",
      "reference/page",
      "Add a page",
    ],
    ["app/pages/BasePage.js", "Home and Page", "reference/page", "Add a page"],
    ["app/pages/Home.js", "the page index", "reference/page", "Add a page"],
    [
      "app/utilities/dom.js",
      "page classes and components",
      "reference/dom",
      "DOM",
    ],
    [
      "app/utilities/images.js",
      "the preloader and the router",
      "reference/images",
      "Images",
    ],
  );

  return rows.filter(([path]) => existsSync(path));
}

function chart() {
  const transition = firstExisting([
    ["app/services/GsapTransitions.js", "GsapTransitions"],
    ["app/services/ViewTransitions.js", "ViewTransitions"],
  ]);
  const plugIn = firstExisting([
    ["app/transitions/fade/FadeTransition.js", "FadeTransition"],
    ["app/transitions/view/ViewTransition.js", "ViewTransition"],
  ]);
  const navigation = firstExisting([
    ["app/router/Router.js", "Router"],
    ["app/router/DocumentLoad.js", "DocumentLoad"],
  ]);
  const focus = existsSync("app/layout/listenFocus.js")
    ? "\n             listenFocus"
    : "";
  const css = cssImports()
    .map((line) => `         ${line}`)
    .join("\n");

  return `request
  server/app.js
    server/data.js
    server/renderer.js
    views/layouts/page
      app/head.js
      styles/styles.css
${css}
      app/App.js
        1. createServices()
             SmoothScroll
             AnimationsService
             ${transition ?? "(no transitions service)"}${plugIn ? `\n               ${plugIn}` : ""}
             ${navigation ?? "(the browser follows the link)"}
        2. createLayout()
             Menu
               Navigation
             Preloader${focus}
        3. first page class
             init
             show, after the preloader`;
}

function cssImports() {
  if (!existsSync("styles/styles.css")) return [];
  return readFileSync("styles/styles.css", "utf8")
    .split("\n")
    .map((line) => line.match(/^@import\s+"([^"]+)"/)?.[1])
    .filter(Boolean);
}

function firstExisting(pairs) {
  for (const [path, label] of pairs) {
    if (existsSync(path)) return label;
  }
  return null;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
