# About

A modern SPA built with vanilla JavaScript, SCSS, GSAP animiations.
Server API uses Hono and Bun.js.


## 🚀 Quick Start

Use `pnpm` to install packages and not `bun`.

### Development
```bash
pnpm install
bun run dev
```

### Bun Scripts (Primary)




### Production Build
```bash
bun run build
```


This creates a `dist/` folder ready for deployment.

### Commands

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `vite` | Development server with HMR and Sass compilation |
| `build` | `vite build` | Production build with optimized assets and Nunjucks template processing |
| `preview` | `vite preview` | Preview production build locally |
| `deploy` | `bun run build:full` | Complete production build for deployment |
| `clean` | `rm -rf dist` | Remove dist directory |
| `build:clean` | `bun run clean && bun run build` | Clean and rebuild from scratch |
| `build:check` | `bun run lint:js && bun run lint:css && bun run lint:html` | Run all linting checks before build |
| `build:full` | `bun run sass:build && NODE_ENV=production bun run build:pages && bun run build` | Complete build: Sass compilation + page generation + Vite build |
| `sass:watch` | `sass --watch styles/styles.scss styles/styles.css --style=expanded --source-map` | Watch Sass files and auto-compile on changes |
| `sass:build` | `sass styles/styles.scss styles/styles.css --style=compressed --no-source-map` | Build compressed CSS without source maps |
| `sass:check` | `sass styles/styles.scss --style=expanded --no-source-map --quiet` | Check Sass compilation without output |
| `build:pages` | `bun run scripts/generate-static-pages.js` | Generate static pages from Nunjucks templates |
| `build:pages:dev` | `NODE_ENV=development bun run scripts/generate-static-pages.js && npm run format:html && (test -f pages/index.html && mv pages/index.html ./index.html \|\| echo 'No pages/index.html to move')` | Generate pages for development with formatting and index.html move |
| `format:html` | `prettier --write pages/*.html` | Format HTML files with Prettier |
| `format:js` | `prettier --write app/**/*.js` | Format JavaScript files with Prettier |
| `format:css` | `prettier --write styles/**/*.scss` | Format Sass files with Prettier |
| `lint:js` | `eslint app/**/*.js` | Lint JavaScript files |
| `lint:js:fix` | `eslint app/**/*.js --fix` | Lint and auto-fix JavaScript files |
| `lint:css` | `stylelint "**/*.{css,scss}"` | Lint CSS and Sass files |
| `lint:css:fix` | `stylelint "**/*.{css,scss}" --fix` | Lint and auto-fix CSS and Sass files |
| `lint:html` | `prettier --check pages/*.html` | Check HTML file formatting |
| `lint` | `bun run lint:js && bun run lint:css && bun run lint:html` | Run all linting checks |
| `netlify:dev` | `netlify dev --dir=dist` | Local Netlify development server |


## 📁 Project Structure

```
web-app/
├── index.html          # Main entry point
├── pages/              # HTML page templates
│   ├── about.html
│   └── gallery.html
├── app/                # JavaScript modules
│   ├── App.js          # Main application entry
│   ├── Router.js       # SPA client-side routing
│   ├── classes/        # Utility classes
│   ├── components/     # Reusable components
│   └── pages/          # Page-specific logic
├── styles/             # SCSS stylesheets
│   ├── styles.scss     # Main stylesheet
│   ├── _base.scss
│   ├── _animations.scss
│   └── ...
└── images/             # Static assets
```

## 🔄 How SPA Routing Works

1. **Initial Load**: Browser loads `index.html`
2. **Navigation**: Click on navigation links
3. **Router Intercept**: `Router.js` prevents default page reload
4. **Fetch HTML**: Uses `fetch()` to get page content (e.g., `pages/about.html`)
5. **DOM Update**: Replaces current page content with new content
6. **History API**: Updates browser URL without page refresh

## 🌐 Netlify Deployment

### Automatic Setup
The build process automatically:
- ✅ Copies HTML pages to `dist/pages/`
- ✅ Creates `_redirects` file for SPA routing
- ✅ Compiles and minifies SCSS to CSS
- ✅ Compiles and minifies HTML with Nunjucks
- ✅ Bundles and optimizes JavaScript

### Deploy to Netlify
1. Build the project: `bun run deploy`
2. Upload the `dist/` folder to Netlify
3. Or connect your Git repo for automatic deployments
