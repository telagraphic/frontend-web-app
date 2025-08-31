import { Glob } from "bun";

async function setupRoutes() {
  const glob = new Glob("**/*.html");

  const routes = {};
  for await (const file of glob.scan("./pages")) {
    const fileName = file.split("/").pop().replace(".html", "");
    const importPath = `./pages/${file}`;

    try {
      const importedModule = await import(importPath);

      if (fileName === "index") {
        routes["/"] = importedModule.default; // ✅ Access default export
      } else {
        routes[`/${fileName}`] = importedModule.default; // ✅ Access default export
      }
    } catch (error) {
      console.error(`Failed to import ${file}:`, error);
    }
  }

  return routes;
}

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

async function serveStaticFile(pathname) {
  const filePath = pathname.slice(1); // Remove leading slash
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



// If async does not work for Bun.serve
// const routes = await setupRoutes();

Bun.serve({
  routes: await setupRoutes(),
  async fetch(request) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // 1. Handle static assets first
    if (pathname.startsWith("/app")) {
      return serveStaticFile(pathname);
    }

    if (pathname.startsWith("/styles")) {
      return serveStaticFile(pathname);
    }

    if (pathname === "/favicon.ico") {
      return new Response("", { status: 204 }); // No content response
    }

    // 2. Handle page routes (for client-side routing)
    if (pathname !== "/" && pathname.startsWith("/")) {
      return serveFile(pathname);
    }

    // 3. Default route
    if (pathname === "/") {
      return routes["/"];
    }

    return new Response("Not found", { status: 404 });
  },
});
