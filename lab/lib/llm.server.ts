import "server-only"

import { appConfig } from "@/lib/config.server"
import type { LlmProvider, LlmStatus, LlmUsageMetrics } from "@/lib/llm.types"

type LlmStructuredRequest = {
  instruction: string
  imageBase64?: string
  imageBase64List?: string[]
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

function getLlmProvider(): LlmProvider {
  return "openai"
}

function getOpenAIModel(): string {
  return process.env.DESENGINE_OPENAI_MODEL || appConfig.llm.openai.defaultModel
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

function mapFetchError(error: unknown, fallbackMessage: string): never {
  if (error instanceof LlmError) {
    throw error
  }

  if (error instanceof Error && error.name === "TimeoutError") {
    throw new LlmError("timeout", "Таймаут при обращении к LLM-провайдеру")
  }

  throw new LlmError("network", fallbackMessage)
}

function ensureOpenAIConfig() {
  if (!process.env.OPENAI_API_KEY) {
    throw new LlmError("config", "Для режима OpenAI не настроен OPENAI_API_KEY")
  }

  return {
    provider: "openai" as const,
    model: getOpenAIModel(),
    apiKey: process.env.OPENAI_API_KEY,
  }
}

async function callOpenAI(request: LlmStructuredRequest): Promise<LlmStructuredResponse> {
  const config = ensureOpenAIConfig()
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
    console.error("[desengine][openai] provider_error", {
      target: request.target ?? "default",
      model: config.model,
      status: res.status,
      durationMs: Date.now() - startedAt,
      message: providerMessage,
    })
    throw new LlmError("provider", providerMessage)
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

export async function runStructuredLlmRequest(request: LlmStructuredRequest): Promise<LlmStructuredResponse> {
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

export async function getLlmStatus(): Promise<LlmStatus> {
  const provider = getLlmProvider()

  try {
    const config = ensureOpenAIConfig()
    return {
      provider,
      label: "OpenAI",
      ready: true,
      config: {
        model: config.model,
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
        hasOpenAIKey: Boolean(process.env.OPENAI_API_KEY),
      },
      availability: {
        ok: false,
        message,
      },
    }
  }
}
