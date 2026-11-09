import { serveStatic } from "hono/bun";
import { existsSync, readdirSync, statSync } from "node:fs";
import { resolve, sep } from "node:path";
import { createApp } from "./app.js";
import { buildAssets } from "./assets.js";
import { liveReloadEvents, sendEvent } from "./live-reload/events.js";
import { watchProject } from "./live-reload/watch.js";
import { codebasePage } from "./developer/codebase.js";
import { docsUrl } from "./developer/docsUrl.js";
import { developerDocument, developerFontFile } from "./developer/theme.js";

const port = Number(process.env.PORT) || 3000;
const assetDir = ".dev/assets";

let assets = await buildAssets({
  outdir: assetDir,
  minify: false,
  sourcemap: true,
});
assets = { ...assets, liveReload: "/dev/live-reload.js" };

let { app, renderer } = createDevApp(assets);

watchProject({
  async onApp() {
    try {
      assets = {
        ...(await buildAssets({
          outdir: assetDir,
          minify: false,
          sourcemap: true,
        })),
        liveReload: "/dev/live-reload.js",
      };
      ({ app, renderer } = createDevApp(assets));
      await sendEvent("reload");
    } catch (error) {
      await sendEvent("build-error", error.message ?? String(error));
    }
  },
  async onViews() {
    renderer.invalidate();
    await sendEvent("reload");
  },
  async onStyles() {
    try {
      assets = {
        ...(await buildAssets({
          outdir: assetDir,
          minify: false,
          sourcemap: true,
        })),
        liveReload: "/dev/live-reload.js",
      };
      ({ app, renderer } = createDevApp(assets));
      await sendEvent("css");
    } catch (error) {
      await sendEvent("build-error", error.message ?? String(error));
    }
  },
  async onConfig() {
    ({ app, renderer } = createDevApp(assets));
    await sendEvent("reload");
  },
});

Bun.serve({
  port,
  idleTimeout: 0,
  fetch: (request, server) => app.fetch(request, server),
});

console.log(`Dev server http://127.0.0.1:${port}`);

function createDevApp(currentAssets) {
  const created = createApp({ assets: currentAssets });
  const devApp = created.app;

  devApp.get("/dev/events", liveReloadEvents());
  devApp.get("/dev/live-reload.js", () => {
    return new Response(Bun.file("server/live-reload/client.js"), {
      headers: { "Content-Type": "application/javascript; charset=utf-8" },
    });
  });

  addExperiments(devApp, currentAssets, created.renderer);
  addDeveloper(devApp);

  devApp.use("/assets/*", serveStatic({ root: "./.dev" }));
  devApp.use("/*", serveStatic({ root: "./public" }));

  return created;
}

const setupsRoot = resolve("..", "setups");
const reportRoot = resolve("playwright-report");

function addDeveloper(devApp) {
  devApp.get("/admin/fonts/:family/:file", (c) => {
    const file = developerFontFile(c.req.param("family"), c.req.param("file"));
    if (!file) return c.notFound();
    return new Response(Bun.file(file), {
      headers: { "Content-Type": "font/woff2" },
    });
  });

  devApp.get("/admin", (c) => {
    c.set("skipCsp", true);
    return c.html(developerPage());
  });
  devApp.get("/admin/codebase", (c) => {
    c.set("skipCsp", true);
    return c.html(codebasePage(docsUrl));
  });

  devApp.get("/playwright-report", (c) => c.redirect("/playwright-report/"));
  devApp.get("/playwright-report/", (c) =>
    serveInside(c, reportRoot, "", missingReport),
  );
  devApp.get("/playwright-report/*", (c) =>
    serveInside(
      c,
      reportRoot,
      c.req.path.slice("/playwright-report/".length),
      missingReport,
    ),
  );

  devApp.get("/admin/setups", (c) => c.redirect("/admin/setups/"));
  devApp.get("/admin/setups/", (c) =>
    serveInside(c, setupsRoot, "", missingSetups),
  );
  devApp.get("/admin/setups/*", (c) =>
    serveInside(
      c,
      setupsRoot,
      c.req.path.slice("/admin/setups/".length),
      missingSetups,
    ),
  );
}

