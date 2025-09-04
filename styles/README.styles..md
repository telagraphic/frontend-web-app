# Sass Compilation & Bundling Setup

This document outlines the complete Sass compilation and bundling setup for this project.

## Overview

The project uses **dual Sass compilation** approach:
1. **Vite Integration** - Primary method for development and production builds
2. **Standalone Sass CLI** - For direct CSS compilation when needed

## 🚀 Quick Start

### Development (Recommended)
```bash
# Start development server with automatic Sass compilation
npm run dev
# or
pnpm run dev
```

### Production Build
```bash
# Build optimized production assets
npm run build
```

## 📋 Available Scripts

### Vite-Integrated Scripts (Primary)
| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `vite` | Development server with HMR and Sass compilation |
| `build` | `vite build` | Production build with optimized Sass output |
| `preview` | `vite preview` | Preview production build locally |

### Standalone Sass Scripts
| Script | Command | Description |
|--------|---------|-------------|
| `sass:watch` | `sass --watch styles/styles.scss:dist/css/styles.css --style=expanded --source-map` | Watch mode with source maps |
| `sass:build` | `sass styles/styles.scss:dist/css/styles.css --style=compressed --no-source-map` | Compressed production CSS |
| `sass:dev` | `sass styles/styles.scss:dist/css/styles.css --style=expanded --source-map` | Expanded CSS with source maps |
| `sass:check` | `sass styles/styles.scss --style=expanded --no-source-map --quiet` | Validate Sass syntax |

### Utility Scripts
| Script | Description |
|--------|-------------|
| `clean` | Remove dist folder |
| `clean:build` | Clean and rebuild |

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

#### Sass Options
```javascript
css: {
  preprocessorOptions: {
    scss: {
      outputStyle: 'compressed',
      sourceMap: true,
      includePaths: [
        resolve(__dirname, 'styles'),
        resolve(__dirname, 'node_modules')
      ]
    }
  },
  devSourcemap: true
}
```

#### Path Aliases
- `@` → project root
- `@styles` → `styles/` directory
- `@images` → `images/` directory
- `@app` → `app/` directory
- `@pages` → `pages/` directory

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

## 🔧 Development Workflow

### 1. Standard Development
```bash
npm run dev
```
- Starts Vite dev server on `localhost:3000`
- Automatic Sass compilation
- Hot Module Replacement (HMR) for instant updates
- Source maps for debugging

### 2. Sass-Only Development
```bash
npm run sass:watch
```
- Watches `styles/styles.scss` for changes
- Outputs to `dist/css/styles.css`
- Includes source maps
- Use when you only need CSS compilation

### 3. Production Testing
```bash
npm run build && npm run preview
```
- Builds optimized assets
- Previews on `localhost:4173`

## 📦 Output Examples

### Development Build
- **CSS**: Expanded format with comments and source maps
- **File size**: ~2KB uncompressed
- **Source maps**: Available for debugging

### Production Build
- **CSS**: Minified and optimized
- **File size**: ~0.67KB (gzipped: 0.33KB)
- **Autoprefixed**: Vendor prefixes added automatically
- **Source maps**: Optional (currently enabled)

## 🎯 Usage Examples

### Adding New Sass Files

1. Create new partial: `styles/_components.scss`
2. Add to main file:
```scss
// styles/styles.scss
@forward "./base";
@forward "./animations";
@forward "./preloader";
@forward "./smooth-scroll";
@forward "./home";
@forward "./components"; // New addition
```

### Using Path Aliases (Vite only)
```scss
// Instead of relative paths
@import "../../../node_modules/some-library/dist/styles";

// Use clean imports (when configured in Vite)
@import "~some-library/dist/styles";
```

### Using Sass Variables
```scss
// _base.scss
$primary-color: #007bff;
$font-stack: 'Helvetica Neue', Arial, sans-serif;

// _components.scss
.button {
  color: $primary-color;
  font-family: $font-stack;
}
```

## 🐛 Troubleshooting

### Common Issues

1. **"Sass not found" error**
   ```bash
   pnpm install sass --save-dev
   ```

2. **Vite compilation errors**
   - Check `vite.config.js` for syntax errors
   - Ensure all imported files exist

3. **Missing source maps**
   - Check `devSourcemap: true` in Vite config
   - Use `--source-map` flag for standalone compilation

4. **CSS not updating**
   - Clear browser cache
   - Restart dev server
   - Check file watchers are working

### Debug Commands

```bash
# Check Sass syntax
npm run sass:check

# Manual compilation test
sass styles/styles.scss test-output.css --style=expanded

# Check Vite config
npx vite --help
```

## 📈 Performance Optimizations

### Automatic Optimizations
- **CSS minification** via CSSnano
- **Vendor prefixing** via Autoprefixer  
- **Asset hashing** for cache busting
- **Tree shaking** for unused styles
- **Gzip compression** ready assets

### Manual Optimizations
- Use `@forward` instead of `@import` for better performance
- Organize partials logically to reduce compilation time
- Use CSS custom properties for dynamic theming
- Consider critical CSS extraction for large projects

## 🔗 Related Documentation

- [Sass Official Documentation](https://sass-lang.com/documentation)
- [Vite CSS Documentation](https://vitejs.dev/guide/features.html#css)
- [PostCSS Plugin Documentation](https://postcss.org/)
- [Autoprefixer Documentation](https://github.com/postcss/autoprefixer)