import { readFileSync } from "node:fs";
import { docsServer } from "./developer/docsUrl.js";
import { docsResponse, docsSearchIndex } from "./developer/docsPage.js";
import { developerFontFile } from "./developer/theme.js";

const { host, port } = docsServer();

Bun.serve({
  hostname: host,
  port,
  async fetch(request) {
    const url = new URL(request.url);
    let path = url.pathname;
    try {
      path = decodeURIComponent(url.pathname);
    } catch {
      path = url.pathname;
    }

    if (path === "/docs.css") {
      const css = `${readFileSync(new URL("./developer/geist-gray.css", import.meta.url), "utf8")}\n${readFileSync(new URL("./developer/docs.css", import.meta.url), "utf8")}`;
      return new Response(css, {
        headers: { "Content-Type": "text/css; charset=utf-8" },
      });
    }
    if (path === "/docs-client.js") {
      return staticFile(
        "server/developer/docsClient.js",
        "text/javascript; charset=utf-8",
      );
    }
    if (path === "/docsSearch.js") {
      return staticFile(
        "server/developer/docsSearch.js",
        "text/javascript; charset=utf-8",
      );
    }
    if (path === "/search.json") {
      return Response.json(await docsSearchIndex());
    }

    const font = path.match(/^\/fonts\/([\w-]+)\/([\w.-]+\.woff2)$/);
    if (font) {
      const file = developerFontFile(font[1], font[2]);
      if (!file) return new Response("Not found", { status: 404 });
      return new Response(Bun.file(file), {
        headers: { "Content-Type": "font/woff2" },
      });
    }

    const page = await docsResponse(path);
    return new Response(page.html, {
      status: page.status,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  },
});

console.log(`Docs http://${host}:${port}/`);

function staticFile(path, type) {
  return new Response(Bun.file(path), {
    headers: { "Content-Type": type },
  });
}
