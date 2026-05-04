import "server-only"

import { appConfig } from "@/lib/config.server"
import type { LlmProvider, LlmStatus, LlmUsageMetrics } from "@/lib/llm.types"

type LlmStructuredRequest = {
  instruction: string
  imageBase64?: string
  schemaName: string
  schema: Record<string, unknown>
  target?: "default" | "init"
}

type LlmStructuredResponse = {
  provider: LlmProvider
  model: string
  outputText: string
  metrics: LlmUsageMetrics
}

class LlmError extends Error {
  kind: "config" | "network" | "timeout" | "provider" | "invalid_response"

  constructor(kind: LlmError["kind"], message: string) {
    super(message)
    this.kind = kind
  }
}

function parsePositiveInteger(rawValue: string | undefined): number | null {
  if (!rawValue) return null

  const value = Number(rawValue)
  if (!Number.isInteger(value) || value <= 0) return null

  return value
}

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "")
}

function getLlmProvider(): LlmProvider {
  const configured = process.env.DESENGINE_LLM_PROVIDER
  if (configured === "openai" || configured === "ollama") {
    return configured
  }

  return appConfig.llm.provider
}

function getInitLlmProvider(): LlmProvider {
  const configured = process.env.DESENGINE_INIT_LLM_PROVIDER
  if (configured === "openai" || configured === "ollama") {
    return configured
  }

  return getLlmProvider()
}

function getOpenAIModel(): string {
  return process.env.DESENGINE_OPENAI_MODEL || appConfig.llm.openai.defaultModel
}

function getInitOpenAIModel(): string {
  return process.env.DESENGINE_INIT_OPENAI_MODEL || getOpenAIModel()
}

function getOllamaBaseUrl(): string {
  return trimTrailingSlash(process.env.DESENGINE_OLLAMA_BASE_URL || appConfig.llm.ollama.defaultBaseUrl)
}

function getOllamaModel(): string {
  return (process.env.DESENGINE_OLLAMA_MODEL || "").trim()
}

function getInitOllamaModel(): string {
  return (process.env.DESENGINE_INIT_OLLAMA_MODEL || getOllamaModel()).trim()
}

function getOllamaTimeoutMs(): number | null {
  return parsePositiveInteger(process.env.DESENGINE_OLLAMA_TIMEOUT_MS)
}

function createAbortSignal(timeoutMs?: number): AbortSignal | undefined {
  if (!timeoutMs) return undefined
  return AbortSignal.timeout(timeoutMs)
}

function getOutputTextFromOpenAI(data: unknown): string {
  if (
    data &&
    typeof data === "object" &&
    "output_text" in data &&
    typeof data.output_text === "string" &&
    data.output_text.trim()
  ) {
    return data.output_text
  }

  const output =
    data &&
    typeof data === "object" &&
    "output" in data &&
    Array.isArray(data.output)
      ? data.output
      : []

  for (const item of output) {
    const content = item && typeof item === "object" && Array.isArray(item.content) ? item.content : []
    for (const part of content) {
      if (
        part &&
        typeof part === "object" &&
        part.type === "output_text" &&
        typeof part.text === "string" &&
        part.text.trim()
      ) {
        return part.text
      }
    }
  }

  throw new LlmError("invalid_response", "Провайдер вернул ответ без итогового текста")
}

function getOpenAIMetrics(data: unknown): LlmUsageMetrics {
  const usage =
    data &&
    typeof data === "object" &&
    "usage" in data &&
    data.usage &&
    typeof data.usage === "object"
      ? data.usage as Record<string, unknown>
      : null

  if (!usage) {
    return {
      status: "unavailable",
      reason: "provider_did_not_return_metrics",
    }
  }

  return {
    status: "available",
    inputTokens: typeof usage.input_tokens === "number" ? usage.input_tokens : null,
    outputTokens: typeof usage.output_tokens === "number" ? usage.output_tokens : null,
    totalTokens: typeof usage.total_tokens === "number" ? usage.total_tokens : null,
    costUsd: null,
  }
}

