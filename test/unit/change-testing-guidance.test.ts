import fs from "node:fs"
import path from "node:path"

import { describe, expect, it } from "vitest"

function readProjectFile(...segments: string[]) {
  return fs.readFileSync(path.join(process.cwd(), ...segments), "utf8")
}

describe("change testing guidance", () => {
  it("AGENTS.md требует тестовую часть для behavior-change", () => {
    const source = readProjectFile("AGENTS.md")

    expect(source).toContain("Тестовая часть behavior-change обязательна")
    expect(source).toContain("затронутые OpenSpec capability/scenarios")
    expect(source).toContain("команду запуска")
    expect(source).toContain("mock/fixture-данные")
    expect(source).toContain("test/traceability/coverage-plan.json")
  })

  it("генератор OpenSpec change добавляет тестовый чеклист в tasks.md", () => {
    const source = readProjectFile("tools", "create-openspec-change.mjs")

    expect(source).toContain("TEST_CHECKLIST_HEADING")
    expect(source).toContain("## Тестовая часть change")
    expect(source).toContain("ensureTestChecklist(changeDir)")
    expect(source).toContain("test/traceability/coverage-plan.json")
    expect(source).toContain("Добавлен тестовый чеклист")
  })

  it("документация показывает пример тестовой части и правило coverage-plan", () => {
    const source = readProjectFile("docs", "testing-layer.md")

    expect(source).toContain("## Тестовая часть change")
    expect(source).toContain("Минимальный пример")
    expect(source).toContain("Выбор уровня")
    expect(source).toContain("live/provider")
    expect(source).toContain("Если полный тест сейчас нельзя добавить")
    expect(source).toContain("targetStage")
  })
})
