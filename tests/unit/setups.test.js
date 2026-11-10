import { describe, expect, test } from "bun:test";
import {
  freshResults,
  knownSkips,
  scoreboardDocument,
  setups,
  skippedTitles,
  skipsMatch,
} from "../../scripts/setups.js";

describe("wizard setups", () => {
  test("lists the seven wizard folders", () => {
    expect(setups.map((setup) => setup.folder)).toEqual([
      "wizard-gsap-page-swap",
      "wizard-gsap-document-load",
      "wizard-view-page-swap",
      "wizard-view-document-load",
      "wizard-none-document-load",
      "wizard-gsap-page-swap-vento",
      "wizard-gsap-page-swap-jsx",
    ]);
    expect(setups.filter((setup) => setup.browser)).toHaveLength(5);
  });

  test("scoreboard starts pending and names the expected skips", () => {
    const html = scoreboardDocument(freshResults());
    expect(html).toContain("<h1>Wizard setups</h1>");
    expect(html).toContain("wizard-none-document-load");
    expect(html).toContain("Playwright off");
    expect(html).toContain(knownSkips[0]);
    expect(html.match(/pending/g).length).toBeGreaterThan(20);
  });

  test("reads skipped Playwright titles from the list reporter", () => {
    const output = `
  ✓  1 [chromium] › tests/browser/navigation.browser.js:42:3 › navigation › clicking Home from not-found lands on home
  -  2 [chromium] › tests/browser/navigation.browser.js:10:3 › navigation › covers then reveals from not-found to home when a host is present
  -  3 [chromium] › tests/browser/navigation.browser.js:81:3 › page swap › moves focus to main
`;
    const saw = skippedTitles(output);
    expect(saw).toEqual([
      "covers then reveals from not-found to home when a host is present",
      "moves focus to main",
    ]);
    expect(skipsMatch(saw, saw)).toBe(true);
    expect(skipsMatch(["moves focus to main"], saw)).toBe(false);
  });
});
