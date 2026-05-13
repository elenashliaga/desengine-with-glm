import fs from "node:fs"
import path from "node:path"
import { execFile } from "node:child_process"
import { createRequire } from "node:module"
import { promisify } from "node:util"

const execFileAsync = promisify(execFile)
const require = createRequire(import.meta.url)
const { getLocalConfigPath, getLocalConfigState, readLocalConfig } = require("../lib/local-config.cjs")
const rootDir = process.cwd()
const envPath = getLocalConfigPath(rootDir)
const repairToolPath = path.join(rootDir, "tools", "repair-onboarding.mjs")
const markerFileName = ".desengine-onboarding-source.json"

function getNpmCommand() {
  return process.platform === "win32" ? "npm.cmd" : "npm"
}

function readAppConfig() {
  const parsed = JSON.parse(fs.readFileSync(path.join(rootDir, "desengine.config.json"), "utf-8"))
  const onboardingRoot = path.resolve(rootDir, parsed.onboardingRoot ?? "onboarding")
  return {
    onboardingRoot,
  }
}

function getNodeVersionStatus() {
  const [major] = process.versions.node.split(".").map(Number)

  if (major >= 20) {
    return {
      ok: true,
      summary: `Node.js ${process.versions.node}`,
      detail: "Версия Node.js обнаружена. Smoke-check не ограничивает локальный запуск по мажорной версии.",
    }
  }

  return {
    ok: false,
    summary: `Node.js ${process.versions.node}`,
    detail: "Для этого проекта нужен современный Node.js. Обновите окружение и повторите проверку.",
  }
}

function createCheck(id, ok, summary, detail) {
  return { id, ok, summary, detail }
}

function normalizeBuildFailureDetail(output) {
  if (output.includes("@next/swc-darwin-arm64") || output.includes('Failed to get registry from "npm"')) {
    return [
      "Не найден подходящий нативный пакет `@next/swc` для текущей платформы.",
      "Судя по всему, локальные зависимости были установлены под другую архитектуру или без доступного `npm` в PATH.",
      "Переустановите зависимости в корне репозитория в рабочем shell с `npm`, затем повторите build.",
      "",
      output,
    ].join("\n")
  }

  if (output.includes("lightningcss.darwin-arm64.node")) {
    return [
      "Не найден нативный бинарник `lightningcss` для текущей платформы.",
      "Похоже, зависимости в `node_modules` были установлены не на этой машине или не под эту архитектуру.",
      "Переустановите зависимости в корне репозитория, затем повторите build.",
      "",
      output,
    ].join("\n")
  }

  return output
}

async function pathExists(targetPath) {
  try {
    await fs.promises.access(targetPath)
    return true
  } catch {
    return false
  }
}

async function validateOnboardingLayout(root) {
  const levelsRoot = path.join(root, "levels")
  const tasksRoot = path.join(root, "tasks")
  const promptsRoot = path.join(root, "prompts")
  const requiredDirs = [root, levelsRoot, tasksRoot, promptsRoot, path.join(promptsRoot, "levels")]
  const missingPaths = []

  for (const dir of requiredDirs) {
    try {
      await fs.promises.readdir(dir)
    } catch {
      missingPaths.push(path.relative(rootDir, dir) || dir)
    }
  }

  if (missingPaths.length > 0) {
    return {
      ok: false,
      detail: `Не найдены обязательные каталоги: ${missingPaths.join(", ")}.`,
    }
  }

  const [levelEntries, taskEntries] = await Promise.all([
    fs.promises.readdir(levelsRoot, { withFileTypes: true }),
    fs.promises.readdir(tasksRoot, { withFileTypes: true }),
  ])

  if (!levelEntries.some((entry) => entry.isDirectory())) {
    return {
      ok: false,
      detail: "В `/onboarding/levels` не найдено ни одного каталога уровня.",
    }
  }

  if (!taskEntries.some((entry) => entry.isDirectory())) {
    return {
      ok: false,
      detail: "В `/onboarding/tasks` не найдено ни одного каталога задачи.",
    }
  }

  const defaultPromptPath = path.join(promptsRoot, "default.md")
  if (!(await pathExists(defaultPromptPath))) {
    return {
      ok: false,
      detail: `Не найден обязательный файл onboarding-контента: ${path.relative(rootDir, defaultPromptPath)}.`,
    }
  }

  return { ok: true, detail: "Onboarding-layout выглядит полным." }
}

