import { HtmlValidate } from "html-validate";
import { siteRoutes } from "../app/config/siteRoutes.js";
import { createRenderer } from "./renderer.js";
import { buildData } from "./data.js";
import { assertDocument, layoutRequiresHost } from "./document.js";

const viewsDir = `${import.meta.dir}/../views`;
const renderer = createRenderer({ viewsDir });
const assets = {
  head: "/assets/head.js",
  css: "/assets/styles.css",
  js: "/assets/App.js",
};
const validator = new HtmlValidate({
  extends: ["html-validate:recommended"],
  rules: {
    "doctype-style": "off",
    "void-style": "off",
    "attribute-empty-style": "off",
    "no-trailing-whitespace": "off",
  },
});

let failed = false;

for (const [key, record] of Object.entries(siteRoutes)) {
  const route = { key, ...record };
  const html = await renderer.render(route, buildData(route, assets));
  try {
    assertDocument(route, html, { requireHost: layoutRequiresHost(viewsDir) });
  } catch (error) {
    failed = true;
    console.error(`${route.path}: ${error.message}`);
    continue;
  }

  const report = await validator.validateString(html, `${key}.html`);
  if (!report.valid) {
    failed = true;
    for (const message of report.results.flatMap((result) => result.messages)) {
      console.error(
        `${route.path}: ${message.ruleId} ${message.message} (${message.line}:${message.column})`,
      );
    }
  } else {
    console.log(`${route.path}: ok`);
  }
}

if (failed) process.exit(1);
