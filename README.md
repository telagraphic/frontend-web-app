# About

A modern single-page application built with vanilla JavaScript, SCSS, and GSAP animations.


## 🚀 Quick Start

### Development
```bash
pnpm install
pnpm run dev
```

Visit `http://localhost:3000` - Vite will handle live reloading, SCSS compilation, and HMR.

### Production Build
```bash
pnpm run build
```

Visit `http://localhost:4173` - Vite will handle live reloading, SCSS compilation, and HMR.


This creates a `dist/` folder ready for deployment.

## 📁 Project Structure

```
web-app/
├── index.html          # Main entry point
├── pages/              # HTML page templates
│   ├── about.html
│   └── gallery.html
├── app/                # JavaScript modules
│   ├── App.js         # Main application entry
│   ├── Router.js      # SPA client-side routing
│   ├── classes/       # Utility classes
│   ├── components/    # Reusable components
│   └── pages/         # Page-specific logic
├── styles/             # SCSS stylesheets
│   ├── styles.scss    # Main stylesheet
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
- ✅ Copies images to `dist/images/`
- ✅ Creates `_redirects` file for SPA routing
- ✅ Compiles and minifies SCSS to CSS
- ✅ Bundles and optimizes JavaScript

### Deploy to Netlify
1. Build the project: `pnpm run build`
2. Upload the `dist/` folder to Netlify
3. Or connect your Git repo for automatic deployments

### SPA Configuration
The build creates a `_redirects` file with:
```
# Serve index.html for all routes (client-side routing)
/*    /index.html   200
```

This ensures that direct visits to `/about` or `/gallery` serve the main