function serveInside(c, root, rel, missing) {
  c.set("skipCsp", true);
  const file = fileInside(root, rel === "" ? "index.html" : rel);
  if (!file) return c.html(missing(), 404);
  try {
    const stat = statSync(file);
    if (stat.isDirectory()) {
      const index = fileInside(root, `${rel.replace(/\/$/, "")}/index.html`);
      if (!index) return c.html(missing(), 404);
      return new Response(Bun.file(index));
    }
  } catch {
    return c.html(missing(), 404);
  }
  return new Response(Bun.file(file));
}

function fileInside(root, rel) {
  if (!existsSync(root)) return null;
  const full = resolve(root, rel);
  const base = resolve(root);
  if (full !== base && !full.startsWith(`${base}${sep}`)) return null;
  if (!existsSync(full)) return null;
  return full;
}

function developerPage() {
  return developerDocument(
    "Developer",
    `<h1>Developer</h1>
    <ul>
      <li><a href="/experiments">Experiments</a></li>
      <li><a href="/playwright-report/">Playwright report</a></li>
      <li><a href="/admin/setups/">Wizard setups</a></li>
      <li><a href="/admin/codebase">Codebase</a></li>
      <li><a href="${docsUrl}">Docs</a></li>
    </ul>
    <p>Docs need <code>bun run docs:dev</code>. Wizard setups appear after the create script writes <code>../setups</code>.</p>`,
  );
}

function missingReport() {
  return developerDocument(
    "Playwright report",
    `<h1>Playwright report</h1>
    <p>Run <code>bun run test:browser</code> in this project. The report is written to <code>playwright-report/</code>.</p>
    <p><a href="/admin">Developer</a></p>`,
  );
}

function missingSetups() {
  return developerDocument(
    "Wizard setups",
    `<h1>Wizard setups</h1>
    <p>No setups yet. The create script writes <code>../setups/index.html</code> and one folder per <code>wizard-</code> branch.</p>
    <p><a href="/admin">Developer</a></p>`,
  );
}

function addExperiments(devApp, currentAssets, renderer) {
  devApp.get("/experiments", (c) => {
    const names = existsSync("experiments")
      ? readdirSync("experiments", { withFileTypes: true })
          .filter((entry) => entry.isDirectory())
          .map((entry) => entry.name)
      : [];
    const items = names
      .map((name) => `<li><a href="/experiments/${name}">${name}</a></li>`)
      .join("");
    const empty = names.length === 0 ? "<p>No experiments yet.</p>" : "";
    c.set("skipCsp", true);
    return c.html(
      developerDocument(
        "Experiments",
        `<h1>Experiments</h1>${empty}<ul>${items}</ul>`,
      ),
    );
  });

  if (!existsSync("experiments")) return;

  devApp.get("/experiments/:name", async (c) => {
    const name = c.req.param("name");
    const html = await renderExperiment(
      name,
      currentAssets,
      renderer?.extension ?? ".njk",
    );
    if (!html) return c.notFound();
    return c.html(html);
  });

  devApp.get("/experiments/:name/styles.css", (c) => {
    const file = `experiments/${c.req.param("name")}/styles.css`;
    if (!existsSync(file)) return c.notFound();
    return new Response(Bun.file(file), {
      headers: { "Content-Type": "text/css; charset=utf-8" },
    });
  });

  devApp.get("/experiments/:name/experiment.js", (c) => {
    const file = `experiments/${c.req.param("name")}/experiment.js`;
    if (!existsSync(file)) return c.notFound();
    return new Response(Bun.file(file), {
      headers: { "Content-Type": "application/javascript; charset=utf-8" },
    });
  });
}

async function renderExperiment(name, currentAssets, extension) {
  const file = `experiments/${name}/index${extension}`;
  if (!existsSync(file)) return null;
  const data = { assets: currentAssets, experiment: name };

  if (extension === ".njk") {
    const { default: nunjucks } = await import("nunjucks");
    const env = nunjucks.configure(["views", `experiments/${name}`], {
      autoescape: true,
      noCache: true,
    });
    return env.render("index.njk", data);
  }

  if (extension === ".vto") {
    const { default: vento } = await import("ventojs");
    const env = vento({
      includes: ["views", `experiments/${name}`],
      autoescape: true,
    });
    return (await env.run(`index.vto`, data)).content;
  }

  if (extension === ".jsx") {
    const { pathToFileURL } = await import("node:url");
    const { renderToString } = await import("hono/jsx/dom/server");
    const href = `${pathToFileURL(`${process.cwd()}/${file}`).href}?t=${Date.now()}`;
    const { default: Page } = await import(href);
    return `<!doctype html>${renderToString(Page(data))}`;
  }

  return null;
}