async function inspectOnboardingState(repoUrl) {
  const { onboardingRoot } = readAppConfig()

  if (!(await pathExists(onboardingRoot))) {
    return {
      state: "missing",
      detail: "Каталог `/onboarding` отсутствует.",
    }
  }

  const layout = await validateOnboardingLayout(onboardingRoot)
  if (!layout.ok) {
    return {
      state: "missing",
      detail: layout.detail,
    }
  }

  const markerPath = path.join(onboardingRoot, markerFileName)
  if (!(await pathExists(markerPath))) {
    return {
      state: "unconfirmed",
      detail: "Маркер синхронизации `/onboarding` не найден.",
    }
  }

  try {
    const marker = JSON.parse(await fs.promises.readFile(markerPath, "utf-8"))
    if (typeof marker.repoUrl !== "string") {
      return {
        state: "unconfirmed",
        detail: "Маркер синхронизации повреждён и не содержит `repoUrl`.",
      }
    }

    if (marker.repoUrl !== repoUrl) {
      return {
        state: "unconfirmed",
        detail: `Маркер указывает на ${marker.repoUrl}, а в конфиге задан ${repoUrl}.`,
      }
    }

    return {
      state: "synced",
      detail: marker.commitHash
        ? `Источник подтверждён, последний коммит: ${marker.commitHash}.`
        : "Источник подтверждён маркером синхронизации.",
    }
  } catch {
    return {
      state: "unconfirmed",
      detail: "Маркер синхронизации не удалось прочитать.",
    }
  }
}

async function ensureOnboardingReady(env) {
  const repoUrl = env.ONBOARDING_REPO_URL?.trim() ?? ""

  if (!repoUrl) {
    return createCheck(
      "onboarding-sync",
      false,
      "Onboarding-репозиторий не настроен",
      "Задайте `ONBOARDING_REPO_URL` в `desengine.config.txt`, иначе установка не сможет подтвердить источник `/onboarding`.",
    )
  }

  const beforeRepair = await inspectOnboardingState(repoUrl)

  if (beforeRepair.state !== "synced") {
    try {
      const { stdout } = await execFileAsync(process.execPath, [repairToolPath], {
        cwd: rootDir,
        env: {
          ...process.env,
          ...env,
        },
        maxBuffer: 10 * 1024 * 1024,
      })
      const payload = JSON.parse(stdout)
      const commitText = payload.commitHash ? ` Коммит: ${payload.commitHash}.` : ""

      return createCheck(
        "onboarding-sync",
        true,
        beforeRepair.state === "missing"
          ? "Onboarding загружен из канонического репозитория"
          : "Onboarding пересинхронизирован из канонического репозитория",
        `Источник: ${payload.repoUrl}.${commitText}`,
      )
    } catch (error) {
      const detail = error.stderr?.trim() || error.stdout?.trim() || error.message
      return createCheck(
        "onboarding-sync",
        false,
        "Onboarding не удалось синхронизировать",
        `${beforeRepair.detail} Попытка repair завершилась ошибкой: ${detail}`,
      )
    }
  }

  return createCheck(
    "onboarding-sync",
    true,
    "Onboarding уже синхронизирован",
    beforeRepair.detail,
  )
}

async function runBuildCheck() {
  const npmCommand = getNpmCommand()

  if (!fs.existsSync(path.join(rootDir, "package.json"))) {
    return createCheck(
      "production-build",
      false,
      "Не найден package.json проекта",
      "Запускайте smoke-check из корня репозитория desengine.",
    )
  }

  try {
    await execFileAsync(npmCommand, ["run", "build"], {
      cwd: rootDir,
      env: process.env,
      maxBuffer: 10 * 1024 * 1024,
    })

    return createCheck(
      "production-build",
      true,
      "Production build проходит",
      "Официальная сборка выполнена без ошибок.",
    )
  } catch (error) {
    const stderr = error.stderr?.trim() || error.stdout?.trim() || error.message
    return createCheck(
      "production-build",
      false,
      "Production build не проходит",
      normalizeBuildFailureDetail(stderr),
    )
  }
}

