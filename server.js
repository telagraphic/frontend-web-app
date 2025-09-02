import { Glob } from "bun";
import nunjucks from "nunjucks";
import { Hono } from "hono";
import { watch } from 'node:fs/promises';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

nunjucks.configure("./views", {
  autoescape: true,
  noCache: true,
});

// async function setupRoutes() {
//   const glob = new Glob("**/*.html");

//   const routes = {};
//   for await (const file of glob.scan("./views/pages")) {
//     const fileName = file.split("/").pop().replace(".html", "");
//     const importPath = `./views/pages/${file}`;

//     try {
//       const importedModule = await import(importPath);

//       if (fileName === "index") {
//         routes["/"] = importedModule.default; // ✅ Access default export
//       } else {
//         routes[`/${fileName}`] = importedModule.default; // ✅ Access default export
//       }
//     } catch (error) {
//       console.error(`Failed to import ${file}:`, error);
//     }
//   }

//   return routes;
// }

async function setupRoutes() {
  const glob = new Glob("**/*.html");

  const routes = {};
  for await (const file of glob.scan("./views/pages")) {
    const fileName = file.split("/").pop().replace(".html", "");
    const templatePath = `views/pages/${fileName}.html`;

    try {
      if (fileName === "index") {
        routes["/"] = templatePath;
      } else {
        routes[`/${fileName}`] = templatePath;
      }
    } catch (error) {
      console.error(`Failed to setup route for ${file}:`, error);
    }
  }

  console.log(routes);

  return routes;
}

async function serveFile(pathname) {
  const routeName = pathname.slice(1);
  const filePath = `views/pages/${routeName}.html`;

  const file = Bun.file(filePath);

  if (!file.size || file.size === 0) {
    return new Response("Page not found", { status: 404 });
  }

  const fileContent = await file.text();

  return new Response(fileContent, {
    headers: { "Content-Type": file.type },
  });
}

async function serveStaticFile(pathname) {
  const filePath = pathname.slice(1); // Remove leading slash
  const file = Bun.file(filePath);

  if (!file.size || file.size === 0) {
    return new Response("File not found", { status: 404 });
  }

  let contentType = "text/plain";
  if (pathname.endsWith(".css")) contentType = "text/css";
  if (pathname.endsWith(".js")) contentType = "text/javascript";

  const fileContent = await file.text();
  return new Response(fileContent, {
    headers: { "Content-Type": contentType },
  });
}

// If async does not work for Bun.serve
// Check if route is a valid page
function isValidPageRoute(pathname) {
  const validRoutes = [
    "/about",
    "/gallery",
    "/earth",
    "/mars",
    "/jupiter",
    "/saturn",
    "/uranus",
    "/neptune",
    "/pluto",
    "/moons",
    "/mercury",
    "/venus",
    "/navigation",
  ];
  return validRoutes.includes(pathname);
}

// Render page with Nunjucks
async function renderPageWithNunjucks(pathname) {
  try {
    // Fetch external data
    const routeData = await fetchRouteData(pathname);
    
    // Use pre-bundled asset paths
    const templateData = {
      cssPath: '/dist/styles.css',  // ✅ Pre-bundled
      jsPath: '/dist/App.js',       // ✅ Pre-bundled
      ...routeData
    };
    
    // Render template
    const routeName = pathname === "/" ? "index" : pathname.slice(1);
    const templatePath = `pages/${routeName}.html`;
    
    const renderedHTML = nunjucks.render(templatePath, templateData);
    
    return new Response(renderedHTML, {
      headers: { "Content-Type": "text/html" },
    });
    
  } catch (error) {
    console.error(`Failed to render ${pathname}:`, error);
    return new Response("Template rendering failed", { status: 500 });
  }
}

// server.js
const isProduction = process.env.NODE_ENV === "production";

Bun.serve({
  async fetch(request) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    try {
      // Serve pre-bundled assets from dist/
      if (pathname.startsWith('/dist/')) {
        const file = Bun.file(`.${pathname}`);
        if (await file.exists()) {
          return new Response(file);
        }
      }
      
      // Render pages with pre-bundled assets
      if (pathname === "/" || isValidPageRoute(pathname)) {
        return await renderPageWithNunjucks(pathname);
      }

      if (pathname === "/favicon.ico") {
        return new Response("", { status: 204 });
      }
      
      return new Response("Not found", { status: 404 });
      
    } catch (error) {
      console.error(`Server error:`, error);
      return new Response("Server error", { status: 500 });
    }
  }
});

if (!isProduction) {
  console.log('��️ Development mode: Starting file watcher...');
  startDevelopmentWatcher();
}

const execAsync = promisify(exec);

async function startDevelopmentWatcher() {
  try {
    console.log('👀 Watching for file changes in ./styles and ./app...');
    
    // Watch both styles and app directories
    const stylesWatcher = watch('./styles', { recursive: true });
    const appWatcher = watch('./app', { recursive: true });
    
    // Handle styles changes
    for await (const event of stylesWatcher) {
      if (event.filename) {
        console.log(`�� Styles changed: ${event.filename}`);
        await rebuildStyles();
      }
    }
  } catch (error) {
    console.error('Styles watcher error:', error);
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
    console.error('App watcher error:', error);
  }
}

async function rebuildStyles() {
  try {
    console.log('🎨 Rebuilding styles...');
    await execAsync('bun run sass:build');
    console.log('✅ Styles rebuilt successfully');
  } catch (error) {
    console.error('❌ Failed to rebuild styles:', error);
  }
}

async function rebuildJavaScript() {
  try {
    console.log('⚡ Rebuilding JavaScript...');
    await execAsync('bun run build:js');
    console.log('✅ JavaScript rebuilt successfully');
  } catch (error) {
    console.error('❌ Failed to rebuild JavaScript:', error);
  }
}

// Route-specific data fetching configuration
const routeDataHandlers = {  
  '/mars': async () => {
    try {
      console.log('�� Fetching Mars data from NASA API...');
      
      // Example: NASA API call
      const response = await fetch('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY');
      
      if (!response.ok) {
        throw new Error(`NASA API responded with ${response.status}`);
      }
      
      const nasaData = await response.json();
      
      return {
        nasaData,
        fetchedAt: new Date().toISOString(),
        success: true
      };
      
    } catch (error) {
      console.error('Failed to fetch NASA data:', error);
      return {
        nasaData: null,
        error: 'Failed to load NASA data',
        success: false
      };
    }
  },  
};

async function fetchRouteData(pathname) {
  const handler = routeDataHandlers[pathname];
  
  if (!handler) {
    console.log(`📭 No data handler for route: ${pathname}`);
    return {
      message: 'No external data needed for this route',
      success: true
    };
  }
  
  try {
    console.log(`📡 Fetching data for route: ${pathname}`);
    const startTime = Date.now();
    
    const data = await handler();
    
    const duration = Date.now() - startTime;
    console.log(`✅ Data fetched for ${pathname} in ${duration}ms:`, Object.keys(data));
    
    return data;
    
  } catch (error) {
    console.error(`❌ Failed to fetch data for ${pathname}:`, error);
    return {
      error: 'Failed to load data',
      success: false,
      timestamp: new Date().toISOString()
    };
  }
}
