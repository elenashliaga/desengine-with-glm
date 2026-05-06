import "server-only"

import { cookies } from "next/headers"
import localConfig from "@/lib/local-config.cjs"

import {
  ACCESS_COOKIE_NAME,
  createAccessSessionValue,
  createAllowlistMarker,
  getAccessControlConfig,
  normalizeEmail,
  verifyAccessSessionValue,
} from "@/lib/access-control"

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

export {
  createAccessCookieValue,
  getAccessControlConfig,
  hasAccessSession,
  verifyAllowlistAccess,
}
