/** URL страницы авторизации */
function getAuthUrl() {
  return "/auth"
}

/** URL endpoint'а подготовки проходной страницы авторизации */
function getAuthPrepareUrl(returnTo: string) {
  return `/api/auth/prepare?returnTo=${encodeURIComponent(returnTo)}`
}




function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1)
  }

  return pathname
}

// TODO Нужна вообще?
export function isProtectedPath(pathname: string) {
  const normalized = normalizePathname(pathname)
  return normalized != "/auth"
    && normalized != "/config"
}

export function sanitizeReturnPath(pathname: string | null | undefined) {
  if (!pathname || typeof pathname !== "string") {
    return null
  }

  if (!pathname.startsWith("/") || pathname.startsWith("//")) {
    return null
  }

  if (pathname.includes("?") || pathname.includes("#")) {
    return null
  }

  const normalized = normalizePathname(pathname)

  if (!isProtectedPath(normalized)) {
    return null
  }

  return normalized
}

export {
    getAuthUrl,
    getAuthPrepareUrl
}