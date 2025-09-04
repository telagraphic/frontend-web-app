import nunjucks from "nunjucks";
import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { watch } from "node:fs/promises";
import { exec } from "node:child_process";
import { promisify } from "node:util";

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

    // Render template
    let routeName;
    if (pathname === "/" || pathname === "/index.html") {
      routeName = "index";
    } else {
      routeName = pathname.slice(1); // Remove leading slash
    }
    const templatePath = `pages/${routeName}.html`;
    return nunjucks.render(templatePath, templateData);
  } catch (error) {
    console.error(`Failed to render ${pathname}:`, error);
    return new Response("Template rendering failed", { status: 500 });
  }
}

// server.js
const isProduction = process.env.NODE_ENV === "production";

Bun.serve({
  fetch: app.fetch,
  port: process.env.PORT || 3000,
});

if (!isProduction) {
  console.log("��️ Development mode: Starting file watcher...");
  startDevelopmentWatcher();
}

const execAsync = promisify(exec);

async function startDevelopmentWatcher() {
  try {
    console.log("👀 Watching for file changes in ./styles and ./app...");

    // Watch both styles and app directories
    const stylesWatcher = watch("./styles", { recursive: true });
    const appWatcher = watch("./app", { recursive: true });

    // Handle styles changes
    for await (const event of stylesWatcher) {
      if (event.filename) {
        console.log(`�� Styles changed: ${event.filename}`);
        await rebuildStyles();
      }
    }
  } catch (error) {
    console.error("Styles watcher error:", error);
  }

  try {
    // Handle app changes
    for await (const event of appWatcher) {
      if (event.filename) {
        console.log(`📁 App changed: ${event.filename}`);
        await rebuildJavaScript();
      }
    }
  } catch (error) {
    console.error("App watcher error:", error);
  }
}

async function rebuildStyles() {
  try {
    console.log("🎨 Rebuilding styles...");
    await execAsync("bun run sass:build");
    console.log("✅ Styles rebuilt successfully");
  } catch (error) {
    console.error("❌ Failed to rebuild styles:", error);
  }
}

async function rebuildJavaScript() {
  try {
    console.log("⚡ Rebuilding JavaScript...");
    await execAsync("bun run build:js");
    console.log("✅ JavaScript rebuilt successfully");
  } catch (error) {
    console.error("❌ Failed to rebuild JavaScript:", error);
  }
}

// Route-specific data fetching configuration
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
