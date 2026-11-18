import { defineConfig } from "@playwright/test";

// Read-only checks against the live site. No server is started here, and nothing is written:
// the tests only load public pages. Run with `bunx playwright test -c playwright.live.config.ts`.
export default defineConfig({
  testDir: "./e2e/live",
  testMatch: /.*\.live\.ts$/,
  fullyParallel: true,
  retries: 1,
  timeout: 60_000,
  reporter: [["list"]],
  use: {
    baseURL: process.env["LIVE_BASE_URL"] ?? "https://theweekendprojects.com",
    viewport: { width: 1280, height: 800 },
    trace: "off",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "live-chrome", use: { browserName: "chromium", channel: "chrome" } }],
});
