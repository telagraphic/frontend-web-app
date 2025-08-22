import { defineConfig } from "vite";
import { resolve } from "path";
import { glob } from "glob";
import path from "path";

export default defineConfig({
  // Base URL for assets - "./" means relative paths for deployment flexibility
  // Use "./" for static hosting, "/" for root domain hosting
  base: "./",

  // Build configuration - Controls how Vite bundles your app for production
  build: {
    // Output directory - Where the final build files go
    outDir: "dist",

    // Clean output directory before build - Removes old files automatically
    emptyOutDir: true,

    // Generate sourcemaps for debugging - Helps trace compiled code back to source
    sourcemap: true,

    // Asset handling - Subfolder name for CSS, JS, images within dist/
    assetsDir: "assets",

    // Rollup options for advanced bundling - Rollup is Vite's underlying bundler
    rollupOptions: {
      input: {
        // Entry point - tells Vite where to start building from
        main: resolve(__dirname, "index.html"),
        // Automatically include all HTML files from pages directory
        ...Object.fromEntries(
          glob.sync("pages/*.html").map(file => [
            path.basename(file, ".html"),
            resolve(__dirname, file)
          ])
        )
      },
      output: {
        // Organize output files - Control where different file types go
        entryFileNames: "assets/js/[name]-[hash].js", // Main JS files
        chunkFileNames: "assets/js/[name]-[hash].js", // Code-split chunks
        assetFileNames: (assetInfo) => {
          // CSS, images, fonts, etc.
          const info = assetInfo.name.split(".");
          const ext = info[info.length - 1];

          // CSS files go to assets/css/ folder
          if (/\.(css|scss|sass)$/.test(assetInfo.name)) {
            return "assets/css/[name]-[hash].[ext]";
          }
          // Images go to assets/images/ folder
          if (
            /\.(png|jpe?g|svg|gif|tiff|bmp|ico|webp)$/i.test(assetInfo.name)
          ) {
            return "assets/images/[name]-[hash].[ext]";
          }
          // Fonts go to assets/fonts/ folder
          if (/\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
            return "assets/fonts/[name]-[hash].[ext]";
          }

          // Everything else goes to assets/ with hash for cache busting
          return "assets/[name]-[hash].[ext]";
        },
      },
    },

    // Minification - Compress and optimize JS/CSS for smaller file sizes
    minify: true,
  },

  // CSS configuration - Controls how CSS and preprocessors are handled
  css: {
    // Enable CSS modules - Set to true for scoped CSS classes (we don't need this)
    modules: false,

    // PostCSS configuration - Automatically uses postcss.config.js
    // PostCSS adds autoprefixer and minification
    postcss: {},

    // Sass/SCSS preprocessor options - Configure how Sass files are compiled
    preprocessorOptions: {
      scss: {
        // Add global variables or mixins here if needed - inject into every .scss file
        additionalData: ``,

        // Sass compilation options
        outputStyle: "compressed", // Minify CSS output
        sourceMap: true, // Generate source maps for debugging

        // Include paths for @import - Where Sass looks for imported files
        includePaths: [
          resolve(__dirname, "styles"), // Your styles folder
          resolve(__dirname, "node_modules"), // npm packages
        ],
      },
    },

    // Enable CSS source maps in development - Helps debug CSS in browser dev tools
    devSourcemap: true,
  },

  // Development server configuration - Settings for `npm run dev`
  server: {
    port: 3000, // Dev server runs on localhost:3000
    host: true, // Accept connections from any IP (useful for mobile testing)
    open: true, // Automatically open browser when server starts

    // Hot Module Replacement - Updates code without full page refresh
    hmr: {
      overlay: true, // Show error overlay when compilation fails
    },
  },

  // Preview server configuration - Settings for `npm run preview` (tests production build)
  preview: {
    port: 4173, // Preview server runs on localhost:4173
    host: true, // Accept connections from any IP
    open: true, // Automatically open browser
  },

  // Asset optimization - Tell Vite about additional file types to process
  assetsInclude: ["**/*.webp", "**/*.avif"],

  // Plugin configuration - Extend Vite's functionality
  plugins: [
    // Add any additional plugins here if needed
    // Examples: Vue(), React(), legacy browser support, etc.
  ],

  // Resolve configuration - Configure import paths and aliases
  resolve: {
    alias: {
      // Path aliases - Use these shortcuts in your imports
      "@": resolve(__dirname, "."), // @ = project root
      "@styles": resolve(__dirname, "styles"), // @styles = styles folder
      "@images": resolve(__dirname, "images"), // @images = images folder
      "@app": resolve(__dirname, "app"), // @app = app folder
      "@pages": resolve(__dirname, "pages"), // @pages = pages folder
    },
  },

  // Optimize dependencies - Pre-bundle these packages for faster dev server startup
  optimizeDeps: {
    include: ["gsap", "event-emitter"], // Your main dependencies
  },
});
