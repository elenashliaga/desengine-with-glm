import "server-only"

import type { LlmProvider, LlmStatus, LlmUsageMetrics } from "@/lib/llm.types"
import localConfig from "@/lib/local-config.cjs"

localConfig.loadLocalConfig()

type LlmStructuredRequest = {
  instruction: string
  imageBase64?: string
  imageBase64List?: string[]
  schemaName: string
  schema: Record<string, unknown>
  target?: "default" | "init" | "check"
}

type LlmStructuredResponse = {
  provider: LlmProvider
  model: string
  outputText: string
  metrics: LlmUsageMetrics
}

type ProviderRuntimeConfig = {
  provider: LlmProvider
  model: string
  apiKey: string
  baseUrl: string
}

type LlmAdapter = {
  provider: LlmProvider
  label: string
  envVars: {
    apiKey: string
    model: string
    baseUrl?: string
  }
  defaultBaseUrl: string
  buildConfig: () => ProviderRuntimeConfig
  call: (request: LlmStructuredRequest, config: ProviderRuntimeConfig) => Promise<LlmStructuredResponse>
}

class LlmError extends Error {
  kind: "config" | "auth" | "network" | "timeout" | "provider" | "invalid_response"

  constructor(kind: LlmError["kind"], message: string) {
    super(message)
    this.kind = kind
  }
}

function getLlmProvider(): LlmProvider {
  const rawProvider = process.env.DESENGINE_LLM_PROVIDER?.trim().toLowerCase()

  if (!rawProvider) {
    return "openai"
  }

  if (rawProvider === "openai" || rawProvider === "deepseek") {
    return rawProvider
  }

  throw new LlmError(
    "config",
    `Неподдерживаемый DESENGINE_LLM_PROVIDER: ${rawProvider}. Поддерживаются: openai, deepseek.`,
  )
}

function getOpenAIModel(): string {
  const model = process.env.DESENGINE_OPENAI_MODEL?.trim()

  if (!model) {
    throw new LlmError("config", "Для режима OpenAI не настроен DESENGINE_OPENAI_MODEL")
  }

  return model
}

function getDeepSeekModel(): string {
  const model = process.env.DESENGINE_DEEPSEEK_MODEL?.trim()

  if (!model) {
    throw new LlmError("config", "Для режима DeepSeek не настроен DESENGINE_DEEPSEEK_MODEL")
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

function mapFetchError(error: unknown, fallbackMessage: string): never {
  if (error instanceof LlmError) {
    throw error
  }

  if (error instanceof Error && error.name === "TimeoutError") {
    throw new LlmError("timeout", "Таймаут при обращении к LLM-провайдеру")
  }

  throw new LlmError("network", fallbackMessage)
}

function ensureOpenAIConfig(): ProviderRuntimeConfig {
  if (!process.env.OPENAI_API_KEY?.trim()) {
    throw new LlmError("config", "Для режима OpenAI не настроен OPENAI_API_KEY")
  }

  return {
    provider: "openai",
    model: getOpenAIModel(),
    apiKey: process.env.OPENAI_API_KEY,
    baseUrl: process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1",
  }
}

function ensureDeepSeekConfig(): ProviderRuntimeConfig {
  if (!process.env.DEEPSEEK_API_KEY?.trim()) {
    throw new LlmError("config", "Для режима DeepSeek не настроен DEEPSEEK_API_KEY")
  }

  return {
    provider: "deepseek",
    model: getDeepSeekModel(),
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseUrl: process.env.DESENGINE_DEEPSEEK_BASE_URL?.trim() || "https://api.deepseek.com",
  }
}

async function callOpenAI(
  request: LlmStructuredRequest,
  config: ProviderRuntimeConfig,
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
    })

    res = await fetch(`${config.baseUrl}/responses`, {
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

const ADAPTERS: Record<LlmProvider, LlmAdapter> = {
  openai: {
    provider: "openai",
    label: "OpenAI",
    envVars: {
      apiKey: "OPENAI_API_KEY",
      model: "DESENGINE_OPENAI_MODEL",
      baseUrl: "OPENAI_BASE_URL",
    },
    defaultBaseUrl: "https://api.openai.com/v1",
    buildConfig: ensureOpenAIConfig,
    call: callOpenAI,
  },
  deepseek: {
    provider: "deepseek",
    label: "DeepSeek",
    envVars: {
      apiKey: "DEEPSEEK_API_KEY",
      model: "DESENGINE_DEEPSEEK_MODEL",
      baseUrl: "DESENGINE_DEEPSEEK_BASE_URL",
    },
    defaultBaseUrl: "https://api.deepseek.com",
    buildConfig: ensureDeepSeekConfig,
    call: callDeepSeek,
  },
}

function getActiveAdapter(): LlmAdapter {
  return ADAPTERS[getLlmProvider()]
}

function listConfiguredProviders(): LlmProvider[] {
  const configured: LlmProvider[] = []

  if (process.env.OPENAI_API_KEY?.trim() || process.env.DESENGINE_OPENAI_MODEL?.trim()) {
    configured.push("openai")
  }

  if (process.env.DEEPSEEK_API_KEY?.trim() || process.env.DESENGINE_DEEPSEEK_MODEL?.trim()) {
    configured.push("deepseek")
  }

  return configured
}

export async function runStructuredLlmRequest(request: LlmStructuredRequest): Promise<LlmStructuredResponse> {
  const adapter = getActiveAdapter()
  const config = adapter.buildConfig()

  return adapter.call(request, config)
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
        missingEnvVars: ["DESENGINE_LLM_PROVIDER"],
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
    ].filter((value): value is string => Boolean(value))

    return {
      provider: adapter.provider,
      label: adapter.label,
      ready: false,
      endpoint: process.env[adapter.envVars.baseUrl ?? ""]?.trim() || adapter.defaultBaseUrl,
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
