import "server-only"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { checkAllowlistMarkerReachability } from "@/lib/auth/allowlist"
import localConfig from "../config/local.cjs"

import {
  ACCESS_COOKIE_NAME,
  createAccessSessionValue,
  createAllowlistMarker,
  getAccessControlConfig,
  normalizeEmail,
  type VerifiedAccessSession,
  verifyAccessSessionValue,
} from "@/lib/auth/control"
import { getTasksRootUrl } from "../task/navigation"
import { getAuthPrepareUrl, getAuthUrl, sanitizeReturnPath } from "./navigation"

const ACCESS_RETURN_PATH_COOKIE_NAME = "desengine-return-path"

type AccessSessionState = "valid" | "missing" | "expired"

localConfig.loadLocalConfig()

async function verifyAllowlistAccess(email: string): Promise<{
  ok: boolean
  reason?: "forbidden" | "technical" | "misconfigured"
  error?: string
  debug?: {
    markerUrl: string
    allowlistStatus?: number
  }
}> {
  const { baseUrl, salt, isConfigured } = getAccessControlConfig()

  if (!isConfigured) {
    return {
      ok: false,
      reason: "misconfigured",
      error: "Проверка доступа не настроена. Задайте ALLOWLIST_BASE_URL и ALLOWLIST_SALT в desengine.config.txt.",
    }
  }

  const normalizedEmail = normalizeEmail(email)
  const marker = await createAllowlistMarker(normalizedEmail, salt)
  const markerUrl = new URL(marker, `${baseUrl.replace(/\/+$/, "")}/`).toString()

  try {
    const response = await checkAllowlistMarkerReachability(markerUrl)

    if (response.status === 200) {
      return { ok: true }
    }

    if (response.status === 404) {
      return {
        ok: false,
        reason: "forbidden",
        error: "Этот email не входит в список допуска.",
        debug: {
          markerUrl,
          allowlistStatus: response.status,
        },
      }
    }

    return {
      ok: false,
      reason: "technical",
      error: "Не удалось проверить доступ. Сервер allowlist вернул неожиданный ответ.",
      debug: {
        markerUrl,
        allowlistStatus: response.status,
      },
    }
  } catch {
    return {
      ok: false,
      reason: "technical",
      error: "Не удалось проверить доступ. Проверьте сеть и доступность allowlist-хранилища.",
      debug: {
        markerUrl,
      },
    }
  }
}

async function getVerifiedAccessSession(): Promise<VerifiedAccessSession | null> {
  const { salt, isConfigured } = getAccessControlConfig()
  if (!isConfigured) return null

  const cookieStore = await cookies()
  const cookieValue = cookieStore.get(ACCESS_COOKIE_NAME)?.value

  return verifyAccessSessionValue(cookieValue, salt)
}

async function getAccessSessionState(): Promise<AccessSessionState> {
  const verification = await getVerifiedAccessSession()

  if (!verification) {
    return "missing"
  }

  if (verification.status === "expired") {
    return "expired"
  }

  return verification.status === "valid" ? "valid" : "missing"
}

async function hasAccessSession(): Promise<boolean> {
  return (await getAccessSessionState()) === "valid"
}

async function createAccessCookieValue(email: string): Promise<string> {
  const { salt } = getAccessControlConfig()
  return createAccessSessionValue(email, salt)
}

async function consumeReturnPathCookie() {
  const cookieStore = await cookies()
  const rawValue = cookieStore.get(ACCESS_RETURN_PATH_COOKIE_NAME)?.value
  const safePath = sanitizeReturnPath(rawValue)

  cookieStore.delete(ACCESS_RETURN_PATH_COOKIE_NAME)

  return safePath ?? getTasksRootUrl()
}

async function requireAccessOrRedirect(pathname: string) {
  if ((await getAccessSessionState()) === "valid") {
    return
  }

  const safePath = sanitizeReturnPath(pathname)
  redirect(safePath ? getAuthPrepareUrl(safePath) : getAuthUrl())
}

async function requireAccessOrUnauthorizedResponse() {
  if ((await getAccessSessionState()) === "valid") {
    return null
  }

  return Response.json(
    { ok: false, error: "Требуется авторизация" },
    { status: 401 },
  )
}

export {
  ACCESS_RETURN_PATH_COOKIE_NAME,
  consumeReturnPathCookie,
  createAccessCookieValue,
  getAccessSessionState,
  getAccessControlConfig,
  hasAccessSession,
  requireAccessOrRedirect,
  requireAccessOrUnauthorizedResponse,
  verifyAllowlistAccess,
}
