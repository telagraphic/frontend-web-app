import vento from "ventojs";
import { RenderError } from "../document.js";

export function createRenderer({ viewsDir }) {
  const env = vento({ includes: viewsDir, autoescape: true });

  return {
    extension: ".vto",
    invalidate: () => env.cache.clear(),
    async render(route, data) {
      const file = `pages/${route.key}.vto`;
      try {
        return (await env.run(file, data)).content;
      } catch (error) {
        throw RenderError.from(error, file);
      }
    },
  };
}
