import { serveStatic } from "hono/bun";
import { existsSync, readdirSync } from "node:fs";
import { createApp } from "./app.js";
import { buildAssets } from "./assets.js";
import { liveReloadEvents, sendEvent } from "./live-reload/events.js";
import { watchProject } from "./live-reload/watch.js";

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
      await sendEvent("error", error.message ?? String(error));
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
      await sendEvent("error", error.message ?? String(error));
    }
  },
  async onConfig() {
    ({ app, renderer } = createDevApp(assets));
    await sendEvent("reload");
  },
});

Bun.serve({
  port,
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

  devApp.use("/assets/*", serveStatic({ root: "./.dev" }));
  devApp.use("/*", serveStatic({ root: "./public" }));

  return created;
}

function addExperiments(devApp, currentAssets, renderer) {
  if (!existsSync("experiments")) return;

  devApp.get("/experiments", (c) => {
    const names = readdirSync("experiments", { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name);
    const items = names
      .map((name) => `<li><a href="/experiments/${name}">${name}</a></li>`)
      .join("");
    return c.html(
      `<!doctype html><html lang="en"><head><meta charset="utf-8" /><title>Experiments</title></head><body><h1>Experiments</h1><ul>${items}</ul></body></html>`,
    );
  });

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
