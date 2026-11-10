import { expect, test } from "@playwright/test";
import {
  appSource,
  skipPreloader,
  waitForCover,
  waitForSettled,
} from "./helpers.js";

test.describe("navigation", () => {
  test("covers then reveals from not-found to home when a host is present", async ({
    page,
  }) => {
    await skipPreloader(page);
    await page.goto("/404");
    await waitForSettled(page, "not-found");

    const host = page.locator("[data-transition-host]");
    test.skip(
      (await host.count()) === 0,
      "no overlay host on this combination",
    );

    const headSrc = await page
      .locator("head script[src]")
      .first()
      .getAttribute("src");
    const headJs = await (await page.request.get(headSrc)).text();
    test.skip(
      headJs.includes("gsap-cover"),
      "GSAP document-load cover happens on the next document",
    );

    const covered = waitForCover(page);
    await page.locator("main a.internal-link[href='/']").click();
    await covered;

    await waitForSettled(page, "home");
    await expect(host).toBeEmpty();
    await expect(page).toHaveURL(/\/$/);
  });

  test("menu navigates from home to about and back", async ({ page }) => {
    await skipPreloader(page);
    await page.goto("/");
    await waitForSettled(page, "home");

    await openMenu(page);
    await page.locator("a.navigation__link[href='/about']").click();
    await waitForSettled(page, "about");
    await expect(page).toHaveURL(/\/about$/);

    await openMenu(page);
    await page.locator("a.navigation__link[href='/']").click();
    await waitForSettled(page, "home");
    await expect(page).toHaveURL(/\/$/);
  });

  test("clicking Home from not-found lands on home", async ({ page }) => {
    await skipPreloader(page);
    await page.goto("/404");
    await waitForSettled(page, "not-found");

    await page.locator("main a.internal-link[href='/']").click();
    await waitForSettled(page, "home");
    await expect(page).toHaveURL(/\/$/);
  });

  test("back and forward restore the route", async ({ page }) => {
    await skipPreloader(page);
    await page.goto("/");
    await waitForSettled(page, "home");
    await page.goto("/404");
    await waitForSettled(page, "not-found");

    await page.locator("main a.internal-link[href='/']").click();
    await waitForSettled(page, "home");

    await page.goBack();
    await waitForSettled(page, "not-found");
    await expect(page).toHaveURL(/\/404$/);

    await page.goForward();
    await waitForSettled(page, "home");
    await expect(page).toHaveURL(/\/$/);
  });

  test("settled home after reveal", async ({ page }) => {
    await skipPreloader(page);
    await page.goto("/");
    await waitForSettled(page, "home");
    await page.evaluate(() => document.fonts.ready);
    await expect(page.locator("main")).toHaveScreenshot("home-settled.png");
  });
});

test.describe("page swap", () => {
  test("moves focus to main", async ({ page }) => {
    await skipPreloader(page);
    await page.goto("/404");
    await waitForSettled(page, "not-found");
    test.skip(
      !(await appSource(page)).includes("listenFocus"),
      "document load does not move focus on navigation",
    );

    await page.locator("main a.internal-link[href='/']").click();
    await waitForSettled(page, "home");
    await expect(page.locator("main")).toBeFocused();
  });

  test("view transition calls startViewTransition", async ({ page }) => {
    await skipPreloader(page);
    await page.goto("/404");
    await waitForSettled(page, "not-found");
    test.skip(
      !(await appSource(page)).includes("startViewTransition"),
      "this combination does not use the view-transition page swap",
    );

    await page.evaluate(() => {
      const native = document.startViewTransition?.bind(document);
      document.startViewTransition = (callback) => {
        window.__viewTransitionCalls = (window.__viewTransitionCalls ?? 0) + 1;
        if (native) return native(callback);
        const finished = Promise.resolve().then(() => callback());
        return { finished, ready: finished, updateCallbackDone: finished };
      };
    });

    await page.locator("main a.internal-link[href='/']").click();
    await waitForSettled(page, "home");
    expect(await page.evaluate(() => window.__viewTransitionCalls)).toBe(1);
  });
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("a first visit does not add is-loading", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("html")).not.toHaveClass(/is-loading/);
  });
});

test.describe("not-found", () => {
  test("unknown paths keep the URL and render not-found with HTTP 404", async ({
    page,
  }) => {
    await skipPreloader(page);
    const response = await page.goto("/does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(page).toHaveURL(/\/does-not-exist$/);
    await expect(page.locator("main")).toHaveAttribute(
      "data-route",
      "not-found",
    );
  });

  test("direct /404 is the route and returns 200", async ({ page }) => {
    await skipPreloader(page);
    const response = await page.goto("/404");
    expect(response?.status()).toBe(200);
    await expect(page.locator("main")).toHaveAttribute(
      "data-route",
      "not-found",
    );
  });
});

test.describe("pageshow", () => {
  test.use({ reducedMotion: "no-preference" });

  test("persisted restore clears loading, inert, and the host", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      sessionStorage.removeItem("preloader-played");
    });
    await page.goto("/", { waitUntil: "domcontentloaded" });

    await expect(page.locator("html")).toHaveClass(/is-loading/);
    await expect(page.locator("main")).toHaveAttribute("inert", "");

    await page.evaluate(() => {
      window.dispatchEvent(
        new PageTransitionEvent("pageshow", {
          persisted: true,
          bubbles: true,
        }),
      );
    });

    await expect(page.locator("html")).not.toHaveClass(/is-loading/);
    await expect(page.locator("main")).not.toHaveAttribute("inert");
    const host = page.locator("[data-transition-host]");
    if (await host.count()) {
      await expect(host).toHaveAttribute("hidden", "");
    }
  });
});

async function openMenu(page) {
  const nav = page.locator("[data-navigation]");
  if ((await nav.getAttribute("data-navigation-status")) === "active") return;
  await page.locator("[data-navigation-toggle]").click();
  await expect(nav).toHaveAttribute("data-navigation-status", "active");
}
