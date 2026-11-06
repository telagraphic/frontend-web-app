import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { toSSG } from "hono/bun";
import { site } from "../app/config/site.js";
import { siteRoutes } from "../app/config/siteRoutes.js";
import { csp } from "../app/config/csp.js";
import { createApp } from "./app.js";
import { buildAssets } from "./assets.js";

const dist = "dist";
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await mkdir(`${dist}/assets`, { recursive: true });

const assets = await buildAssets({
  outdir: `${dist}/assets`,
  minify: true,
  sourcemap: false,
});

const { app } = createApp({ assets });
const result = await toSSG(app, { dir: dist });
if (!result.success) {
  console.error(result.files);
  throw new Error("toSSG failed");
}

const notFoundAt = `${dist}/404.html`;
const nested = `${dist}/404/index.html`;
if (!existsSync(notFoundAt) && existsSync(nested)) {
  await cp(nested, notFoundAt);
}

await writeSitemap(`${dist}/sitemap.xml`);
await writeFile(`${dist}/_headers`, `/*\n  Content-Security-Policy: ${csp}\n`);

if (existsSync("public")) {
  await cp("public", dist, { recursive: true });
}

console.log("Build complete → dist/");

async function writeSitemap(path) {
  const origin = process.env.SITE_BASE_URL ?? site.origin;
  const lastmod = new Date().toISOString().split("T")[0];
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  for (const [key, route] of Object.entries(siteRoutes)) {
    if (key === "not-found") continue;
    xml += `  <url>\n    <loc>${origin}${route.path}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>\n`;
  }
  xml += `</urlset>\n`;
  await writeFile(path, xml);
}
