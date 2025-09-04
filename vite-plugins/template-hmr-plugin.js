import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import nunjucks from 'nunjucks';

/**
 * Vite plugin that provides HMR for Nunjucks templates using Vite's file watching
 */
export function templateHmrPlugin() {
  let viteServer = null;
  let isProcessing = false;
  let processTimeout = null;

  // Cache for processed templates
  const templateCache = new Map();
  
  // Get the views directory path
  const viewsDir = join(process.cwd(), 'views');
  const pagesDir = join(viewsDir, 'pages');
  const outputDir = join(process.cwd(), 'pages');

  // Configure Nunjucks
  nunjucks.configure(viewsDir, {
    autoescape: true,
    noCache: true
  });

  // Asset paths for development
  const assetPaths = {
    cssPath: '../styles/styles.css',
    jsPath: '../app/App.js'
  };

  /**
   * Process a single template file
   */
  async function processTemplate(templatePath) {
    try {
      const relativePath = templatePath.replace(pagesDir + '/', '');
      const outputPath = join(outputDir, relativePath);
      
      // Ensure output directory exists
      await mkdir(dirname(outputPath), { recursive: true });
      
      // Render the template
      const rendered = nunjucks.render(`pages/${relativePath}`, assetPaths);
      
      // Write to output
      await writeFile(outputPath, rendered);
      
      // Cache the processed content
      templateCache.set(templatePath, {
        content: rendered,
        outputPath,
        lastModified: Date.now()
      });
      
      console.log(`✓ Processed ${relativePath}`);
      return outputPath;
    } catch (error) {
      console.error(`✗ Failed to process ${templatePath}:`, error.message);
      return null;
    }
  }

  /**
   * Process all templates
   */
  async function processAllTemplates() {
    try {
      const { glob } = await import('glob');
      const templateFiles = glob.sync('**/*.html', { cwd: pagesDir });
      
      const results = [];
      for (const file of templateFiles) {
        const templatePath = join(pagesDir, file);
        const outputPath = await processTemplate(templatePath);
        if (outputPath) {
          results.push(outputPath);
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error processing templates:', error.message);
      return [];
    }
  }

  /**
   * Debounced template processing
   */
  function debouncedProcess(changedFile) {
    if (isProcessing) {
      console.log('⏳ Template processing already in progress...');
      return;
    }

    if (processTimeout) {
      clearTimeout(processTimeout);
    }

    processTimeout = setTimeout(async () => {
      isProcessing = true;
      console.log(`📝 Template changed: ${changedFile}`);
      
      try {
        // Process the specific file that changed
        const outputPath = await processTemplate(changedFile);
        
        if (outputPath && viteServer) {
          // Trigger HMR for the specific file
          viteServer.ws.send({
            type: 'update',
            updates: [{
              type: 'js-update',
              path: outputPath,
              acceptedPath: outputPath,
              timestamp: Date.now()
            }]
          });
          
          // Also trigger a full reload for HTML files
          viteServer.ws.send({
            type: 'full-reload'
          });
          
          console.log('🔄 Browser reloaded');
        }
      } catch (error) {
        console.error('❌ Error processing template:', error.message);
      } finally {
        isProcessing = false;
      }
    }, 200); // 200ms debounce
  }

  return {
    name: 'template-hmr',
    apply: 'serve', // Only run in development mode
    
    configureServer(server) {
      viteServer = server;
      
      // Use Vite's file watcher instead of chokidar
      server.watcher.add('views/**/*.html');
      
      server.watcher.on('change', (file) => {
        if (file.includes('views/') && file.endsWith('.html')) {
          console.log('🔍 Vite watcher detected change:', file);
          debouncedProcess(file);
        }
      });
      
      server.watcher.on('add', (file) => {
        if (file.includes('views/') && file.endsWith('.html')) {
          console.log('🔍 Vite watcher detected add:', file);
          debouncedProcess(file);
        }
      });
      
      server.watcher.on('unlink', (file) => {
        if (file.includes('views/') && file.endsWith('.html')) {
          console.log('🔍 Vite watcher detected unlink:', file);
          debouncedProcess(file);
        }
      });
    },

    async buildStart() {
      // Initial template processing
      console.log('🔄 Processing templates...');
      await processAllTemplates();
      console.log('✅ Templates processed');
    },

    closeBundle() {
      if (processTimeout) {
        clearTimeout(processTimeout);
      }
    }
  };
}