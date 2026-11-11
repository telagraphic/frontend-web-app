#!/usr/bin/env bun
import { cp, mkdir, rm, writeFile, readFile } from "node:fs/promises";
import { existsSync, readdirSync } from "node:fs";
import { resolve, relative, sep } from "node:path";
import * as p from "@clack/prompts";

const root = resolve(import.meta.dir, "..");
const SKIP = new Set([
  "wizard",
  "node_modules",
  "dist",
  ".dev",
  ".git",
  ".github",
  "pages",
  "test-results",
  "playwright-report",
  "blob-report",
  ".specstory",
  ".cursorindexingignore",
  ".bun-tag",
  "_redirects",
  "fonts",
  "netlify.toml",
  "pnpm-lock.yaml",
]);

const PAGE_SWAP = [
  "app/router/Router.js",
  "app/router/RouterHistory.js",
  "app/router/RouterResolver.js",
  "app/router/RouterPageLoader.js",
  "app/router/RouterPageManager.js",
  "app/router/RouterSwap.js",
  "app/router/RouterPrefetchCache.js",
  "app/router/RouterPrefetchManager.js",
  "app/layout/listenFocus.js",
];

const DOCUMENT_LOAD = ["app/router/DocumentLoad.js"];

const GSAP = [
  "app/services/GsapTransitions.js",
  "app/services/TransitionsService.js",
  "app/transitions/fade/FadeTransition.js",
  "app/transitions/fade/fade.css",
  "app/config/transitions.js",
];

const VIEW_SWAP = [
  "app/services/ViewTransitions.js",
  "app/transitions/view/ViewTransition.js",
];

const VIEW_CSS = ["styles/components/view-transition.css"];
const VIEW_DOC_CSS = ["styles/components/view-transition-document.css"];
const EXTENSION = { nunjucks: "njk", vento: "vto", jsx: "jsx" };

function copied(rel) {
  if (!rel || rel === ".") return true;
  const parts = rel.split(sep);
  if (SKIP.has(parts[0])) return false;
  if (parts.some((part) => part === ".DS_Store" || part.endsWith(".tgz"))) {
    return false;
  }
  return true;
}

const args = parseArgs(process.argv.slice(2));
const options = await collectOptions(args);
const dest = resolve(options.dest);
const { transition, navigation, name, origin, renderer } = options;

validate({ dest, transition, navigation, renderer });

const combo = `${transition}/${navigation}`;
const pageSwap = navigation === "page-swap";
const gsap = transition === "gsap";
const view = transition === "view";
const none = transition === "none";

await mkdir(dest, { recursive: true });
try {
  await cp(root, dest, {
    recursive: true,
    filter: (src) => copied(relative(root, src)),
  });
  await applyCombination();
} catch (error) {
  await rm(dest, { recursive: true, force: true });
  throw error;
}

console.log(`Created ${combo} (${renderer}) at ${dest}`);
console.log(
  `cd ${dest} && bun install && bun run dev`,
);

