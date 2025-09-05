import { Glob } from "bun";
import { watch } from "node:fs";
import { promisify } from "node:util";
import { exec } from "node:child_process";

// Environment detection
const isProduction = process.env.NODE_ENV === "production" || process.env.BUN_ENV === "production";
const isDevelopment = !isProduction;

console.log(`Running in ${isProduction ? "production" : "development"} mode`);

/**
 * Returns a page HTMLBundle from /pages for each route (development only)
 * @returns bundled html file
 */
async function setupRoutes() {
  const glob = new Glob("**/*.html");

  const routes = {};
  for await (const file of glob.scan("./pages")) {
    const fileName = file.split("/").pop().replace(".html", "");
    const importPath = `./pages/${file}`;

    try {
      const importedModule = await import(importPath);

      if (fileName === "index") {
        routes["/"] = importedModule.default;
      } else {
        routes[`/${fileName}`] = importedModule.default;
      }
    } catch (error) {
      console.error(`Failed to import ${file}:`, error);
    }
  }

  return routes;
}

/**
 * Finds the page/*.html to serve
 * @param {*} pathname
 * @returns
 */
async function serveFile(pathname) {
  const routeName = pathname.slice(1);
  const filePath = `pages/${routeName}.html`;

  const file = Bun.file(filePath);

  if (!file.size || file.size === 0) {
    return new Response("Page not found", { status: 404 });
  }

  const fileContent = await file.text();

  return new Response(fileContent, {
    headers: { "Content-Type": file.type },
  });
}

/**
 * Serves production HTML pages from dist folder
 * @param {string} pathname - The route path
 * @returns {Response} HTML response
 */
async function serveProductionPage(pathname) {
  let fileName = pathname === "/" ? "index" : pathname.slice(1);
  const filePath = `dist/${fileName}.html`;
  
  const file = Bun.file(filePath);
  
  if (!file.size || file.size === 0) {
    return new Response("Page not found", { status: 404 });
  }
  
  const fileContent = await file.text();
  
  return new Response(fileContent, {
    headers: { "Content-Type": "text/html" },
  });
}

/**
 * Serves static files css, js, images, etc...
 * Acts as middleware for serving static files
 * @param {string} pathname - The file path
 * @param {string} basePath - Optional base path (e.g., "./dist")
 * @returns {Response} File response
 */
async function serveStaticFile(pathname, basePath = "") {
  const filePath = basePath ? `${basePath}${pathname}` : pathname.slice(1);
  const file = Bun.file(filePath);

  if (!file.size || file.size === 0) {
    return new Response("File not found", { status: 404 });
  }

  const fileContent = await file.text();

  // Determine content type based on file extension
  let contentType = "text/plain";
  if (pathname.endsWith(".css")) contentType = "text/css";
  if (pathname.endsWith(".js")) contentType = "text/javascript";
  if (pathname.endsWith(".html")) contentType = "text/html";

  return new Response(fileContent, {
    headers: { "Content-Type": contentType },
  });
}



Bun.serve({
  routes: isDevelopment ? await setupRoutes() : {},
  async fetch(request) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // 1. Handle production assets from dist folder first
    if (isProduction && (pathname === "/App.js" || pathname === "/styles.css")) {
      return serveStaticFile(pathname, "./dist");
    }

    // 2. Handle static assets
    if (pathname.startsWith("/app")) {
      return serveStaticFile(pathname);
    }

    if (pathname.startsWith("/styles")) {
      return serveStaticFile(pathname);
    }

    if (pathname === "/favicon.ico") {
      return new Response("", { status: 204 });
    }

    // 2. Handle page routes
    if (pathname !== "/" && pathname.startsWith("/")) {
      if (isProduction) {
        return serveProductionPage(pathname);
      } else {
        return serveFile(pathname);
      }
    }

    // 3. Default route
    if (pathname === "/") {
      if (isProduction) {
        return serveProductionPage("/");
      } else {
        return routes["/"];
      }
    }

    return new Response("Not found", { status: 404 });
  },
});


if (!isProduction) {
  startDevelopmentWatcher();
}

/**
 * Starts the development watcher for development mode
 * Console logs the build output and errors
 * TODO: Setup livereload with Bun?
 * @returns {void}
 */


function startDevelopmentWatcher() {
  const execAsync = promisify(exec);
  
  // Configuration for each watcher
  const watcherConfigs = [
    {
      path: "./styles",
      name: "Styles",
      icon: "🎨",
      command: "bun run sass:build"
    },
    {
      path: "./views", 
      name: "HTML",
      icon: "📁",
      command: "bun run build:html:dev"
    },
    {
      path: "./app",
      name: "JavaScript", 
      icon: "📁",
      command: "bun run build:js"
    }
  ];

  console.log(`👀 Watching for file changes in ${watcherConfigs.map(c => c.path).join(", ")}`);

  // Create watchers using event-based approach
  watcherConfigs.forEach(config => {
    const watcher = watch(config.path, { recursive: true });
    
    watcher.on('change', async (eventType, filename) => {
      if (filename) {
        console.log(`${config.icon} ${config.name} changed: ${filename}`);
        console.log(`🚀 Running: ${config.command}`);
        try {
          const { stdout, stderr } = await execAsync(config.command);
          if (stdout) {
            console.log(`✅ ${config.name} build output:`);
            console.log(stdout);
          }
          if (stderr) {
            console.warn(`⚠️ ${config.name} build warnings:`);
            console.warn(stderr);
          }
          console.log(`✨ ${config.name} build completed!`);
        } catch (error) {
          console.error(`❌ ${config.name} build error:`, error.message);
          if (error.stdout) console.log('stdout:', error.stdout);
          if (error.stderr) console.error('stderr:', error.stderr);
        }
      }
    });
    
    watcher.on('error', (error) => {
      console.error(`${config.name} watcher error:`, error);
    });
  });
}