function getOllamaMetrics(data: unknown): LlmUsageMetrics {
  const payload = data && typeof data === "object" ? data as Record<string, unknown> : null
  if (!payload) {
    return {
      status: "unavailable",
      reason: "provider_did_not_return_metrics",
    }
  }

  const inputTokens = typeof payload.prompt_eval_count === "number" ? payload.prompt_eval_count : null
  const outputTokens = typeof payload.eval_count === "number" ? payload.eval_count : null
  const totalTokens =
    typeof inputTokens === "number" && typeof outputTokens === "number"
      ? inputTokens + outputTokens
      : null

  if (inputTokens === null && outputTokens === null && totalTokens === null) {
    return {
      status: "unavailable",
      reason: "provider_did_not_return_metrics",
    }
  }

  return {
    status: "available",
    inputTokens,
    outputTokens,
    totalTokens,
    costUsd: null,
  }
}

function mapFetchError(error: unknown, fallbackMessage: string): never {
  if (error instanceof LlmError) {
    throw error
  }

  if (error instanceof Error && error.name === "TimeoutError") {
    throw new LlmError("timeout", "Таймаут при обращении к LLM-провайдеру")
  }

  throw new LlmError("network", fallbackMessage)
}

function ensureOpenAIConfig(target: "default" | "init") {
  if (!process.env.OPENAI_API_KEY) {
    throw new LlmError("config", "Для режима OpenAI не настроен OPENAI_API_KEY")
  }

  return {
    provider: "openai" as const,
    model: target === "init" ? getInitOpenAIModel() : getOpenAIModel(),
    apiKey: process.env.OPENAI_API_KEY,
  }
}

function ensureOllamaConfig(target: "default" | "init") {
  const baseUrl = getOllamaBaseUrl()
  const model = target === "init" ? getInitOllamaModel() : getOllamaModel()
  const timeoutMs = getOllamaTimeoutMs()

  if (!baseUrl) {
    throw new LlmError("config", "Для режима Ollama не настроен DESENGINE_OLLAMA_BASE_URL")
  }

  if (!model) {
    throw new LlmError("config", "Для режима Ollama не настроен DESENGINE_OLLAMA_MODEL")
  }

  if (!timeoutMs) {
    throw new LlmError("config", "Для режима Ollama не настроен DESENGINE_OLLAMA_TIMEOUT_MS")
  }

  return {
    provider: "ollama" as const,
    baseUrl,
    model,
    timeoutMs,
  }
}

