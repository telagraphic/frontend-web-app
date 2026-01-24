/**
 * Utilities for the application for development and production environments
 */


/**
 * Check if the current environment is production
 * @returns {boolean} True if the current environment is production, false otherwise
 */
export const isProduction = () => {
  // Check for Node.js environment variable (build time)
  if (typeof process !== "undefined" && process.env?.NODE_ENV === "production") {
    return true;
  }
  
  // Check for Bun environment variable (build time)
  if (typeof process !== "undefined" && process.env?.BUN_ENV === "production") {
    return true;
  }
  
  // In browser: check if App.js is loaded from dist (production) vs app (development)
  // In production: <script src="./App.js"> or <script src="/App.js">
  // In development: <script src="../app/App.js">
  if (typeof document !== "undefined") {
    const scripts = document.getElementsByTagName("script");
    for (let script of scripts) {
      if (script.src && script.src.includes("App.js")) {
        // If App.js is in the root or dist, we're in production
        // If it contains /app/, we're in development
        const isFromApp = script.src.includes("/app/");
        return !isFromApp;
      }
    }
  }
  
  // Default to development if we can't determine
  return false;
};

/**
 * Enable Hot Module Reloading for development environment
 * @returns {void}
 */
export const liveReload = () => {
  if (!isProduction() && typeof import.meta !== "undefined" && import.meta.hot) {
    import.meta.hot.accept();
  }
};

/**
 * Setup the page configuration for the current environment
 * @returns {Object} The page configuration for the current environment
 */
export const setupPageConfig = () => {
  // Configuration for different environments
  const CONFIG = {
    development: {
      pagePath: "/app/pages/",
    },
    production: {
      // In production, dist/ is the root, so pages are at /pages/
      pagePath: "/pages/",
    },
  };

  return isProduction() ? CONFIG.production : CONFIG.development;
};

/**
 * Get the base URL for the site
 * Can be overridden via environment variable SITE_BASE_URL
 * @returns {string} The base URL (e.g., "https://shea-memorandum-site.netlify.app")
 */
export const getBaseUrl = () => {
  // Allow override via environment variable
  if (typeof process !== "undefined" && process.env?.SITE_BASE_URL) {
    return process.env.SITE_BASE_URL;
  }
  
  // Default base URL
  return "https://sheamemo.com";
};

