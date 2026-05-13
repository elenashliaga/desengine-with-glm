// @openSpec capability: llm
// @openSpec scenarios:
// @openSpec  - "Конфигурация выбрала сетевой провайдер"
// @openSpec  - "Пользователь меняет модель для лаборатории"
// @openSpec  - "В desengine.config.json нет настройки модели"
// @openSpec  - "Клиент запрашивает статус LLM"
// @openSpec  - "Клиент пытается запросить отдельный OpenAI status endpoint"

import fs from "node:fs"
import path from "node:path"

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))

const ORIGINAL_ENV = { ...process.env }

describe("LLM status contracts", () => {
  beforeEach(() => {
    vi.resetModules()
    process.env = { ...ORIGINAL_ENV }
  })

  afterEach(() => {
    vi.restoreAllMocks()
    process.env = { ...ORIGINAL_ENV }
  })

  it("возвращает статус выбранного сетевого провайдера", async () => {
    process.env.LLM_PROVIDER = "openai"
    process.env.OPENAI_API_KEY = "test-openai-key"
    process.env.OPENAI_MODEL = "gpt-test"
    process.env.OPENAI_BASE_URL = "https://api.openai.example/v1"

    const { getLlmStatus } = await import("../../lib/llm/llm.server")

    await expect(getLlmStatus()).resolves.toMatchObject({
      provider: "openai",
      label: "OpenAI",
      ready: true,
      endpoint: "https://api.openai.example/v1",
      config: {
        activeProvider: "openai",
        model: "gpt-test",
        hasRequiredKey: true,
        missingEnvVars: [],
      },
    })
  })

  it("публикует единый status route, который добавляет ok=true к LLM-статусу", () => {
    const llmStatusRoute = path.join(process.cwd(), "app", "api", "status", "llm", "route.ts")
    const source = fs.readFileSync(llmStatusRoute, "utf8")

    expect(source).toContain('import { getLlmStatus } from "@/lib/llm/llm.server"')
    expect(source).toContain("const status = await getLlmStatus()")
    expect(source).toContain("ok: true")
  })

  it("берёт модель из env активного провайдера, а не из desengine.config.json", async () => {
    process.env.LLM_PROVIDER = "openai"
    process.env.OPENAI_API_KEY = "test-openai-key"
    process.env.OPENAI_MODEL = "gpt-env-model"
    process.env.OPENAI_BASE_URL = "https://api.openai.example/v1"

    const { getLlmStatus } = await import("../../lib/llm/llm.server")

    await expect(getLlmStatus()).resolves.toMatchObject({
      config: {
        activeProvider: "openai",
        model: "gpt-env-model",
      },
    })
  })

  it("не публикует отдельный OpenAI status endpoint", () => {
    const openAiStatusRoute = path.join(process.cwd(), "app", "api", "status", "openai", "route.ts")

    expect(fs.existsSync(openAiStatusRoute)).toBe(false)
  })
})
