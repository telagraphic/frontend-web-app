# About

A modern SPA front-end built with vanilla JavaScript, SCSS, and GSAP animations.
API server uses Bun & Hono.

This project has several options for starting a new SPA.
Checkout a branch, review the **README.md** for setup details.

| option                         | purpose                     | branch       |
| ------------------------------ | --------------------------- | ------------ |
| front-end only SPA             | client side only SPA        | spa-frontend |
| front-end SPA with Bun.js API  | SPA with SSG using Bun      | spa-api-bun  |
| front-end SPA with Hono.js API | SPA with SSR API using Hono | spa-api-hono |

Search for **README.md** to see feature specific documentation.

## Notes
All branches uses **pnpm** for package management.

**spa-frontend** uses Vite for bundling and development testing. **npm** or **bun** can be used for task running.
**spa-api-bun** uses Bun for bundling, tasks.
**spa-api-hono** uses Bun for bundling and tasks.


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

### SPA Configuration
The build creates a `_redirects` file with:
```
# Serve index.html for all routes (client-side routing)
/*    /index.html   200
```

This ensures that direct visits to `/about` or `/gallery` serve the main
