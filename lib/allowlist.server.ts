import "server-only"

export type AllowlistReachabilityResult = {
  ok: boolean
  status?: number
  message: string
}

type SystemStatusTone = "ready" | "warning" | "blocked"

export function summarizeAllowlistSystemStatus(status: number): {
  tone: SystemStatusTone
  summary: string
  detail: string
} {
  if (status === 200) {
    return {
      tone: "ready",
      summary: "Allowlist-хранилище доступно",
      detail: "Базовый URL allowlist-системы отвечает кодом 200.",
    }
  }

  if (status === 401 || status === 403) {
    return {
      tone: "warning",
      summary: "Allowlist-хранилище доступно, но запрос отклонён",
      detail: `Базовый URL allowlist-системы отвечает кодом ${status}. Проверьте публикацию и права доступа.`,
    }
  }

  if (status === 404) {
    return {
      tone: "warning",
      summary: "Базовый URL allowlist отвечает 404",
      detail:
        "Базовый URL allowlist-системы должен отдавать 200. Проверьте публикацию корневой точки или health-entry.",
    }
  }

  return {
    tone: "warning",
    summary: "Allowlist-хранилище отвечает нестандартно",
    detail: `Базовый URL allowlist-системы отвечает кодом ${status}. В штатной ситуации нужен ответ 200.`,
  }
}

async function fetchReachability(
  url: string,
  init?: RequestInit,
): Promise<AllowlistReachabilityResult> {
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

export async function checkAllowlistSystemReachability(url: string): Promise<AllowlistReachabilityResult> {
  const headResponse = await fetchReachability(url, {
    method: "HEAD",
  })

  if (headResponse.status === 200) {
    return headResponse
  }

  return fetchReachability(url, {
    method: "GET",
  })
}

export async function checkAllowlistMarkerReachability(url: string): Promise<AllowlistReachabilityResult> {
  const headResponse = await fetchReachability(url, {
    method: "HEAD",
  })

  if (headResponse.status === 200 || headResponse.status === 404) {
    return headResponse
  }

  return fetchReachability(url, {
    method: "GET",
  })
}
