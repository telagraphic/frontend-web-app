import { mkdir } from "node:fs/promises";
import { Glob } from "bun";

/**
 * Builds page classes to dist/pages/ for production
 */
async function buildPages() {
  const pagesDir = new URL("../app/pages/", import.meta.url);
  const distPagesDir = new URL("../dist/pages/", import.meta.url);

  // Ensure dist/pages directory exists
  await mkdir(distPagesDir.pathname, { recursive: true });

  const glob = new Glob("*.js");
  
  for await (const file of glob.scan(pagesDir.pathname)) {
    const inputPath = `${pagesDir.pathname}${file}`;
    const outputPath = `${distPagesDir.pathname}${file}`;
    
    try {
      await Bun.build({
        entrypoints: [inputPath],
        outdir: distPagesDir.pathname,
        target: "browser",
        minify: true,
      });
      
      console.log(`✓ Built ${file} → dist/pages/${file}`);
    } catch (error) {
      console.error(`✗ Failed to build ${file}:`, error.message);
    }
  }
  
  console.log(`\n🎉 Page classes built successfully!`);
}

buildPages().catch(console.error);
