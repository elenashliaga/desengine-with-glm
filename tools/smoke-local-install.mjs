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
const nextCliPath = path.join(rootDir, "node_modules", "next", "dist", "bin", "next")

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

async function runBuildCheck() {
  if (!fs.existsSync(nextCliPath)) {
    return createCheck(
      "production-build",
      false,
      "Не найден локальный Next.js CLI",
      "Установите зависимости в корне репозитория, затем повторите smoke-check.",
    )
  }

  try {
    await execFileAsync(process.execPath, [nextCliPath, "build"], {
      cwd: rootDir,
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
      Boolean(env.DESENGINE_LLM_PROVIDER || env.OPENAI_API_KEY),
      env.DESENGINE_LLM_PROVIDER
        ? `Активный LLM-провайдер: ${env.DESENGINE_LLM_PROVIDER}`
        : "Активный LLM-провайдер не задан",
      env.DESENGINE_LLM_PROVIDER
        ? "Проверьте, что для этого провайдера заданы его ключ и модель."
        : "Задайте `DESENGINE_LLM_PROVIDER` в `desengine.config.txt`. Для обратной совместимости старый OpenAI-конфиг всё ещё может подхватиться по умолчанию.",
    ),
  )

  const activeProvider = (env.DESENGINE_LLM_PROVIDER || "openai").trim().toLowerCase()
  const hasActiveProviderCredentials =
    activeProvider === "deepseek"
      ? Boolean(env.DEEPSEEK_API_KEY)
      : activeProvider === "gemini"
        ? Boolean(env.GEMINI_API_KEY)
        : Boolean(env.OPENAI_API_KEY)
  const hasActiveProviderModel =
    activeProvider === "deepseek"
      ? Boolean(env.DESENGINE_DEEPSEEK_MODEL)
      : activeProvider === "gemini"
        ? Boolean(env.DESENGINE_GEMINI_MODEL)
        : Boolean(env.DESENGINE_OPENAI_MODEL)

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

  const allowlistConfigured = Boolean(env.DESENGINE_ALLOWLIST_BASE_URL && env.DESENGINE_ALLOWLIST_SALT)
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
