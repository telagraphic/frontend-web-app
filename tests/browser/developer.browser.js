import { expect, test } from "@playwright/test";

test.describe("developer", () => {
  test("links the diagnostic pages", async ({ page }) => {
    await page.goto("/admin");
    await expect(
      page.getByRole("link", { name: "Experiments" }),
    ).toHaveAttribute("href", "/experiments");
    await expect(
      page.getByRole("link", { name: "Playwright report" }),
    ).toHaveAttribute("href", "/playwright-report/");
    await expect(
      page.getByRole("link", { name: "Wizard setups" }),
    ).toHaveAttribute("href", "/admin/setups/");
    await expect(page.getByRole("link", { name: "Codebase" })).toHaveAttribute(
      "href",
      "/admin/codebase",
    );
    await expect(page.getByRole("link", { name: "Docs" })).toHaveAttribute(
      "href",
      "http://127.0.0.1:4321/",
    );
  });

  test("serves the playwright report route and the setups route", async ({
    page,
  }) => {
    const report = await page.goto("/playwright-report/");
    if (report?.status() === 404) {
      await expect(page.locator("h1")).toHaveText("Playwright report");
    } else {
      expect(report?.status()).toBe(200);
    }

    const experiments = await page.goto("/experiments");
    expect(experiments?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveText("Experiments");

    const codebase = await page.goto("/admin/codebase");
    expect(codebase?.status()).toBe(200);
    await expect(page.locator("h1")).toHaveText("Codebase");
    await expect(page.getByRole("link", { name: "Overview" })).toHaveAttribute(
      "href",
      "http://127.0.0.1:4321/reference/overview",
    );

    const setups = await page.goto("/admin/setups/");
    expect([200, 404]).toContain(setups?.status());
    await expect(page.locator("h1")).toHaveText("Wizard setups");
  });
});
