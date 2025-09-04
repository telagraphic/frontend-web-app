# Views & Templates

Templating uses `nunjucks` for rendering static html pages.
The Hono server compiles the HTML at runtime per request.

[Nunjucks documentation](https://mozilla.github.io/nunjucks/templating.html)

## Basic Workflow

1. Nunjucks Templates Structure:
   - `views/layouts/page.html` - Base layout with environment-aware asset paths
   - `views/partials/*.html` - Reusable html templates/components
   - `views/pages/*.html` - Individual page templates for all your SPA routes
2. Runtime SSR:
   - each route builds the page template with nunjucks
   - there is no index.html or html in the dist
   - assets bundle paths are updated in the template
   - each route can fetch external data for the template
   - html is minified before serving
