import { mkdir } from "node:fs/promises";
import nunjucks from "nunjucks";
import { Glob } from "bun";

/**
 * Generates static pages
 * TODO: This is legacy from spa-api-hono-static-pages
 */
async function generateStaticPages() {
  // Get absolute paths
  const scriptDir = new URL("./", import.meta.url);
  const viewsDir = new URL("../views/", scriptDir); // ✅ Changed to views/ directory
  const pagesDir = new URL("../views/pages/", scriptDir);
  const distDir = new URL("../dist/", scriptDir);

  // Determine environment and set asset paths
  const isProduction = process.env.NODE_ENV === "production";

  const assetPaths = {
    development: {
      cssPath: "../../styles/styles.css",
      jsPath: "../../app/App.js",
    },
    production: {
      cssPath: "styles.css",
      jsPath: "App.js",
    },
  };

  const currentPaths = isProduction
    ? assetPaths.production
    : assetPaths.development;

  // Configure Nunjucks with views/ as base directory for template inheritance
  nunjucks.configure(viewsDir.pathname, {
    // ✅ Changed from viewsPagesDir to viewsDir
    autoescape: true,
    noCache: true,
  });

  // Ensure dist directory exists
  await mkdir(distDir.pathname, { recursive: true });

  // Find all HTML files in views/pages directory
  const glob = new Glob("**/*.html");

  for await (const file of glob.scan(pagesDir.pathname)) {
    const inputPath = `${pagesDir.pathname}${file}`;
    const outputPath = `${distDir.pathname}${file.split("/").pop()}`;

    const template = await Bun.file(inputPath).text();
    const rendered = nunjucks.renderString(template, currentPaths);
    await Bun.write(outputPath, rendered);

    console.log(
      `Rendered ${file} → ${outputPath} (${isProduction ? "production" : "development"} mode)`,
    );
  }
}

generateStaticPages().catch(console.error);
