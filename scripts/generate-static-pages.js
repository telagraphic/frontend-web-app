import { mkdir } from "node:fs/promises";
import nunjucks from "nunjucks";
import { Glob } from "bun";
import { minify } from "html-minifier-terser";
import { SiteConfig } from "../app/config/SiteConfig.js";
import { getBaseUrl } from "../app/config/Environment.js";

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

  // Initialize SiteConfig for title metadata
  const siteConfig = new SiteConfig();
  
  // Get base URL for canonical URLs and Open Graph
  const baseUrl = getBaseUrl();

  /**
   * Maps HTML file name to SiteConfig route key
   * @param {string} filename - HTML file name (e.g., "index.html", "section-1.html")
   * @returns {string|null} - Route key or null if not found
   */
  function getRouteKeyFromFilename(filename) {
    if (filename === "index.html") return "home";
    const nameWithoutExt = filename.replace(".html", "");
    return siteConfig.has(nameWithoutExt) ? nameWithoutExt : null;
  }

  /**
   * Formats page title according to SEO checklist requirements
   * @param {string} routeKey - SiteConfig route key
   * @param {string} baseTitle - Base title from SiteConfig
   * @returns {string} - Formatted title
   */
  function formatPageTitle(routeKey, baseTitle) {
    if (routeKey === "home") {
      return "The Shea Memorandum | Israeli Surveillance of 9/11 Hijackers";
    }
    if (routeKey === "introduction") {
      return "Introduction | The Shea Memorandum";
    }
    if (routeKey === "references") {
      return "References | The Shea Memorandum";
    }
    // Section pages: "[Section Title] | The Shea Memorandum"
    if (routeKey && routeKey.startsWith("section-")) {
      return `${baseTitle} | The Shea Memorandum`;
    }
    // Fallback for other pages
    return `${baseTitle} | The Shea Memorandum`;
  }

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

      // Get route key and formatted title from SiteConfig
      const routeKey = getRouteKeyFromFilename(file);
      let templateData = { ...currentPaths };
      
      // Add base URL for all templates
      templateData.baseUrl = baseUrl;
      
      if (routeKey) {
        const routeConfig = siteConfig.get(routeKey);
        if (routeConfig) {
          if (routeConfig.title) {
            templateData.pageTitle = formatPageTitle(routeKey, routeConfig.title);
          }
          if (routeConfig.metaDescription) {
            templateData.metaDescription = routeConfig.metaDescription;
          }
          // Use 'link' property for canonical URL (clean route, not file path)
          // 'link' is the canonical path like "/" or "/section-1"
          // 'url' is the file path like "/pages/index.html"
          if (routeConfig.link) {
            templateData.canonicalPath = routeConfig.link;
          }
        }
      }

      // Render the template with environment-specific asset paths and page title
      let rendered = nunjucks.render(`pages/${file}`, templateData);

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
