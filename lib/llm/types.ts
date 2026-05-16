/**
 * Типы и схемы доменной сущности LLM
 */


/** Настройка LLM — в desengine.config.txt, параметр LLM_PROVIDER */
const LLM_PROVIDERS = [
  "openai",
  "deepseek",
  "gemini",
  "glm"
] as const

type LlmProvider =
  (typeof LLM_PROVIDERS)[number]


// TODO Refactoring
type LlmUsageMetrics =
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

// TODO Refactoring
type LlmCallRecord = {
  provider: LlmProvider
  model: string
  metrics: LlmUsageMetrics
}

// TODO Refactoring
type LlmStatus = {
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


// TODO Refactoring
type LlmStructuredRequest = {
  instruction: string
  imageBase64?: string
  imageBase64List?: string[]
  schemaName: string
  schema: Record<string, unknown>
  target?: "default" | "init" | "check"
}

// TODO Refactoring
type LlmStructuredResponse = {
  provider: LlmProvider
  model: string
  outputText: string
  metrics: LlmUsageMetrics
}

// TODO Refactoring
type ProviderRuntimeConfig = {
  provider: LlmProvider
  model: string
  apiKey: string
  baseUrl: string
}

// TODO Refactoring
type LlmRequestRuntime = {
  timeoutMs: number | null
  signal?: AbortSignal
}

// TODO Refactoring
type LlmAdapter = {
  provider: LlmProvider
  label: string
  envVars: {
    apiKey: string
    model: string
    baseUrl: string
  }
  buildConfig: () => ProviderRuntimeConfig
  call: (
    request: LlmStructuredRequest,
    config: ProviderRuntimeConfig,
    runtime: LlmRequestRuntime,
  ) => Promise<LlmStructuredResponse>
}



export type {
  LlmProvider,
  LlmUsageMetrics,
  LlmCallRecord,
  LlmStatus,
  LlmStructuredRequest,
  LlmStructuredResponse,
  ProviderRuntimeConfig,
  LlmRequestRuntime,
  LlmAdapter,
}
