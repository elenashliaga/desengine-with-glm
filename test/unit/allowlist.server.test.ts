// @openSpec capability: access-control
// @openSpec scenarios:
// @openSpec  - "Диагностика проверяет базовый URL allowlist-системы"
// @openSpec  - "Базовый URL allowlist-системы отвечает 404"
// @openSpec  - "Хранилище не подтверждает marker через HEAD, но отдаёт его через GET"
// @openSpec  - "HEAD возвращает 404, но GET подтверждает маркер"
// @openSpec  - "Проверка базового URL allowlist-системы не подменяется marker-check логикой"

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))

const ORIGINAL_ENV = { ...process.env }

describe("allowlist HTTP contracts", () => {
  beforeEach(() => {
    vi.resetModules()
    process.env = { ...ORIGINAL_ENV }
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    process.env = { ...ORIGINAL_ENV }
  })

  it("считает базовый URL allowlist готовым, если HEAD не работает, но GET отвечает 200", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(new Response("ok", { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)

    const { checkAllowlistSystemReachability } = await import("../../lib/auth/allowlist")

    const result = await checkAllowlistSystemReachability("https://example.com/allowlist/")

    expect(result.status).toBe(200)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: "HEAD" })
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({ method: "GET" })
  })

  it("не считает 404 штатным ответом базового URL allowlist", async () => {
    const { summarizeAllowlistSystemStatus } = await import("../../lib/auth/allowlist")

    expect(summarizeAllowlistSystemStatus(404)).toEqual({
      tone: "warning",
      summary: "Базовый URL allowlist отвечает 404",
      detail:
        "Базовый URL allowlist-системы должен отдавать 200. Проверьте публикацию корневой точки или health-entry.",
    })
  })

  it("перепроверяет marker-check через GET, если HEAD вернул 404", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
      .mockResolvedValueOnce(new Response(null, { status: 404 }))
    vi.stubGlobal("fetch", fetchMock)

    const { checkAllowlistMarkerReachability } = await import("../../lib/auth/allowlist")

    await expect(checkAllowlistMarkerReachability("https://example.com/allowlist/marker")).resolves.toMatchObject({
      ok: false,
      status: 404,
      message: "HTTP 404",
    })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: "HEAD" })
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({ method: "GET" })
  })

  it("повторяет marker-check через GET и принимает 200 как успешный ответ", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 405 }))
      .mockResolvedValueOnce(new Response("ok", { status: 200 }))
    vi.stubGlobal("fetch", fetchMock)

    const { checkAllowlistMarkerReachability } = await import("../../lib/auth/allowlist")

    await expect(checkAllowlistMarkerReachability("https://example.com/allowlist/marker")).resolves.toMatchObject({
      ok: true,
      status: 200,
      message: "HTTP 200",
    })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({ method: "HEAD" })
    expect(fetchMock.mock.calls[1]?.[1]).toMatchObject({ method: "GET" })
  })
})
