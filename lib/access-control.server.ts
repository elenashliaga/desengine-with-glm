import "server-only"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import localConfig from "@/lib/local-config.cjs"

import {
  ACCESS_COOKIE_NAME,
  createAccessSessionValue,
  createAllowlistMarker,
  getAccessControlConfig,
  normalizeEmail,
  verifyAccessSessionValue,
} from "@/lib/access-control"
import { createAuthPath, createTasksPath, sanitizeReturnPath } from "@/lib/navigation"

const ACCESS_RETURN_PATH_COOKIE_NAME = "desengine-return-path"

localConfig.loadLocalConfig()

async function verifyAllowlistAccess(email: string): Promise<{
  ok: boolean
  reason?: "forbidden" | "technical" | "misconfigured"
  error?: string
}> {
  const { baseUrl, salt, isConfigured } = getAccessControlConfig()

  if (!isConfigured) {
    return {
      ok: false,
      reason: "misconfigured",
      error: "Проверка доступа не настроена. Задайте DESENGINE_ALLOWLIST_BASE_URL и DESENGINE_ALLOWLIST_SALT в config.txt.",
    }
  }

  const normalizedEmail = normalizeEmail(email)
  const marker = await createAllowlistMarker(normalizedEmail, salt)
  const markerUrl = new URL(marker, `${baseUrl.replace(/\/+$/, "")}/`).toString()

  try {
    let response = await fetch(markerUrl, {
      method: "HEAD",
      cache: "no-store",
    })

    if (response.status === 405 || response.status === 501) {
      response = await fetch(markerUrl, {
        method: "GET",
        cache: "no-store",
      })
    }

    if (response.status === 200) {
      return { ok: true }
    }

    if (response.status === 404) {
      return {
        ok: false,
        reason: "forbidden",
        error: "Этот email не входит в список допуска.",
      }
    }

    return {
      ok: false,
      reason: "technical",
      error: "Не удалось проверить доступ. Сервер allowlist вернул неожиданный ответ.",
    }
  } catch {
    return {
      ok: false,
      reason: "technical",
      error: "Не удалось проверить доступ. Проверьте сеть и доступность allowlist-хранилища.",
    }
  }
}

async function hasAccessSession(): Promise<boolean> {
  const { salt, isConfigured } = getAccessControlConfig()
  if (!isConfigured) return false

  const cookieStore = await cookies()
  const cookieValue = cookieStore.get(ACCESS_COOKIE_NAME)?.value

  return verifyAccessSessionValue(cookieValue, salt)
}

async function createAccessCookieValue(email: string): Promise<string> {
  const { salt } = getAccessControlConfig()
  return createAccessSessionValue(email, salt)
}

async function setReturnPathCookie(pathname: string) {
  const safePath = sanitizeReturnPath(pathname)
  const cookieStore = await cookies()

  if (!safePath) {
    cookieStore.delete(ACCESS_RETURN_PATH_COOKIE_NAME)
    return
  }

  cookieStore.set(ACCESS_RETURN_PATH_COOKIE_NAME, safePath, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  })
}

async function consumeReturnPathCookie() {
  const cookieStore = await cookies()
  const rawValue = cookieStore.get(ACCESS_RETURN_PATH_COOKIE_NAME)?.value
  const safePath = sanitizeReturnPath(rawValue)

  cookieStore.delete(ACCESS_RETURN_PATH_COOKIE_NAME)

  return safePath ?? createTasksPath()
}

async function requireAccessOrRedirect(pathname: string) {
  if (await hasAccessSession()) {
    return
  }

  await setReturnPathCookie(pathname)
  redirect(createAuthPath())
}

export {
  ACCESS_RETURN_PATH_COOKIE_NAME,
  consumeReturnPathCookie,
  createAccessCookieValue,
  getAccessControlConfig,
  hasAccessSession,
  requireAccessOrRedirect,
  setReturnPathCookie,
  verifyAllowlistAccess,
}
