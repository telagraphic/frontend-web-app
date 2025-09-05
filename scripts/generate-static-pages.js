import { mkdir } from "node:fs/promises";
import nunjucks from "nunjucks";
import { Glob } from "bun";
import { minify } from "html-minifier-terser";

/**
 * Generates static pages for the project to ./pages for development and to ./dist/pages for production
 * @returns {Promise<void>} Resolves when pages are generated
 */
async function generateStaticPages() {
  // Get absolute paths
  const scriptDir = new URL("./", import.meta.url);
  const viewsDir = new URL("../views/", scriptDir);
  const viewsPagesDir = new URL("../views/pages/", scriptDir);
  const distDir = new URL("../dist/", scriptDir);
  const pagesDir = new URL("../pages/", scriptDir);

  // Define asset paths for different environments
  const assetPaths = {
    development: {
      cssPath: "../styles/styles.css",
      jsPath: "../app/App.js",
    },
    production: {
      // Reference ./dist bundled assets
      cssPath: "./styles.css",
      jsPath: "./App.js",
    },
  };

  // Determine environment and set output directory
  const isProduction =
    process.env.NODE_ENV === "production" ||
    process.env.BUN_ENV === "production";
  const currentPaths = isProduction
    ? assetPaths.production
    : assetPaths.development;
  const outputDir = new URL(isProduction ? "../dist/" : "../pages/", scriptDir);

  // Configure Nunjucks
  nunjucks.configure(viewsDir.pathname, {
    autoescape: true,
    noCache: true,
  });

  // Ensure dist directory exists
  await mkdir(outputDir.pathname, { recursive: true });

  // Find all HTML files in pages directory
  const glob = new Glob("**/*.html");

  for await (const file of glob.scan(viewsPagesDir.pathname)) {
    try {
      // Determine output path
      let outputPath;
      if (file === "index.html") {
        outputPath = `${outputDir.pathname}index.html`;
      } else {
        outputPath = `${outputDir.pathname}${file}`;
      }

      // Ensure output directory exists
      const outputDirPath = outputPath.substring(
        0,
        outputPath.lastIndexOf("/")
      );
      await mkdir(outputDirPath, { recursive: true });

      // Render the template with environment-specific asset paths
      let rendered = nunjucks.render(`pages/${file}`, currentPaths);

      if (isProduction) {
        rendered = await minify(rendered, {
          collapseWhitespace: true,
          removeComments: true,
          removeRedundantAttributes: true,
          useShortDoctype: true,
          minifyCSS: true,
          minifyJS: true,
          removeEmptyAttributes: true,
          removeOptionalTags: true,
          removeScriptTypeAttributes: true,
          removeStyleLinkTypeAttributes: true,
          sortAttributes: true,
          sortClassName: true,
        });
      }

      await Bun.write(outputPath, rendered);

      console.log(
        `✓ Generated ${file} → ${outputPath.replace(outputDir.pathname, "")} (${isProduction ? "production" : "development"} mode)`
      );
    } catch (error) {
      console.error(`✗ Failed to generate ${file}:`, error.message);
    }
  }

  console.log(`\n🎉 SPA pages generated successfully!`);
  console.log(`Environment: ${isProduction ? "production" : "development"}`);
  console.log(`Output directory: ${outputDir.pathname}`);
}

generateStaticPages().catch(console.error);
