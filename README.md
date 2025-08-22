# About

A modern single-page application built with vanilla JavaScript, SCSS, and GSAP animations. Features client-side routing and is optimized for Netlify deployment.

## 🚀 Quick Start

### Development
```bash
pnpm install
pnpm run dev
```

Visit `http://localhost:5173` - Vite will handle live reloading, SCSS compilation, and HMR.

### Production Build
```bash
pnpm run build
```

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


## KANBAN


### DO

**8/15**


## server attempt on 8/21
- setup webserver with hono
- setup routes
- serve static pages for each route
- router and url path are working?


## netlify
- vite for javascript
- dart-sass for styles
- add assets to bunny
- deploy to netlify
- fix router paths
- document named routes for static spa jamstack

## design
- add images
- add basic styles, open props?
- implement gsap animations for the other pages

## animations

- finish animations

## hono api

- setup project
- document /routes for server api to serve pages for jamstack + api


## preloader
- fix preloader animation
- fix image preloading, on page load and page changes


## refactoring
- update prefix, normalize-wheel packages
- add dom lookups and event handlers syntax
- review redirect back to home state
- create web components for basic elements
- update router to hide/show templates
- add named routes function? might not need to current setup? how will this affect loading index.html || /index in markup


## package

package this as:

1. static jamstack SPA
  - link click hijacking
  - template hide/showing
2. dynamic jamstack SPA with API
  -

### DOING




### DONE

**8/21**

- read up on vite, sass bundling
- implement hono server with vite
- too complicated
- simplified for a jamstack spa static netlify option


**8/20**

- refactored smooth scroll code into one class instead of multiple calls throughout classes
- document code

**8/19**

- added smooth scroll functionality


**8/14**
- keep markup the same for all pages or when first visiting other pages besides index.html, animations won't work
- add css animations to page navigation

- review creative web app js architecture for next steps


**8/13**

- page content swapping on page navigation
- setup history api push state
- tested

**8/12**
- setup basic app structure
- router class setup
- reviewed singleton use case for router
