import { SiteConfig } from "../app/config/SiteConfig.js";
import { getBaseUrl } from "../app/config/Environment.js";
import { mkdir } from "node:fs/promises";

/**
 * Generates sitemap.xml dynamically from SiteConfig
 * @returns {Promise<void>} Resolves when sitemap is generated
 */
async function generateSitemap() {
  const siteConfig = new SiteConfig();
  const baseUrl = getBaseUrl();
  
  // Determine output directory (production: dist/, development: pages/)
  const isProduction =
    process.env.NODE_ENV === "production" ||
    process.env.BUN_ENV === "production";
  const scriptDir = new URL("./", import.meta.url);
  const outputDir = new URL(
    isProduction ? "../dist/" : "../pages/",
    scriptDir
  );

  // Ensure output directory exists
  await mkdir(outputDir.pathname, { recursive: true });

  // Get current date in ISO format for lastmod
  const lastmod = new Date().toISOString().split("T")[0];

  // Start building sitemap XML
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  // Get all routes from SiteConfig
  const routes = Object.keys(siteConfig.settings);

  for (const routeKey of routes) {
    const routeConfig = siteConfig.get(routeKey);
    if (!routeConfig || !routeConfig.link) {
      continue;
    }

    // Determine priority and changefreq based on route type
    let priority = "0.7";
    let changefreq = "monthly";

    if (routeKey === "home") {
      priority = "1.0";
      changefreq = "weekly";
    } else if (routeKey.startsWith("section-")) {
      priority = "0.8";
      changefreq = "monthly";
    } else if (routeKey === "references") {
      priority = "0.6";
      changefreq = "monthly";
    } else {
      // Introduction, media, manifest, etc.
      priority = "0.7";
      changefreq = "monthly";
    }

    // Build full URL
    const url = `${baseUrl}${routeConfig.link}`;

    // Add URL entry to sitemap
    sitemap += `  <url>
    <loc>${escapeXml(url)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>
`;
  }

  // Close sitemap
  sitemap += `</urlset>`;

  // Write sitemap to output directory
  const sitemapPath = `${outputDir.pathname}sitemap.xml`;
  await Bun.write(sitemapPath, sitemap);

  console.log(
    `✓ Generated sitemap.xml → ${sitemapPath.replace(outputDir.pathname, "")} (${isProduction ? "production" : "development"} mode)`
  );

  // Generate robots.txt dynamically with sitemap reference
  const robotsContent = `# robots.txt for The Shea Memorandum
User-agent: *
Allow: /

# Sitemap location
Sitemap: ${baseUrl}/sitemap.xml
`;

  const robotsDestPath = `${outputDir.pathname}robots.txt`;
  await Bun.write(robotsDestPath, robotsContent);
  console.log(
    `✓ Generated robots.txt → ${robotsDestPath.replace(outputDir.pathname, "")} (${isProduction ? "production" : "development"} mode)`
  );
}

/**
 * Escape XML special characters
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeXml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

generateSitemap()
  .then(() => {
    console.log("\n🎉 Sitemap and robots.txt generated successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("✗ Error generating sitemap:", error);
    process.exit(1);
  });
