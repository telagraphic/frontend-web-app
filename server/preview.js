import { Hono } from "hono";
import { serveStatic } from "hono/bun";
import { existsSync } from "node:fs";

const port = Number(process.env.PORT) || 3000;
const app = new Hono();

app.use("/*", serveStatic({ root: "./dist" }));
app.notFound(async (c) => {
  const file = existsSync("dist/404.html") ? Bun.file("dist/404.html") : null;
  if (!file) return c.text("Not found", 404);
  return new Response(file, {
    status: 404,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
});

Bun.serve({
  port,
  fetch: app.fetch,
});

console.log(`Preview http://127.0.0.1:${port}`);
