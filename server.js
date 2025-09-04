import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { watch } from "node:fs/promises";
import nunjucks from "nunjucks";
import { exec } from "node:child_process";
import { promisify } from "node:util";
import { minify } from "html-minifier-terser";

const isProduction = process.env.NODE_ENV === "production";

const app = new Hono();

nunjucks.configure("./views", {
  autoescape: true,
  noCache: true,
});

/**
 * Serve static files from the dist directory
 * Not working with Bun
 */
app.use(
  "/dist/*",
  serveStatic({
    root: "./dist/",
  }),
);

/**
 * Custom bun middleware to serve static files from the dist directory
 */
app.use("/dist/*", async (c, next) => {
  const pathname = c.req.path;
  const filePath = `.${pathname}`;

  const file = Bun.file(filePath);

  if ((await file.exists()) && file.size > 0) {
    let contentType = "text/plain";
    if (pathname.endsWith(".css")) contentType = "text/css";
    if (pathname.endsWith(".js")) contentType = "text/javascript";

    return new Response(file, {
      headers: { "Content-Type": contentType },
    });
  }

  await next();
});

app.get("/*", (c) => {
  console.log(`📦 Rendering page: ${c.req.path}`);
  const response = renderPageWithNunjucks(c.req.path);
  return c.html(response);
});

/**
 * Run time SSR page generator for each route
 * @param {*} pathname like /index, /about
 * @returns
 */
async function renderPageWithNunjucks(pathname) {
  try {
    // Fetch external data
    // const routeData = await fetchRouteData(pathname);

    // Use pre-bundled asset paths
    const templateData = {
      cssPath: "/dist/styles.css", // ✅ Pre-bundled
      jsPath: "/dist/App.js", // ✅ Pre-bundled
      // ...routeData,
    };

    let routeName;

    // Check if index "/" or "/about"
    if (pathname === "/" || pathname === "/index.html") {
      routeName = "index";
    } else {
      routeName = pathname.slice(1); // Remove leading slash
    }

    const templatePath = `pages/${routeName}.html`;

    // Render template
    const newPage = nunjucks.render(templatePath, templateData);

    const minifiedPage = await minify(newPage, {
      collapseWhitespace: true,
      removeComments: true,
      removeRedundantAttributes: true,
      useShortDoctype: true,
      minifyCSS: true,
      minifyJS: true,
      removeEmptyAttributes: true,
      removeOptionalTags: true,
      removeScriptTypeAttributes: true,
      removeStyleLinkTypeAttributes: true,
      sortAttributes: true,
      sortClassName: true,
    });

    return minifiedPage;
  } catch (error) {
    console.error(`Failed to render ${pathname}:`, error);
    return new Response("Template rendering failed", { status: 500 });
  }
}

/**
 * Bun server that uses Hono app for serving routes
 */
Bun.serve({
  fetch: app.fetch,
  port: process.env.PORT || 3000,
});

/**
 * Fetches data from API's for each route
 * @param {*} pathname
 * @returns Promise
 */
async function fetchRouteData(pathname) {
  const handler = routeDataHandlers[pathname];

  if (!handler) {
    console.log(`📭 No data handler for route: ${pathname}`);
    return {
      message: "No external data needed for this route",
      success: true,
    };
  }

  try {
    console.log(`📡 Fetching data for route: ${pathname}`);
    const startTime = Date.now();

    const data = await handler();

    const duration = Date.now() - startTime;
    console.log(
      `✅ Data fetched for ${pathname} in ${duration}ms:`,
      Object.keys(data),
    );

    return data;
  } catch (error) {
    console.error(`❌ Failed to fetch data for ${pathname}:`, error);
    return {
      error: "Failed to load data",
      success: false,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Handles data fetching for the routes
 */
const routeDataHandlers = {
  "/mars": async () => {
    try {
      console.log("�� Fetching Mars data from NASA API...");

      // Example: NASA API call
      const response = await fetch(
        "https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY",
      );

      if (!response.ok) {
        throw new Error(`NASA API responded with ${response.status}`);
      }

      const nasaData = await response.json();

      return {
        nasaData,
        fetchedAt: new Date().toISOString(),
        success: true,
      };
    } catch (error) {
      console.error("Failed to fetch NASA data:", error);
      return {
        nasaData: null,
        error: "Failed to load NASA data",
        success: false,
      };
    }
  },
};

if (!isProduction) {
  startDevelopmentWatcher();
}

const execAsync = promisify(exec);

// TODO: Setup livereload with Bun?
async function startDevelopmentWatcher() {
  const stylesWatcher = watch("./styles", { recursive: true });
  const javascriptWatcher = watch("./app", { recursive: true });
  const htmlWatcher = watch("./views", { recursive: true });

  try {
    console.log("👀 Watching for file changes in ./styles, ./app, ./views");

    // Handle styles changes
    for await (const event of stylesWatcher) {
      if (event.filename) {
        console.log(`�� Styles changed: ${event.filename}`);
        await execAsync("bun run sass:build");
      }
    }
  } catch (error) {
    console.error("Styles watcher error:", error);
  }

  try {
    // Handle app changes
    for await (const event of htmlWatcher) {
      if (event.filename) {
        console.log(`📁 App changed: ${event.filename}`);
        await execAsync("bun run build:html-dev");
      }
    }
  } catch (error) {
    console.error("App watcher error:", error);
  }

  try {
    // Handle app changes
    for await (const event of javascriptWatcher) {
      if (event.filename) {
        console.log(`📁 App changed: ${event.filename}`);
        await execAsync("bun run build:js");
      }
    }
  } catch (error) {
    console.error("App watcher error:", error);
  }
}
