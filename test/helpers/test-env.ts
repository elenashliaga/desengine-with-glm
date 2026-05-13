type TestEnv = Record<string, string | undefined>

type RequiredEnvResult =
  | {
      ok: true
      values: Record<string, string>
      missing: []
    }
  | {
      ok: false
      values: Record<string, string>
      missing: string[]
    }

type ProviderName = "openai" | "deepseek" | "gemini"

const LIVE_PROVIDER_ENV: Record<ProviderName, string[]> = {
  openai: ["LLM_PROVIDER", "OPENAI_API_KEY", "OPENAI_MODEL", "OPENAI_BASE_URL"],
  deepseek: ["LLM_PROVIDER", "DEEPSEEK_API_KEY", "DEEPSEEK_MODEL", "DEEPSEEK_BASE_URL"],
  gemini: ["LLM_PROVIDER", "GEMINI_API_KEY", "GEMINI_MODEL", "GEMINI_BASE_URL"],
}

const LIVE_ALLOWLIST_ENV = ["ALLOWLIST_BASE_URL", "ALLOWLIST_SALT"]
const LIVE_ONBOARDING_ENV = ["ONBOARDING_REPO_URL"]

function readRequiredTestEnv(names: string[], env: TestEnv = process.env): RequiredEnvResult {
  const values: Record<string, string> = {}
  const missing: string[] = []

  for (const name of names) {
    const value = env[name]?.trim()

    if (!value) {
      missing.push(name)
      continue
    }

    values[name] = value
  }

  if (missing.length > 0) {
    return { ok: false, values, missing }
  }

  return { ok: true, values, missing: [] }
}

function describeMissingTestEnv(names: string[]) {
  return `Для live-проверки не хватает переменных окружения: ${names.join(", ")}`
}

function readLiveProviderEnv(provider: ProviderName, env: TestEnv = process.env) {
  return readRequiredTestEnv(LIVE_PROVIDER_ENV[provider], env)
}

export {
  LIVE_ALLOWLIST_ENV,
  LIVE_ONBOARDING_ENV,
  LIVE_PROVIDER_ENV,
  describeMissingTestEnv,
  readLiveProviderEnv,
  readRequiredTestEnv,
}
export type { ProviderName, RequiredEnvResult, TestEnv }
