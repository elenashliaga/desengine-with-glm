// @openSpec capability: admin-tools
// @openSpec scenarios:
// @openSpec  - "Root-документ упоминает административную команду"
// @openSpec  - "Читатель открывает `tools/README.md` или admin-раздел root-документации"
// @openSpec  - "Разработчик запускает unit-проект Vitest"
// @openSpec  - "Разработчик добавляет новый модуль в `lib`"
// @openSpec capability: external-local-onboarding
// @openSpec scenarios:
// @openSpec  - "Пользователь открывает шаблон конфигурации"
// @openSpec  - "Пользователь проходит новую установку по шаблонной конфигурации"
// @openSpec  - "Команда перепроверяет документацию локального запуска"
// @openSpec  - "Читатель открывает инструкцию первого запуска"
// @openSpec  - "Читателю нужны подробности по частной теме"
// @openSpec capability: onboarding-repo
// @openSpec scenarios:
// @openSpec  - "Пользователь хочет повторно обновить onboarding-контент"
// @openSpec capability: navigation
// @openSpec scenarios:
// @openSpec  - "Пользователь открывает product-shell страницу"
// @openSpec  - "Пользователь смотрит на правую часть Navigation"
// @openSpec  - "Пользователь ориентируется в основных разделах продукта"
// @openSpec capability: ui-foundation
// @openSpec scenarios:
// @openSpec  - "Команда добавляет или меняет product-shell страницу"
// @openSpec  - "Команда работает с динамическим render-островком"
// @openSpec  - "Команда оценивает простой статический shell-компонент"

import fs from "node:fs"
import path from "node:path"

import { describe, expect, it } from "vitest"

function readProjectFile(...segments: string[]) {
  return fs.readFileSync(path.join(process.cwd(), ...segments), "utf8")
}

function projectPath(...segments: string[]) {
  return path.join(process.cwd(), ...segments)
}

function readDocs(...fileNames: string[]) {
  return fileNames.map((fileName) => ({
    fileName,
    source: readProjectFile(fileName),
  }))
}

