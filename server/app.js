import { Hono } from "hono";
import { existsSync, readdirSync } from "node:fs";
import { siteRoutes } from "../app/config/siteRoutes.js";
import { csp } from "../app/config/csp.js";
import { buildData } from "./data.js";
import { createRenderer } from "./renderer.js";
import { assertDocument, layoutRequiresHost } from "./document.js";

const viewsDir = `${import.meta.dir}/../views`;

export function createApp({ assets, requireHost } = {}) {
  requireHost ??= layoutRequiresHost(viewsDir);
  const renderer = createRenderer({ viewsDir });
  assertPageFiles(renderer.extension);

  const app = new Hono();
  app.use("*", async (c, next) => {
    await next();
    c.header("Content-Security-Policy", csp);
  });

  for (const [key, record] of Object.entries(siteRoutes)) {
    const route = { key, ...record };
    app.get(record.path, async (c) => {
      try {
        const html = await renderRoute(renderer, route, assets, requireHost);
        return c.html(html);
      } catch (error) {
        return errorPage(c, error, assets);
      }
    });
  }

  app.notFound(async (c) => {
    const record = siteRoutes["not-found"];
    const route = { key: "not-found", ...record };
    try {
      const html = await renderRoute(renderer, route, assets, requireHost);
      return c.html(html, 404);
    } catch (error) {
      return errorPage(c, error, assets, 500);
    }
  });

  return { app, renderer };
}

async function renderRoute(renderer, route, assets, requireHost) {
  const data = buildData(route, assets);
  const html = await renderer.render(route, data);
  assertDocument(route, html, { requireHost });
  return html;
}

function assertPageFiles(extension) {
  const pagesDir = `${viewsDir}/pages`;
  for (const [key, record] of Object.entries(siteRoutes)) {
    const file = `${pagesDir}/${key}${extension}`;
    if (!existsSync(file)) {
      throw new Error(
        `Missing page file for route ${record.path}: views/pages/${key}${extension}`,
      );
    }
  }

  if (!existsSync(pagesDir)) return;
  const published = new Set(
    Object.keys(siteRoutes).map((key) => `${key}${extension}`),
  );
  for (const name of readdirSync(pagesDir)) {
    if (!name.endsWith(extension)) continue;
    if (!published.has(name)) {
      console.warn(`Template with no route: views/pages/${name}`);
    }
  }
}

function errorPage(c, error, assets, status = 500) {
  const file = error.file ?? "";
  const line = error.line ?? "";
  const message = error.message ?? String(error);
  const live = assets?.liveReload
    ? `<script type="module" src="${assets.liveReload}"></script>`
    : "";
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Render error</title>
  </head>
  <body>
    <h1>${escapeHtml(error.name ?? "Error")}</h1>
    <p>${escapeHtml(message)}</p>
    ${file ? `<p>${escapeHtml(file)}${line ? `:${line}` : ""}</p>` : ""}
    ${live}
  </body>
</html>`;
  return c.html(html, status);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
