export type LlmProvider = "openai" | "deepseek" | "gemini"

export type LlmUsageMetrics =
  | {
      status: "available"
      inputTokens: number | null
      outputTokens: number | null
      totalTokens: number | null
      costUsd: number | null
    }
  | {
      status: "unavailable"
      reason: "provider_did_not_return_metrics"
    }

export type LlmCallRecord = {
  provider: LlmProvider
  model: string
  metrics: LlmUsageMetrics
}

export type LlmStatus = {
  provider: LlmProvider
  label: string
  ready: boolean
  endpoint: string
  config: {
    activeProvider: LlmProvider
    model: string | null
    hasRequiredKey: boolean
    missingEnvVars: string[]
    configuredProviders: LlmProvider[]
  }
  availability: {
    ok: boolean
    message: string
  }
}
