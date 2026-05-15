// @openSpec capability: llm
// @openSpec scenarios:
// @openSpec  - "Система выполняет start"
// @openSpec  - "Система выполняет iterate"
// @openSpec  - "В каталоге лаборатории остался legacy-конфиг"
// @openSpec  - "Система выполняет start для уровня"
// @openSpec  - "Система выполняет iterate prompt lookup для уровня"
// @openSpec  - "Runtime знает идентификатор уровня"
// @openSpec  - "Пользователь просматривает историю итераций"

import fs from "node:fs"
import path from "node:path"

import { describe, expect, it } from "vitest"

function readProjectFile(...segments: string[]) {
  return fs.readFileSync(path.join(process.cwd(), ...segments), "utf8")
}

describe("LLM flow source contracts", () => {
  it("start-flow использует общий production prompt, didactic default и level-specific start/iterate prompts", () => {
    const source = readProjectFile("app", "api", "tasks", "[taskId]", "start", "route.ts")

    expect(source).toContain('readPrompt("production", "start-component")')
    expect(source).toContain('readPrompt("didactic", "default")')
    expect(source).toContain("readLevelIteratePrompt(level.id)")
    expect(source).toContain("readLevelStartPrompt(level.id)")
    expect(source).toContain('target: "init"')
    expect(source).toContain("imageBase64List")
  })

  it("iterate-flow использует общий production prompt, didactic default и level-specific iterate prompt", () => {
    const source = readProjectFile("app", "api", "tasks", "[taskId]", "iterate", "route.ts")

    expect(source).toContain('readPrompt("production", "default")')
    expect(source).toContain('readPrompt("production", "iterate-component")')
    expect(source).toContain('readPrompt("didactic", "default")')
    expect(source).toContain("readLevelIteratePrompt(level.id)")
    expect(source).toContain("runStructuredLlmRequest({")
    expect(source).toContain("imageBase64List")
  })

  it("prompt lookup строит hidden level prompt path только по levelId", () => {
    const source = readProjectFile("lib", "prompt", "server.ts")

    expect(source).toContain('path.join(appConfig.onboardingPromptsRoot, "levels", levelId, "start.md")')
    expect(source).toContain('path.join(appConfig.onboardingPromptsRoot, "levels", levelId, "iterate.md")')
    expect(source).not.toContain("promptKey")
  })

  it("system status предупреждает о legacy-конфиге без использования его как fallback", () => {
    const source = readProjectFile("lib", "config", "status.ts")
    const localConfig = readProjectFile("lib", "config", "local.cjs")

    expect(source).toContain("localConfigState.hasLegacyEnv")
    expect(source).toContain("Обнаружен устаревший .env.local")
    expect(source).toContain("Старый `.env.local` создаёт двусмысленность")
    expect(localConfig).toContain('const LOCAL_CONFIG_FILENAME = "desengine.config.txt"')
    expect(localConfig).toContain('const LEGACY_LOCAL_ENV_FILENAME = ".env.local"')
    expect(localConfig).not.toContain("readLocalConfig(getLegacyLocalEnvPath")
  })

  it("история итераций хранит учебную стоимость отдельно от provider metrics", () => {
    const iterateRoute = readProjectFile("app", "api", "tasks", "[taskId]", "iterate", "route.ts")
    const repository = readProjectFile("lib", "onboarding", "repository.ts")

    expect(iterateRoute).toContain("teachingCostCents: TEACHING_COST_PER_ITERATION_CENTS")
    expect(iterateRoute).toContain("metrics: llmCall.metrics")
    expect(repository).toContain("callsWithoutProviderMetrics")
    expect(repository).toContain("teachingCostCents: promptHistory.length * TEACHING_COST_PER_ITERATION_CENTS")
  })
})
