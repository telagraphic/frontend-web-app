# Templates

Templating uses `nunjucks` for rendering static html pages.

- `./index.html` should be at the root.
- `./pages` serves the development environment pages.
- `./dist/pages` is the minified html for all pages
- `./dist/index.html` should be at the root to start the app.

1. Nunjucks Templates Structure:
   - `views/layouts/page.html` - Base layout with environment-aware asset paths
   - `views/partials/*.html` - Reusable html templates/components
   - `views/pages/*.html` - Individual page templates for all your SPA routes
2. Build Script: `scripts/generate-static-pages.js`
   - Generates static HTML pages for all SPA routes
   - Environment-aware asset path resolution
   - Supports both development and production builds
3. Package.json Scripts:
   - `bun run build:pages:dev` - Development build (uses source asset paths)
   - `bun run build:pages:prod` - Production build (uses bundled asset paths)
   - `bun run build:full` - Complete build pipeline

🚀 How It Works:

- Development Mode maintains source paths for development:
  Asset paths: /styles/styles.css and /app/App.js
- Production Mode replaces with bundled hash paths:
  Asset paths: /assets/css/styles.css and /assets/js/App.js
