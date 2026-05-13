import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))

const ORIGINAL_ENV = { ...process.env }

function applyBaseEnv() {
  process.env.LLM_PROVIDER = "gemini"
  process.env.GEMINI_API_KEY = "test-gemini-key"
  process.env.GEMINI_MODEL = "gemini-2.5-flash"
  process.env.GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta"
}

describe("Google Gemini adapter", () => {
  beforeEach(() => {
    vi.resetModules()
    process.env = { ...ORIGINAL_ENV }
    applyBaseEnv()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    process.env = { ...ORIGINAL_ENV }
  })

  it("отправляет structured JSON-запрос с картинками в Gemini API", async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [{ text: '{"ok":true}' }],
              },
              finishReason: "STOP",
            },
          ],
          usageMetadata: {
            promptTokenCount: 11,
            candidatesTokenCount: 7,
            totalTokenCount: 18,
          },
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      )
    })
    vi.stubGlobal("fetch", fetchMock)

    const { runStructuredLlmRequest } = await import("../../lib/llm/llm.server")

    const result = await runStructuredLlmRequest({
      target: "init",
      instruction: "Верни JSON",
      imageBase64List: ["img-a", "img-b"],
      schemaName: "test_schema",
      schema: {
        type: "object",
        properties: {
          ok: { type: "boolean" },
        },
        required: ["ok"],
      },
    })

    expect(result.provider).toBe("gemini")
    expect(result.outputText).toBe('{"ok":true}')
    expect(result.metrics).toEqual({
      status: "available",
      inputTokens: 11,
      outputTokens: 7,
      totalTokens: 18,
      costUsd: null,
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent")
    expect(init.method).toBe("POST")
    expect(init.headers).toMatchObject({
      "content-type": "application/json",
      "x-goog-api-key": "test-gemini-key",
    })

    const body = JSON.parse(String(init.body))
    expect(body.generationConfig).toEqual({
      responseMimeType: "application/json",
      responseJsonSchema: {
        type: "object",
        properties: {
          ok: { type: "boolean" },
        },
        required: ["ok"],
      },
    })
    expect(body.contents).toEqual([
      {
        role: "user",
        parts: [
          { text: "Верни JSON" },
          { inline_data: { mime_type: "image/png", data: "img-a" } },
          { inline_data: { mime_type: "image/png", data: "img-b" } },
        ],
      },
    ])
    expect(init.signal).toBeInstanceOf(AbortSignal)
  })

  it("возвращает понятную ошибку при safety-блокировке Gemini", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response(
          JSON.stringify({
            promptFeedback: {
              blockReason: "SAFETY",
            },
          }),
          {
            status: 200,
            headers: { "content-type": "application/json" },
          },
        )
      }),
    )

    const { runStructuredLlmRequest, toLlmErrorResponse } = await import("../../lib/llm/llm.server")

    await expect(
      runStructuredLlmRequest({
        instruction: "Опасный запрос",
        schemaName: "blocked_schema",
        schema: { type: "object" },
      }),
    ).rejects.toThrow("Google Gemini заблокировал запрос по safety-фильтру")

    const error = await runStructuredLlmRequest({
      instruction: "Опасный запрос",
      schemaName: "blocked_schema",
      schema: { type: "object" },
    }).catch((caught) => caught)

    expect(toLlmErrorResponse(error)).toEqual({
      status: 500,
      body: {
        ok: false,
        error: "Google Gemini заблокировал запрос по safety-фильтру. Измените формулировку или изображение и повторите попытку.",
        errorKind: "provider",
      },
    })
  })

  it("показывает готовый статус Gemini при полном конфиге", async () => {
    const { getLlmStatus } = await import("../../lib/llm/llm.server")

    const status = await getLlmStatus()

    expect(status).toMatchObject({
      provider: "gemini",
      label: "Google Gemini",
      ready: true,
      endpoint: "https://generativelanguage.googleapis.com/v1beta",
      config: {
        activeProvider: "gemini",
        model: "gemini-2.5-flash",
        hasRequiredKey: true,
        missingEnvVars: [],
      },
      availability: {
        ok: true,
        message: "Google Gemini настроен",
      },
    })
    expect(status.config.configuredProviders).toContain("gemini")
  })

  it("не добавляет timeout signal для обычного запроса без target init", async () => {
    const fetchMock = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [{ text: '{"ok":true}' }],
              },
              finishReason: "STOP",
            },
          ],
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      )
    })
    vi.stubGlobal("fetch", fetchMock)

    const { runStructuredLlmRequest } = await import("../../lib/llm/llm.server")

    await runStructuredLlmRequest({
      instruction: "Обычный запрос",
      schemaName: "default_schema",
      schema: { type: "object" },
    })

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(init.signal).toBeUndefined()
  })

  it("использует отдельный timeout для initiator-запроса", async () => {
    process.env.LLM_INIT_TIMEOUT_MS = "1234"

    const fetchMock = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [{ text: '{"ok":true}' }],
              },
              finishReason: "STOP",
            },
          ],
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      )
    })
    vi.stubGlobal("fetch", fetchMock)

    const timeoutSpy = vi.spyOn(AbortSignal, "timeout")
    const { runStructuredLlmRequest } = await import("../../lib/llm/llm.server")

    await runStructuredLlmRequest({
      target: "init",
      instruction: "Инициирующий запрос",
      schemaName: "init_schema",
      schema: { type: "object" },
    })

    expect(timeoutSpy).toHaveBeenCalledWith(1234)

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(init.signal).toBeInstanceOf(AbortSignal)
  })

  it("возвращает retriable-ошибку при таймауте initiator-запроса", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        const error = new Error("Timed out")
        error.name = "TimeoutError"
        throw error
      }),
    )

    const { runStructuredLlmRequest, toLlmErrorResponse } = await import("../../lib/llm/llm.server")

    const error = await runStructuredLlmRequest({
      target: "init",
      instruction: "Инициирующий запрос",
      schemaName: "timeout_schema",
      schema: { type: "object" },
    }).catch((caught) => caught)

    expect(toLlmErrorResponse(error)).toEqual({
      status: 504,
      body: {
        ok: false,
        error: "LLM-провайдер не успел ответить вовремя. Повторите попытку.",
        errorKind: "timeout",
      },
    })
  })

  it("ругается на некорректный LLM_INIT_TIMEOUT_MS", async () => {
    process.env.LLM_INIT_TIMEOUT_MS = "abc"

    const { runStructuredLlmRequest, toLlmErrorResponse } = await import("../../lib/llm/llm.server")

    const error = await runStructuredLlmRequest({
      target: "init",
      instruction: "Инициирующий запрос",
      schemaName: "bad_timeout_schema",
      schema: { type: "object" },
    }).catch((caught) => caught)

    expect(toLlmErrorResponse(error)).toEqual({
      status: 400,
      body: {
        ok: false,
        error: "Переменная LLM_INIT_TIMEOUT_MS должна быть положительным числом миллисекунд",
        errorKind: "config",
      },
    })
  })

  it("требует явный GEMINI_BASE_URL для активного провайдера", async () => {
    process.env.GEMINI_BASE_URL = ""

    const { runStructuredLlmRequest, toLlmErrorResponse } = await import("../../lib/llm/llm.server")

    const error = await runStructuredLlmRequest({
      instruction: "Проверка конфига",
      schemaName: "missing_base_url_schema",
      schema: { type: "object" },
    }).catch((caught) => caught)

    expect(toLlmErrorResponse(error)).toEqual({
      status: 400,
      body: {
        ok: false,
        error: "Для режима Google Gemini не настроен GEMINI_BASE_URL",
        errorKind: "config",
      },
    })
  })
})