async function collectOptions(flags) {
  const destFlag = flags.dest ?? flags._[0];
  const interactive =
    process.stdout.isTTY && !process.env.CI && missingPrompt(flags, destFlag);

  if (!interactive) {
    const transition = flags.transition ?? "gsap";
    return {
      dest: destFlag,
      name: flags.name ?? "Site",
      origin: flags.origin ?? "http://localhost:3000",
      transition,
      navigation:
        transition === "none"
          ? "document-load"
          : (flags.navigation ?? "page-swap"),
      renderer: flags.renderer ?? "nunjucks",
    };
  }

  p.intro("Create a site from this starter");

  const dest =
    destFlag ??
    take(
      await p.text({
        message: "Destination folder",
        placeholder: "../my-site",
        validate: (value) =>
          value?.trim() ? undefined : "A destination folder is required",
      }),
    );

  const name =
    flags.name ??
    take(
      await p.text({
        message: "Site name",
        placeholder: "my-site",
        validate: (value) => (value?.trim() ? undefined : "A name is required"),
      }),
    );

  const origin =
    flags.origin ??
    take(
      await p.text({
        message: "Origin URL",
        placeholder: "https://example.com",
        validate: (value) =>
          value?.trim() ? undefined : "An origin is required",
      }),
    );

  const transition =
    flags.transition ??
    take(
      await p.select({
        message: "Page transition",
        initialValue: "gsap",
        options: [
          {
            value: "gsap",
            label: "GSAP",
            hint: "overlay host, any motion, cover before load",
          },
          {
            value: "view",
            label: "View transition",
            hint: "CSS only; Firefox may ignore view transitions",
          },
          {
            value: "none",
            label: "None",
            hint: "plain document load, no motion",
          },
        ],
      }),
    );

  let navigation = "document-load";
  if (transition !== "none") {
    navigation =
      flags.navigation ??
      take(
        await p.select({
          message: "Navigation",
          initialValue: "page-swap",
          options: navigationOptions(transition),
        }),
      );
  }

  const renderer =
    flags.renderer ??
    take(
      await p.select({
        message: "Renderer",
        initialValue: "nunjucks",
        options: [
          {
            value: "nunjucks",
            label: "Nunjucks",
            hint: "starter default, .njk",
          },
          {
            value: "vento",
            label: "Vento",
            hint: "async templates; the adapter turns autoescape on",
          },
          {
            value: "jsx",
            label: "JSX",
            hint: "Hono JSX on the server; class, not className",
          },
        ],
      }),
    );

  p.outro("Writing the site");
  return { dest, name, origin, transition, navigation, renderer };
}

function missingPrompt(flags, destFlag) {
  if (!destFlag || !flags.name || !flags.origin || !flags.transition) {
    return true;
  }
  if (!flags.renderer) return true;
  if (flags.transition !== "none" && !flags.navigation) return true;
  return false;
}

function navigationOptions(transition) {
  if (transition === "view") {
    return [
      {
        value: "page-swap",
        label: "Page swap",
        hint: "same-document View Transitions API",
      },
      {
        value: "document-load",
        label: "Document load",
        hint: "cross-document @view-transition; Firefox may ignore it",
      },
    ];
  }
  return [
    {
      value: "page-swap",
      label: "Page swap",
      hint: "swap main, keep layout; GSAP on the outgoing page",
    },
    {
      value: "document-load",
      label: "Document load",
      hint: "full load after cover; no GSAP on the outgoing page without an overlay",
    },
  ];
}

function take(value) {
  if (p.isCancel(value)) {
    p.cancel("Create cancelled");
    process.exit(1);
  }
  return typeof value === "string" ? value.trim() : value;
}

async function applyCombination() {
  const drop = [];
  if (!pageSwap) drop.push(...PAGE_SWAP);
  if (!(gsap && !pageSwap)) drop.push(...DOCUMENT_LOAD);
  if (!gsap) drop.push(...GSAP);
  if (!(view && pageSwap)) drop.push(...VIEW_SWAP);
  if (!view) drop.push(...VIEW_CSS);
  if (!(view && !pageSwap)) drop.push(...VIEW_DOC_CSS);
  if (none) {
    drop.push(
      ...DOCUMENT_LOAD,
      ...GSAP,
      ...VIEW_SWAP,
      ...VIEW_CSS,
      ...VIEW_DOC_CSS,
    );
  }

  for (const file of new Set(drop)) {
    await rm(resolve(dest, file), { force: true });
  }

  await writeFile(resolve(dest, "app/config/site.js"), siteFile(name, origin));
  await writeFile(
    resolve(dest, "app/services/ServicesFactory.js"),
    factoryFile({ gsap, view, pageSwap }),
  );
  await writeFile(
    resolve(dest, "app/layout/createLayout.js"),
    layoutFile(pageSwap),
  );
  await writeFile(
    resolve(dest, "styles/styles.css"),
    stylesFile({ gsap, view, pageSwap }),
  );
  await writeFile(
    resolve(dest, "app/head.js"),
    gsap && !pageSwap ? coveringHead() : preloaderHead(),
  );
  await applyRenderer(renderer, gsap);
  await writePackageJson(renderer);
  await rm(resolve(dest, "scripts/create-setups.js"), { force: true });
  await rm(resolve(dest, "scripts/setups.js"), { force: true });
  await rm(resolve(dest, "tests/unit/setups.test.js"), { force: true });
  await writeFile(resolve(dest, "README.md"), siteReadme(name));

  if (!gsap) {
    await rm(resolve(dest, "tests/unit/transitionsService.test.js"), {
      force: true,
    });
  }
  if (!(gsap && !pageSwap)) {
    await rm(resolve(dest, "tests/unit/documentLoad.test.js"), { force: true });
  }
  if (!(view && pageSwap)) {
    await rm(resolve(dest, "tests/unit/viewTransitions.test.js"), {
      force: true,
    });
  }
  if (!pageSwap) {
    await rm(resolve(dest, "tests/unit/pageNavigate.test.js"), { force: true });
    await writeFile(
      resolve(dest, "tests/wiring/createServices.test.js"),
      wiringTest({ gsap, pageSwap }),
    );
  }
}

