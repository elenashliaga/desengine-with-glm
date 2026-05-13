import { defineConfig, devices } from "playwright/test"

const e2ePort = Number(process.env.DESENGINE_E2E_PORT || 3410)
const baseURL = process.env.DESENGINE_E2E_BASE_URL || `http://127.0.0.1:${e2ePort}`

export default defineConfig({
  testDir: "test/e2e",
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  outputDir: "test-results/e2e",
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    channel: process.env.PLAYWRIGHT_BROWSER_CHANNEL || "chrome",
    trace: "retain-on-failure",
  },
  webServer: process.env.DESENGINE_E2E_EXTERNAL_SERVER
    ? undefined
    : {
        command: `npm run dev -- --hostname 127.0.0.1 --port ${e2ePort}`,
        url: `${baseURL}/auth`,
        timeout: 120_000,
        reuseExistingServer: false,
        env: {
          ...process.env,
          ALLOWLIST_BASE_URL: "",
          ALLOWLIST_SALT: "",
          DESENGINE_ALLOWLIST_BASE_URL: "",
          DESENGINE_ALLOWLIST_SALT: "",
          LLM_PROVIDER: "deepseek",
          OPENAI_API_KEY: "",
          OPENAI_MODEL: "",
          OPENAI_BASE_URL: "",
          DEEPSEEK_API_KEY: "",
          DEEPSEEK_MODEL: "deepseek-test",
          DEEPSEEK_BASE_URL: "https://api.deepseek.example",
          GEMINI_API_KEY: "",
          GEMINI_MODEL: "",
          GEMINI_BASE_URL: "",
          ONBOARDING_REPO_URL: "",
          DESENGINE_ONBOARDING_REPO_URL: "",
        },
      },
})
