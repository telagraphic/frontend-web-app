import { describe, expect, test } from "bun:test";
import {
  codebasePage,
  projectOptions,
} from "../../server/developer/codebase.js";

describe("codebase page", () => {
  test("names the wired wizard options above the file list", () => {
    expect(projectOptions()).toEqual({
      transition: "GSAP transition",
      navigation: "Page swap",
      renderer: "Nunjucks",
    });

    const html = codebasePage("http://127.0.0.1:4321/");
    const options = html.indexOf("GSAP transition");
    const files = html.indexOf("<h2>Files</h2>");
    expect(options).toBeGreaterThan(-1);
    expect(files).toBeGreaterThan(options);
    expect(html).toContain("Page swap");
    expect(html).toContain("Nunjucks");
    expect(html).toContain("app/services/GsapTransitions.js");
    expect(html).not.toContain("app/services/ViewTransitions.js");
  });
});