async function applyRenderer(engine, hasHost) {
  if (engine !== "nunjucks") {
    const kit = resolve(root, "wizard/renderers", engine);
    await rm(resolve(dest, "views"), { recursive: true, force: true });
    await cp(resolve(kit, "views"), resolve(dest, "views"), {
      recursive: true,
    });
    await cp(
      resolve(kit, "renderers", `${engine}.js`),
      resolve(dest, "server/renderers", `${engine}.js`),
    );
    await rm(resolve(dest, "server/renderers/nunjucks.js"), { force: true });
    await cp(resolve(kit, ".prettierrc"), resolve(dest, ".prettierrc"));
    if (engine === "jsx") {
      await cp(resolve(kit, "tsconfig.json"), resolve(dest, "tsconfig.json"));
    }
  }

  await writeFile(
    resolve(dest, "server/renderer.js"),
    `export { createRenderer } from "./renderers/${engine}.js";\n`,
  );
  await writeFile(
    resolve(dest, `views/layouts/page.${EXTENSION[engine]}`),
    pageLayout(engine, hasHost),
  );
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--") continue;
    if (token.startsWith("--")) {
      const key = token.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith("--")) out[key] = true;
      else {
        out[key] = next;
        i += 1;
      }
    } else out._.push(token);
  }
  return out;
}

function validate({ dest, transition, navigation, renderer }) {
  if (!dest) throw new Error("Pass a destination folder or --dest");
  if (dest === "." || dest === root || dest.startsWith(`${root}${sep}`)) {
    throw new Error("Refuse the starter root or a path inside it");
  }
  if (!["gsap", "view", "none"].includes(transition)) {
    throw new Error("--transition must be gsap, view, or none");
  }
  if (!["page-swap", "document-load"].includes(navigation)) {
    throw new Error("--navigation must be page-swap or document-load");
  }
  if (!["nunjucks", "vento", "jsx"].includes(renderer)) {
    throw new Error("--renderer must be nunjucks, vento, or jsx");
  }
  if (transition === "none" && navigation !== "document-load") {
    throw new Error("None is document load");
  }
  if (existsSync(dest) && readdirSync(dest).length) {
    throw new Error(`Destination is not empty: ${dest}`);
  }
}

function siteFile(siteName, siteOrigin) {
  return `export const site = {
  name: ${JSON.stringify(siteName)},
  origin: ${JSON.stringify(siteOrigin)},
};
`;
}

