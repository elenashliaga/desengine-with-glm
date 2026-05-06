import "server-only"

import { getLlmStatus } from "@/lib/llm.server"
import { getAccessControlConfig, hasAccessSession } from "@/lib/access-control.server"
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
  hasAccess: boolean
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

export async function getSystemStatusModel(): Promise<SystemStatusModel> {
  const [llmStatus, accessState] = await Promise.all([
    getLlmStatus(),
    hasAccessSession(),
  ])
  const accessConfig = getAccessControlConfig()
  const localConfigState = localConfig.getLocalConfigState()
  const items: SystemStatusItem[] = []
  const instructions: SystemInstruction[] = []

  items.push({
    id: "local-config-file",
    label: "Локальный конфиг",
    tone: localConfigState.hasLegacyEnv ? "warning" : localConfigState.hasConfig ? "ready" : "blocked",
    summary: localConfigState.hasLegacyEnv
      ? "Обнаружен устаревший lab/.env.local"
      : localConfigState.hasConfig
        ? "lab/config.txt найден"
        : "lab/config.txt не найден",
    detail: localConfigState.hasLegacyEnv
      ? "Используйте только `lab/config.txt`. Старый `.env.local` создаёт двусмысленность и может незаметно переопределять настройки."
      : localConfigState.hasConfig
        ? "Локальная конфигурация лежит в каноническом файле `lab/config.txt`."
        : "Создайте `lab/config.txt` на основе `lab/config-example.txt`.",
  })

  if (localConfigState.hasLegacyEnv) {
    instructions.push({
      id: "local-config-file",
      actor: "Администратор",
      text: "Перенесите рабочие значения в `lab/config.txt` и удалите `lab/.env.local`, чтобы лаборатория использовала один канонический конфиг.",
    })
  } else if (!localConfigState.hasConfig) {
    instructions.push({
      id: "local-config-file",
      actor: "Администратор",
      text: "Создайте `lab/config.txt` на основе `lab/config-example.txt`, чтобы лаборатория получила локальные настройки.",
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
      text: "Добавьте `OPENAI_API_KEY` в `lab/config.txt`, чтобы LLM-сценарии лаборатории стали рабочими.",
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
      : "Нужны `DESENGINE_ALLOWLIST_BASE_URL` и `DESENGINE_ALLOWLIST_SALT` в `lab/config.txt`.",
  })

  if (!accessConfig.isConfigured) {
    instructions.push({
      id: "allowlist-config",
      actor: "Администратор",
      text: "Задайте `DESENGINE_ALLOWLIST_BASE_URL` и `DESENGINE_ALLOWLIST_SALT`, чтобы пользователи могли пройти допуск в лабораторию.",
    })
  }

  if (accessConfig.isConfigured) {
    const allowlistNetwork = await fetchReachability(accessConfig.baseUrl, {
      method: "HEAD",
    })

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
    tone: accessState ? "ready" : "blocked",
    summary: accessState ? "Допуск уже выдан" : "Допуск ещё не выдан",
    detail: accessState
      ? "Можно открыть защищённую часть лаборатории."
      : accessConfig.isConfigured
        ? "Введите email из allowlist, чтобы открыть задачи и рабочую часть лаборатории."
        : "Сначала администратор должен настроить allowlist, после этого пользователь сможет пройти допуск.",
  })

  if (!accessState && accessConfig.isConfigured) {
    instructions.push({
      id: "access-session",
      actor: "Пользователь",
      text: "Введите email, который уже добавлен в allowlist, чтобы открыть задачи и рабочую часть лаборатории.",
    })
  }

  return {
    llmStatus,
    items,
    instructions,
    allowlistConfigured: accessConfig.isConfigured,
    hasAccess: accessState,
    readyForProtectedLab: accessState,
  }
}