describe("P2 source contracts", () => {
  it("root-документы ссылаются на канонические admin-команды из tools/README.md", () => {
    const toolsReadme = readProjectFile("tools", "README.md")
    const rootDocs = readDocs("README.md", "INSTALL.md", "UPDATE.md")
    const commands = [
      "npm run smoke",
      "npm run allowlist:marker -- user@example.com",
      "npm run admin:tasks:configs",
      "npm run admin:tasks:import -- --variants-root=... --base-root=...",
    ]

    for (const command of commands) {
      expect(toolsReadme).toContain(command)
    }

    for (const { fileName, source } of rootDocs) {
      expect(source, fileName).not.toMatch(/\bnode\s+tools\//)

      for (const command of commands) {
        if (source.includes(command)) {
          expect(toolsReadme, `${fileName}: ${command}`).toContain(command)
        }
      }
    }
  })

  it("tools/README.md и root-документация явно отделяют admin-контур от browser-only пользователя", () => {
    const toolsReadme = readProjectFile("tools", "README.md")
    const readme = readProjectFile("README.md")
    const install = readProjectFile("INSTALL.md")

    expect(toolsReadme).toContain("## Аудитория")
    expect(toolsReadme).toContain("Администратор локальной установки")
    expect(toolsReadme).toContain("Browser-only пользователь")
    expect(readme).toContain("## Пользовательский контур")
    expect(readme).toContain("## Административный контур")
    expect(install).toContain("## Аудитория и роль")
  })

  it("unit-проект Vitest ищет тесты только в test/unit, а не в lib", () => {
    const vitestConfig = readProjectFile("vitest.config.ts")
    const packageJson = JSON.parse(readProjectFile("package.json")) as {
      scripts: Record<string, string>
    }
    const libTests = fs
      .readdirSync(projectPath("lib"), { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile() && /\.(?:test|spec)\.tsx?$/.test(entry.name))

    expect(packageJson.scripts["test:unit"]).toBe("vitest run --project unit")
    expect(vitestConfig).toContain("name: 'unit'")
    expect(vitestConfig).toContain("include: ['test/unit/**/*.test.ts']")
    expect(libTests).toHaveLength(0)
  })

  it("lib не содержит новых runtime-модулей плоским списком верхнего уровня", () => {
    const topLevelFiles = fs
      .readdirSync(projectPath("lib"), { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)

    expect(topLevelFiles).toEqual([])
    expect(fs.existsSync(projectPath("lib", "llm.server.ts"))).toBe(false)
    expect(fs.existsSync(projectPath("lib", "user-state.server.ts"))).toBe(false)
    expect(fs.existsSync(projectPath("lib", "prompts.server.ts"))).toBe(false)
  })

  it("шаблон локальной конфигурации первым шагом объясняет переименование и задаёт ONBOARDING_REPO_URL", () => {
    const template = readProjectFile("desengine.config-example.txt")
    const lines = template.split(/\r?\n/)

    expect(lines[0]).toContain("Переименуйте этот файл в desengine.config.txt")
    expect(template).toContain("ONBOARDING_REPO_URL=https://github.com/sobakapav/desengine-onboarding.git")
  })

  it("официальный smoke-flow подтягивает onboarding из ONBOARDING_REPO_URL перед готовностью установки", () => {
    const install = readProjectFile("INSTALL.md")
    const smoke = readProjectFile("tools", "smoke-local-install.mjs")
    const repair = readProjectFile("tools", "repair-onboarding.mjs")

    expect(install).toContain("npm run smoke")
    expect(smoke).toContain("ensureOnboardingReady")
    expect(smoke).toContain("ONBOARDING_REPO_URL")
    expect(smoke).toContain("repairToolPath")
    expect(repair).toContain("process.env.ONBOARDING_REPO_URL")
    expect(repair).toContain('["clone", "--depth", "1", repoUrl, checkoutDir]')
    expect(repair).toContain("validateOnboardingLayout(checkoutDir)")
    expect(repair).toContain("repoUrl, syncedAt")
  })

  it("локальная документация согласована по config, onboarding, routes и allowlist-flow", () => {
    const docs = readDocs("README.md", "INSTALL.md", "UPDATE.md", "docs/onboarding.md")

    for (const { fileName, source } of docs) {
      expect(source, fileName).toContain("desengine.config.txt")
      expect(source, fileName).toContain("ONBOARDING_REPO_URL")
      expect(source, fileName).toContain("/onboarding")
      expect(source, fileName).toContain("/config")
    }

    expect(readProjectFile("README.md")).toContain("/auth")
    expect(readProjectFile("INSTALL.md")).toContain("allowlist")
  })

  it("инструкции первого запуска разделяют роли пользователя и администратора", () => {
    const readme = readProjectFile("README.md")
    const install = readProjectFile("INSTALL.md")
    const onboardingDocs = readProjectFile("docs", "onboarding.md")

    expect(readme).toContain("Пользовательский контур")
    expect(readme).toContain("Административный контур")
    expect(install).toContain("Администратор")
    expect(install).toContain("Пользователь")
    expect(onboardingDocs).toContain("Пользователю этот документ обычно не нужен")
  })

  it("root-документы ведут к профильным документам вместо полного дублирования частных тем", () => {
    const readme = readProjectFile("README.md")
    const install = readProjectFile("INSTALL.md")

    for (const docPath of [
      "docs/access-control.md",
      "docs/onboarding.md",
      "docs/openai.md",
      "docs/deepseek.md",
      "docs/gemini.md",
      "docs/platform-notes.md",
      "tools/README.md",
    ]) {
      expect(readme).toContain(docPath)
    }

    expect(install).toContain("docs/access-control.md")
    expect(install).toContain("docs/onboarding.md")
    expect(install).toContain("docs/platform-notes.md")
  })

  it("страница /config предоставляет ручное обновление onboarding через API синхронизации", () => {
    const configPage = readProjectFile("app", "config", "page.tsx")
    const card = readProjectFile("components", "desengine", "platform", "OnboardingUpdateCard.tsx")
    const route = readProjectFile("app", "api", "onboarding", "update", "route.ts")

    expect(configPage).toContain("OnboardingUpdateCard")
    expect(card).toContain("Обновить onboarding")
    expect(card).toContain('fetch("/api/onboarding/update"')
    expect(card).toContain("ONBOARDING_REPO_URL")
    expect(route).toContain("updateOnboardingFromConfig")
  })

  it("product-shell страницы получают общий Navigation из root layout", () => {
    const layout = readProjectFile("app", "layout.tsx")

    expect(layout).toContain('import { Navigation } from "@/components/desengine/platform/Navigation"')
    expect(layout).toContain("<Navigation />")
    expect(fs.existsSync(projectPath("app", "page.tsx"))).toBe(true)
    expect(fs.existsSync(projectPath("app", "tasks", "page.tsx"))).toBe(true)
    expect(fs.existsSync(projectPath("app", "levels", "page.tsx"))).toBe(true)
    expect(fs.existsSync(projectPath("app", "auth", "page.tsx"))).toBe(true)
    expect(fs.existsSync(projectPath("app", "config", "page.tsx"))).toBe(true)
    expect(fs.existsSync(projectPath("app", "help", "page.tsx"))).toBe(true)
  })

  it("Navigation содержит постоянные контакты справа", () => {
    const navigation = readProjectFile("components", "desengine", "platform", "Navigation", "Navigation.tsx")

    expect(navigation).toContain("contactLinks")
    expect(navigation).toContain("https://t.me/eduhund_bot")
    expect(navigation).toContain("mailto:edu@eduhund.com")
    expect(navigation).toContain('target={item.external ? "_blank" : undefined}')
  })

  it("top-level URL map представлена path-based маршрутами и фабриками путей", () => {
    const navigationHelpers = readProjectFile("lib", "platform", "navigation.ts")
    const navigation = readProjectFile("components", "desengine", "platform", "Navigation", "Navigation.tsx")

    for (const route of ['"/tasks"', '"/levels"', '"/auth"', '"/config"', '"/help"']) {
      expect(navigationHelpers).toContain(route)
    }

    expect(navigation).toContain('href: "/"')
    expect(navigation).toContain("createLevelsPath()")
    expect(navigation).toContain("createTasksPath()")
    expect(navigation).toContain("createConfigPath()")
    expect(navigation).toContain("createHelpPath()")
  })

  it("динамический render-островок лаборатории изолирован локальным boundary/fallback", () => {
    const outRender = readProjectFile("components", "desengine", "lab", "InOut", "OutRender", "OutRender.tsx")

    expect(outRender).toContain("PreviewRenderBoundary")
    expect(outRender).toContain("PreviewErrorNotice")
    expect(outRender).toContain("Ошибка загрузки превью")
    expect(outRender).toContain("Ошибка React-рендера")
  })

  it("простой статический Navigation не требует механического boundary", () => {
    const navigation = readProjectFile("components", "desengine", "platform", "Navigation", "Navigation.tsx")

    expect(navigation).not.toContain("ErrorBoundary")
    expect(navigation).not.toContain("PreviewRenderBoundary")
    expect(navigation).not.toContain("fallback")
  })
})
