# About

- A modern SPA built with vanilla JavaScript, SCSS, and GSAP animations.
- Uses **bun** for tasks, bundling and creating a server.
- Pages are rendered at build time, so it's ideal for SSG projects.
- External data requests should be executed in each page's respective `app/pages/` and updating it's respective page template. 

## 🚀 Quick Start

Use `pnpm` to install packages and not `bun`.

### Development
```bash
pnpm install
bun run dev
```


Visit `http://localhost:3000` - Vite will handle live reloading, SCSS compilation, and HMR for JS and HTML.

### Production Build
```bash
bun run deploy
```

This creates a `dist/` folder ready for deployment and optimized bundled assets.

### Commands


| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `bun --hot server.js` | Development server with hot reload using Bun |
| `build` | `rm -rf dist && bun run build:js && bun run build:css && bun run build:html` | Clean dist folder and build JS, CSS, and HTML assets |
| `deploy` | `bun run build && bun server.js` | Build project and start production server |
| `build:js` | `bun build app/App.js --outdir dist --target browser --minify` | Bundle and minify JavaScript for browser |
| `build:css` | `bun run sass:build && bun build styles/styles.css --outdir dist --target browser --minify` | Compile Sass and bundle CSS with minification |
| `build:html` | `BUN_ENV=production bun scripts/generate-static-pages.js` | Generate production HTML pages from Nunjucks templates |
| `build:html:dev` | `bun scripts/generate-static-pages.js && bun run format:html` | Generate development HTML pages and format them |
| `sass:watch` | `sass --watch styles/styles.scss styles/styles.css --style=expanded --source-map` | Watch Sass files and auto-compile with source maps |
| `sass:build` | `sass styles/styles.scss styles/styles.css --style=compressed --no-source-map` | Build compressed CSS without source maps |
| `sass:dev` | `sass styles/styles.scss styles/styles.css --style=expanded --source-map` | Build development CSS with source maps |
| `sass:check` | `sass styles/styles.scss --style=expanded --no-source-map --quiet` | Check Sass compilation without output |
| `build:pages` | `bun scripts/generate-static-pages.js && bun run format:html` | Generate static pages and format HTML |
| `format:html` | `prettier --write pages/*.html` | Format HTML files with Prettier |
| `format:js` | `prettier --write app/**/*.js` | Format JavaScript files with Prettier |
| `format:css` | `prettier --write styles/**/*.scss` | Format Sass files with Prettier |
| `lint:js` | `eslint app/**/*.js` | Lint JavaScript files |
| `lint:js:fix` | `eslint app/**/*.js --fix` | Lint and auto-fix JavaScript files |
| `lint:css` | `stylelint "**/*.{css,scss}"` | Lint CSS and Sass files |
| `lint:css:fix` | `stylelint "**/*.{css,scss}" --fix` | Lint and auto-fix CSS and Sass files |
| `lint:html` | `prettier --check pages/*.html` | Check HTML file formatting |
| `minify:html` | `sh scripts/minify-html.sh` | Minify HTML files using shell script |
| `clean` | `rm -rf dist` | Remove dist directory |
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

1. Build the project: `bun run deploy`
2. Upload the `dist/` folder to Netlify
3. Or connect your Git repo for automatic deployments

