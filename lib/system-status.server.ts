import "server-only"

import { access, readdir } from "node:fs/promises"
import path from "node:path"

import { getLlmStatus } from "@/lib/llm.server"
import { getAccessControlConfig, getAccessSessionState } from "@/lib/access-control.server"
import { appConfig } from "@/lib/config.server"
import localConfig from "@/lib/local-config.cjs"

localConfig.loadLocalConfig()

type SystemStatusTone = "ready" | "warning" | "blocked"

type SystemStatusItem = {
  id:
    | "local-config-file"
    | "openai-config"
    | "openai-network"
    | "allowlist-config"
    | "allowlist-network"
    | "onboarding-config"
    | "onboarding-content"
    | "access-session"
  label: string
  tone: SystemStatusTone
  summary: string
  detail: string
}

type SystemInstruction = {
  id: string
  actor: "Пользователь" | "Администратор"
  text: string
}

type SystemStatusModel = {
  llmStatus: Awaited<ReturnType<typeof getLlmStatus>>
  items: SystemStatusItem[]
  instructions: SystemInstruction[]
  allowlistConfigured: boolean
  accessState: "valid" | "missing" | "expired"
  hasAccess: boolean
  onboardingRepoConfigured: boolean
  readyForProtectedLab: boolean
}

function summarizeHttpStatus(serviceLabel: string, status: number): {
  tone: SystemStatusTone
  summary: string
  detail: string
} {
  if (status >= 200 && status < 300) {
    return {
      tone: "ready",
      summary: `${serviceLabel} доступен`,
      detail: `Удалённый сервис отвечает кодом ${status}.`,
    }
  }

  if (status === 401 || status === 403) {
    return {
      tone: "warning",
      summary: `${serviceLabel} доступен, но запрос отклонён`,
      detail: `Удалённый сервис отвечает кодом ${status}. Сеть работает, но конфигурацию или права нужно проверить.`,
    }
  }

  return {
    tone: "warning",
    summary: `${serviceLabel} отвечает нестандартно`,
    detail: `Удалённый сервис отвечает кодом ${status}. Доступность есть, но конфигурацию лучше проверить.`,
  }
}

async function fetchReachability(
  url: string,
  init?: RequestInit,
): Promise<{
  ok: boolean
  status?: number
  message: string
}> {
  try {
    const response = await fetch(url, {
      ...init,
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    })

    return {
      ok: response.ok,
      status: response.status,
      message: `HTTP ${response.status}`,
    }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Сетевой запрос завершился ошибкой",
    }
  }
}

async function getOnboardingContentStatus() {
  const missing: string[] = []
  const expectedDirs = [
    appConfig.onboardingRoot,
    appConfig.levelsCatalogRoot,
    appConfig.taskCatalogRoot,
    appConfig.onboardingPromptsRoot,
    path.join(appConfig.onboardingPromptsRoot, "levels"),
    appConfig.promptsRoot,
  ]

  for (const root of expectedDirs) {
    try {
      await readdir(root)
    } catch {
      missing.push(path.relative(process.cwd(), root) || root)
    }
  }

  if (missing.length > 0) {
    return {
      tone: "blocked" as const,
      summary: "Onboarding-контент недоступен",
      detail: `Не найдены обязательные каталоги: ${missing.join(", ")}.`,
      missing,
    }
  }

  const [levelEntries, taskEntries] = await Promise.all([
    readdir(appConfig.levelsCatalogRoot, { withFileTypes: true }),
    readdir(appConfig.taskCatalogRoot, { withFileTypes: true }),
  ])

  if (!levelEntries.some((entry) => entry.isDirectory())) {
    return {
      tone: "blocked" as const,
      summary: "Onboarding-контент неполон",
      detail: "В `/onboarding/levels` не найдено ни одного каталога уровня.",
      missing: ["onboarding/levels/*"],
    }
  }

  if (!taskEntries.some((entry) => entry.isDirectory())) {
    return {
      tone: "blocked" as const,
      summary: "Onboarding-контент неполон",
      detail: "В `/onboarding/tasks` не найдено ни одного каталога задачи.",
      missing: ["onboarding/tasks/*"],
    }
  }

  const requiredFiles = [
    path.join(appConfig.onboardingPromptsRoot, "default.md"),
    path.join(appConfig.promptsRoot, "default.md"),
    path.join(appConfig.promptsRoot, "iterate-component.md"),
  ]

  for (const filePath of requiredFiles) {
    try {
      await access(filePath)
    } catch {
      return {
        tone: "blocked" as const,
        summary: "Onboarding-контент неполон",
        detail: `Не найден обязательный файл: ${path.relative(process.cwd(), filePath)}.`,
        missing: [path.relative(process.cwd(), filePath)],
      }
    }
  }

  return {
    tone: "ready" as const,
    summary: "Onboarding-контент найден",
    detail: "Обязательные каталоги /onboarding доступны для чтения.",
    missing,
  }
}

