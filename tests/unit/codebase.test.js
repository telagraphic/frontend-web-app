import { existsSync } from "node:fs";
import { describe, expect, test } from "bun:test";
import {
  codebasePage,
  projectOptions,
} from "../../server/developer/codebase.js";

describe("codebase page", () => {
  test("names the wired wizard options above the file list", () => {
    const options = projectOptions();
    const html = codebasePage("http://127.0.0.1:4321/");
    const label = html.indexOf(options.transition);
    const files = html.indexOf("<h2>Files</h2>");

    expect(label).toBeGreaterThan(-1);
    expect(files).toBeGreaterThan(label);
    expect(html).toContain(options.navigation);
    expect(html).toContain(options.renderer);
    if (options.transition === "GSAP transition") {
      expect(html).toContain("app/services/GsapTransitions.js");
      expect(html).not.toContain("app/services/ViewTransitions.js");
    } else if (
      options.transition === "View transition" &&
      existsSync("app/services/ViewTransitions.js")
    ) {
      expect(html).toContain("app/services/ViewTransitions.js");
      expect(html).not.toContain("app/services/GsapTransitions.js");
    } else {
      expect(html).not.toContain("app/services/GsapTransitions.js");
      expect(html).not.toContain("app/services/ViewTransitions.js");
    }

    if (existsSync("wizard/create.js")) {
      expect(options).toEqual({
        transition: "GSAP transition",
        navigation: "Page swap",
        renderer: "Nunjucks",
      });
    }
  });
});
