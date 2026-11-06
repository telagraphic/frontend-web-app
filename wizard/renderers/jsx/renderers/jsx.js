import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { join, resolve as resolvePath } from "node:path";
import { renderToString } from "hono/jsx/dom/server";
import { RenderError } from "../document.js";

const require = createRequire(import.meta.url);

export function createRenderer({ viewsDir }) {
  const viewsRoot = resolvePath(viewsDir);

  return {
    extension: ".jsx",
    invalidate() {
      for (const key of Object.keys(require.cache)) {
        if (key.startsWith(viewsRoot)) delete require.cache[key];
      }
    },
    async render(route, data) {
      const file = join(viewsRoot, "pages", `${route.key}.jsx`);
      try {
        const href = `${pathToFileURL(file).href}?t=${Date.now()}`;
        const { default: Page } = await import(href);
        return `<!doctype html>${renderToString(Page(data))}`;
      } catch (error) {
        throw RenderError.from(error, `pages/${route.key}.jsx`);
      }
    },
  };
}
