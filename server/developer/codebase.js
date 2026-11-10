import { existsSync, readFileSync } from "node:fs";
import { developerDocument } from "./theme.js";

export function projectOptions() {
  const factory = readText("app/services/ServicesFactory.js");
  const renderer = readText("server/renderer.js");
  const styles = readText("styles/styles.css");
  const viewTransition =
    importsFrom(factory, "./ViewTransitions.js") ||
    styles.includes("view-transition");
  const transition = importsFrom(factory, "./GsapTransitions.js")
    ? "GSAP transition"
    : viewTransition
      ? "View transition"
      : "None";
  const navigation = importsFrom(factory, "../router/Router.js")
    ? "Page swap"
    : "Document load";
  const engine = renderer.includes("/vento.js")
    ? "Vento"
    : renderer.includes("/jsx.js")
      ? "JSX"
      : "Nunjucks";
  return { transition, navigation, renderer: engine };
}

export function codebasePage(docsUrl) {
  const options = projectOptions();
  const rows = bootFiles(options)
    .map(([path, by, slug, label]) => {
      return `<tr><td><code>${escapeHtml(path)}</code></td><td>${escapeHtml(by)}</td><td><a href="${docsUrl}${slug}">${escapeHtml(label)}</a></td></tr>`;
    })
    .join("");

  return developerDocument(
    "Codebase",
    `<h1>Codebase</h1>
    <p>The options wired into this project. The load order and the file list are this combination. The seven combination sites are scored on <a href="/admin/setups/">Wizard setups</a>.</p>
    <table>
      <thead><tr><th>Option</th><th>This project</th></tr></thead>
      <tbody>
        <tr><td>Page transition</td><td>${escapeHtml(options.transition)}</td></tr>
        <tr><td>Navigation</td><td>${escapeHtml(options.navigation)}</td></tr>
        <tr><td>Renderer</td><td>${escapeHtml(options.renderer)}</td></tr>
      </tbody>
    </table>
    <p><a href="${docsUrl}glossary">Glossary</a> and the links below are the documentation site (<code>bun run docs:dev</code>).</p>
    <pre><code>${escapeHtml(chart(options))}</code></pre>
    <h2>Files</h2>
    <table>
      <thead><tr><th>File</th><th>Referenced by</th><th>Docs</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p><a href="/admin">Developer</a></p>`,
  );
}

function readText(path) {
  return existsSync(path) ? readFileSync(path, "utf8") : "";
}

function importsFrom(source, specifier) {
  return (
    source.includes(`from "${specifier}"`) ||
    source.includes(`from '${specifier}'`)
  );
}

function bootFiles(options = projectOptions()) {
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

  if (options.transition === "GSAP transition") {
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
  } else if (
    options.transition === "View transition" &&
    existsSync("app/services/ViewTransitions.js")
  ) {
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

  if (
    options.navigation === "Page swap" &&
    existsSync("app/router/Router.js")
  ) {
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

function chart(options = projectOptions()) {
  const transition =
    options.transition === "GSAP transition"
      ? "GsapTransitions"
      : options.transition === "View transition" &&
          existsSync("app/services/ViewTransitions.js")
        ? "ViewTransitions"
        : null;
  const plugIn =
    options.transition === "GSAP transition"
      ? "FadeTransition"
      : options.transition === "View transition" &&
          existsSync("app/transitions/view/ViewTransition.js")
        ? "ViewTransition"
        : null;
  const navigation =
    options.navigation === "Page swap"
      ? "Router"
      : existsSync("app/router/DocumentLoad.js")
        ? "DocumentLoad"
        : null;
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

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
