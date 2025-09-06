# About

Use case is for SPA websites that uses SSR to render external in the page template before rendering.

- A modern SPA built with vanilla JavaScript, SCSS, and GSAP animations.
- Bun for tasks, bundling and creating a server.
- Hono for serving the API (routes, static assets, etc...)
- Pages are built at run-time per each route request. External data requests are injected into each template.


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
| `dev` | `NODE_ENV=development bun --hot server.js` | Development server with hot reload using Bun |
| `start` | `NODE_ENV=production bun server.js` | Start production server |
| `build` | `bun run clean && bun run sass:build & bun run build:js:esbuild` | Clean dist folder and build Sass and JavaScript assets in parallel |
| `preview` | `bun run build && bun server.js --env production` | Build project and preview production build |
| `deploy` | `bun run build && bun run start` | Build project and start production server |
| `clean` | `rm -rf dist` | Remove dist directory |
| `build:sass` | `bun run sass:build --outdir=dist` | Build Sass with custom output directory |
| `build:js` | `bun build app/App.js --outdir=dist` | Bundle JavaScript using Bun |
| `build:js:esbuild` | `esbuild app/App.js --bundle --minify --outdir=dist` | Bundle and minify JavaScript using esbuild |
| `build:html` | `bun run scripts/build-static-pages.js` | Generate static HTML pages from templates |
| `sass:watch` | `sass --watch styles/styles.scss styles/styles.css --style=expanded --no-source-map` | Watch Sass files and auto-compile without source maps |
| `sass:dev` | `sass styles/styles.scss styles/styles.css --style=expanded --source-map` | Build development CSS with source maps |
| `sass:build` | `sass styles/styles.scss dist/styles.css --style=compressed --no-source-map` | Build compressed CSS directly to dist folder |
| `sass:check` | `sass styles/styles.scss --style=expanded --no-source-map --quiet` | Check Sass compilation without output |
| `format:html` | `prettier --write pages/*.html` | Format HTML files with Prettier |
| `format:js` | `prettier --write app/**/*.js` | Format JavaScript files with Prettier |
| `format:css` | `prettier --write styles/**/*.scss` | Format Sass files with Prettier |
| `lint:js` | `eslint app/**/*.js` | Lint JavaScript files |
| `lint:js:fix` | `eslint app/**/*.js --fix` | Lint and auto-fix JavaScript files |
| `lint:css` | `stylelint "**/*.{css,scss}"` | Lint CSS and Sass files |
| `lint:css:fix` | `stylelint "**/*.{css,scss}" --fix` | Lint and auto-fix CSS and Sass files |
| `lint:html` | `prettier --check views/**/*.html` | Check HTML template formatting |
| `lint` | `bun run lint:js && bun run lint:css && bun run lint:html` | Run all linting checks |
| `netlify:dev` | `netlify dev --dir=dist` | Local Netlify development server |


## 📁 Project Structure

```
frontend-web-app/
├── index.html              # Main entry point (Vite)
├── pages/                  # HTML page templates (development)
│   ├── about.html
│   ├── ...
├── views/                  # Nunjucks template system
│   ├── layouts/
│   │   └── page.html       # Base template layout
│   ├── pages/              # Template source files
│   │   ├── about.html
│   │   └── ... 
│   └── partials/           # Reusable template components
│       ├── head.html
├── app/                    # JavaScript modules
│   ├── App.js              # Main application entry
│   ├── classes/            # Core utility classes
│   │   ├── Animation.js
│   │   ├── ...
│   ├── components/         # Reusable UI components
│   │   ├── Navigation.js
│   │   └── ...
│   ├── pages/              # Page-specific logic
│   │   ├── About.js
│   │   ├── ...
│   ├── animation/          # Animation utilities
│   │   └── Titles.js
│   └── utils/              # Helper utilities
│       ├── Colors.js
│       ├── ...
├── styles/                 # SCSS stylesheets
│   ├── styles.scss         # Main stylesheet
│   ├── styles.css          # Compiled CSS
│   ├── _base.scss
│   ├── ...
├── images/                 # Static assets
│   ├── moon.webp
│   ├── ...
├── dist/                   # Production build output
│   ├── index.html
│   ├── App.js              # Bundled JavaScript
│   ├── styles.css          # Bundled CSS
│   ├── pages/              # Generated HTML pages
├── scripts/                # Build and utility scripts
│   └── generate-static-pages.js
├── vite-plugins/           # Custom Vite plugins
│   ├── nunjucks-plugin.js
│   └── template-hmr-plugin.js
├── vite.config.js          # Vite configuration
├── package.json            # Dependencies and scripts
└── postcss.config.js       # PostCSS configuration
```

## 🔄 How SPA Routing Works

1. **Initial Load**: Browser loads `index.html`
2. **Navigation**: Click on navigation links
3. **Router Intercept**: `Router.js` prevents default page reload
4. **Fetch HTML**: Uses `fetch()` to get page content (e.g., `pages/about.html`)
5. **DOM Update**: Replaces current page content with new content
6. **History API**: Updates browser URL without page refresh

## 🌐 Netlify Deployment

### Deploy to Netlify
1. Build the project: `bun run deploy`
2. Upload the `dist/` folder to Netlify
3. Or connect your Git repo for automatic deployments
