import { describe, expect, it } from "vitest"

import { describeMissingTestEnv, readLiveProviderEnv, readRequiredTestEnv } from "../helpers/test-env"

describe("test env helpers", () => {
  it("возвращает только заполненные env-значения и список отсутствующих переменных", () => {
    const result = readRequiredTestEnv(["PRESENT_KEY", "MISSING_KEY"], {
      PRESENT_KEY: "  value  ",
      MISSING_KEY: "",
    })

    expect(result).toEqual({
      ok: false,
      values: {
        PRESENT_KEY: "value",
      },
      missing: ["MISSING_KEY"],
    })
  })

  it("не раскрывает значения секретов в диагностике отсутствующих env-переменных", () => {
    expect(describeMissingTestEnv(["OPENAI_API_KEY", "OPENAI_MODEL"])).toBe(
      "Для live-проверки не хватает переменных окружения: OPENAI_API_KEY, OPENAI_MODEL",
    )
  })

  it("читает provider-specific env для live-проверок", () => {
    const result = readLiveProviderEnv("gemini", {
      LLM_PROVIDER: "gemini",
      GEMINI_API_KEY: "test-key",
      GEMINI_MODEL: "gemini-test",
      GEMINI_BASE_URL: "https://example.com/gemini",
    })

    expect(result).toEqual({
      ok: true,
      values: {
        LLM_PROVIDER: "gemini",
        GEMINI_API_KEY: "test-key",
        GEMINI_MODEL: "gemini-test",
        GEMINI_BASE_URL: "https://example.com/gemini",
      },
      missing: [],
    })
  })
})