function factoryFile({ gsap, view, pageSwap }) {
  const transitionImport = gsap
    ? `import { GsapTransitions } from "./GsapTransitions.js";
import FadeTransition from "../transitions/fade/FadeTransition.js";
import { transitions } from "../config/transitions.js";
`
    : view && pageSwap
      ? `import { ViewTransitions } from "./ViewTransitions.js";
import ViewTransition from "../transitions/view/ViewTransition.js";
`
      : "";
  const navImport = pageSwap
    ? `import { Router } from "../router/Router.js";
`
    : gsap
      ? `import { DocumentLoad } from "../router/DocumentLoad.js";
`
      : "";

  const transitionConstruct = gsap
    ? `  const transitionsService = new GsapTransitions({
    animationsService,
    defaultTransition: FadeTransition,
    transitions,
  });
`
    : view && pageSwap
      ? `  const transitionsService = new ViewTransitions({
    plugin: new ViewTransition(),
  });
`
      : `  const transitionsService = null;
`;

  const routerConstruct = pageSwap
    ? `  const router = new Router({
    routes: siteRoutes,
    pages,
    animationsService,
    transitionsService,
    smoothScroll,
  });
`
    : gsap
      ? `  const router = new DocumentLoad({
    routes: siteRoutes,
    pages,
    animationsService,
    transitionsService,
    smoothScroll,
  });
`
      : `  const router = null;
`;

  return `import { siteRoutes } from "../config/siteRoutes.js";
import { pages } from "../config/pages.js";
import { scrollPresets } from "../config/scrollPresets.js";
import { SmoothScroll } from "../components/SmoothScroll.js";
import { AnimationsService } from "./AnimationsService.js";
${transitionImport}${navImport}import { createError, ERROR_CODES } from "../utilities/ErrorRegistry.js";

export function createServices() {
  for (const [key, route] of Object.entries(siteRoutes)) {
    if (!pages[route.page]) {
      throw createError(ERROR_CODES.CLASS_NOT_FOUND, {
        className: \`\${route.page} (route: \${key})\`,
      });
    }
  }

  const smoothScroll = new SmoothScroll(scrollPresets.default);
  const animationsService = new AnimationsService({ smoothScroll });
${transitionConstruct}${routerConstruct}
  return { router, animationsService, transitionsService, smoothScroll };
}
`;
}

function layoutFile(pageSwap) {
  const focusImport = pageSwap
    ? `import { listenFocus } from "./listenFocus.js";
`
    : "";
  const focusCall = pageSwap
    ? `      listenFocus({ router, signal: controller.signal });
`
    : "";
  return `import Menu from "../components/menus/Menu.js";
import Preloader from "../components/Preloader.js";
${focusImport}import { ERROR_CODES } from "../utilities/ErrorRegistry.js";
import { EVENTS } from "../utilities/Constants.js";

export function createLayout({
  router,
  animationsService,
  smoothScroll,
  transitionsService,
}) {
  const controller = new AbortController();
  const menu = new Menu({
    router,
    smoothScroll,
    animationsService,
    transitionsService,
  });
  const preloader = new Preloader({ animationsService });

  return {
    menu,
    preloader,
    async init() {
${focusCall}      await initLayoutComponent(menu);

      preloader.addEventListener(
        EVENTS.PRELOADER_COMPLETE,
        () => {
          smoothScroll?.start();
          preloader.destroy();
        },
        { once: true, signal: controller.signal },
      );

      const preloaderReady = await initLayoutComponent(preloader);
      if (!preloaderReady) {
        document.documentElement.classList.remove("is-loading");
        document.dispatchEvent(new CustomEvent(EVENTS.PRELOADER_COMPLETE));
        smoothScroll?.start();
      }
    },
    destroy() {
      controller.abort();
      menu.destroy();
      preloader.destroy();
    },
  };
}

async function initLayoutComponent(component) {
  try {
    await component.init();
    return true;
  } catch (error) {
    if (error.code === ERROR_CODES.COMPONENT_INIT_FAILED) {
      console.error(error.message);
      return false;
    }
    throw error;
  }
}
`;
}

function stylesFile({ gsap, view, pageSwap }) {
  const extras = [];
  if (gsap)
    extras.push(
      `@import "../app/transitions/fade/fade.css" layer(components);`,
    );
  if (view)
    extras.push(
      `@import "./components/view-transition.css" layer(components);`,
    );
  if (view && !pageSwap) {
    extras.push(
      `@import "./components/view-transition-document.css" layer(components);`,
    );
  }
  const extraBlock = extras.length ? `${extras.join("\n")}\n` : "";
  return `@layer reset, tokens, base, components, utilities, pages, overrides;

@import "./reset/normalize.css" layer(reset);
@import "./tokens/tokens.css" layer(tokens);
@import "./base/base.css" layer(base);
@import "./base/typography.css" layer(base);
@import "./components/navigation.css" layer(components);
@import "./components/page.css" layer(components);
@import "./components/footer.css" layer(components);
@import "./components/preloader.css" layer(components);
${extraBlock}@import "./components/smooth-scroll.css" layer(components);
@import "./pages/home.css" layer(pages);
@import "./pages/not-found.css" layer(pages);
@import "./utilities/sr-only.css" layer(utilities);
`;
}

