import { cookies } from "next/headers"

import { ACCESS_COOKIE_NAME, isPlausibleEmail, normalizeEmail } from "@/lib/access-control"
import { createAccessCookieValue, verifyAllowlistAccess } from "@/lib/access-control.server"

type Body = {
  email?: string
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Body | null
  const normalizedEmail = normalizeEmail(String(body?.email || ""))

  if (!normalizedEmail || !isPlausibleEmail(normalizedEmail)) {
    return Response.json(
      { ok: false, error: "Введите корректный email." },
      { status: 400 },
    )
  }

  const result = await verifyAllowlistAccess(normalizedEmail)

  if (!result.ok) {
    const status =
      result.reason === "forbidden" ? 403 : result.reason === "misconfigured" ? 500 : 503

    return Response.json(
      { ok: false, error: result.error || "Доступ не разрешён." },
      { status },
    )
  }

  const cookieStore = await cookies()
  const cookieValue = await createAccessCookieValue(normalizedEmail)

  cookieStore.set(ACCESS_COOKIE_NAME, cookieValue, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  })

  return Response.json({ ok: true })
}
