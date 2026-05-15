// @openSpec capability: testing-layer
// @openSpec scenarios:
// @openSpec  - "Разработчик запускает быстрый локальный тестовый слой"
// @openSpec  - "Разработчик запускает полный локальный тестовый слой"
// @openSpec  - "Разработчик запускает проверки по capability"
// @openSpec  - "Тестовый файл покрывает OpenSpec-сценарий"
// @openSpec  - "Capability временно не имеет полного покрытия"
// @openSpec  - "Credentials не заданы"
// @openSpec  - "Разработчик запускает live/provider-проверку"
// @openSpec  - "Тестовый слой ещё покрывает не все specs"
// @openSpec  - "Добавляется новый behavior-change"

import fs from "node:fs"
import path from "node:path"

import { describe, expect, it } from "vitest"

function readProjectFile(...segments: string[]) {
  return fs.readFileSync(path.join(process.cwd(), ...segments), "utf8")
}

describe("change testing guidance", () => {
  it("package scripts задают быстрый, полный, выборочный и live/provider тестовые entry point'ы", () => {
    const packageJson = JSON.parse(readProjectFile("package.json")) as {
      scripts: Record<string, string>
    }

    expect(packageJson.scripts.test).toBe("npm run test:unit")
    expect(packageJson.scripts["test:unit"]).toBe("vitest run --project unit")
    expect(packageJson.scripts["test:full"]).toBe("npm run test:unit && npm run test:traceability")
    expect(packageJson.scripts["test:spec"]).toBe("node tools/testing/pending-layer.mjs spec")
    expect(packageJson.scripts["test:live"]).toBe("node tools/testing/pending-layer.mjs live")
    expect(packageJson.scripts["test:full"]).not.toContain("test:live")
  })

  it("traceability checker валидирует OpenSpec metadata и требует coverage-plan для неполного покрытия", () => {
    const source = readProjectFile("tools", "testing", "check-openspec-traceability.mjs")

    expect(source).toContain("CAPABILITY_PATTERN")
    expect(source).toContain("SCENARIO_ITEM_PATTERN")
    expect(source).toContain("coverage-plan")
    expect(source).toContain("ссылается на неизвестный capability")
    expect(source).toContain("ссылается на неизвестный scenario")
    expect(source).toContain("но capability не внесён в coverage-plan")
  })

  it("placeholder-команды не блокируют runtime и объясняют следующий этап", () => {
    const source = readProjectFile("tools", "testing", "pending-layer.mjs")

    expect(source).toContain("integration")
    expect(source).toContain("live")
    expect(source).toContain("spec")
    expect(source).toContain("слой ещё не реализован")
    expect(source).toContain("Сейчас этот placeholder завершается успешно")
  })

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
