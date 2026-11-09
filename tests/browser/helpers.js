import { expect } from "@playwright/test";

export async function skipPreloader(page) {
  await page.addInitScript(() => {
    sessionStorage.setItem("preloader-played", "1");
  });
}

export async function waitForSettled(page, route) {
  await expect(page.locator("main")).toHaveAttribute("data-route", route);
  const host = page.locator("[data-transition-host]");
  if (await host.count()) {
    await expect(host).toHaveAttribute("hidden", "");
  }
}

export async function appSource(page) {
  const sources = await page
    .locator('script[type="module"]')
    .evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute("src")).filter(Boolean),
    );
  const parts = [];
  for (const src of sources) {
    if (src.includes("live-reload")) continue;
    parts.push(await (await page.request.get(src)).text());
  }
  return parts.join("\n");
}

export async function waitForCover(page) {
  await page.waitForFunction(() => {
    const host = document.querySelector("[data-transition-host]");
    return Boolean(host && !host.hidden);
  });
}