function pageLayout(engine, hasHost) {
  if (engine === "vento") return pageLayoutVento(hasHost);
  if (engine === "jsx") return pageLayoutJsx(hasHost);
  return pageLayoutNjk(hasHost);
}

function hostMarkup(indent) {
  const pad = " ".repeat(indent);
  return `${pad}<div
${pad}  class="page-transition-overlay"
${pad}  data-transition-host
${pad}  hidden
${pad}  aria-hidden="true"
${pad}></div>
`;
}

function pageLayoutNjk(hasHost) {
  const host = hasHost ? hostMarkup(4) : "";
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{{ meta.title }}</title>
    <meta name="description" content="{{ meta.description }}" />
    <link rel="canonical" href="{{ meta.canonical }}" />
    <script src="{{ assets.head }}"></script>
    <link rel="stylesheet" href="{{ assets.css }}" />
    <script type="module" src="{{ assets.js }}"></script>
  </head>
  <body>
    <a class="skip-link" href="#main">Skip to content</a>
    {% include "partials/preloader.njk" %}
    {% include "partials/navigation.njk" %}
${host}    <main id="main" data-route="{{ route.key }}" tabindex="-1">
      {% block content %}
      {% endblock %}
    </main>
    {% include "partials/footer.njk" %}
    {% if assets.liveReload %}
      <script type="module" src="{{ assets.liveReload }}"></script>
    {% endif %}
  </body>
</html>
`;
}

function pageLayoutVento(hasHost) {
  const host = hasHost ? hostMarkup(4) : "";
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{{ meta.title }}</title>
    <meta name="description" content="{{ meta.description }}" />
    <link rel="canonical" href="{{ meta.canonical }}" />
    <script src="{{ assets.head }}"></script>
    <link rel="stylesheet" href="{{ assets.css }}" />
    <script type="module" src="{{ assets.js }}"></script>
  </head>
  <body>
    <a class="skip-link" href="#main">Skip to content</a>
    {{ include "partials/preloader.vto" }}
    {{ include "partials/navigation.vto" }}
${host}    <main id="main" data-route="{{ route.key }}" tabindex="-1">
      {{ content }}
    </main>
    {{ include "partials/footer.vto" }}
    {{ if assets.liveReload }}
    <script type="module" src="{{ assets.liveReload }}"></script>
    {{ /if }}
  </body>
</html>
`;
}

function pageLayoutJsx(hasHost) {
  const host = hasHost
    ? `        <div
          class="page-transition-overlay"
          data-transition-host=""
          hidden
          aria-hidden="true"
        ></div>
`
    : "";
  return `import { Preloader } from "../partials/preloader.jsx";
import { Menu } from "../partials/navigation.jsx";
import { Footer } from "../partials/footer.jsx";

export function Layout({ route, meta, assets, navigation, site, children }) {
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
        <link rel="canonical" href={meta.canonical} />
        <script src={assets.head}></script>
        <link rel="stylesheet" href={assets.css} />
        <script type="module" src={assets.js}></script>
      </head>
      <body>
        <a class="skip-link" href="#main">
          Skip to content
        </a>
        <Preloader site={site} />
        <Menu navigation={navigation} site={site} />
${host}        <main id="main" data-route={route.key} tabindex="-1">
          {children}
        </main>
        <Footer site={site} />
        {assets.liveReload ? (
          <script type="module" src={assets.liveReload}></script>
        ) : null}
      </body>
    </html>
  );
}
`;
}

function preloaderHead() {
  return `try {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduced && !sessionStorage.getItem("preloader-played")) {
    document.documentElement.classList.add("is-loading");
    sessionStorage.setItem("preloader-played", "1");
  }
} catch {
  document.documentElement.classList.add("is-loading");
}
`;
}

