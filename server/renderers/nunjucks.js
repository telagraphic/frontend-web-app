import nunjucks from "nunjucks";
import { RenderError } from "../document.js";

export function createRenderer({ viewsDir, noCache = true }) {
  const env = nunjucks.configure(viewsDir, {
    autoescape: true,
    noCache,
  });

  return {
    extension: ".njk",
    invalidate() {},
    async render(route, data) {
      const file = `pages/${route.key}.njk`;
      try {
        return env.render(file, data);
      } catch (error) {
        throw RenderError.from(error, file);
      }
    },
  };
}
