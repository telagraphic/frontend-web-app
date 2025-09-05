# Views & Templates

Templating uses `nunjucks` for rendering static html pages.

- `./index.html` should be at the root.
- `./pages` serves the development environment pages.
- `./dist/pages` is the minified html for all pages
- `./dist/index.html` should be at the root to start the app.

[Nunjucks documentation](https://mozilla.github.io/nunjucks/templating.html)

## Basic Workflow

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

## Vite

### Development

Vite will run `template-hmr-plugin.js` when developing locally, this script watches the `views` folder and calls `generate-static-pages.js` to sync changes for live reload.

### Build & Deploy

Vite will run `nunjucks-plugin.js` to replace the asset source paths with the bundled hash paths.
This file also minifies the HTML for `./dist`.


🚀 How It Works:

- Development Mode maintains source paths for development:
  Asset paths: /styles/styles.css and /app/App.js
- Production Mode replaces with bundled hash paths in `dist` :
  Asset paths: /assets/css/styles-123123213.css and /assets/js/App-12312123.js