function coveringHead() {
  return `try {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let covering = false;
  try {
    const raw = sessionStorage.getItem("gsap-cover");
    if (raw) {
      sessionStorage.removeItem("gsap-cover");
      const flag = JSON.parse(raw);
      const fresh = Date.now() - Number(flag.at) < 8000;
      if (fresh && flag.path === location.pathname) {
        covering = true;
        document.documentElement.classList.add("is-covering");
        const host = document.querySelector("[data-transition-host]");
        if (host) {
          host.hidden = false;
          const image = flag.image
            ? \`<img class="page-transition-overlay__image" src="\${flag.image}" alt="\${flag.alt ?? ""}">\`
            : "";
          const copy = flag.copy
            ? \`<p class="page-transition-overlay__copy">\${flag.copy}</p>\`
            : "";
          host.innerHTML = \`\${image}\${copy}\`;
        }
      }
    }
  } catch {
    /* sessionStorage can throw in private mode */
  }
  if (!covering && !reduced && !sessionStorage.getItem("preloader-played")) {
    document.documentElement.classList.add("is-loading");
    sessionStorage.setItem("preloader-played", "1");
  }
} catch {
  document.documentElement.classList.add("is-loading");
}
`;
}

async function writePackageJson(engine) {
  const pkg = JSON.parse(await readFile(resolve(dest, "package.json"), "utf8"));
  pkg.name = name.toLowerCase().replaceAll(/[^a-z0-9-]+/g, "-") || "site";
  pkg.private = true;
  delete pkg.bin;
  delete pkg.files;
  delete pkg.repository;
  delete pkg.description;
  delete pkg.scripts.create;
  delete pkg.scripts.setups;
  delete pkg.dependencies?.["@clack/prompts"];
  delete pkg.devDependencies?.["@clack/prompts"];

  const viewGlob = {
    nunjucks: "views/**/*.njk",
    vento: "views/**/*.vto",
    jsx: "views/**/*.jsx",
  }[engine];
  pkg.scripts.format = `prettier --write "app/**/*.js" "server/**/*.js" "${viewGlob}" "styles/**/*.css"`;
  pkg.scripts["format:check"] =
    `prettier --check "app/**/*.js" "server/**/*.js" "${viewGlob}" "styles/**/*.css"`;

  if (engine === "jsx") {
    pkg.scripts["lint:js"] =
      `eslint "app/**/*.js" "server/**/*.js" "views/**/*.jsx"`;
    pkg.scripts["lint:js:fix"] =
      `eslint "app/**/*.js" "server/**/*.js" "views/**/*.jsx" --fix`;
  }

  if (engine !== "nunjucks") {
    const kit = JSON.parse(
      await readFile(
        resolve(root, "wizard/renderers", engine, "packages.json"),
        "utf8",
      ),
    );
    pkg.dependencies = { ...pkg.dependencies, ...kit.dependencies };
    pkg.devDependencies = { ...pkg.devDependencies, ...kit.devDependencies };
    for (const key of kit.dropDependencies ?? []) {
      delete pkg.dependencies[key];
    }
    for (const key of kit.dropDevDependencies ?? []) {
      delete pkg.devDependencies[key];
    }
  }

  await writeFile(
    resolve(dest, "package.json"),
    `${JSON.stringify(pkg, null, 2)}\n`,
  );
}

function siteReadme(siteName) {
  return `# ${siteName}

\`\`\`
bun install
bun run dev
\`\`\`

\`bun run docs:dev\` serves the reference.
`;
}

function wiringTest({ gsap, pageSwap }) {
  const routerExpect =
    pageSwap || gsap
      ? `    expect(services.router).toBeDefined();
    expect(services.transitionsService).toBeDefined();
`
      : `    expect(services.router).toBeNull();
    expect(services.transitionsService).toBeNull();
`;
  return `import { Window } from "happy-dom";
import { describe, expect, test } from "bun:test";

const happy = new Window({ url: "http://localhost/" });
globalThis.window = happy;
globalThis.document = happy.document;
globalThis.HTMLElement = happy.HTMLElement;
globalThis.requestAnimationFrame ??= (cb) =>
  setTimeout(() => cb(Date.now()), 16);
globalThis.cancelAnimationFrame ??= (id) => clearTimeout(id);
globalThis.getComputedStyle ??= (el) => happy.getComputedStyle(el);

const { createServices } =
  await import("../../app/services/ServicesFactory.js");

describe("createServices", () => {
  test("returns the boot services for this combination", () => {
    const services = createServices();
${routerExpect}    expect(services.animationsService).toBeDefined();
    expect(services.smoothScroll).toBeDefined();
  });
});
`;
}