async function callOpenAI(request: LlmStructuredRequest): Promise<LlmStructuredResponse> {
  const config = ensureOpenAIConfig(request.target ?? "default")

  const content: Array<{ type: string; text?: string; image_url?: string }> = [
    { type: "input_text", text: request.instruction },
  ]

  if (request.imageBase64) {
    content.push({ type: "input_image", image_url: `data:image/png;base64,${request.imageBase64}` })
  }

  let res: Response
  try {
    res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        authorization: `Bearer ${config.apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        text: {
          format: {
            type: "json_schema",
            name: request.schemaName,
            strict: true,
            schema: request.schema,
          },
        },
        input: [
          {
            role: "user",
            content,
          },
        ],
      }),
    })
  } catch (error) {
    mapFetchError(error, "Не удалось подключиться к OpenAI API")
  }

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const providerMessage =
      data &&
      typeof data === "object" &&
      "error" in data &&
      data.error &&
      typeof data.error === "object" &&
      "message" in data.error &&
      typeof data.error.message === "string"
        ? data.error.message
        : "Ошибка OpenAI API"
    throw new LlmError("provider", providerMessage)
  }

  return {
    provider: "openai",
    model: config.model,
    outputText: getOutputTextFromOpenAI(data),
    metrics: getOpenAIMetrics(data),
  }
}

async function callOllama(request: LlmStructuredRequest): Promise<LlmStructuredResponse> {
  const config = ensureOllamaConfig(request.target ?? "default")

  const images = request.imageBase64 ? [request.imageBase64] : []

  let res: Response
  try {
    res = await fetch(`${config.baseUrl}/api/generate`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        prompt: request.instruction,
        images,
        format: request.schema,
        stream: false,
      }),
      signal: createAbortSignal(config.timeoutMs),
    })
  } catch (error) {
    mapFetchError(error, "Не удалось подключиться к Ollama endpoint")
  }

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const providerMessage =
      data &&
      typeof data === "object" &&
      "error" in data &&
      typeof data.error === "string"
        ? data.error
        : "Ollama endpoint вернул ошибку"
    throw new LlmError("provider", providerMessage)
  }

  const responseText =
    data &&
    typeof data === "object" &&
    "response" in data &&
    typeof data.response === "string"
      ? data.response
      : ""

  if (!responseText.trim()) {
    throw new LlmError("invalid_response", "Ollama вернула пустой или неподдерживаемый ответ")
  }

  return {
    provider: "ollama",
    model: config.model,
    outputText: responseText,
    metrics: getOllamaMetrics(data),
  }
}

export async function runStructuredLlmRequest(request: LlmStructuredRequest): Promise<LlmStructuredResponse> {
  const provider = request.target === "init" ? getInitLlmProvider() : getLlmProvider()
  if (provider === "ollama") {
    return callOllama(request)
  }

  return callOpenAI(request)
}

export function toLlmErrorResponse(error: unknown) {
  const llmError =
    error instanceof LlmError
      ? error
      : new LlmError("provider", error instanceof Error ? error.message : "Неизвестная ошибка LLM-провайдера")

  const status =
    llmError.kind === "config"
      ? 400
      : llmError.kind === "timeout"
        ? 504
        : llmError.kind === "network"
          ? 502
          : llmError.kind === "invalid_response"
            ? 502
            : 500

  return {
    status,
    body: {
      ok: false,
      error: llmError.message,
      errorKind: llmError.kind,
    },
  }
}

async function checkOllamaAvailability(): Promise<LlmStatus["availability"]> {
  const config = ensureOllamaConfig()

  let res: Response
  try {
    res = await fetch(`${config.baseUrl}/api/tags`, {
      signal: createAbortSignal(config.timeoutMs),
    })
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      return {
        ok: false,
        message: "Проверка Ollama завершилась по таймауту",
      }
    }

    return {
      ok: false,
      message: "Ollama endpoint недоступен по сети",
    }
  }

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    return {
      ok: false,
      message: "Ollama endpoint вернул ошибку при проверке доступности",
    }
  }

  const models =
    data &&
    typeof data === "object" &&
    "models" in data &&
    Array.isArray(data.models)
      ? data.models
      : null

  if (!models) {
    return {
      ok: false,
      message: "Ollama endpoint вернул неподдерживаемый формат списка моделей",
    }
  }

  const hasModel = models.some((item) => {
    if (!item || typeof item !== "object") return false

    const name = "name" in item && typeof item.name === "string" ? item.name : null
    const model = "model" in item && typeof item.model === "string" ? item.model : null

    return name === config.model || model === config.model
  })

  if (!hasModel) {
    return {
      ok: false,
      message: `Ollama доступна, но модель ${config.model} не найдена`,
    }
  }

  return {
    ok: true,
    message: "Ollama доступна и модель найдена",
  }
}

export async function getLlmStatus(): Promise<LlmStatus> {
  const provider = getLlmProvider()

  if (provider === "ollama") {
    try {
      const config = ensureOllamaConfig()
      const availability = await checkOllamaAvailability()

      return {
        provider,
        label: "Ollama",
        ready: availability.ok,
        config: {
          model: config.model,
          baseUrl: config.baseUrl,
          timeoutMs: config.timeoutMs,
          hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY),
        },
        availability,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Конфигурация Ollama некорректна"
      return {
        provider,
        label: "Ollama",
        ready: false,
        config: {
          model: getOllamaModel() || null,
          baseUrl: getOllamaBaseUrl() || null,
          timeoutMs: getOllamaTimeoutMs(),
          hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY),
        },
        availability: {
          ok: false,
          message,
        },
      }
    }
  }

  try {
    const config = ensureOpenAIConfig()
    return {
      provider,
      label: "OpenAI",
      ready: true,
      config: {
        model: config.model,
        baseUrl: null,
        timeoutMs: null,
        hasOpenAIKey: true,
      },
      availability: {
        ok: true,
        message: "OpenAI API настроен",
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Конфигурация OpenAI некорректна"
    return {
      provider,
      label: "OpenAI",
      ready: false,
      config: {
        model: getOpenAIModel(),
        baseUrl: null,
        timeoutMs: null,
        hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY),
      },
      availability: {
        ok: false,
        message,
      },
    }
  }
}
