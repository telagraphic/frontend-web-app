import { describe, expect, test } from "bun:test";
import { siteRoutes } from "../../app/config/siteRoutes.js";
import { createRenderer } from "../../server/renderer.js";
import { buildData } from "../../server/data.js";
import { assertDocument, layoutRequiresHost } from "../../server/document.js";

const viewsDir = `${import.meta.dir}/../../views`;
const renderer = createRenderer({ viewsDir });
const assets = {
  head: "/assets/head.js",
  css: "/assets/styles.css",
  js: "/assets/App.js",
};

const requireHost = layoutRequiresHost(viewsDir);

describe("assertDocument", () => {
  for (const [key, record] of Object.entries(siteRoutes)) {
    test(`${record.path} produces the document shell`, async () => {
      const route = { key, ...record };
      const html = await renderer.render(route, buildData(route, assets));
      assertDocument(route, html, { requireHost });
      expect(html).toContain(`data-route="${key}"`);
    });
  }
});
