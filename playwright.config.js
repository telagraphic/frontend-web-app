import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/browser",
  testMatch: "**/*.browser.js",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: "http://127.0.0.1:3458",
    reducedMotion: "reduce",
    viewport: { width: 1280, height: 720 },
  },
  expect: {
    toHaveScreenshot: { animations: "disabled" },
  },
  webServer: {
    command: "PORT=3458 bun server/dev.js",
    url: "http://127.0.0.1:3458/",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