export async function getSystemStatusModel(): Promise<SystemStatusModel> {
  const [llmStatus, accessState, onboardingContent] = await Promise.all([
    getLlmStatus(),
    getAccessSessionState(),
    getOnboardingContentStatus(),
  ])
  const hasAccess = accessState === "valid"
  const accessConfig = getAccessControlConfig()
  const localConfigState = localConfig.getLocalConfigState()
  const items: SystemStatusItem[] = []
  const instructions: SystemInstruction[] = []

  items.push({
    id: "local-config-file",
    label: "Локальный конфиг",
    tone: localConfigState.hasLegacyEnv ? "warning" : localConfigState.hasConfig ? "ready" : "blocked",
    summary: localConfigState.hasLegacyEnv
      ? "Обнаружен устаревший .env.local"
      : localConfigState.hasConfig
        ? "desengine.config.txt найден"
        : "desengine.config.txt не найден",
    detail: localConfigState.hasLegacyEnv
      ? "Используйте только `desengine.config.txt`. Старый `.env.local` создаёт двусмысленность и может незаметно переопределять настройки."
      : localConfigState.hasConfig
        ? "Локальная конфигурация лежит в каноническом файле `desengine.config.txt`."
        : "Создайте `desengine.config.txt` на основе `desengine.config-example.txt`.",
  })

  if (localConfigState.hasLegacyEnv) {
    instructions.push({
      id: "local-config-file",
      actor: "Администратор",
      text: "Перенесите рабочие значения в `desengine.config.txt` и удалите `.env.local`, чтобы лаборатория использовала один канонический конфиг.",
    })
  } else if (!localConfigState.hasConfig) {
    instructions.push({
      id: "local-config-file",
      actor: "Администратор",
      text: "Создайте `desengine.config.txt` на основе `desengine.config-example.txt`, чтобы лаборатория получила локальные настройки.",
    })
  }

  items.push({
    id: "openai-config",
    label: "OpenAI API",
    tone: llmStatus.config.hasOpenAIKey ? "ready" : "blocked",
    summary: llmStatus.config.hasOpenAIKey ? "Ключ OpenAI задан" : "Ключ OpenAI не задан",
    detail: llmStatus.availability.message,
  })

  if (!llmStatus.config.hasOpenAIKey) {
    instructions.push({
      id: "openai-config",
      actor: "Администратор",
      text: "Добавьте `OPENAI_API_KEY` в `desengine.config.txt`, чтобы LLM-сценарии лаборатории стали рабочими.",
    })
  }

  if (llmStatus.config.hasOpenAIKey) {
    const openAiNetwork = await fetchReachability("https://api.openai.com/v1/models", {
      headers: {
        authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    })
    const openAiSummary = openAiNetwork.status
      ? summarizeHttpStatus("OpenAI API", openAiNetwork.status)
      : {
          tone: "warning" as const,
          summary: "OpenAI API недоступен по сети",
          detail: `Не удалось обратиться к OpenAI API: ${openAiNetwork.message}.`,
        }

    items.push({
      id: "openai-network",
      label: "Сеть до OpenAI",
      tone: openAiSummary.tone,
      summary: openAiSummary.summary,
      detail: openAiSummary.detail,
    })

    if (!openAiNetwork.status) {
      instructions.push({
        id: "openai-network",
        actor: "Администратор",
        text: "Проверьте сетевой доступ до OpenAI API с этой машины и повторите запуск.",
      })
    }
  } else {
    items.push({
      id: "openai-network",
      label: "Сеть до OpenAI",
      tone: "blocked",
      summary: "Проверка не выполнялась",
      detail: "Сначала нужно задать `OPENAI_API_KEY`, затем можно проверять доступность OpenAI API.",
    })
  }

  items.push({
    id: "allowlist-config",
    label: "Allowlist",
    tone: accessConfig.isConfigured ? "ready" : "blocked",
    summary: accessConfig.isConfigured ? "Allowlist настроен" : "Allowlist не настроен",
    detail: accessConfig.isConfigured
      ? "Базовый URL и salt заданы."
      : "Нужны `DESENGINE_ALLOWLIST_BASE_URL` и `DESENGINE_ALLOWLIST_SALT` в `desengine.config.txt`.",
  })

  if (!accessConfig.isConfigured) {
    instructions.push({
      id: "allowlist-config",
      actor: "Администратор",
      text: "Задайте `DESENGINE_ALLOWLIST_BASE_URL` и `DESENGINE_ALLOWLIST_SALT`, чтобы пользователи могли пройти допуск в лабораторию.",
    })
  }

  const onboardingRepoUrl = process.env.DESENGINE_ONBOARDING_REPO_URL?.trim() ?? ""

  items.push({
    id: "onboarding-config",
    label: "Onboarding-репозиторий",
    tone: onboardingRepoUrl ? "ready" : "blocked",
    summary: onboardingRepoUrl ? "URL onboarding-репозитория задан" : "URL onboarding-репозитория не задан",
    detail: onboardingRepoUrl
      ? `Используется значение DESENGINE_ONBOARDING_REPO_URL: ${onboardingRepoUrl}.`
      : "Добавьте `DESENGINE_ONBOARDING_REPO_URL` в `desengine.config.txt`, чтобы система знала канонический источник onboarding-контента.",
  })

  if (!onboardingRepoUrl) {
    instructions.push({
      id: "onboarding-config",
      actor: "Администратор",
      text: "Добавьте `DESENGINE_ONBOARDING_REPO_URL` в `desengine.config.txt`, чтобы зафиксировать внешний источник onboarding-контента.",
    })
  }

  items.push({
    id: "onboarding-content",
    label: "Onboarding-контент",
    tone: onboardingContent.tone,
    summary: onboardingContent.summary,
    detail: onboardingContent.detail,
  })

  if (onboardingContent.missing.length > 0) {
    instructions.push({
      id: "onboarding-content",
      actor: "Администратор",
      text: onboardingRepoUrl
        ? "Используйте кнопку `Обновить onboarding` на `/config`, чтобы заново загрузить локальный каталог `/onboarding`."
        : "Сначала задайте `DESENGINE_ONBOARDING_REPO_URL` в `desengine.config.txt`, затем используйте кнопку `Обновить onboarding` на `/config`.",
    })
  }

  if (accessConfig.isConfigured) {
    let allowlistNetwork = await fetchReachability(accessConfig.baseUrl, {
      method: "HEAD",
    })

    if (allowlistNetwork.status && allowlistNetwork.status !== 200 && allowlistNetwork.status !== 404) {
      allowlistNetwork = await fetchReachability(accessConfig.baseUrl, {
        method: "GET",
      })
    }

    const allowlistSummary = allowlistNetwork.status
      ? summarizeHttpStatus("Allowlist-хранилище", allowlistNetwork.status)
      : {
          tone: "warning" as const,
          summary: "Allowlist-хранилище недоступно по сети",
          detail: `Не удалось обратиться к allowlist-хранилищу: ${allowlistNetwork.message}.`,
        }

    items.push({
      id: "allowlist-network",
      label: "Сеть до allowlist",
      tone: allowlistSummary.tone,
      summary: allowlistSummary.summary,
      detail: allowlistSummary.detail,
    })

    if (!allowlistNetwork.status) {
      instructions.push({
        id: "allowlist-network",
        actor: "Администратор",
        text: "Проверьте доступность удалённого allowlist-хранилища и корректность `DESENGINE_ALLOWLIST_BASE_URL`.",
      })
    }
  } else {
    items.push({
      id: "allowlist-network",
      label: "Сеть до allowlist",
      tone: "blocked",
      summary: "Проверка не выполнялась",
      detail: "Сначала нужно настроить allowlist, затем можно проверять его сетевую доступность.",
    })
  }

  items.push({
    id: "access-session",
    label: "Доступ в лабораторию",
    tone: hasAccess ? "ready" : accessState === "expired" ? "warning" : "blocked",
    summary: hasAccess
      ? "Допуск уже выдан"
      : accessState === "expired"
        ? "Допуск истёк"
        : "Допуск ещё не выдан",
    detail: hasAccess
      ? "Можно открыть защищённую часть лаборатории."
      : accessState === "expired"
        ? "Нужно снова пройти allowlist-проверку на `/auth`, чтобы открыть защищённую часть лаборатории."
      : accessConfig.isConfigured
        ? "Введите email из allowlist, чтобы открыть задачи и рабочую часть лаборатории."
        : "Сначала администратор должен настроить allowlist, после этого пользователь сможет пройти допуск.",
  })

  if (!hasAccess && accessConfig.isConfigured) {
    instructions.push({
      id: "access-session",
      actor: "Пользователь",
      text:
        accessState === "expired"
          ? "Предыдущий допуск истёк. Повторно введите email из allowlist на `/auth`, чтобы открыть задачи и рабочую часть лаборатории."
          : "Введите email, который уже добавлен в allowlist, чтобы открыть задачи и рабочую часть лаборатории.",
    })
  }

  return {
    llmStatus,
    items,
    instructions,
    allowlistConfigured: accessConfig.isConfigured,
    accessState,
    hasAccess,
    onboardingRepoConfigured: Boolean(onboardingRepoUrl),
    readyForProtectedLab: hasAccess,
  }
}
