import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// Playwright no carga .env por sí solo: este archivo lo genera `pnpm -C app env:local`.
if (existsSync(".env.test.local")) {
  process.loadEnvFile(".env.test.local");
}

export default defineConfig({
  testDir: "tests/e2e",
  testIgnore: ["**/blueprints/**"],
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 90_000,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3100",
    locale: "es-CL",
    timezoneId: "America/Santiago",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "android-gama-media", use: { ...devices["Pixel 7"] } },
    { name: "iphone-safari", use: { ...devices["iPhone 13"] } },
  ],
  webServer: {
    command: "pnpm build && pnpm start --port 3100",
    url: "http://localhost:3100/api/health",
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
});
