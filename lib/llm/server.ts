import "server-only"
import {
  type LlmProvider,
  type LlmUsageMetrics,
  type LlmStatus,
  type LlmStructuredRequest,
  type LlmStructuredResponse,
  type ProviderRuntimeConfig,
  type LlmRequestRuntime,
  type LlmAdapter,
} from "./types"

import localConfig from "../config/local-config.cjs"

localConfig.loadLocalConfig()



class LlmError extends Error {
  kind: "config" | "auth" | "network" | "timeout" | "provider" | "invalid_response"

  constructor(kind: LlmError["kind"], message: string) {
    super(message)
    this.kind = kind
  }
}

function getLlmProvider(): LlmProvider {
  const rawProvider = process.env.LLM_PROVIDER?.trim().toLowerCase()

  if (!rawProvider) {
    return "openai"
  }

  if (rawProvider === "openai" || rawProvider === "deepseek" || rawProvider === "gemini") {
    return rawProvider
  }

  throw new LlmError(
    "config",
    `Неподдерживаемый LLM_PROVIDER: ${rawProvider}. Поддерживаются: openai, deepseek, gemini.`,
  )
}

function getOpenAIModel(): string {
  const model = process.env.OPENAI_MODEL?.trim()

  if (!model) {
    throw new LlmError("config", "Для режима OpenAI не настроен OPENAI_MODEL")
  }

  return model
}

function getDeepSeekModel(): string {
  const model = process.env.DEEPSEEK_MODEL?.trim()

  if (!model) {
    throw new LlmError("config", "Для режима DeepSeek не настроен DEEPSEEK_MODEL")
  }

  return model
}

