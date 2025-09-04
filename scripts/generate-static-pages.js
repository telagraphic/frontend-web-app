import { mkdir } from 'node:fs/promises';
import nunjucks from 'nunjucks';
import { Glob } from 'bun';



/**
 * Generates static pages for the project to ./pages for development and to ./dist/pages for production
 * @returns {Promise<void>} Resolves when pages are generated
 */
async function generateStaticPages() {
  // Get absolute paths
  const scriptDir = new URL('./', import.meta.url);
  const viewsDir = new URL('../views/', scriptDir);
  const pagesDir = new URL('../views/pages/', scriptDir);
  
  // Determine environment and set output directory
  const isProduction = process.env.NODE_ENV === 'production';
  const distDir = new URL(isProduction ? '../dist/pages/' : '../pages/', scriptDir);
  
  const assetPaths = {
    development: {
      cssPath: '../styles/styles.css',
      jsPath: '../app/App.js'
    },
    production: {
      // Use source paths - Vite will process and resolve these
      cssPath: './styles/styles.scss',
      jsPath: './app/App.js'
    }
  };

  const currentPaths = isProduction ? assetPaths.production : assetPaths.development;

  // Configure Nunjucks
  nunjucks.configure(viewsDir.pathname, {
    autoescape: true,
    noCache: true
  });
  
  // Ensure dist directory exists
  await mkdir(distDir.pathname, { recursive: true });

  // Find all HTML files in pages directory
  const glob = new Glob('**/*.html');
  
  for await (const file of glob.scan(pagesDir.pathname)) {
    try {
      
      // Determine output path
      let outputPath;
      if (file === 'index.html') {
        outputPath = `${distDir.pathname}index.html`;
      } else {
        outputPath = `${distDir.pathname}${file}`;
      }
      
      // Ensure output directory exists
      const outputDir = outputPath.substring(0, outputPath.lastIndexOf('/'));
      await mkdir(outputDir, { recursive: true });
      
      // Render the template with environment-specific asset paths
      const rendered = nunjucks.render(`pages/${file}`, currentPaths);
      
      await Bun.write(outputPath, rendered);
      
      console.log(`✓ Generated ${file} → ${outputPath.replace(distDir.pathname, '')} (${isProduction ? 'production' : 'development'} mode)`);
    } catch (error) {
      console.error(`✗ Failed to generate ${file}:`, error.message);
    }
  }

  console.log(`\n🎉 SPA pages generated successfully!`);
  console.log(`Environment: ${isProduction ? 'production' : 'development'}`);
  console.log(`Output directory: ${distDir.pathname}`);
}

generateStaticPages().catch(console.error);
