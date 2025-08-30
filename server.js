import index from "./pages/index.html";

Bun.serve({
  routes: {
    "/": index,
  },

  async fetch(request) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    const serveFile = async (pathname) => {
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
    };

    const serveStaticFile = async (pathname) => {
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
    };

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
      return index;
    }

    return new Response("Not found", { status: 404 });
  },
});
