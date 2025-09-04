# Sass Compilation & Bundling Setup

This document outlines the complete Sass compilation and bundling setup for this project.

## Overview

The project uses **dual Sass compilation** approach:
1. **Vite Integration** - Primary method for development and production builds
2. **Standalone Sass CLI** - For direct CSS compilation when needed

## 🚀 Quick Start

## 📋 Available Scripts

### Standalone Sass Scripts
| Script | Command | Description |
|--------|---------|-------------|
| `sass:watch` | `sass --watch styles/styles.scss:dist/css/styles.css --style=expanded --source-map` | Watch mode with source maps |
| `sass:build` | `sass styles/styles.scss styles/styles.css --style=compressed --no-source-map` | Compressed production CSS |
| `sass:dev` | `sass styles/styles.scss:dist/css/styles.css --style=expanded --source-map` | Expanded CSS with source maps |
| `sass:check` | `sass styles/styles.scss --style=expanded --no-source-map --quiet` | Validate Sass syntax |

## 📁 Sass File Structure

```
styles/
├── styles.scss         # Main entry point (imports all partials)
├── _base.scss         # Base styles, resets, typography
├── _animations.scss   # CSS keyframes and animations
├── _preloader.scss    # Loading screen styles
├── _smooth-scroll.scss # Smooth scrolling implementation
└── _home.scss         # Page-specific styles
```

## ⚙️ Configuration Details

### Vite Configuration (`vite.config.js`)

#### Build Output Organization
- **CSS**: `dist/assets/css/[name]-[hash].css`
- **JS**: `dist/assets/js/[name]-[hash].js`
- **Images**: `dist/assets/images/[name]-[hash].[ext]`
- **Fonts**: `dist/assets/fonts/[name]-[hash].[ext]`


### PostCSS Integration

Automatically processes CSS with:
- **Autoprefixer**: Adds vendor prefixes based on browserslist
- **CSSnano**: Minifies CSS in production builds

Configuration in `postcss.config.js`:
```javascript
module.exports = {
  plugins: [
    require("autoprefixer"),
    ...(process.env.NODE_ENV === "production"
      ? [require("cssnano")({ preset: "default" })]
      : []),
  ],
};
```

## 🔗 Related Documentation
- [Sass Official Documentation](https://sass-lang.com/documentation)
- [Vite CSS Documentation](https://vitejs.dev/guide/features.html#css)
- [PostCSS Plugin Documentation](https://postcss.org/)
- [Autoprefixer Documentation](https://github.com/postcss/autoprefixer)