async function main() {
  const localConfigState = getLocalConfigState(rootDir)
  const fileEnv = readLocalConfig(envPath)
  const env = { ...fileEnv, ...process.env }
  const checks = []

  const nodeStatus = getNodeVersionStatus()
  checks.push(createCheck("node", nodeStatus.ok, nodeStatus.summary, nodeStatus.detail))

  checks.push(
    createCheck(
      "env-file",
      localConfigState.hasConfig,
      localConfigState.hasConfig ? "Файл desengine.config.txt найден" : "Файл desengine.config.txt не найден",
      localConfigState.hasConfig
        ? "Локальная конфигурация присутствует."
        : "Создайте `desengine.config.txt` на основе `desengine.config-example.txt`.",
    ),
  )

  checks.push(
    createCheck(
      "legacy-env-file",
      !localConfigState.hasLegacyEnv,
      localConfigState.hasLegacyEnv
        ? "Обнаружен устаревший файл .env.local"
        : "Устаревший .env.local не найден",
      localConfigState.hasLegacyEnv
        ? "Перенесите значения в `desengine.config.txt` и удалите `.env.local`, иначе настройки будут двусмысленными."
        : "Локальная конфигурация использует только `desengine.config.txt`.",
    ),
  )

  checks.push(
    createCheck(
      "llm-provider",
      Boolean(env.LLM_PROVIDER || env.OPENAI_API_KEY),
      env.LLM_PROVIDER
        ? `Активный LLM-провайдер: ${env.LLM_PROVIDER}`
        : "Активный LLM-провайдер не задан",
      env.LLM_PROVIDER
        ? "Проверьте, что для этого провайдера заданы ключ, модель и базовый URL."
        : "Задайте `LLM_PROVIDER` в `desengine.config.txt`.",
    ),
  )

  const activeProvider = (env.LLM_PROVIDER || "openai").trim().toLowerCase()
  const hasActiveProviderCredentials =
    activeProvider === "deepseek"
      ? Boolean(env.DEEPSEEK_API_KEY)
      : activeProvider === "gemini"
        ? Boolean(env.GEMINI_API_KEY)
        : Boolean(env.OPENAI_API_KEY)
  const hasActiveProviderModel =
    activeProvider === "deepseek"
      ? Boolean(env.DEEPSEEK_MODEL)
      : activeProvider === "gemini"
        ? Boolean(env.GEMINI_MODEL)
        : Boolean(env.OPENAI_MODEL)
  const hasActiveProviderBaseUrl =
    activeProvider === "deepseek"
      ? Boolean(env.DEEPSEEK_BASE_URL)
      : activeProvider === "gemini"
        ? Boolean(env.GEMINI_BASE_URL)
        : Boolean(env.OPENAI_BASE_URL)

  checks.push(
    createCheck(
      "llm-credentials",
      hasActiveProviderCredentials,
      hasActiveProviderCredentials
        ? `Ключ активного провайдера ${activeProvider} задан`
        : `Ключ активного провайдера ${activeProvider} не задан`,
      hasActiveProviderCredentials
        ? "LLM-конфигурация может работать после сетевой проверки."
        : `Без ключа для активного провайдера ${activeProvider} откроется только страница состояния, а LLM-сценарии останутся недоступны.`,
    ),
  )

  checks.push(
    createCheck(
      "llm-model",
      hasActiveProviderModel,
      hasActiveProviderModel
        ? `Модель активного провайдера ${activeProvider} задана`
        : `Модель активного провайдера ${activeProvider} не задана`,
      hasActiveProviderModel
        ? "Обе точки входа `start` и `iterate` смогут использовать одну и ту же модель."
        : `Задайте модель для активного провайдера ${activeProvider} в desengine.config.txt.`,
    ),
  )

  checks.push(
    createCheck(
      "llm-base-url",
      hasActiveProviderBaseUrl,
      hasActiveProviderBaseUrl
        ? `BASE_URL активного провайдера ${activeProvider} задан`
        : `BASE_URL активного провайдера ${activeProvider} не задан`,
      hasActiveProviderBaseUrl
        ? "Сетевой endpoint активного провайдера задан явно."
        : `Задайте BASE_URL для активного провайдера ${activeProvider} в desengine.config.txt.`,
    ),
  )

  const allowlistConfigured = Boolean(env.ALLOWLIST_BASE_URL && env.ALLOWLIST_SALT)
  checks.push(
    createCheck(
      "allowlist-config",
      allowlistConfigured,
      allowlistConfigured ? "Allowlist настроен" : "Allowlist не настроен",
      allowlistConfigured
        ? "Пользователь сможет пройти допуск по email из allowlist."
        : "Без allowlist пользователь увидит страницу состояния, но не сможет войти в лабораторию.",
    ),
  )

  checks.push(await ensureOnboardingReady(env))
  checks.push(await runBuildCheck())

  const failedChecks = checks.filter((check) => !check.ok)

  console.log("desengine smoke-check")
  console.log("")

  for (const check of checks) {
    console.log(`${check.ok ? "OK " : "NO "} ${check.summary}`)
    console.log(`   ${check.detail}`)
  }

  console.log("")

  if (failedChecks.length === 0) {
    console.log("Итог: локальная установка выглядит готовой к внешнему запуску.")
    return
  }

  console.log("Итог: локальная установка ещё не готова.")
  process.exitCode = 1
}

await main()
