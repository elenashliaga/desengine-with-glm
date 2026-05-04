export type LlmProvider = "openai" | "ollama"

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
  config: {
    model: string | null
    baseUrl: string | null
    timeoutMs: number | null
    hasOpenAIKey: boolean
  }
  availability: {
    ok: boolean
    message: string
  }
}