function getGeminiModel(): string {
  const model = process.env.GEMINI_MODEL?.trim()

  if (!model) {
    throw new LlmError("config", "Для режима Google Gemini не настроен GEMINI_MODEL")
  }

  return model
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

function getOutputTextFromDeepSeek(data: unknown): string {
  const choices =
    data &&
    typeof data === "object" &&
    "choices" in data &&
    Array.isArray(data.choices)
      ? data.choices
      : []

  const firstChoice = choices[0]
  const message =
    firstChoice &&
    typeof firstChoice === "object" &&
    "message" in firstChoice &&
    firstChoice.message &&
    typeof firstChoice.message === "object"
      ? (firstChoice.message as Record<string, unknown>)
      : null

  if (message && typeof message.content === "string" && message.content.trim()) {
    return message.content
  }

  throw new LlmError("invalid_response", "DeepSeek вернул ответ без итогового текста")
}

function getOpenAIMetrics(data: unknown): LlmUsageMetrics {
  const usage =
    data &&
    typeof data === "object" &&
    "usage" in data &&
    data.usage &&
    typeof data.usage === "object"
      ? (data.usage as Record<string, unknown>)
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

function getDeepSeekMetrics(data: unknown): LlmUsageMetrics {
  const usage =
    data &&
    typeof data === "object" &&
    "usage" in data &&
    data.usage &&
    typeof data.usage === "object"
      ? (data.usage as Record<string, unknown>)
      : null

  if (!usage) {
    return {
      status: "unavailable",
      reason: "provider_did_not_return_metrics",
    }
  }

  return {
    status: "available",
    inputTokens: typeof usage.prompt_tokens === "number" ? usage.prompt_tokens : null,
    outputTokens: typeof usage.completion_tokens === "number" ? usage.completion_tokens : null,
    totalTokens: typeof usage.total_tokens === "number" ? usage.total_tokens : null,
    costUsd: null,
  }
}

function getGeminiBlockedMessage(blockReason: unknown): string {
  if (blockReason === "SAFETY" || blockReason === "IMAGE_SAFETY") {
    return "Google Gemini заблокировал запрос по safety-фильтру. Измените формулировку или изображение и повторите попытку."
  }

  if (blockReason === "BLOCKLIST" || blockReason === "PROHIBITED_CONTENT") {
    return "Google Gemini отклонил запрос из-за ограничений контента. Измените формулировку и повторите попытку."
  }

  return "Google Gemini заблокировал запрос. Измените формулировку и повторите попытку."
}

function getOutputTextFromGemini(data: unknown): string {
  const promptFeedback =
    data &&
    typeof data === "object" &&
    "promptFeedback" in data &&
    data.promptFeedback &&
    typeof data.promptFeedback === "object"
      ? (data.promptFeedback as Record<string, unknown>)
      : null

  if (promptFeedback?.blockReason) {
    throw new LlmError("provider", getGeminiBlockedMessage(promptFeedback.blockReason))
  }

  const candidates =
    data &&
    typeof data === "object" &&
    "candidates" in data &&
    Array.isArray(data.candidates)
      ? data.candidates
      : []

  const firstCandidate =
    candidates[0] && typeof candidates[0] === "object" ? (candidates[0] as Record<string, unknown>) : null

  if (!firstCandidate) {
    throw new LlmError("invalid_response", "Google Gemini вернул ответ без кандидатов")
  }

  const finishReason = firstCandidate.finishReason
  if (finishReason === "SAFETY") {
    throw new LlmError("provider", "Google Gemini заблокировал ответ по safety-фильтру. Измените запрос и повторите попытку.")
  }

  if (finishReason === "RECITATION") {
    throw new LlmError("provider", "Google Gemini остановил ответ из-за ограничений на воспроизведение контента. Измените запрос и повторите попытку.")
  }

  if (finishReason === "LANGUAGE") {
    throw new LlmError("provider", "Google Gemini не принял запрос из-за ограничений языка. Измените формулировку и повторите попытку.")
  }

  const content =
    "content" in firstCandidate && firstCandidate.content && typeof firstCandidate.content === "object"
      ? (firstCandidate.content as Record<string, unknown>)
      : null
  const parts = content && Array.isArray(content.parts) ? content.parts : []

  for (const part of parts) {
    if (part && typeof part === "object" && typeof part.text === "string" && part.text.trim()) {
      return part.text
    }
  }

  throw new LlmError("invalid_response", "Google Gemini вернул ответ без итогового текста")
}

function getGeminiMetrics(data: unknown): LlmUsageMetrics {
  const usage =
    data &&
    typeof data === "object" &&
    "usageMetadata" in data &&
    data.usageMetadata &&
    typeof data.usageMetadata === "object"
      ? (data.usageMetadata as Record<string, unknown>)
      : null

  if (!usage) {
    return {
      status: "unavailable",
      reason: "provider_did_not_return_metrics",
    }
  }

  return {
    status: "available",
    inputTokens: typeof usage.promptTokenCount === "number" ? usage.promptTokenCount : null,
    outputTokens: typeof usage.candidatesTokenCount === "number" ? usage.candidatesTokenCount : null,
    totalTokens: typeof usage.totalTokenCount === "number" ? usage.totalTokenCount : null,
    costUsd: null,
  }
}

function mapFetchError(error: unknown, fallbackMessage: string): never {
  if (error instanceof LlmError) {
    throw error
  }

  if (error instanceof Error && error.name === "TimeoutError") {
    throw new LlmError("timeout", "LLM-провайдер не успел ответить вовремя. Повторите попытку.")
  }

  throw new LlmError("network", fallbackMessage)
}

const DEFAULT_INIT_TIMEOUT_MS = 45_000

function parseTimeoutEnvVar(name: string): number | null {
  const rawValue = process.env[name]?.trim()

  if (!rawValue) {
    return null
  }

  if (!/^\d+$/.test(rawValue)) {
    throw new LlmError("config", `Переменная ${name} должна быть положительным числом миллисекунд`)
  }

  const timeoutMs = Number.parseInt(rawValue, 10)

  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new LlmError("config", `Переменная ${name} должна быть положительным числом миллисекунд`)
  }

  return timeoutMs
}

function getLlmRequestRuntime(target: LlmStructuredRequest["target"]): LlmRequestRuntime {
  if (target !== "init") {
    return {
      timeoutMs: null,
    }
  }

  const timeoutMs = parseTimeoutEnvVar("LLM_INIT_TIMEOUT_MS") ?? DEFAULT_INIT_TIMEOUT_MS

  return {
    timeoutMs,
    signal: AbortSignal.timeout(timeoutMs),
  }
}

function ensureOpenAIConfig(): ProviderRuntimeConfig {
  if (!process.env.OPENAI_API_KEY?.trim()) {
    throw new LlmError("config", "Для режима OpenAI не настроен OPENAI_API_KEY")
  }
  if (!process.env.OPENAI_BASE_URL?.trim()) {
    throw new LlmError("config", "Для режима OpenAI не настроен OPENAI_BASE_URL")
  }

  return {
    provider: "openai",
    model: getOpenAIModel(),
    apiKey: process.env.OPENAI_API_KEY,
    baseUrl: process.env.OPENAI_BASE_URL.trim(),
  }
}

function ensureDeepSeekConfig(): ProviderRuntimeConfig {
  if (!process.env.DEEPSEEK_API_KEY?.trim()) {
    throw new LlmError("config", "Для режима DeepSeek не настроен DEEPSEEK_API_KEY")
  }
  if (!process.env.DEEPSEEK_BASE_URL?.trim()) {
    throw new LlmError("config", "Для режима DeepSeek не настроен DEEPSEEK_BASE_URL")
  }

  return {
    provider: "deepseek",
    model: getDeepSeekModel(),
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseUrl: process.env.DEEPSEEK_BASE_URL.trim(),
  }
}

function ensureGeminiConfig(): ProviderRuntimeConfig {
  if (!process.env.GEMINI_API_KEY?.trim()) {
    throw new LlmError("config", "Для режима Google Gemini не настроен GEMINI_API_KEY")
  }
  if (!process.env.GEMINI_BASE_URL?.trim()) {
    throw new LlmError("config", "Для режима Google Gemini не настроен GEMINI_BASE_URL")
  }

  return {
    provider: "gemini",
    model: getGeminiModel(),
    apiKey: process.env.GEMINI_API_KEY,
    baseUrl: process.env.GEMINI_BASE_URL.trim(),
  }
}

function getGeminiModelPath(model: string): string {
  return model.startsWith("models/") ? model : `models/${model}`
}

async function callOpenAI(
  request: LlmStructuredRequest,
  config: ProviderRuntimeConfig,
  runtime: LlmRequestRuntime,
): Promise<LlmStructuredResponse> {
  const images = request.imageBase64List ?? (request.imageBase64 ? [request.imageBase64] : [])
  const startedAt = Date.now()

  const content: Array<{ type: string; text?: string; image_url?: string }> = [
    { type: "input_text", text: request.instruction },
  ]

  for (const imageBase64 of images) {
    content.push({ type: "input_image", image_url: `data:image/png;base64,${imageBase64}` })
  }

  let res: Response
  try {
    console.log("[desengine][openai] start", {
      target: request.target ?? "default",
      model: config.model,
      imageCount: images.length,
      instructionLength: request.instruction.length,
      schemaName: request.schemaName,
      timeoutMs: runtime.timeoutMs,
    })

    res = await fetch(`${config.baseUrl}/responses`, {
      method: "POST",
      signal: runtime.signal,
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
    console.error("[desengine][openai] network_error", {
      target: request.target ?? "default",
      model: config.model,
      durationMs: Date.now() - startedAt,
      message: error instanceof Error ? error.message : String(error),
    })
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
    const errorKind = res.status === 401 || res.status === 403 ? "auth" : "provider"
    console.error("[desengine][openai] provider_error", {
      target: request.target ?? "default",
      model: config.model,
      status: res.status,
      durationMs: Date.now() - startedAt,
      message: providerMessage,
    })
    throw new LlmError(errorKind, providerMessage)
  }

  console.log("[desengine][openai] success", {
    target: request.target ?? "default",
    model: config.model,
    status: res.status,
    durationMs: Date.now() - startedAt,
  })

  return {
    provider: "openai",
    model: config.model,
    outputText: getOutputTextFromOpenAI(data),
    metrics: getOpenAIMetrics(data),
  }
}

async function callDeepSeek(
  request: LlmStructuredRequest,
  config: ProviderRuntimeConfig,
  runtime: LlmRequestRuntime,
): Promise<LlmStructuredResponse> {
  const images = request.imageBase64List ?? (request.imageBase64 ? [request.imageBase64] : [])
  const startedAt = Date.now()
  const instruction =
    images.length > 0
      ? `${request.instruction}

[СИСТЕМНОЕ ОГРАНИЧЕНИЕ ПРОВАЙДЕРА]
Изображения текущего уровня в этом вызове недоступны. Не придумывай конкретные визуальные детали, которых нет в текстовом контексте.`
      : request.instruction

  let res: Response
  try {
    console.log("[desengine][deepseek] start", {
      target: request.target ?? "default",
      model: config.model,
      imageCount: images.length,
      instructionLength: instruction.length,
      schemaName: request.schemaName,
      timeoutMs: runtime.timeoutMs,
    })

    if (images.length > 0) {
      console.warn("[desengine][deepseek] images_omitted", {
        target: request.target ?? "default",
        model: config.model,
        imageCount: images.length,
      })
    }

    res = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      signal: runtime.signal,
      headers: {
        authorization: `Bearer ${config.apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: "system",
            content:
              "Верни только валидный JSON-объект без markdown и без пояснений. Строго соблюдай ограничения из запроса пользователя.",
          },
          {
            role: "user",
            content: instruction,
          },
        ],
        response_format: {
          type: "json_object",
        },
        stream: false,
      }),
    })
  } catch (error) {
    console.error("[desengine][deepseek] network_error", {
      target: request.target ?? "default",
      model: config.model,
      durationMs: Date.now() - startedAt,
      message: error instanceof Error ? error.message : String(error),
    })
    mapFetchError(error, "Не удалось подключиться к DeepSeek API")
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
        : "Ошибка DeepSeek API"
    const errorKind = res.status === 401 || res.status === 403 ? "auth" : "provider"
    console.error("[desengine][deepseek] provider_error", {
      target: request.target ?? "default",
      model: config.model,
      status: res.status,
      durationMs: Date.now() - startedAt,
      message: providerMessage,
    })
    throw new LlmError(errorKind, providerMessage)
  }

  console.log("[desengine][deepseek] success", {
    target: request.target ?? "default",
    model: config.model,
    status: res.status,
    durationMs: Date.now() - startedAt,
  })

  return {
    provider: "deepseek",
    model: config.model,
    outputText: getOutputTextFromDeepSeek(data),
    metrics: getDeepSeekMetrics(data),
  }
}

async function callGemini(
  request: LlmStructuredRequest,
  config: ProviderRuntimeConfig,
  runtime: LlmRequestRuntime,
): Promise<LlmStructuredResponse> {
  const images = request.imageBase64List ?? (request.imageBase64 ? [request.imageBase64] : [])
  const startedAt = Date.now()
  const parts: Array<{ text?: string; inline_data?: { mime_type: string; data: string } }> = [{ text: request.instruction }]

  for (const imageBase64 of images) {
    parts.push({
      inline_data: {
        mime_type: "image/png",
        data: imageBase64,
      },
    })
  }

  let res: Response
  try {
    console.log("[desengine][gemini] start", {
      target: request.target ?? "default",
      model: config.model,
      imageCount: images.length,
      instructionLength: request.instruction.length,
      schemaName: request.schemaName,
      timeoutMs: runtime.timeoutMs,
    })

    res = await fetch(`${config.baseUrl}/${getGeminiModelPath(config.model)}:generateContent`, {
      method: "POST",
      signal: runtime.signal,
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": config.apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts,
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseJsonSchema: request.schema,
        },
      }),
    })
  } catch (error) {
    console.error("[desengine][gemini] network_error", {
      target: request.target ?? "default",
      model: config.model,
      durationMs: Date.now() - startedAt,
      message: error instanceof Error ? error.message : String(error),
    })
    mapFetchError(error, "Не удалось подключиться к Google Gemini API")
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
        : "Ошибка Google Gemini API"
    const errorKind = res.status === 401 || res.status === 403 ? "auth" : "provider"
    console.error("[desengine][gemini] provider_error", {
      target: request.target ?? "default",
      model: config.model,
      status: res.status,
      durationMs: Date.now() - startedAt,
      message: providerMessage,
    })
    throw new LlmError(errorKind, providerMessage)
  }

  console.log("[desengine][gemini] success", {
    target: request.target ?? "default",
    model: config.model,
    status: res.status,
    durationMs: Date.now() - startedAt,
  })

  return {
    provider: "gemini",
    model: config.model,
    outputText: getOutputTextFromGemini(data),
    metrics: getGeminiMetrics(data),
  }
}

const ADAPTERS: Record<LlmProvider, LlmAdapter> = {
  openai: {
    provider: "openai",
    label: "OpenAI",
    envVars: {
      apiKey: "OPENAI_API_KEY",
      model: "OPENAI_MODEL",
      baseUrl: "OPENAI_BASE_URL",
    },
    buildConfig: ensureOpenAIConfig,
    call: callOpenAI,
  },
  deepseek: {
    provider: "deepseek",
    label: "DeepSeek",
    envVars: {
      apiKey: "DEEPSEEK_API_KEY",
      model: "DEEPSEEK_MODEL",
      baseUrl: "DEEPSEEK_BASE_URL",
    },
    buildConfig: ensureDeepSeekConfig,
    call: callDeepSeek,
  },
  gemini: {
    provider: "gemini",
    label: "Google Gemini",
    envVars: {
      apiKey: "GEMINI_API_KEY",
      model: "GEMINI_MODEL",
      baseUrl: "GEMINI_BASE_URL",
    },
    buildConfig: ensureGeminiConfig,
    call: callGemini,
  },
}

function getActiveAdapter(): LlmAdapter {
  return ADAPTERS[getLlmProvider()]
}

function listConfiguredProviders(): LlmProvider[] {
  const configured: LlmProvider[] = []

  if (process.env.OPENAI_API_KEY?.trim() || process.env.OPENAI_MODEL?.trim()) {
    configured.push("openai")
  }

  if (process.env.DEEPSEEK_API_KEY?.trim() || process.env.DEEPSEEK_MODEL?.trim()) {
    configured.push("deepseek")
  }

  if (process.env.GEMINI_API_KEY?.trim() || process.env.GEMINI_MODEL?.trim()) {
    configured.push("gemini")
  }

  return configured
}

export async function runStructuredLlmRequest(request: LlmStructuredRequest): Promise<LlmStructuredResponse> {
  const adapter = getActiveAdapter()
  const config = adapter.buildConfig()
  const runtime = getLlmRequestRuntime(request.target)

  return adapter.call(request, config, runtime)
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
        : llmError.kind === "auth" || llmError.kind === "network" || llmError.kind === "invalid_response"
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

export async function getLlmStatus(): Promise<LlmStatus> {
  let adapter: LlmAdapter

  try {
    adapter = getActiveAdapter()
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Не удалось определить активный LLM-провайдер"

    return {
      provider: "openai",
      label: "LLM",
      ready: false,
      endpoint: "",
      config: {
        activeProvider: "openai",
        model: null,
        hasRequiredKey: false,
        missingEnvVars: ["LLM_PROVIDER"],
        configuredProviders: listConfiguredProviders(),
      },
      availability: {
        ok: false,
        message,
      },
    }
  }

  const configuredProviders = listConfiguredProviders()

  try {
    const config = adapter.buildConfig()
    return {
      provider: adapter.provider,
      label: adapter.label,
      ready: true,
      endpoint: config.baseUrl,
      config: {
        activeProvider: adapter.provider,
        model: config.model,
        hasRequiredKey: true,
        missingEnvVars: [],
        configuredProviders,
      },
      availability: {
        ok: true,
        message: `${adapter.label} настроен`,
      },
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : `Конфигурация ${adapter.label} некорректна`
    const missingEnvVars = [
      process.env[adapter.envVars.model]?.trim() ? null : adapter.envVars.model,
      process.env[adapter.envVars.apiKey]?.trim() ? null : adapter.envVars.apiKey,
      process.env[adapter.envVars.baseUrl]?.trim() ? null : adapter.envVars.baseUrl,
    ].filter((value): value is string => Boolean(value))

    return {
      provider: adapter.provider,
      label: adapter.label,
      ready: false,
      endpoint: process.env[adapter.envVars.baseUrl]?.trim() || "",
      config: {
        activeProvider: adapter.provider,
        model: process.env[adapter.envVars.model]?.trim() || null,
        hasRequiredKey: Boolean(process.env[adapter.envVars.apiKey]?.trim()),
        missingEnvVars,
        configuredProviders,
      },
      availability: {
        ok: false,
        message,
      },
    }
  }
}
