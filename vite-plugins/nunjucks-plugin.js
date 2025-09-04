import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import nunjucks from 'nunjucks';
import { minify } from 'html-minifier-terser';

/**
 * Generate static pages from Nunjucks templates
 */
async function generateStaticPages() {
      const viewsDir = join(process.cwd(), 'views');
      const pagesDir = join(viewsDir, 'pages');
      const outputDir = join(process.cwd(), 'dist', 'pages');
      
      // Configure Nunjucks
      nunjucks.configure(viewsDir, {
        autoescape: true,
        noCache: true
      });
      
      // Read Vite manifest to get bundled asset paths
      const manifestPath = join(process.cwd(), 'dist', '.vite', 'manifest.json');
      let assetPaths = {
        cssPath: '/styles/styles.scss', // fallback
        jsPath: '/app/App.js' // fallback
      };
      
      try {
        const manifestContent = await readFile(manifestPath, 'utf-8');
        const manifest = JSON.parse(manifestContent);
        const mainEntry = manifest['index.html'];
        
        if (mainEntry) {
          assetPaths = {
            cssPath: `/${mainEntry.css?.[0] || 'styles/styles.scss'}`,
            jsPath: `/${mainEntry.file || 'app/App.js'}`
          };
        }
      } catch (error) {
        console.warn('Could not read Vite manifest, using fallback paths:', error.message);
      }
      
      // Ensure output directory exists
      await mkdir(outputDir, { recursive: true });
      
      // Get all page templates
      const { glob } = await import('glob');
      const pageFiles = glob.sync('**/*.html', { cwd: pagesDir });
      
      for (const file of pageFiles) {
        try {
          // Render template
          const rendered = nunjucks.render(`pages/${file}`, assetPaths);
          
          // Minify HTML
          const minified = await minify(rendered, {
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
          
          // Write to output
          const outputPath = join(outputDir, file);
          await mkdir(dirname(outputPath), { recursive: true });
          await writeFile(outputPath, minified);
          
          console.log(`✓ Generated ${file}`);
        } catch (error) {
          console.error(`✗ Failed to generate ${file}:`, error.message);
        }
      }
      
      console.log('🎉 Static pages generated successfully!');
}

/**
 * Vite plugin for Nunjucks template processing
 */
export function nunjucksPlugin() {
  return {
    name: 'nunjucks',
    apply: 'build', // Only run during production builds
    async writeBundle() {
      // Generate static pages after Vite's build process
      await generateStaticPages();
    }
  };
}
