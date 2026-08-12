import { defineConfig, devices } from "@playwright/test";

const FRONTEND_URL = process.env.E2E_BASE_URL || "http://localhost:3000";
const BACKEND_HEALTH_URL = process.env.E2E_BACKEND_HEALTH_URL || "http://localhost:8000/api/v1/hobbies";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: FRONTEND_URL,
    trace: "on-first-retry",
  },
  webServer: [
    {
      command: "pnpm --filter @hobbyhive/backend dev",
      url: BACKEND_HEALTH_URL,
      reuseExistingServer: true,
      timeout: 60_000,
    },
    {
      command: "pnpm --filter @hobbyhive/frontend dev",
      url: FRONTEND_URL,
      reuseExistingServer: true,
      timeout: 60_000,
    },
  ],
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
